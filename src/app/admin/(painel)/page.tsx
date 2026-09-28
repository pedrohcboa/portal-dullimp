import type { Metadata } from "next";
import Link from "next/link";
import { ListaLinks } from "@/components/admin/ListaLinks";
import { Alerta, classesBotao } from "@/components/admin/ui";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CATEGORIAS_PADRAO } from "@/lib/categorias";
import { COLUNAS_LINK, ordenarLinks } from "@/lib/data";
import type { Categoria, Link as ItemLink } from "@/lib/types";

export const metadata: Metadata = { title: "Links" };
export const revalidate = 0;

/** Lista de links do painel: rascunhos e publicados, com busca e filtros. */
export default async function PaginaLinks() {
  const supabase = await criarClienteServidor();

  const [{ data: links, error }, { data: categorias }] = await Promise.all([
    supabase.from("links").select(COLUNAS_LINK),
    supabase
      .from("categorias")
      .select("slug, nome, descricao, cor, icone, ordem")
      .order("ordem"),
  ]);

  const listaCategorias = (categorias ?? []) as Categoria[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-ink">Links</h1>
          <p className="mt-1 text-ink-muted">
            Cole os links de lives, artes, catálogos e produtos. O que estiver
            publicado aparece para os distribuidores na hora.
          </p>
        </div>
        <Link href="/admin/nova" className={classesBotao("primario")}>
          + Novo link
        </Link>
      </div>

      {error && (
        <div className="mt-6">
          <Alerta tom="erro">
            Não foi possível carregar os links: {error.message}
          </Alerta>
        </div>
      )}

      <div className="mt-8">
        <ListaLinks
          links={ordenarLinks((links ?? []) as ItemLink[])}
          categorias={listaCategorias.length ? listaCategorias : CATEGORIAS_PADRAO}
        />
      </div>
    </div>
  );
}
