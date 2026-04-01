import axios from "axios";
import type { Player, PlayerFormData } from "../types/Player";

const API_URL = "http://localhost:3001/api/players";

export async function fetchPlayers(search?: string): Promise<Player[]> {
  const res = await axios.get(API_URL, {
    params: search ? { search } : {},
  });
  return res.data;
}

export async function fetchPlayerById(id: number): Promise<Player> {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
}

export async function createPlayer(data: PlayerFormData): Promise<Player> {
  const res = await axios.post(API_URL, data);
  return res.data;
}

export async function updatePlayer(id: number, data: PlayerFormData): Promise<Player> {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
}

export async function deletePlayer(id: number): Promise<void> {
  await axios.delete(`${API_URL}/${id}`);
}
