/**
 * Tipos compartilhados entre a área do distribuidor e o painel.
 * Os nomes dos campos espelham as colunas do Supabase para evitar camadas de
 * tradução desnecessárias.
 */

export type StatusLink = "rascunho" | "publicado";

/** Um item do portal: cartão que leva direto a uma URL externa. */
export interface Link {
  id: string;
  titulo: string;
  url: string; // destino externo (YouTube, Drive, Canva...)
  categoria: string; // slug da categoria (FK -> categorias.slug)
  descricao: string;
  thumb_url: string | null;
  status: StatusLink;
  ordem: number; // menor aparece primeiro dentro da categoria
  data_publicacao: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
}

/** Campos editáveis no painel (id/timestamps são do banco). */
export type LinkInput = Omit<Link, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export interface Categoria {
  slug: string;
  nome: string;
  descricao: string;
  /** Token de paleta (ver `PALETA` em `lib/categorias.ts`). */
  cor: string;
  /** Nome do ícone SVG (ver `ICONES` em `lib/categorias.ts`). */
  icone: string;
  ordem: number;
}

/** Linha da allowlist de distribuidores. */
export interface Distribuidor {
  email: string;
  nome: string | null;
  cnpj: string | null;
  created_at: string;
}

/** Evento de analytics. Nunca carrega dado pessoal de quem usa o portal. */
export interface EventoInput {
  tipo: string;
  alvo?: string | null;
  link_id?: string | null;
  categoria?: string | null;
  path?: string | null;
}
