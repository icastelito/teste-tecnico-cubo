import { useNavigate } from "react-router-dom";
import type { Movie } from "../../types";
import "./MovieCard.css";

interface MovieCardProps {
	movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
	const navigate = useNavigate();
	const voteAverage = movie.voteAverage || 0;
	const percentage = (voteAverage / 10) * 100; // Converte 0-10 para 0-100%
	const circumference = 2 * Math.PI * 18; // raio de 18
	const offset = circumference - (percentage / 100) * circumference;

	return (
		<div className="movie-card" onClick={() => navigate(`/movies/${movie.id}`)}>
			<div className="movie-card__poster">
				{movie.posterUrl ? (
					<img src={movie.posterUrl} alt={movie.title} />
				) : (
					<div className="movie-card__poster-placeholder">🎬</div>
				)}

				<div className="movie-card__overlay">
					<div className="movie-card__title">{movie.title}</div>
					<div className="movie-card__genres">
						{movie.genres.slice(0, 3).map((genre) => (
							<span key={genre} className="movie-card__genre">
								{genre}
							</span>
						))}
					</div>
				</div>

				<div className="movie-card__rate">
					<svg className="movie-card__rate-circle" viewBox="0 0 40 40">
						<circle className="movie-card__rate-bg" cx="20" cy="20" r="18" />
						<circle
							className="movie-card__rate-progress"
							cx="20"
							cy="20"
							r="18"
							strokeDasharray={circumference}
							strokeDashoffset={offset}
						/>
					</svg>
					<span className="movie-card__rate-text">{voteAverage.toFixed(1)}</span>
				</div>
			</div>
		</div>
	);
};
