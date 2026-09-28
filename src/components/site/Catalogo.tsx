"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LinkCard } from "./LinkCard";
import { IconeBusca, IconeFechar } from "@/components/ui/Icones";
import { eventos } from "@/lib/analytics";
import { cn, dominioDe, normalizarBusca } from "@/lib/utils";
import type { Categoria, Link as ItemLink } from "@/lib/types";

/**
 * Catálogo de links: busca em tempo real + filtro por categoria + "carregar
 * mais". Tudo acontece no cliente sobre a lista já publicada (o volume de
 * links do portal é pequeno, então filtrar em memória é mais rápido e mais
 * simples do que ida e volta ao servidor).
 */

const POR_PAGINA = 12;
/** Espera antes de registrar a busca — evita um evento por tecla digitada. */
const ATRASO_EVENTO_BUSCA = 900;

export function Catalogo({
  links,
  categorias,
  categoriaInicial = "todas",
  mostrarFiltros = true,
}: {
  links: ItemLink[];
  categorias: Categoria[];
  categoriaInicial?: string;
  mostrarFiltros?: boolean;
}) {
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [visiveis, setVisiveis] = useState(POR_PAGINA);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Registra o termo buscado só depois que o usuário para de digitar.
  useEffect(() => {
    if (!termo.trim()) return;
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(
      () => eventos.busca(termo.trim()),
      ATRASO_EVENTO_BUSCA,
    );
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [termo]);

  const filtrados = useMemo(() => {
    const busca = normalizarBusca(termo.trim());

    return links.filter((l) => {
      if (categoria !== "todas" && l.categoria !== categoria) return false;
      if (!busca) return true;

      // A busca cobre título, descrição e o site de destino ("youtube", "drive").
      const alvo = normalizarBusca(`${l.titulo} ${l.descricao} ${dominioDe(l.url)}`);
      return busca.split(/\s+/).every((parte) => alvo.includes(parte));
    });
  }, [links, termo, categoria]);

  // Buscar ou filtrar volta a listagem para a primeira "página".
  function trocarTermo(valor: string) {
    setTermo(valor);
    setVisiveis(POR_PAGINA);
  }

  function trocarCategoria(slug: string) {
    setCategoria(slug);
    setVisiveis(POR_PAGINA);
    eventos.filtroCategoria(slug);
  }

  const listados = filtrados.slice(0, visiveis);
  const restantes = filtrados.length - listados.length;

  return (
    <div>
      {/* ---------- Busca ---------- */}
      <div id="busca" className="scroll-mt-28">
        <label htmlFor="campo-busca" className="sr-only">
          Buscar materiais por título, descrição ou site
        </label>
        <div className="relative">
          <IconeBusca className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-faint" />
          <input
            id="campo-busca"
            type="search"
            value={termo}
            onChange={(e) => trocarTermo(e.target.value)}
            placeholder="Buscar material… (ex.: catálogo, live, stories)"
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-surface py-3.5 pr-12 pl-12 text-base text-ink shadow-card outline-none placeholder:text-ink-faint focus:border-brand-navy"
          />
          {termo && (
            <button
              type="button"
              onClick={() => trocarTermo("")}
              className="absolute top-1/2 right-3 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint hover:bg-canvas hover:text-ink"
            >
              <span className="sr-only">Limpar busca</span>
              <IconeFechar className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* ---------- Filtro por categoria ---------- */}
      {mostrarFiltros && (
        <div className="mt-5">
          <h3 className="sr-only">Filtrar por categoria</h3>
          <div className="flex flex-wrap gap-2">
            <BotaoFiltro
              ativo={categoria === "todas"}
              onClick={() => trocarCategoria("todas")}
            >
              Todas
            </BotaoFiltro>
            {categorias.map((c) => (
              <BotaoFiltro
                key={c.slug}
                ativo={categoria === c.slug}
                onClick={() => trocarCategoria(c.slug)}
              >
                {c.nome}
              </BotaoFiltro>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Resultado ---------- */}
      <p aria-live="polite" className="mt-6 text-sm font-medium text-ink-muted">
        {filtrados.length === 0
          ? "Nenhum material encontrado"
          : `${filtrados.length} ${filtrados.length === 1 ? "material" : "materiais"}`}
      </p>

      {filtrados.length === 0 ? (
        <EstadoVazio
          termo={termo}
          aoLimpar={() => {
            trocarTermo("");
            setCategoria(categoriaInicial);
          }}
        />
      ) : (
        <>
          <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listados.map((l) => (
              <li key={l.id}>
                <LinkCard link={l} categorias={categorias} />
              </li>
            ))}
          </ul>

          {restantes > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setVisiveis((v) => v + POR_PAGINA);
                  eventos.clique("catalogo_carregar_mais");
                }}
                className="rounded-lg border-2 border-brand-navy px-6 py-3 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-navy hover:text-white"
              >
                Carregar mais ({restantes})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BotaoFiltro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        ativo
          ? "border-brand-navy bg-brand-navy text-white"
          : "border-line bg-surface text-ink-muted hover:border-brand-navy/40 hover:text-brand-navy",
      )}
    >
      {children}
    </button>
  );
}

function EstadoVazio({
  termo,
  aoLimpar,
}: {
  termo: string;
  aoLimpar: () => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center">
      <IconeBusca className="mx-auto size-10 text-ink-faint" />
      <p className="mt-4 text-lg font-bold text-ink">
        Nada encontrado{termo ? ` para “${termo}”` : ""}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        Tente outro termo ou remova o filtro de categoria. Se o material ainda
        não foi publicado, ele aparece aqui assim que a Dullimp liberar.
      </p>
      <button
        type="button"
        onClick={aoLimpar}
        className="mt-6 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-navy-deep"
      >
        Limpar filtros
      </button>
    </div>
  );
}
