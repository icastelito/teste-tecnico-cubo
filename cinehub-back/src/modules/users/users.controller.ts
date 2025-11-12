import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto } from './dto';
import { CurrentUser, Public } from '@/common/decorators';

/**
 * Users Controller - Rotas de usuários
 * Maioria das rotas requer autenticação, exceto criação (use /auth/register)
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * Rota pública para criar usuário (alternativa ao /auth/register)
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * GET /users
   * Lista todos os usuários (apenas para admin futuramente)
   */
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * GET /users/:id
   * Busca um usuário por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * PATCH /users/:id
   * Atualiza dados do usuário (apenas o próprio usuário)
   */
  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Verifica se o usuário está tentando editar seu próprio perfil
    if (user.id !== id) {
      throw new ForbiddenException('Você só pode editar seu próprio perfil');
    }
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * PATCH /users/:id/password
   * Atualiza senha do usuário (apenas o próprio usuário)
   */
  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    // Verifica se o usuário está tentando alterar sua própria senha
    if (user.id !== id) {
      throw new ForbiddenException('Você só pode alterar sua própria senha');
    }
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  /**
   * DELETE /users/:id
   * Remove usuário (apenas o próprio usuário)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    // Verifica se o usuário está tentando deletar sua própria conta
    if (user.id !== id) {
      throw new ForbiddenException('Você só pode deletar sua própria conta');
    }
    return this.usersService.remove(id);
  }
}
