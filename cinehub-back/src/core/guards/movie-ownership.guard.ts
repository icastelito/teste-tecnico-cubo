/**
 * MovieOwnershipGuard não é necessário.
 *
 * A validação de ownership (se o filme pertence ao usuário) já está
 * implementada corretamente no MoviesService usando a entidade de domínio:
 *
 * - movie.belongsToUser(userId) no método findOne()
 * - movie.belongsToUser(userId) no método update()
 * - movie.belongsToUser(userId) no método remove()
 *
 * Implementar isso como Guard seria violação de Clean Architecture,
 * pois a regra de negócio ficaria na camada de apresentação ao invés
 * da camada de aplicação/domínio.
 *
 * Este arquivo pode ser deletado.
 */
