"use client";

import { useState } from "react";
import Link from "next/link";
import { MolduraAutenticacao } from "./MolduraAutenticacao";
import { Alerta, Campo, classesBotao, classesEntrada } from "@/components/admin/ui";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { AREAS, type NomeArea } from "@/lib/areas";

/**
 * Recuperação de acesso: envia um link por e-mail que leva à tela de nova
 * senha da mesma área (`/nova-senha` ou `/admin/nova-senha`).
 */
export function FormularioRecuperacao({ area }: { area: NomeArea }) {
  const config = AREAS[area];
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const supabase = criarClienteNavegador();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}${config.novaSenha}` },
      );
      if (error) throw new Error(error.message);
      setEnviado(true);
    } catch (e) {
      setErro(
        e instanceof Error
          ? `Não foi possível enviar o e-mail: ${e.message}`
          : "Erro inesperado.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MolduraAutenticacao
      selo={config.selo}
      titulo="Recuperar acesso"
      descricao="Informe o e-mail cadastrado e enviaremos um link para você criar uma senha nova."
      rodape={
        <Link
          href={config.login}
          className="font-semibold text-brand-navy hover:underline"
        >
          Voltar para o login
        </Link>
      }
    >
      {enviado ? (
        <Alerta tom="sucesso">
          Pronto. Se esse e-mail estiver cadastrado, o link de recuperação
          chegará em instantes. Confira também a caixa de spam.
        </Alerta>
      ) : (
        <form onSubmit={enviar} className="space-y-5">
          {erro && <Alerta tom="erro">{erro}</Alerta>}

          <Campo id="email-recuperacao" rotulo="E-mail cadastrado" obrigatorio>
            <input
              id="email-recuperacao"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={classesEntrada}
              placeholder="voce@empresa.com.br"
            />
          </Campo>

          <button
            type="submit"
            disabled={enviando}
            className={classesBotao("primario", "w-full py-3")}
          >
            {enviando ? "Enviando…" : "Enviar link de recuperação"}
          </button>
        </form>
      )}
    </MolduraAutenticacao>
  );
}
