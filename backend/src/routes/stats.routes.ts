import { Router } from "express";
import { getRevenue } from "../controllers/stats.controller";

const router = Router();

router.get("/stats/revenue", getRevenue);

export default router;
