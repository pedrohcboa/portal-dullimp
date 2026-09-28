import "server-only";

import { cache } from "react";
import { CATEGORIAS_PADRAO } from "./categorias";
import { LINKS_EXEMPLO } from "./seed-data";
import { criarClienteServidor } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";
import type { Categoria, Link } from "./types";

/**
 * Camada de leitura da área do distribuidor.
 *
 * Toda consulta usa a sessão de quem está logado: a RLS só devolve links a
 * distribuidor autorizado ou gestor. Sem Supabase configurado (modo
 * demonstração) caímos nos links de exemplo; com Supabase, uma falha vira
 * lista vazia — nunca conteúdo de exemplo se passando por real.
 */

export const COLUNAS_LINK =
  "id, titulo, url, categoria, descricao, thumb_url, status, ordem, data_publicacao";

/** Ordem de exibição: `ordem` do gestor, depois o mais recente, depois título. */
export function ordenarLinks(lista: Link[]): Link[] {
  return [...lista].sort(
    (a, b) =>
      a.ordem - b.ordem ||
      b.data_publicacao.localeCompare(a.data_publicacao) ||
      a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

/** Os mais recentes primeiro — usado nos destaques da home. */
export function maisRecentes(lista: Link[], quantidade: number): Link[] {
  return [...lista]
    .sort((a, b) => b.data_publicacao.localeCompare(a.data_publicacao))
    .slice(0, quantidade);
}

export interface ResultadoLinks {
  links: Link[];
  /** `true` quando o conteúdo exibido veio de `seed-data.ts`. */
  exemplo: boolean;
}

/** Todos os links **publicados** que a sessão atual pode ver. */
export const listarLinks = cache(async (): Promise<ResultadoLinks> => {
  if (!SUPABASE_CONFIGURADO) {
    return {
      links: ordenarLinks(LINKS_EXEMPLO.filter((l) => l.status === "publicado")),
      exemplo: true,
    };
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("links")
    .select(COLUNAS_LINK)
    // Gestor também enxerga rascunhos pela RLS; a área do distribuidor
    // mostra só o que está publicado, para todo mundo.
    .eq("status", "publicado");

  if (error) {
    console.error("[portal-dullimp] falha ao listar links:", error.message);
    return { links: [], exemplo: false };
  }

  return { links: ordenarLinks((data ?? []) as Link[]), exemplo: false };
});

/** Categorias cadastradas, em ordem de exibição. */
export const listarCategorias = cache(async (): Promise<Categoria[]> => {
  if (!SUPABASE_CONFIGURADO) return CATEGORIAS_PADRAO;

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("categorias")
    .select("slug, nome, descricao, cor, icone, ordem")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("[portal-dullimp] falha ao listar categorias:", error.message);
    return [];
  }
  return (data ?? []) as Categoria[];
});

/** Contagem de links publicados por slug de categoria. */
export function contarPorCategoria(lista: Link[]): Record<string, number> {
  return lista.reduce<Record<string, number>>((acc, l) => {
    acc[l.categoria] = (acc[l.categoria] ?? 0) + 1;
    return acc;
  }, {});
}

export type Acesso =
  | { estado: "demonstracao" }
  | { estado: "sem-sessao" }
  | { estado: "nao-autorizado"; email: string }
  | { estado: "liberado"; email: string; ehGestor: boolean };

/**
 * Quem está usando o portal agora. O proxy já barra quem não tem sessão;
 * aqui separamos "logado e autorizado" de "logado, mas fora da allowlist"
 * (ex.: distribuidor removido depois de criar a conta) para mostrar uma
 * explicação em vez de uma página vazia. A RLS continua sendo a garantia.
 */
export const verificarAcesso = cache(async (): Promise<Acesso> => {
  if (!SUPABASE_CONFIGURADO) return { estado: "demonstracao" };

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { estado: "sem-sessao" };

  const [distribuidor, gestor] = await Promise.all([
    supabase.rpc("eh_distribuidor"),
    supabase.rpc("eh_editor"),
  ]);

  const email = user.email ?? "";
  const ehGestor = gestor.data === true;
  if (distribuidor.data === true || ehGestor) {
    return { estado: "liberado", email, ehGestor };
  }
  return { estado: "nao-autorizado", email };
});
