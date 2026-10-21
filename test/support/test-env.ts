// Entorno de las pruebas de integración. Se aplica antes de importar la app (setupFiles) para que
// estas variables ganen a las del `.env`, que apunta a la base compartida y a Gemini.

const DEFAULT_TEST_DATABASE_URL =
  'postgres://test:test@localhost:5433/conecta_u_test';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** Nunca correr contra una base remota: las pruebas borran todas las tablas. */
export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  const { hostname } = new URL(url);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `TEST_DATABASE_URL debe apuntar a una base local (recibido: ${hostname}). Las pruebas de integración borran los datos.`,
    );
  }
  return url;
}

export function applyTestEnv(): void {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: testDatabaseUrl(),
    DB_SSL: 'false',
    DB_SYNCHRONIZE: 'false',
    AI_PROVIDER: 'fake',
    GEMINI_API_KEY: '',
    JWT_SECRET: 'secreto-solo-para-pruebas-de-integracion',
    EMBEDDING_DIM: '768',
    AI_TIMEOUT_MS: '55000',
    MATCH_WEIGHTS: '0.5,0.2,0.15,0.15',
    MATCH_TOP_N: '10',
    SMTP_HOST: '',
  });
}

applyTestEnv();
