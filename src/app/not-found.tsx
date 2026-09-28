import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

/** Página 404 — mantém a marca e devolve o distribuidor ao início. */
export default function NaoEncontrada() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="flex flex-col items-center text-center">
        <Wordmark tamanho="lg" />
        <p className="mt-8 font-display text-6xl font-bold text-brand-navy">404</p>
        <h1 className="mt-4 text-2xl text-ink">Esta página não está por aqui</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">
          O endereço pode ter mudado ou o material foi retirado do portal.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg bg-brand-terracotta-deep px-6 py-3 font-bold text-white hover:bg-brand-terracotta-dark"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
