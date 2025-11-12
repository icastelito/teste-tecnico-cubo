import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
	themeMode: ThemeMode;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
		const savedTheme = localStorage.getItem("theme") as ThemeMode;
		const initialTheme = savedTheme || "dark";
		// Aplicar classe inicial imediatamente
		document.documentElement.setAttribute("data-theme", initialTheme);
		document.documentElement.className = initialTheme === "dark" ? "dark-theme" : "light-theme";
		return initialTheme;
	});

	useEffect(() => {
		localStorage.setItem("theme", themeMode);
		document.documentElement.setAttribute("data-theme", themeMode);
		document.documentElement.className = themeMode === "dark" ? "dark-theme" : "light-theme";
	}, [themeMode]);

	const toggleTheme = () => {
		setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
	};

	return <ThemeContext.Provider value={{ themeMode, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
