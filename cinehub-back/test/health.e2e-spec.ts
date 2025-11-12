import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('deve retornar status de saúde completo do sistema', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          // Verificar estrutura principal
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('uptimeSeconds');
          expect(res.body).toHaveProperty('responseTime');
          expect(res.body).toHaveProperty('environment');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('checks');

          // Verificar checks
          expect(res.body.checks).toHaveProperty('database');
          expect(res.body.checks).toHaveProperty('memory');
          expect(res.body.checks).toHaveProperty('process');

          // Verificar check de database
          expect(res.body.checks.database).toHaveProperty('status');
          expect(res.body.checks.database).toHaveProperty('responseTime');
          expect(res.body.checks.database).toHaveProperty('version');

          // Verificar check de memory
          expect(res.body.checks.memory).toHaveProperty('status');
          expect(res.body.checks.memory).toHaveProperty('rss');
          expect(res.body.checks.memory).toHaveProperty('heapTotal');
          expect(res.body.checks.memory).toHaveProperty('heapUsed');

          // Verificar check de process
          expect(res.body.checks.process).toHaveProperty('status');
          expect(res.body.checks.process).toHaveProperty('pid');
          expect(res.body.checks.process).toHaveProperty('nodeVersion');
          expect(res.body.checks.process).toHaveProperty('platform');
        });
    });

    it('deve retornar status healthy quando banco está conectado', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('healthy');
          expect(res.body.checks.database.status).toBe('up');
        });
    });

    it('deve retornar informações de ambiente', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.environment).toBeDefined();
          expect(typeof res.body.environment).toBe('string');
        });
    });
  });

  describe('GET /api/health/database', () => {
    it('deve retornar status da conexão com o banco', () => {
      return request(app.getHttpServer())
        .get('/api/health/database')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('connected');
          expect(res.body).toHaveProperty('responseTime');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('deve confirmar conexão ativa com o banco', () => {
      return request(app.getHttpServer())
        .get('/api/health/database')
        .expect(200)
        .expect((res) => {
          expect(res.body.connected).toBe(true);
          expect(res.body.status).toBe('connected');
          expect(res.body.version).toBeDefined();
        });
    });

    it('deve retornar versão do PostgreSQL', () => {
      return request(app.getHttpServer())
        .get('/api/health/database')
        .expect(200)
        .expect((res) => {
          expect(res.body.version).toContain('PostgreSQL');
        });
    });

    it('deve ter tempo de resposta razoável', () => {
      return request(app.getHttpServer())
        .get('/api/health/database')
        .expect(200)
        .expect((res) => {
          expect(res.body.responseTime).toBeDefined();
          expect(typeof res.body.responseTime).toBe('number');
          expect(res.body.responseTime).toBeLessThan(1000); // Menos de 1 segundo
        });
    });
  });
});
