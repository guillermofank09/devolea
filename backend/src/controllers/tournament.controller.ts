import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Tournament } from "../entities/Tournament";
import { Pair } from "../entities/Pair";
import { TournamentMatch } from "../entities/TournamentMatch";
import { TournamentTeam } from "../entities/TournamentTeam";
import { Booking } from "../entities/Booking";
import { AppSettings } from "../entities/AppSettings";
import { TournamentService } from "../services/tournament.service";

async function resolveMatchDuration(userId: number, fromBody?: number): Promise<number> {
  if (fromBody != null) return fromBody;
  const settings = await AppDataSource.getRepository(AppSettings).findOneBy({ userId });
  return settings?.tournamentMatchDuration ?? 60;
}

function getService() {
  return new TournamentService(
    AppDataSource.getRepository(Tournament),
    AppDataSource.getRepository(Pair),
    AppDataSource.getRepository(TournamentMatch),
    AppDataSource.getRepository(Booking),
    AppDataSource.getRepository(TournamentTeam),
  );
}

export const createTournament = async (req: Request, res: Response) => {
  const userId = req.authUser!.sub;
  try { res.status(201).json(await getService().create(req.body, userId)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getTournaments = async (req: Request, res: Response) => {
  const userId = req.authUser!.sub;
  try { res.json(await getService().getAll(userId)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getTournamentById = async (req: Request, res: Response) => {
  try {
    const t = await getService().getById(Number(req.params.id));
    if (!t) return res.status(404).json({ error: "No encontrado" });
    res.json(t);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const updateTournament = async (req: Request, res: Response) => {
  try {
    const t = await getService().update(Number(req.params.id), req.body);
    if (!t) return res.status(404).json({ error: "No encontrado" });
    res.json(t);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const deleteTournament = async (req: Request, res: Response) => {
  try { await getService().delete(Number(req.params.id)); res.json({ message: "Eliminado" }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const addPair = async (req: Request, res: Response) => {
  const { player1Id, player2Id, player1InscriptionPaid, player2InscriptionPaid, preferredStartTimes } = req.body;
  try {
    res.status(201).json(await getService().addPair(
      Number(req.params.id), Number(player1Id), Number(player2Id),
      { player1InscriptionPaid, player2InscriptionPaid, preferredStartTimes },
    ));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const removePair = async (req: Request, res: Response) => {
  try { await getService().removePair(Number(req.params.pairId)); res.json({ message: "Pareja eliminada" }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const updatePair = async (req: Request, res: Response) => {
  try { res.json(await getService().updatePair(Number(req.params.pairId), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const resetMatches = async (req: Request, res: Response) => {
  try { await getService().resetMatches(Number(req.params.id)); res.json({ message: "Cruces eliminados" }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const generateMatches = async (req: Request, res: Response) => {
  const { startTime, courtIds, matchDuration, format } = req.body;
  if (!startTime) return res.status(400).json({ error: "startTime requerido" });
  try {
    const duration = await resolveMatchDuration(req.authUser!.sub, matchDuration);
    res.json(await getService().generateMatches(Number(req.params.id), new Date(startTime), Array.isArray(courtIds) ? courtIds.map(Number) : [], duration, format));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const nextRound = async (req: Request, res: Response) => {
  const { startTime, matchDuration } = req.body;
  if (!startTime) return res.status(400).json({ error: "startTime requerido" });
  try {
    const duration = await resolveMatchDuration(req.authUser!.sub, matchDuration);
    res.json(await getService().nextRound(Number(req.params.id), new Date(startTime), duration));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const createPlaceholderMatch = async (req: Request, res: Response) => {
  try {
    const { round, matchNumber } = req.body ?? {};
    if (!round || !matchNumber) return res.status(400).json({ error: "round y matchNumber requeridos" });
    res.status(201).json(await getService().createPlaceholderMatch(Number(req.params.id), Number(round), Number(matchNumber)));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const getMatchesByCourt = async (req: Request, res: Response) => {
  try { res.json(await getService().getMatchesByCourt(Number(req.params.courtId))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const updateMatch = async (req: Request, res: Response) => {
  try {
    const m = await getService().updateMatch(Number(req.params.matchId), req.body);
    if (!m) return res.status(404).json({ error: "Partido no encontrado" });
    res.json(m);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const triggerRepechage = async (req: Request, res: Response) => {
  try { res.json(await getService().triggerRepechage(Number(req.params.id))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const addTeam = async (req: Request, res: Response) => {
  const { equipoId } = req.body;
  try {
    res.status(201).json(await getService().addTeam(Number(req.params.id), Number(equipoId)));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const removeTeam = async (req: Request, res: Response) => {
  try { await getService().removeTeam(Number(req.params.teamId)); res.json({ message: "Equipo eliminado" }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
};
