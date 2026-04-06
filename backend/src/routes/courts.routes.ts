import { Router } from "express";
import { createCourt, getCourts, getCourtById, updateCourt, deleteCourt } from "../controllers/court.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/courts", requireAuth, createCourt);
router.get("/courts", requireAuth, getCourts);
router.get("/courts/:id", requireAuth, getCourtById);
router.put("/courts/:id", requireAuth, updateCourt);
router.delete("/courts/:id", requireAuth, deleteCourt);

export default router;
