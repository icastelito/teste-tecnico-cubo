import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

/**
 * Decorator para obter o usuário atual da requisição
 * Extrai o usuário do request após autenticação JWT
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

/**
 * Decorator para marcar rotas como públicas (sem autenticação)
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
