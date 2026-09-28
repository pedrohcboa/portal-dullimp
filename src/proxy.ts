import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURADO, SUPABASE_URL } from "@/lib/supabase/config";
import {
  AREAS,
  ROTAS_LIVRES_ADMIN,
  ROTAS_LIVRES_DISTRIBUIDOR,
  casaRota,
} from "@/lib/areas";

/**
 * Proxy (antigo middleware) de sessão do portal inteiro.
 *
 * Três responsabilidades:
 *  1. renovar o token do Supabase e reescrever os cookies em toda requisição
 *     (Server Components não podem gravar cookies);
 *  2. barrar quem não está logado antes mesmo da página renderizar — tanto na
 *     área do distribuidor (vai para `/entrar`) quanto no painel (vai para
 *     `/admin/login`), guardando o destino em `?proximo=`;
 *  3. tirar das telas de login quem já está logado.
 *
 * É a primeira barreira, não a última: o layout de cada área confere a
 * allowlist no servidor, e a RLS garante que o banco não entregue nada a quem
 * não é autorizado.
 */

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Sem credenciais não há como validar sessão: o portal roda em modo
  // demonstração e o painel exibe a tela de "configure o Supabase".
  if (!SUPABASE_CONFIGURADO) return NextResponse.next();

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  // `getUser()` revalida o token no servidor — não confie apenas no cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const noPainel = pathname === "/admin" || pathname.startsWith("/admin/");
  const area = noPainel ? AREAS.admin : AREAS.distribuidor;
  const rotaLivre = casaRota(
    pathname,
    noPainel ? ROTAS_LIVRES_ADMIN : ROTAS_LIVRES_DISTRIBUIDOR,
  );

  if (!user && !rotaLivre) {
    const destino = request.nextUrl.clone();
    destino.pathname = area.login;
    destino.search = "";
    // Guarda para onde a pessoa queria ir, e volta para lá após o login.
    if (pathname !== area.inicio) {
      destino.searchParams.set("proximo", `${pathname}${search}`);
    }
    return redirecionar(destino, resposta);
  }

  // Já logado não precisa ver login nem cadastro de novo. (`/nova-senha` e
  // `/auth/*` ficam de fora: dependem justamente da sessão recém-criada.)
  const telaDeEntrada =
    pathname === area.login || (area.cadastro !== null && pathname === area.cadastro);
  if (user && telaDeEntrada) {
    const destino = request.nextUrl.clone();
    destino.pathname = area.inicio;
    destino.search = "";
    return redirecionar(destino, resposta);
  }

  return resposta;
}

/**
 * Redireciona preservando os cookies que o Supabase acabou de renovar —
 * sem isso, um token renovado nesta requisição se perderia no redirect.
 */
function redirecionar(destino: URL, resposta: NextResponse) {
  const redirect = NextResponse.redirect(destino);
  for (const cookie of resposta.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export const config = {
  matcher: [
    /*
     * Tudo, exceto:
     * - api (a rota /api/eventos confere a sessão por conta própria)
     * - _next/static, _next/image (arquivos do build e otimização de imagem)
     * - fonts/ (Satoshi self-hosted)
     * - arquivos de metadados (ícone, robots)
     */
    "/((?!api|_next/static|_next/image|fonts/|favicon.ico|icon.svg|robots.txt).*)",
  ],
};
