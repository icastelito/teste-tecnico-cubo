import { useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import type { MovieFilters } from "../../types";
import "./FilterModal.css";

interface FilterModalProps {
	isOpen: boolean;
	onClose: () => void;
	onApply: (filters: MovieFilters) => void;
	currentFilters: MovieFilters;
}

export const FilterModal = ({ isOpen, onClose, onApply, currentFilters }: FilterModalProps) => {
	const [minDuration, setMinDuration] = useState(currentFilters.minDuration?.toString() || "");
	const [maxDuration, setMaxDuration] = useState(currentFilters.maxDuration?.toString() || "");
	const [startDate, setStartDate] = useState(currentFilters.startDate || "");
	const [endDate, setEndDate] = useState(currentFilters.endDate || "");
	const [genre, setGenre] = useState(currentFilters.genre || "");

	// Count active filters
	const getActiveFilters = () => {
		const active = [];
		if (currentFilters.minDuration)
			active.push({ key: "minDuration", label: `Duração mín: ${currentFilters.minDuration}min` });
		if (currentFilters.maxDuration)
			active.push({ key: "maxDuration", label: `Duração máx: ${currentFilters.maxDuration}min` });
		if (currentFilters.startDate)
			active.push({
				key: "startDate",
				label: `De: ${new Date(currentFilters.startDate).toLocaleDateString("pt-BR")}`,
			});
		if (currentFilters.endDate)
			active.push({
				key: "endDate",
				label: `Até: ${new Date(currentFilters.endDate).toLocaleDateString("pt-BR")}`,
			});
		if (currentFilters.genre) active.push({ key: "genre", label: `Gênero: ${currentFilters.genre}` });
		return active;
	};

	const activeFilters = getActiveFilters();

	const handleRemoveFilter = (filterKey: string) => {
		const newFilters = { ...currentFilters };

		switch (filterKey) {
			case "minDuration":
				delete newFilters.minDuration;
				setMinDuration("");
				break;
			case "maxDuration":
				delete newFilters.maxDuration;
				setMaxDuration("");
				break;
			case "startDate":
				delete newFilters.startDate;
				setStartDate("");
				break;
			case "endDate":
				delete newFilters.endDate;
				setEndDate("");
				break;
			case "genre":
				delete newFilters.genre;
				setGenre("");
				break;
		}

		onApply(newFilters);
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();

		const filters: MovieFilters = {
			...currentFilters,
			page: 1, // Reset to first page when applying filters
		};

		if (minDuration) filters.minDuration = parseInt(minDuration);
		if (maxDuration) filters.maxDuration = parseInt(maxDuration);
		if (startDate) filters.startDate = startDate;
		if (endDate) filters.endDate = endDate;
		if (genre) filters.genre = genre.trim();

		onApply(filters);
	};

	const handleClear = () => {
		setMinDuration("");
		setMaxDuration("");
		setStartDate("");
		setEndDate("");
		setGenre("");

		onApply({
			page: currentFilters.page,
			limit: currentFilters.limit,
			search: currentFilters.search,
		});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="md">
			<div className="filter-modal">
				<h2 className="filter-modal__title">
					<Icon icon="lets-icons:filter" width="24" />
					Filtros Avançados
				</h2>

				{/* Active Filters Display */}
				{activeFilters.length > 0 && (
					<div className="filter-modal__active">
						<div className="filter-modal__active-header">
							<span className="filter-modal__active-label">
								Filtros aplicados ({activeFilters.length})
							</span>
						</div>
						<div className="filter-modal__active-list">
							{activeFilters.map((filter, index) => (
								<div key={index} className="filter-modal__active-item">
									<Icon icon="lets-icons:check-ring" width="16" />
									<span>{filter.label}</span>
									<button
										type="button"
										className="filter-modal__active-remove"
										onClick={() => handleRemoveFilter(filter.key)}
										aria-label="Remover filtro"
									>
										<Icon icon="lets-icons:close-ring" width="16" />
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				<form onSubmit={handleSubmit} className="filter-modal__form">
					{/* Duration */}
					<div className="filter-modal__section">
						<h3>Duração (minutos)</h3>
						<div className="filter-modal__row">
							<Input
								label="Mínimo"
								type="number"
								value={minDuration}
								onChange={(e) => setMinDuration(e.target.value)}
								placeholder="0"
								min="0"
							/>
							<Input
								label="Máximo"
								type="number"
								value={maxDuration}
								onChange={(e) => setMaxDuration(e.target.value)}
								placeholder="300"
								min="0"
							/>
						</div>
					</div>

					{/* Release Date */}
					<div className="filter-modal__section">
						<h3>Data de Lançamento</h3>
						<div className="filter-modal__row">
							<Input
								label="De"
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
							<Input
								label="Até"
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
					</div>

					{/* Genre */}
					<div className="filter-modal__section">
						<h3>Gênero</h3>
						<Input
							label="Nome do Gênero"
							type="text"
							value={genre}
							onChange={(e) => setGenre(e.target.value)}
							placeholder="Ação, Drama, Comédia..."
						/>
					</div>

					{/* Actions */}
					<div className="filter-modal__actions">
						<Button type="button" variant="ghost" onClick={handleClear}>
							<Icon icon="lets-icons:close-ring" width="20" />
							Limpar Filtros
						</Button>
						<div className="filter-modal__actions-right">
							<Button type="button" variant="secondary" onClick={onClose}>
								Cancelar
							</Button>
							<Button type="submit" variant="primary">
								<Icon icon="lets-icons:check" width="20" />
								Aplicar
							</Button>
						</div>
					</div>
				</form>
			</div>
		</Modal>
	);
};
