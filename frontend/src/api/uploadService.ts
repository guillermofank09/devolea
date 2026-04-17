import axios from "axios";
import { API_BASE } from "./config";

// Resize to maxDimension on longest side and convert to WebP.
// Avatars display at ~72px so 400px gives plenty of resolution with minimal bytes.
async function compressImage(file: File, maxDimension = 400, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("canvas toBlob failed")),
        "image/webp",
        quality,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function uploadImage(file: File, folder = "images"): Promise<string> {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append("file", compressed, "image.webp");
  // Do NOT set Content-Type manually — axios derives it from FormData
  // including the required multipart boundary
  const res = await axios.post(
    `${API_BASE}/api/upload/image?folder=${encodeURIComponent(folder)}`,
    formData,
  );
  return res.data.url as string;
}
