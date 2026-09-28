import { aparenciaPorCor } from "@/lib/categorias";
import { cn } from "@/lib/utils";

/**
 * Tag de categoria. Recebe o token de cor da categoria (não o slug) — a
 * paleta em `lib/categorias.ts` já garante contraste AA em toda entrada
 * (branco só sobre navy, verde-deep, terracota-deep e cinza pedra).
 */
export function ChipCategoria({
  cor,
  nome,
  className,
}: {
  cor: string;
  nome: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[0.6875rem] font-bold tracking-[0.08em] uppercase",
        aparenciaPorCor(cor).chip,
        className,
      )}
    >
      {nome}
    </span>
  );
}
