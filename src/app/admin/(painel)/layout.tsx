import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { BotaoSair } from "@/components/auth/BotaoSair";
import { MolduraAutenticacao } from "@/components/auth/MolduraAutenticacao";
import { NavegacaoPainel } from "@/components/admin/NavegacaoPainel";
import { Alerta } from "@/components/admin/ui";
import { criarClienteServidor } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { AREAS } from "@/lib/areas";

/**
 * Área protegida do painel (página "Administrador").
 *
 * Duas camadas de proteção, de propósito:
 *  - o proxy barra quem não tem sessão antes da renderização;
 *  - este layout confirma a sessão no servidor **e** exige que o usuário
 *    esteja na allowlist `public.editores`.
 *
 * Estar apenas autenticado — inclusive como distribuidor — não dá direito de
 * publicar.
 */
export default async function LayoutPainel({ children }: LayoutProps<"/admin">) {
  const selo = AREAS.admin.selo;

  if (!SUPABASE_CONFIGURADO) {
    return (
      <MolduraAutenticacao
        selo={selo}
        titulo="Backend não configurado"
        descricao="O painel precisa das credenciais do Supabase para funcionar."
      >
        <Alerta tom="aviso">
          Preencha <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no
          arquivo <code className="font-mono">.env.local</code> e reinicie o
          servidor.
        </Alerta>
      </MolduraAutenticacao>
    );
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(AREAS.admin.login);

  // Confere a allowlist. Na primeira vez (tabela vazia) o usuário logado é
  // promovido automaticamente a gestor — ver `reivindicar_primeiro_editor`.
  let { data: editor } = await supabase
    .from("editores")
    .select("user_id, nome, papel")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!editor) {
    await supabase.rpc("reivindicar_primeiro_editor");
    ({ data: editor } = await supabase
      .from("editores")
      .select("user_id, nome, papel")
      .eq("user_id", user.id)
      .maybeSingle());
  }

  if (!editor) {
    return (
      <MolduraAutenticacao
        selo={selo}
        titulo="Sem permissão de administrador"
        descricao="Sua conta existe, mas não está liberada para administrar o Portal Dullimp."
        voltar={{ href: "/", rotulo: "Ir para o portal" }}
        rodape={<BotaoSair area="admin" />}
      >
        <Alerta tom="aviso">
          Peça a um gestor atual para liberar seu acesso adicionando sua conta
          (<strong>{user.email}</strong>) à tabela{" "}
          <code className="font-mono">editores</code> no Supabase.
        </Alerta>
      </MolduraAutenticacao>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
          <Link href="/admin" className="rounded-md" aria-label="Administrador — início">
            <Wordmark tamanho="sm" />
          </Link>
          <span className="rounded-full bg-brand-navy-soft px-2.5 py-1 text-[0.6875rem] font-bold tracking-wide text-brand-navy-deep uppercase">
            Administrador
          </span>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-sm font-semibold text-brand-navy hover:underline"
            >
              Ver portal
            </Link>
            <span
              className="hidden text-sm text-ink-faint sm:inline"
              title={user.email ?? undefined}
            >
              {user.email}
            </span>
            <BotaoSair area="admin" compacto />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <NavegacaoPainel />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
