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
  } finally {
    server.close();
  }
});
