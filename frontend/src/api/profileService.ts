import axios from "axios";
import type { ClubProfile, DaySchedule } from "../types/ClubProfile";
import { DEFAULT_HOURS } from "../types/ClubProfile";

const BASE = "http://localhost:3001/api";

function parseProfile(raw: any): ClubProfile {
  let businessHours: DaySchedule[] = DEFAULT_HOURS;
  if (raw.businessHoursJson) {
    try { businessHours = JSON.parse(raw.businessHoursJson); } catch { /* ignore */ }
  }
  return { ...raw, businessHours };
}

export async function fetchProfile(): Promise<ClubProfile> {
  const { data } = await axios.get(`${BASE}/profile`);
  return parseProfile(data);
}

export async function saveProfile(profile: ClubProfile): Promise<ClubProfile> {
  const payload = {
    ...profile,
    businessHoursJson: JSON.stringify(profile.businessHours ?? DEFAULT_HOURS),
  };
  const { data } = await axios.put(`${BASE}/profile`, payload);
  return parseProfile(data);
}
