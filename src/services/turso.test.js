jest.mock('@libsql/client', () => ({ createClient: jest.fn() }));
jest.mock('../config', () => ({ dbUrl: 'libsql://test.turso.io', dbToken: 'test-token' }));

const { createClient } = require('@libsql/client');
const database = {
  execute: jest.fn(async () => ({ rows: [] })),
  batch: jest.fn(async () => undefined)
};
createClient.mockReturnValue(database);

const { setNotas, setSectionValue } = require('./turso');

beforeEach(() => {
  database.execute.mockClear();
  database.batch.mockClear();
});

describe('persistência Turso', () => {
  test('limpar notas remove os dados legados na mesma transação', async () => {
    await setNotas({});

    expect(database.batch).toHaveBeenCalledTimes(1);
    const [statements] = database.batch.mock.calls[0];
    expect(statements).toEqual(expect.arrayContaining([
      expect.objectContaining({ sql: 'DELETE FROM gda_notas' }),
      expect.objectContaining({
        sql: 'DELETE FROM gda_sync_data WHERE key = ?',
        args: ['gda_notas']
      })
    ]));
  });

  test('limpar uma seção atualiza o espelho legado atomicamente', async () => {
    await setSectionValue('gda_atividades', []);

    expect(database.batch).toHaveBeenCalledTimes(1);
    const [statements] = database.batch.mock.calls[0];
    expect(statements).toEqual(expect.arrayContaining([
      expect.objectContaining({ sql: 'DELETE FROM gda_atividades' }),
      expect.objectContaining({
        sql: expect.stringContaining('INSERT INTO gda_sync_data'),
        args: ['gda_atividades', '[]', expect.any(String)]
      })
    ]));
  });
});
