import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { ClubProfile } from "../entities/ClubProfile";
import { Tournament } from "../entities/Tournament";
import { Pair } from "../entities/Pair";
import { TournamentMatch } from "../entities/TournamentMatch";
import { Court } from "../entities/Court";
import { Booking } from "../entities/Booking";
import { Between, In } from "typeorm";

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

export const getPublicCourts = async (req: Request, res: Response) => {
  const { username } = req.params;
  const { from, to } = req.query as { from?: string; to?: string };
  try {
    const user = await resolveUser(username);
    if (!user) return res.status(404).json({ error: "Club no encontrado" });

    const courts = await AppDataSource.getRepository(Court).find({
      where: { userId: user.id },
      order: { name: "ASC" },
    });

    if (!courts.length) return res.json({ courts: [], bookings: [] });

    const courtIds = courts.map(c => c.id!);
    let bookings: Array<{ courtId: number; startTime: string; endTime: string }> = [];

    if (from && to) {
      const raw = await AppDataSource.getRepository(Booking).find({
        where: {
          court: { id: In(courtIds) },
          startTime: Between(new Date(from), new Date(to)),
          status: "CONFIRMED",
        },
        relations: { court: true },
      });
      bookings = raw.map(b => ({
        courtId: b.court.id!,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
      }));
    }

    res.json({
      courts: courts.map(c => ({ id: c.id, name: c.name, type: c.type, status: c.status })),
      bookings,
    });
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
