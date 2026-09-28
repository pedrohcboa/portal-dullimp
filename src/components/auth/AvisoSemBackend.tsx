import { MolduraAutenticacao } from "./MolduraAutenticacao";
import { Alerta } from "@/components/admin/ui";

/** Tela exibida nas rotas de login quando o Supabase não está configurado. */
export function AvisoSemBackend({ selo }: { selo: string }) {
  return (
    <MolduraAutenticacao
      selo={selo}
      titulo="Backend não configurado"
      descricao="O login precisa das credenciais do Supabase para funcionar."
      voltar={{ href: "/", rotulo: "Ver o portal em modo demonstração" }}
    >
      <Alerta tom="aviso">
        Preencha <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no
        arquivo <code className="font-mono">.env.local</code> e reinicie o
        servidor.
      </Alerta>
    </MolduraAutenticacao>
  );
}
