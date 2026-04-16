import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten imágenes"));
  },
});

export async function uploadAvatar(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No se recibió ningún archivo" });
    return;
  }

  try {
    let url: string;
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const filename = `${Date.now()}${ext}`;

    if (process.env.VERCEL) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`avatars/${filename}`, file.buffer, { access: "public" });
      url = blob.url;
    } else {
      const uploadsDir = path.join(__dirname, "../../uploads/avatars");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
      url = `${req.protocol}://${req.get("host")}/uploads/avatars/${filename}`;
    }

    res.json({ url });
  } catch (err) {
    console.error("Upload error", err);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
}
