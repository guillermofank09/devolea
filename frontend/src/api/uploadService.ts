import axios from "axios";
import { API_BASE } from "./config";

export async function uploadImage(file: File, folder = "images"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(
    `${API_BASE}/api/upload/image?folder=${encodeURIComponent(folder)}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.url as string;
}
