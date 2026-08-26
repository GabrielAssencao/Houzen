const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ||= 'test-secret-with-at-least-thirty-two-characters';
process.env.FIREBASE_PROJECT_ID ||= 'houzen-test';

const express = require('express');
const jwt = require('jsonwebtoken');

const { signUserToken } = require('../src/middleware/auth');
const { verifyFirebaseIdToken } = require('../src/config/firebase');
const { validarRegistro, validarResetPassword } = require('../src/middleware/validators');
const authRoutes = require('../src/routes/authRoutes');

let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.post('/register', validarRegistro, (_req, res) => res.sendStatus(204));
  app.put('/reset', validarResetPassword, (_req, res) => res.sendStatus(204));
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

test('reset antigo baseado apenas em ID Ã© rejeitado', async () => {
  const response = await fetch(`${baseUrl}/reset`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 1, novaSenha: 'SenhaForte123' })
  });
  assert.equal(response.status, 400);
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
