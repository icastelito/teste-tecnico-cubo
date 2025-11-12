import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MovieEmailProcessor } from './movie-email.processor';
import { PrismaModule } from '@/core/database/prisma.module';
import { MailModule } from '@/core/mail/mail.module';

/**
 * Queues Module
 * Gerencia filas de processamento assíncrono (emails, notificações, etc)
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'movie-emails',
    }),
    PrismaModule,
    MailModule,
  ],
  providers: [MovieEmailProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
