/** Utilidades puras compartilhadas (sem dependência de React ou Supabase). */

/** Faixa Unicode dos sinais diacríticos combinantes gerados por `NFD`. */
const DIACRITICOS = /[̀-ͯ]/g;

/**
 * Converte um texto em slug de URL: minúsculo, sem acento, sem símbolo.
 * Ex.: "Artes & Materiais 2026" -> "artes-materiais-2026"
 */
export function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Data ISO (YYYY-MM-DD) -> "12 de março de 2026".
 * Fixamos meio-dia UTC para que o fuso do navegador nunca puxe a data para o
 * dia anterior.
 */
export function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

/** Data ISO -> "12/03/2026" (usado nas tabelas do painel). */
export function formatarDataCurta(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

/** Remove acentos e caixa para comparação de busca. */
export function normalizarBusca(texto: string): string {
  return texto.normalize("NFD").replace(DIACRITICOS, "").toLowerCase();
}

/** Formata números com separador de milhar brasileiro. */
export function formatarNumero(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

/** Junta classes ignorando valores falsos — versão mínima do `clsx`. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** `true` para URLs http(s) válidas — as únicas que o banco aceita. */
export function urlValida(valor: string): boolean {
  try {
    const url = new URL(valor.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** "https://www.youtube.com/watch?v=x" -> "youtube.com" (rótulo do card). */
export function dominioDe(valor: string): string {
  try {
    return new URL(valor).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Extrai o ID de um vídeo do YouTube (watch, youtu.be, shorts, live, embed). */
export function idVideoYoutube(valor: string): string | null {
  try {
    const url = new URL(valor);
    const host = url.hostname.replace(/^(www|m)\./, "");
    if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
    if (host !== "youtube.com") return null;
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const [, tipo, id] = url.pathname.split("/");
    return ["shorts", "live", "embed"].includes(tipo) && id ? id : null;
  } catch {
    return null;
  }
}

/**
 * Miniatura a exibir no card: a colada pelo gestor ou, se o link for um vídeo
 * do YouTube, a capa pública do próprio vídeo. Sem nenhuma das duas, o card
 * usa a cor da categoria.
 */
export function miniaturaDoLink(link: { url: string; thumb_url: string | null }): string | null {
  if (link.thumb_url) return link.thumb_url;
  const id = idVideoYoutube(link.url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** Validação simples de e-mail para a allowlist (o banco revalida). */
export function emailValido(valor: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor.trim());
}

/**
 * Destino seguro para o `?proximo=` do login: só caminhos internos. Evita
 * que um link malicioso use o login para redirecionar a outro site.
 */
export function destinoSeguro(valor: string | null | undefined, padrao: string): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) {
    return padrao;
  }
  return valor;
}
