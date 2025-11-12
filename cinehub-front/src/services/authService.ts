import { api } from "./api";
import type { LoginDto, RegisterDto, AuthResponse } from "../types";

export const authService = {
	async login(credentials: LoginDto): Promise<AuthResponse> {
		const response = await api.post<AuthResponse>("/auth/login", credentials);
		return response.data;
	},

	async register(credentials: RegisterDto): Promise<AuthResponse> {
		const response = await api.post<AuthResponse>(
			"/auth/register",
			credentials
		);
		return response.data;
	},

	async logout(): Promise<void> {
		// Limpar storage local (não há endpoint de logout na API)
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	},
};
