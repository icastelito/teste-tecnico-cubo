// ============== Movie Types ==============

export interface Movie {
	id: string;
	title: string;
	originalTitle?: string;
	subtitle?: string;
	description: string;
	releaseDate: string;
	duration: number;
	status?: string;
	ageRating?: string;
	budget?: number;
	revenue?: number;
	profit?: number;
	voteAverage?: number; // Avaliação do filme (0-10)
	voteCount?: number;
	popularity?: number;
	genres: string[];
	productionCompanies?: string[];
	spokenLanguages?: string[];
	posterUrl?: string;
	backdropUrl?: string;
	trailerUrl?: string;
	userId: string;
	isOwner?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateMovieDto {
	title: string;
	originalTitle?: string;
	subtitle?: string;
	description: string;
	releaseDate: string;
	duration: number;
	status?: string;
	ageRating?: string;
	budget?: number;
	revenue?: number;
	genres: string[];
	productionCompanies?: string[];
	spokenLanguages?: string[];
	trailerUrl?: string;
}

export interface UpdateMovieDto {
	title?: string;
	originalTitle?: string;
	subtitle?: string;
	description?: string;
	releaseDate?: string;
	duration?: number;
	status?: string;
	ageRating?: string;
	budget?: number;
	revenue?: number;
	genres?: string[];
	productionCompanies?: string[];
	spokenLanguages?: string[];
	trailerUrl?: string;
}

// ============== Filter Types ==============

export interface MovieFilters {
	search?: string;
	minDuration?: number;
	maxDuration?: number;
	startDate?: string;
	endDate?: string;
	genre?: string;
	page?: number;
	limit?: number;
	sortBy?: "releaseDate" | "title";
	sortOrder?: "asc" | "desc";
}

// ============== Response Types ==============

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
	meta?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export type MoviesResponse = PaginatedResponse<Movie>;

// ============== Auth Types ==============

export interface User {
	id: string;
	name: string;
	email: string;
	createdAt: string;
	updatedAt: string;
}

export interface LoginDto {
	email: string;
	password: string;
}

export interface RegisterDto {
	name: string;
	email: string;
	password: string;
}

export interface AuthResponse {
	access_token: string;
	user: User;
}

// ============== Error Types ==============

export interface ApiError {
	message: string;
	statusCode: number;
	error?: string;
}
