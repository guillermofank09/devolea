import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Tournament } from "../entities/Tournament";
import { Pair } from "../entities/Pair";
import { TournamentMatch } from "../entities/TournamentMatch";
import { Booking } from "../entities/Booking";
import { TournamentService } from "../services/tournament.service";

function getService() {
  return new TournamentService(
    AppDataSource.getRepository(Tournament),
    AppDataSource.getRepository(Pair),
    AppDataSource.getRepository(TournamentMatch),
    AppDataSource.getRepository(Booking),
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

export const generateMatches = async (req: Request, res: Response) => {
  const { startTime, courtIds, matchDuration } = req.body;
  if (!startTime) return res.status(400).json({ error: "startTime requerido" });
  try { res.json(await getService().generateMatches(Number(req.params.id), new Date(startTime), Array.isArray(courtIds) ? courtIds.map(Number) : [], matchDuration ?? 90)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const nextRound = async (req: Request, res: Response) => {
  const { startTime, matchDuration } = req.body;
  if (!startTime) return res.status(400).json({ error: "startTime requerido" });
  try { res.json(await getService().nextRound(Number(req.params.id), new Date(startTime), matchDuration ?? 90)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
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
