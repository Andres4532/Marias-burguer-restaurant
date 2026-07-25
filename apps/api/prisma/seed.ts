import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const JEFA_EMAIL = 'camilacortez775@gmail.com';
const DEMO_CAJERA_EMAIL = 'cajera@restaurante.com';

async function seedUsers() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.updateMany({
    where: { email: 'jefa@restaurante.com' },
    data: { email: JEFA_EMAIL },
  });

  const jefa = await prisma.user.upsert({
    where: { email: JEFA_EMAIL },
    update: { role: UserRole.JEFA },
    create: {
      email: JEFA_EMAIL,
      passwordHash,
      name: 'María García',
      role: UserRole.JEFA,
    },
  });

  const demoCajera = await prisma.user.findUnique({
    where: { email: DEMO_CAJERA_EMAIL },
  });
  if (demoCajera) {
    await prisma.payment.deleteMany({ where: { createdById: demoCajera.id } });
    await prisma.order.updateMany({
      where: { createdById: demoCajera.id },
      data: { createdById: null },
    });
    await prisma.user.delete({ where: { id: demoCajera.id } });
    console.log(`🗑️  Usuario demo eliminado: ${DEMO_CAJERA_EMAIL}`);
  }

  console.log(`✅ Usuario jefa: ${jefa.email} (JEFA)`);
  return jefa;
}

async function seedSettingsIfMissing() {
  await prisma.restaurantSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Mi Restaurante',
      slug: 'mi-restaurante',
      phone: '70000000',
      publicMenuEnabled: true,
      publicMenuOpenTime: '08:00',
      publicMenuCloseTime: '22:00',
    },
  });
  console.log('✅ Configuración del restaurante (solo crea si faltaba)');
}

/** Catálogo demo: SOLO en base de datos vacía (primera instalación). */
async function seedDemoCatalogIfEmpty() {
  const [products, orders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
  ]);

  if (products > 0 || orders > 0) {
    console.log(
      '⏭️  Ya hay productos o pedidos en la BD — el seed NO borra ni reemplaza tu catálogo.',
    );
    return;
  }

  console.log('📦 Base vacía: cargando catálogo demo...');

  const categorias = await Promise.all([
    prisma.category.create({
      data: { name: 'Hamburguesas', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: 'Pizzas', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: 'Bebidas', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: 'Salsas aparte', sortOrder: 4 },
    }),
  ]);

  const [hamburguesas, pizzas, bebidas, salsasApartid] = categorias;

  const extras = await Promise.all([
    prisma.extra.create({ data: { name: 'Queso extra', price: 3.0 } }),
    prisma.extra.create({ data: { name: 'Tocino', price: 4.0 } }),
    prisma.extra.create({ data: { name: 'Salsa BBQ', price: 0 } }),
    prisma.extra.create({ data: { name: 'Salsa picante', price: 0 } }),
    prisma.extra.create({ data: { name: 'Huevo', price: 2.5 } }),
  ]);

  const [quesoExtra, tocino, salsaBbq, salsaPicante] = extras;

  const clasica = await prisma.product.create({
    data: {
      categoryId: hamburguesas.id,
      name: 'Hamburguesa Clásica',
      description: 'Carne, lechuga, tomate, cebolla',
      price: 25.0,
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop',
      sortOrder: 1,
      extras: {
        create: [
          { extraId: quesoExtra.id },
          { extraId: tocino.id },
          { extraId: salsaBbq.id },
          { extraId: salsaPicante.id },
        ],
      },
    },
  });

  const doble = await prisma.product.create({
    data: {
      categoryId: hamburguesas.id,
      name: 'Hamburguesa Doble',
      description: 'Doble carne, queso, pepinillos',
      price: 35.0,
      imageUrl:
        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&auto=format&fit=crop',
      sortOrder: 2,
      extras: {
        create: [
          { extraId: quesoExtra.id },
          { extraId: tocino.id },
          { extraId: salsaBbq.id },
        ],
      },
    },
  });

  const pizzaMargarita = await prisma.product.create({
    data: {
      categoryId: pizzas.id,
      name: 'Pizza Margarita',
      description: 'Salsa, mozzarella, albahaca',
      price: 45.0,
      imageUrl:
        'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&auto=format&fit=crop',
      sortOrder: 1,
    },
  });

  const pizzaPepperoni = await prisma.product.create({
    data: {
      categoryId: pizzas.id,
      name: 'Pizza Pepperoni',
      description: 'Salsa, mozzarella, pepperoni',
      price: 55.0,
      imageUrl:
        'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop',
      sortOrder: 2,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        categoryId: bebidas.id,
        name: 'Coca-Cola 500ml',
        price: 8.0,
        sortOrder: 1,
      },
      {
        categoryId: bebidas.id,
        name: 'Agua 500ml',
        price: 5.0,
        sortOrder: 2,
      },
      {
        categoryId: bebidas.id,
        name: 'Jugo natural',
        price: 10.0,
        sortOrder: 3,
      },
      {
        categoryId: salsasApartid.id,
        name: 'Salsa BBQ (porción aparte)',
        description: 'Porción individual para llevar',
        price: 2.0,
        sortOrder: 1,
      },
      {
        categoryId: salsasApartid.id,
        name: 'Salsa picante (porción aparte)',
        description: 'Porción individual para llevar',
        price: 2.0,
        sortOrder: 2,
      },
      {
        categoryId: salsasApartid.id,
        name: 'Salsa de la casa (porción aparte)',
        description: 'Porción individual para llevar',
        price: 2.5,
        sortOrder: 3,
      },
    ],
  });

  console.log('✅ Categorías:', categorias.map((c) => c.name).join(', '));
  console.log(
    '✅ Productos demo:',
    clasica.name,
    doble.name,
    pizzaMargarita.name,
    pizzaPepperoni.name,
  );
  console.log('✅ Extras:', extras.map((e) => e.name).join(', '));
}

async function main() {
  console.log('🌱 Iniciando seed (seguro: no borra catálogo existente)...');

  await seedUsers();
  await seedSettingsIfMissing();
  await seedDemoCatalogIfEmpty();

  console.log('');
  console.log('📋 Jefa (password por defecto si recién creada: password123):');
  console.log(`   ${JEFA_EMAIL}`);
  console.log('   Cajera: créala en Usuarios (panel jefa)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
