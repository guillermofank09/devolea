import { Router } from "express";
import { createPlayer, getPlayers, getPlayerById, updatePlayer, deletePlayer } from "../controllers/player.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/players", requireAuth, createPlayer);
router.get("/players", requireAuth, getPlayers);
router.get("/players/:id", requireAuth, getPlayerById);
router.put("/players/:id", requireAuth, updatePlayer);
router.delete("/players/:id", requireAuth, deletePlayer);

export default router;
