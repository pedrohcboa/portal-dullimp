import { NextResponse } from "next/server";
import { criarClienteServidor, criarClienteServico } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";

/**
 * Coleta de eventos de uso.
 * -------------------------------------------------------------------------
 * Recebe os eventos disparados por `src/lib/analytics.ts` e grava em
 * `public.events`.
 *
 * Só aceita quem está logado (o portal é fechado, então não há motivo para
 * aceitar evento anônimo — e isso impede que alguém de fora infle as
 * métricas). Mesmo assim, **não** gravamos quem clicou: nem e-mail, nem
 * user_id, nem IP. Só o tipo, o alvo, o link, a categoria, o caminho, o
 * referrer e o user-agent truncado. O `session_id` é aleatório e vive só
 * enquanto a aba estiver aberta.
 */

/** Tipos aceitos — precisa bater com a política RLS `events_insercao_autenticado`. */
const TIPOS_VALIDOS = new Set(["pageview", "click", "busca", "filtro_categoria"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Corta strings para não deixar o cliente inflar a tabela. */
function limitar(valor: unknown, max: number): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo ? limpo.slice(0, max) : null;
}

export async function POST(request: Request) {
  // Sem backend configurado, o portal funciona em modo demonstração e os
  // eventos simplesmente não são gravados.
  if (!SUPABASE_CONFIGURADO) {
    return new NextResponse(null, { status: 204 });
  }

  const sessao = await criarClienteServidor();
  const {
    data: { user },
  } = await sessao.auth.getUser();
  if (!user) {
    return new NextResponse(null, { status: 401 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const tipo = limitar(corpo.tipo, 40);
  if (!tipo || !TIPOS_VALIDOS.has(tipo)) {
    return NextResponse.json({ erro: "Tipo de evento inválido" }, { status: 400 });
  }

  const linkId = limitar(corpo.link_id, 36);
  const registro = {
    tipo,
    alvo: limitar(corpo.alvo, 120),
    // Só aceitamos UUID para não quebrar a foreign key com lixo.
    link_id: linkId && UUID.test(linkId) ? linkId : null,
    categoria: limitar(corpo.categoria, 60),
    path: limitar(corpo.path, 300),
    session_id: limitar(corpo.session_id, 64),
    referrer: limitar(request.headers.get("referer"), 300),
    user_agent: limitar(request.headers.get("user-agent"), 300),
  };

  // Preferimos a service key (ignora RLS) quando ela existe; caso contrário a
  // própria sessão grava via política de INSERT restrita a `authenticated`.
  const supabase = criarClienteServico() ?? sessao;
  const { error } = await supabase.from("events").insert(registro);

  if (error) {
    console.error("[portal-dullimp] falha ao registrar evento:", error.message);
    // Analytics nunca deve virar erro visível para o distribuidor.
  }

  return new NextResponse(null, { status: 204 });
}
