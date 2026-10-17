import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { applyTestEnv, testDatabaseUrl } from './test-env';

/** Base limpia antes de la corrida: borra el esquema y aplica todas las migraciones reales. */
export default async function globalSetup(): Promise<void> {
  applyTestEnv();
  const dataSource = new DataSource({
    type: 'postgres',
    url: testDatabaseUrl(),
  });
  try {
    await dataSource.initialize();
  } catch (error) {
    throw new Error(
      `No hay base de pruebas en ${testDatabaseUrl()}. Levántala con "npm run test:db:up". (${String(error)})`,
    );
  }
  try {
    await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
    await dataSource.query('CREATE SCHEMA public');
  } finally {
    await dataSource.destroy();
  }
  execSync('npm run typeorm -- migration:run', {
    cwd: join(__dirname, '..', '..'),
    env: process.env,
    stdio: 'pipe',
  });
}
