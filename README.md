# Houzen

Plataforma full-stack para gerenciamento de obras, equipes, suprimentos, frotas e cronogramas, com visualizações 3D interativas no frontend.

## Arquitetura

- **Frontend:** React 19 e Vite, preparado para publicação na Vercel.
- **API:** Node.js 20+ e Express, preparada para publicação no Render.
- **Banco de dados:** PostgreSQL gerenciado pelo Supabase e acessado exclusivamente pela API.
- **Autenticação com Google:** Firebase Authentication, com validação do token de ID no backend.
- **E-mails:** Resend para o envio das mensagens de recuperação de senha.

```text
client/houzen-front       React/Vite
server/houzen-back       Express/PostgreSQL
server/houzen-back/database/supabase.sql
```

## Configuração local

### 1. Banco de dados no Supabase

No SQL Editor do Supabase, execute o arquivo [`server/houzen-back/database/supabase.sql`](server/houzen-back/database/supabase.sql). A migração é idempotente: preserva as tabelas e os registros existentes, converte senhas legadas em hashes seguros e adiciona os controles necessários.

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

Para tornar a primeira conta administradora, registre uma conta normalmente. Depois, execute o comando abaixo no SQL Editor, substituindo o e-mail pelo endereço correto:

```sql
UPDATE usuarios
SET nivel = 'admin'
WHERE lower(email) = lower('voce@exemplo.com');
```

### 3. Frontend

```bash
cd client/houzen-front
cp .env.example .env
npm install
npm run dev
```

No Windows PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

Configure apenas as variáveis públicas com o prefixo `VITE_*`, conforme descrito em [`client/houzen-front/.env.example`](client/houzen-front/.env.example). A variável `VITE_API_URL` deve conter somente a origem da API, sem `/api/auth` no final.

## Configuração do Resend

Valide um domínio no Resend e defina a variável `RESEND_FROM`. Por exemplo:

```env
RESEND_FROM=Houzen <no-reply@seudominio.com>
```

O remetente de testes `onboarding@resend.dev` não é apropriado para uma aplicação pública. A recuperação de senha utiliza um token aleatório; somente seu hash é armazenado no banco de dados. O token expira em 30 minutos e pode ser usado apenas uma vez.

## Publicação

### API no Render

- **Root Directory:** `server/houzen-back`
- **Runtime:** Node
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Variáveis de ambiente:** copie as variáveis de `.env.example` e preencha-as com os valores de produção.

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
- O token do Firebase é verificado por assinatura, emissor, audiência e prazo de validade.
- As consultas validam a propriedade dos recursos para impedir o acesso entre contas diferentes.
- As senhas são protegidas com bcrypt.
- A recuperação de senha não expõe identificadores nem confirma se um endereço de e-mail está cadastrado.
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
