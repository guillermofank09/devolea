import axios from "axios";
import { API_BASE } from "./config";

const API = `${API_BASE}/api`;

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function apiRegister(
  email: string,
  name: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API}/auth/register`, {
    email,
    name,
    password,
  });
  return data;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API}/auth/login`, {
    email,
    password,
  });
  return data;
}
