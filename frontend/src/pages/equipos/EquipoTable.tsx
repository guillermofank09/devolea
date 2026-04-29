import { useState } from "react";
import {
  Avatar, Box, Divider, IconButton, ListItemIcon, ListItemText,
  Menu, MenuItem, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { Equipo } from "../../types/Equipo";
import { getInitials, stringToColor } from "../../utils/uiUtils";
import { SPORT_LABELS } from "../tournaments/AddEditTournament";

interface Props {
  equipos: Equipo[];
  onEdit: (e: Equipo) => void;
  onDelete: (e: Equipo) => void;
}

function EquipoAvatar({ equipo, size = 36 }: { equipo: Equipo; size?: number }) {
  return (
    <Avatar
      src={equipo.avatarUrl}
      sx={{ width: size, height: size, bgcolor: stringToColor(equipo.name), fontSize: size * 0.35, fontWeight: 700 }}
    >
      {!equipo.avatarUrl && getInitials(equipo.name)}
    </Avatar>
  );
}

function MobileList({ equipos, onEdit, onDelete }: Props) {
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; equipoId: number } | null>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>, equipoId: number) => setMenuAnchor({ el: e.currentTarget, equipoId });
  const closeMenu = () => setMenuAnchor(null);
  const active = equipos.find((e) => e.id === menuAnchor?.equipoId) ?? null;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      {equipos.map((e, idx) => (
        <Box key={e.id}>
          {idx > 0 && <Divider />}
          <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 2 }}>
            <EquipoAvatar equipo={e} />
            <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <Typography variant="body2" fontWeight={700} noWrap>{e.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {[e.city, e.sex === "MASCULINO" ? "Masculino" : e.sex === "FEMENINO" ? "Femenino" : null, e.sport ? (SPORT_LABELS[e.sport] ?? e.sport) : null]
                  .filter(Boolean).join(" · ") || "—"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={(ev) => openMenu(ev, e.id)}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ))}
      {equipos.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.disabled">No hay equipos</Typography>
        </Box>
      )}
      <Menu
        anchorEl={menuAnchor?.el}
        open={!!menuAnchor}
        onClose={closeMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={() => { if (active) onEdit(active); closeMenu(); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (active) onDelete(active); closeMenu(); }} sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
}

export default function EquipoTable({ equipos, onEdit, onDelete }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isMobile) return <MobileList equipos={equipos} onEdit={onEdit} onDelete={onDelete} />;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Equipo</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Ciudad</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Sexo</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Deporte</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {equipos.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.disabled" }}>
                No hay equipos
              </TableCell>
            </TableRow>
          )}
          {equipos.map((e) => (
            <TableRow key={e.id} hover>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <EquipoAvatar equipo={e} />
                  <Typography variant="body2" fontWeight={600}>{e.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">{e.city || "—"}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {e.sex === "MASCULINO" ? "Masculino" : e.sex === "FEMENINO" ? "Femenino" : "—"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {e.sport ? (SPORT_LABELS[e.sport] ?? e.sport) : "—"}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit(e)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => onDelete(e)} sx={{ ml: 0.5 }}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
