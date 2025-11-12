import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { IUsersRepository, USERS_REPOSITORY } from './repositories';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto, UserResponseDto } from './dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar se email já existe
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Criar user entity temporária para hashear senha
    const tempUser = new User('', '', '', '', new Date(), new Date());
    const hashedPassword = await tempUser.hashPassword(createUserDto.password);

    // Criar usuário com senha hasheada usando tipo de domínio
    const user = await this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
    });

    this.logger.log(`Usuário criado: ${user.email}`);

    return new UserResponseDto(user.toObject());
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll();

    return users.map((user) => new UserResponseDto(user.toObject()));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return new UserResponseDto(user.toObject());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Verificar se usuário existe
    const existingUser = await this.usersRepository.findOne(id);

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se estiver atualizando email, verificar se não está em uso
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailInUse = await this.usersRepository.findByEmail(updateUserDto.email);

      if (emailInUse) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Usar método de domínio para atualizar
    existingUser.update(updateUserDto);

    // Validar se o usuário atualizado é válido
    if (!existingUser.isValid()) {
      throw new BadRequestException('Dados de usuário inválidos');
    }

    // Persistir atualização usando tipo de domínio
    const updateData: { name?: string; email?: string } = {};
    if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;

    const updatedUser = await this.usersRepository.update(id, updateData);

    this.logger.log(`Usuário atualizado: ${updatedUser.email}`);

    return new UserResponseDto(updatedUser.toObject());
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    // Buscar usuário
    const user = await this.usersRepository.findOne(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar senha atual usando método de domínio
    const isPasswordValid = await user.validatePassword(updatePasswordDto.currentPassword);

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Validar força da nova senha
    if (!User.isStrongPassword(updatePasswordDto.newPassword)) {
      throw new BadRequestException('A nova senha não atende aos requisitos de segurança');
    }

    // Hash da nova senha
    const hashedPassword = await user.hashPassword(updatePasswordDto.newPassword);

    // Atualizar senha
    await this.usersRepository.updatePassword(id, hashedPassword);

    this.logger.log(`Senha atualizada para usuário: ${user.email}`);
  }

  async remove(id: string): Promise<void> {
    // Verificar se usuário existe
    const user = await this.usersRepository.findOne(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Deletar usuário (cascade irá deletar filmes relacionados)
    await this.usersRepository.remove(id);

    this.logger.log(`Usuário deletado: ${user.email}`);
  }

  /**
   * Valida senha (usado por outros módulos como Auth)
   */
  async validatePassword(password: string, user: User): Promise<boolean> {
    return user.validatePassword(password);
  }
}
