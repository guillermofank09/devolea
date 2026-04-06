import { Router } from "express";
import {
  createTournament, getTournaments, getTournamentById,
  updateTournament, deleteTournament, addPair, removePair,
  generateMatches, nextRound, updateMatch,
} from "../controllers/tournament.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/tournaments", requireAuth, createTournament);
router.get("/tournaments", requireAuth, getTournaments);
router.get("/tournaments/:id", requireAuth, getTournamentById);
router.put("/tournaments/:id", requireAuth, updateTournament);
router.delete("/tournaments/:id", requireAuth, deleteTournament);
router.post("/tournaments/:id/pairs", requireAuth, addPair);
router.delete("/tournaments/:id/pairs/:pairId", requireAuth, removePair);
router.post("/tournaments/:id/generate", requireAuth, generateMatches);
router.post("/tournaments/:id/next-round", requireAuth, nextRound);
router.put("/tournaments/matches/:matchId", requireAuth, updateMatch);

export default router;
