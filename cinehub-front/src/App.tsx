import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Movies } from "./pages/Movies";
import { MovieDetail } from "./pages/MovieDetail";
import "./App.css";

function App() {
	return (
		<BrowserRouter>
			<ThemeProvider>
				<AuthProvider>
					<Routes>
						<Route path="/" element={<Navigate to="/login" replace />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route
							path="/movies"
							element={
								<ProtectedRoute>
									<Movies />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/movies/:id"
							element={
								<ProtectedRoute>
									<MovieDetail />
								</ProtectedRoute>
							}
						/>
						<Route path="*" element={<Navigate to="/login" replace />} />
					</Routes>
				</AuthProvider>
			</ThemeProvider>
		</BrowserRouter>
	);
}

export default App;
