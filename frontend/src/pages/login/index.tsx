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
import { trackEvent } from "../../lib/analytics";

const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE ?? "";

const WA_RESET = CONTACT_PHONE
  ? `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent("Hola! Necesito recuperar el acceso a mi cuenta de Devolea.")}`
  : "#";

const WA_NEW = CONTACT_PHONE
  ? `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent("Hola! Me gustaría registrar mi club en Devolea.")}`
  : "#";

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
      trackEvent("login");
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Usuario o contraseña incorrectos.");
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
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3.5}>
          Ingresá con tu usuario y contraseña para continuar
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: "0.875rem" }}>
            {error}
            <Typography
              component="a"
              href={WA_RESET}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{ display: "block", mt: 0.75, color: "inherit", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
            >
              ¿Olvidaste tu contraseña? Contactanos
            </Typography>
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.5 }}>
              <FormLabel sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" }}>
                Contraseña
              </FormLabel>
              <Typography
                component="a"
                href={WA_RESET}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                sx={{ color: "text.disabled", textDecoration: "none", fontWeight: 500, cursor: "pointer", "&:hover": { color: "text.secondary" } }}
              >
                ¿Olvidaste tu contraseña?
              </Typography>
            </Box>
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

        <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
          ¿No tenés cuenta?{" "}
          <Typography
            component="a"
            href={WA_NEW}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            sx={{ color: "text.primary", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            Escribinos
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
}
