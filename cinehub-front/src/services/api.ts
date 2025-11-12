import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const token = localStorage.getItem("token");
			// Só redireciona se tinha um token (token inválido/expirado)
			// Se não tinha token, deixa a rota protegida fazer o redirect
			if (token) {
				localStorage.removeItem("token");
				localStorage.removeItem("user");
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	}
);
