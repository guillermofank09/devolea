import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../entities/Booking";
import { BookingService } from "../services/booking.service";

function getService() {
  return new BookingService(AppDataSource.getRepository(Booking));
}

export const createBooking = async (req: Request, res: Response) => {
  const { courtId, playerId, profesorId, startTime, endTime, isRecurring, price } = req.body;
  if (!courtId || (!playerId && !profesorId) || !startTime || !endTime) {
    res.status(400).json({ error: "Faltan campos requeridos" });
    return;
  }
  const userId = req.authUser!.sub;
  try {
    const result = await getService().create({
      courtId: Number(courtId),
      playerId: playerId ? Number(playerId) : undefined,
      profesorId: profesorId ? Number(profesorId) : undefined,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isRecurring: Boolean(isRecurring),
      price: price != null ? Number(price) : undefined,
    }, userId);
    res.status(201).json(result);
  } catch (err: any) {
    const status = err.message.includes("ya está reservado") || err.message.includes("todos los horarios") ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const getTodayBookings = async (req: Request, res: Response) => {
  const userId = req.authUser!.sub;
  try {
    const bookings = await getService().getTodayBookings(userId);
    res.json(bookings);
  } catch {
    res.status(500).json({ error: "Error al obtener reservas de hoy" });
  }
};

export const getBookingsByProfesor = async (req: Request, res: Response) => {
  const profesorId = Number(req.params.profesorId);
  if (isNaN(profesorId)) { res.status(400).json({ error: "profesorId inválido" }); return; }
  try {
    const bookings = await getService().getByProfesorId(profesorId);
    res.json(bookings);
  } catch {
    res.status(500).json({ error: "Error al obtener reservas del profesor" });
  }
};

export const getBookingsByCourt = async (req: Request, res: Response) => {
  const courtId = Number(req.params.courtId);
  if (isNaN(courtId)) { res.status(400).json({ error: "courtId inválido" }); return; }
  try {
    const bookings = await getService().getByCourtId(courtId);
    res.json(bookings);
  } catch {
    res.status(500).json({ error: "Error al obtener reservas" });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const booking = await getService().cancel(Number(req.params.id));
    if (!booking) { res.status(404).json({ error: "Reserva no encontrada" }); return; }
    res.json(booking);
  } catch {
    res.status(500).json({ error: "Error al cancelar la reserva" });
  }
};

export const cancelBookingGroup = async (req: Request, res: Response) => {
  const { groupId } = req.params;
  if (!groupId) { res.status(400).json({ error: "groupId requerido" }); return; }
  try {
    const affected = await getService().cancelGroup(groupId);
    res.json({ cancelled: affected });
  } catch {
    res.status(500).json({ error: "Error al cancelar la serie" });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    await getService().delete(Number(req.params.id));
    res.json({ message: "Reserva eliminada" });
  } catch {
    res.status(500).json({ error: "Error al eliminar la reserva" });
  }
};
