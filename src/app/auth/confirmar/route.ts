import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/server";
import { destinoSeguro } from "@/lib/utils";

/**
 * Volta do link de confirmação de e-mail do cadastro.
 *
 * Aceita os dois formatos que o Supabase pode mandar:
 *  - `?code=...` — o padrão (PKCE), quando o template de e-mail usa
 *    `{{ .ConfirmationURL }}`. Só funciona no mesmo navegador em que a
 *    pessoa se cadastrou;
 *  - `?token_hash=...&type=email` — recomendado no README (template
 *    customizado): funciona mesmo abrindo o e-mail no celular depois de se
 *    cadastrar no computador.
 *
 * Com sessão criada, segue para o portal. Se a troca falhar no formato
 * `code`, o e-mail já foi confirmado do lado do Supabase — então mandamos
 * para o login com um aviso, em vez de um erro.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const proximo = destinoSeguro(searchParams.get("proximo"), "/");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  const supabase = await criarClienteServidor();

  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    if (!error) {
      const destino = tipo === "recovery" ? "/nova-senha" : proximo;
      return NextResponse.redirect(new URL(destino, origin));
    }
    return NextResponse.redirect(new URL("/entrar?aviso=link-invalido", origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(proximo, origin));
    return NextResponse.redirect(new URL("/entrar?aviso=confirmado", origin));
  }

  return NextResponse.redirect(new URL("/entrar?aviso=link-invalido", origin));
}
