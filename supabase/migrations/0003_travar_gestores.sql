-- =====================================================================
-- 0003 — Trava a entrada de gestores
-- ---------------------------------------------------------------------
-- Remove o "primeiro gestor automático" (`reivindicar_primeiro_editor`):
-- enquanto a tabela `editores` estava vazia, qualquer conta que abrisse o
-- /admin virava gestor. O primeiro gestor já foi definido; daqui em diante
-- ninguém vira gestor sozinho.
--
-- Novos gestores entram só por INSERT em `editores`, feito por quem já
-- administra o projeto no SQL Editor (ver README, "Gestores").
-- =====================================================================

drop function if exists public.reivindicar_primeiro_editor();
