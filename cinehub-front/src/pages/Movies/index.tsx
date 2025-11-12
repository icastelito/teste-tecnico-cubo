import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { MovieCard } from "../../components/ui/MovieCard";
import { MovieForm } from "../../components/ui/MovieForm";
import { FilterModal } from "../../components/ui/FilterModal";
import { movieService } from "../../services/movieService";
import type { Movie, MovieFilters } from "../../types";
import "./style.css";

export const Movies = () => {
	const { user } = useAuth();
	const [movies, setMovies] = useState<Movie[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [filters, setFilters] = useState<MovieFilters>({
		page: 1,
		limit: 10,
	});
	const [totalPages, setTotalPages] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	useEffect(() => {
		loadMovies();
	}, [filters]);

	const loadMovies = async () => {
		try {
			setIsLoading(true);
			setError("");
			const response = await movieService.list(filters);
			console.log("Resposta da API:", response);

			// Verifica se a resposta tem o formato esperado da API
			if (response && response.data) {
				setMovies(response.data);
				// API retorna pagination.totalPages
				setTotalPages(response.pagination?.totalPages || response.meta?.totalPages || 1);
			} else {
				// Caso a resposta seja apenas um array
				setMovies(Array.isArray(response) ? response : []);
				setTotalPages(1);
			}
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || err.message || "Erro ao carregar filmes";
			setError(errorMessage);
			console.error("Erro detalhado:", err);
			console.error("URL da API:", import.meta.env.VITE_API_URL || "http://localhost:3000/api");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
	};

	const handleApplyFilters = (newFilters: MovieFilters) => {
		setFilters(newFilters);
	};

	const handleFormSuccess = () => {
		loadMovies();
	};

	const getPageNumbers = () => {
		const currentPage = filters.page || 1;
		const pages: (number | string)[] = [];
		const maxButtons = 10;

		if (totalPages <= maxButtons) {
			// Se tiver até 10 páginas, mostra todas
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Sempre mostra primeira página
			pages.push(1);

			// Calcula o range ao redor da página atual
			let startPage = Math.max(2, currentPage - 3);
			let endPage = Math.min(totalPages - 1, currentPage + 3);

			// Ajusta se estiver muito no início
			if (currentPage <= 4) {
				endPage = Math.min(maxButtons - 1, totalPages - 1);
			}

			// Ajusta se estiver muito no final
			if (currentPage >= totalPages - 3) {
				startPage = Math.max(2, totalPages - (maxButtons - 2));
			}

			// Adiciona reticências no início se necessário
			if (startPage > 2) {
				pages.push("...");
			}

			// Adiciona páginas do meio
			for (let i = startPage; i <= endPage; i++) {
				pages.push(i);
			}

			// Adiciona reticências no final se necessário
			if (endPage < totalPages - 1) {
				pages.push("...");
			}

			// Sempre mostra última página
			pages.push(totalPages);
		}

		return pages;
	};

	return (
		<>
			<Header />
			<div className="movies-container">
				<div className="movies-toolbar">
					<form onSubmit={handleSearch} className="movies-search">
						<div className="movies-search-input">
							<Input
								type="text"
								placeholder="Pesquisar por filmes"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							<button type="submit" className="movies-search-icon">
								<Icon icon="lets-icons:search" width="20" />
							</button>
						</div>
					</form>
					<Button variant="secondary" onClick={() => setIsFilterOpen(true)}>
						Filtros
					</Button>
					<Button variant="primary" onClick={() => setIsFormOpen(true)}>
						Adicionar Filme
					</Button>
				</div>

				{/* Content */}
				{error && <div className="movies-error">{error}</div>}

				{isLoading ? (
					<div className="movies-loading">Carregando...</div>
				) : movies.length === 0 ? (
					<div className="movies-empty">
						<p>Nenhum filme encontrado</p>
						<Button>Adicionar primeiro filme</Button>
					</div>
				) : (
					<>
						<div className="movies-grid">
							{movies.map((movie) => (
								<MovieCard key={movie.id} movie={movie} />
							))}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="movies-pagination">
								<Button
									variant="secondary"
									size="sm"
									disabled={filters.page === 1}
									onClick={() =>
										setFilters((prev) => ({
											...prev,
											page: (prev.page || 1) - 1,
										}))
									}
								>
									<Icon icon="lets-icons:arrow-left" width="20" />
								</Button>

								{getPageNumbers().map((pageNum, index) => {
									if (pageNum === "...") {
										return (
											<span key={`ellipsis-${index}`} className="movies-pagination__ellipsis">
												...
											</span>
										);
									}

									return (
										<Button
											key={pageNum}
											variant={filters.page === pageNum ? "secondary" : "ghost"}
											size="sm"
											onClick={() =>
												setFilters((prev) => ({
													...prev,
													page: pageNum as number,
												}))
											}
										>
											{pageNum}
										</Button>
									);
								})}

								<Button
									variant="secondary"
									size="sm"
									disabled={filters.page === totalPages}
									onClick={() =>
										setFilters((prev) => ({
											...prev,
											page: (prev.page || 1) + 1,
										}))
									}
								>
									<Icon icon="lets-icons:arrow-right" width="20" />
								</Button>
							</div>
						)}
					</>
				)}
			</div>

			{/* Modals */}
			<MovieForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={handleFormSuccess} />

			<FilterModal
				isOpen={isFilterOpen}
				onClose={() => setIsFilterOpen(false)}
				onApply={handleApplyFilters}
				currentFilters={filters}
			/>

			<Footer />
		</>
	);
};
