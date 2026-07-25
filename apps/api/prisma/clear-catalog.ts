/**
 * Quita todo el catálogo visible (productos, categorías, extras demo).
 * No toca usuarios ni configuración del restaurante.
 *
 * Uso: npm run catalog:clear -w api
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const [products, categories, extras] = await Promise.all([
    prisma.product.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: now, isActive: false },
    }),
    prisma.category.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: now, isActive: false },
    }),
    prisma.extra.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: now, isActive: false },
    }),
  ]);

  console.log(
    `✅ Catálogo limpiado: ${products.count} productos, ${categories.count} categorías, ${extras.count} extras.`,
  );
  console.log('   Usuarios y configuración no se modificaron.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
