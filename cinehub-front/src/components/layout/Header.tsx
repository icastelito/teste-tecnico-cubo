import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";
import "./Header.css";

export const Header = () => {
	const { logout, isAuthenticated } = useAuth();

	const handleLogout = () => {
		if (confirm("Tem certeza que deseja sair?")) {
			logout();
		}
	};

	return (
		<header className="header">
			<div className="header-content">
				<div className="header-logo">
					<div className="header-logo-square" />
					<span className="header-logo-text">CUBOS Movies</span>
				</div>

				<div className="header-actions">
					<ThemeToggle />
					{isAuthenticated && (
						<button className="header-logout" onClick={handleLogout}>
							Sair
						</button>
					)}
				</div>
			</div>
		</header>
	);
};
