# Portal Dullimp

Central de conteúdo dos **distribuidores Dullimp**. O distribuidor faz login e
encontra, num lugar só, os links que a Dullimp disponibiliza — lives de
treinamento, artes de post, materiais e produtos. O conteúdo mora fora
(YouTube, Drive, Canva…); o portal **organiza os links por categoria, atrás de
um login**, e mede quais links são realmente usados.

Os gestores da Dullimp administram tudo sozinhos em `/admin`: links,
categorias, quem pode entrar (allowlist de distribuidores) e métricas.

> **Para quem vai cadastrar os links:** leia o
> [**Guia do Gestor**](./GUIA-DO-GESTOR.md) — passo a passo, sem termo técnico.
> Este README é a documentação de quem cuida do código e do setup.

Projeto derivado do esqueleto do Ecoville News (portal de conteúdo por
categorias). Diferenças: identidade Dullimp, leitura **fechada** (login +
allowlist) e a unidade de conteúdo é um **link externo**, não uma newsletter
escrita no editor.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Aplicação | Next.js 16.3 (App Router, React 19, TypeScript) — o middleware chama-se `src/proxy.ts` |
| Estilo | Tailwind CSS v4, tokens da marca em `@theme` (`src/app/globals.css`) |
| Banco / Auth | Supabase (`@supabase/ssr`) |
| Analytics | Vercel Web Analytics + eventos próprios na tabela `events` |
| Fontes | Satoshi (self-hosted em `public/fonts/`) + Inter (`next/font/google`) |

Sem biblioteca de gráficos, de ícones ou de editor rico.

---

## Setup (passo a passo de entrega)

### 1. Projeto Supabase

Crie um projeto **novo** (região `sa-east-1`, plano Pro — conteúdo de cliente,
sem pausing). Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

(`SUPABASE_SERVICE_ROLE_KEY` é opcional — veja [Métricas](#métricas).)

### 2. Banco

No **SQL Editor**, rode em ordem os arquivos de `supabase/migrations/`:

1. `0001_schema_completo.sql` — tabelas (`categorias`, `links`, `events`,
   `editores`, `distribuidores_autorizados`), RLS, hook de cadastro, funções de
   métricas e as três categorias da Dullimp. É idempotente: pode rodar de novo.
2. `0002_dados_de_exemplo.sql` — quatro links de exemplo (opcional; apontam
   para example.com).
3. `0003_travar_gestores.sql` — remove o antigo “primeiro gestor automático”
   de bancos criados com versões anteriores do 0001 (num banco novo não faz
   nada; pode rodar sem medo).

### 3. Autenticação (Dashboard → Authentication)

- **Sign In / Providers → Email:** deixe **Confirm email ligado**.
  **Obrigatório** — a autorização do distribuidor compara o e-mail do login
  com a allowlist; sem confirmação, alguém poderia criar conta com o e-mail de
  outra pessoa.
- **URL Configuration:** *Site URL* = domínio final (ex.:
  `https://portal.dullimp.com.br`). Em *Redirect URLs* adicione
  `https://SEU-DOMINIO/**` (e `http://localhost:3000/**` para desenvolvimento).
- **Email Templates → Confirm signup (recomendado):** troque o link por
  ```
  {{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email
  ```
  Assim a confirmação funciona mesmo quando a pessoa se cadastra no computador
  e abre o e-mail no celular. Com o template padrão também funciona, mas só no
  mesmo navegador do cadastro (em outro, o e-mail é confirmado e a pessoa cai
  no login com o aviso “E-mail confirmado! Agora é só entrar”).

### 4. Primeiro gestor (antes de ativar o hook)

Ninguém vira gestor sozinho — não existe promoção automática. Com o hook
ainda desligado, o cadastro está aberto (isso não expõe nada: a RLS só mostra
conteúdo a quem está numa das allowlists):

1. crie sua conta em `/cadastro` e confirme o e-mail;
2. no SQL Editor, coloque-se em `editores`:
   ```sql
   insert into public.editores (user_id, email, nome)
   select id, lower(email), 'Seu nome' from auth.users
   where email = 'voce@dullimp.com.br';
   ```
3. entre em `/admin/login`.

Demais gestores: veja [Gestores](#gestores).

### 5. Ativar o hook de cadastro

**Authentication → Hooks → Before user created → Postgres →
`public.hook_restringir_signup`**. A partir daí só se cadastra quem está em
`distribuidores_autorizados` (ou já é gestor em `editores`).

> O hook é **conveniência de UX** (a pessoa recebe “e-mail não autorizado” na
> hora). A barreira de verdade é a RLS: mesmo com o hook desligado, uma conta
> fora da allowlist lê zero links.

### 6. Importar a planilha de distribuidores

Duas opções:

- **Pelo painel (mais simples):** `/admin/distribuidores` → *Importar da
  planilha* → copie as colunas e-mail, nome e CNPJ da planilha e cole. O
  painel normaliza para minúsculas e ignora linhas sem e-mail válido.
- **Pelo Supabase:** Table Editor → `distribuidores_autorizados` → *Import
  data from CSV* (colunas `email`, `nome`, `cnpj`). **E-mails em minúsculas** —
  o banco recusa maiúsculas (CHECK `distribuidores_email_minusculo`).

### 7. Rodar e publicar

```bash
npm install
npm run dev     # http://localhost:3000
```

Deploy na Vercel: importe o repositório, configure as variáveis do passo 1 e
ative **Web Analytics** no projeto.

---

## Modelo de acesso

| Quem | Como entra | O que vê / faz |
|---|---|---|
| Sem sessão | — | Só as telas de login/cadastro. `anon` não tem permissão em nenhuma tabela. |
| Logado fora da allowlist | Conta antiga, ou e-mail removido depois | Tela “Acesso não liberado”. No banco, **0 linhas** de `links`. |
| Distribuidor | E-mail em `distribuidores_autorizados` | Links **publicados** e categorias. Registra eventos de uso. |
| Gestor | Conta em `editores` | Tudo acima + rascunhos, gestão de links/categorias/distribuidores e métricas. |

Três camadas, de fora para dentro:

1. **`src/proxy.ts`** — sem sessão, qualquer rota de conteúdo redireciona para
   `/entrar?proximo=...` (e `/admin/*` para `/admin/login`). Livres:
   `/entrar`, `/cadastro`, `/recuperar`, `/nova-senha`, `/auth/*` e assets.
2. **Layouts** — `(publico)/layout.tsx` confere `eh_distribuidor()` /
   `eh_editor()`; `admin/(painel)/layout.tsx` confere `editores`.
3. **RLS** (o cofre) — em `0001_schema_completo.sql`:
   - `links`: `select` para `authenticated` com
     `(status = 'publicado' and eh_distribuidor()) or eh_editor()`; escrita só
     `eh_editor()`;
   - `categorias`: `select` para `authenticated`; escrita só gestor;
   - `distribuidores_autorizados`, `editores`: só gestor;
   - `events`: `insert` para `authenticated` (tipos conhecidos, tamanhos
     limitados); `select` só gestor.

`eh_distribuidor()` compara `lower(auth.jwt() ->> 'email')` com a allowlist —
por isso os e-mails ficam sempre em minúsculas e a confirmação de e-mail
precisa estar ligada.

### Gestores

`editores` é a allowlist do `/admin`, ligada à conta (`user_id`). **Não há
cadastro de gestor pela interface nem promoção automática**: o `/admin` só faz
login, e quem entra na tabela é decidido por quem já administra o projeto no
SQL Editor. Para liberar um novo gestor:

1. adicione o e-mail dele em **Distribuidores** no painel (libera o cadastro);
2. ele cria a conta em `/cadastro` e confirma o e-mail;
3. no SQL Editor:
   ```sql
   insert into public.editores (user_id, email, nome)
   select id, lower(email), 'Nome do gestor' from auth.users
   where email = 'novo@dullimp.com.br';
   ```
   (Depois disso, pode remover o e-mail de Distribuidores se quiser: gestor lê
   o conteúdo por `eh_editor()`.)

### Como testar a RLS

No SQL Editor, simule cada papel:

```sql
-- sem sessão: deve dar "permission denied"
set role anon; select * from links; reset role;

-- logado fora da allowlist: 0 linhas
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","email":"qualquer@x.com","role":"authenticated"}', true);
set local role authenticated;
select count(*) from links;
rollback;
```

---

## Métricas

1. **Vercel Web Analytics** (`<Analytics />` no layout raiz) — tráfego agregado.
2. **Eventos próprios** — *qual link* foi clicado, *em qual categoria*:
   `LinkExternoRastreado` → `src/lib/analytics.ts` (`sendBeacon`) →
   `POST /api/eventos` (exige sessão; valida tipo e tamanhos) → tabela `events`
   → funções `metricas_*` → `/admin/metricas`.

Tipos de evento: `click` (com `link_id` quando é um card de link), `pageview`,
`busca`, `filtro_categoria`. O painel mostra **links mais clicados**
(`metricas_top_links`), **cliques por categoria**
(`metricas_cliques_por_categoria` — usa a categoria gravada no clique, então
sobrevive à exclusão do link), evolução diária, cliques por botão e termos
buscados.

`SUPABASE_SERVICE_ROLE_KEY` (opcional, só no servidor): faz `/api/eventos`
gravar com a chave de serviço. Sem ela, grava com a sessão de quem clicou via
política `events_insercao_autenticado`.

**Privacidade:** o evento não guarda quem clicou — nem e-mail, nem `user_id`,
nem IP. O `session_id` é um UUID aleatório em `sessionStorage`.

Para rastrear um botão novo: `<LinkRastreado alvo="nome_do_botao">` e rótulo em
`NOMES_DE_BOTAO` (`src/app/admin/(painel)/metricas/page.tsx`).

---

## Identidade visual

Tokens em `src/app/globals.css` (`@theme`), do manual de marca:

| Token | Hex | Papel |
|---|---|---|
| `brand-navy` (+ `-deep`, `-soft`) | `#163A5F` | Dominante: header, footer, hero, títulos, botões secundários |
| `brand-terracotta` (+ `-deep`, `-dark`, `-soft`) | `#D47C4C` | Acento quente / CTA |
| `brand-green` (+ `-deep`, `-soft`) | `#058A35` | Acento de identidade (a folha): selos, confirmações |
| `brand-gray` | `#6B6B6B` | Neutro técnico |
| `surface` | `#FFFFFF` | Superfície |

Contraste: branco sobre a terracota pura (3.1:1) e sobre o verde puro (4.48:1)
não passa AA para texto pequeno — por isso CTA e chips usam as variantes
`-deep` (`#A9582F`, `#046B29`), e as cores puras ficam para capas, ícones e
faixas. Nos gráficos, as cores de dado são `#1F5F9E` / `#B8663A` (validadas
para daltonismo) — ver `src/components/admin/Graficos.tsx`.

**Tipografia:** Satoshi Bold nos títulos (self-hosted via `next/font/local`,
licença FFL em `public/fonts/FFL.txt`) e Inter no texto corrido, botões e
labels.

**Logo:** `src/components/brand/Wordmark.tsx` — caminhos extraídos do vetor
original (`DULLIMP_LOGO_SEC.ai`), em `currentColor`; `variante="simbolo"` desenha
só o “D” com a folha. Favicon: `src/app/icon.svg`.

### Paleta de categorias (finita e espelhada)

Cada categoria guarda um token em `categorias.cor` (`navy`, `verde`,
`terracota`, `cinza`) e um ícone em `categorias.icone` (`play`, `imagem`,
`frasco`, `documento`, `megafone`, `estrela`). Os dois são listas fechadas em
`src/lib/categorias.ts` (`PALETA`, `ICONES`) **espelhadas** pelos CHECKs
`categorias_cor_valida` e `categorias_icone_valido`, porque o Tailwind só gera
CSS para classes escritas por inteiro no código. Para acrescentar uma cor ou
ícone: entrada em `categorias.ts` + SVG em `src/components/ui/Icones.tsx` +
CHECK no banco. Criar, renomear, recolorir e reordenar categorias não exige
deploy.

Mapeamento inicial: Treinamentos → `navy` / `play`; Artes e Materiais →
`terracota` / `imagem`; Produtos → `verde` / `frasco`.

---

## Não divulgação

- `robots` global `noindex, nofollow` em `src/app/layout.tsx`;
- `src/app/robots.ts` bloqueia todos os agentes;
- `X-Robots-Tag: noindex, nofollow, noarchive` em `next.config.ts`;
- sem sitemap; todo o conteúdo atrás do login.

---

## Modo demonstração

Sem as variáveis do Supabase, a área do distribuidor abre **sem login** com os
links de `src/lib/seed-data.ts` e uma faixa avisando disso; login e painel
mostram “Backend não configurado”. Com Supabase configurado, uma falha de
consulta vira lista vazia — nunca conteúdo de exemplo.

---

## Estrutura

```
src/
  app/
    (publico)/            área do distribuidor — home e categorias/[slug] (exige login)
    (auth)/               entrar, cadastro, recuperar, nova-senha (distribuidor)
    auth/confirmar/       volta do link de confirmação de e-mail
    admin/
      login|recuperar|nova-senha/   fora da área protegida
      (painel)/           links (lista, nova, editar/[id]), categorias,
                          distribuidores, métricas — exige gestor
    api/eventos/          coleta de eventos (exige sessão)
  components/
    auth/                 formulários de login/cadastro/senha (as duas áreas)
    admin/                formulário e lista de links, gestão de categorias e
                          distribuidores, gráficos
    site/                 header, footer, hero, LinkCard, catálogo, rastreadores
    brand/Wordmark.tsx    logo oficial
    ui/Icones.tsx         ícones SVG
  lib/
    areas.ts              rotas das duas portas (distribuidor / admin)
    data.ts               leitura + verificação de acesso
    analytics.ts          disparo de eventos
    categorias.ts         paleta e ícones + fallback de demonstração
    supabase/             clientes navegador / servidor / serviço
  proxy.ts                sessão e proteção de todo o portal
supabase/migrations/      schema versionado
```

## Comandos

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção (roda o TypeScript)
npm run lint     # ESLint
```
