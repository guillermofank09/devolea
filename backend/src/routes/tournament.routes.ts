import { Router } from "express";
import {
  createTournament, getTournaments, getTournamentById,
  updateTournament, deleteTournament, addPair, removePair, updatePair,
  generateMatches, resetMatches, nextRound, updateMatch, createPlaceholderMatch, getMatchesByCourt, triggerRepechage,
  addTeam, removeTeam, disqualifyPair, disqualifyTeam,
} from "../controllers/tournament.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/tournaments", requireAuth, createTournament);
router.get("/tournaments", requireAuth, getTournaments);
router.get("/tournaments/:id", requireAuth, getTournamentById);
router.put("/tournaments/:id", requireAuth, updateTournament);
router.delete("/tournaments/:id", requireAuth, deleteTournament);
router.post("/tournaments/:id/pairs", requireAuth, addPair);
router.patch("/tournaments/:id/pairs/:pairId", requireAuth, updatePair);
router.delete("/tournaments/:id/pairs/:pairId", requireAuth, removePair);
router.post("/tournaments/:id/generate", requireAuth, generateMatches);
router.delete("/tournaments/:id/matches", requireAuth, resetMatches);
router.post("/tournaments/:id/next-round", requireAuth, nextRound);
router.post("/tournaments/:id/repechage", requireAuth, triggerRepechage);
router.post("/tournaments/:id/placeholder-match", requireAuth, createPlaceholderMatch);
router.put("/tournaments/matches/:matchId", requireAuth, updateMatch);
router.get("/tournaments/matches/court/:courtId", requireAuth, getMatchesByCourt);
router.post("/tournaments/:id/teams", requireAuth, addTeam);
router.delete("/tournaments/:id/teams/:teamId", requireAuth, removeTeam);
router.post("/tournaments/:id/pairs/:pairId/disqualify", requireAuth, disqualifyPair);
router.post("/tournaments/:id/teams/:teamId/disqualify", requireAuth, disqualifyTeam);

export default router;
