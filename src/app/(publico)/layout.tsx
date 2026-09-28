import { redirect } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RastreadorDePagina } from "@/components/site/RastreadorDePagina";
import { MolduraAutenticacao } from "@/components/auth/MolduraAutenticacao";
import { BotaoSair } from "@/components/auth/BotaoSair";
import { Alerta } from "@/components/admin/ui";
import { listarCategorias, verificarAcesso } from "@/lib/data";
import { AREAS } from "@/lib/areas";

/**
 * Layout da área do distribuidor — **fechada**.
 *
 * Três camadas, de propósito:
 *  - o proxy manda para `/entrar` quem não tem sessão;
 *  - este layout confere no servidor se a conta está na allowlist
 *    (`eh_distribuidor()`) ou é de gestor, e explica quando não está;
 *  - a RLS garante que, mesmo que as duas primeiras falhem, o banco não
 *    entregue nada.
 *
 * O painel `/admin` tem o seu próprio layout e não passa por aqui.
 */
export default async function LayoutDistribuidor({ children }: LayoutProps<"/">) {
  const acesso = await verificarAcesso();

  if (acesso.estado === "sem-sessao") redirect(AREAS.distribuidor.login);

  if (acesso.estado === "nao-autorizado") {
    return (
      <MolduraAutenticacao
        selo={AREAS.distribuidor.selo}
        titulo="Acesso não liberado"
        descricao="Sua conta existe, mas este e-mail não está na lista de distribuidores autorizados da Dullimp."
        rodape={<BotaoSair area="distribuidor" />}
      >
        <Alerta tom="aviso">
          Você entrou como <strong>{acesso.email}</strong>. Se esse não é o
          e-mail que a Dullimp tem cadastrado, saia e entre com o correto. Caso
          contrário, fale com o seu contato comercial para liberar o acesso.
        </Alerta>
      </MolduraAutenticacao>
    );
  }

  const categorias = await listarCategorias();
  const liberado = acesso.estado === "liberado" ? acesso : null;

  return (
    <>
      <Header
        categorias={categorias}
        email={liberado?.email}
        ehGestor={liberado?.ehGestor}
      />
      <main id="conteudo-principal" className="flex-1">
        {children}
      </main>
      <Footer categorias={categorias} />
      <RastreadorDePagina />
    </>
  );
}
