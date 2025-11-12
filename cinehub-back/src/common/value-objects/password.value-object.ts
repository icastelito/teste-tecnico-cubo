import * as bcrypt from 'bcryptjs';

/**
 * Value Object para Password
 * Encapsula validação, hash e comparação de senhas
 */
export class Password {
  private readonly hashedValue: string;
  private readonly SALT_ROUNDS = 10;

  private constructor(hashedPassword: string) {
    this.hashedValue = hashedPassword;
  }

  /**
   * Cria uma instância de Password a partir de senha plana
   */
  static async create(plainPassword: string): Promise<Password> {
    if (!this.isStrong(plainPassword)) {
      throw new Error(
        'Senha deve ter no mínimo 6 caracteres, incluindo: 1 letra maiúscula, 1 minúscula e 1 número',
      );
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    return new Password(hashedPassword);
  }

  /**
   * Cria uma instância de Password a partir de hash existente
   */
  static fromHash(hashedPassword: string): Password {
    return new Password(hashedPassword);
  }

  /**
   * Valida se a senha é forte
   */
  static isStrong(password: string): boolean {
    if (!password || password.length < 6 || password.length > 50) {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber;
  }

  /**
   * Compara senha plana com o hash armazenado
   */
  async compare(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hashedValue);
  }

  /**
   * Obtém o valor hasheado (para persistência)
   */
  getHash(): string {
    return this.hashedValue;
  }

  /**
   * Verifica se duas senhas são iguais (mesmo hash)
   */
  equals(other: Password): boolean {
    return this.hashedValue === other.hashedValue;
  }
}
