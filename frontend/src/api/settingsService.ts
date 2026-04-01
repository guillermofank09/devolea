import axios from "axios";
import type { AppSettings } from "../types/AppSettings";
import { API_BASE } from "./config";

const BASE = `${API_BASE}/api`;

export async function fetchSettings(): Promise<AppSettings> {
  const { data } = await axios.get(`${BASE}/settings`);
  return data;
}

export async function saveSettings(s: AppSettings): Promise<AppSettings> {
  const { data } = await axios.put(`${BASE}/settings`, s);
  return data;
}
