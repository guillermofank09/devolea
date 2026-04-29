import axios from "axios";
import { API_BASE } from "./config";

const API = `${API_BASE}/api`;

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: "superadmin" | "user";
  sports: string[];
  trialEndsAt?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: "superadmin" | "user";
  isActive: boolean;
  lastPaymentDate: string | null;
  trialEndsAt: string | null;
  sports: string[];
  createdAt: string;
}

export async function apiLogin(username: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API}/auth/login`, { username, password });
  return data;
}

export async function apiGetUsers(token: string): Promise<AdminUser[]> {
  const { data } = await axios.get<AdminUser[]>(`${API}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function apiCreateUser(
  token: string,
  payload: { username: string; name: string; password: string; sports: string[] }
): Promise<AdminUser> {
  const { data } = await axios.post<AdminUser>(`${API}/auth/users`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function apiVerifySession(): Promise<AdminUser> {
  const { data } = await axios.get<AdminUser>(`${API}/auth/me`);
  return data;
}

export async function apiUpdateUser(
  token: string,
  id: number,
  payload: { name?: string; password?: string; isActive?: boolean; lastPaymentDate?: string | null; trialEndsAt?: string | null; sports?: string[] }
): Promise<AdminUser> {
  const { data } = await axios.put<AdminUser>(`${API}/auth/users/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export interface UserStats {
  playerCount: number;
  profesorCount: number;
  tournamentCount: number;
  courts: Array<{ id: number; name: string; bookedHours: number; occupancyPct: number }>;
}

export async function apiGetUserStats(token: string, userId: number): Promise<UserStats> {
  const { data } = await axios.get<UserStats>(`${API}/auth/users/${userId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function apiImpersonate(token: string, userId: number): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(
    `${API}/auth/impersonate/${userId}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}

export async function apiChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await axios.put(
    `${API}/auth/me/password`,
    { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function apiDeleteUser(token: string, id: number): Promise<void> {
  await axios.delete(`${API}/auth/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
