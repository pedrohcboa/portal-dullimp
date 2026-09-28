"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alerta, Selo, classesBotao, classesEntrada } from "./ui";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { nomeCategoria } from "@/lib/categorias";
import { dominioDe, formatarDataCurta, normalizarBusca } from "@/lib/utils";
import type { Categoria, Link as ItemLink, StatusLink } from "@/lib/types";

/**
 * Lista de links com busca, filtros e as ações do dia a dia: **editar**,
 * **publicar / tirar do ar** num clique, **duplicar** (útil para criar o
 * próximo link a partir de um parecido) e **excluir** (confirmação em duas
 * etapas).
 */
export function ListaLinks({
  links,
  categorias,
}: {
  links: ItemLink[];
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();

  const [termo, setTermo] = useState("");
  const [status, setStatus] = useState<"todos" | StatusLink>("todos");
  const [categoria, setCategoria] = useState("todas");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tom: "erro" | "sucesso"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const filtrados = useMemo(() => {
    const busca = normalizarBusca(termo.trim());
    return links.filter((l) => {
      if (status !== "todos" && l.status !== status) return false;
      if (categoria !== "todas" && l.categoria !== categoria) return false;
      if (!busca) return true;
      return normalizarBusca(`${l.titulo} ${l.descricao} ${l.url}`).includes(busca);
    });
  }, [links, termo, status, categoria]);

  /** Roda uma ação no banco com mensagens e refresh padronizados. */
  async function executar(acao: () => PromiseLike<{ error: { message: string } | null }>, sucesso: string) {
    setOcupado(true);
    setMensagem(null);
    try {
      const { error } = await acao();
      if (error) throw new Error(error.message);
      setMensagem({ tom: "sucesso", texto: sucesso });
      iniciarTransicao(() => router.refresh());
      return true;
    } catch (e) {
      setMensagem({
        tom: "erro",
        texto: e instanceof Error ? `Não foi possível concluir: ${e.message}` : "Erro inesperado.",
      });
      return false;
    } finally {
      setOcupado(false);
    }
  }

  function alternarStatus(l: ItemLink) {
    const novo: StatusLink = l.status === "publicado" ? "rascunho" : "publicado";
    void executar(
      () => criarClienteNavegador().from("links").update({ status: novo }).eq("id", l.id),
      novo === "publicado"
        ? `“${l.titulo}” publicado.`
        : `“${l.titulo}” saiu do ar (virou rascunho).`,
    );
  }

  /** Copia o link como rascunho novo, com o título marcado. */
  async function duplicar(original: ItemLink) {
    setOcupado(true);
    setMensagem(null);
    try {
      const { data, error } = await criarClienteNavegador()
        .from("links")
        .insert({
          titulo: `${original.titulo} (cópia)`,
          url: original.url,
          categoria: original.categoria,
          descricao: original.descricao,
          thumb_url: original.thumb_url,
          ordem: original.ordem,
          status: "rascunho",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      iniciarTransicao(() => router.push(`/admin/editar/${data.id}`));
    } catch (e) {
      setMensagem({
        tom: "erro",
        texto: e instanceof Error ? `Não foi possível duplicar: ${e.message}` : "Erro inesperado.",
      });
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(id: string) {
    const ok = await executar(
      () => criarClienteNavegador().from("links").delete().eq("id", id),
      "Link excluído.",
    );
    if (ok) setConfirmandoExclusao(null);
  }

  return (
    <div>
      {mensagem && (
        <div className="mb-5">
          <Alerta tom={mensagem.tom}>{mensagem.texto}</Alerta>
        </div>
      )}

      {/* ---------- Filtros ---------- */}
      <div className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-3">
        <div>
          <label htmlFor="busca-admin" className="sr-only">
            Buscar links
          </label>
          <input
            id="busca-admin"
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar por título, descrição ou URL…"
            className={classesEntrada}
          />
        </div>
        <div>
          <label htmlFor="filtro-status" className="sr-only">
            Filtrar por status
          </label>
          <select
            id="filtro-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className={classesEntrada}
          >
            <option value="todos">Todos os status</option>
            <option value="publicado">Publicados</option>
            <option value="rascunho">Rascunhos</option>
          </select>
        </div>
        <div>
          <label htmlFor="filtro-categoria" className="sr-only">
            Filtrar por categoria
          </label>
          <select
            id="filtro-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={classesEntrada}
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------- Lista ---------- */}
      {filtrados.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line-strong bg-surface p-12 text-center">
          <p className="text-lg font-bold text-ink">
            {links.length === 0
              ? "Nenhum link cadastrado ainda"
              : "Nenhum link corresponde aos filtros"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            {links.length === 0
              ? "Clique em “Novo link” e cole o endereço de uma live, arte ou catálogo."
              : "Ajuste a busca, o status ou a categoria para ver mais resultados."}
          </p>
          {links.length === 0 && (
            <Link href="/admin/nova" className={classesBotao("primario", "mt-6")}>
              + Novo link
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtrados.map((l) => (
            <li key={l.id} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-64 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                    <Selo status={l.status} />
                    <span className="font-semibold">{nomeCategoria(l.categoria, categorias)}</span>
                    <span aria-hidden>·</span>
                    <span>{formatarDataCurta(l.data_publicacao)}</span>
                    <span aria-hidden>·</span>
                    <span>ordem {l.ordem}</span>
                  </div>

                  <h2 className="mt-2 text-lg leading-snug text-ink">
                    <Link href={`/admin/editar/${l.id}`} className="hover:text-brand-navy">
                      {l.titulo}
                    </Link>
                  </h2>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate font-mono text-xs text-brand-navy hover:underline"
                    title={l.url}
                  >
                    {dominioDe(l.url)} ↗
                  </a>
                  {l.descricao && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{l.descricao}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alternarStatus(l)}
                    disabled={ocupado || pendente}
                    className={classesBotao(l.status === "publicado" ? "fantasma" : "secundario", "px-3")}
                  >
                    {l.status === "publicado" ? "Tirar do ar" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicar(l)}
                    disabled={ocupado || pendente}
                    className={classesBotao("fantasma", "px-3")}
                  >
                    Duplicar
                  </button>
                  <Link href={`/admin/editar/${l.id}`} className={classesBotao("secundario", "px-3")}>
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(l.id)}
                    disabled={ocupado || pendente}
                    className={classesBotao("perigo", "px-3")}
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {/* Confirmação em duas etapas: excluir é irreversível. */}
              {confirmandoExclusao === l.id && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">
                    Excluir “{l.titulo}” definitivamente? Os cliques já
                    registrados continuam contando por categoria nas métricas.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => excluir(l.id)}
                      disabled={ocupado}
                      className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"
                    >
                      {ocupado ? "Excluindo…" : "Sim, excluir"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoExclusao(null)}
                      className={classesBotao("fantasma")}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
