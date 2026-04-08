import { Router } from "express";
import { getRevenue, getProfesorStats } from "../controllers/stats.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/stats/revenue", requireAuth, getRevenue);
router.get("/stats/profesores", requireAuth, getProfesorStats);

export default router;
