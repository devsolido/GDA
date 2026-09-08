process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GDA_AUTH_USERNAME = 'test-user';
process.env.GDA_AUTH_PASSWORD = 'test-password';

jest.mock('./services/turso', () => ({
  getValue: jest.fn(async () => []),
  setValue: jest.fn(async () => undefined),
  getSectionValue: jest.fn(async () => []),
  setSectionValue: jest.fn(async () => undefined),
  getNotas: jest.fn(async () => ({})),
  setNotas: jest.fn(async () => undefined)
}));

const jwt = require('jsonwebtoken');
const config = require('./config');
const requireAuth = require('./middleware/auth');
const authController = require('./controllers/authController');
const syncController = require('./controllers/syncController');
const notasController = require('./controllers/notasController');

function responseMock() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    }
  };
}

describe('autenticacao', () => {
  test('rejeita requisicao sem token', () => {
    const response = responseMock();
    const next = jest.fn();

    requireAuth({ headers: {} }, response, next);

    expect(response.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('aceita token JWT valido', () => {
    const response = responseMock();
    const next = jest.fn();
    const token = jwt.sign({ username: 'test-user' }, config.jwtSecret);

    requireAuth({ headers: { authorization: `Bearer ${token}` } }, response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('aceita sessao via cookie HttpOnly', () => {
    const response = responseMock();
    const next = jest.fn();
    const token = jwt.sign({ username: 'test-user' }, config.jwtSecret);

    requireAuth({ headers: { cookie: `gda_auth=${token}` } }, response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('login exige senha e emite cookie HttpOnly para credenciais validas', async () => {
    const missingPassword = responseMock();
    await authController.login({ body: { username: 'test-user' } }, missingPassword);
    expect(missingPassword.statusCode).toBe(400);

    const validLogin = responseMock();
    await authController.login({ body: { username: 'test-user', password: 'test-password' } }, validLogin);
    expect(validLogin.statusCode).toBe(200);
    expect(validLogin.body.user.username).toBe('test-user');
    expect(validLogin.headers['set-cookie']).toContain('HttpOnly');
  });
});

describe('validacao de dados', () => {
  test('bloqueia chave de sincronizacao desconhecida', async () => {
    const response = responseMock();
    await syncController.sync({ method: 'GET', params: { key: 'segredo' } }, response);
    expect(response.statusCode).toBe(404);
  });

  test('bloqueia payload invalido de sincronizacao', async () => {
    const response = responseMock();
    await syncController.sync({ method: 'POST', params: { key: 'gda_presencas' }, body: { value: 'invalido' } }, response);
    expect(response.statusCode).toBe(400);
  });

  test('bloqueia mapa de notas invalido', async () => {
    const response = responseMock();
    await notasController.set({ body: { value: [] } }, response);
    expect(response.statusCode).toBe(400);
  });
});
