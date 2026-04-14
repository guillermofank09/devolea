import { Router } from "express";
import { getRevenue, getProfesorStats, getPlayerStats } from "../controllers/stats.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/stats/revenue", requireAuth, getRevenue);
router.get("/stats/profesores", requireAuth, getProfesorStats);
router.get("/stats/players", requireAuth, getPlayerStats);

export default router;
