"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURADO, SUPABASE_URL } from "./config";

/**
 * Cliente Supabase para componentes do navegador (login, editor, uploads).
 *
 * Reaproveitamos a mesma instância entre renders para não recriar o listener
 * de sessão a cada montagem de componente.
 */
let instancia: SupabaseClient | null = null;

export function criarClienteNavegador(): SupabaseClient {
  if (!SUPABASE_CONFIGURADO) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.",
    );
  }
  instancia ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return instancia;
}
