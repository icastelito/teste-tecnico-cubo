/**
 * Movie Entity - Entidade de domínio pura
 * Representa um filme no domínio da aplicação
 * Sem dependências de frameworks ou infraestrutura
 */
export class Movie {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public releaseDate: Date,
    public duration: number,
    public userId: string,
    public originalTitle?: string,
    public subtitle?: string,
    public status?: string,
    public ageRating?: string,
    public budget?: number,
    public revenue?: number,
    public profit?: number,
    public posterUrl?: string,
    public backdropUrl?: string,
    public trailerUrl?: string,
    public genres: string[] = [],
    public productionCompanies: string[] = [],
    public spokenLanguages: string[] = [],
    public voteAverage?: number,
    public voteCount?: number,
    public popularity?: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Verifica se o filme pertence ao usuário
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Verifica se a data de lançamento é futura
   */
  isFutureRelease(): boolean {
    return this.releaseDate > new Date();
  }

  /**
   * Valida se o filme tem os dados mínimos necessários
   */
  isValid(): boolean {
    return (
      !!this.title &&
      this.title.length >= 1 &&
      !!this.description &&
      this.description.length >= 10 &&
      this.duration > 0 &&
      this.duration <= 1000 &&
      !!this.releaseDate &&
      !!this.userId
    );
  }

  /**
   * Atualiza propriedades do filme
   */
  update(data: Partial<Omit<Movie, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this, data);
  }

  /**
   * Converte para objeto plano (para persistência)
   */
  toObject() {
    return {
      id: this.id,
      title: this.title,
      originalTitle: this.originalTitle,
      subtitle: this.subtitle,
      description: this.description,
      releaseDate: this.releaseDate,
      duration: this.duration,
      status: this.status,
      ageRating: this.ageRating,
      budget: this.budget,
      revenue: this.revenue,
      profit: this.profit,
      posterUrl: this.posterUrl,
      backdropUrl: this.backdropUrl,
      trailerUrl: this.trailerUrl,
      genres: this.genres,
      productionCompanies: this.productionCompanies,
      spokenLanguages: this.spokenLanguages,
      voteAverage: this.voteAverage,
      voteCount: this.voteCount,
      popularity: this.popularity,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Factory method para criar instância a partir de dados do banco
   */
  static fromPersistence(data: any): Movie {
    return new Movie(
      data.id,
      data.title,
      data.description,
      data.releaseDate,
      data.duration,
      data.userId,
      data.originalTitle,
      data.subtitle,
      data.status,
      data.ageRating,
      data.budget ? Number(data.budget) : undefined,
      data.revenue ? Number(data.revenue) : undefined,
      data.profit ? Number(data.profit) : undefined,
      data.posterUrl,
      data.backdropUrl,
      data.trailerUrl,
      data.genres || [],
      data.productionCompanies || [],
      data.spokenLanguages || [],
      data.voteAverage ? Number(data.voteAverage) : undefined,
      data.voteCount,
      data.popularity ? Number(data.popularity) : undefined,
      data.createdAt,
      data.updatedAt,
    );
  }
}
