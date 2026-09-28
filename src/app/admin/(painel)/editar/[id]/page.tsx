import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioLink } from "@/components/admin/FormularioLink";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CATEGORIAS_PADRAO } from "@/lib/categorias";
import { COLUNAS_LINK } from "@/lib/data";
import type { Categoria, Link as ItemLink } from "@/lib/types";

export const metadata: Metadata = { title: "Editar link" };
export const revalidate = 0;

export default async function PaginaEditarLink({
  params,
}: PageProps<"/admin/editar/[id]">) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const [{ data: link }, { data: categorias }] = await Promise.all([
    supabase.from("links").select(COLUNAS_LINK).eq("id", id).maybeSingle(),
    supabase
      .from("categorias")
      .select("slug, nome, descricao, cor, icone, ordem")
      .order("ordem"),
  ]);

  if (!link) notFound();

  const lista = (categorias as Categoria[] | null) ?? [];

  return (
    <FormularioLink
      link={link as ItemLink}
      categorias={lista.length ? lista : CATEGORIAS_PADRAO}
    />
  );
}
