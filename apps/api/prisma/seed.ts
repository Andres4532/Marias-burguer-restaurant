import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const jefa = await prisma.user.upsert({
    where: { email: 'jefa@restaurante.com' },
    update: {},
    create: {
      email: 'jefa@restaurante.com',
      passwordHash,
      name: 'María García',
      role: UserRole.JEFA,
    },
  });

  const cajera = await prisma.user.upsert({
    where: { email: 'cajera@restaurante.com' },
    update: {},
    create: {
      email: 'cajera@restaurante.com',
      passwordHash,
      name: 'Ana López',
      role: UserRole.CAJERA,
    },
  });

  console.log(`✅ Usuarios: ${jefa.email} (JEFA), ${cajera.email} (CAJERA)`);

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

  console.log('✅ Configuración: menú público en /menu/mi-restaurante');
  await prisma.productExtra.deleteMany();
  await prisma.orderItemExtra.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.extra.deleteMany();
  await prisma.category.deleteMany();

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
  console.log('✅ Productos demo:', clasica.name, doble.name, pizzaMargarita.name, pizzaPepperoni.name);
  console.log('✅ Extras:', extras.map((e) => e.name).join(', '));
  console.log('');
  console.log('📋 Credenciales de prueba (password: password123):');
  console.log('   Jefa:   jefa@restaurante.com');
  console.log('   Cajera: cajera@restaurante.com');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
