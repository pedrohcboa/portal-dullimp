import { Suspense } from "react";
import type { Metadata } from "next";
import { FormularioLogin } from "@/components/auth/FormularioLogin";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
  // `useSearchParams` (usado para voltar à página pretendida após o login)
  // exige uma fronteira de Suspense.
  return (
    <Suspense fallback={null}>
      <FormularioLogin area="admin" />
    </Suspense>
  );
}
