import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  try {
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });

    console.log(`${result.count} usuários de teste deletados!`);
  } catch (error) {
    console.error('Erro ao limpar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();
