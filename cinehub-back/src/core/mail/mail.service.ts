import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Interface para dados de email
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Mail Service - Serviço de envio de emails
 * Integração com Resend para envio real de emails
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly resend: Resend;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService?.get<string>('MAIL_FROM') || 'onboarding@resend.dev';
    const apiKey = this.configService?.get<string>('RESEND_API_KEY');
    this.isProduction = this.configService?.get<string>('NODE_ENV') === 'production';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend initialized successfully');
    } else {
      this.logger.warn('RESEND_API_KEY not found - emails will be mocked');
    }
  }

  /**
   * Envia um email
   *
   * @param options - Opções de envio do email
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const from = options.from || this.fromEmail;

      // Se não tiver API key do Resend, apenas logar (modo dev)
      if (!this.resend) {
        this.logger.log(`[MOCK] Email sent to: ${options.to}`);
        this.logger.debug(`[MOCK] Subject: ${options.subject}`);
        this.logger.debug(`[MOCK] From: ${from}`);
        return;
      }

      // Envio real com Resend
      const { data, error } = await this.resend.emails.send({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (error) {
        this.logger.error(`Failed to send email via Resend:`, error);
        throw new Error(`Resend error: ${error.message}`);
      }

      this.logger.log(`Email sent successfully to: ${options.to}`);
      this.logger.debug(`Email ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Failed to send email to: ${options.to}`, error);
      throw new Error('Falha ao enviar email');
    }
  }

  /**
   * Envia email de boas-vindas
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    await this.sendEmail({
      to,
      subject: 'Bem-vindo ao Cubes Movies!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Cubes Movies</h1>
              </div>
              <div class="content">
                <h2>Olá, ${userName}!</h2>
                <p>Seja muito bem-vindo ao <strong>Cubes Movies</strong>, sua plataforma pessoal de gerenciamento de filmes!</p>
                <p>Agora você pode:</p>
                <ul>
                  <li>Adicionar seus filmes favoritos</li>
                  <li>Fazer upload de posters e backdrops</li>
                  <li>Receber lembretes de lançamentos</li>
                  <li>Buscar e filtrar sua coleção</li>
                </ul>
                <div style="text-align: center;">
                  <a href="${appUrl}" class="button">Começar Agora</a>
                </div>
              </div>
              <div class="footer">
                <p>Cubes Movies - Sua coleção de filmes em um só lugar</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Olá ${userName}! Seja bem-vindo ao Cubes Movies, sua plataforma de gerenciamento de filmes. Acesse: ${appUrl}`,
    });
  }

  /**
   * Envia email de lembrete de lançamento de filme
   */
  async sendMovieReleaseReminder(to: string, movieTitle: string, releaseDate: Date): Promise<void> {
    const formattedDate = releaseDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    await this.sendEmail({
      to,
      subject: `${movieTitle} - Lançamento Hoje!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .movie-title { font-size: 24px; color: #f5576c; margin: 20px 0; text-align: center; }
              .date-badge { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; }
              .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Lembrete de Lançamento</h1>
              </div>
              <div class="content">
                <p style="text-align: center; font-size: 18px;">O grande dia chegou!</p>
                <div class="movie-title">${movieTitle}</div>
                <p style="text-align: center;">
                  <span class="date-badge">${formattedDate}</span>
                </p>
                <p>O filme <strong>${movieTitle}</strong> que você adicionou à sua lista está sendo lançado hoje!</p>
                <p>Não perca a oportunidade de assistir!</p>
                <div style="text-align: center;">
                  <a href="${appUrl}/movies" class="button">Ver Minha Coleção</a>
                </div>
              </div>
              <div class="footer">
                <p>Cubes Movies - Nunca perca um lançamento</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Lembrete: O filme "${movieTitle}" está sendo lançado hoje (${formattedDate})! Não perca! Acesse: ${appUrl}`,
    });
  }

  /**
   * Envia email de recuperação de senha
   */
  async sendPasswordResetEmail(to: string, resetToken: string, userName: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to,
      subject: 'Recuperação de Senha - Cubes Movies',
      html: `
        <h1>Olá ${userName}!</h1>
        <p>Você solicitou a recuperação de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
      `,
      text: `Olá ${userName}! Você solicitou recuperação de senha. Acesse: ${resetUrl} (expira em 1 hora)`,
    });
  }
}
