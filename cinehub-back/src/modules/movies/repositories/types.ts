/**
 * Tipos de domínio para o repositório de filmes
 * Independentes de frameworks e infraestrutura
 */

export interface CreateMovieData {
  title: string;
  originalTitle?: string;
  description: string;
  releaseDate: Date;
  duration: number;
  budget?: number;
  revenue?: number;
  posterUrl?: string;
  backdropUrl?: string;
  genres?: string[];
  productionCompanies?: string[];
  spokenLanguages?: string[];
  voteAverage?: number;
  voteCount?: number;
  popularity?: number;
}

export interface UpdateMovieData {
  title?: string;
  originalTitle?: string;
  description?: string;
  releaseDate?: Date;
  duration?: number;
  budget?: number;
  revenue?: number;
  posterUrl?: string;
  backdropUrl?: string;
  genres?: string[];
  productionCompanies?: string[];
  spokenLanguages?: string[];
  voteAverage?: number;
  voteCount?: number;
  popularity?: number;
}

export interface FindMoviesFilters {
  search?: string;
  minDuration?: number;
  maxDuration?: number;
  startDate?: Date;
  endDate?: Date;
  genre?: string;
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FindMoviesResult {
  data: any[]; // Será processado pelo repository para retornar entidades
  total: number;
}
