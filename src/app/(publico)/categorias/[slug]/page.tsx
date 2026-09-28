import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Catalogo } from "@/components/site/Catalogo";
import { AvisoDemonstracao } from "@/components/site/AvisoDemonstracao";
import { IconeCategoria } from "@/components/ui/Icones";
import { aparenciaCategoria } from "@/lib/categorias";
import { listarCategorias, listarLinks } from "@/lib/data";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: PageProps<"/categorias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const categoria = (await listarCategorias()).find((c) => c.slug === slug);
  if (!categoria) return { title: "Categoria não encontrada" };
  return { title: categoria.nome, description: categoria.descricao };
}

export default async function PaginaCategoria({
  params,
}: PageProps<"/categorias/[slug]">) {
  const { slug } = await params;

  const [categorias, { links, exemplo }] = await Promise.all([
    listarCategorias(),
    listarLinks(),
  ]);

  const categoria = categorias.find((c) => c.slug === slug);
  if (!categoria) notFound();

  const daCategoria = links.filter((l) => l.categoria === slug);
  const aparencia = aparenciaCategoria(categoria);

  return (
    <>
      {exemplo && <AvisoDemonstracao />}

      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <nav aria-label="Trilha de navegação" className="text-sm">
            <Link href="/" className="font-semibold text-brand-navy hover:underline">
              Início
            </Link>
            <span className="mx-2 text-ink-faint" aria-hidden>
              /
            </span>
            <span className="text-ink-muted">{categoria.nome}</span>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <span
              className={`inline-flex size-14 shrink-0 items-center justify-center rounded-2xl ${aparencia.capa}`}
            >
              <IconeCategoria
                icone={categoria.icone}
                className={`size-7 ${aparencia.sobreCapa}`}
              />
            </span>
            <h1 className="text-4xl text-ink sm:text-5xl">{categoria.nome}</h1>
          </div>

          <p className="mt-4 max-w-2xl text-lg text-ink-muted">
            {categoria.descricao}
          </p>
          <p className="mt-3 text-sm font-semibold text-ink-faint">
            {daCategoria.length}{" "}
            {daCategoria.length === 1 ? "material publicado" : "materiais publicados"}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Dentro da categoria, o filtro seria redundante — fica só a busca. */}
        <Catalogo
          links={daCategoria}
          categorias={categorias}
          categoriaInicial={slug}
          mostrarFiltros={false}
        />
      </div>
    </>
  );
}
