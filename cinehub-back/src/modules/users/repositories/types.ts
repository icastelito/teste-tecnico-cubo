/**
 * Tipos de domínio para o repositório de usuários
 * Independentes de frameworks e infraestrutura
 */

export interface CreateUserData {
  name: string;
  email: string;
  password: string; // Já deve vir hasheada
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}
