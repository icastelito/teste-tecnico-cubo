import * as bcrypt from 'bcryptjs';

/**
 * User Domain Entity - Encapsula regras de negócio do usuário
 * Representa o conceito de usuário no domínio da aplicação
 */
export class User {
  private readonly SALT_ROUNDS = 10;

  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public password: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para criar User a partir de dados do banco
   */
  static fromPersistence(data: any): User {
    return new User(data.id, data.name, data.email, data.password, data.createdAt, data.updatedAt);
  }

  /**
   * Valida se o email tem formato válido
   */
  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  /**
   * Valida se a senha é forte (mínimo 6 caracteres, 1 maiúscula, 1 minúscula, 1 número)
   */
  static isStrongPassword(password: string): boolean {
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  }

  /**
   * Gera hash da senha
   */
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  /**
   * Valida senha comparando com hash armazenado
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  /**
   * Atualiza dados do usuário
   */
  update(data: { name?: string; email?: string }): void {
    if (data.name !== undefined) {
      this.name = data.name;
    }
    if (data.email !== undefined) {
      this.email = data.email;
    }
  }

  /**
   * Verifica se o usuário é válido
   */
  isValid(): boolean {
    return (
      this.name.length >= 3 &&
      this.name.length <= 100 &&
      this.isValidEmail() &&
      this.email.length <= 255
    );
  }

  /**
   * Converte para objeto simples (sem senha)
   */
  toObject(): Omit<
    User,
    | 'password'
    | 'hashPassword'
    | 'validatePassword'
    | 'update'
    | 'isValid'
    | 'isValidEmail'
    | 'toObject'
    | 'toJSON'
    | 'SALT_ROUNDS'
  > {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Serialização JSON (remove senha)
   */
  toJSON() {
    return this.toObject();
  }
}
