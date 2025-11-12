import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    name: 'Auth Test User',
    email: 'auth-test@example.com',
    password: 'Test@123456',
  };

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
    // Limpar dados de teste
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'auth-test',
        },
      },
    });
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    afterEach(async () => {
      // Limpar após cada teste
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    });

    it('deve registrar um novo usuário com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('deve rejeitar registro com email duplicado', async () => {
      // Primeiro registro
      await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(201);

      // Segundo registro com mesmo email
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.message).toContain('Email já está em uso');
    });

    it('deve rejeitar registro sem nome', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(400);
    });

    it('deve rejeitar registro com nome muito curto', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'AB',
          email: testUser.email,
          password: testUser.password,
        })
        .expect(400);
    });

    it('deve rejeitar registro sem email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          password: testUser.password,
        })
        .expect(400);
    });

    it('deve rejeitar registro com email inválido', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          email: 'email-invalido',
          password: testUser.password,
        })
        .expect(400);
    });

    it('deve rejeitar registro sem senha', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
        })
        .expect(400);
    });

    it('deve rejeitar registro com senha muito curta', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: '12345',
        })
        .expect(400);
    });

    it('deve rejeitar registro com senha sem letra maiúscula', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: 'test@123456',
        })
        .expect(400);
    });

    it('deve rejeitar registro com senha sem letra minúscula', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: 'TEST@123456',
        })
        .expect(400);
    });

    it('deve rejeitar registro com senha sem número', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: 'Test@Password',
        })
        .expect(400);
    });

    it('deve rejeitar campos extras não permitidos', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: 'admin', // campo não permitido
          extraField: 'value',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    let registeredUser: any;

    beforeAll(async () => {
      // Registrar usuário para testes de login
      const response = await request(app.getHttpServer()).post('/api/auth/register').send(testUser);
      registeredUser = response.body;
    });

    afterAll(async () => {
      // Limpar usuário de teste
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    });

    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
    });

    it('deve rejeitar login com email inexistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nao-existe@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.message).toContain('Credenciais inválidas');
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'SenhaErrada@123',
        })
        .expect(401);

      expect(response.body.message).toContain('Credenciais inválidas');
    });

    it('deve rejeitar login sem email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          password: testUser.password,
        })
        .expect(400);
    });

    it('deve rejeitar login sem senha', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400);
    });

    it('deve rejeitar login com email inválido', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'email-invalido',
          password: testUser.password,
        })
        .expect(400);
    });
  });

  describe('JWT Token', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Token Test User',
        email: 'token-test@example.com',
        password: 'Test@123456',
      });

      authToken = response.body.access_token;
      userId = response.body.user.id;
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: 'token-test@example.com' },
      });
    });

    it('deve aceitar requisição com token válido', async () => {
      // Usar endpoint de listagem de filmes que requer autenticação
      const response = await request(app.getHttpServer())
        .get('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('deve rejeitar requisição sem token', async () => {
      await request(app.getHttpServer()).get('/api/movies').expect(401);
    });

    it('deve rejeitar requisição com token inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/movies')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('deve rejeitar requisição com token malformado', async () => {
      await request(app.getHttpServer())
        .get('/api/movies')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });
});
