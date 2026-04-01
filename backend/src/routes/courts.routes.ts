import { Router } from "express";
import {
  createCourt,
  getCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
} from "../controllers/court.controller";

const router = Router();

router.post("/courts", createCourt);
router.get("/courts", getCourts);
router.get("/courts/:id", getCourtById);
router.put("/courts/:id", updateCourt);
router.delete("/courts/:id", deleteCourt);

export default router;
