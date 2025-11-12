import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "../../components/layout/Header";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Footer } from "../../components/layout/Footer";
import "./style.css";

export const Register = () => {
	const navigate = useNavigate();
	const { register } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		// Validações
		if (!name.trim()) {
			setError("Nome é obrigatório");
			return;
		}

		if (!email.trim()) {
			setError("E-mail é obrigatório");
			return;
		}

		if (!email.includes("@")) {
			setError("E-mail inválido");
			return;
		}

		if (!password) {
			setError("Senha é obrigatória");
			return;
		}

		if (password.length < 6) {
			setError("Senha deve ter pelo menos 6 caracteres");
			return;
		}

		if (password !== confirmPassword) {
			setError("As senhas não coincidem");
			return;
		}

		try {
			setIsLoading(true);
			await register(name, email, password);
			navigate("/movies");
		} catch (err: any) {
			setError(err.response?.data?.message || "Erro ao criar conta");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Header />
			<div className="register-container">
				<div className="register-card">
					<form onSubmit={handleSubmit} className="register-form">
						<Input
							label="Nome"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Seu nome completo"
							disabled={isLoading}
						/>

						<Input
							label="E-mail"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="seu@email.com"
							disabled={isLoading}
						/>

						<Input
							label="Senha"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Mínimo 6 caracteres"
							disabled={isLoading}
						/>

						<Input
							label="Confirmar Senha"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Digite a senha novamente"
							disabled={isLoading}
						/>

						{error && <div className="register-error">{error}</div>}

						<div className="register-actions">
							<Button type="submit" isLoading={isLoading}>
								Cadastrar
							</Button>
						</div>

						<div className="register-footer">
							Já tem uma conta? <Link to="/login">Fazer login</Link>
						</div>
					</form>
				</div>

				<Footer />
			</div>
		</>
	);
};
