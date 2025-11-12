import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { IUsersRepository, USERS_REPOSITORY } from './repositories';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto } from './dto';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<IUsersRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<IUsersRepository> = {
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updatePassword: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USERS_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(USERS_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123',
    };

    it('deve criar um novo usuário com sucesso', async () => {
      const mockUser = User.fromPersistence({
        id: '1',
        name: createUserDto.name,
        email: createUserDto.email,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.name).toBe(createUserDto.name);
      expect(result.email).toBe(createUserDto.email);
      expect(result).not.toHaveProperty('password');
      expect(repository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(repository.create).toHaveBeenCalled();
    });

    it('deve lançar ConflictException se email já existe', async () => {
      const existingUser = User.fromPersistence({
        id: '2',
        name: 'Existing',
        email: createUserDto.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar array de usuários', async () => {
      const mockUsers = [
        User.fromPersistence({
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          password: 'hashed',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        User.fromPersistence({
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          password: 'hashed',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('deve retornar array vazio se não há usuários', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário pelo ID', async () => {
      const mockUser = User.fromPersistence({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result).not.toHaveProperty('password');
      expect(repository.findOne).toHaveBeenCalledWith('1');
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('deve atualizar um usuário', async () => {
      const existingUser = User.fromPersistence({
        id: '1',
        name: 'Old Name',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedUser = User.fromPersistence({
        id: '1',
        name: 'Updated Name',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: existingUser.createdAt,
        updatedAt: new Date(),
      });

      repository.findOne.mockResolvedValue(existingUser);
      repository.findByEmail.mockResolvedValue(null);
      repository.update.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(result.name).toBe('Updated Name');
      expect(result).not.toHaveProperty('password');
      expect(repository.update).toHaveBeenCalledWith('1', updateUserDto);
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('999', updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se email já está em uso', async () => {
      const existingUser = User.fromPersistence({
        id: '1',
        name: 'User',
        email: 'old@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const otherUser = User.fromPersistence({
        id: '2',
        name: 'Other',
        email: 'new@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findOne.mockResolvedValue(existingUser);
      repository.findByEmail.mockResolvedValue(otherUser);

      await expect(service.update('1', { email: 'new@example.com' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updatePassword', () => {
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
    };

    it('deve atualizar a senha com senha atual correta', async () => {
      const mockUser = User.fromPersistence({
        id: '1',
        name: 'User',
        email: 'test@example.com',
        password: 'hashed_old_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(mockUser, 'validatePassword').mockResolvedValue(true);
      jest.spyOn(mockUser, 'hashPassword').mockResolvedValue('hashed_new_password');

      repository.findOne.mockResolvedValue(mockUser);
      repository.updatePassword.mockResolvedValue();

      await service.updatePassword('1', updatePasswordDto);

      expect(repository.updatePassword).toHaveBeenCalledWith('1', 'hashed_new_password');
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.updatePassword('999', updatePasswordDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se senha atual está incorreta', async () => {
      const mockUser = User.fromPersistence({
        id: '1',
        name: 'User',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(mockUser, 'validatePassword').mockResolvedValue(false);

      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.updatePassword('1', updatePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('deve deletar um usuário', async () => {
      const mockUser = User.fromPersistence({
        id: '1',
        name: 'User',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findOne.mockResolvedValue(mockUser);
      repository.remove.mockResolvedValue();

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalledWith('1');
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('deve validar senha usando o método do domain entity', async () => {
      const mockUser = User.fromPersistence({
        id: '1',
        name: 'User',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(mockUser, 'validatePassword').mockResolvedValue(true);

      const result = await service.validatePassword('TestPassword123', mockUser);

      expect(result).toBe(true);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('TestPassword123');
    });
  });
});
