import { Router } from "express";
import { createProfesor, getProfesores, getProfesorById, updateProfesor, deleteProfesor } from "../controllers/profesor.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/profesores", requireAuth, createProfesor);
router.get("/profesores", requireAuth, getProfesores);
router.get("/profesores/:id", requireAuth, getProfesorById);
router.put("/profesores/:id", requireAuth, updateProfesor);
router.delete("/profesores/:id", requireAuth, deleteProfesor);

export default router;
