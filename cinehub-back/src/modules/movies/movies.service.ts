import { Injectable, NotFoundException, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateMovieDto, UpdateMovieDto, MovieResponseDto, FilterMoviesDto } from './dto';
import { IMoviesRepository, MOVIES_REPOSITORY } from './repositories';
import { Movie } from './entities/movie.entity';
import { MovieEmailJobData } from '@/core/queues/movie-email.processor';
import { StorageService } from '@/core/storage/storage.service';

/**
 * MoviesService - Camada de aplicação
 * Orquestra casos de uso e regras de negócio
 * Não depende de frameworks de infraestrutura (Prisma, etc)
 */
@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @Inject(MOVIES_REPOSITORY)
    private readonly moviesRepository: IMoviesRepository,
    @InjectQueue('movie-emails')
    private readonly movieEmailQueue: Queue<MovieEmailJobData>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Converte entidade de domínio para DTO de resposta
   */
  private toMovieResponse(movie: Movie, currentUserId?: string): MovieResponseDto {
    const response = new MovieResponseDto({
      ...movie.toObject(),
      isOwner: currentUserId ? movie.belongsToUser(currentUserId) : undefined,
    });
    return response;
  }

  /**
   * Caso de uso: Criar filme
   */
  async create(userId: string, createMovieDto: CreateMovieDto): Promise<MovieResponseDto> {
    // Preparar dados para persistência
    const movieData = {
      ...createMovieDto,
      releaseDate: new Date(createMovieDto.releaseDate),
      genres: createMovieDto.genres || [],
      productionCompanies: createMovieDto.productionCompanies || [],
      spokenLanguages: createMovieDto.spokenLanguages || [],
    };

    // Persistir através do repository
    const persisted = await this.moviesRepository.create(userId, movieData);

    // Converter para entidade de domínio
    const movie = Movie.fromPersistence(persisted);

    // Validar regras de negócio
    if (!movie.isValid()) {
      throw new Error('Dados do filme inválidos');
    }

    this.logger.log(`Filme criado: ${movie.title} por usuário ${userId}`);

    // Regra de negócio: agendar email se data futura
    if (movie.isFutureRelease()) {
      await this.scheduleMovieReleaseEmail(movie, userId);
    }

    return this.toMovieResponse(movie, userId);
  }

  /**
   * Caso de uso: Listar todos os filmes (de todos os usuários) com filtros
   */
  async findAll(userId: string, filters: FilterMoviesDto) {
    const {
      search,
      minDuration,
      maxDuration,
      startDate,
      endDate,
      genre,
      page = 1,
      limit = 10,
      sortBy = 'releaseDate',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Buscar TODOS os filmes (não filtra por userId)
    const { data, total } = await this.moviesRepository.findAll({
      search,
      minDuration,
      maxDuration,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      genre,
      skip,
      take: limit,
      sortBy,
      sortOrder,
    });

    // Converter para entidades de domínio
    const movies = data.map((movieData) => Movie.fromPersistence(movieData));

    const totalPages = Math.ceil(total / limit);

    return {
      data: movies.map((movie) => this.toMovieResponse(movie, userId)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Caso de uso: Buscar filme por ID
   * Qualquer usuário autenticado pode visualizar detalhes de qualquer filme
   */
  async findOne(id: string, userId: string): Promise<MovieResponseDto> {
    const movieData = await this.moviesRepository.findById(id);

    if (!movieData) {
      throw new NotFoundException('Filme não encontrado');
    }

    // Converter para entidade de domínio
    const movie = Movie.fromPersistence(movieData);

    // Sem verificação de ownership - qualquer usuário pode visualizar

    return this.toMovieResponse(movie, userId);
  }

  /**
   * Caso de uso: Atualizar filme
   */
  async update(
    id: string,
    userId: string,
    updateMovieDto: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    // Buscar filme existente
    const existingData = await this.moviesRepository.findById(id);

    if (!existingData) {
      throw new NotFoundException('Filme não encontrado');
    }

    // Converter para entidade de domínio
    const movie = Movie.fromPersistence(existingData);

    // Regra de negócio: verificar propriedade
    if (!movie.belongsToUser(userId)) {
      throw new ForbiddenException('Você não tem permissão para editar este filme');
    }

    // Preparar dados para atualização
    const updateData: any = {
      ...updateMovieDto,
    };

    if (updateMovieDto.releaseDate) {
      updateData.releaseDate = new Date(updateMovieDto.releaseDate);
    }

    // Atualizar através do repository
    const updatedData = await this.moviesRepository.update(id, updateData);

    // Converter para entidade
    const updatedMovie = Movie.fromPersistence(updatedData);

    // Reagendar email se a data de lançamento mudou
    if (updateMovieDto.releaseDate) {
      await this.rescheduleMovieReleaseEmail(updatedMovie, userId);
    }

    this.logger.log(`Filme atualizado: ${updatedMovie.title}`);

    return this.toMovieResponse(updatedMovie, userId);
  }

  /**
   * Caso de uso: Remover filme
   */
  async remove(id: string, userId: string): Promise<void> {
    // Buscar filme existente
    const movieData = await this.moviesRepository.findById(id);

    if (!movieData) {
      throw new NotFoundException('Filme não encontrado');
    }

    // Converter para entidade de domínio
    const movie = Movie.fromPersistence(movieData);

    // Regra de negócio: verificar propriedade
    if (!movie.belongsToUser(userId)) {
      throw new ForbiddenException('Você não tem permissão para deletar este filme');
    }

    // Cancelar job agendado de email (se existir)
    await this.cancelMovieReleaseEmail(id);

    // Deletar através do repository
    await this.moviesRepository.delete(id);

    this.logger.log(`Filme deletado: ${movie.title}`);
  }

  /**
   * Agenda email de lembrete de lançamento de filme
   * Job será executado na data de lançamento
   */
  private async scheduleMovieReleaseEmail(movie: Movie, userId: string): Promise<void> {
    try {
      // Calcular delay até a data de lançamento
      const now = new Date();
      const releaseDate = new Date(movie.releaseDate);
      const delay = releaseDate.getTime() - now.getTime();

      // Se a data já passou, não agendar (segurança adicional)
      if (delay <= 0) {
        this.logger.warn(
          `Filme ${movie.title} tem data de lançamento no passado, email não será agendado`,
        );
        return;
      }

      // Criar job com ID único baseado no movieId
      const jobId = `movie-release-${movie.id}`;

      await this.movieEmailQueue.add(
        'send-release-reminder',
        {
          movieId: movie.id,
          userId,
          movieTitle: movie.title,
          releaseDate: movie.releaseDate,
        },
        {
          jobId,
          delay, // Delay em milissegundos
          attempts: 3, // Tentar 3 vezes em caso de erro
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minuto de backoff inicial
          },
        },
      );

      this.logger.log(
        `Email de lembrete agendado para ${movie.title} em ${releaseDate.toISOString()} (delay: ${Math.round(delay / 1000 / 60)} minutos)`,
      );
    } catch (error) {
      this.logger.error(`Erro ao agendar email de lembrete para filme ${movie.id}:`, error.stack);
      // Não propagar o erro para não bloquear a criação do filme
    }
  }

  /**
   * Cancela email agendado de lançamento de filme
   */
  private async cancelMovieReleaseEmail(movieId: string): Promise<void> {
    try {
      const jobId = `movie-release-${movieId}`;
      const job = await this.movieEmailQueue.getJob(jobId);

      if (job) {
        await job.remove();
        this.logger.log(`Email de lembrete cancelado para filme ${movieId}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao cancelar email de lembrete para filme ${movieId}:`, error.stack);
      // Não propagar o erro
    }
  }

  /**
   * Reagenda email de lembrete quando a data de lançamento é atualizada
   */
  private async rescheduleMovieReleaseEmail(movie: Movie, userId: string): Promise<void> {
    // Primeiro cancelar job existente
    await this.cancelMovieReleaseEmail(movie.id);

    // Agendar novo job se ainda for data futura
    if (movie.isFutureRelease()) {
      await this.scheduleMovieReleaseEmail(movie, userId);
    }
  }

  /**
   * Caso de uso: Upload de poster do filme
   */
  async uploadPoster(
    movieId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<MovieResponseDto> {
    // Buscar filme
    const movieData = await this.moviesRepository.findById(movieId);

    if (!movieData) {
      throw new NotFoundException('Filme não encontrado');
    }

    const movie = Movie.fromPersistence(movieData);

    // Verificar propriedade
    if (!movie.belongsToUser(userId)) {
      throw new ForbiddenException('Você não tem permissão para editar este filme');
    }

    // Deletar poster antigo se existir
    if (movie.posterUrl) {
      try {
        const oldKey = movie.posterUrl.split('/').pop();
        if (oldKey) {
          await this.storageService.deleteImage(`movies/${movieId}/poster/${oldKey}`);
        }
      } catch (error) {
        this.logger.warn(`Falha ao deletar poster antigo: ${error.message}`);
      }
    }

    // Upload novo poster
    const key = `movies/${movieId}/poster/${Date.now()}-${file.originalname}`;
    const result = await this.storageService.uploadImage(file.buffer, key, file.mimetype);

    // Atualizar no banco
    const updatedData = await this.moviesRepository.update(movieId, {
      posterUrl: result.url,
    });

    this.logger.log(`Poster atualizado para filme ${movieId}`);

    return this.toMovieResponse(Movie.fromPersistence(updatedData), userId);
  }

  /**
   * Caso de uso: Upload de backdrop do filme
   */
  async uploadBackdrop(
    movieId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<MovieResponseDto> {
    // Buscar filme
    const movieData = await this.moviesRepository.findById(movieId);

    if (!movieData) {
      throw new NotFoundException('Filme não encontrado');
    }

    const movie = Movie.fromPersistence(movieData);

    // Verificar propriedade
    if (!movie.belongsToUser(userId)) {
      throw new ForbiddenException('Você não tem permissão para editar este filme');
    }

    // Deletar backdrop antigo se existir
    if (movie.backdropUrl) {
      try {
        const oldKey = movie.backdropUrl.split('/').pop();
        if (oldKey) {
          await this.storageService.deleteImage(`movies/${movieId}/backdrop/${oldKey}`);
        }
      } catch (error) {
        this.logger.warn(`Falha ao deletar backdrop antigo: ${error.message}`);
      }
    }

    // Upload novo backdrop
    const key = `movies/${movieId}/backdrop/${Date.now()}-${file.originalname}`;
    const result = await this.storageService.uploadImage(file.buffer, key, file.mimetype);

    // Atualizar no banco
    const updatedData = await this.moviesRepository.update(movieId, {
      backdropUrl: result.url,
    });

    this.logger.log(`Backdrop atualizado para filme ${movieId}`);

    return this.toMovieResponse(Movie.fromPersistence(updatedData), userId);
  }
}
