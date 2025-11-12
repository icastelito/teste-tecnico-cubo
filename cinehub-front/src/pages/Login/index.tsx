import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "../../components/layout/Header";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Footer } from "../../components/layout/Footer";
import "./style.css";

export const Login = () => {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

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

		try {
			setIsLoading(true);
			await login(email, password);
			navigate("/movies");
		} catch (err: any) {
			setError(err.response?.data?.message || "Credenciais inválidas");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Header />
			<div className="login-container">
				<div className="login-card">
					<form onSubmit={handleSubmit} className="login-form">
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
							placeholder="Digite sua senha"
							disabled={isLoading}
						/>

						{error && <div className="login-error">{error}</div>}

						<div className="login-actions">
							<Link to="/forgot-password" className="forgot-password">
								Esqueci minha senha
							</Link>
							<Button type="submit" isLoading={isLoading}>
								Entrar
							</Button>
						</div>

						<div className="login-footer">
							Ainda não tem uma conta? <Link to="/register">Criar conta</Link>
						</div>
					</form>
				</div>

				<Footer />
			</div>
		</>
	);
};
