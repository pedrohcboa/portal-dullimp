import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Moldura das telas de autenticação (entrar, cadastro, recuperar senha, nova
 * senha) — do distribuidor e do gestor. Um cartão centralizado sobre o navy
 * da marca, sem distrações.
 */
export function MolduraAutenticacao({
  titulo,
  descricao,
  selo,
  children,
  rodape,
  voltar,
}: {
  titulo: string;
  descricao: React.ReactNode;
  /** Texto abaixo do logo ("Portal do Distribuidor", "Painel do gestor"). */
  selo: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  /** Link discreto abaixo do cartão (ex.: do painel de volta ao portal). */
  voltar?: { href: string; rotulo: string };
}) {
  return (
    <div className="on-navy flex min-h-dvh flex-col items-center justify-center bg-brand-navy px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark tom="claro" tamanho="lg" />
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-white/85">
            <span aria-hidden className="size-2 rounded-full bg-brand-green" />
            {selo}
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-7 shadow-xl sm:p-9">
          <h1 className="text-2xl text-ink">{titulo}</h1>
          <div className="mt-2 text-sm leading-relaxed text-ink-muted">
            {descricao}
          </div>
          <div className="mt-6">{children}</div>
          {rodape && <div className="mt-6 text-sm">{rodape}</div>}
        </div>

        {voltar && (
          <p className="mt-6 text-center text-sm text-white/75">
            <Link href={voltar.href} className="underline hover:text-white">
              {voltar.rotulo}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
