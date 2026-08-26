# Houzen

Plataforma full-stack para gerenciamento de obras, equipes, suprimentos, frotas e cronogramas, com visualizações 3D interativas no frontend.

## Arquitetura

- **Frontend:** React 19 e Vite, preparado para publicação na Vercel.
- **API:** Node.js 20+ e Express, preparada para publicação no Render.
- **Banco de dados:** PostgreSQL gerenciado pelo Supabase e acessado exclusivamente pela API.
- **Autenticação com Google:** Firebase Authentication, com validação do token de ID no backend.
- **Recuperação de acesso:** fluxo manual auditável, processado por um perfil `superadmin`.
- **Controle de planos:** permissões por módulo e suspensão imediata de contas, aplicadas no backend.
- **Aparência:** tema claro ou escuro salvo individualmente no perfil de cada usuário.

```text
client/houzen-front       React/Vite
server/houzen-back       Express/PostgreSQL
server/houzen-back/database/supabase.sql
```

## Configuração local

### 1. Banco de dados no Supabase

No SQL Editor do Supabase, execute o arquivo [`server/houzen-back/database/supabase.sql`](server/houzen-back/database/supabase.sql). A migração é idempotente: preserva as tabelas e os registros existentes, converte senhas legadas em hashes seguros e adiciona os controles necessários.

Para atualizar uma instalação que já está em produção, execute apenas as migrações ainda não aplicadas da pasta [`server/houzen-back/database/migrations`](server/houzen-back/database/migrations), em ordem. A migração `20260826_user_access_and_theme.sql` adiciona as preferências de tema e o motivo de suspensão sem bloquear nem reescrever registros existentes.

Para executar um backend persistente no Render, abra a opção **Connect** no Supabase e copie a URL de conexão do **Session pooler**, na porta `5432`. A conexão direta geralmente exige suporte a IPv6. Nunca coloque a variável `DATABASE_URL` no frontend nem a publique no GitHub.

Baixe o certificado em **Database Settings → SSL Configuration** e adicione seu conteúdo à variável `DATABASE_CA_CERT`. Mantenha `DATABASE_SSL_REJECT_UNAUTHORIZED=true` para validar o certificado do servidor.

### 2. Backend

```bash
cd server/houzen-back
cp .env.example .env
npm install
npm run dev
```

No Windows PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

Preencha as variáveis descritas em [`server/houzen-back/.env.example`](server/houzen-back/.env.example). Gere um valor seguro para `JWT_SECRET` com o comando:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Para tornar a primeira conta SuperAdmin, registre uma conta normalmente. Depois, execute o comando abaixo no SQL Editor, substituindo o e-mail pelo endereço correto:

```sql
UPDATE usuarios
SET nivel = 'superadmin'
WHERE lower(email) = lower('voce@exemplo.com');
```

Mantenha poucas contas com esse perfil. Um `superadmin` possui as permissões administrativas e também pode processar solicitações de recuperação de acesso.

### 3. Frontend

```bash
cd client/houzen-front
cp .env.example .env
npm install
npm run dev
```

No Windows PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

Configure apenas as variáveis públicas com o prefixo `VITE_*`, conforme descrito em [`client/houzen-front/.env.example`](client/houzen-front/.env.example). A variável `VITE_API_URL` deve conter somente a origem da API, sem `/api/auth` no final.

## Recuperação manual de acesso

O usuário solicita a recuperação informando o e-mail cadastrado e um contato por WhatsApp ou e-mail alternativo. A resposta pública é sempre genérica para não revelar se uma conta existe.

O contato informado no formulário público não comprova a identidade do solicitante. Antes de gerar qualquer senha, o SuperAdmin deve confirmar a pessoa por um canal independente e registrar essa verificação no painel. Depois disso, pode rejeitar o pedido ou gerar uma senha temporária. A senha:

- é exibida uma única vez ao SuperAdmin;
- é armazenada no banco somente como hash bcrypt;
- expira após 24 horas;
- deve ser enviada ao usuário por um canal externo;
- bloqueia o acesso aos módulos até o usuário cadastrar uma nova senha;
- não pode ser reutilizada como a nova senha definitiva.

As variáveis `RESEND_API_KEY` e `RESEND_FROM` permanecem reservadas para uma futura integração de notificações e não são necessárias para esse fluxo.

## Planos, permissões e suspensão

Somente o `superadmin` pode alterar o perfil, os módulos contratados e o status de uma conta. As permissões são verificadas tanto na navegação quanto em cada grupo de endpoints da API; esconder um item do menu não é usado como barreira de segurança.

Ao alterar módulos ou suspender uma conta, as sessões anteriores do usuário são revogadas. Contas suspensas recebem uma mensagem definida pelo SuperAdmin, que pode explicar uma pendência financeira ou outro motivo administrativo. Reativar a conta permite um novo login com os módulos atualmente contratados.

Cada perfil pode escolher tema claro ou escuro em **Configurações**. A preferência fica salva no banco e é aplicada somente ao ambiente autenticado; a landing page preserva sua identidade visual original.

## Publicação

### API no Render

- **Root Directory:** `server/houzen-back`
- **Runtime:** Node
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Variáveis de ambiente:** copie as variáveis de `.env.example` e preencha-as com os valores de produção.

Em atualizações com migração, execute primeiro o SQL no Supabase, depois publique a API e por último o frontend. Essa ordem mantém o backend compatível durante a implantação.

### Frontend na Vercel

- **Root Directory:** `client/houzen-front`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Variáveis de ambiente:** configure somente `VITE_API_URL` e as chaves públicas do Firebase para aplicações web.

Adicione o domínio final da Vercel à variável `FRONTEND_URLS` no backend e à lista de domínios autorizados do Firebase Authentication.

## Segurança

- A API não confia em identificadores de usuário enviados pelo navegador.
- As rotas privadas exigem um JWT válido.
- As rotas administrativas verificam o nível de acesso do usuário no banco de dados.
- As permissões de módulo são verificadas pelo backend em todas as operações correspondentes.
- Somente o SuperAdmin pode alterar planos, suspender contas ou excluir usuários; a mudança revoga sessões anteriores.
- O token do Firebase é verificado por assinatura, emissor, audiência e prazo de validade.
- As consultas validam a propriedade dos recursos para impedir o acesso entre contas diferentes.
- As senhas são protegidas com bcrypt.
- A recuperação de senha não confirma se um endereço está cadastrado e só pode ser processada por um SuperAdmin.
- Contas com senha temporária não acessam os módulos até concluírem a troca obrigatória.
- O CORS utiliza uma lista de origens permitidas.
- Helmet, limite de tamanho do corpo das requisições e limitação de frequência estão habilitados.
- Os papéis (`roles`) `anon` e `authenticated` do Supabase não têm acesso às tabelas da aplicação, pois todos os dados passam pela API.
- Arquivos `.env`, certificados, builds e diretórios `node_modules` são ignorados pelo Git.

## Verificações do projeto

### Backend

```bash
cd server/houzen-back
npm run check
npm test
npm run check:db
npm audit
```

### Frontend

```bash
cd client/houzen-front
npm run lint
npm run build
npm audit
```

O comando `npm run check:db` executa somente consultas de leitura e informa quais tabelas ainda não foram criadas no Supabase.
