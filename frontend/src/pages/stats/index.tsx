import { useEffect, useState } from 'react';
import {
  Box,
  MenuItem,
  Select,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';

type RankingEntry = {
  id: string;
  name: string;
  scores: number[]; // points per tournament round
  total: number;     // sum of scores
  role: 'team' | 'player';
};

export default function StatsRanking() {
  const { user } = useAuth();
  const SPORTS = ['Tennis', 'Basketball', 'Soccer', 'Swimming', 'Athletics'];
  const [selectedSport, setSelectedSport] = useState<string>(SPORTS[0]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Handler for sport change
  const handleSportChange = (event: any) => {
    const sport = event.target.value;
    setSelectedSport(sport);
    loadRanking(sport);
  };

  // Load ranking data (mock API call – replace with real endpoint)
  const loadRanking = async (sport: string) => {
    if (!sport) {
      setRanking([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Replace with actual API call, e.g., fetch(`/api/stats/ranking?sport=${sport}`)
      const mockData: RankingEntry[] = [
        {
          id: '1',
          name: 'Team Alpha',
          scores: [150, 100, 50],
          total: 300,
          role: 'team',
        },
        {
          id: '2',
          name: 'Player Beta',
          scores: [120, 80, 90],
          total: 290,
          role: 'player',
        },
        {
          id: '3',
          name: 'Team Gamma',
          scores: [200, 60, 40],
          total: 300,
          role: 'team',
        },
        // Add more mock entries as needed
      ];
      // Sort by total descending
      const sorted = [...mockData].sort((a, b) => b.total - a.total);
      setRanking(sorted);
    } catch (err) {
      setError('Failed to load ranking data');
    } finally {
      setLoading(false);
    }
  };

  // On mount load ranking for default sport
  useEffect(() => {
    loadRanking(selectedSport);
  }, []);

  // Helper to render scores list
  const renderScores = (scores: number[]) => (
    <span style={{ fontSize: '0.85rem', color: '#666' }}>
      {scores.map((s, i) => (
        <span key={i}>
          {i > 0 && ' + '}
          {s}
        </span>
      ))}
      {' = '}
      <strong>{scores.reduce((a, b) => a + b, 0)}</strong>
    </span>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Sport selector */}
      <Stack spacing={2} mb={2}>
        <Typography variant="h6" gutterBottom>
          Selecciona el deporte
        </Typography>
        <Select
          value={selectedSport}
          onChange={handleSportChange}
          sx={{ minWidth: 200 }}
        >
          {SPORTS.map((sport) => (
            <MenuItem key={sport} value={sport}>
              {sport}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {/* Ranking list */}
      {loading && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Typography color="error" sx={{ mt: 4 }}>
          {error}
        </Typography>
      )}
      {ranking.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            Ranking de {selectedSport}
          </Typography>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {ranking.map((item, idx) => (
              <ListItem
                key={item.id}
                sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}
              >
                <ListItemText
                  primary={`${idx + 1}. ${item.name}`}
                  secondary={item.role === 'team' ? 'Equipo' : 'Jugador'}
                  primaryTypographyProps={{ variant: 'body1' }}
                />
                <Box sx={{ textAlign: 'right' }}>
                  {renderScores(item.scores)}
                </Box>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          {/* Example of filtering by club activity – placeholder logic */}
          {user?.sports?.includes(selectedSport) && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Club activo – se mostrarán datos de equipos/jugadores habilitados
              </Typography>
            </Box>
          )}
        </>
      )}
      {!loading && ranking.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          No hay datos de ranking para este deporte aún.
        </Typography>
      )}
    </Box>
  );
}
