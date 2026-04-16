import { Router } from "express";
import { upload, uploadAvatar } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/upload/avatar", requireAuth, upload.single("file"), uploadAvatar);

export default router;
