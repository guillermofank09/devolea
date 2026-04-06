import { Router } from "express";
import { getSettings, saveSettings } from "../controllers/appSettings.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/settings", requireAuth, getSettings);
router.put("/settings", requireAuth, saveSettings);

export default router;
