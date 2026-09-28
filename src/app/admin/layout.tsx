import type { Metadata } from "next";

/**
 * Layout raiz do /admin.
 *
 * Aqui só definimos os metadados; o cabeçalho, a navegação e a verificação de
 * permissão vivem em `(painel)/layout.tsx`, para que as telas de login e de
 * recuperação de senha fiquem fora da área protegida.
 */
export const metadata: Metadata = {
  title: {
    default: "Administrador · Portal Dullimp",
    template: "%s · Administrador Dullimp",
  },
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-canvas">{children}</div>;
}
