"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alerta, Campo, classesBotao, classesEntrada } from "./ui";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { emailValido, formatarDataCurta, formatarNumero, normalizarBusca } from "@/lib/utils";
import type { Distribuidor } from "@/lib/types";

/**
 * Gestão da allowlist de distribuidores — espelha o padrão de
 * `GestaoCategorias`: formulário que abre sob demanda, lista com ações e
 * exclusão em duas etapas.
 *
 * Duas formas de adicionar:
 *  - **um a um**: e-mail, nome e CNPJ;
 *  - **em lote**: colar as linhas da planilha (e-mail; nome; CNPJ). Linhas
 *    repetidas atualizam nome/CNPJ em vez de duplicar.
 *
 * O e-mail é sempre gravado em minúsculas — é assim que o hook de cadastro e
 * a RLS comparam.
 */

type Modo = "um" | "lote" | null;

interface Linha {
  email: string;
  nome: string | null;
  cnpj: string | null;
}

/** Tamanho de cada envio no lote (a API aceita bem algumas centenas). */
const TAMANHO_LOTE = 500;

export function GestaoDistribuidores({
  distribuidores,
  total,
}: {
  distribuidores: Distribuidor[];
  total: number;
}) {
  const router = useRouter();

  const [modo, setModo] = useState<Modo>(null);
  const [termo, setTermo] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<
    { tom: "erro" | "sucesso" | "aviso"; texto: string } | null
  >(null);
  const [ocupado, setOcupado] = useState(false);

  const filtrados = useMemo(() => {
    const busca = normalizarBusca(termo.trim());
    if (!busca) return distribuidores;
    return distribuidores.filter((d) =>
      normalizarBusca(`${d.email} ${d.nome ?? ""} ${d.cnpj ?? ""}`).includes(busca),
    );
  }, [distribuidores, termo]);

  function traduzirErro(e: unknown): string {
    const erro = e as { code?: string; message?: string };
    if (erro.code === "42501") return "Sua conta não tem permissão para gerenciar distribuidores.";
    if (erro.code === "23514") return "Algum e-mail está em formato inválido.";
    return erro.message ?? "Erro inesperado.";
  }

  /** Grava as linhas (insere novas, atualiza nome/CNPJ das existentes). */
  async function gravar(linhas: Linha[]): Promise<boolean> {
    setOcupado(true);
    setMensagem(null);
    try {
      const supabase = criarClienteNavegador();
      for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
        const { error } = await supabase
          .from("distribuidores_autorizados")
          .upsert(linhas.slice(i, i + TAMANHO_LOTE), { onConflict: "email" });
        if (error) throw error;
      }
      router.refresh();
      return true;
    } catch (e) {
      setMensagem({ tom: "erro", texto: `Não foi possível salvar: ${traduzirErro(e)}` });
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function remover(email: string) {
    setOcupado(true);
    setMensagem(null);
    try {
      const { error } = await criarClienteNavegador()
        .from("distribuidores_autorizados")
        .delete()
        .eq("email", email);
      if (error) throw error;
      setConfirmando(null);
      setMensagem({ tom: "sucesso", texto: `${email} removido. O acesso foi cortado.` });
      router.refresh();
    } catch (e) {
      setMensagem({ tom: "erro", texto: `Não foi possível remover: ${traduzirErro(e)}` });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-6">
      {mensagem && <Alerta tom={mensagem.tom}>{mensagem.texto}</Alerta>}

      {!modo && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setModo("um")} className={classesBotao("primario")}>
            + Adicionar distribuidor
          </button>
          <button type="button" onClick={() => setModo("lote")} className={classesBotao("secundario")}>
            Importar da planilha
          </button>
        </div>
      )}

      {modo === "um" && (
        <FormularioUm
          ocupado={ocupado}
          aoCancelar={() => setModo(null)}
          aoSalvar={async (linha) => {
            const existia = distribuidores.some((d) => d.email === linha.email);
            if (await gravar([linha])) {
              setModo(null);
              setMensagem({
                tom: "sucesso",
                texto: existia
                  ? `${linha.email} já estava liberado — dados atualizados.`
                  : `${linha.email} liberado. Já pode criar conta em /cadastro.`,
              });
            }
          }}
        />
      )}

      {modo === "lote" && (
        <FormularioLote
          ocupado={ocupado}
          aoCancelar={() => setModo(null)}
          aoSalvar={async (linhas, invalidas) => {
            if (await gravar(linhas)) {
              setModo(null);
              setMensagem({
                tom: invalidas.length ? "aviso" : "sucesso",
                texto:
                  `${formatarNumero(linhas.length)} e-mail(s) importado(s).` +
                  (invalidas.length
                    ? ` ${invalidas.length} linha(s) ignorada(s) por e-mail inválido: ${invalidas.slice(0, 5).join(", ")}${invalidas.length > 5 ? "…" : ""}`
                    : ""),
              });
            }
          }}
        />
      )}

      {/* ---------- Lista ---------- */}
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <p className="text-sm font-bold text-ink">
            {formatarNumero(total)} {total === 1 ? "e-mail liberado" : "e-mails liberados"}
          </p>
          <div className="w-full sm:w-72">
            <label htmlFor="busca-distribuidor" className="sr-only">
              Buscar distribuidor
            </label>
            <input
              id="busca-distribuidor"
              type="search"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar e-mail, nome ou CNPJ…"
              className={classesEntrada}
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-muted">
            {distribuidores.length === 0
              ? "Nenhum distribuidor liberado ainda. Adicione um a um ou importe a planilha."
              : "Nenhum distribuidor corresponde à busca."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {filtrados.map((d) => (
              <li key={d.email} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-56 flex-1">
                  <p className="font-mono text-sm font-semibold text-ink">{d.email}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {[d.nome, d.cnpj && `CNPJ ${d.cnpj}`, `liberado em ${formatarDataCurta(d.created_at.slice(0, 10))}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                {confirmando === d.email ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">Cortar o acesso?</span>
                    <button
                      type="button"
                      onClick={() => remover(d.email)}
                      disabled={ocupado}
                      className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"
                    >
                      Sim, remover
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      disabled={ocupado}
                      className={classesBotao("fantasma", "px-3 py-1.5")}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmando(d.email)}
                    disabled={ocupado}
                    className={classesBotao("perigo", "px-3 py-1.5")}
                  >
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FormularioUm({
  ocupado,
  aoSalvar,
  aoCancelar,
}: {
  ocupado: boolean;
  aoSalvar: (linha: Linha) => void;
  aoCancelar: () => void;
}) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const endereco = email.trim().toLowerCase();
    if (!emailValido(endereco)) {
      setErro("Confira o e-mail — ele parece incompleto.");
      return;
    }
    setErro(null);
    aoSalvar({ email: endereco, nome: nome.trim() || null, cnpj: cnpj.trim() || null });
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
      <h2 className="text-xl text-ink">Adicionar distribuidor</h2>
      {erro && (
        <div className="mt-4">
          <Alerta tom="erro">{erro}</Alerta>
        </div>
      )}
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <Campo id="dist-email" rotulo="E-mail" obrigatorio>
          <input
            id="dist-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={classesEntrada}
            placeholder="contato@distribuidora.com.br"
          />
        </Campo>
        <Campo id="dist-nome" rotulo="Nome">
          <input
            id="dist-nome"
            value={nome}
            maxLength={120}
            onChange={(e) => setNome(e.target.value)}
            className={classesEntrada}
            placeholder="Distribuidora Exemplo"
          />
        </Campo>
        <Campo id="dist-cnpj" rotulo="CNPJ">
          <input
            id="dist-cnpj"
            value={cnpj}
            maxLength={20}
            onChange={(e) => setCnpj(e.target.value)}
            className={classesEntrada}
            placeholder="00.000.000/0000-00"
          />
        </Campo>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
        <button type="submit" disabled={ocupado} className={classesBotao("primario")}>
          {ocupado ? "Salvando…" : "Liberar acesso"}
        </button>
        <button type="button" onClick={aoCancelar} disabled={ocupado} className={classesBotao("fantasma")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * Lê as linhas coladas da planilha. Aceita `;`, `,` ou tabulação (o que o
 * Excel/Google Sheets gera ao copiar) e ignora um cabeçalho na primeira linha.
 */
function interpretarPlanilha(texto: string): { linhas: Linha[]; invalidas: string[] } {
  const porEmail = new Map<string, Linha>();
  const invalidas: string[] = [];

  texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((linha, i) => {
      // O separador é o mais "forte" presente na linha, para que um nome
      // com vírgula não quebre uma planilha separada por `;` ou tabulação.
      const separador = linha.includes("\t")
        ? "\t"
        : linha.includes(";")
          ? ";"
          : /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;
      const [email = "", nome = "", cnpj = ""] = linha
        .split(separador)
        .map((c) => c.trim().replace(/^"|"$/g, ""));
      const endereco = email.toLowerCase();
      if (!emailValido(endereco)) {
        // Primeira linha sem e-mail válido é o cabeçalho da planilha.
        if (i > 0 || /@/.test(endereco)) invalidas.push(email || `(linha ${i + 1})`);
        return;
      }
      porEmail.set(endereco, { email: endereco, nome: nome || null, cnpj: cnpj || null });
    });

  return { linhas: [...porEmail.values()], invalidas };
}

function FormularioLote({
  ocupado,
  aoSalvar,
  aoCancelar,
}: {
  ocupado: boolean;
  aoSalvar: (linhas: Linha[], invalidas: string[]) => void;
  aoCancelar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const { linhas, invalidas } = useMemo(() => interpretarPlanilha(texto), [texto]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (linhas.length) aoSalvar(linhas, invalidas);
      }}
      className="rounded-2xl border border-line bg-surface p-6 shadow-card"
    >
      <h2 className="text-xl text-ink">Importar da planilha</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Na planilha, selecione as colunas <strong>e-mail</strong>,{" "}
        <strong>nome</strong> e <strong>CNPJ</strong> (nessa ordem; nome e CNPJ
        são opcionais), copie e cole abaixo. E-mails que já estão liberados só
        têm nome e CNPJ atualizados.
      </p>

      <div className="mt-5">
        <Campo id="dist-lote" rotulo="Linhas da planilha">
          <textarea
            id="dist-lote"
            rows={8}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className={`${classesEntrada} font-mono text-sm`}
            placeholder={"email;nome;cnpj\ncontato@distribuidora.com.br;Distribuidora Exemplo;00.000.000/0000-00"}
          />
        </Campo>
        {texto.trim() && (
          <p className="mt-2 text-sm text-ink-muted">
            <strong className="text-ink">{formatarNumero(linhas.length)}</strong> e-mail(s) válido(s)
            {invalidas.length > 0 && (
              <>
                {" · "}
                <span className="text-red-700">{invalidas.length} linha(s) com e-mail inválido serão ignoradas</span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={ocupado || linhas.length === 0}
          className={classesBotao("primario")}
        >
          {ocupado ? "Importando…" : `Importar ${linhas.length || ""}`.trim()}
        </button>
        <button type="button" onClick={aoCancelar} disabled={ocupado} className={classesBotao("fantasma")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
