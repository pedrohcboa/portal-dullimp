/**
 * Leitura centralizada das variáveis de ambiente do Supabase.
 *
 * O portal funciona em dois modos:
 *  - **conectado**: as variáveis existem, todo o conteúdo vem do banco e fica
 *    atrás do login do distribuidor;
 *  - **demonstração**: sem variáveis, a área do distribuidor renderiza os
 *    links de exemplo (`seed-data.ts`) sem login e o painel exibe um aviso de
 *    configuração.
 *
 * Isso mantém o projeto executável logo após o `npm install`, sem quebrar a
 * build quando o `.env.local` ainda não foi preenchido.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Chave pública do projeto. Aceita tanto a chave `anon` (JWT legado) quanto a
 * nova chave publicável (`sb_publishable_...`).
 */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** `true` quando há credenciais suficientes para falar com o Supabase. */
export const SUPABASE_CONFIGURADO = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
