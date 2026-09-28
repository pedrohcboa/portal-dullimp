import type { Metadata } from "next";
import { FormularioNovaSenha } from "@/components/auth/FormularioNovaSenha";

export const metadata: Metadata = { title: "Nova senha" };

export default function PaginaNovaSenha() {
  return <FormularioNovaSenha area="admin" />;
}
