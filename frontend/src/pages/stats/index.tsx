import { useEffect, useState } from 'react';
import {
  Box,
  Button,
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

type MedalStats = {
  id: string;
  name: string;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  role: 'team' | 'player';
};

export default function StatsRanking() {
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [ranking, setRanking] = useState<MedalStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Example sport list – adjust to your actual sports
  const SPORTS = ['Tennis', 'Basketball', 'Soccer', 'Swimming', 'Athletics'];

  // Handler for sport change
  const handleSportChange = (event: any) => {
    setSelectedSport(event.target.value);
    loadRanking(event.target.value);
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
      const mockData: MedalStats[] = [
        {
          id: '1',
          name: 'Team Alpha',
          medals: { gold: 3, silver: 1, bronze: 0 },
          role: 'team',
        },
        {
          id: '2',
          name: 'Player Beta',
          medals: { gold: 2, silver: 2, bronze: 1 },
          role: 'player',
        },
        // Add more mock entries as needed
      ];
      setRanking(mockData);
    } catch (err) {
      setError('Failed to load ranking data');
    } finally {
      setLoading(false);
    }
  };

  // On mount load ranking for default sport (first sport)
  useEffect(() => {
    loadRanking(SPORTS[0]);
  }, []);

  // Render layout
  return (
    <Box sx={{ p: 3 }}>
      {/* Sport selector}}
      <Stack spacing={2} mb={2}>
        <Typography variant="h6" gutterBottom>
          Selecciona el deporte
        </Typography>
        <Select
          value={selectedSport}
          onChange={handleSportChange}
          sx={{ minWidth: 200 }}
        >
          {[SPORTS.map((sport) => (
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
            {ranking.map((item) => (
              <ListItem
                key={item.id}
                sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}
              >
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{ variant: 'body1' }}
                />
                <Typography>
                  Oro: {item.medals.gold} | Plata: {item.medals.silver} | Bronse: {item.medals.bronze}
                </Typography>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          {/* Example of filtering by club activity – placeholder logic */}
          {user?.sports?.includes(selectedSport.split(' ')[0]) && (
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

