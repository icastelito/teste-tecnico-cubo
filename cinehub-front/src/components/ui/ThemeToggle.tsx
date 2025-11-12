import { Icon } from "@iconify/react";
import { useTheme } from "../../contexts/ThemeContext";
import "./ThemeToggle.css";

export const ThemeToggle = () => {
	const { themeMode, toggleTheme } = useTheme();

	return (
		<button
			className="theme-toggle"
			onClick={toggleTheme}
			aria-label={`Mudar para tema ${themeMode === "dark" ? "claro" : "escuro"}`}
		>
			{themeMode === "dark" ? (
				<Icon icon="lets-icons:sun-light" width="24" height="24" />
			) : (
				<Icon icon="lets-icons:moon" width="24" height="24" />
			)}
		</button>
	);
};
