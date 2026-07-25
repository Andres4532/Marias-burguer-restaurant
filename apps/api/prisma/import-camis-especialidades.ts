/**
 * Importa ESPECIALIDADES y EXTRAS (porciones) CAMI'S Burger.
 * Uso: npm run catalog:camis-especialidades -w api
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Item = {
  name: string;
  price: number;
  sortOrder: number;
  description?: string;
};

const ESPECIALIDADES: Item[] = [
  {
    name: 'Pique burger Mediano',
    price: 30,
    sortOrder: 1,
    description:
      'Papá frita, carne de hamburguesa picada, salchicha, chorizo parrillero y tocino ensalada a gusto.',
  },
  {
    name: 'Pique burger Grande',
    price: 54,
    sortOrder: 2,
    description:
      'Papá frita, carne de hamburguesa picada, salchicha, chorizo parrillero y tocino ensalada a gusto.',
  },
  {
    name: 'Taco burger',
    price: 16,
    sortOrder: 3,
    description:
      'Carne a la plancha con tortilla, queso cheddar, tomate, lechuga, cebolla caramelizada, salsa a gusto y papa.',
  },
  {
    name: 'Alitas 4 piezas',
    price: 25,
    sortOrder: 4,
  },
  {
    name: 'Alitas 6 piezas',
    price: 33,
    sortOrder: 5,
  },
  {
    name: 'Choripan',
    price: 12,
    sortOrder: 6,
    description:
      'Chorizo parrillero en pan de hamburguesa ensalada a gusto.',
  },
  {
    name: 'Pizza Burger',
    price: 52,
    sortOrder: 7,
    description:
      '2 carnes con cheddar, tocino trozos de chorizo parrillero y pan tostado y papas.',
  },
  {
    name: 'SalchiCono',
    price: 15,
    sortOrder: 8,
    description: 'Salchipapa en cono salsas a eleccion.',
  },
];

const EXTRAS: Item[] = [
  { name: 'Papa', price: 6, sortOrder: 1 },
  { name: 'Cheddar', price: 5, sortOrder: 2 },
  { name: 'Tocino', price: 6, sortOrder: 3 },
  { name: 'Huevo', price: 2, sortOrder: 4 },
  { name: 'Carne', price: 10, sortOrder: 5 },
];

async function getOrCreateCategory(name: string, sortOrder: number) {
  const existing = await prisma.category.findFirst({ where: { name } });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { deletedAt: null, isActive: true, sortOrder },
    });
  }

  return prisma.category.create({
    data: { name, sortOrder, isActive: true },
  });
}

async function upsertProducts(
  categoryId: string,
  items: Item[],
  withDescription: boolean,
) {
  for (const item of items) {
    const found = await prisma.product.findFirst({
      where: { categoryId, name: item.name },
    });

    const data = {
      price: item.price,
      sortOrder: item.sortOrder,
      deletedAt: null,
      isActive: true,
      description: withDescription ? (item.description ?? null) : null,
    };

    if (found) {
      await prisma.product.update({ where: { id: found.id }, data });
      console.log(`↻ ${item.name}`);
    } else {
      await prisma.product.create({
        data: {
          categoryId,
          name: item.name,
          ...data,
        },
      });
      console.log(`+ ${item.name}`);
    }
  }
}

async function main() {
  const especialidades = await getOrCreateCategory('Especialidades', 3);
  const extras = await getOrCreateCategory('Extras', 4);

  console.log('— Especialidades —');
  await upsertProducts(especialidades.id, ESPECIALIDADES, true);

  console.log('\n— Extras (porciones) —');
  await upsertProducts(extras.id, EXTRAS, false);

  console.log(
    `\n✅ ${ESPECIALIDADES.length} especialidades, ${EXTRAS.length} extras.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
