/**
 * As duas portas de entrada do portal.
 *
 *  - **distribuidor**: `/entrar`, `/cadastro`... Leva à área de conteúdo.
 *    Cadastro self-service, barrado pela allowlist de distribuidores.
 *  - **admin**: `/admin/login`... Leva ao painel dos gestores Dullimp. Sem
 *    cadastro pela interface — a conta de gestor é liberada na tabela
 *    `editores`.
 *
 * Os formulários de autenticação (`components/auth/`) são os mesmos para as
 * duas; só os caminhos e os textos mudam, e moram aqui.
 */

export type NomeArea = "distribuidor" | "admin";

export interface Area {
  /** Selo que aparece acima do cartão de login. */
  selo: string;
  /** Para onde ir depois de entrar (quando não há `?proximo=`). */
  inicio: string;
  login: string;
  recuperar: string;
  novaSenha: string;
  /** Só o distribuidor se cadastra sozinho. */
  cadastro: string | null;
  /** Prefixo aceito no `?proximo=` depois do login. */
  prefixoDestino: string;
}

export const AREAS: Record<NomeArea, Area> = {
  distribuidor: {
    selo: "Portal do Distribuidor",
    inicio: "/",
    login: "/entrar",
    recuperar: "/recuperar",
    novaSenha: "/nova-senha",
    cadastro: "/cadastro",
    prefixoDestino: "/",
  },
  admin: {
    selo: "Painel do gestor",
    inicio: "/admin",
    login: "/admin/login",
    recuperar: "/admin/recuperar",
    novaSenha: "/admin/nova-senha",
    cadastro: null,
    prefixoDestino: "/admin",
  },
};

/** Rotas de autenticação do distribuidor — acessíveis sem sessão. */
export const ROTAS_LIVRES_DISTRIBUIDOR = [
  "/entrar",
  "/cadastro",
  "/recuperar",
  "/nova-senha",
  "/auth", // /auth/confirmar: volta do link de confirmação de e-mail
];

/** Rotas de autenticação do /admin — acessíveis sem sessão. */
export const ROTAS_LIVRES_ADMIN = ["/admin/login", "/admin/recuperar", "/admin/nova-senha"];

/** `/entrar` casa com `/entrar` e `/entrar/...`, mas não com `/entrarx`. */
export function casaRota(pathname: string, rotas: string[]): boolean {
  return rotas.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
}
