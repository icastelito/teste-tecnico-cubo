import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO base para paginação
 * Pode ser estendido por outros DTOs que precisam de paginação
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Interface para resposta paginada
 * Tipo genérico para qualquer tipo de dado
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Interface para metadados de paginação
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Helper para criar resposta paginada
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Helper para criar metadados de paginação completos
 */
export function createPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * DTO base para respostas de sucesso
 */
export class SuccessResponseDto<T = any> {
  success: boolean = true;
  message?: string;
  data?: T;
  timestamp: string = new Date().toISOString();

  constructor(data?: T, message?: string) {
    this.data = data;
    this.message = message;
  }
}

/**
 * DTO base para respostas de erro
 */
export class ErrorResponseDto {
  success: boolean = false;
  statusCode: number;
  message: string;
  errors?: any[];
  timestamp: string = new Date().toISOString();
  path?: string;

  constructor(statusCode: number, message: string, errors?: any[], path?: string) {
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.path = path;
  }
}
