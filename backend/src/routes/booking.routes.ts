import { Router } from "express";
import { createBooking, getTodayBookings, getBookingsByCourt, getBookingsByProfesor, cancelBooking, cancelBookingGroup, deleteBooking } from "../controllers/booking.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/bookings", requireAuth, createBooking);
router.get("/bookings/today", requireAuth, getTodayBookings);
router.get("/bookings/court/:courtId", requireAuth, getBookingsByCourt);
router.get("/bookings/profesor/:profesorId", requireAuth, getBookingsByProfesor);
router.put("/bookings/:id/cancel", requireAuth, cancelBooking);
router.put("/bookings/group/:groupId/cancel", requireAuth, cancelBookingGroup);
router.delete("/bookings/:id", requireAuth, deleteBooking);

export default router;
