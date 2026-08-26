const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ||= 'test-secret-with-at-least-thirty-two-characters';
process.env.FIREBASE_PROJECT_ID ||= 'houzen-test';

const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('../src/config/db');
const {
  signUserToken,
  requireAuth,
  requireSuperAdmin,
  requirePasswordChangeCompleted
} = require('../src/middleware/auth');
const { verifyFirebaseIdToken } = require('../src/config/firebase');
const {
  validarForgotPassword,
  validarIdParam,
  validarRegistro,
  validarResolucaoReset
} = require('../src/middleware/validators');
const authRoutes = require('../src/routes/authRoutes');

let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.post('/register', validarRegistro, (_req, res) => res.sendStatus(204));
  app.post('/forgot', validarForgotPassword, (_req, res) => res.sendStatus(204));
  app.post('/resolve/:id', validarIdParam, validarResolucaoReset, (_req, res) => res.sendStatus(204));
  app.use('/api/auth', authRoutes);
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('token de sessÃ£o restringe algoritmo, emissor e audiÃªncia', () => {
  const token = signUserToken(42);
  const payload = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: 'houzen-api',
    audience: 'houzen-web'
  });
  assert.equal(payload.sub, '42');
  assert.equal(payload.sv, 0);
});

test('reset revoga tokens emitidos com uma versao de sessao anterior', async () => {
  const originalQuery = db.query;
  db.query = async () => ({
    rows: [{
      id: 42,
      nome: 'Teste',
      email: 'teste@example.com',
      nivel: 'comum',
      status: 'ativo',
      permissoes: [],
      must_change_password: true,
      temporary_password_expires_at: new Date(Date.now() + 60_000),
      session_version: 2
    }]
  });
  const token = signUserToken(42, 1);
  const req = { get: () => `Bearer ${token}` };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let nextCalled = false;
  try {
    await requireAuth(req, res, () => { nextCalled = true; });
  } finally {
    db.query = originalQuery;
  }
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('token Firebase com algoritmo simÃ©trico Ã© rejeitado antes da rede', async () => {
  const forgedToken = jwt.sign({ sub: 'attacker' }, 'attacker-secret', {
    algorithm: 'HS256',
    header: { kid: 'forged' }
  });
  await assert.rejects(
    () => verifyFirebaseIdToken(forgedToken),
    (error) => error.code === 'FIREBASE_INVALID_TOKEN'
  );
});

test('cadastro pÃºblico nÃ£o permite escolher nÃ­vel admin', async () => {
  const response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nome: 'Teste', email: 'teste@example.com', senha: 'SenhaForte123', nivel: 'admin' })
  });
  assert.equal(response.status, 400);
});

test('pedido de recuperacao exige um contato valido', async () => {
  const response = await fetch(`${baseUrl}/forgot`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'teste@example.com' })
  });
  assert.equal(response.status, 400);
});

test('pedido de recuperacao exige e-mail alternativo diferente do cadastrado', async () => {
  const response = await fetch(`${baseUrl}/forgot`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'teste@example.com',
      contactType: 'email',
      contact: 'teste@example.com'
    })
  });
  assert.equal(response.status, 400);
});

test('administrador comum nao passa pela autorizacao de SuperAdmin', () => {
  const req = { user: { nivel: 'admin' } };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let nextCalled = false;
  requireSuperAdmin(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('geracao de senha exige registro da verificacao de identidade', async () => {
  const response = await fetch(`${baseUrl}/resolve/1`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(response.status, 400);
});

test('senha temporaria bloqueia acesso aos modulos ate ser substituida', () => {
  const req = { user: { must_change_password: true } };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let nextCalled = false;
  requirePasswordChangeCompleted(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, 'PASSWORD_CHANGE_REQUIRED');
  assert.equal(nextCalled, false);
});

test('header usuario-id forjado nÃ£o autentica uma rota privada', async () => {
  const response = await fetch(`${baseUrl}/api/auth/obras`, {
    headers: { 'usuario-id': '1' }
  });
  assert.equal(response.status, 401);
});

test('rota administrativa exige autenticaÃ§Ã£o no backend', async () => {
  const response = await fetch(`${baseUrl}/api/auth/admin/usuarios`);
  assert.equal(response.status, 401);
});
