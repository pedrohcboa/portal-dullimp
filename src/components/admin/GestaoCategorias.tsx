"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alerta, Campo, classesBotao, classesEntrada } from "./ui";
import { IconeCategoria } from "@/components/ui/Icones";
import { criarClienteNavegador } from "@/lib/supabase/client";
import {
  CORES_DISPONIVEIS,
  ICONES,
  ICONES_DISPONIVEIS,
  PALETA,
  aparenciaPorCor,
} from "@/lib/categorias";
import { cn, gerarSlug } from "@/lib/utils";
import type { Categoria } from "@/lib/types";

/**
 * Criação e manutenção das categorias do portal.
 *
 * Decisões que valem explicar:
 *
 *  - **o endereço não muda depois de criado.** O slug nasce do nome e congela.
 *    Renomear a categoria ajusta o que o distribuidor vê; mexer no endereço
 *    quebraria links já compartilhados.
 *  - **cor e ícone saem de listas fechadas.** O Tailwind só gera o CSS das
 *    classes que enxerga no código, então cor livre não funcionaria — e a
 *    lista fechada garante de brinde que nenhuma combinação fere as regras da
 *    marca.
 *  - **categoria com link dentro não pode ser excluída.** O banco recusaria de
 *    qualquer forma; aqui a gente avisa antes, em português.
 */

/** Estado do formulário, separado do registro salvo. */
interface Rascunho {
  slug: string | null; // null = criando
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
}

const RASCUNHO_VAZIO: Rascunho = {
  slug: null,
  nome: "",
  descricao: "",
  cor: "navy",
  icone: "estrela",
};

export function GestaoCategorias({
  categorias,
  contagem,
}: {
  categorias: Categoria[];
  contagem: Record<string, number>;
}) {
  const router = useRouter();

  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(
    null,
  );
  const [mensagem, setMensagem] = useState<
    { tom: "erro" | "sucesso"; texto: string } | null
  >(null);
  const [ocupado, setOcupado] = useState(false);

  const criando = rascunho?.slug === null;

  function abrirNova() {
    setMensagem(null);
    setConfirmandoExclusao(null);
    setRascunho(RASCUNHO_VAZIO);
  }

  function abrirEdicao(c: Categoria) {
    setMensagem(null);
    setConfirmandoExclusao(null);
    setRascunho({
      slug: c.slug,
      nome: c.nome,
      descricao: c.descricao,
      cor: c.cor,
      icone: c.icone,
    });
  }

  /** Traduz os erros do Postgres que o editor pode encontrar. */
  function traduzirErro(codigo: string | undefined, padrao: string): string {
    if (codigo === "23505")
      return "Já existe uma categoria com esse nome. Escolha outro.";
    if (codigo === "23503")
      return "Esta categoria ainda tem links. Mova-os para outra categoria antes de excluir.";
    if (codigo === "42501")
      return "Sua conta não tem permissão para gerenciar categorias.";
    return padrao;
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!rascunho) return;

    const nome = rascunho.nome.trim();
    if (!nome) {
      setMensagem({ tom: "erro", texto: "Dê um nome à categoria." });
      return;
    }

    const slugNovo = gerarSlug(nome);
    if (criando && !slugNovo) {
      setMensagem({
        tom: "erro",
        texto: "O nome precisa ter ao menos uma letra ou número.",
      });
      return;
    }

    setOcupado(true);
    setMensagem(null);

    try {
      const supabase = criarClienteNavegador();
      const campos = {
        nome,
        descricao: rascunho.descricao.trim(),
        cor: rascunho.cor,
        icone: rascunho.icone,
      };

      if (criando) {
        // Entra no fim da lista; a ordem se ajusta pelas setas.
        const ordem = Math.max(0, ...categorias.map((c) => c.ordem)) + 1;
        const { error } = await supabase
          .from("categorias")
          .insert({ slug: slugNovo, ...campos, ordem });
        if (error) throw error;
        setMensagem({ tom: "sucesso", texto: `Categoria "${nome}" criada.` });
      } else {
        const { error } = await supabase
          .from("categorias")
          .update(campos)
          .eq("slug", rascunho.slug);
        if (error) throw error;
        setMensagem({ tom: "sucesso", texto: `Categoria "${nome}" salva.` });
      }

      setRascunho(null);
      router.refresh();
    } catch (e) {
      const erro = e as { code?: string; message?: string };
      setMensagem({
        tom: "erro",
        texto: traduzirErro(
          erro.code,
          erro.message ?? "Não foi possível salvar a categoria.",
        ),
      });
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(slug: string) {
    setOcupado(true);
    setMensagem(null);
    try {
      const supabase = criarClienteNavegador();
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("slug", slug);
      if (error) throw error;
      setMensagem({ tom: "sucesso", texto: "Categoria excluída." });
      setConfirmandoExclusao(null);
      router.refresh();
    } catch (e) {
      const erro = e as { code?: string; message?: string };
      setMensagem({
        tom: "erro",
        texto: traduzirErro(
          erro.code,
          erro.message ?? "Não foi possível excluir a categoria.",
        ),
      });
    } finally {
      setOcupado(false);
    }
  }

  /** Troca a posição de uma categoria com a vizinha e regrava as duas. */
  async function mover(indice: number, direcao: -1 | 1) {
    const vizinho = indice + direcao;
    if (vizinho < 0 || vizinho >= categorias.length) return;

    const a = categorias[indice];
    const b = categorias[vizinho];

    setOcupado(true);
    setMensagem(null);
    try {
      const supabase = criarClienteNavegador();
      // `ordem` pode estar empatada em dados antigos; usar a posição na lista
      // como referência garante que a troca sempre produz valores distintos.
      const resultados = await Promise.all([
        supabase
          .from("categorias")
          .update({ ordem: vizinho + 1 })
          .eq("slug", a.slug),
        supabase
          .from("categorias")
          .update({ ordem: indice + 1 })
          .eq("slug", b.slug),
      ]);
      const falha = resultados.find((r) => r.error);
      if (falha?.error) throw falha.error;
      router.refresh();
    } catch (e) {
      const erro = e as { code?: string; message?: string };
      setMensagem({
        tom: "erro",
        texto: traduzirErro(
          erro.code,
          erro.message ?? "Não foi possível reordenar.",
        ),
      });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-6">
      {mensagem && <Alerta tom={mensagem.tom}>{mensagem.texto}</Alerta>}

      {!rascunho && (
        <button
          type="button"
          onClick={abrirNova}
          className={classesBotao("primario")}
        >
          + Nova categoria
        </button>
      )}

      {rascunho && (
        <FormularioCategoria
          rascunho={rascunho}
          criando={criando}
          ocupado={ocupado}
          aoMudar={setRascunho}
          aoSalvar={salvar}
          aoCancelar={() => {
            setRascunho(null);
            setMensagem(null);
          }}
        />
      )}

      <ul className="space-y-3">
        {categorias.map((c, i) => {
          const aparencia = aparenciaPorCor(c.cor);
          const total = contagem[c.slug] ?? 0;
          const confirmando = confirmandoExclusao === c.slug;

          return (
            <li
              key={c.slug}
              className="rounded-2xl border border-line bg-surface p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start gap-4">
                <span
                  className={cn(
                    "inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
                    aparencia.capa,
                  )}
                >
                  <IconeCategoria
                    icone={c.icone}
                    className={cn("size-6", aparencia.sobreCapa)}
                  />
                </span>

                <div className="min-w-48 flex-1">
                  <h2 className="text-lg font-bold text-ink">{c.nome}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    {c.descricao || "Sem descrição."}
                  </p>
                  <p className="mt-2 text-xs text-ink-faint">
                    <span className="font-mono">/categorias/{c.slug}</span>
                    {" · "}
                    {total === 0
                      ? "nenhum link"
                      : `${total} ${total === 1 ? "link" : "links"}`}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <BotaoOrdem
                    rotulo={`Mover ${c.nome} para cima`}
                    seta="↑"
                    desabilitado={ocupado || i === 0}
                    aoClicar={() => mover(i, -1)}
                  />
                  <BotaoOrdem
                    rotulo={`Mover ${c.nome} para baixo`}
                    seta="↓"
                    desabilitado={ocupado || i === categorias.length - 1}
                    aoClicar={() => mover(i, 1)}
                  />
                  <button
                    type="button"
                    onClick={() => abrirEdicao(c)}
                    disabled={ocupado}
                    className={classesBotao("secundario", "px-3 py-1.5")}
                  >
                    Editar
                  </button>
                </div>
              </div>

              {/* Exclusão: bloqueada com links dentro, em duas etapas sem. */}
              <div className="mt-4 border-t border-line pt-3">
                {total > 0 ? (
                  <p className="text-xs text-ink-faint">
                    Para excluir esta categoria, mova antes{" "}
                    {total === 1 ? "o link que está" : `os ${total} links que estão`}{" "}
                    nela para outra categoria.
                  </p>
                ) : confirmando ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      Excluir “{c.nome}” definitivamente?
                    </span>
                    <button
                      type="button"
                      onClick={() => excluir(c.slug)}
                      disabled={ocupado}
                      className={classesBotao("perigo", "px-3 py-1.5")}
                    >
                      Sim, excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoExclusao(null)}
                      disabled={ocupado}
                      className={classesBotao("fantasma", "px-3 py-1.5")}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(c.slug)}
                    disabled={ocupado}
                    className={classesBotao("perigo", "px-3 py-1.5")}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {categorias.length === 0 && (
        <Alerta tom="info">
          Nenhuma categoria cadastrada. Crie a primeira para que os links
          tenham onde morar.
        </Alerta>
      )}
    </div>
  );
}

function BotaoOrdem({
  rotulo,
  seta,
  desabilitado,
  aoClicar,
}: {
  rotulo: string;
  seta: string;
  desabilitado: boolean;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desabilitado}
      aria-label={rotulo}
      title={rotulo}
      className="rounded-lg border border-line px-2.5 py-1.5 text-sm font-bold text-ink-muted transition-colors hover:border-brand-navy hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span aria-hidden>{seta}</span>
    </button>
  );
}

/** Formulário de criação/edição, com prévia ao vivo da aparência. */
function FormularioCategoria({
  rascunho,
  criando,
  ocupado,
  aoMudar,
  aoSalvar,
  aoCancelar,
}: {
  rascunho: Rascunho;
  criando: boolean;
  ocupado: boolean;
  aoMudar: (r: Rascunho) => void;
  aoSalvar: (e: React.FormEvent) => void;
  aoCancelar: () => void;
}) {
  const aparencia = aparenciaPorCor(rascunho.cor);
  const enderecoPrevisto = gerarSlug(rascunho.nome) || "…";

  return (
    <form
      onSubmit={aoSalvar}
      className="rounded-2xl border border-line bg-surface p-6 shadow-card"
    >
      <h2 className="text-xl font-bold text-ink">
        {criando ? "Nova categoria" : `Editando “${rascunho.nome}”`}
      </h2>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Campo
            id="cat-nome"
            rotulo="Nome"
            obrigatorio
            ajuda={
              criando
                ? `Endereço no site: /categorias/${enderecoPrevisto}`
                : "O endereço não muda ao renomear — links já compartilhados continuam funcionando."
            }
          >
            <input
              id="cat-nome"
              required
              maxLength={60}
              value={rascunho.nome}
              onChange={(e) => aoMudar({ ...rascunho, nome: e.target.value })}
              className={classesEntrada}
              placeholder="Treinamentos"
            />
          </Campo>

          <Campo
            id="cat-descricao"
            rotulo="Descrição"
            ajuda="Uma frase explicando o que entra nesta categoria. Aparece na home e na página da categoria."
          >
            <textarea
              id="cat-descricao"
              rows={3}
              maxLength={240}
              value={rascunho.descricao}
              onChange={(e) =>
                aoMudar({ ...rascunho, descricao: e.target.value })
              }
              className={classesEntrada}
              placeholder="Lives e vídeos de treinamento sobre produto e venda."
            />
          </Campo>

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="cat-cor" rotulo="Cor">
              <select
                id="cat-cor"
                value={rascunho.cor}
                onChange={(e) => aoMudar({ ...rascunho, cor: e.target.value })}
                className={classesEntrada}
              >
                {CORES_DISPONIVEIS.map((cor) => (
                  <option key={cor} value={cor}>
                    {PALETA[cor].rotulo}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="cat-icone" rotulo="Ícone">
              <select
                id="cat-icone"
                value={rascunho.icone}
                onChange={(e) => aoMudar({ ...rascunho, icone: e.target.value })}
                className={classesEntrada}
              >
                {ICONES_DISPONIVEIS.map((icone) => (
                  <option key={icone} value={icone}>
                    {ICONES[icone]}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </div>

        {/* Prévia: exatamente as peças que o distribuidor vê no portal. */}
        <div className="rounded-xl border border-line bg-canvas p-5">
          <p className="text-xs font-bold tracking-[0.12em] text-ink-faint uppercase">
            Prévia
          </p>

          <div className="mt-4 flex flex-col rounded-2xl border border-line bg-surface p-5">
            <span
              className={cn(
                "inline-flex size-12 items-center justify-center rounded-xl",
                aparencia.capa,
              )}
            >
              <IconeCategoria
                icone={rascunho.icone}
                className={cn("size-6", aparencia.sobreCapa)}
              />
            </span>
            <h3 className="mt-4 text-xl font-bold text-ink">
              {rascunho.nome || "Nome da categoria"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {rascunho.descricao || "A descrição aparece aqui."}
            </p>
          </div>

          <p className="mt-4 text-xs font-bold tracking-[0.12em] text-ink-faint uppercase">
            Etiqueta nos cards
          </p>
          <span
            className={cn(
              "mt-2 inline-flex items-center rounded-full px-3 py-1 text-[0.6875rem] font-bold tracking-[0.08em] uppercase",
              aparencia.chip,
            )}
          >
            {rascunho.nome || "Categoria"}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={ocupado}
          className={classesBotao("primario")}
        >
          {ocupado
            ? "Salvando…"
            : criando
              ? "Criar categoria"
              : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          disabled={ocupado}
          className={classesBotao("fantasma")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
