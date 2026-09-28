import type { Metadata } from "next";
import { GestaoCategorias } from "@/components/admin/GestaoCategorias";
import { Alerta } from "@/components/admin/ui";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Categoria } from "@/lib/types";

export const metadata: Metadata = { title: "Categorias" };
export const revalidate = 0;

/**
 * Gestão das categorias do portal.
 *
 * Existe para que a Dullimp crie e ajuste categorias sem depender de deploy.
 * A permissão vem da RLS (`categorias_gestao_editor`); esta tela é só a
 * interface. A contagem de links por categoria é carregada junto porque
 * decide se o botão de excluir fica disponível — o banco recusa apagar uma
 * categoria que ainda tem link apontando para ela.
 */
export default async function PaginaCategorias() {
  const supabase = await criarClienteServidor();

  const [{ data: categorias, error }, { data: links }] = await Promise.all([
    supabase
      .from("categorias")
      .select("slug, nome, descricao, cor, icone, ordem")
      .order("ordem"),
    supabase.from("links").select("categoria"),
  ]);

  const contagem: Record<string, number> = {};
  for (const { categoria } of (links ?? []) as { categoria: string }[]) {
    contagem[categoria] = (contagem[categoria] ?? 0) + 1;
  }

  return (
    <div>
      <div>
        <h1 className="text-3xl text-ink">Categorias</h1>
        <p className="mt-1 max-w-2xl text-ink-muted">
          As categorias que organizam os links no portal. Criar uma aqui já a
          faz aparecer no menu e na home dos distribuidores — sem precisar de
          programador.
        </p>
      </div>

      {error && (
        <div className="mt-6">
          <Alerta tom="erro">
            Não foi possível carregar as categorias: {error.message}
          </Alerta>
        </div>
      )}

      <div className="mt-8">
        <GestaoCategorias
          categorias={(categorias ?? []) as Categoria[]}
          contagem={contagem}
        />
      </div>
    </div>
  );
}
