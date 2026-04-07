import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Error al iniciar sesión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f6fa",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          bgcolor: "background.paper",
          border: "1.5px solid",
          borderColor: "divider",
          borderRadius: 3,
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          px: { xs: 3, sm: 5 },
          py: { xs: 4, sm: 5 },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <img src={logo} alt="Devolea" style={{ height: 44 }} />
        </Box>

        <Typography variant="h5" fontWeight={800} textAlign="center" mb={0.75} letterSpacing="-0.5px">
          Iniciar sesión
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
          Ingresá con tu usuario y contraseña para continuar
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box>
            <FormLabel sx={{ mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary", display: "block" }}>
              Usuario
            </FormLabel>
            <TextField
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              fullWidth
              size="small"
              placeholder="Tu nombre de usuario"
            />
          </Box>
          <Box>
            <FormLabel sx={{ mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary", display: "block" }}>
              Contraseña
            </FormLabel>
            <TextField
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              fullWidth
              size="small"
              placeholder="Tu contraseña"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass((v) => !v)} edge="end">
                        {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            fullWidth
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, py: 1.5 }}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
