import axios from "axios";
import type { Profesor, ProfesorFormData } from "../types/Profesor";
import type { DaySchedule } from "../types/ClubProfile";
import { API_BASE } from "./config";

const API_URL = `${API_BASE}/api/profesores`;

export interface ProfesorPayload extends ProfesorFormData {
  hourlyRate?: number;
  schedule?: DaySchedule[];
  sport?: string;
}

export async function fetchProfesores(search?: string): Promise<Profesor[]> {
  const res = await axios.get(API_URL, { params: search ? { search } : {} });
  return res.data;
}

export async function createProfesor(data: ProfesorPayload): Promise<Profesor> {
  const res = await axios.post(API_URL, data);
  return res.data;
}

export async function updateProfesor(id: number, data: ProfesorPayload): Promise<Profesor> {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
}

export async function deleteProfesor(id: number): Promise<void> {
  await axios.delete(`${API_URL}/${id}`);
}
