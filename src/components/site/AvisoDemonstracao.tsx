/**
 * Faixa exibida quando o portal está rodando com o conteúdo de exemplo — ou
 * seja, sem conexão com o Supabase (e, portanto, sem login). Deixa explícito
 * para quem estiver avaliando o projeto que aqueles links são placeholders.
 */
export function AvisoDemonstracao() {
  return (
    <div className="border-b border-brand-terracotta/40 bg-brand-terracotta-soft">
      <p className="mx-auto max-w-6xl px-4 py-2.5 text-center text-sm font-semibold text-brand-navy-deep sm:px-6">
        Modo demonstração: exibindo links de exemplo, sem login. Configure as
        variáveis do Supabase em <code className="font-mono">.env.local</code>{" "}
        para usar o conteúdo real e fechar o portal.
      </p>
    </div>
  );
}
