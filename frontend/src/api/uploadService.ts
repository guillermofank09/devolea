import axios from "axios";
import { API_BASE } from "./config";

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${API_BASE}/api/upload/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url as string;
}
