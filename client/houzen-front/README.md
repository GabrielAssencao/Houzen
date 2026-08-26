# Frontend Houzen

Interface React/Vite da plataforma Houzen. O frontend consome exclusivamente a API Express e não acessa credenciais privadas nem o banco PostgreSQL diretamente.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env` e configure `VITE_API_URL` e as chaves públicas do Firebase Web. Variáveis com prefixo `VITE_` ficam visíveis no navegador e não devem conter segredos.

## Verificações

```bash
npm run lint
npm run build
```

## Deploy na Vercel

- Root Directory: `client/houzen-front`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

O arquivo `vercel.json` mantém o fallback da SPA para rotas como `/login`, `/dashboard` e `/dashboard/settings`.

## Temas

O tema claro ou escuro é salvo no perfil por meio da API. Ele é aplicado somente ao layout autenticado; a landing page mantém o tema visual original.
