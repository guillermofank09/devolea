import { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Player, PlayerCategory } from "../../types/Player";

const CATEGORY_LABEL: Record<PlayerCategory, string> = {
  PRIMERA: "1ra",
  SEGUNDA: "2da",
  TERCERA: "3ra",
  CUARTA: "4ta",
  QUINTA: "5ta",
  SEXTA: "6ta",
  SEPTIMA: "7ma",
};

// Numeric order for sorting categories
const CATEGORY_ORDER: Record<PlayerCategory, number> = {
  PRIMERA: 1,
  SEGUNDA: 2,
  TERCERA: 3,
  CUARTA: 4,
  QUINTA: 5,
  SEXTA: 6,
  SEPTIMA: 7,
};

const CATEGORY_COLOR: Record<
  PlayerCategory,
  "error" | "warning" | "success" | "info" | "default" | "primary" | "secondary"
> = {
  PRIMERA: "error",
  SEGUNDA: "warning",
  TERCERA: "success",
  CUARTA: "info",
  QUINTA: "primary",
  SEXTA: "secondary",
  SEPTIMA: "default",
};

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 45%, 40%)`;
}

type SortKey = "name" | "category" | "city" | "sex" | "age";
type SortDir = "asc" | "desc";

function getValue(player: Player, key: SortKey): string | number {
  switch (key) {
    case "name":     return player.name.toLowerCase();
    case "category": return CATEGORY_ORDER[player.category];
    case "city":     return player.city.toLowerCase();
    case "sex":      return player.sex;
    case "age":      return -new Date(player.birthDate).getTime(); // newer birth = younger = higher age desc
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

export default function PlayerTable({ players, onEdit, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = sortPlayers(players, sortKey, sortDir);

  const col = (key: SortKey) => (
    <TableSortLabel
      active={sortKey === key}
      direction={sortKey === key ? sortDir : "asc"}
      onClick={() => handleSort(key)}
    />
  );

  if (players.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography color="text.secondary">No hay jugadores registrados.</Typography>
      </Box>
    );
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
                <Chip
                  label={CATEGORY_LABEL[player.category]}
                  color={CATEGORY_COLOR[player.category]}
                  size="small"
                  sx={{ fontWeight: 700, minWidth: 42 }}
                />
              </TableCell>

              <TableCell>
                <Typography variant="body2">{player.city}</Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {player.sex === "MASCULINO" ? "Masculino" : "Femenino"}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">{getAge(player.birthDate)} años</Typography>
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
