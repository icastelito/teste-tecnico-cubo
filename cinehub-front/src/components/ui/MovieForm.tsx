import { useState, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { movieService } from "../../services/movieService";
import type { Movie, CreateMovieDto, UpdateMovieDto } from "../../types";
import "./MovieForm.css";

interface MovieFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	movie?: Movie;
}

export const MovieForm = ({ isOpen, onClose, onSuccess, movie }: MovieFormProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	// Form fields
	const [title, setTitle] = useState("");
	const [originalTitle, setOriginalTitle] = useState("");
	const [subtitle, setSubtitle] = useState("");
	const [description, setDescription] = useState("");
	const [releaseDate, setReleaseDate] = useState("");
	const [duration, setDuration] = useState("");
	const [status, setStatus] = useState("");
	const [ageRating, setAgeRating] = useState("");
	const [budget, setBudget] = useState("");
	const [revenue, setRevenue] = useState("");
	const [genres, setGenres] = useState("");
	const [productionCompanies, setProductionCompanies] = useState("");
	const [spokenLanguages, setSpokenLanguages] = useState("");
	const [trailerUrl, setTrailerUrl] = useState("");

	// Image uploads
	const [posterFile, setPosterFile] = useState<File | null>(null);
	const [backdropFile, setBackdropFile] = useState<File | null>(null);
	const [posterPreview, setPosterPreview] = useState("");
	const [backdropPreview, setBackdropPreview] = useState("");

	useEffect(() => {
		if (movie) {
			setTitle(movie.title);
			setOriginalTitle(movie.originalTitle || "");
			setSubtitle(movie.subtitle || "");
			setDescription(movie.description);
			setReleaseDate(movie.releaseDate.split("T")[0]);
			setDuration(movie.duration.toString());
			setStatus(movie.status || "");
			setAgeRating(movie.ageRating || "");
			setBudget(movie.budget?.toString() || "");
			setRevenue(movie.revenue?.toString() || "");
			setGenres(movie.genres.join(", "));
			setProductionCompanies(movie.productionCompanies?.join(", ") || "");
			setSpokenLanguages(movie.spokenLanguages?.join(", ") || "");
			setTrailerUrl(movie.trailerUrl || "");
			setPosterPreview(movie.posterUrl || "");
			setBackdropPreview(movie.backdropUrl || "");
		} else {
			resetForm();
		}
	}, [movie, isOpen]);

	const resetForm = () => {
		setTitle("");
		setOriginalTitle("");
		setSubtitle("");
		setDescription("");
		setReleaseDate("");
		setDuration("");
		setStatus("");
		setAgeRating("");
		setBudget("");
		setRevenue("");
		setGenres("");
		setProductionCompanies("");
		setSpokenLanguages("");
		setTrailerUrl("");
		setPosterFile(null);
		setBackdropFile(null);
		setPosterPreview("");
		setBackdropPreview("");
		setError("");
	};

	const handlePosterChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				setError("Poster deve ter no máximo 5MB");
				return;
			}
			setPosterFile(file);
			setPosterPreview(URL.createObjectURL(file));
		}
	};

	const handleBackdropChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				setError("Backdrop deve ter no máximo 5MB");
				return;
			}
			setBackdropFile(file);
			setBackdropPreview(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		// Validações
		if (!title.trim()) {
			setError("Título é obrigatório");
			return;
		}

		if (title.trim().length < 2) {
			setError("Título deve ter pelo menos 2 caracteres");
			return;
		}

		if (!description.trim()) {
			setError("Descrição é obrigatória");
			return;
		}

		if (description.trim().length < 10) {
			setError("Descrição deve ter pelo menos 10 caracteres");
			return;
		}

		if (!releaseDate) {
			setError("Data de lançamento é obrigatória");
			return;
		}

		if (!duration || parseInt(duration) <= 0) {
			setError("Duração deve ser maior que 0");
			return;
		}

		if (parseInt(duration) > 1000) {
			setError("Duração não pode ser maior que 1000 minutos");
			return;
		}

		if (!genres.trim()) {
			setError("Pelo menos um gênero é obrigatório");
			return;
		}

		if (budget && parseFloat(budget) < 0) {
			setError("Orçamento não pode ser negativo");
			return;
		}

		if (revenue && parseFloat(revenue) < 0) {
			setError("Receita não pode ser negativa");
			return;
		}

		if (trailerUrl && !trailerUrl.startsWith("http")) {
			setError("URL do trailer deve começar com http:// ou https://");
			return;
		}

		try {
			setIsLoading(true);

			const movieData: CreateMovieDto | UpdateMovieDto = {
				title: title.trim(),
				originalTitle: originalTitle.trim() || undefined,
				subtitle: subtitle.trim() || undefined,
				description: description.trim(),
				releaseDate,
				duration: parseInt(duration),
				status: status.trim() || undefined,
				ageRating: ageRating.trim() || undefined,
				budget: budget ? parseFloat(budget) : undefined,
				revenue: revenue ? parseFloat(revenue) : undefined,
				genres: genres
					.split(",")
					.map((g) => g.trim())
					.filter(Boolean),
				productionCompanies: productionCompanies
					.split(",")
					.map((p) => p.trim())
					.filter(Boolean),
				spokenLanguages: spokenLanguages
					.split(",")
					.map((l) => l.trim())
					.filter(Boolean),
				trailerUrl: trailerUrl.trim() || undefined,
			};

			let movieId: string;

			if (movie) {
				// Update
				await movieService.update(movie.id, movieData as UpdateMovieDto);
				movieId = movie.id;
			} else {
				// Create
				const created = await movieService.create(movieData as CreateMovieDto);
				movieId = created.id;
			}

			// Upload images if provided
			if (posterFile) {
				await movieService.uploadPoster(movieId, posterFile);
			}

			if (backdropFile) {
				await movieService.uploadBackdrop(movieId, backdropFile);
			}

			onSuccess();
			onClose();
			resetForm();
		} catch (err: any) {
			setError(err.response?.data?.message || "Erro ao salvar filme");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="lg">
			<div className="movie-form">
				<h2 className="movie-form__title">{movie ? "Editar Filme" : "Novo Filme"}</h2>

				<form onSubmit={handleSubmit} className="movie-form__form">
					{/* Basic Info */}
					<div className="movie-form__section">
						<h3>Informações Básicas</h3>

						<Input
							label="Título *"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Nome do filme"
							disabled={isLoading}
						/>

						<div className="movie-form__row">
							<Input
								label="Título Original"
								type="text"
								value={originalTitle}
								onChange={(e) => setOriginalTitle(e.target.value)}
								placeholder="Original title"
								disabled={isLoading}
							/>

							<Input
								label="Subtítulo"
								type="text"
								value={subtitle}
								onChange={(e) => setSubtitle(e.target.value)}
								placeholder="Tagline do filme"
								disabled={isLoading}
							/>
						</div>

						<div className="movie-form__textarea-group">
							<div className="movie-form__textarea-header">
								<label htmlFor="description">Descrição *</label>
								<span className="movie-form__char-counter">{description.length} caracteres</span>
							</div>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Sinopse do filme"
								rows={4}
								disabled={isLoading}
								className="movie-form__textarea"
							/>
						</div>

						<div className="movie-form__row">
							<Input
								label="Data de Lançamento *"
								type="date"
								value={releaseDate}
								onChange={(e) => setReleaseDate(e.target.value)}
								disabled={isLoading}
							/>

							<Input
								label="Duração (minutos) *"
								type="number"
								value={duration}
								onChange={(e) => setDuration(e.target.value)}
								placeholder="120"
								disabled={isLoading}
								min="1"
							/>
						</div>

						<div className="movie-form__row">
							<Input
								label="Status"
								type="text"
								value={status}
								onChange={(e) => setStatus(e.target.value)}
								placeholder="Lançado, Em produção, etc"
								disabled={isLoading}
							/>

							<Input
								label="Classificação Etária"
								type="text"
								value={ageRating}
								onChange={(e) => setAgeRating(e.target.value)}
								placeholder="L, 10, 12, 14, 16, 18"
								disabled={isLoading}
							/>
						</div>

						<div className="movie-form__row">
							<Input
								label="Orçamento ($)"
								type="number"
								value={budget}
								onChange={(e) => setBudget(e.target.value)}
								placeholder="150000000"
								disabled={isLoading}
								min="0"
								step="0.01"
							/>

							<Input
								label="Receita ($)"
								type="number"
								value={revenue}
								onChange={(e) => setRevenue(e.target.value)}
								placeholder="500000000"
								disabled={isLoading}
								min="0"
								step="0.01"
							/>
						</div>
					</div>

					{/* Categories */}
					<div className="movie-form__section">
						<h3>Categorias e Detalhes</h3>

						<Input
							label="Gêneros *"
							type="text"
							value={genres}
							onChange={(e) => setGenres(e.target.value)}
							placeholder="Ação, Drama, Ficção (separados por vírgula)"
							disabled={isLoading}
							helperText="Separe os gêneros por vírgula"
						/>

						<Input
							label="Produtoras"
							type="text"
							value={productionCompanies}
							onChange={(e) => setProductionCompanies(e.target.value)}
							placeholder="Warner Bros, Universal (separados por vírgula)"
							disabled={isLoading}
						/>

						<Input
							label="Idiomas"
							type="text"
							value={spokenLanguages}
							onChange={(e) => setSpokenLanguages(e.target.value)}
							placeholder="Português, Inglês (separados por vírgula)"
							disabled={isLoading}
						/>

						<Input
							label="URL do Trailer"
							type="url"
							value={trailerUrl}
							onChange={(e) => setTrailerUrl(e.target.value)}
							placeholder="https://www.youtube.com/watch?v=..."
							disabled={isLoading}
							helperText="URL do YouTube ou outro serviço de vídeo"
						/>
					</div>

					{/* Images */}
					<div className="movie-form__section">
						<h3>Imagens</h3>

						<div className="movie-form__row">
							{/* Poster */}
							<div className="movie-form__upload">
								<label>Poster (2:3)</label>
								<div className="movie-form__upload-preview">
									{posterPreview ? (
										<img src={posterPreview} alt="Poster preview" />
									) : (
										<div className="movie-form__upload-placeholder">
											<Icon icon="lets-icons:img-box" width="48" />
											<span>Nenhum poster</span>
										</div>
									)}
								</div>
								<label htmlFor="poster" className="movie-form__upload-button">
									<Icon icon="lets-icons:upload" width="20" />
									Escolher Poster
								</label>
								<input
									id="poster"
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={handlePosterChange}
									disabled={isLoading}
									className="movie-form__upload-input"
								/>
							</div>

							{/* Backdrop */}
							<div className="movie-form__upload">
								<label>Backdrop (16:9)</label>
								<div className="movie-form__upload-preview movie-form__upload-preview--backdrop">
									{backdropPreview ? (
										<img src={backdropPreview} alt="Backdrop preview" />
									) : (
										<div className="movie-form__upload-placeholder">
											<Icon icon="lets-icons:img-box" width="48" />
											<span>Nenhum backdrop</span>
										</div>
									)}
								</div>
								<label htmlFor="backdrop" className="movie-form__upload-button">
									<Icon icon="lets-icons:upload" width="20" />
									Escolher Backdrop
								</label>
								<input
									id="backdrop"
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={handleBackdropChange}
									disabled={isLoading}
									className="movie-form__upload-input"
								/>
							</div>
						</div>
						<p className="movie-form__helper">Tamanho máximo: 5MB por imagem</p>
					</div>

					{error && <div className="movie-form__error">{error}</div>}

					{/* Actions */}
					<div className="movie-form__actions">
						<Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
							Cancelar
						</Button>
						<Button type="submit" variant="primary" isLoading={isLoading}>
							<Icon icon="lets-icons:check" width="20" />
							{movie ? "Salvar Alterações" : "Criar Filme"}
						</Button>
					</div>
				</form>
			</div>
		</Modal>
	);
};
