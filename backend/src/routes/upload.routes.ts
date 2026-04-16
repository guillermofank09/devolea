import { Router } from "express";
import { upload, uploadImage } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// POST /api/upload/image?folder=avatars|logos|...
router.post("/upload/image", requireAuth, upload.single("file"), uploadImage);

// Keep legacy path for backwards compatibility
router.post("/upload/avatar", requireAuth, upload.single("file"), uploadImage);

export default router;
