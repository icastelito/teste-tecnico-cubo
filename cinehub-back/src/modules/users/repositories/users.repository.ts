import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { IUsersRepository } from './users.repository.interface';
import { CreateUserData, UpdateUserData } from './types';
import { User } from '../entities/user.entity';

/**
 * Implementação do repositório usando Prisma
 * Responsável por traduzir entre o modelo do Prisma e entidades de domínio
 */
@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    const userData = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, // Já vem hasheada do service
      },
    });

    return User.fromPersistence(userData);
  }

  async findAll(): Promise<User[]> {
    const usersData = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return usersData.map((userData) => User.fromPersistence(userData));
  }

  async findOne(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id },
    });

    return userData ? User.fromPersistence(userData) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email },
    });

    return userData ? User.fromPersistence(userData) : null;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const updatedData = await this.prisma.user.update({
      where: { id },
      data,
    });

    return User.fromPersistence(updatedData);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
