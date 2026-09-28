import type { Metadata } from "next";
import { GestaoDistribuidores } from "@/components/admin/GestaoDistribuidores";
import { Alerta } from "@/components/admin/ui";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Distribuidor } from "@/lib/types";

export const metadata: Metadata = { title: "Distribuidores" };
export const revalidate = 0;

/**
 * "Quem entra": a allowlist `distribuidores_autorizados`.
 *
 * Estar aqui é o que libera (1) o cadastro em `/cadastro`, pelo hook
 * `hook_restringir_signup`, e (2) a leitura do conteúdo, pela RLS
 * (`eh_distribuidor()`). Remover um e-mail corta o acesso na hora, mesmo de
 * quem já tinha conta.
 */
export default async function PaginaDistribuidores() {
  const supabase = await criarClienteServidor();

  const { data, error, count } = await supabase
    .from("distribuidores_autorizados")
    .select("email, nome, cnpj, created_at", { count: "exact" })
    .order("email")
    .range(0, 4999);

  const distribuidores = (data ?? []) as Distribuidor[];

  return (
    <div>
      <div>
        <h1 className="text-3xl text-ink">Distribuidores</h1>
        <p className="mt-1 max-w-2xl text-ink-muted">
          Os e-mails liberados para criar conta e ver o portal. Quem não está
          nesta lista não consegue se cadastrar — e, se já tiver conta, deixa
          de ver o conteúdo assim que for removido.
        </p>
      </div>

      {error && (
        <div className="mt-6">
          <Alerta tom="erro">
            Não foi possível carregar os distribuidores: {error.message}
          </Alerta>
        </div>
      )}

      {count !== null && count > distribuidores.length && (
        <div className="mt-6">
          <Alerta tom="aviso">
            Mostrando {distribuidores.length} de {count} e-mails. Use a busca
            para encontrar um específico.
          </Alerta>
        </div>
      )}

      <div className="mt-8">
        <GestaoDistribuidores distribuidores={distribuidores} total={count ?? distribuidores.length} />
      </div>
    </div>
  );
}
