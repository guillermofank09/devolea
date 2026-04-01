import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

export default function DeleteConfirmation({
  onClose,
  onDelete,
  open,
}: {
  onClose: () => void;
  onDelete: () => void;
  open: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
    >
      <DialogTitle id="confirmation-dialog-title">Eliminar cancha</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirmation-dialog-description">
          ¿Estás seguro de que querés eliminar esta cancha? Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            onDelete();
            onClose();
          }}
          variant="contained"
          color="error"
          sx={{ textTransform: "none" }}
          autoFocus
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
