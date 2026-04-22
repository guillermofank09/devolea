import { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Player, PlayerCategory } from "../../types/Player";
import { getInitials, stringToColor } from "../../utils/uiUtils";
import EmptyState from "../../components/common/EmptyState";
import { SPORT_LABEL } from "../../constants/sports";

export const CATEGORY_LABEL: Record<PlayerCategory, string> = {
  PRIMERA:       "1ra",
  SEGUNDA:       "2da",
  TERCERA:       "3ra",
  CUARTA:        "4ta",
  QUINTA:        "5ta",
  SEXTA:         "6ta",
  SEPTIMA:       "7ma",
  SIN_CATEGORIA: "S/C",
};

export const CATEGORY_FULL: Record<PlayerCategory, string> = {
  PRIMERA:       "1ra Categoría",
  SEGUNDA:       "2da Categoría",
  TERCERA:       "3ra Categoría",
  CUARTA:        "4ta Categoría",
  QUINTA:        "5ta Categoría",
  SEXTA:         "6ta Categoría",
  SEPTIMA:       "7ma Categoría",
  SIN_CATEGORIA: "Sin Categoría",
};

export const CATEGORY_ORDER: Record<PlayerCategory, number> = {
  PRIMERA: 1, SEGUNDA: 2, TERCERA: 3, CUARTA: 4,
  QUINTA: 5, SEXTA: 6, SEPTIMA: 7, SIN_CATEGORIA: 8,
};

export const CATEGORY_COLOR: Record<
  PlayerCategory,
  "error" | "warning" | "success" | "info" | "default" | "primary" | "secondary"
> = {
  PRIMERA:       "error",
  SEGUNDA:       "warning",
  TERCERA:       "success",
  CUARTA:        "info",
  QUINTA:        "primary",
  SEXTA:         "secondary",
  SEPTIMA:       "default",
  SIN_CATEGORIA: "default",
};

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

type SortKey = "name" | "category" | "city" | "sex" | "age";
type SortDir = "asc" | "desc";

function getValue(player: Player, key: SortKey): string | number {
  switch (key) {
    case "name":     return player.name.toLowerCase();
    case "category": return CATEGORY_ORDER[player.category];
    case "city":     return (player.city ?? "").toLowerCase();
    case "sex":      return player.sex;
    case "age":      return player.birthDate ? -new Date(player.birthDate).getTime() : 0;
  }
}

function sortPlayers(players: Player[], key: SortKey, dir: SortDir): Player[] {
  return [...players].sort((a, b) => {
    const va = getValue(a, key);
    const vb = getValue(b, key);
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}

interface Props {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
}

// ── Mobile card list ──────────────────────────────────────────────────────────

function MobileList({ players, onEdit, onDelete }: Props) {
  return (
    <Paper sx={{ borderRadius: 3, boxShadow: 1, overflow: "hidden" }}>
      {players.map((player, idx) => (
        <Box key={player.id}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
            <Avatar
              src={player.avatarUrl}
              sx={{
                bgcolor: stringToColor(player.name),
                width: 40,
                height: 40,
                fontSize: "0.9rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {getInitials(player.name)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: "55vw" }}>
                  {player.name}
                </Typography>
                {player.sports?.includes("PADEL") || player.sport === "PADEL" || (!player.sports?.length && !player.sport) ? (
                  <Tooltip title={CATEGORY_FULL[player.category]} placement="top">
                    <Chip label={CATEGORY_LABEL[player.category]} color={CATEGORY_COLOR[player.category]} size="small" sx={{ fontWeight: 700, height: 20, fontSize: "0.7rem" }} />
                  </Tooltip>
                ) : null}
                {player.tenisCategory && (player.sports?.includes("TENIS") || player.sport === "TENIS") ? (
                  <Tooltip title={`Tenis: ${CATEGORY_FULL[player.tenisCategory]}`} placement="top">
                    <Chip label={`T: ${CATEGORY_LABEL[player.tenisCategory]}`} color={CATEGORY_COLOR[player.tenisCategory]} size="small" sx={{ fontWeight: 700, height: 20, fontSize: "0.7rem" }} />
                  </Tooltip>
                ) : null}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {player.city} · {player.sex === "MASCULINO" ? "M" : "F"}{player.birthDate ? ` · ${getAge(player.birthDate)} años` : ""}
                {player.sports?.length ? ` · ${player.sports.map(s => SPORT_LABEL[s as keyof typeof SPORT_LABEL] ?? s).join(", ")}` : player.sport ? ` · ${SPORT_LABEL[player.sport as keyof typeof SPORT_LABEL] ?? player.sport}` : ""}
                {player.phone ? ` · +${player.phone}` : ""}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexShrink: 0 }}>
              <IconButton size="small" onClick={() => onEdit(player)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => onDelete(player)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          {idx < players.length - 1 && <Divider />}
        </Box>
      ))}
    </Paper>
  );
}

// ── Desktop table ─────────────────────────────────────────────────────────────

export default function PlayerTable({ players, onEdit, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = sortPlayers(players, sortKey, sortDir);

  if (players.length === 0) {
    return <EmptyState message="No hay jugadores registrados." />;
  }

  if (isMobile) {
    return <MobileList players={sorted} onEdit={onEdit} onDelete={onDelete} />;
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 700, backgroundColor: "#f5f5f5" } }}>
            <TableCell sortDirection={sortKey === "name" ? sortDir : false}>
              <TableSortLabel
                active={sortKey === "name"}
                direction={sortKey === "name" ? sortDir : "asc"}
                onClick={() => handleSort("name")}
              >
                Jugador
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={sortKey === "category" ? sortDir : false}>
              <TableSortLabel
                active={sortKey === "category"}
                direction={sortKey === "category" ? sortDir : "asc"}
                onClick={() => handleSort("category")}
              >
                Categoría
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={sortKey === "city" ? sortDir : false}>
              <TableSortLabel
                active={sortKey === "city"}
                direction={sortKey === "city" ? sortDir : "asc"}
                onClick={() => handleSort("city")}
              >
                Ciudad
              </TableSortLabel>
            </TableCell>

            <TableCell sx={{ fontWeight: 700 }}>Deporte</TableCell>

            <TableCell sortDirection={sortKey === "sex" ? sortDir : false}>
              <TableSortLabel
                active={sortKey === "sex"}
                direction={sortKey === "sex" ? sortDir : "asc"}
                onClick={() => handleSort("sex")}
              >
                Sexo
              </TableSortLabel>
            </TableCell>

            <TableCell sortDirection={sortKey === "age" ? sortDir : false}>
              <TableSortLabel
                active={sortKey === "age"}
                direction={sortKey === "age" ? sortDir : "asc"}
                onClick={() => handleSort("age")}
              >
                Edad
              </TableSortLabel>
            </TableCell>

            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {sorted.map((player) => (
            <TableRow key={player.id} hover sx={{ "&:last-child td": { border: 0 } }}>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    src={player.avatarUrl}
                    sx={{
                      bgcolor: stringToColor(player.name),
                      width: 36,
                      height: 36,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(player.name)}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>
                    {player.name}
                  </Typography>
                </Box>
              </TableCell>

              <TableCell>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {(player.sports?.includes("PADEL") || player.sport === "PADEL" || (!player.sports?.length && !player.sport)) && (
                    <Tooltip title={CATEGORY_FULL[player.category]} placement="top">
                      <Chip label={CATEGORY_LABEL[player.category]} color={CATEGORY_COLOR[player.category]} size="small" sx={{ fontWeight: 700, minWidth: 42 }} />
                    </Tooltip>
                  )}
                  {player.tenisCategory && (player.sports?.includes("TENIS") || player.sport === "TENIS") && (
                    <Tooltip title={`Tenis: ${CATEGORY_FULL[player.tenisCategory]}`} placement="top">
                      <Chip label={`T: ${CATEGORY_LABEL[player.tenisCategory]}`} color={CATEGORY_COLOR[player.tenisCategory]} size="small" sx={{ fontWeight: 700, minWidth: 42 }} />
                    </Tooltip>
                  )}
                </Box>
              </TableCell>

              <TableCell>
                <Typography variant="body2">{player.city}</Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {player.sports?.length
                    ? player.sports.map(s => SPORT_LABEL[s as keyof typeof SPORT_LABEL] ?? s).join(", ")
                    : "—"}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {player.sex === "MASCULINO" ? "Masculino" : "Femenino"}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">{player.birthDate ? `${getAge(player.birthDate)} años` : "—"}</Typography>
              </TableCell>

              <TableCell align="right">
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => onEdit(player)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton size="small" color="error" onClick={() => onDelete(player)} sx={{ ml: 0.5 }}>
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
