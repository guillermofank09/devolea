import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
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
  return (
    <Box>
      <FormLabel sx={{ mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary", display: "block" }}>
        {label}
      </FormLabel>
      <PhoneInput
        country="ar"
        preferredCountries={["ar", "uy", "br", "cl", "py", "bo"]}
        value={value}
        onChange={onChange}
        inputStyle={{
          width: "100%",
          height: "40px",
          fontSize: "0.875rem",
          borderRadius: "4px",
          borderColor: "rgba(0,0,0,0.23)",
          fontFamily: "inherit",
        }}
        buttonStyle={{
          borderColor: "rgba(0,0,0,0.23)",
          borderRadius: "4px 0 0 4px",
          background: "#fff",
        }}
        containerStyle={{ width: "100%" }}
        enableSearch
        searchPlaceholder="Buscar país..."
        searchNotFound="No se encontró"
        specialLabel=""
      />
    </Box>
  );
}
