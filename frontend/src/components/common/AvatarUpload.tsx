import { useRef, useState } from "react";
import { Avatar, Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { uploadImage } from "../../api/uploadService";
import { getInitials, stringToColor } from "../../utils/uiUtils";

interface Props {
  name: string;
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  size?: number;
}

export default function AvatarUpload({ name, value, onChange, disabled, size = 72 }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const url = await uploadImage(file, "avatars");
      onChange(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <Tooltip title="Cambiar foto">
        <Avatar
          src={value}
          sx={{
            width: size,
            height: size,
            bgcolor: stringToColor(name || "?"),
            fontSize: size * 0.35,
            fontWeight: 700,
            cursor: disabled ? "default" : "pointer",
            border: "2px solid",
            borderColor: "divider",
            transition: "opacity 0.15s",
            "&:hover": disabled ? {} : { opacity: 0.85 },
          }}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          {!value && getInitials(name || "?")}
        </Avatar>
      </Tooltip>

      {uploading && (
        <Box sx={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          bgcolor: "rgba(0,0,0,0.4)", borderRadius: "50%",
        }}>
          <CircularProgress size={size * 0.4} sx={{ color: "#fff" }} />
        </Box>
      )}

      {!disabled && !uploading && (
        <IconButton
          size="small"
          onClick={() => inputRef.current?.click()}
          sx={{
            position: "absolute", bottom: -4, right: -4,
            bgcolor: "#F5AD27", color: "#111",
            width: 26, height: 26,
            border: "2px solid white",
            "&:hover": { bgcolor: "#e09b18" },
          }}
        >
          <CameraAltIcon sx={{ fontSize: 13 }} />
        </IconButton>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </Box>
  );
}
