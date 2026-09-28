import type { Categoria } from "./types";

/**
 * Catálogo e aparência das categorias.
 *
 * As categorias vivem na tabela `categorias` do Supabase e são criadas pelo
 * painel (`/admin/categorias`) — sem deploy. Este arquivo guarda duas coisas
 * que **não** podem morar no banco:
 *
 *  - o *fallback* usado quando o backend não está conectado (modo demonstração);
 *  - a paleta e os ícones, porque o Tailwind precisa enxergar a string completa
 *    da classe no código-fonte para gerar o CSS (montar nome de classe
 *    dinamicamente não funciona).
 *
 * Por isso a categoria não escolhe uma cor livre: ela escolhe um dos tokens de
 * `PALETA`, todos já validados contra o manual Dullimp (texto branco só sobre
 * as variantes com contraste AA — ver `globals.css`).
 */

export interface AparenciaCategoria {
  /** Chip/tag da categoria. Contraste AA garantido em todas as entradas. */
  chip: string;
  /** Gradiente usado como capa de fallback quando não há miniatura. */
  capa: string;
  /** Cor sólida para barras e detalhes. */
  barra: string;
  /** Ícone sólido sobre a capa (cartão de categoria). */
  sobreCapa: string;
  /** Mesmo ícone como marca d'água discreta sobre a capa. */
  marcaDagua: string;
}

/**
 * Tokens de cor disponíveis para uma categoria.
 *
 * Mantenha em sincronia com o CHECK `categorias_cor_valida`
 * (`supabase/migrations/0001_schema_completo.sql`).
 */
export const PALETA: Record<string, AparenciaCategoria & { rotulo: string }> = {
  navy: {
    rotulo: "Azul Marinho",
    chip: "bg-brand-navy text-white",
    capa: "bg-linear-to-br from-brand-navy to-brand-navy-deep",
    barra: "bg-brand-navy",
    sobreCapa: "text-white",
    marcaDagua: "text-white/30",
  },
  verde: {
    rotulo: "Verde",
    // O verde puro fica em 4.48:1 com branco; o chip usa a variante -deep.
    chip: "bg-brand-green-deep text-white",
    capa: "bg-linear-to-br from-brand-green to-brand-green-deep",
    barra: "bg-brand-green",
    sobreCapa: "text-white",
    marcaDagua: "text-white/30",
  },
  terracota: {
    rotulo: "Terracota",
    // Branco sobre a terracota pura não passa AA; o chip usa a -deep.
    chip: "bg-brand-terracotta-deep text-white",
    capa: "bg-linear-to-br from-brand-terracotta to-brand-terracotta-deep",
    barra: "bg-brand-terracotta",
    sobreCapa: "text-white",
    marcaDagua: "text-white/35",
  },
  cinza: {
    rotulo: "Cinza Pedra",
    chip: "bg-brand-gray text-white",
    capa: "bg-linear-to-br from-brand-gray to-ink-muted",
    barra: "bg-brand-gray",
    sobreCapa: "text-white",
    marcaDagua: "text-white/30",
  },
};

/** Ordem em que a paleta aparece no seletor do painel. */
export const CORES_DISPONIVEIS = Object.keys(PALETA);

/**
 * Ícones que uma categoria pode usar. O desenho de cada um está em
 * `src/components/ui/Icones.tsx`; aqui fica só o rótulo legível do seletor.
 *
 * Mantenha em sincronia com o CHECK `categorias_icone_valido`.
 */
export const ICONES: Record<string, string> = {
  play: "Vídeo",
  imagem: "Imagem",
  frasco: "Frasco",
  documento: "Documento",
  megafone: "Megafone",
  estrela: "Estrela",
};

export const ICONES_DISPONIVEIS = Object.keys(ICONES);

const APARENCIA_NEUTRA = PALETA.cinza;

/** Aparência de uma categoria já carregada do banco. */
export function aparenciaCategoria(
  categoria: Pick<Categoria, "cor"> | undefined | null,
): AparenciaCategoria {
  return (categoria && PALETA[categoria.cor]) ?? APARENCIA_NEUTRA;
}

/** Aparência a partir de um token de cor solto (usado nas prévias do painel). */
export function aparenciaPorCor(cor: string): AparenciaCategoria {
  return PALETA[cor] ?? APARENCIA_NEUTRA;
}

/** Nome legível de uma categoria, com fallback para o próprio slug. */
export function nomeCategoria(slug: string, categorias: Categoria[]): string {
  return categorias.find((c) => c.slug === slug)?.nome ?? slug;
}

/**
 * Fallback do modo demonstração — espelha o que a migration 0001 deixa no
 * banco. Só aparece quando o Supabase não está configurado.
 */
export const CATEGORIAS_PADRAO: Categoria[] = [
  {
    slug: "treinamentos",
    nome: "Treinamentos",
    descricao:
      "Lives e vídeos de treinamento: produto, aplicação, técnica de venda e atendimento.",
    cor: "navy",
    icone: "play",
    ordem: 1,
  },
  {
    slug: "artes-e-materiais",
    nome: "Artes e Materiais",
    descricao:
      "Artes de post, stories, catálogos e materiais prontos para divulgar a Dullimp.",
    cor: "terracota",
    icone: "imagem",
    ordem: 2,
  },
  {
    slug: "produtos",
    nome: "Produtos",
    descricao:
      "Fichas técnicas, fotos, lançamentos e informações de cada produto da linha.",
    cor: "verde",
    icone: "frasco",
    ordem: 3,
  },
];
