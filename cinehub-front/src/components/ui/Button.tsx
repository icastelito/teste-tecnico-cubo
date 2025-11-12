import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
	fullWidth?: boolean;
	isLoading?: boolean;
}

export const Button = ({
	children,
	variant = "primary",
	size = "md",
	fullWidth = false,
	isLoading = false,
	disabled,
	className = "",
	...props
}: ButtonProps) => {
	const classes = [
		"button",
		`button--${variant}`,
		`button--${size}`,
		fullWidth && "button--full-width",
		isLoading && "button--loading",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button className={classes} disabled={disabled || isLoading} {...props}>
			{isLoading ? "Carregando..." : children}
		</button>
	);
};
