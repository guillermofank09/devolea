import { Router } from "express";
import { getProfile, saveProfile } from "../controllers/clubProfile.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, saveProfile);

export default router;
