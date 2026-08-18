const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../api/index.js');

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, port };
}

test('bloqueia arquivos sensíveis como package.json e .env', async () => {
  const { server, port } = await startServer();

  try {
    const resPackage = await fetch(`http://127.0.0.1:${port}/package.json`);
    assert.equal(resPackage.status, 404);

    const resEnv = await fetch(`http://127.0.0.1:${port}/.env`);
    assert.equal(resEnv.status, 404);
  } finally {
    server.close();
  }
});

test('envia headers de segurança nas respostas', async () => {
  const { server, port } = await startServer();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(res.headers.get('permissions-policy'), 'geolocation=(), microphone=(), camera=()');

    const csp = res.headers.get('content-security-policy') || '';
    assert.match(csp, /style-src[^;]*'unsafe-inline'/i);
    assert.match(csp, /script-src[^;]*'unsafe-inline'/i);
  } finally {
    server.close();
  }
});

test('serve arquivos estáticos sem cair na página inicial', async () => {
  const { server, port } = await startServer();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/styles/style.css`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/css/i);
  } finally {
    server.close();
  }
});

test('exige JWT no endpoint raiz da API', async () => {
  const { server, port } = await startServer();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.error, /Token/i);
  } finally {
    server.close();
  }
});

test('restringe CORS a origens configuradas', async () => {
  const { server, port } = await startServer();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/turmas`, {
      headers: { Origin: 'https://dominio-nao-autorizado.example' }
    });
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  } finally {
    server.close();
  }
});

test('protege a consulta e a certidão de integridade com JWT', async () => {
  const { server, port } = await startServer();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/integridade/relatorios/1`);
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

test('protege a migração de registros legados com JWT', async () => {
  const { server, port } = await startServer();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/integridade/migrar-legado`, { method: 'POST' });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});
