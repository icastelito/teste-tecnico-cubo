import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class MovieResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  originalTitle?: string;

  @Expose()
  subtitle?: string;

  @Expose()
  description: string;

  @Expose()
  @Type(() => Date)
  releaseDate: Date;

  @Expose()
  duration: number;

  @Expose()
  status?: string;

  @Expose()
  ageRating?: string;

  @Expose()
  budget?: number;

  @Expose()
  revenue?: number;

  @Expose()
  profit?: number;

  @Expose()
  posterUrl?: string;

  @Expose()
  backdropUrl?: string;

  @Expose()
  trailerUrl?: string;

  @Expose()
  genres: string[];

  @Expose()
  productionCompanies: string[];

  @Expose()
  spokenLanguages: string[];

  @Expose()
  voteAverage?: number;

  @Expose()
  voteCount?: number;

  @Expose()
  popularity?: number;

  @Expose()
  userId: string;

  @Expose()
  isOwner?: boolean;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  constructor(partial: Partial<MovieResponseDto>) {
    Object.assign(this, partial);
  }
}
