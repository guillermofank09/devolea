import { Router } from "express";
import { getPublicProfile, getPublicTournaments, getPublicTournamentDetail, getPublicCourts, getPublicProfesores } from "../controllers/public.controller";

const router = Router();

router.get("/public/:username", getPublicProfile);
router.get("/public/:username/courts", getPublicCourts);
router.get("/public/:username/profesores", getPublicProfesores);
router.get("/public/:username/tournaments", getPublicTournaments);
router.get("/public/:username/tournaments/:tournamentId", getPublicTournamentDetail);

export default router;
