import axios from "axios";
import type { Booking, CreateBookingDto } from "../types/Booking";
import { API_BASE } from "./config";

const API_URL = `${API_BASE}/api`;

export async function fetchBookingsByCourt(courtId: number): Promise<Booking[]> {
  const res = await axios.get(`${API_URL}/bookings/court/${courtId}`);
  return res.data;
}

export async function createBooking(data: CreateBookingDto): Promise<Booking> {
  const res = await axios.post(`${API_URL}/bookings`, data);
  return res.data;
}

export async function cancelBooking(id: number): Promise<Booking> {
  const res = await axios.put(`${API_URL}/bookings/${id}/cancel`);
  return res.data;
}

export async function cancelBookingGroup(groupId: string): Promise<{ cancelled: number }> {
  const res = await axios.put(`${API_URL}/bookings/group/${groupId}/cancel`);
  return res.data;
}

export async function deleteBooking(id: number): Promise<void> {
  await axios.delete(`${API_URL}/bookings/${id}`);
}
