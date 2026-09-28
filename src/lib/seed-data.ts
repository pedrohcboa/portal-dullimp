import type { Link } from "./types";

/**
 * DADOS DE EXEMPLO (PLACEHOLDERS).
 * -------------------------------------------------------------------------
 * Mantêm o portal navegável enquanto o backend ainda não está conectado
 * (modo demonstração). É o mesmo conteúdo de
 * `supabase/migrations/0002_dados_de_exemplo.sql`.
 *
 * Todos os links apontam para example.com: nenhuma URL, número ou informação
 * real da Dullimp foi usada aqui.
 */
export const LINKS_EXEMPLO: Link[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    titulo: "Exemplo: live de treinamento — linha de limpeza pesada",
    url: "https://example.com/treinamento-limpeza-pesada",
    categoria: "treinamentos",
    descricao:
      "Gravação completa da live, com demonstração de aplicação e perguntas dos distribuidores.",
    thumb_url: null,
    status: "publicado",
    ordem: 1,
    data_publicacao: "2026-09-22",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    titulo: "Exemplo: kit de artes para o feed do mês",
    url: "https://example.com/artes-feed",
    categoria: "artes-e-materiais",
    descricao:
      "Pasta com posts e stories prontos para baixar e publicar nas suas redes.",
    thumb_url: null,
    status: "publicado",
    ordem: 1,
    data_publicacao: "2026-09-18",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    titulo: "Exemplo: catálogo de produtos em PDF",
    url: "https://example.com/catalogo",
    categoria: "produtos",
    descricao:
      "Catálogo completo da linha, para enviar a clientes pelo WhatsApp.",
    thumb_url: null,
    status: "publicado",
    ordem: 1,
    data_publicacao: "2026-09-15",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    titulo: "Exemplo: ficha técnica de um lançamento",
    url: "https://example.com/ficha-tecnica",
    categoria: "produtos",
    descricao: "Diluição, rendimento e modo de uso resumidos em uma página.",
    thumb_url: null,
    status: "publicado",
    ordem: 2,
    data_publicacao: "2026-09-10",
  },
];
