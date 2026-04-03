import DeleteDialog from "../../components/common/DeleteDialog";

export default function DeleteConfirmation({
  open,
  onClose,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <DeleteDialog
      open={open}
      title="Eliminar cancha"
      description="¿Estás seguro de que querés eliminar esta cancha? Esta acción no se puede deshacer."
      onClose={onClose}
      onConfirm={() => { onDelete(); onClose(); }}
    />
  );
}
