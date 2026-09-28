import { aparenciaCategoria } from "@/lib/categorias";
import { cn, dominioDe, miniaturaDoLink } from "@/lib/utils";
import type { Categoria, Link as ItemLink } from "@/lib/types";
import { ChipCategoria } from "./ChipCategoria";
import { LinkExternoRastreado } from "./LinkRastreado";
import { IconeCategoria, IconeExterno } from "@/components/ui/Icones";

/**
 * Card de link: miniatura, categoria, título, descrição e o site de destino.
 *
 * Não existe página interna de leitura — o card inteiro leva direto à URL
 * externa, em nova aba, e registra um `click` com o `link_id`. O link do
 * título cobre o card via `after:`, então há **um** link só para leitores de
 * tela.
 *
 * `previa` desenha o mesmo card sem link nem rastreamento (formulário do
 * painel).
 */
export function LinkCard({
  link,
  categorias,
  alvo = "link_card",
  previa = false,
}: {
  link: Pick<ItemLink, "id" | "titulo" | "url" | "categoria" | "descricao" | "thumb_url">;
  categorias: Categoria[];
  /** Nome do clique no relatório (`link_card`, `link_destaque`). */
  alvo?: string;
  previa?: boolean;
}) {
  const categoria = categorias.find((c) => c.slug === link.categoria);
  const aparencia = aparenciaCategoria(categoria);
  const miniatura = miniaturaDoLink(link);
  const dominio = dominioDe(link.url);

  const titulo = link.titulo || "Título do link";
  const classesTitulo =
    "after:absolute after:inset-0 after:content-[''] group-hover:text-brand-navy";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-200 focus-within:-translate-y-0.5 hover:-translate-y-0.5 hover:border-brand-navy/30 hover:shadow-card-hover">
      {/* Miniatura colada pelo gestor, capa do YouTube ou cor da categoria. */}
      <div className={cn("relative aspect-video shrink-0 overflow-hidden", aparencia.capa)}>
        {miniatura ? (
          // Miniaturas vêm de qualquer host (YouTube, Drive, Canva...), então
          // não passam pelo otimizador do next/image, que exige allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={miniatura}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <IconeCategoria
            icone={categoria?.icone ?? "estrela"}
            className={`absolute right-4 bottom-4 size-14 ${aparencia.marcaDagua}`}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <ChipCategoria
          cor={categoria?.cor ?? "cinza"}
          nome={categoria?.nome ?? link.categoria}
          className="self-start"
        />

        <h3 className="mt-3 text-lg leading-snug text-ink">
          {previa ? (
            <span>{titulo}</span>
          ) : (
            <LinkExternoRastreado
              href={link.url}
              alvo={alvo}
              linkId={link.id}
              categoria={link.categoria}
              className={classesTitulo}
            >
              {titulo}
              <span className="sr-only"> (abre em nova aba)</span>
            </LinkExternoRastreado>
          )}
        </h3>

        {link.descricao && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
            {link.descricao}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-5 text-xs font-medium text-ink-faint">
          <span className="truncate">{dominio || "link externo"}</span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold text-brand-terracotta-deep">
            Abrir
            <IconeExterno className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
