import type { Metadata } from "next";
import { FormularioLink } from "@/components/admin/FormularioLink";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CATEGORIAS_PADRAO } from "@/lib/categorias";
import type { Categoria } from "@/lib/types";

export const metadata: Metadata = { title: "Novo link" };
export const revalidate = 0;

export default async function PaginaNovoLink({
  searchParams,
}: PageProps<"/admin/nova">) {
  const parametros = await searchParams;
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("categorias")
    .select("slug, nome, descricao, cor, icone, ordem")
    .order("ordem");

  const categorias = (data as Categoria[] | null) ?? [];
  // `/admin/nova?categoria=produtos` já abre com a categoria escolhida.
  const categoriaInicial =
    typeof parametros.categoria === "string" ? parametros.categoria : undefined;

  return (
    <FormularioLink
      categorias={categorias.length ? categorias : CATEGORIAS_PADRAO}
      categoriaInicial={categoriaInicial}
    />
  );
}
