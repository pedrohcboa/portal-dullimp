"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MolduraAutenticacao } from "./MolduraAutenticacao";
import { AvisoSemBackend } from "./AvisoSemBackend";
import { Alerta, Campo, classesBotao, classesEntrada } from "@/components/admin/ui";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { AREAS } from "@/lib/areas";

const MINIMO_SENHA = 8;

/**
 * Cadastro self-service do distribuidor (e-mail + senha).
 *
 * Quem decide se o e-mail pode entrar é o hook "Before User Created" do
 * Supabase (`hook_restringir_signup`), que consulta a allowlist
 * `distribuidores_autorizados`. Este formulário só traduz a resposta. Não há
 * pré-checagem no navegador de propósito: a allowlist não é legível sem login,
 * para não virar uma lista pública de clientes.
 */
export function FormularioCadastro() {
  const config = AREAS.distribuidor;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<React.ReactNode | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  async function cadastrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < MINIMO_SENHA) {
      setErro(`A senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setErro("As duas senhas não são iguais.");
      return;
    }

    setEnviando(true);
    const endereco = email.trim().toLowerCase();

    try {
      const supabase = criarClienteNavegador();
      const { data, error } = await supabase.auth.signUp({
        email: endereco,
        password: senha,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirmar`,
        },
      });

      if (error) {
        setErro(traduzirErroCadastro(error.message, error.status));
        return;
      }

      // Com "Confirm email" desligado o Supabase já devolve a sessão.
      if (data.session) {
        router.replace(config.inicio);
        router.refresh();
        return;
      }

      setEnviadoPara(endereco);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado no cadastro.");
    } finally {
      setEnviando(false);
    }
  }

  if (!SUPABASE_CONFIGURADO) return <AvisoSemBackend selo={config.selo} />;

  return (
    <MolduraAutenticacao
      selo={config.selo}
      titulo={enviadoPara ? "Confirme seu e-mail" : "Criar conta"}
      descricao={
        enviadoPara
          ? "Falta só um passo."
          : "Use o e-mail que você cadastrou na Dullimp. Só distribuidores autorizados conseguem criar conta."
      }
      rodape={
        <Link
          href={config.login}
          className="font-semibold text-brand-navy hover:underline"
        >
          Já tenho conta — entrar
        </Link>
      }
    >
      {enviadoPara ? (
        <Alerta tom="sucesso">
          Enviamos um link de confirmação para <strong>{enviadoPara}</strong>.
          Abra o e-mail e clique no link para ativar sua conta. Não chegou?
          Confira a caixa de spam.
        </Alerta>
      ) : (
        <form onSubmit={cadastrar} className="space-y-5">
          {erro && <Alerta tom="erro">{erro}</Alerta>}

          <Campo id="email" rotulo="E-mail cadastrado na Dullimp" obrigatorio>
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

          <Campo
            id="senha"
            rotulo="Crie uma senha"
            ajuda={`Pelo menos ${MINIMO_SENHA} caracteres.`}
            obrigatorio
          >
            <input
              id="senha"
              type="password"
              required
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={classesEntrada}
            />
          </Campo>

          <Campo id="confirmar-senha" rotulo="Repita a senha" obrigatorio>
            <input
              id="confirmar-senha"
              type="password"
              required
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className={classesEntrada}
            />
          </Campo>

          <button
            type="submit"
            disabled={enviando}
            className={classesBotao("primario", "w-full py-3")}
          >
            {enviando ? "Criando conta…" : "Criar conta"}
          </button>
        </form>
      )}
    </MolduraAutenticacao>
  );
}

function traduzirErroCadastro(mensagem: string, status?: number): React.ReactNode {
  // Resposta do hook `hook_restringir_signup` (HTTP 403).
  if (status === 403 || /não autorizado/i.test(mensagem)) {
    return (
      <>
        <strong>Este e-mail não está na lista de distribuidores Dullimp.</strong>{" "}
        Use exatamente o e-mail que você informou à Dullimp. Se ele mudou ou
        você ainda não tem cadastro, fale com o seu contato comercial para
        liberar o acesso.
      </>
    );
  }
  if (/already registered|already exists/i.test(mensagem)) {
    return "Já existe uma conta com este e-mail. Entre com sua senha ou use “Esqueci minha senha”.";
  }
  if (/password/i.test(mensagem)) {
    return "Essa senha não foi aceita. Use pelo menos 8 caracteres, misturando letras e números.";
  }
  if (/rate limit|too many/i.test(mensagem)) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
  }
  return `Não foi possível criar a conta: ${mensagem}`;
}
