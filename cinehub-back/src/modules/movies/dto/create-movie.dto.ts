import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  originalTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsDateString()
  @IsNotEmpty()
  releaseDate: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  duration: number; // em minutos

  @IsString()
  @IsOptional()
  @MaxLength(50)
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ageRating?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  budget?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  revenue?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  profit?: number;

  @IsUrl()
  @IsOptional()
  posterUrl?: string;

  @IsUrl()
  @IsOptional()
  backdropUrl?: string;

  @IsUrl()
  @IsOptional()
  trailerUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  genres?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productionCompanies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  spokenLanguages?: string[];

  @IsNumber({ maxDecimalPlaces: 1 })
  @IsOptional()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  voteAverage?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  voteCount?: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  popularity?: number;
}
