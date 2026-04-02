import { Router } from "express";
import {
  createProfesor,
  getProfesores,
  getProfesorById,
  updateProfesor,
  deleteProfesor,
} from "../controllers/profesor.controller";

const router = Router();

router.post("/profesores",      createProfesor);
router.get("/profesores",       getProfesores);
router.get("/profesores/:id",   getProfesorById);
router.put("/profesores/:id",   updateProfesor);
router.delete("/profesores/:id", deleteProfesor);

export default router;
