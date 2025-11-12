import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * Mail Module - Módulo de envio de emails
 * Fornece serviço abstrato para envio de emails (Resend, AWS SES, etc)
 */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
