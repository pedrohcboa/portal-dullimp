import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURADO, SUPABASE_URL } from "./config";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 *
 * Lê e grava a sessão nos cookies da requisição. É o único cliente de leitura
 * do portal: como todo o conteúdo é privado, as consultas sempre carregam a
 * sessão de quem está logado e a RLS decide o que ela enxerga.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem escrever cookies. A renovação da
          // sessão acontece no proxy, então é seguro ignorar aqui.
        }
      },
    },
  });
}

/**
 * Cliente administrativo (service role). Usado **exclusivamente** no servidor,
 * para gravar eventos de analytics quando a chave existe. Nunca importe este
 * módulo em código de cliente.
 */
export function criarClienteServico() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_CONFIGURADO || !serviceKey) return null;

  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
