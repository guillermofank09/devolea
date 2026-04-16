import axios from "axios";
import type { AppSettings } from "../types/AppSettings";
import { API_BASE } from "./config";

const BASE = `${API_BASE}/api`;

function parseSettings(raw: any): AppSettings {
  let sportPrices: Record<string, number> = {};
  let sportClassPrices: Record<string, number> = {};
  let tournamentDurations: Record<string, number> = {};
  if (raw.sportPricesJson) { try { sportPrices = JSON.parse(raw.sportPricesJson); } catch { /* ignore */ } }
  if (raw.sportClassPricesJson) { try { sportClassPrices = JSON.parse(raw.sportClassPricesJson); } catch { /* ignore */ } }
  if (raw.tournamentDurationsJson) { try { tournamentDurations = JSON.parse(raw.tournamentDurationsJson); } catch { /* ignore */ } }
  return { ...raw, sportPrices, sportClassPrices, tournamentDurations };
}

export async function fetchSettings(): Promise<AppSettings> {
  const { data } = await axios.get(`${BASE}/settings`);
  return parseSettings(data);
}

export async function saveSettings(s: AppSettings): Promise<AppSettings> {
  const payload = {
    ...s,
    sportPricesJson: JSON.stringify(s.sportPrices ?? {}),
    sportClassPricesJson: JSON.stringify(s.sportClassPrices ?? {}),
    tournamentDurationsJson: JSON.stringify(s.tournamentDurations ?? {}),
  };
  const { data } = await axios.put(`${BASE}/settings`, payload);
  return parseSettings(data);
}
