import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Box, FormLabel } from "@mui/material";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/**
 * Phone input with country-code selector and auto-formatting mask.
 * Defaults to Argentina (+54). Stores the full E.164-style digits (no "+").
 */
export default function PhoneField({ value, onChange, label = "Teléfono (opcional)" }: Props) {
  // Strip any leading "+" so the library always receives plain digits
  const normalizedValue = value.replace(/^\+/, "");

  return (
    <Box>
      <FormLabel sx={{ mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary", display: "block" }}>
        {label}
      </FormLabel>
      <PhoneInput
        country="ar"
        preferredCountries={["ar", "uy", "br", "cl", "py", "bo"]}
        value={normalizedValue}
        onChange={(val) => onChange(val.replace(/^\+/, ""))}
        inputStyle={{
          width: "100%",
          height: "40px",
          fontSize: "0.875rem",
          fontFamily: "inherit",
          borderRadius: "0 16px 16px 0",
          border: "1px solid rgba(0,0,0,0.23)",
          borderLeft: "none",
          outline: "none",
          boxShadow: "none",
        }}
        buttonStyle={{
          border: "1px solid rgba(0,0,0,0.23)",
          borderRight: "none",
          borderRadius: "16px 0 0 16px",
          background: "#fff",
        }}
        containerStyle={{
          width: "100%",
          border: "none",
        }}
        enableSearch
        searchPlaceholder="Buscar país..."
        searchNotFound="No se encontró"
        specialLabel=""
      />
    </Box>
  );
}
