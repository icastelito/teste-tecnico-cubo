import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App E2E Tests', () => {
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

  describe('GET /api/handshake', () => {
    it('deve retornar mensagem de olá', () => {
      return request(app.getHttpServer())
        .get('/api/handshake')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'olá');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('status', 'success');
        });
    });

    it('deve retornar timestamp válido', () => {
      return request(app.getHttpServer())
        .get('/api/handshake')
        .expect(200)
        .expect((res) => {
          const timestamp = new Date(res.body.timestamp);
          expect(timestamp).toBeInstanceOf(Date);
          expect(timestamp.getTime()).not.toBeNaN();
        });
    });
  });
});
