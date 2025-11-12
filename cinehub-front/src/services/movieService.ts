import { api } from "./api";
import type { Movie, CreateMovieDto, UpdateMovieDto, MoviesResponse, MovieFilters } from "../types";

export const movieService = {
	/**
	 * Lista filmes com filtros e paginação
	 */
	async list(filters: MovieFilters = {}): Promise<MoviesResponse> {
		const params = new URLSearchParams();

		// Filtros de busca
		if (filters.search) params.append("search", filters.search);
		if (filters.genre) params.append("genre", filters.genre);

		// Filtros de duração
		if (filters.minDuration) params.append("minDuration", filters.minDuration.toString());
		if (filters.maxDuration) params.append("maxDuration", filters.maxDuration.toString());

		// Filtros de data
		if (filters.startDate) params.append("startDate", filters.startDate);
		if (filters.endDate) params.append("endDate", filters.endDate);

		// Paginação
		params.append("page", (filters.page || 1).toString());
		params.append("limit", (filters.limit || 10).toString());

		// Ordenação
		if (filters.sortBy) params.append("sortBy", filters.sortBy);
		if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

		const response = await api.get<MoviesResponse>(`/movies?${params.toString()}`);
		return response.data;
	},

	/**
	 * Busca filme por ID
	 */
	async getById(id: string): Promise<Movie> {
		const response = await api.get<Movie>(`/movies/${id}`);
		return response.data;
	},

	/**
	 * Cria novo filme
	 */
	async create(data: CreateMovieDto): Promise<Movie> {
		const response = await api.post<Movie>("/movies", data);
		return response.data;
	},

	/**
	 * Atualiza filme existente
	 */
	async update(id: string, data: UpdateMovieDto): Promise<Movie> {
		const response = await api.patch<Movie>(`/movies/${id}`, data);
		return response.data;
	},

	/**
	 * Deleta filme
	 */
	async delete(id: string): Promise<void> {
		await api.delete(`/movies/${id}`);
	},

	/**
	 * Upload de poster do filme
	 */
	async uploadPoster(id: string, file: File): Promise<Movie> {
		const formData = new FormData();
		formData.append("file", file);

		const response = await api.post<Movie>(`/movies/${id}/poster`, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	},

	/**
	 * Upload de backdrop do filme
	 */
	async uploadBackdrop(id: string, file: File): Promise<Movie> {
		const formData = new FormData();
		formData.append("file", file);

		const response = await api.post<Movie>(`/movies/${id}/backdrop`, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	},
};
