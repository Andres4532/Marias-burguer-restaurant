/**
 * Limpia catálogo (soft delete) e importa solo hamburguesas CAMI'S.
 * Uso: npm run catalog:reset-camis-burgers -w api
 * Requiere DATABASE_URL apuntando a la BD deseada (Render o local).
 */
import { execSync } from 'child_process';
import path from 'path';

const apiRoot = path.join(__dirname, '..');

execSync('npx ts-node prisma/clear-catalog.ts', {
  cwd: apiRoot,
  stdio: 'inherit',
  env: process.env,
});

execSync('npx ts-node prisma/import-camis-burgers.ts', {
  cwd: apiRoot,
  stdio: 'inherit',
  env: process.env,
});
