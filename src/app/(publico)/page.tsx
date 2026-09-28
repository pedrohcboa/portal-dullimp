import { Hero } from "@/components/site/Hero";
import { GradeCategorias } from "@/components/site/GradeCategorias";
import { LinkCard } from "@/components/site/LinkCard";
import { Catalogo } from "@/components/site/Catalogo";
import { AvisoDemonstracao } from "@/components/site/AvisoDemonstracao";
import { contarPorCategoria, listarCategorias, listarLinks, maisRecentes } from "@/lib/data";

/** A home reflete o banco a cada requisição — publicar aparece na hora. */
export const revalidate = 0;

const QUANTIDADE_DESTAQUES = 3;

export default async function Home() {
  const [{ links, exemplo }, categorias] = await Promise.all([
    listarLinks(),
    listarCategorias(),
  ]);

  const contagem = contarPorCategoria(links);
  const destaques = maisRecentes(links, QUANTIDADE_DESTAQUES);

  return (
    <>
      {exemplo && <AvisoDemonstracao />}

      <Hero />

      {/* ---------------- Categorias ---------------- */}
      <section
        id="categorias"
        aria-labelledby="titulo-categorias"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-14 sm:px-6"
      >
        <h2 id="titulo-categorias" className="text-3xl text-ink">
          Categorias
        </h2>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Escolha por onde começar.
        </p>
        <div className="mt-8">
          <GradeCategorias categorias={categorias} contagem={contagem} />
        </div>
      </section>

      {/* ---------------- Destaques: o que entrou por último ---------------- */}
      {destaques.length > 0 && (
        <section
          id="novidades"
          aria-labelledby="titulo-novidades"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6"
        >
          <h2 id="titulo-novidades" className="text-3xl text-ink">
            Novidades
          </h2>
          <p className="mt-2 text-ink-muted">
            Os materiais publicados mais recentemente pela Dullimp.
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((l) => (
              <li key={l.id}>
                <LinkCard link={l} categorias={categorias} alvo="link_destaque" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------- Todos os materiais, com busca ---------------- */}
      <section
        id="todos"
        aria-labelledby="titulo-todos"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6"
      >
        <h2 id="titulo-todos" className="text-3xl text-ink">
          Todos os materiais
        </h2>
        <p className="mt-2 mb-6 text-ink-muted">
          Busque pelo nome ou filtre por categoria.
        </p>
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center">
            <p className="text-lg font-bold text-ink">Nenhum material publicado ainda</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              Assim que a Dullimp publicar o primeiro link, ele aparece aqui.
            </p>
          </div>
        ) : (
          <Catalogo links={links} categorias={categorias} />
        )}
      </section>
    </>
  );
}
