import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { ClubProfile } from "../entities/ClubProfile";
import { Tournament } from "../entities/Tournament";
import { Pair } from "../entities/Pair";
import { TournamentMatch } from "../entities/TournamentMatch";
import { In } from "typeorm";

async function resolveUser(username: string): Promise<User | null> {
  return AppDataSource.getRepository(User).findOneBy({ username });
}

export const getPublicProfile = async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    const user = await resolveUser(username);
    if (!user) return res.status(404).json({ error: "Club no encontrado" });

    const profile = await AppDataSource.getRepository(ClubProfile).findOneBy({ userId: user.id });
    if (!profile) return res.status(404).json({ error: "Club no encontrado" });

    let businessHours: unknown[] = [];
    try { businessHours = JSON.parse(profile.businessHoursJson || "[]"); } catch {}

    res.json({
      clubName: profile.clubName,
      address: profile.address,
      latitude: profile.latitude,
      longitude: profile.longitude,
      logoBase64: profile.logoBase64,
      businessHours,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPublicTournaments = async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    const user = await resolveUser(username);
    if (!user) return res.status(404).json({ error: "Club no encontrado" });

    const tournaments = await AppDataSource.getRepository(Tournament).find({
      where: [
        { userId: user.id, status: "ACTIVE" },
        { userId: user.id, status: "DRAFT" },
      ],
      order: { startDate: "ASC" },
    });

    res.json(tournaments);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPublicTournamentDetail = async (req: Request, res: Response) => {
  const { username, tournamentId } = req.params;
  try {
    const user = await resolveUser(username);
    if (!user) return res.status(404).json({ error: "Club no encontrado" });

    const tournament = await AppDataSource.getRepository(Tournament).findOneBy({
      id: Number(tournamentId),
      userId: user.id,
    });
    if (!tournament || (tournament.status !== "ACTIVE" && tournament.status !== "DRAFT")) {
      return res.status(404).json({ error: "Torneo no encontrado" });
    }

    const pairs = await AppDataSource.getRepository(Pair).find({
      where: { tournament: { id: tournament.id } },
    });
    const matches = await AppDataSource.getRepository(TournamentMatch).find({
      where: { tournament: { id: tournament.id } },
      order: { round: "ASC", matchNumber: "ASC" },
      relations: { court: true },
    });

    res.json({ ...tournament, pairs, matches });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
