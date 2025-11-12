import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { IMoviesRepository } from './movies.repository.interface';
import { CreateMovieData, UpdateMovieData, FindMoviesFilters } from './types';
import { Movie } from '../entities/movie.entity';
import { Prisma } from '@prisma/client';

/**
 * Implementação do repositório usando Prisma
 * Responsável por traduzir entre o modelo do Prisma e entidades de domínio
 */
@Injectable()
export class MoviesRepository implements IMoviesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateMovieData): Promise<Movie> {
    const movieData = await this.prisma.movie.create({
      data: {
        ...data,
        userId,
        genres: data.genres || [],
        productionCompanies: data.productionCompanies || [],
        spokenLanguages: data.spokenLanguages || [],
      },
    });

    return Movie.fromPersistence(movieData);
  }

  async findById(id: string): Promise<Movie | null> {
    const movieData = await this.prisma.movie.findUnique({
      where: { id },
    });

    return movieData ? Movie.fromPersistence(movieData) : null;
  }

  async findAll(filters: FindMoviesFilters): Promise<{ data: Movie[]; total: number }> {
    const where: Prisma.MovieWhereInput = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { originalTitle: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      where.duration = {};
      if (filters.minDuration !== undefined) {
        where.duration.gte = filters.minDuration;
      }
      if (filters.maxDuration !== undefined) {
        where.duration.lte = filters.maxDuration;
      }
    }

    if (filters.startDate || filters.endDate) {
      where.releaseDate = {};
      if (filters.startDate) {
        where.releaseDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.releaseDate.lte = filters.endDate;
      }
    }

    if (filters.genre) {
      where.genres = {
        has: filters.genre,
      };
    }

    const orderBy: Prisma.MovieOrderByWithRelationInput = {
      [filters.sortBy]: filters.sortOrder,
    };

    const [moviesData, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy,
      }),
      this.prisma.movie.count({ where }),
    ]);

    const movies = moviesData.map((movieData) => Movie.fromPersistence(movieData));

    return { data: movies, total };
  }

  async findByUserId(
    userId: string,
    filters: FindMoviesFilters,
  ): Promise<{ data: Movie[]; total: number }> {
    const where: Prisma.MovieWhereInput = {
      userId,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { originalTitle: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      where.duration = {};
      if (filters.minDuration !== undefined) {
        where.duration.gte = filters.minDuration;
      }
      if (filters.maxDuration !== undefined) {
        where.duration.lte = filters.maxDuration;
      }
    }

    if (filters.startDate || filters.endDate) {
      where.releaseDate = {};
      if (filters.startDate) {
        where.releaseDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.releaseDate.lte = filters.endDate;
      }
    }

    if (filters.genre) {
      where.genres = {
        has: filters.genre,
      };
    }

    const orderBy: Prisma.MovieOrderByWithRelationInput = {
      [filters.sortBy]: filters.sortOrder,
    };

    const [moviesData, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy,
      }),
      this.prisma.movie.count({ where }),
    ]);

    // Converte dados do Prisma para entidades de domínio
    const movies = moviesData.map((movieData) => Movie.fromPersistence(movieData));

    return { data: movies, total };
  }

  async update(id: string, data: UpdateMovieData): Promise<Movie> {
    const updatedData = await this.prisma.movie.update({
      where: { id },
      data,
    });

    return Movie.fromPersistence(updatedData);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.movie.delete({
      where: { id },
    });
  }
}
