import axios from "axios";
import { API_BASE } from "./config";

const API = `${API_BASE}/api`;

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: "superadmin" | "user";
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
  payload: { username: string; name: string; password: string }
): Promise<AdminUser> {
  const { data } = await axios.post<AdminUser>(`${API}/auth/users`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function apiUpdateUser(
  token: string,
  id: number,
  payload: { name?: string; password?: string }
): Promise<AdminUser> {
  const { data } = await axios.put<AdminUser>(`${API}/auth/users/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function apiDeleteUser(token: string, id: number): Promise<void> {
  await axios.delete(`${API}/auth/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
