import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import type { Profesor } from "../../types/Profesor";
import { getInitials, stringToColor } from "../../utils/uiUtils";
import EmptyState from "../../components/common/EmptyState";

interface Props {
  profesores: Profesor[];
  onEdit: (p: Profesor) => void;
  onDelete: (p: Profesor) => void;
  onSchedule: (p: Profesor) => void;
}

function MobileList({ profesores, onEdit, onDelete, onSchedule }: Props) {
  return (
    <Paper sx={{ borderRadius: 3, boxShadow: 1, overflow: "hidden" }}>
      {profesores.map((p, idx) => (
        <Box key={p.id}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
            <Avatar
              sx={{ bgcolor: stringToColor(p.name), width: 40, height: 40, fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}
            >
              {getInitials(p.name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: "50vw" }}>
                {p.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {p.phone ? `+${p.phone}` : "Sin teléfono"}
                {p.hourlyRate != null && ` · $${p.hourlyRate}/h`}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexShrink: 0 }}>
              <IconButton size="small" onClick={() => onSchedule(p)} title="Ver horarios">
                <CalendarMonthIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onEdit(p)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => onDelete(p)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          {idx < profesores.length - 1 && <Divider />}
        </Box>
      ))}
    </Paper>
  );
}

export default function ProfesorTable({ profesores, onEdit, onDelete, onSchedule }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (profesores.length === 0) {
    return <EmptyState message="No hay profesores registrados." />;
  }

  if (isMobile) {
    return <MobileList profesores={profesores} onEdit={onEdit} onDelete={onDelete} onSchedule={onSchedule} />;
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 700, backgroundColor: "#f5f5f5" } }}>
            <TableCell>Profesor</TableCell>
            <TableCell>Teléfono</TableCell>
            <TableCell>Tarifa/hora</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {profesores.map((p) => (
            <TableRow key={p.id} hover sx={{ "&:last-child td": { border: 0 } }}>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: stringToColor(p.name), width: 36, height: 36, fontSize: "0.85rem", fontWeight: 700 }}>
                    {getInitials(p.name)}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color={p.phone ? "text.primary" : "text.disabled"}>
                  {p.phone ? `+${p.phone}` : "—"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color={p.hourlyRate != null ? "text.primary" : "text.disabled"}>
                  {p.hourlyRate != null ? `$${p.hourlyRate}` : "—"}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Ver horarios">
                  <IconButton size="small" onClick={() => onSchedule(p)}>
                    <CalendarMonthIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => onEdit(p)} sx={{ ml: 0.5 }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton size="small" color="error" onClick={() => onDelete(p)} sx={{ ml: 0.5 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
