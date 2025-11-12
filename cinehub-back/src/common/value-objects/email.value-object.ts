/**
 * Value Object para Email
 * Encapsula validação e comportamentos relacionados a email
 */
export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Email inválido');
    }
    this.value = email.toLowerCase().trim();
  }

  private isValid(email: string): boolean {
    if (!email || email.length > 255) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  /**
   * Obtém o domínio do email
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Obtém a parte local do email (antes do @)
   */
  getLocalPart(): string {
    return this.value.split('@')[0];
  }
}
