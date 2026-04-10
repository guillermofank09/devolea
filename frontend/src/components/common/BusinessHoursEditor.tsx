import {
  Box,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { DaySchedule } from "../../types/ClubProfile";

interface Props {
  value: DaySchedule[];
  onChange: (v: DaySchedule[]) => void;
  disabled?: boolean;
}

export default function BusinessHoursEditor({ value, onChange, disabled }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  function setDayField<K extends keyof DaySchedule>(idx: number, field: K, val: DaySchedule[K]) {
    onChange(value.map((d, i) => (i === idx ? { ...d, [field]: val } : d)));
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {!isMobile && (
        <Box sx={{ display: "grid", gridTemplateColumns: "120px 56px 1fr 1fr", gap: 1.5, mb: 1, px: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>Día</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>Abierto</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>Apertura</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>Cierre</Typography>
        </Box>
      )}

      {value.map((d, idx) =>
        isMobile ? (
          <Box
            key={d.day}
            sx={{ px: 1, py: 0.75, borderRadius: 2, bgcolor: d.isOpen ? "transparent" : "rgba(0,0,0,0.02)" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography
                variant="body2"
                fontWeight={d.isOpen ? 600 : 400}
                color={d.isOpen ? "text.primary" : "text.disabled"}
              >
                {d.day}
              </Typography>
              <Switch
                size="small"
                checked={d.isOpen}
                disabled={disabled}
                onChange={e => setDayField(idx, "isOpen", e.target.checked)}
                sx={{
                  "& .MuiSwitch-thumb": { bgcolor: d.isOpen ? "#F5AD27" : undefined },
                  "& .MuiSwitch-track": { bgcolor: d.isOpen ? "rgba(245,173,39,0.4) !important" : undefined },
                }}
              />
            </Box>
            {d.isOpen && (
              <Box sx={{ display: "flex", gap: 1, mt: 0.75 }}>
                <TextField
                  type="time"
                  size="small"
                  value={d.openTime}
                  disabled={disabled}
                  onChange={e => setDayField(idx, "openTime", e.target.value)}
                  sx={{ flex: 1, "& input": { fontSize: "0.82rem" } }}
                />
                <TextField
                  type="time"
                  size="small"
                  value={d.closeTime}
                  disabled={disabled}
                  onChange={e => setDayField(idx, "closeTime", e.target.value)}
                  sx={{ flex: 1, "& input": { fontSize: "0.82rem" } }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box
            key={d.day}
            sx={{
              display: "grid",
              gridTemplateColumns: "120px 56px 1fr 1fr",
              gap: 1.5,
              alignItems: "center",
              px: 1,
              py: 0.75,
              borderRadius: 2,
              bgcolor: d.isOpen ? "transparent" : "rgba(0,0,0,0.02)",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={d.isOpen ? 600 : 400}
              color={d.isOpen ? "text.primary" : "text.disabled"}
            >
              {d.day}
            </Typography>

            <Tooltip title={d.isOpen ? "Marcar como cerrado" : "Marcar como abierto"}>
              <Switch
                size="small"
                checked={d.isOpen}
                disabled={disabled}
                onChange={e => setDayField(idx, "isOpen", e.target.checked)}
                sx={{
                  "& .MuiSwitch-thumb": { bgcolor: d.isOpen ? "#F5AD27" : undefined },
                  "& .MuiSwitch-track": { bgcolor: d.isOpen ? "rgba(245,173,39,0.4) !important" : undefined },
                }}
              />
            </Tooltip>

            <TextField
              type="time"
              size="small"
              value={d.openTime}
              disabled={!d.isOpen || disabled}
              onChange={e => setDayField(idx, "openTime", e.target.value)}
              sx={{ "& input": { fontSize: "0.82rem" } }}
            />

            <TextField
              type="time"
              size="small"
              value={d.closeTime}
              disabled={!d.isOpen || disabled}
              onChange={e => setDayField(idx, "closeTime", e.target.value)}
              sx={{ "& input": { fontSize: "0.82rem" } }}
            />
          </Box>
        )
      )}
    </Box>
  );
}
