import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f6fa",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 480,
          border: "1.5px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <img src={logo} alt="Devolea" style={{ height: 48 }} />
          </Box>

          <Typography variant="h5" fontWeight={800} textAlign="center" mb={0.75} letterSpacing="-0.5px">
            Crear cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
            Registrate para acceder a la gestión del club
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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

          <Divider sx={{ my: 3.5 }} />

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
        </CardContent>
      </Card>
    </Box>
  );
}
