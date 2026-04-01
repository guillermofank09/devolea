import { Router } from "express";
import { getProfile, saveProfile } from "../controllers/clubProfile.controller";

const router = Router();
router.get("/profile",  getProfile);
router.put("/profile",  saveProfile);

export default router;
