import axios from "axios";
import type { Court, CourtStatus, CreateCourt } from "../types/Court";
import { API_BASE } from "./config";

const API_URL = `${API_BASE}/api/courts`;

export async function createCourt(courtParams: CreateCourt): Promise<Court> {
  const data = courtParams;
  const res = await axios.post(`${API_URL}/`, data);
  return res.data;
}

export async function fetchCourts(search?: string) {
  const res = await axios.get(API_URL, {
    params: search ? { search } : {},
  });

  return res.data;
}

export async function fetchCourtById(id: number) {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
}


export async function updateCourtStatus(id: number, status: CourtStatus): Promise<Court> {
  const res = await axios.put(`${API_URL}/${id}`, { status });
  return res.data;
}

export async function deleteCourt(id: number) {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
}

