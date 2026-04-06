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
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetUsers, apiCreateUser, apiDeleteUser } from "../../../api/authService";
import type { AdminUser } from "../../../api/authService";
import { useAuth } from "../../../context/AuthContext";
import PageHeader from "../../../components/common/PageHeader";
import DeleteDialog from "../../../components/common/DeleteDialog";

// ─── Create user dialog ───────────────────────────────────────────────────────
function CreateUserDialog({
  open,
  onClose,
  token,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
}) {
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
    onError: (e: any) => {
      setError(e?.response?.data?.message ?? "Error al crear el usuario.");
    },
  });

  function handleClose() {
    setUsername("");
    setName("");
    setPassword("");
    setShowPass(false);
    setError(null);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Crear usuario</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 0.5 }}>
          <TextField
            label="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            fullWidth
            size="small"
            autoComplete="off"
          />
          <TextField
            label="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Contraseña"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="new-password"
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
          {error && <Typography variant="body2" color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button
          onClick={handleClose}
          fullWidth={fullScreen}
          sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}
        >
          Cancelar
        </Button>
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const { token, user: currentUser } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
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

  if (isPending) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  if (isError) {
    return (
      <Box>
        <PageHeader title="Gestión de usuarios" subtitle="Administración de cuentas de acceso" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>No se pudieron cargar los usuarios.</Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={640}>
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

      <List disablePadding sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        {users.map((u, idx) => (
          <ListItem
            key={u.id}
            divider={idx < users.length - 1}
            secondaryAction={
              u.id !== currentUser?.id && (
                <Tooltip title="Eliminar usuario">
                  <IconButton
                    edge="end"
                    color="error"
                    size="small"
                    onClick={() => setDeleteTarget(u)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )
            }
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: u.role === "superadmin" ? "#F5AD27" : "#111", color: u.role === "superadmin" ? "#111" : "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                {u.name.split(" ").slice(0, 2).map(w => w[0].toUpperCase()).join("")}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{u.name}</Typography>
                  <Chip
                    label={u.role === "superadmin" ? "Superadmin" : "Usuario"}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      bgcolor: u.role === "superadmin" ? "rgba(245,173,39,0.15)" : "rgba(0,0,0,0.07)",
                      color: u.role === "superadmin" ? "#b07d00" : "text.secondary",
                    }}
                  />
                </Box>
              }
              secondary={`@${u.username}`}
            />
          </ListItem>
        ))}
        {users.length === 0 && (
          <ListItem>
            <ListItemText primary={<Typography color="text.secondary">No hay usuarios registrados.</Typography>} />
          </ListItem>
        )}
      </List>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        token={token!}
      />

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
