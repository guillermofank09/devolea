import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { fetchRanking } from '../../api/statsService';
import type { RankingEntry, RankingResponse } from '../../api/statsService';

const PHASE_COLOR: Record<string, 'warning' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success'> = {
  'Campeón':   'warning',
  'Final':     'secondary',
  'Semifinal': 'primary',
  'Cuartos':   'info',
  'Octavos':   'default',
  'Fase Grupal': 'default',
};

const SPORT_LABEL: Record<string, string> = {
  TENIS: 'Tenis',
  PADEL: 'Pádel',
  FUTBOL_5: 'Fútbol 5',
  FUTBOL_7: 'Fútbol 7',
  FUTBOL_11: 'Fútbol 11',
  VOLEY: 'Vóley',
  BASQUET: 'Básquet',
};

const CATEGORY_LABEL: Record<string, string> = {
  PRIMERA: '1ra',
  SEGUNDA: '2da',
  TERCERA: '3ra',
  CUARTA: '4ta',
  QUINTA: '5ta',
  SEXTA: '6ta',
  SEPTIMA: '7ma',
  SIN_CATEGORIA: 'Sin categoría',
};

function medalColor(pos: number): string | undefined {
  if (pos === 1) return '#FFD700';
  if (pos === 2) return '#C0C0C0';
  if (pos === 3) return '#CD7F32';
  return undefined;
}

export default function StatsRanking() {
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (sport: string, category: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchRanking(sport || undefined, category || undefined);
      setData(result);
    } catch {
      setError('Error al cargar el ranking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('', '');
  }, [load]);

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    load(sport, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    load(selectedSport, category);
  };

  const ranking: RankingEntry[] = data?.ranking ?? [];
  const availableSports: string[] = data?.availableSports ?? [];
  const availableCategories: string[] = data?.availableCategories ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Ranking de Torneos
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Deporte</InputLabel>
          <Select
            value={selectedSport}
            label="Deporte"
            onChange={e => handleSportChange(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {availableSports.map(s => (
              <MenuItem key={s} value={s}>{SPORT_LABEL[s] ?? s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Categoría</InputLabel>
          <Select
            value={selectedCategory}
            label="Categoría"
            onChange={e => handleCategoryChange(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {availableCategories.map(c => (
              <MenuItem key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading && (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 4 }}>{error}</Typography>
      )}

      {!loading && !error && ranking.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          No hay datos de ranking. Completá torneos de tipo eliminatorio (bracket) para ver resultados.
        </Typography>
      )}

      {!loading && !error && ranking.length > 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700, width: 48 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Participaciones</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ranking.map((entry, idx) => {
                const pos = idx + 1;
                const color = medalColor(pos);
                return (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {pos <= 3 ? (
                          <EmojiEventsIcon sx={{ fontSize: 18, color }} />
                        ) : (
                          <Typography variant="body2" color="text.secondary">{pos}</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={pos <= 3 ? 700 : 400}>
                        {entry.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.type === 'team' ? 'Equipo' : 'Pareja'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {entry.results.map((r, i) => (
                          <Chip
                            key={i}
                            label={`${r.tournamentName}: ${r.phase} (+${r.points})`}
                            size="small"
                            color={PHASE_COLOR[r.phase] ?? 'default'}
                            variant={r.phase === 'Campeón' ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight={700}>
                        {entry.total}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Puntos: Campeón 100 · Final 70 · Semifinal 50 · Cuartos 30 · Octavos 20 · Fase grupal 10
        </Typography>
      </Box>
    </Box>
  );
}
