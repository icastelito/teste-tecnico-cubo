import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../src/core/database/prisma.service';
import { MailService } from '../src/core/mail/mail.service';
import { MoviesService } from '../src/modules/movies/movies.service';
import { MoviesRepository } from '../src/modules/movies/repositories/movies.repository';
import { MOVIES_REPOSITORY } from '../src/modules/movies/repositories';
import { StorageService } from '../src/core/storage/storage.service';

/**
 * Teste E2E de Agendamento de Emails
 *
 * ATENÇÃO: Este teste usa BullMQ REAL (sem mocks)
 * Requer: Redis rodando (docker-compose up -d)
 *
 * O teste agenda um email REAL para 3 minutos no futuro
 * e valida que o job foi criado no Redis
 */
describe('Agendamento de Emails (BullMQ Real)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let moviesService: MoviesService;
  let movieEmailQueue: Queue;
  let testMovieId: string;
  let testUserId: string;

  const testEmail = 'i.castelobp@gmail.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        BullModule.forRoot({
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
          },
        }),
        BullModule.registerQueue({
          name: 'movie-emails',
        }),
      ],
      providers: [
        PrismaService,
        MailService,
        StorageService,
        MoviesService,
        {
          provide: MOVIES_REPOSITORY,
          useClass: MoviesRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    moviesService = moduleFixture.get<MoviesService>(MoviesService);
    movieEmailQueue = moduleFixture.get<Queue>('BullQueue_movie-emails');

    console.log('\nInitializing email scheduling test with real BullMQ...\n');
    console.log(
      `Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    );
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('Real Scheduling with BullMQ', () => {
    let testMovieId: string;
    let testUserId: string;

    it('deve criar filme e agendar email REAL para 3 minutos no futuro', async () => {
      console.log('Creating movie and scheduling email via real BullMQ...\n');

      // Buscar ou criar usuário de teste
      let testUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      if (!testUser) {
        console.log('   Creating test user...');
        testUser = await prisma.user.create({
          data: {
            email: testEmail,
            name: 'Usuário Teste',
            password: '$2a$10$xQ5z9Z5z9Z5z9Z5z9Z5z9Z5z9Z5z9Z5z9Z5z9Z5z9Z5z9Z5z9Z5', // Hash dummy
          },
        });
      }

      testUserId = testUser.id;

      // Data de lançamento: 3 minutos no futuro
      const releaseDate = new Date();
      releaseDate.setMinutes(releaseDate.getMinutes() + 3);

      console.log(`   Release date: ${releaseDate.toLocaleString('pt-BR')}`);
      console.log(`   Email destination: ${testEmail}`);

      // Criar filme usando o MoviesService (que agenda o email automaticamente)
      const movie = await moviesService.create(testUserId, {
        title: 'Teste Agendamento BullMQ - E2E',
        description: 'Email agendado via BullMQ REAL (sem mocks). Será enviado em 3 minutos!',
        releaseDate: releaseDate.toISOString(),
        duration: 140,
        genres: ['Teste', 'Agendamento'],
      });

      testMovieId = movie.id;

      console.log(`\n   Movie created: ${movie.title}`);
      console.log(`   ID: ${movie.id}`);

      // Verificar que o job foi agendado no Redis
      const jobId = `movie-release-${movie.id}`;
      const job = await movieEmailQueue.getJob(jobId);

      expect(job).toBeDefined();
      expect(job?.data.movieId).toBe(movie.id);
      expect(job?.data.movieTitle).toBe(movie.title);
      expect(job?.data.userId).toBe(testUserId);

      const delay = job?.opts.delay || 0;
      const delayMinutes = Math.round(delay / 60000);

      console.log('\n   Job successfully scheduled in Redis!');
      console.log(`   Job ID: ${jobId}`);
      console.log(`   Delay: ${delay}ms (~${delayMinutes} minutes)`);
      console.log(`   State: ${await job?.getState()}`);
      console.log(`   Movie: ${job?.data.movieTitle}`);
      console.log(`   Email will be sent to: ${testEmail}`);

      console.log('\n   IMPORTANT:');
      console.log('   The email WAS SCHEDULED for real in Redis!');
      console.log('   In 3 minutes, the processor will send the email automatically');
      console.log('   Check your inbox after 3 minutes');
      console.log('   Resend Dashboard: https://resend.com/emails');
      console.log('\n   To cancel scheduling:');
      console.log(`   await job.remove(); // Job ID: ${jobId}\n`);

      // Validações
      expect(movie.id).toBeDefined();
      expect(job).not.toBeNull();
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThan(200000); // Menos de 3.5 minutos
    }, 30000);

    it('deve verificar job no Redis e aguardar processamento', async () => {
      console.log('\nWaiting for job processing...\n');

      if (!testMovieId) {
        console.log('   WARNING: Previous test did not create movie. Skipping...');
        return;
      }

      const jobId = `movie-release-${testMovieId}`;
      const job = await movieEmailQueue.getJob(jobId);

      if (!job) {
        console.log('   WARNING: Job not found in Redis.');
        return;
      }

      const state = await job.getState();
      console.log(`   Job current state: ${state}`);
      console.log(
        `   Job will be processed in: ${Math.round((job.opts.delay || 0) / 60000)} minutes`,
      );
      console.log('\n   To monitor processing:');
      console.log('   1. Keep server running (pnpm run start:dev)');
      console.log('   2. Watch MovieEmailProcessor logs');
      console.log('   3. Check your email after 3 minutes\n');

      expect(['delayed', 'waiting', 'active']).toContain(state);
    }, 10000);

    afterAll(async () => {
      // NÃO LIMPA OS RECURSOS - deixa job e filme para envio real de email
      if (testMovieId) {
        console.log(`\nWARNING: RESOURCES NOT CLEANED (intentional)`);
        console.log(`   The email WILL BE SENT in 3 minutes!`);
        console.log(`   Movie ID: ${testMovieId} (remains in database)`);
        console.log(`   Job ID: movie-release-${testMovieId} (remains in Redis)`);
        console.log(`\n   To clean manually later:`);
        console.log(`   DELETE FROM movies WHERE id = '${testMovieId}';`);
        console.log(`   (Job will be removed automatically after execution)\n`);
      }
    });
  });
});
