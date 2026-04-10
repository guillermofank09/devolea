import { Router } from "express";
import { getPublicProfile, getPublicTournaments, getPublicTournamentDetail, getPublicCourts } from "../controllers/public.controller";

const router = Router();

router.get("/public/:username", getPublicProfile);
router.get("/public/:username/courts", getPublicCourts);
router.get("/public/:username/tournaments", getPublicTournaments);
router.get("/public/:username/tournaments/:tournamentId", getPublicTournamentDetail);

export default router;
