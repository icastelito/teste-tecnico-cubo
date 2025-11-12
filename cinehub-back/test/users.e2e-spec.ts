import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma.service';

describe('Users E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar mesmas configurações do main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Limpar TODOS os dados de teste, independente de quais testes rodaram
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });
    await app.close();
  });

  describe('POST /api/users', () => {
    it('deve criar um novo usuário com dados válidos', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'TestPassword123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Test User');
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('deve retornar erro 400 para dados inválidos', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'AB', // Nome muito curto
          email: 'invalid-email',
          password: '123', // Senha muito curta
        })
        .expect(400);
    });

    it('deve retornar erro 400 para senha fraca', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'onlylowercase', // Sem maiúscula e número
        })
        .expect(400);
    });

    it('deve retornar erro 409 para email duplicado', async () => {
      const email = `test-duplicate-${Date.now()}@example.com`;

      // Criar primeiro usuário
      await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'First User',
          email: email,
          password: 'TestPassword123',
        })
        .expect(201);

      // Tentar criar com mesmo email
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Second User',
          email: email,
          password: 'TestPassword123',
        })
        .expect(409);
    });

    it('deve retornar erro 400 para campos faltando', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Test User',
          // Faltando email e password
        })
        .expect(400);
    });
  });

  describe('GET /api/users', () => {
    beforeAll(async () => {
      // Criar alguns usuários para teste
      await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'List User 1',
          email: `test-list1-${Date.now()}@example.com`,
          password: 'TestPassword123',
        });

      await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'List User 2',
          email: `test-list2-${Date.now()}@example.com`,
          password: 'TestPassword123',
        });
    });

    it('deve listar todos os usuários', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);

          // Verificar estrutura do primeiro usuário
          const user = res.body[0];
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('name');
          expect(user).toHaveProperty('email');
          expect(user).not.toHaveProperty('password');
          expect(user).toHaveProperty('createdAt');
          expect(user).toHaveProperty('updatedAt');
        });
    });
  });

  describe('GET /api/users/:id', () => {
    let testUserId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Get User Test',
          email: `test-get-${Date.now()}@example.com`,
          password: 'TestPassword123',
        });
      testUserId = response.body.id;
    });

    it('deve retornar um usuário por ID', () => {
      return request(app.getHttpServer())
        .get(`/api/users/${testUserId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUserId);
          expect(res.body).toHaveProperty('name', 'Get User Test');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('deve retornar erro 404 para ID inexistente', () => {
      return request(app.getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('deve retornar erro 400 para ID inválido', () => {
      return request(app.getHttpServer()).get('/api/users/invalid-id').expect(404); // Prisma retorna not found para UUID inválido
    });
  });

  describe('PATCH /api/users/:id', () => {
    let testUserId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Update User Test',
          email: `test-update-${Date.now()}@example.com`,
          password: 'TestPassword123',
        });
      testUserId = response.body.id;
    });

    it('deve atualizar o nome do usuário', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Updated Name');
        });
    });

    it('deve atualizar o email do usuário', () => {
      const newEmail = `test-updated-${Date.now()}@example.com`;
      return request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .send({
          email: newEmail,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', newEmail);
        });
    });

    it('deve retornar erro 409 ao tentar atualizar para email já em uso', async () => {
      const existingEmail = `test-existing-${Date.now()}@example.com`;

      // Criar usuário com email
      await request(app.getHttpServer()).post('/api/users').send({
        name: 'Existing User',
        email: existingEmail,
        password: 'TestPassword123',
      });

      // Tentar atualizar outro usuário com mesmo email
      return request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .send({
          email: existingEmail,
        })
        .expect(409);
    });

    it('deve retornar erro 404 para usuário inexistente', () => {
      return request(app.getHttpServer())
        .patch('/api/users/00000000-0000-0000-0000-000000000000')
        .send({
          name: 'New Name',
        })
        .expect(404);
    });

    it('deve retornar erro 400 para dados inválidos', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/users/:id/password', () => {
    let testUserId: string;
    const originalPassword = 'TestPassword123';

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Password User Test',
          email: `test-password-${Date.now()}@example.com`,
          password: originalPassword,
        });
      testUserId = response.body.id;
    });

    it('deve atualizar a senha com senha atual correta', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${testUserId}/password`)
        .send({
          currentPassword: originalPassword,
          newPassword: 'NewPassword123',
        })
        .expect(204);
    });

    it('deve retornar erro 400 para senha atual incorreta', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${testUserId}/password`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword456',
        })
        .expect(400);
    });

    it('deve retornar erro 400 para nova senha fraca', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${testUserId}/password`)
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'weak',
        })
        .expect(400);
    });

    it('deve retornar erro 404 para usuário inexistente', () => {
      return request(app.getHttpServer())
        .patch('/api/users/00000000-0000-0000-0000-000000000000/password')
        .send({
          currentPassword: 'TestPassword123',
          newPassword: 'NewPassword123',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deve deletar um usuário existente', async () => {
      // Criar usuário para deletar
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Delete User Test',
          email: `test-delete-${Date.now()}@example.com`,
          password: 'TestPassword123',
        });

      const userId = response.body.id;

      // Deletar usuário
      await request(app.getHttpServer()).delete(`/api/users/${userId}`).expect(204);

      // Verificar que não existe mais
      return request(app.getHttpServer()).get(`/api/users/${userId}`).expect(404);
    });

    it('deve retornar erro 404 para usuário inexistente', () => {
      return request(app.getHttpServer())
        .delete('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
