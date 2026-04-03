import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box } from "@mui/material";

interface Props {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteDialog({
  open,
  title,
  description,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningAmberRoundedIcon sx={{ color: "error.main", fontSize: 26 }} />
          <Typography variant="h6" fontWeight={700} component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" lineHeight={1.65}>
          {description}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button
          onClick={onClose}
          disabled={loading}
          fullWidth={fullScreen}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => { onConfirm(); }}
          variant="contained"
          color="error"
          disabled={loading}
          fullWidth={fullScreen}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {loading ? "Eliminando…" : "Eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
