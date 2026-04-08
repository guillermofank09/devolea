import type { SxProps, Theme } from "@mui/material";

export const FORM_LABEL_SX: SxProps<Theme> = {
  mb: 0.5,
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "text.secondary",
  display: "block",
};

export const FORM_INPUT_SX: SxProps<Theme> = {
  "& .MuiInputBase-root": { height: 40, fontSize: "0.875rem" },
};
