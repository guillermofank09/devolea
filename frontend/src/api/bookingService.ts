import axios from "axios";
import type { Booking, CreateBookingDto } from "../types/Booking";
import { API_BASE } from "./config";

const API_URL = `${API_BASE}/api`;

export async function fetchTodayBookings(): Promise<Booking[]> {
  const res = await axios.get(`${API_URL}/bookings/today`);
  return res.data;
}

export async function fetchPendingBookings(): Promise<Booking[]> {
  const res = await axios.get(`${API_URL}/bookings/pending`);
  return res.data;
}

export async function fetchBookingsByCourt(courtId: number): Promise<Booking[]> {
  const res = await axios.get(`${API_URL}/bookings/court/${courtId}`);
  return res.data;
}

export async function fetchBookingsByProfesor(profesorId: number): Promise<Booking[]> {
  const res = await axios.get(`${API_URL}/bookings/profesor/${profesorId}`);
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

export async function confirmBooking(id: number): Promise<Booking> {
  const res = await axios.put(`${API_URL}/bookings/${id}/confirm`);
  return res.data;
}

export async function cancelBookingGroup(groupId: string): Promise<{ cancelled: number }> {
  const res = await axios.put(`${API_URL}/bookings/group/${groupId}/cancel`);
  return res.data;
}

export async function deleteBooking(id: number): Promise<void> {
  await axios.delete(`${API_URL}/bookings/${id}`);
}

export function buildConfirmWaUrl(guestPhone: string, courtName: string, start: Date, clubName?: string | null): string {
  const digits = guestPhone.replace(/\D/g, "");
  const dateLabel = start.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const hours = String(start.getHours()).padStart(2, "0");
  const mins  = String(start.getMinutes()).padStart(2, "0");
  const club = clubName ? ` de ${clubName}` : "";
  const msg = `Hola! Confirmamos tu reserva${club}: ${courtName} el ${dateLabel} a las ${hours}:${mins} hs. ¡Te esperamos!`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}
