import { Router } from "express";
import { createEquipo, getEquipos, getEquipoById, updateEquipo, deleteEquipo } from "../controllers/equipo.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/equipos", requireAuth, createEquipo);
router.get("/equipos", requireAuth, getEquipos);
router.get("/equipos/:id", requireAuth, getEquipoById);
router.put("/equipos/:id", requireAuth, updateEquipo);
router.delete("/equipos/:id", requireAuth, deleteEquipo);

export default router;
