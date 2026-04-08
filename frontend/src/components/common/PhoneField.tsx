import { useEffect, useState } from "react";
import { Box, FormLabel, MenuItem, Select, TextField, Typography } from "@mui/material";

const COUNTRIES = [
  { dial: "54",  flag: "🇦🇷", name: "Argentina" },
  { dial: "598", flag: "🇺🇾", name: "Uruguay" },
  { dial: "55",  flag: "🇧🇷", name: "Brasil" },
  { dial: "56",  flag: "🇨🇱", name: "Chile" },
  { dial: "595", flag: "🇵🇾", name: "Paraguay" },
  { dial: "591", flag: "🇧🇴", name: "Bolivia" },
  { dial: "51",  flag: "🇵🇪", name: "Perú" },
  { dial: "57",  flag: "🇨🇴", name: "Colombia" },
  { dial: "52",  flag: "🇲🇽", name: "México" },
  { dial: "34",  flag: "🇪🇸", name: "España" },
  { dial: "1",   flag: "🇺🇸", name: "EE.UU." },
];

// Match the longest dial code first to avoid ambiguity (e.g. "595" before "59")
const SORTED = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

function parsePhone(raw: string): { dial: string; local: string } {
  const value = raw.replace(/^\+/, "");
  for (const c of SORTED) {
    if (value.startsWith(c.dial)) return { dial: c.dial, local: value.slice(c.dial.length) };
  }
  return { dial: "54", local: value };
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function PhoneField({ value, onChange, label = "Teléfono (opcional)" }: Props) {
  const [dial, setDial] = useState(() => parsePhone(value).dial);
  const [local, setLocal] = useState(() => parsePhone(value).local);

  // Sync when the parent updates the value (e.g. opening edit form)
  useEffect(() => {
    const parsed = parsePhone(value);
    setDial(parsed.dial);
    setLocal(parsed.local);
  }, [value]);

  const handleDial = (newDial: string) => {
    setDial(newDial);
    onChange(newDial + local);
  };

  const handleLocal = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setLocal(digits);
    onChange(dial + digits);
  };

  const selected = COUNTRIES.find((c) => c.dial === dial) ?? COUNTRIES[0];

  return (
    <Box>
      <FormLabel sx={{ mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary", display: "block" }}>
        {label}
      </FormLabel>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Select
          value={dial}
          onChange={(e) => handleDial(e.target.value)}
          size="small"
          renderValue={() => `${selected.flag} +${dial}`}
          sx={{ flexShrink: 0, height: 40, fontSize: "0.875rem" }}
          MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
        >
          {COUNTRIES.map((c) => (
            <MenuItem key={c.dial} value={c.dial} sx={{ gap: 1 }}>
              <span>{c.flag}</span>
              <Typography variant="body2" sx={{ minWidth: 36 }}>+{c.dial}</Typography>
              <Typography variant="body2" color="text.secondary">{c.name}</Typography>
            </MenuItem>
          ))}
        </Select>

        <TextField
          fullWidth
          size="small"
          value={local}
          onChange={(e) => handleLocal(e.target.value)}
          placeholder="Ej: 1112345678"
          inputProps={{ inputMode: "tel" }}
          sx={{ "& .MuiInputBase-root": { height: 40, fontSize: "0.875rem" } }}
        />
      </Box>
    </Box>
  );
}
