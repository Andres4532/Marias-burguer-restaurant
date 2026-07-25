/** Quita imageUrl rotas (archivo ya no existe en el servidor). */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.product.updateMany({
    where: {
      imageUrl: { contains: '/uploads/files/products/' },
    },
    data: { imageUrl: null },
  });
  console.log(`✅ imageUrl limpiada en ${result.count} producto(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
