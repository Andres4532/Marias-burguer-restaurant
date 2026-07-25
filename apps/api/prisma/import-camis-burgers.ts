/**
 * Importa menú CAMI'S Burger — hamburguesas (sin imágenes).
 * Uso: npm run catalog:camis-burgers -w api
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_NAME = 'Hamburguesas';

const BURGERS: Array<{
  name: string;
  description: string;
  price: number;
  sortOrder: number;
}> = [
  {
    name: 'Classic burger',
    description:
      'Carne, queso, porción de papa, ensalada a gusto y salsas a elección.',
    price: 23,
    sortOrder: 1,
  },
  {
    name: 'Súper burger',
    description:
      'Carne, queso, tocino, porción de papa, ensalada a gusto y salsas a elección.',
    price: 25,
    sortOrder: 2,
  },
  {
    name: 'Special burger',
    description:
      'Carne, chorizo parrillero, doble porción de papa, ensalada a gusto y salsas a elección.',
    price: 30,
    sortOrder: 3,
  },
  {
    name: 'Blue chesse Burger',
    description:
      'Carne con mermelada de tocino, cebolla y queso azul con deliciosos pepinillos y tomate.',
    price: 33,
    sortOrder: 4,
  },
  {
    name: 'Mega Burger',
    description:
      'Carne, queso cheddar, chorizo parrillero, tocino, doble porción de papa, ensalada a gusto y salsas a elección.',
    price: 38,
    sortOrder: 5,
  },
];

async function getOrCreateCategory() {
  const existing = await prisma.category.findFirst({
    where: { name: CATEGORY_NAME },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { deletedAt: null, isActive: true, sortOrder: 1 },
    });
  }

  return prisma.category.create({
    data: { name: CATEGORY_NAME, sortOrder: 1, isActive: true },
  });
}

async function main() {
  const category = await getOrCreateCategory();

  for (const burger of BURGERS) {
    const found = await prisma.product.findFirst({
      where: {
        categoryId: category.id,
        name: burger.name,
      },
    });

    if (found) {
      await prisma.product.update({
        where: { id: found.id },
        data: {
          description: burger.description,
          price: burger.price,
          sortOrder: burger.sortOrder,
          deletedAt: null,
          isActive: true,
        },
      });
      console.log(`↻ Actualizado: ${burger.name}`);
    } else {
      await prisma.product.create({
        data: {
          categoryId: category.id,
          name: burger.name,
          description: burger.description,
          price: burger.price,
          sortOrder: burger.sortOrder,
          isActive: true,
        },
      });
      console.log(`+ Creado: ${burger.name}`);
    }
  }

  console.log(`\n✅ Categoría "${CATEGORY_NAME}" con ${BURGERS.length} hamburguesas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
