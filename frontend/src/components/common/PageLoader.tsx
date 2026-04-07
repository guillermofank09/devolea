import { Box, keyframes } from "@mui/material";

const spin = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export default function PageLoader() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "transparent",
        zIndex: 9,
      }}
    >
      <Box
        component="img"
        src="/favicon.ico"
        alt="Cargando…"
        sx={{
          width: 48,
          height: 48,
          animation: `${spin} 0.9s linear infinite`,
          borderRadius: "50%",
        }}
      />
    </Box>
  );
}
