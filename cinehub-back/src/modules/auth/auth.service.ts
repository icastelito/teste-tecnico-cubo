import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '@/core/mail/mail.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';

/**
 * AuthService - Caso de uso de autenticação
 * Orquestra login, registro e geração de tokens
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Caso de uso: Login
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Buscar usuário por email
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Validar senha usando método de domínio
    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar token JWT
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    this.logger.log(`Usuário autenticado: ${user.email}`);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  /**
   * Caso de uso: Registro
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Verificar se email já existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Criar usuário através do UsersService
    const userResponse = await this.usersService.create(registerDto);

    // Buscar usuário completo para gerar token
    const user = await this.usersService.findByEmail(registerDto.email);

    if (!user) {
      throw new Error('Erro ao criar usuário');
    }

    // Gerar token JWT
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    this.logger.log(`Novo usuário registrado: ${user.email}`);

    // Enviar email de boas-vindas (assíncrono, não bloqueia resposta)
    this.mailService.sendWelcomeEmail(user.email, user.name).catch((error) => {
      this.logger.error(`Falha ao enviar email de boas-vindas para ${user.email}`, error);
    });

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  /**
   * Valida e retorna dados do usuário a partir de payload do JWT
   */
  async validateUser(userId: string) {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }
}
