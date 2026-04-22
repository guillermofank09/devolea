import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { ClubProfile } from "../entities/ClubProfile";
import { Tournament } from "../entities/Tournament";
import { Pair } from "../entities/Pair";
import { TournamentMatch } from "../entities/TournamentMatch";
import { Court } from "../entities/Court";
import { Booking } from "../entities/Booking";
import { Profesor } from "../entities/Profesor";
import { AppSettings } from "../entities/AppSettings";
import { Between, In, ILike, MoreThanOrEqual } from "typeorm";

const PAGE_SIZE = 10;

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

    const settings = await AppDataSource.getRepository(AppSettings).findOneBy({ userId: user.id });

    let businessHours: unknown[] = [];
    try { businessHours = JSON.parse(profile.businessHoursJson || "[]"); } catch {}

    const courts = await AppDataSource.getRepository(Court).find({
      where: { userId: user.id },
      select: ["name", "sport"],
    });

    // Group court names by sport
    const courtsBySport: Record<string, string[]> = {};
    for (const c of courts) {
      const sport = c.sport ?? "OTRO";
      if (!courtsBySport[sport]) courtsBySport[sport] = [];
      if (c.name) courtsBySport[sport].push(c.name);
    }

    res.json({
      clubName: profile.clubName,
      address: profile.address,
      latitude: profile.latitude,
      longitude: profile.longitude,
      logoUrl: profile.logoUrl || null,
      logoBase64: profile.logoUrl ? null : profile.logoBase64, // omit heavy base64 when URL exists
      phone: profile.phone ?? null,
      businessHours,
      courtsBySport,
      showTournaments: settings?.showTournaments ?? true,
      showCourts:      settings?.showCourts      ?? true,
      showProfesores:  settings?.showProfesores   ?? true,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPublicTournaments = async (req: Request, res: Response) => {
  const { username } = req.params;
  const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
  const search = ((req.query.search as string) ?? "").trim();
  const sport  = (req.query.sport  as string) ?? "";

  try {
    const user = await resolveUser(username);
    if (!user) return res.status(404).json({ error: "Club no encontrado" });

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const tenDaysAgoStr = tenDaysAgo.toISOString().split("T")[0];

    const base = AppDataSource.getRepository(Tournament)
      .createQueryBuilder("t")
      .where("t.userId = :userId", { userId: user.id })
      .andWhere(`(t.status IN ('ACTIVE','DRAFT') OR (t.status = 'COMPLETED' AND t."endDate" >= :tenDaysAgo))`, { tenDaysAgo: tenDaysAgoStr })
      .andWhere(qb => `EXISTS ${qb.subQuery().select("1").from(TournamentMatch, "m").where("m.tournamentId = t.id").getQuery()}`)
      .orderBy("t.startDate", "ASC");

    if (search) base.andWhere("LOWER(t.name) LIKE :search", { search: `%${search.toLowerCase()}%` });
    if (sport)  base.andWhere("t.sport = :sport", { sport });

    // Collect available sports across ALL visible tournaments (before sport filter)
    const allSportsQb = AppDataSource.getRepository(Tournament)
      .createQueryBuilder("t")
      .select("DISTINCT t.sport", "sport")
      .where("t.userId = :userId", { userId: user.id })
      .andWhere(`(t.status IN ('ACTIVE','DRAFT') OR (t.status = 'COMPLETED' AND t."endDate" >= :tenDaysAgo))`, { tenDaysAgo: tenDaysAgoStr })
      .andWhere(qb => `EXISTS ${qb.subQuery().select("1").from(TournamentMatch, "m").where("m.tournamentId = t.id").getQuery()}`);
    if (search) allSportsQb.andWhere("LOWER(t.name) LIKE :search", { search: `%${search.toLowerCase()}%` });
    const sportsRaw = await allSportsQb.getRawMany();
    const availableSports = sportsRaw.map(r => r.sport).filter(Boolean) as string[];

    const total = await base.getCount();
    const data  = await base.skip((page - 1) * PAGE_SIZE).take(PAGE_SIZE).getMany();

    res.json({ data, total, page, totalPages: Math.ceil(total / PAGE_SIZE), availableSports });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPublicCourts = async (req: Request, res: Response) => {
  const { username } = req.params;
  const { from, to } = req.query as { from?: string; to?: string };
  const page  = Math.max(1, parseInt(req.query.page as string) || 1);
  const sport = (req.query.sport as string) ?? "";

  try {
    const user = await resolveUser(username);
    if (!user) return res.status(404).json({ error: "Club no encontrado" });

    // Available sports across all courts (before sport filter)
    const allCourts = await AppDataSource.getRepository(Court).find({ where: { userId: user.id }, select: ["sport"] });
    const availableSports = [...new Set(allCourts.map(c => c.sport).filter(Boolean))] as string[];

    const where: any = { userId: user.id };
    if (sport) where.sport = sport;

    const [courts, total] = await AppDataSource.getRepository(Court).findAndCount({
      where,
      order: { name: "ASC" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    });

    if (!courts.length) return res.json({ courts: [], bookings: [], total, totalPages: Math.ceil(total / PAGE_SIZE), availableSports });

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
      courts: courts.map(c => ({ id: c.id, name: c.name, type: c.type, status: c.status, sport: c.sport ?? null })),
      bookings,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      availableSports,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPublicProfesores = async (req: Request, res: Response) => {
  const { username } = req.params;
  const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
  const search = ((req.query.search as string) ?? "").trim();

  try {
    const user = await resolveUser(username);
    if (!user) return res.status(404).json({ error: "Club no encontrado" });

    const where: any = { userId: user.id };
    if (search) where.name = ILike(`%${search}%`);

    const [profesores, total] = await AppDataSource.getRepository(Profesor).findAndCount({
      where,
      order: { name: "ASC" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    });

    res.json({
      data: profesores.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone ?? null,
        sex: p.sex ?? null,
        avatarUrl: p.avatarUrl ?? null,
        sport: p.sport ?? null,
        schedule: p.schedule ?? null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
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
    if (!tournament || !["ACTIVE", "DRAFT", "COMPLETED"].includes(tournament.status)) {
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
