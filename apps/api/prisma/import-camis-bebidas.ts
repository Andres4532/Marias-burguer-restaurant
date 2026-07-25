/**
 * Importa bebidas CAMI'S Burger (sin descripción).
 * Uso: npm run catalog:camis-bebidas -w api
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_NAME = 'Bebidas';

const DRINKS: Array<{ name: string; price: number; sortOrder: number }> = [
  { name: 'Jugo De la casa botella 300 ml', price: 5, sortOrder: 1 },
  { name: 'Jugo De la casa botella 1 L', price: 12, sortOrder: 2 },
  { name: 'Gaseosa mini', price: 3, sortOrder: 3 },
  { name: 'Gaseosa popular', price: 7, sortOrder: 4 },
  { name: 'Gaseosa 1,5 litros', price: 14, sortOrder: 5 },
  { name: 'Gaseosa 2 litros', price: 17, sortOrder: 6 },
  { name: 'Gaseosa 3 litros', price: 22, sortOrder: 7 },
  { name: 'Café', price: 8, sortOrder: 8 },
  { name: 'Té', price: 5, sortOrder: 9 },
];

async function getOrCreateCategory() {
  const existing = await prisma.category.findFirst({
    where: { name: CATEGORY_NAME },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { deletedAt: null, isActive: true, sortOrder: 2 },
    });
  }

  return prisma.category.create({
    data: { name: CATEGORY_NAME, sortOrder: 2, isActive: true },
  });
}

async function main() {
  const category = await getOrCreateCategory();

  for (const drink of DRINKS) {
    const found = await prisma.product.findFirst({
      where: { categoryId: category.id, name: drink.name },
    });

    if (found) {
      await prisma.product.update({
        where: { id: found.id },
        data: {
          description: null,
          price: drink.price,
          sortOrder: drink.sortOrder,
          deletedAt: null,
          isActive: true,
        },
      });
      console.log(`↻ Actualizado: ${drink.name}`);
    } else {
      await prisma.product.create({
        data: {
          categoryId: category.id,
          name: drink.name,
          price: drink.price,
          sortOrder: drink.sortOrder,
          isActive: true,
        },
      });
      console.log(`+ Creado: ${drink.name}`);
    }
  }

  console.log(`\n✅ Categoría "${CATEGORY_NAME}" con ${DRINKS.length} bebidas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
