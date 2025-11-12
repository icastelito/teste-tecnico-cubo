import { Movie } from '../entities/movie.entity';
import { CreateMovieData, UpdateMovieData, FindMoviesFilters } from './types';

/**
 * Interface do repositório de filmes
 * Define contrato independente de implementação (Prisma, TypeORM, etc)
 */
export interface IMoviesRepository {
  create(userId: string, data: CreateMovieData): Promise<Movie>;
  findById(id: string): Promise<Movie | null>;
  findAll(filters: FindMoviesFilters): Promise<{ data: Movie[]; total: number }>;
  findByUserId(
    userId: string,
    filters: FindMoviesFilters,
  ): Promise<{ data: Movie[]; total: number }>;
  update(id: string, data: UpdateMovieData): Promise<Movie>;
  delete(id: string): Promise<void>;
}

export const MOVIES_REPOSITORY = Symbol('MOVIES_REPOSITORY');
