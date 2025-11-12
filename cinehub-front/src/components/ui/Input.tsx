import type { InputHTMLAttributes } from "react";
import "./Input.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

export const Input = ({ label, error, helperText, className = "", id, ...props }: InputProps) => {
	const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

	return (
		<div className={`input-wrapper ${className}`}>
			{label && (
				<label htmlFor={inputId} className="input-label">
					{label}
				</label>
			)}
			<input id={inputId} className={`input ${error ? "input--error" : ""}`} {...props} />
			{error && <span className="input-error">{error}</span>}
			{helperText && !error && <span className="input-helper">{helperText}</span>}
		</div>
	);
};
