import { Router } from "express";
import {
  createBooking,
  getBookingsByCourt,
  getBookingsByProfesor,
  cancelBooking,
  cancelBookingGroup,
  deleteBooking,
} from "../controllers/booking.controller";

const router = Router();

router.post("/bookings",                            createBooking);
router.get("/bookings/court/:courtId",              getBookingsByCourt);
router.get("/bookings/profesor/:profesorId",        getBookingsByProfesor);
router.put("/bookings/:id/cancel",                  cancelBooking);
router.put("/bookings/group/:groupId/cancel",       cancelBookingGroup);
router.delete("/bookings/:id",                      deleteBooking);

export default router;
