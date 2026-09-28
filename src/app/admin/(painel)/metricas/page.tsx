import type { Metadata } from "next";
import {
  BarrasHorizontais,
  GraficoLinha,
  SemDados,
  type ItemBarra,
  type PontoDiario,
} from "@/components/admin/Graficos";
import { SeletorPeriodo } from "@/components/admin/SeletorPeriodo";
import { Alerta } from "@/components/admin/ui";
import { criarClienteServidor } from "@/lib/supabase/server";
import { dominioDe, formatarNumero } from "@/lib/utils";

export const metadata: Metadata = { title: "Métricas" };
export const revalidate = 0;

/** Rótulos amigáveis para os nomes técnicos dos botões rastreados. */
const NOMES_DE_BOTAO: Record<string, string> = {
  link_card: "Card de link (categorias e busca)",
  link_destaque: "Card de link em “Novidades” (home)",
  hero_cta_primary: "Home — “Ver categorias”",
  hero_cta_secondary: "Home — “Buscar material”",
  categoria_card: "Card de categoria (home)",
  catalogo_carregar_mais: "Busca — “Carregar mais”",
  nav_inicio: "Menu — Início",
  nav_inicio_mobile: "Menu (celular) — Início",
};

/** Menu por categoria: `nav_categoria_<slug>` vira "Menu — <slug>". */
function nomeDoBotao(alvo: string): string {
  if (NOMES_DE_BOTAO[alvo]) return NOMES_DE_BOTAO[alvo];
  const menu = /^nav_categoria_(.+?)(_mobile)?$/.exec(alvo);
  if (menu) return `Menu${menu[2] ? " (celular)" : ""} — ${menu[1]}`;
  return alvo;
}

interface Totais {
  pageviews: number;
  cliques_links: number;
  cliques: number;
  buscas: number;
  visitantes: number;
}

export default async function PaginaMetricas({
  searchParams,
}: PageProps<"/admin/metricas">) {
  const parametros = await searchParams;
  const bruto = Number(
    Array.isArray(parametros.dias) ? parametros.dias[0] : parametros.dias,
  );
  const dias = [7, 30, 90].includes(bruto) ? bruto : 30;

  const supabase = await criarClienteServidor();

  const [serie, totais, topLinks, porCategoria, porBotao, buscas] = await Promise.all([
    supabase.rpc("metricas_serie_diaria", { dias }),
    supabase.rpc("metricas_totais", { dias }),
    supabase.rpc("metricas_top_links", { dias, limite: 10 }),
    supabase.rpc("metricas_cliques_por_categoria", { dias }),
    supabase.rpc("metricas_por_botao", { dias }),
    supabase.rpc("metricas_buscas", { dias, limite: 10 }),
  ]);

  const erro =
    serie.error ??
    totais.error ??
    topLinks.error ??
    porCategoria.error ??
    porBotao.error ??
    buscas.error;

  const dadosSerie = (serie.data ?? []) as PontoDiario[];
  const resumo = ((totais.data ?? [])[0] ?? {
    pageviews: 0,
    cliques_links: 0,
    cliques: 0,
    buscas: 0,
    visitantes: 0,
  }) as Totais;

  const barrasLinks: ItemBarra[] = (
    (topLinks.data ?? []) as Array<{ titulo: string; url: string; cliques: number }>
  ).map((l) => ({
    rotulo: l.titulo,
    valor: l.cliques,
    detalhe: dominioDe(l.url),
  }));

  const barrasCategorias: ItemBarra[] = (
    (porCategoria.data ?? []) as Array<{ nome: string; cliques: number }>
  ).map((c) => ({ rotulo: c.nome, valor: c.cliques }));

  const barrasBotoes: ItemBarra[] = (
    (porBotao.data ?? []) as Array<{ alvo: string; cliques: number }>
  )
    .slice(0, 12)
    .map((b) => ({ rotulo: nomeDoBotao(b.alvo), valor: b.cliques }));

  const termosBuscados = (buscas.data ?? []) as Array<{
    termo: string;
    ocorrencias: number;
  }>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-ink">Métricas</h1>
          <p className="mt-1 text-ink-muted">
            Uso do portal pelos distribuidores nos últimos {dias} dias.
          </p>
        </div>
        <SeletorPeriodo atual={dias} />
      </div>

      {erro && (
        <div className="mt-6">
          <Alerta tom="erro">
            Não foi possível carregar as métricas: {erro.message}
          </Alerta>
        </div>
      )}

      {/* ---------------- Visão geral ---------------- */}
      <section aria-labelledby="visao-geral" className="mt-8">
        <h2 id="visao-geral" className="sr-only">
          Visão geral do período
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            valor={resumo.cliques_links}
            rotulo="Cliques em links"
            ajuda="Quantas vezes um material foi aberto"
          />
          <Indicador
            valor={resumo.visitantes}
            rotulo="Visitas"
            ajuda="Sessões distintas no período"
          />
          <Indicador
            valor={resumo.pageviews}
            rotulo="Páginas vistas"
            ajuda="Total de carregamentos de página"
          />
          <Indicador
            valor={resumo.buscas}
            rotulo="Buscas"
            ajuda="Termos pesquisados no portal"
          />
        </div>
      </section>

      {/* ---------------- Rankings principais ---------------- */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="top-links"
          className="rounded-xl border border-line bg-surface p-5 sm:p-6"
        >
          <h2 id="top-links" className="text-lg text-ink">
            Links mais clicados
          </h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">
            O que os distribuidores realmente abrem.
          </p>
          <BarrasHorizontais itens={barrasLinks} unidade="cliques" />
        </section>

        <section
          aria-labelledby="por-categoria"
          className="rounded-xl border border-line bg-surface p-5 sm:p-6"
        >
          <h2 id="por-categoria" className="text-lg text-ink">
            Cliques por categoria
          </h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">
            Cliques em links, somados pela categoria de cada um.
          </p>
          <BarrasHorizontais itens={barrasCategorias} unidade="cliques" />
        </section>
      </div>

      {/* ---------------- Evolução diária ---------------- */}
      <section aria-labelledby="evolucao" className="mt-6">
        <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <h2 id="evolucao" className="text-lg text-ink">
            Evolução diária
          </h2>
          <p className="mt-1 mb-4 text-sm text-ink-muted">
            Passe o mouse sobre o gráfico para ver os números de cada dia.
          </p>
          <GraficoLinha dados={dadosSerie} />
        </div>
      </section>

      {/* ---------------- Navegação e buscas ---------------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="por-botao"
          className="rounded-xl border border-line bg-surface p-5 sm:p-6"
        >
          <h2 id="por-botao" className="text-lg text-ink">
            Cliques por botão
          </h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">
            Por onde os distribuidores navegam.
          </p>
          <BarrasHorizontais itens={barrasBotoes} unidade="cliques" />
        </section>

        <section
          aria-labelledby="buscas"
          className="rounded-xl border border-line bg-surface p-5 sm:p-6"
        >
          <h2 id="buscas" className="text-lg text-ink">
            O que os distribuidores procuram
          </h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">
            Termos digitados na busca — bom indicador do material que falta.
          </p>
          {termosBuscados.length === 0 ? (
            <SemDados />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {termosBuscados.map((t) => (
                <li
                  key={t.termo}
                  className="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-muted"
                >
                  {t.termo}
                  <span className="ml-2 font-bold text-brand-navy tabular-nums">
                    {t.ocorrencias}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink-faint">
        Estes números vêm da tabela de eventos do próprio portal e não
        identificam ninguém: não guardamos IP, nome nem e-mail de quem clicou.
        O tráfego agregado também está disponível no painel do Vercel (Web
        Analytics).
      </p>
    </div>
  );
}

/** Cartão de indicador: número grande + o que ele significa. */
function Indicador({
  valor,
  rotulo,
  ajuda,
}: {
  valor: number;
  rotulo: string;
  ajuda: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="font-display text-4xl font-bold text-brand-navy tabular-nums">
        {formatarNumero(valor)}
      </p>
      <p className="mt-1 text-sm font-bold text-ink">{rotulo}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{ajuda}</p>
    </div>
  );
}
