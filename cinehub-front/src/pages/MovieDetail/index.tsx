import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { Button } from "../../components/ui/Button";
import { MovieForm } from "../../components/ui/MovieForm";
import { movieService } from "../../services/movieService";
import type { Movie } from "../../types";
import "./style.css";

export const MovieDetail = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [movie, setMovie] = useState<Movie | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [isEditOpen, setIsEditOpen] = useState(false);

	useEffect(() => {
		if (id) {
			loadMovie(id);
		}
	}, [id]);

	const loadMovie = async (movieId: string) => {
		try {
			setIsLoading(true);
			const data = await movieService.getById(movieId);
			setMovie(data);
		} catch (err) {
			setError("Erro ao carregar filme");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!movie || !confirm("Tem certeza que deseja deletar este filme?")) return;

		try {
			await movieService.delete(movie.id);
			navigate("/movies");
		} catch (err) {
			alert("Erro ao deletar filme");
			console.error(err);
		}
	};

	const handleEditSuccess = () => {
		if (id) {
			loadMovie(id);
		}
	};

	if (isLoading) {
		return (
			<div className="movie-detail-container">
				<div className="movie-detail-loading">Carregando...</div>
			</div>
		);
	}

	if (error || !movie) {
		return (
			<div className="movie-detail-container">
				<div className="movie-detail-error">{error || "Filme não encontrado"}</div>
				<Button onClick={() => navigate("/movies")}>Voltar</Button>
			</div>
		);
	}

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}min`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const formatCurrency = (value?: number) => {
		if (!value) return "N/A";
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "USD",
		}).format(value);
	};

	const formatCompactNumber = (value?: number) => {
		if (!value) return "N/A";

		const absValue = Math.abs(value);
		let result = "";

		if (absValue >= 1_000_000_000) {
			const num = value / 1_000_000_000;
			result = `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}B`;
		} else if (absValue >= 1_000_000) {
			const num = value / 1_000_000;
			result = `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}M`;
		} else if (absValue >= 1_000) {
			const num = value / 1_000;
			result = `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}K`;
		} else {
			result = `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}`;
		}

		return result;
	};

	const getYouTubeVideoId = (url: string) => {
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : null;
	};

	return (
		<>
			<Header />
			<div className="movie-detail-container">
				{/* Content */}
				<div className="movie-detail-content">
					<div className="movie-detail-header">
						{/* Actions - Só mostra se for o dono */}
						{movie.isOwner && (
							<div className="movie-detail-actions">
								<Button variant="secondary" size="sm" onClick={handleDelete}>
									Deletar
								</Button>
								<Button variant="primary" size="sm" onClick={() => setIsEditOpen(true)}>
									Editar
								</Button>
							</div>
						)}
					</div>

					{/* Caixa 1: Filme (3 colunas) */}
					<div className="movie-detail-movie-box">
						{movie.backdropUrl && (
							<div
								className="movie-detail-info-backdrop"
								style={{ backgroundImage: `url(${movie.backdropUrl})` }}
							/>
						)}
						<div className="movie-detail-main">
							<div className="movie-detail-poster-column">
								<div className="movie-detail-title-section">
									<h1 className="movie-detail-title">{movie.title}</h1>
									{movie.originalTitle && (
										<p className="movie-detail-original-title">{movie.originalTitle}</p>
									)}
								</div>
								<div className="movie-detail-poster">
									{movie.posterUrl ? (
										<img src={movie.posterUrl} alt={movie.title} />
									) : (
										<div className="movie-detail-poster-placeholder">🎬</div>
									)}
								</div>
							</div>
							<div className="movie-detail-info">
								{movie.subtitle && (
									<div className="movie-detail-info-card movie-detail-info-card--subtitle">
										<h2 className="movie-detail-subtitle">{movie.subtitle}</h2>
									</div>
								)}

								{/* Card 2: Sinopse (com fundo) */}
								<div className="movie-detail-info-card movie-detail-info-card--synopsis">
									<h3>Sinopse</h3>
									<p>{movie.description}</p>
								</div>

								{/* Card 3: Gêneros (com fundo) */}
								<div className="movie-detail-info-card movie-detail-info-card--genres">
									<h3>Gêneros</h3>
									<div className="movie-detail-genres">
										{movie.genres.map((genre) => (
											<span key={genre} className="movie-detail-genre">
												{genre}
											</span>
										))}
									</div>
								</div>
							</div>{" "}
							<div className="movie-detail-stats">
								<div className="movie-detail-stats-row">
									{movie.ageRating && (
										<div className="movie-detail-stat">
											<span className="movie-detail-stat-label">Classificação</span>
											<span className="movie-detail-stat-value">{movie.ageRating}</span>
										</div>
									)}

									{movie.voteCount !== undefined && (
										<div className="movie-detail-stat">
											<span className="movie-detail-stat-label">Votos</span>
											<span className="movie-detail-stat-value">
												{movie.voteCount.toLocaleString("pt-BR")}
											</span>
										</div>
									)}

									{movie.voteAverage !== undefined && (
										<div className="movie-detail-stat movie-detail-stat--rating">
											<span className="movie-detail-stat-label">Avaliação</span>
											<div className="movie-detail-rating">
												<svg className="movie-detail-rating-circle" viewBox="0 0 40 40">
													<circle className="movie-detail-rating-bg" cx="20" cy="20" r="18" />
													<circle
														className="movie-detail-rating-progress"
														cx="20"
														cy="20"
														r="18"
														strokeDasharray={2 * Math.PI * 18}
														strokeDashoffset={
															2 * Math.PI * 18 -
															(((movie.voteAverage / 10) * 100) / 100) *
																(2 * Math.PI * 18)
														}
													/>
												</svg>
												<span className="movie-detail-rating-text">
													{movie.voteAverage.toFixed(1)}
												</span>
											</div>
										</div>
									)}
								</div>

								{/* Linha 2: Lançamento, Duração */}
								<div className="movie-detail-stats-row">
									<div className="movie-detail-stat">
										<span className="movie-detail-stat-label">Lançamento</span>
										<span className="movie-detail-stat-value">{formatDate(movie.releaseDate)}</span>
									</div>

									<div className="movie-detail-stat">
										<span className="movie-detail-stat-label">Duração</span>
										<span className="movie-detail-stat-value">
											{formatDuration(movie.duration)}
										</span>
									</div>
								</div>

								{/* Linha 3: Situação, Idiomas */}
								<div className="movie-detail-stats-row">
									{movie.status && (
										<div className="movie-detail-stat">
											<span className="movie-detail-stat-label">Situação</span>
											<span className="movie-detail-stat-value">{movie.status}</span>
										</div>
									)}

									{movie.spokenLanguages && movie.spokenLanguages.length > 0 && (
										<div className="movie-detail-stat">
											<span className="movie-detail-stat-label">Idiomas</span>
											<span className="movie-detail-stat-value">
												{movie.spokenLanguages.join(", ")}
											</span>
										</div>
									)}
								</div>

								{/* Linha 4: Orçamento, Receita, Lucro */}
								<div className="movie-detail-stats-row">
									{movie.budget !== undefined && (
										<div className="movie-detail-stat">
											<span className="movie-detail-stat-label">Orçamento</span>
											<span className="movie-detail-stat-value">
												{formatCompactNumber(movie.budget)}
											</span>
										</div>
									)}

									{movie.revenue !== undefined && (
										<div className="movie-detail-stat">
											<span className="movie-detail-stat-label">Receita</span>
											<span className="movie-detail-stat-value">
												{formatCompactNumber(movie.revenue)}
											</span>
										</div>
									)}

									{movie.profit !== undefined && (
										<div className="movie-detail-stat">
											<span className="movie-detail-stat-label">Lucro</span>
											<span className="movie-detail-stat-value">
												{formatCompactNumber(movie.profit)}
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Caixa 2: Trailer */}
					{movie.trailerUrl && (
						<div className="movie-detail-trailer-box">
							<h3>Trailer</h3>
							<div className="movie-detail-trailer-wrapper">
								{getYouTubeVideoId(movie.trailerUrl) ? (
									<iframe
										src={`https://www.youtube.com/embed/${getYouTubeVideoId(movie.trailerUrl)}`}
										title="Trailer"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
									/>
								) : (
									<a
										href={movie.trailerUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="movie-detail-trailer-link"
									>
										<Icon icon="lets-icons:play-fill" width="48" />
										<span>Assistir Trailer</span>
									</a>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Edit Modal */}
			<MovieForm
				isOpen={isEditOpen}
				onClose={() => setIsEditOpen(false)}
				onSuccess={handleEditSuccess}
				movie={movie || undefined}
			/>

			<Footer />
		</>
	);
};
