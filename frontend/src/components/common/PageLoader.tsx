import { Box, keyframes } from "@mui/material";

const spin = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

interface Props {
  /** If provided, renders as an inline spinner at that pixel size instead of full-screen overlay */
  size?: number;
}

export default function PageLoader({ size }: Props = {}) {
  if (size != null) {
    return (
      <Box
        component="img"
        src="/favicon.ico"
        alt="Cargando…"
        sx={{
          width: size,
          height: size,
          animation: `${spin} 0.9s linear infinite`,
          borderRadius: "50%",
          display: "inline-block",
          verticalAlign: "middle",
          flexShrink: 0,
        }}
      />
    );
  }

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
