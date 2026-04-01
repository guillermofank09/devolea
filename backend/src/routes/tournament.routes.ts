import { Router } from "express";
import {
  createTournament, getTournaments, getTournamentById,
  updateTournament, deleteTournament, addPair, removePair,
  generateMatches, nextRound, updateMatch,
} from "../controllers/tournament.controller";

const router = Router();
router.post("/tournaments", createTournament);
router.get("/tournaments", getTournaments);
router.get("/tournaments/:id", getTournamentById);
router.put("/tournaments/:id", updateTournament);
router.delete("/tournaments/:id", deleteTournament);
router.post("/tournaments/:id/pairs", addPair);
router.delete("/tournaments/:id/pairs/:pairId", removePair);
router.post("/tournaments/:id/generate", generateMatches);
router.post("/tournaments/:id/next-round", nextRound);
router.put("/tournaments/matches/:matchId", updateMatch);
export default router;
