import { aparenciaCategoria } from "@/lib/categorias";
import type { Categoria } from "@/lib/types";
import { LinkRastreado } from "./LinkRastreado";
import { IconeCategoria, IconeSeta } from "@/components/ui/Icones";

/**
 * Cards das categorias com a contagem real de links publicados.
 * Cada clique é registrado como `categoria_card` junto com a categoria.
 */
export function GradeCategorias({
  categorias,
  contagem,
}: {
  categorias: Categoria[];
  contagem: Record<string, number>;
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {categorias.map((categoria) => {
        const total = contagem[categoria.slug] ?? 0;
        const aparencia = aparenciaCategoria(categoria);

        return (
          <li key={categoria.slug}>
            <LinkRastreado
              href={`/categorias/${categoria.slug}`}
              alvo="categoria_card"
              categoria={categoria.slug}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-navy/30 hover:shadow-card-hover"
            >
              {/* Faixa com a cor da categoria no topo do card. */}
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${aparencia.barra}`} />

              <span
                className={`inline-flex size-12 items-center justify-center rounded-xl ${aparencia.capa}`}
              >
                <IconeCategoria
                  icone={categoria.icone}
                  className={`size-6 ${aparencia.sobreCapa}`}
                />
              </span>

              <h3 className="mt-5 text-xl text-ink group-hover:text-brand-navy">
                {categoria.nome}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {categoria.descricao}
              </p>

              <span className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-navy">
                {total === 0
                  ? "Nenhum material ainda"
                  : `${total} ${total === 1 ? "material" : "materiais"}`}
                <IconeSeta className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </LinkRastreado>
          </li>
        );
      })}
    </ul>
  );
}
