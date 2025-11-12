import { User } from '../entities/user.entity';
import { CreateUserData, UpdateUserData } from './types';

/**
 * Interface do repositório de usuários
 * Define contrato independente de implementação (Prisma, TypeORM, etc)
 */
export interface IUsersRepository {
  /**
   * Cria um novo usuário
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Busca todos os usuários
   */
  findAll(): Promise<User[]>;

  /**
   * Busca um usuário por ID
   */
  findOne(id: string): Promise<User | null>;

  /**
   * Busca um usuário por email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Atualiza dados de um usuário
   */
  update(id: string, data: UpdateUserData): Promise<User>;

  /**
   * Atualiza a senha de um usuário
   */
  updatePassword(id: string, hashedPassword: string): Promise<void>;

  /**
   * Remove um usuário
   */
  remove(id: string): Promise<void>;
}

/**
 * Token de injeção para o repositório de usuários
 * Usado para Dependency Injection no NestJS
 */
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
