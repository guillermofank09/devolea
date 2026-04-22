import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import { trackEvent } from "../../lib/analytics";

const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE ?? "";

const WA_RESET = CONTACT_PHONE
  ? `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent("Hola! Necesito recuperar el acceso a mi cuenta de Devolea.")}`
  : null;

const WA_NEW = CONTACT_PHONE
  ? `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent("Hola! Me gustaría registrar mi club en Devolea.")}`
  : null;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width:900px)");

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

  const form = (
    <Box sx={{ width: "100%", maxWidth: 400 }}>
      {/* Logo — mobile only (desktop shows it in the left panel) */}
      {!isDesktop && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <img src={logo} alt="Devolea" style={{ height: 40 }} />
        </Box>
      )}

      <Typography variant="h5" fontWeight={800} mb={0.5} letterSpacing="-0.5px"
        sx={{ textAlign: { xs: "center", md: "left" } }}>
        Bienvenido de vuelta
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3.5}
        sx={{ textAlign: { xs: "center", md: "left" } }}>
        Ingresá con tu usuario y contraseña
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
          {WA_RESET && (
            <Box sx={{ mt: 0.75 }}>
              <Box
                component="a"
                href={WA_RESET}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontSize: "0.8rem", color: "inherit", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
              >
                ¿Olvidaste tu contraseña? Contactanos por WhatsApp
              </Box>
            </Box>
          )}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
            {WA_RESET && (
              <Box
                component="a"
                href={WA_RESET}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontSize: "0.75rem", color: "text.disabled", textDecoration: "none", fontWeight: 500, cursor: "pointer", "&:hover": { color: "text.secondary" } }}
              >
                ¿Olvidaste tu contraseña?
              </Box>
            )}
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
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, py: 1.5, mt: 0.5 }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </Box>

      {WA_NEW && (
        <>
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.disabled">¿Todavía no tenés cuenta?</Typography>
          </Divider>
          <Button
            component="a"
            href={WA_NEW}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            fullWidth
            startIcon={<WhatsAppIcon sx={{ color: "#25d366" }} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              py: 1.25,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": { borderColor: "#25d366", bgcolor: "rgba(37,211,102,0.04)" },
            }}
          >
            Registrá tu club
          </Button>
        </>
      )}
    </Box>
  );

  /* ── Desktop: split layout ── */
  if (isDesktop) {
    return (
      <Box sx={{ display: "flex", minHeight: "100dvh" }}>
        {/* Left — brand panel */}
        <Box
          sx={{
            width: 420,
            flexShrink: 0,
            bgcolor: "#0f172a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 6,
            gap: 3,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-120px",
              left: "-80px",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,173,39,0.18) 0%, transparent 70%)",
              pointerEvents: "none",
            },
          }}
        >
          <img src={logo} alt="Devolea" style={{ height: 52, position: "relative", zIndex: 1 }} />
          <Box sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", lineHeight: 1.3, letterSpacing: "-0.5px", mb: 1 }}>
              Gestioná tu complejo<br />
              <Box component="span" sx={{ color: "#f5ad27" }}>desde un solo lugar</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
              Canchas, torneos, jugadores y estadísticas. Todo lo que necesitás para administrar tu club deportivo.
            </Typography>
          </Box>

          {/* Feature bullets */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", position: "relative", zIndex: 1 }}>
            {[
              "Reservas y disponibilidad en tiempo real",
              "Torneos con fixtures automáticos",
              "Estadísticas de ingresos y ocupación",
              "Página pública para tus clientes",
            ].map(item => (
              <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#f5ad27", flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right — form */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f8fafc",
            p: 6,
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
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              px: 5,
              py: 5,
            }}
          >
            {form}
          </Box>
        </Box>
      </Box>
    );
  }

  /* ── Mobile: centered card ── */
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
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
        {form}
      </Box>
    </Box>
  );
}
