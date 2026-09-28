"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alerta, Campo, Selo, classesBotao, classesEntrada } from "./ui";
import { LinkCard } from "@/components/site/LinkCard";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { idVideoYoutube, urlValida } from "@/lib/utils";
import type { Categoria, Link as ItemLink, StatusLink } from "@/lib/types";

/**
 * Formulário de criação e edição de um link.
 *
 * Pensado para quem não é técnico: colou a URL, deu um título, escolheu a
 * categoria — pronto. A prévia ao lado mostra o card exatamente como o
 * distribuidor verá. "Salvar rascunho" e "Publicar" são dois botões
 * distintos e explícitos.
 *
 * Miniatura por URL colada (sem upload). Vídeo do YouTube dispensa: o card
 * usa a capa do próprio vídeo.
 */
export function FormularioLink({
  link,
  categorias,
  categoriaInicial,
}: {
  /** Ausente ao criar um link novo. */
  link?: ItemLink;
  categorias: Categoria[];
  categoriaInicial?: string;
}) {
  const router = useRouter();
  const criando = !link;

  const [titulo, setTitulo] = useState(link?.titulo ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [categoria, setCategoria] = useState(
    link?.categoria ??
      categorias.find((c) => c.slug === categoriaInicial)?.slug ??
      categorias[0]?.slug ??
      "",
  );
  const [descricao, setDescricao] = useState(link?.descricao ?? "");
  const [thumbUrl, setThumbUrl] = useState(link?.thumb_url ?? "");
  const [ordem, setOrdem] = useState(String(link?.ordem ?? 100));

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<
    { tom: "erro" | "sucesso"; texto: string } | null
  >(null);

  const ehYoutube = Boolean(idVideoYoutube(url.trim()));

  function validar(): string | null {
    if (!titulo.trim()) return "Dê um título ao link.";
    if (!url.trim()) return "Cole a URL de destino.";
    if (!urlValida(url)) return "A URL precisa começar com https:// (copie o endereço completo do navegador).";
    if (!categoria) return "Escolha uma categoria.";
    if (thumbUrl.trim() && !urlValida(thumbUrl))
      return "A URL da miniatura precisa começar com https://. Ou deixe em branco.";
    if (!/^\d+$/.test(ordem.trim())) return "A ordem precisa ser um número inteiro (ex.: 1, 2, 10).";
    return null;
  }

  async function salvar(status: StatusLink) {
    const problema = validar();
    if (problema) {
      setMensagem({ tom: "erro", texto: problema });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSalvando(true);
    setMensagem(null);

    const registro = {
      titulo: titulo.trim(),
      url: url.trim(),
      categoria,
      descricao: descricao.trim(),
      thumb_url: thumbUrl.trim() || null,
      status,
      ordem: Number(ordem.trim()),
    };

    try {
      const supabase = criarClienteNavegador();

      if (criando) {
        const { data, error } = await supabase
          .from("links")
          .insert(registro)
          .select("id")
          .single();
        if (error) throw error;
        setMensagem({
          tom: "sucesso",
          texto:
            status === "publicado"
              ? "Link publicado! Já aparece para os distribuidores."
              : "Rascunho salvo.",
        });
        router.replace(`/admin/editar/${data.id}`);
        router.refresh();
      } else {
        const { error } = await supabase
          .from("links")
          .update(registro)
          .eq("id", link.id);
        if (error) throw error;
        setMensagem({
          tom: "sucesso",
          texto:
            status === "publicado"
              ? "Alterações publicadas."
              : "Rascunho salvo. O link não aparece para os distribuidores enquanto estiver assim.",
        });
        router.refresh();
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const detalhe =
        (e as { message?: string })?.message ?? "erro desconhecido";
      setMensagem({ tom: "erro", texto: `Não foi possível salvar: ${detalhe}` });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSalvando(false);
    }
  }

  const statusAtual: StatusLink = link?.status ?? "rascunho";

  return (
    <div>
      {/* ---------------- Cabeçalho da tela ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-brand-navy hover:underline">
            ← Voltar para os links
          </Link>
          <h1 className="mt-2 text-3xl text-ink">{criando ? "Novo link" : "Editar link"}</h1>
        </div>
        {!criando && <Selo status={statusAtual} />}
      </div>

      {mensagem && (
        <div className="mt-6">
          <Alerta tom={mensagem.tom}>{mensagem.texto}</Alerta>
        </div>
      )}

      <form
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* ================= Coluna principal ================= */}
        <div className="space-y-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
          <Campo
            id="url"
            rotulo="URL do link"
            ajuda="Copie o endereço da barra do navegador: vídeo do YouTube, pasta do Drive, design do Canva, PDF…"
            obrigatorio
          >
            <input
              id="url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className={`${classesEntrada} font-mono text-sm`}
            />
          </Campo>

          <Campo id="titulo" rotulo="Título" obrigatorio>
            <input
              id="titulo"
              type="text"
              value={titulo}
              maxLength={140}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Live de treinamento — linha automotiva"
              className={`${classesEntrada} text-lg font-semibold`}
            />
          </Campo>

          <Campo id="categoria" rotulo="Categoria" obrigatorio>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={classesEntrada}
            >
              {categorias.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            id="descricao"
            rotulo="Descrição"
            ajuda="Opcional. Uma linha dizendo o que a pessoa encontra ao abrir."
          >
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              maxLength={200}
              className={classesEntrada}
              placeholder="Ex.: Gravação completa, com demonstração de aplicação."
            />
            <p className="mt-1 text-right text-xs text-ink-faint">{descricao.length}/200</p>
          </Campo>

          <Campo
            id="thumb"
            rotulo="Miniatura (URL da imagem)"
            ajuda={
              ehYoutube
                ? "Opcional: é um vídeo do YouTube, então a capa do vídeo já é usada automaticamente."
                : "Opcional. Cole o endereço de uma imagem. Sem miniatura, o card usa a cor da categoria."
            }
          >
            <input
              id="thumb"
              type="url"
              inputMode="url"
              value={thumbUrl}
              onChange={(e) => setThumbUrl(e.target.value)}
              placeholder="https://…/imagem.jpg"
              className={`${classesEntrada} font-mono text-sm`}
            />
          </Campo>

          <Campo
            id="ordem"
            rotulo="Ordem na categoria"
            ajuda="Menor aparece primeiro. Deixe 100 para seguir a data (mais novo primeiro)."
          >
            <input
              id="ordem"
              type="number"
              min={0}
              step={1}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className={`${classesEntrada} max-w-32`}
            />
          </Campo>
        </div>

        {/* ================= Barra lateral ================= */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-bold tracking-wide text-ink uppercase">Prévia</h2>
            <p className="mt-1 mb-4 text-xs text-ink-faint">
              Assim o card aparece para o distribuidor.
            </p>
            <LinkCard
              previa
              categorias={categorias}
              link={{
                id: link?.id ?? "previa",
                titulo,
                url: url.trim(),
                categoria,
                descricao,
                thumb_url: urlValida(thumbUrl) ? thumbUrl.trim() : null,
              }}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-line bg-surface p-5">
            <button
              type="button"
              onClick={() => salvar("publicado")}
              disabled={salvando}
              className={classesBotao("primario", "w-full py-3")}
            >
              {salvando ? "Salvando…" : "Publicar"}
            </button>
            <button
              type="button"
              onClick={() => salvar("rascunho")}
              disabled={salvando}
              className={classesBotao("secundario", "w-full")}
            >
              {statusAtual === "publicado" && !criando
                ? "Tirar do ar (voltar a rascunho)"
                : "Salvar rascunho"}
            </button>
            {urlValida(url) && (
              <a
                href={url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className={classesBotao("fantasma", "w-full")}
              >
                Testar o link ↗
              </a>
            )}
            <p className="text-xs leading-relaxed text-ink-faint">
              Rascunhos ficam invisíveis no portal. Só o que está publicado
              aparece para os distribuidores.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
