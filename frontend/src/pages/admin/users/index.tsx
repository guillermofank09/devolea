import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetUsers, apiCreateUser, apiDeleteUser, apiUpdateUser } from "../../../api/authService";
import type { AdminUser } from "../../../api/authService";
import { useAuth } from "../../../context/AuthContext";
import PageHeader from "../../../components/common/PageHeader";
import DeleteDialog from "../../../components/common/DeleteDialog";
import PageLoader from "../../../components/common/PageLoader";
import FormLabel from "@mui/material/FormLabel";
import { FORM_LABEL_SX } from "../../../styles/formStyles";

// ─── helpers ─────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid TZ shift
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function paymentStatus(lastPaymentDate: string | null): {
  nextDate: Date | null;
  label: string;
  color: "success" | "warning" | "error" | "default";
} {
  if (!lastPaymentDate) return { nextDate: null, label: "Sin registro", color: "default" };
  const next = addDays(lastPaymentDate, 30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { nextDate: next, label: "Vencido", color: "error" };
  if (diff <= 7) return { nextDate: next, label: `Vence en ${diff}d`, color: "warning" };
  return { nextDate: next, label: "Al día", color: "success" };
}

// ─── Payment date dialog ──────────────────────────────────────────────────────

function PaymentDialog({
  user,
  token,
  onClose,
}: {
  user: AdminUser;
  token: string;
  onClose: () => void;
}) {
  const [dateValue, setDateValue] = useState(user.lastPaymentDate ?? "");
  const queryClient = useQueryClient();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const mutation = useMutation({
    mutationFn: () =>
      apiUpdateUser(token, user.id, { lastPaymentDate: dateValue || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      onClose();
    },
  });

  const nextDate = dateValue ? addDays(dateValue, 30) : null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Fecha de pago — {user.name}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          <Box>
            <FormLabel sx={FORM_LABEL_SX}>Último pago</FormLabel>
            <TextField
              type="date"
              value={dateValue}
              onChange={e => setDateValue(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          {nextDate && (
            <Box sx={{ bgcolor: "grey.50", borderRadius: 2, px: 2, py: 1.5, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem" }}>
                Próximo pago
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25 }}>
                {nextDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </Typography>
            </Box>
          )}
          {dateValue && (
            <Button
              size="small"
              color="inherit"
              sx={{ alignSelf: "flex-start", textTransform: "none", color: "text.secondary", fontSize: "0.8rem" }}
              onClick={() => setDateValue("")}
            >
              Borrar registro de pago
            </Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={onClose} fullWidth={fullScreen} sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          fullWidth={fullScreen}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Create user dialog ───────────────────────────────────────────────────────

function CreateUserDialog({ open, onClose, token }: { open: boolean; onClose: () => void; token: string }) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiCreateUser(token, { username, name, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      handleClose();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Error al crear el usuario."),
  });

  function handleClose() {
    setUsername(""); setName(""); setPassword(""); setShowPass(false); setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Crear usuario</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          {([
            { label: "Nombre de usuario", value: username, setter: setUsername, autoFocus: true },
            { label: "Nombre completo",   value: name,     setter: setName,     autoFocus: false },
          ] as const).map(({ label, value, setter, autoFocus }) => (
            <Box key={label}>
              <FormLabel sx={FORM_LABEL_SX}>{label}</FormLabel>
              <TextField value={value} onChange={e => setter(e.target.value)} required autoFocus={autoFocus} fullWidth size="small" autoComplete="off" />
            </Box>
          ))}
          <Box>
            <FormLabel sx={FORM_LABEL_SX}>Contraseña</FormLabel>
            <TextField
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required fullWidth size="small" autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass(v => !v)} edge="end">
                        {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          {error && <Typography variant="body2" color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={handleClose} fullWidth={fullScreen} sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={!username || !name || !password || mutation.isPending}
          fullWidth={fullScreen}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Creando…" : "Crear usuario"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  isSelf,
  token,
  onDelete,
  onEditPayment,
}: {
  user: AdminUser;
  isSelf: boolean;
  token: string;
  onDelete: () => void;
  onEditPayment: () => void;
}) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) => apiUpdateUser(token, user.id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });

  const { nextDate, label: payLabel, color: payColor } = paymentStatus(user.lastPaymentDate);
  const initials = user.name.split(" ").slice(0, 2).map(w => w[0].toUpperCase()).join("");

  return (
    <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        {/* Avatar */}
        <Avatar
          sx={{
            flexShrink: 0,
            bgcolor: user.role === "superadmin" ? "#F5AD27" : user.isActive ? "#111" : "grey.400",
            color: user.role === "superadmin" ? "#111" : "#fff",
            fontWeight: 700,
            fontSize: "0.85rem",
            width: 38,
            height: 38,
            mt: 0.25,
            transition: "background-color 200ms ease",
          }}
        >
          {initials}
        </Avatar>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Name + chips */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: user.isActive ? "text.primary" : "text.disabled" }}>
              {user.name}
            </Typography>
            <Chip
              label={user.role === "superadmin" ? "Superadmin" : "Usuario"}
              size="small"
              sx={{
                height: 18, fontSize: "0.65rem", fontWeight: 700,
                bgcolor: user.role === "superadmin" ? "rgba(245,173,39,0.15)" : "rgba(0,0,0,0.07)",
                color: user.role === "superadmin" ? "#b07d00" : "text.secondary",
              }}
            />
            <Chip
              label={payLabel}
              size="small"
              color={payColor}
              variant={payColor === "default" ? "outlined" : "filled"}
              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
            />
          </Box>

          {/* Username */}
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            @{user.username}
          </Typography>

          {/* Payment dates */}
          <Box sx={{ display: "flex", gap: 2, mt: 0.5, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Último pago
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontWeight: 500, color: "text.secondary" }}>
                {user.lastPaymentDate ? formatDate(user.lastPaymentDate) : "—"}
              </Typography>
            </Box>
            {nextDate && (
              <Box>
                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Próximo pago
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  sx={{
                    fontWeight: 600,
                    color: payColor === "error" ? "error.main" : payColor === "warning" ? "warning.dark" : "success.dark",
                  }}
                >
                  {nextDate.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {!isSelf && (
            <Tooltip title={user.isActive ? "Deshabilitar usuario" : "Habilitar usuario"}>
              <Switch
                checked={user.isActive}
                size="small"
                disabled={toggleMutation.isPending}
                onChange={e => toggleMutation.mutate(e.target.checked)}
                color="success"
              />
            </Tooltip>
          )}
          {user.role !== "superadmin" && (
            <Tooltip title="Editar fecha de pago">
              <IconButton size="small" onClick={onEditPayment} sx={{ color: "text.secondary" }}>
                <EditCalendarIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {!isSelf && (
            <Tooltip title="Eliminar usuario">
              <IconButton size="small" color="error" onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { token, user: currentUser } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<AdminUser | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isPending, isError } = useQuery<AdminUser[]>({
    queryKey: ["adminUsers"],
    queryFn: () => apiGetUsers(token!),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteUser(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setDeleteTarget(null);
    },
  });

  if (isPending) return <PageLoader />;

  if (isError) {
    return (
      <Box>
        <PageHeader title="Gestión de usuarios" subtitle="Administración de cuentas de acceso" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>No se pudieron cargar los usuarios.</Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={700}>
      <PageHeader
        title="Gestión de usuarios"
        subtitle="Administración de cuentas de acceso al sistema"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Nuevo usuario
          </Button>
        }
      />

      <Box sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        {users.map((u, idx) => (
          <Box key={u.id}>
            {idx > 0 && <Divider />}
            <UserRow
              user={u}
              isSelf={u.id === currentUser?.id}
              token={token!}
              onDelete={() => setDeleteTarget(u)}
              onEditPayment={() => setPaymentTarget(u)}
            />
          </Box>
        ))}
        {users.length === 0 && (
          <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No hay usuarios registrados.</Typography>
          </Box>
        )}
      </Box>

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} token={token!} />

      {paymentTarget && (
        <PaymentDialog
          user={paymentTarget}
          token={token!}
          onClose={() => setPaymentTarget(null)}
        />
      )}

      <DeleteDialog
        open={!!deleteTarget}
        title="Eliminar usuario"
        description={`¿Estás seguro de que querés eliminar al usuario "${deleteTarget?.username ?? ""}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Box>
  );
}
