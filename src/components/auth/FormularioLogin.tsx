"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MolduraAutenticacao } from "./MolduraAutenticacao";
import { AvisoSemBackend } from "./AvisoSemBackend";
import { Alerta, Campo, classesBotao, classesEntrada } from "@/components/admin/ui";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { AREAS, type NomeArea } from "@/lib/areas";
import { destinoSeguro } from "@/lib/utils";

/** Avisos que chegam por `?aviso=` (ex.: vindos de /auth/confirmar). */
const AVISOS: Record<string, { tom: "sucesso" | "aviso"; texto: string }> = {
  confirmado: {
    tom: "sucesso",
    texto: "E-mail confirmado! Agora é só entrar com o seu e-mail e senha.",
  },
  verifique: {
    tom: "aviso",
    texto:
      "Se você acabou de clicar no link de confirmação, seu e-mail já deve estar confirmado: entre com seu e-mail e senha.",
  },
  "link-invalido": {
    tom: "aviso",
    texto:
      "Esse link de confirmação expirou ou já foi usado. Tente entrar; se não conseguir, cadastre-se de novo para receber outro link.",
  },
};

/**
 * Tela de entrada (Supabase Auth, e-mail + senha) — do distribuidor
 * (`/entrar`) e do gestor (`/admin/login`).
 * Mensagens de erro traduzidas: ninguém aqui deve ver texto em inglês.
 */
export function FormularioLogin({ area }: { area: NomeArea }) {
  const config = AREAS[area];
  const router = useRouter();
  const parametros = useSearchParams();
  const proximo = parametros.get("proximo");
  const aviso = AVISOS[parametros.get("aviso") ?? ""];

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const supabase = criarClienteNavegador();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) {
        setErro(traduzirErroLogin(error.message));
        return;
      }

      const destino = destinoSeguro(proximo, config.inicio);
      // `refresh` faz o servidor reler os cookies de sessão recém-gravados.
      router.replace(
        destino.startsWith(config.prefixoDestino) ? destino : config.inicio,
      );
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado ao entrar.");
    } finally {
      setEnviando(false);
    }
  }

  if (!SUPABASE_CONFIGURADO) return <AvisoSemBackend selo={config.selo} />;

  const distribuidor = area === "distribuidor";

  return (
    <MolduraAutenticacao
      selo={config.selo}
      titulo={distribuidor ? "Entrar no portal" : "Entrar no painel"}
      descricao={
        distribuidor
          ? "Use o e-mail cadastrado na Dullimp para acessar treinamentos, artes e materiais."
          : "Área dos gestores Dullimp: links, categorias, distribuidores e métricas."
      }
      voltar={distribuidor ? undefined : { href: "/", rotulo: "Ir para o portal" }}
      rodape={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={config.recuperar}
            className="font-semibold text-brand-navy hover:underline"
          >
            Esqueci minha senha
          </Link>
          {config.cadastro && (
            <Link
              href={config.cadastro}
              className="font-semibold text-brand-terracotta-deep hover:underline"
            >
              Primeiro acesso? Criar conta
            </Link>
          )}
        </div>
      }
    >
      <form onSubmit={entrar} className="space-y-5">
        {aviso && <Alerta tom={aviso.tom}>{aviso.texto}</Alerta>}
        {erro && <Alerta tom="erro">{erro}</Alerta>}

        <Campo id="email" rotulo="E-mail" obrigatorio>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={classesEntrada}
            placeholder="voce@empresa.com.br"
          />
        </Campo>

        <Campo id="senha" rotulo="Senha" obrigatorio>
          <input
            id="senha"
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={classesEntrada}
            placeholder="••••••••"
          />
        </Campo>

        <button
          type="submit"
          disabled={enviando}
          className={classesBotao("primario", "w-full py-3")}
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </MolduraAutenticacao>
  );
}

function traduzirErroLogin(mensagem: string): string {
  if (mensagem.includes("Invalid login credentials")) {
    return "E-mail ou senha incorretos. Confira e tente de novo.";
  }
  if (mensagem.includes("Email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Abra o link que enviamos no cadastro (confira também o spam).";
  }
  return `Não foi possível entrar: ${mensagem}`;
}
