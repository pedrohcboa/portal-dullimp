"use client";

import { useId, useRef, useState } from "react";
import { formatarNumero } from "@/lib/utils";

/**
 * Gráficos do painel de métricas — SVG desenhado à mão.
 *
 * Não usamos biblioteca de charts: são duas formas apenas (linha e barra
 * horizontal) e o bundle do painel fica muito menor.
 *
 * PALETA (validada para daltonismo e contraste sobre fundo branco — faixa
 * de luminosidade, croma, separação protan/deutan/tritan e contraste 3:1):
 *  - série 1 / barras: #1F5F9E — o navy da marca clareado e saturado o
 *    suficiente para não ler como cinza num traço fino (o #163A5F puro é
 *    escuro e dessaturado demais para dado);
 *  - série 2: #B8663A — a terracota da marca escurecida até o traço passar
 *    3:1 sobre branco.
 * Identidade nunca depende só da cor: há legenda e rótulo direto no fim da
 * linha, e toda visualização tem a tabela equivalente logo abaixo.
 */
export const COR_SERIE_1 = "#1F5F9E";
export const COR_SERIE_2 = "#B8663A";

const EIXO = "#c9d1db";
const GRADE = "#eceff3";

// ---------------------------------------------------------------------------
// Gráfico de linha
// ---------------------------------------------------------------------------

export interface PontoDiario {
  dia: string; // YYYY-MM-DD
  pageviews: number;
  visitantes: number;
}

const L = { esquerda: 44, direita: 16, topo: 16, baixo: 28 };
const LARGURA = 720;
const ALTURA = 260;

export function GraficoLinha({ dados }: { dados: PontoDiario[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ativo, setAtivo] = useState<number | null>(null);
  const idGrade = useId();

  if (dados.length === 0) return <SemDados />;

  const maximo = Math.max(
    1,
    ...dados.map((d) => Math.max(d.pageviews, d.visitantes)),
  );
  // Arredonda o topo para um número "redondo", assim os rótulos do eixo Y
  // ficam legíveis (10, 20, 50, 100…).
  const topo = arredondarParaCima(maximo);

  const larguraUtil = LARGURA - L.esquerda - L.direita;
  const alturaUtil = ALTURA - L.topo - L.baixo;

  const x = (i: number) =>
    L.esquerda +
    (dados.length === 1 ? larguraUtil / 2 : (i / (dados.length - 1)) * larguraUtil);
  const y = (v: number) => L.topo + alturaUtil - (v / topo) * alturaUtil;

  const caminho = (chave: keyof Omit<PontoDiario, "dia">) =>
    dados.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[chave])}`).join(" ");

  const marcasY = [0, topo / 2, topo];
  // Com muitos dias, mostramos no máximo 6 rótulos no eixo X.
  const passoX = Math.max(1, Math.ceil(dados.length / 6));

  function aoMover(evento: React.MouseEvent<SVGSVGElement>) {
    const caixa = svgRef.current?.getBoundingClientRect();
    if (!caixa) return;
    const proporcao = (evento.clientX - caixa.left) / caixa.width;
    const posicao = proporcao * LARGURA;
    const indice = Math.round(
      ((posicao - L.esquerda) / larguraUtil) * (dados.length - 1),
    );
    setAtivo(Math.min(dados.length - 1, Math.max(0, indice)));
  }

  const ponto = ativo !== null ? dados[ativo] : null;

  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-center gap-4">
        <Legenda cor={COR_SERIE_1} rotulo="Páginas vistas" />
        <Legenda cor={COR_SERIE_2} rotulo="Visitantes" />
      </div>

      <div className="relative mt-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LARGURA} ${ALTURA}`}
          className="h-64 w-full"
          role="img"
          aria-label="Evolução diária de páginas vistas e visitantes"
          onMouseMove={aoMover}
          onMouseLeave={() => setAtivo(null)}
        >
          {/* Grade recessiva */}
          <g id={idGrade}>
            {marcasY.map((valor) => (
              <g key={valor}>
                <line
                  x1={L.esquerda}
                  x2={LARGURA - L.direita}
                  y1={y(valor)}
                  y2={y(valor)}
                  stroke={valor === 0 ? EIXO : GRADE}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={L.esquerda - 8}
                  y={y(valor) + 4}
                  textAnchor="end"
                  className="fill-ink-faint text-[11px]"
                >
                  {formatarNumero(Math.round(valor))}
                </text>
              </g>
            ))}
          </g>

          {/* Rótulos do eixo X */}
          {dados.map((d, i) =>
            i % passoX === 0 || i === dados.length - 1 ? (
              <text
                key={d.dia}
                x={x(i)}
                y={ALTURA - 8}
                textAnchor="middle"
                className="fill-ink-faint text-[11px]"
              >
                {diaCurto(d.dia)}
              </text>
            ) : null,
          )}

          {/* Séries: traço fino, sem preenchimento */}
          <path
            d={caminho("pageviews")}
            fill="none"
            stroke={COR_SERIE_1}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={caminho("visitantes")}
            fill="none"
            stroke={COR_SERIE_2}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Camada de hover: linha-guia + marcadores com anel branco */}
          {ativo !== null && ponto && (
            <g>
              <line
                x1={x(ativo)}
                x2={x(ativo)}
                y1={L.topo}
                y2={L.topo + alturaUtil}
                stroke={EIXO}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={x(ativo)} cy={y(ponto.pageviews)} r={5} fill={COR_SERIE_1} stroke="#fff" strokeWidth={2} />
              <circle cx={x(ativo)} cy={y(ponto.visitantes)} r={5} fill={COR_SERIE_2} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {ponto && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-card"
            style={{
              left: `${((x(ativo!) - L.esquerda) / larguraUtil) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-bold text-ink">{diaLongo(ponto.dia)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-ink-muted">
              <Bolinha cor={COR_SERIE_1} /> {formatarNumero(ponto.pageviews)} páginas
            </p>
            <p className="flex items-center gap-1.5 text-ink-muted">
              <Bolinha cor={COR_SERIE_2} /> {formatarNumero(ponto.visitantes)} visitantes
            </p>
          </div>
        )}
      </div>

      {/* Alternativa em tabela — a mesma informação sem depender de cor. */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-brand-navy">
          Ver os números em tabela
        </summary>
        <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-canvas text-left">
              <tr>
                <th className="px-3 py-2 font-bold">Dia</th>
                <th className="px-3 py-2 text-right font-bold">Páginas vistas</th>
                <th className="px-3 py-2 text-right font-bold">Visitantes</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d) => (
                <tr key={d.dia} className="border-t border-line">
                  <td className="px-3 py-1.5">{diaLongo(d.dia)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatarNumero(d.pageviews)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatarNumero(d.visitantes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Barras horizontais (ranking)
// ---------------------------------------------------------------------------

export interface ItemBarra {
  rotulo: string;
  valor: number;
  /** Texto auxiliar exibido em cinza depois do rótulo. */
  detalhe?: string;
}

/**
 * Ranking em barras horizontais. Série única, então uma cor só e sem legenda —
 * o título do bloco já diz o que está sendo medido. Todo valor é rotulado
 * diretamente, o que dispensa o eixo numérico.
 */
export function BarrasHorizontais({
  itens,
  unidade,
}: {
  itens: ItemBarra[];
  unidade: string;
}) {
  if (itens.length === 0) return <SemDados />;
  const maximo = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <ul className="space-y-3">
      {itens.map((item) => (
        <li key={item.rotulo}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium text-ink" title={item.rotulo}>
              {item.rotulo}
              {item.detalhe && (
                <span className="ml-2 text-xs text-ink-faint">{item.detalhe}</span>
              )}
            </span>
            <span className="shrink-0 text-sm font-bold text-ink tabular-nums">
              {formatarNumero(item.valor)}
              <span className="ml-1 text-xs font-medium text-ink-faint">
                {unidade}
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, (item.valor / maximo) * 100)}%`,
                backgroundColor: COR_SERIE_1,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Peças auxiliares
// ---------------------------------------------------------------------------

function Legenda({ cor, rotulo }: { cor: string; rotulo: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted">
      <Bolinha cor={cor} />
      {rotulo}
    </span>
  );
}

function Bolinha({ cor }: { cor: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: cor }}
    />
  );
}

export function SemDados() {
  return (
    <p className="rounded-lg border border-dashed border-line-strong bg-canvas px-4 py-10 text-center text-sm text-ink-muted">
      Ainda não há dados neste período. Os números aparecem conforme os
      distribuidores usam o portal.
    </p>
  );
}

/** Arredonda o topo do eixo para 1, 2 ou 5 vezes uma potência de dez. */
function arredondarParaCima(valor: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(valor));
  for (const passo of [1, 2, 5, 10]) {
    if (valor <= passo * magnitude) return passo * magnitude;
  }
  return 10 * magnitude;
}

function diaCurto(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

function diaLongo(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}
