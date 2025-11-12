import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma.service';

describe('Movies CRUD (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let movieId: string;

  const testUser = {
    email: 'movies-test@example.com',
    password: 'Test@123456',
    name: 'Movies Test User',
  };

  const testMovie = {
    title: 'Homem-Aranha no Aranhaverso',
    description:
      'Miles Morales retorna para o próximo capítulo da saga do Aranhaverso, uma aventura épica que transportará o Homem-Aranha em tempo integral e amigável do bairro do Brooklyn através do Multiverso.',
    releaseDate: '2023-06-01T00:00:00.000Z',
    duration: 140,
    genres: ['Animação', 'Ação', 'Aventura'],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

    // Criar usuário de teste
    const signupResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    authToken = signupResponse.body.access_token;
    userId = signupResponse.body.user.id;
  });

  afterAll(async () => {
    // Limpar todos os dados de teste
    await prisma.movie.deleteMany({
      where: { userId },
    });
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  describe('POST /api/movies', () => {
    afterEach(async () => {
      // Limpar filmes após cada teste
      await prisma.movie.deleteMany({
        where: { userId },
      });
    });

    it('deve criar um novo filme com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMovie)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testMovie.title);
      expect(response.body.description).toBe(testMovie.description);
      expect(response.body.duration).toBe(testMovie.duration);
      expect(response.body.genres).toEqual(testMovie.genres);
      expect(response.body.userId).toBe(userId);
      expect(response.body.posterUrl).toBeNull();
      expect(response.body.backdropUrl).toBeNull();

      movieId = response.body.id;
    });

    it('deve rejeitar criação sem autenticação', async () => {
      await request(app.getHttpServer()).post('/api/movies').send(testMovie).expect(401);
    });

    it('deve rejeitar criação sem título', async () => {
      const { title, ...movieWithoutTitle } = testMovie;

      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(movieWithoutTitle)
        .expect(400);
    });

    it('deve rejeitar criação com título muito curto', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          title: 'Ab',
        })
        .expect(400);
    });

    it('deve rejeitar criação sem descrição', async () => {
      const { description, ...movieWithoutDescription } = testMovie;

      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(movieWithoutDescription)
        .expect(400);
    });

    it('deve rejeitar criação com descrição muito curta', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          description: 'Muito curto',
        })
        .expect(400);
    });

    it('deve rejeitar criação sem data de lançamento', async () => {
      const { releaseDate, ...movieWithoutDate } = testMovie;

      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(movieWithoutDate)
        .expect(400);
    });

    it('deve rejeitar criação com data de lançamento inválida', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          releaseDate: 'data-invalida',
        })
        .expect(400);
    });

    it('deve rejeitar criação sem duração', async () => {
      const { duration, ...movieWithoutDuration } = testMovie;

      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(movieWithoutDuration)
        .expect(400);
    });

    it('deve rejeitar criação com duração negativa', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          duration: -10,
        })
        .expect(400);
    });

    it('deve rejeitar criação com duração zero', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          duration: 0,
        })
        .expect(400);
    });

    it('deve rejeitar criação sem gêneros', async () => {
      const { genres, ...movieWithoutGenres } = testMovie;

      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(movieWithoutGenres)
        .expect(400);
    });

    it('deve rejeitar criação com array de gêneros vazio', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          genres: [],
        })
        .expect(400);
    });

    it('deve criar filme com data futura (deve agendar email)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 dias no futuro

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          title: 'Filme Futuro',
          releaseDate: futureDate.toISOString(),
        })
        .expect(201);

      expect(response.body.releaseDate).toBe(futureDate.toISOString());
    });
  });

  describe('GET /api/movies', () => {
    beforeAll(async () => {
      // Criar vários filmes para testes de listagem
      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMovie);

      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          title: 'Vingadores: Ultimato',
          duration: 181,
          releaseDate: '2019-04-25T00:00:00.000Z',
        });

      await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testMovie,
          title: 'Interestelar',
          genres: ['Ficção Científica', 'Drama'],
          duration: 169,
          releaseDate: '2014-11-06T00:00:00.000Z',
        });
    });

    it('deve listar todos os filmes do usuário', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('deve rejeitar listagem sem autenticação', async () => {
      await request(app.getHttpServer()).get('/api/movies').expect(401);
    });

    it('deve buscar filmes por título (search)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?search=Aranha')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toContain('Aranha');
    });

    it('deve filtrar por duração mínima', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?minDuration=150')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach((movie: any) => {
        expect(movie.duration).toBeGreaterThanOrEqual(150);
      });
    });

    it('deve filtrar por duração máxima', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?maxDuration=150')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach((movie: any) => {
        expect(movie.duration).toBeLessThanOrEqual(150);
      });
    });

    it('deve filtrar por período de data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?startDate=2019-01-01&endDate=2020-12-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toBe('Vingadores: Ultimato');
    });

    it('deve filtrar por gênero', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?genre=Ficção Científica')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].genres).toContain('Ficção Científica');
    });

    it('deve paginar resultados (página 1)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('deve ordenar por data de lançamento (desc)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?sortBy=releaseDate&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const dates = response.body.data.map((m: any) => new Date(m.releaseDate).getTime());
      const sortedDates = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sortedDates);
    });

    it('deve ordenar por título (asc)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const titles = response.body.data.map((m: any) => m.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });

    it('deve combinar múltiplos filtros', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies?search=Aranha&minDuration=100&genre=Animação')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((movie: any) => {
        expect(movie.title).toContain('Aranha');
        expect(movie.duration).toBeGreaterThanOrEqual(100);
        expect(movie.genres).toContain('Animação');
      });
    });
  });

  describe('GET /api/movies/:id', () => {
    let createdMovieId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMovie);

      createdMovieId = response.body.id;
    });

    it('deve buscar um filme por ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/movies/${createdMovieId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdMovieId);
      expect(response.body.title).toBe(testMovie.title);
      expect(response.body.userId).toBe(userId);
    });

    it('deve rejeitar busca sem autenticação', async () => {
      await request(app.getHttpServer()).get(`/api/movies/${createdMovieId}`).expect(401);
    });

    it('deve rejeitar busca de filme inexistente', async () => {
      await request(app.getHttpServer())
        .get('/api/movies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve rejeitar busca com ID inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/movies/id-invalido')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve rejeitar busca de filme de outro usuário', async () => {
      // Criar outro usuário
      const otherUser = {
        email: `other-${Date.now()}@example.com`,
        password: 'Other@123456',
        name: 'Other User',
      };

      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(otherUser)
        .expect(201);

      const otherToken = otherUserResponse.body.access_token;
      const otherUserId = otherUserResponse.body.user.id;

      // Tentar buscar filme do primeiro usuário
      await request(app.getHttpServer())
        .get(`/api/movies/${createdMovieId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      // Limpar
      await prisma.user.delete({ where: { id: otherUserId } });
    });
  });

  describe('PATCH /api/movies/:id', () => {
    let movieToUpdate: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMovie);

      movieToUpdate = response.body.id;
    });

    afterEach(async () => {
      await prisma.movie.delete({ where: { id: movieToUpdate } }).catch(() => {});
    });

    it('deve atualizar título do filme', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Título Atualizado',
        })
        .expect(200);

      expect(response.body.title).toBe('Título Atualizado');
      expect(response.body.description).toBe(testMovie.description); // Outros campos não mudam
    });

    it('deve atualizar descrição do filme', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description:
            'Nova descrição do filme com mais de vinte caracteres para passar na validação',
        })
        .expect(200);

      expect(response.body.description).toContain('Nova descrição');
    });

    it('deve atualizar duração do filme', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration: 150,
        })
        .expect(200);

      expect(response.body.duration).toBe(150);
    });

    it('deve atualizar gêneros do filme', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          genres: ['Drama', 'Suspense'],
        })
        .expect(200);

      expect(response.body.genres).toEqual(['Drama', 'Suspense']);
    });

    it('deve atualizar data de lançamento', async () => {
      const newDate = '2024-12-25T00:00:00.000Z';

      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          releaseDate: newDate,
        })
        .expect(200);

      expect(response.body.releaseDate).toBe(newDate);
    });

    it('deve atualizar múltiplos campos simultaneamente', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Título Novo',
          duration: 160,
          genres: ['Comédia'],
        })
        .expect(200);

      expect(response.body.title).toBe('Título Novo');
      expect(response.body.duration).toBe(160);
      expect(response.body.genres).toEqual(['Comédia']);
    });

    it('deve rejeitar atualização sem autenticação', async () => {
      await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .send({ title: 'Título' })
        .expect(401);
    });

    it('deve rejeitar atualização de filme inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/api/movies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Título' })
        .expect(404);
    });

    it('deve rejeitar atualização com título muito curto', async () => {
      await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'AB' })
        .expect(400);
    });

    it('deve rejeitar atualização com duração inválida', async () => {
      await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ duration: -10 })
        .expect(400);
    });

    it('deve rejeitar atualização de filme de outro usuário', async () => {
      // Criar outro usuário
      const otherUser = {
        email: `other-update-${Date.now()}@example.com`,
        password: 'Other@123456',
        name: 'Other User',
      };

      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(otherUser)
        .expect(201);

      const otherToken = otherUserResponse.body.access_token;
      const otherUserId = otherUserResponse.body.user.id;

      // Tentar atualizar filme do primeiro usuário
      await request(app.getHttpServer())
        .patch(`/api/movies/${movieToUpdate}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Tentativa de Hack' })
        .expect(403);

      // Limpar
      await prisma.user.delete({ where: { id: otherUserId } });
    });
  });

  describe('DELETE /api/movies/:id', () => {
    let movieToDelete: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMovie);

      movieToDelete = response.body.id;
    });

    it('deve deletar um filme', async () => {
      await request(app.getHttpServer())
        .delete(`/api/movies/${movieToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verificar que foi deletado
      await request(app.getHttpServer())
        .get(`/api/movies/${movieToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve rejeitar deleção sem autenticação', async () => {
      await request(app.getHttpServer()).delete(`/api/movies/${movieToDelete}`).expect(401);
    });

    it('deve rejeitar deleção de filme inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/api/movies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve rejeitar deleção de filme de outro usuário', async () => {
      // Criar outro usuário
      const otherUser = {
        email: `other-delete-${Date.now()}@example.com`,
        password: 'Other@123456',
        name: 'Other User',
      };

      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(otherUser)
        .expect(201);

      const otherToken = otherUserResponse.body.access_token;
      const otherUserId = otherUserResponse.body.user.id;

      // Tentar deletar filme do primeiro usuário
      await request(app.getHttpServer())
        .delete(`/api/movies/${movieToDelete}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      // Limpar
      await prisma.user.delete({ where: { id: otherUserId } });
    });
  });
});
