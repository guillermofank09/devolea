import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
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
import logoWhite from "../../assets/logo-white.png";
import "../auth/Auth.css";

function CourtLines() {
  return (
    <svg className="auth-side-lines" viewBox="0 0 500 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect x="40" y="60" width="420" height="580" fill="none" stroke="white" strokeWidth="1.5" />
      <line x1="40" y1="350" x2="460" y2="350" stroke="white" strokeWidth="1" />
      <line x1="250" y1="60" x2="250" y2="640" stroke="white" strokeWidth="1" />
      <line x1="40" y1="350" x2="460" y2="350" stroke="white" strokeWidth="3" />
      {Array.from({ length: 18 }, (_, i) => (
        <line key={i} x1={60 + i * 23} y1="344" x2={60 + i * 23} y2="356"
          stroke="white" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 6)  { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setLoading(true);
    try {
      await register(email, name, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Error al registrar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      {/* ── Left branding panel ── */}
      <aside className="auth-side">
        <CourtLines />
        <div className="auth-side-content">
          <img src={logoWhite} alt="Devolea" className="auth-side-logo" />
          <h1 className="auth-side-heading">
            Tu complejo de pádel,<br />
            <span>en un solo lugar</span>
          </h1>
          <p className="auth-side-sub">
            Registrate y comenzá a gestionar tus canchas, torneos y jugadores de forma profesional.
          </p>
        </div>
        <p className="auth-side-footer">
          © {new Date().getFullYear()} Devolea
        </p>
      </aside>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <img src={logo} alt="Devolea" className="auth-form-logo" />

          <h2 className="auth-form-title">Crear cuenta</h2>
          <p className="auth-form-sub">Registrate para acceder a la gestión del club</p>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              label="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Contraseña"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
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
            <TextField
              label="Confirmar contraseña"
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, mt: 0.5, py: 1.5 }}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading ? "Registrando…" : "Crear cuenta"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" textAlign="center" color="text.secondary">
            ¿Ya tenés cuenta?{" "}
            <Typography
              component="span"
              variant="body2"
              color="primary"
              fontWeight={700}
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              Iniciar sesión
            </Typography>
          </Typography>
        </div>
      </div>
    </div>
  );
}
