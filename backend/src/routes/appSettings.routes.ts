import { Router } from "express";
import { getSettings, saveSettings } from "../controllers/appSettings.controller";

const router = Router();
router.get("/settings", getSettings);
router.put("/settings", saveSettings);

export default router;
