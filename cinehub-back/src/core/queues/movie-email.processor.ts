import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/core/database/prisma.service';
import { MailService } from '@/core/mail/mail.service';

/**
 * Interface para dados do job de email de filme
 */
export interface MovieEmailJobData {
  movieId: string;
  userId: string;
  movieTitle: string;
  releaseDate: Date;
}

/**
 * Movie Email Processor
 * Processa jobs agendados de envio de emails de lembrete de lançamento
 */
@Processor('movie-emails')
export class MovieEmailProcessor {
  private readonly logger = new Logger(MovieEmailProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Processa job de envio de email de lembrete
   */
  @Process('send-release-reminder')
  async handleMovieReleaseReminder(job: Job<MovieEmailJobData>) {
    const { movieId, userId, movieTitle, releaseDate } = job.data;

    this.logger.log(`Processando email de lembrete para filme: ${movieTitle} (${movieId})`);

    try {
      // Buscar dados atualizados do filme
      const movie = await this.prisma.movie.findUnique({
        where: { id: movieId },
        include: { user: true },
      });

      // Verificar se o filme ainda existe
      if (!movie) {
        this.logger.warn(`Filme ${movieId} não encontrado. Job cancelado.`);
        return;
      }

      // Verificar se o usuário ainda existe
      if (!movie.user) {
        this.logger.warn(`Usuário do filme ${movieId} não encontrado. Job cancelado.`);
        return;
      }

      // Enviar email de lembrete
      await this.mailService.sendMovieReleaseReminder(
        movie.user.email,
        movie.title,
        new Date(movie.releaseDate),
      );

      this.logger.log(
        `Email de lembrete enviado com sucesso para ${movie.user.email} sobre o filme ${movie.title}`,
      );
    } catch (error) {
      this.logger.error(`Erro ao enviar email de lembrete para filme ${movieId}:`, error.stack);
      throw error; // Re-throw para que o Bull tente novamente
    }
  }
}
