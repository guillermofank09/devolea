import { Router } from "express";
import { getRevenue } from "../controllers/stats.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/stats/revenue", requireAuth, getRevenue);

export default router;
