import { useRef, useState, useEffect } from "react";
import { Avatar, Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CloseIcon from "@mui/icons-material/Close";
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
  // Local blob URL shown immediately after picking — replaced by real URL once upload finishes
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke the object URL when it's replaced or the component unmounts
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  function handleClear() {
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
    onChange("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // Show preview instantly from the local file
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    // Upload in the background — does not block the form
    uploadImage(file, "avatars")
      .then((url) => {
        onChange(url);
        setPreview(null); // real URL now in `value`, release blob
      })
      .catch(() => {
        setPreview(null); // revert to previous on error
      })
      .finally(() => setUploading(false));
  }

  const src = preview ?? value;

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <Tooltip title="Cambiar foto">
        <Avatar
          src={src}
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
          {!src && getInitials(name || "?")}
        </Avatar>
      </Tooltip>

      {/* Subtle spinner while uploading — doesn't block the form */}
      {uploading && (
        <Box sx={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          bgcolor: "rgba(0,0,0,0.25)", borderRadius: "50%",
        }}>
          <CircularProgress size={size * 0.3} sx={{ color: "#fff" }} />
        </Box>
      )}

      {!disabled && (
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

      {!disabled && src && !uploading && (
        <IconButton
          size="small"
          onClick={handleClear}
          sx={{
            position: "absolute", top: -4, right: -4,
            bgcolor: "#ef4444", color: "#fff",
            width: 22, height: 22,
            border: "2px solid white",
            "&:hover": { bgcolor: "#dc2626" },
          }}
        >
          <CloseIcon sx={{ fontSize: 11 }} />
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
