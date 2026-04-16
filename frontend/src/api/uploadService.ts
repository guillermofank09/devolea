import axios from "axios";
import { API_BASE } from "./config";

export async function uploadImage(file: File, folder = "images"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  // Do NOT set Content-Type manually — axios derives it from FormData
  // including the required multipart boundary
  const res = await axios.post(
    `${API_BASE}/api/upload/image?folder=${encodeURIComponent(folder)}`,
    formData,
  );
  return res.data.url as string;
}
