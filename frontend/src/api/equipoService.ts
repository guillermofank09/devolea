import axios from "axios";
import type { Equipo, EquipoFormData } from "../types/Equipo";
import { API_BASE } from "./config";

const API_URL = `${API_BASE}/api/equipos`;

export async function fetchEquipos(search?: string): Promise<Equipo[]> {
  const res = await axios.get(API_URL, { params: search ? { search } : {} });
  return res.data;
}

export async function createEquipo(data: EquipoFormData): Promise<Equipo> {
  const res = await axios.post(API_URL, data);
  return res.data;
}

export async function updateEquipo(id: number, data: EquipoFormData): Promise<Equipo> {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
}

export async function deleteEquipo(id: number): Promise<void> {
  await axios.delete(`${API_URL}/${id}`);
}
