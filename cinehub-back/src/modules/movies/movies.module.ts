import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { PrismaModule } from '@/core/database/prisma.module';
import { StorageModule } from '@/core/storage/storage.module';
import { MoviesRepository, MOVIES_REPOSITORY } from './repositories';

/**
 * MoviesModule - Seguindo Clean Architecture
 * - Controller (Presentation Layer)
 * - Service (Application Layer - Use Cases)
 * - Repository (Infrastructure Layer - Data Access)
 * - Entity (Domain Layer - Business Logic)
 */
@Module({
  imports: [
    PrismaModule,
    StorageModule,
    BullModule.registerQueue({
      name: 'movie-emails',
    }),
  ],
  controllers: [MoviesController],
  providers: [
    MoviesService,
    {
      provide: MOVIES_REPOSITORY,
      useClass: MoviesRepository,
    },
  ],
  exports: [MoviesService],
})
export class MoviesModule {}
