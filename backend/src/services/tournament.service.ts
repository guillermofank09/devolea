import { Between, Repository } from "typeorm";
import { Tournament, TournamentFormat } from "../entities/Tournament";
import { Pair } from "../entities/Pair";
import { TournamentMatch } from "../entities/TournamentMatch";
import { Booking } from "../entities/Booking";

function deserializePair(pair: Pair): any {
  return {
    ...pair,
    preferredStartTimes: pair.preferredStartTimes ? JSON.parse(pair.preferredStartTimes) : [],
  };
}

export class TournamentService {
  constructor(
    private tRepo: Repository<Tournament>,
    private pRepo: Repository<Pair>,
    private mRepo: Repository<TournamentMatch>,
    private bRepo: Repository<Booking>,
  ) {}

  async create(dto: { name: string; category: string; startDate: string; endDate: string }, userId: number): Promise<Tournament> {
    const entity = this.tRepo.create({ ...dto, userId } as any) as unknown as Tournament;
    return await this.tRepo.save(entity);
  }

  async getAll(userId: number): Promise<Tournament[]> {
    return await this.tRepo.find({ where: { userId }, order: { createdAt: "DESC" } });
  }

  async getById(id: number) {
    const tournament = await this.tRepo.findOneBy({ id });
    if (!tournament) return null;
    const pairs = await this.pRepo.find({ where: { tournament: { id } } });
    const matches = await this.mRepo.find({
      where: { tournament: { id } },
      order: { round: "ASC", matchNumber: "ASC" },
      relations: { court: true },
    });
    return { ...tournament, pairs: pairs.map(deserializePair), matches };
  }

  async update(id: number, dto: Partial<Tournament>): Promise<Tournament | null> {
    await this.tRepo.update(id, dto);
    return await this.tRepo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.tRepo.delete(id);
  }

  async addPair(tournamentId: number, player1Id: number, player2Id: number, opts?: {
    player1InscriptionPaid?: boolean;
    player2InscriptionPaid?: boolean;
    preferredStartTimes?: string[] | null;
  }): Promise<Pair> {
    const matchCount = await this.mRepo.count({ where: { tournament: { id: tournamentId } } });
    if (matchCount > 0) throw new Error("No se pueden agregar parejas después de generar los cruces");

    const existingPairs = await this.pRepo.find({ where: { tournament: { id: tournamentId } } });
    const usedPlayerIds = existingPairs.flatMap(p => [p.player1.id, p.player2.id]);
    if (usedPlayerIds.includes(player1Id) || usedPlayerIds.includes(player2Id)) {
      throw new Error("Uno o ambos jugadores ya están en otra pareja del torneo");
    }
    if (player1Id === player2Id) throw new Error("Los jugadores de una pareja deben ser distintos");

    const saved = await this.pRepo.save(
      this.pRepo.create({
        tournament: { id: tournamentId } as any,
        player1: { id: player1Id } as any,
        player2: { id: player2Id } as any,
        player1InscriptionPaid: opts?.player1InscriptionPaid ?? false,
        player2InscriptionPaid: opts?.player2InscriptionPaid ?? false,
        preferredStartTimes: opts?.preferredStartTimes?.length ? JSON.stringify(opts.preferredStartTimes) : null,
      })
    );
    return deserializePair(saved);
  }

  async updatePair(pairId: number, dto: {
    player1Id?: number;
    player2Id?: number;
    player1InscriptionPaid?: boolean;
    player2InscriptionPaid?: boolean;
    preferredStartTimes?: string[] | null;
  }): Promise<Pair> {
    const pair = await this.pRepo.findOne({ where: { id: pairId }, relations: ["tournament"] });
    if (!pair) throw new Error("Pareja no encontrada");

    if (dto.player1Id !== undefined || dto.player2Id !== undefined) {
      const matchCount = await this.mRepo.count({ where: { tournament: { id: pair.tournament.id } } });
      if (matchCount > 0) throw new Error("No se pueden modificar jugadores después de generar los cruces");
      const newP1Id = dto.player1Id ?? pair.player1.id;
      const newP2Id = dto.player2Id ?? pair.player2.id;
      if (newP1Id === newP2Id) throw new Error("Los jugadores de una pareja deben ser distintos");
      const existing = await this.pRepo.find({ where: { tournament: { id: pair.tournament.id } } });
      const usedIds = existing.filter(p => p.id !== pairId).flatMap(p => [p.player1.id, p.player2.id]);
      if (usedIds.includes(newP1Id) || usedIds.includes(newP2Id)) {
        throw new Error("Uno o ambos jugadores ya están en otra pareja del torneo");
      }
      if (dto.player1Id !== undefined) (pair as any).player1 = { id: dto.player1Id };
      if (dto.player2Id !== undefined) (pair as any).player2 = { id: dto.player2Id };
    }

    if (dto.player1InscriptionPaid !== undefined) pair.player1InscriptionPaid = dto.player1InscriptionPaid;
    if (dto.player2InscriptionPaid !== undefined) pair.player2InscriptionPaid = dto.player2InscriptionPaid;
    if ("preferredStartTimes" in dto) {
      pair.preferredStartTimes = dto.preferredStartTimes?.length ? JSON.stringify(dto.preferredStartTimes) : null;
    }

    return deserializePair(await this.pRepo.save(pair));
  }

  async removePair(pairId: number): Promise<void> {
    const pair = await this.pRepo.findOne({ where: { id: pairId }, relations: ["tournament"] });
    if (!pair) throw new Error("Pareja no encontrada");
    const matchCount = await this.mRepo.count({ where: { tournament: { id: pair.tournament.id } } });
    if (matchCount > 0) throw new Error("No se puede eliminar una pareja después de generar los cruces");
    await this.pRepo.delete(pairId);
  }

  async generateMatches(tournamentId: number, startTime: Date, courtIds: number[] = [], matchDuration = 90): Promise<TournamentMatch[]> {
    const matchCount = await this.mRepo.count({ where: { tournament: { id: tournamentId } } });
    if (matchCount > 0) throw new Error("Los cruces ya fueron generados");

    const pairs = await this.pRepo.find({ where: { tournament: { id: tournamentId } } });
    if (pairs.length < 2) throw new Error("Se necesitan al menos 2 parejas para generar cruces");

    const format: TournamentFormat = pairs.length <= 4 ? "ROUND_ROBIN" : "BRACKET";
    await this.tRepo.update(tournamentId, { format, status: "ACTIVE" });

    // Load bookings for each court on the tournament day for greedy scheduling
    const dayStart = new Date(startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startTime);
    dayEnd.setHours(23, 59, 59, 999);

    const courtBookingsMap = new Map<number, Array<{ startTime: Date; endTime: Date }>>();
    for (const cId of courtIds) {
      const bookings = await this.bRepo.find({
        where: { court: { id: cId }, startTime: Between(dayStart, dayEnd), status: "CONFIRMED" },
        order: { startTime: "ASC" },
      });
      courtBookingsMap.set(cId, bookings.map(b => ({ startTime: b.startTime, endTime: b.endTime })));
    }

    // Greedy scheduler: track next free time (ms) per court
    const nextFreeAt = new Map<number, number>();
    for (const cId of courtIds) nextFreeAt.set(cId, startTime.getTime());

    const advancePastBookings = (cId: number, tMs: number): number => {
      const bookings = courtBookingsMap.get(cId) ?? [];
      let t = tMs;
      let changed = true;
      while (changed) {
        changed = false;
        const tEnd = t + matchDuration * 60 * 1000;
        for (const b of bookings) {
          const bStart = b.startTime.getTime();
          const bEnd = b.endTime.getTime();
          if (bStart < tEnd && bEnd > t) { t = bEnd; changed = true; break; }
        }
      }
      return t;
    };

    const getNextSlot = (): { court: any; scheduledAt: Date } | null => {
      if (courtIds.length === 0) return null;
      let bestCId = courtIds[0];
      let bestMs = advancePastBookings(bestCId, nextFreeAt.get(bestCId)!);
      for (const cId of courtIds.slice(1)) {
        const ms = advancePastBookings(cId, nextFreeAt.get(cId)!);
        if (ms < bestMs) { bestCId = cId; bestMs = ms; }
      }
      nextFreeAt.set(bestCId, bestMs + matchDuration * 60 * 1000);
      return { court: { id: bestCId } as any, scheduledAt: new Date(bestMs) };
    };

    const toCreate: Partial<TournamentMatch>[] = [];
    const t = { id: tournamentId };

    if (format === "ROUND_ROBIN") {
      let matchNum = 1;
      for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
          const slot = getNextSlot();
          toCreate.push({ tournament: t as any, pair1: pairs[i], pair2: pairs[j], court: slot?.court ?? null, scheduledAt: slot?.scheduledAt ?? new Date(startTime), round: 1, matchNumber: matchNum++, status: "PENDING" });
          if (!slot) startTime = new Date(startTime.getTime() + matchDuration * 60 * 1000);
        }
      }
    } else {
      // Bracket - shuffle and generate round 1
      const shuffled = [...pairs].sort(() => Math.random() - 0.5);
      let matchNum = 1;
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          const slot = getNextSlot();
          toCreate.push({ tournament: t as any, pair1: shuffled[i], pair2: shuffled[i + 1], court: slot?.court ?? null, scheduledAt: slot?.scheduledAt ?? new Date(startTime), round: 1, matchNumber: matchNum++, status: "PENDING" });
          if (!slot) startTime = new Date(startTime.getTime() + matchDuration * 60 * 1000);
        } else {
          // Bye
          toCreate.push({ tournament: t as any, pair1: shuffled[i], pair2: null, court: null, scheduledAt: null, round: 1, matchNumber: matchNum++, status: "BYE", winnerId: shuffled[i].id });
        }
      }
    }

    const savedR1 = await this.mRepo.save(toCreate.map(m => this.mRepo.create(m)));

    // For bracket: pre-create placeholder matches for all future rounds
    if (format === "BRACKET") {
      // Repechage: each BYE team must face the best loser before advancing
      const byeMatches = savedR1.filter(m => m.status === "BYE");
      if (byeMatches.length > 0) {
        let repNum = savedR1.length + 1;
        const repToCreate: Partial<TournamentMatch>[] = byeMatches.map(bm => ({
          tournament: t as any,
          pair1: bm.pair1,
          pair2: null,
          court: null,
          scheduledAt: null,
          round: 1,
          matchNumber: repNum++,
          status: "PENDING",
          isRepechage: true,
        }));
        await this.mRepo.save(repToCreate.map(m => this.mRepo.create(m)));
      }

      // Pre-create placeholder matches for rounds 2, 3, …
      const placeholders: Partial<TournamentMatch>[] = [];
      let roundMatchCount = savedR1.length;
      let roundNum = 2;
      while (roundMatchCount > 1) {
        roundMatchCount = Math.ceil(roundMatchCount / 2);
        for (let i = 0; i < roundMatchCount; i++) {
          placeholders.push({
            tournament: t as any,
            pair1: null,
            pair2: null,
            court: null,
            scheduledAt: null,
            round: roundNum,
            matchNumber: i + 1,
            status: "PENDING",
          });
        }
        roundNum++;
      }
      if (placeholders.length > 0) {
        await this.mRepo.save(placeholders.map(m => this.mRepo.create(m)));
      }
    }

    return savedR1;
  }

  async nextRound(tournamentId: number, startTime: Date, matchDuration = 90): Promise<TournamentMatch[]> {
    const allMatches = await this.mRepo.find({
      where: { tournament: { id: tournamentId } },
      order: { round: "ASC", matchNumber: "ASC" },
    });
    if (!allMatches.length) throw new Error("No hay cruces generados");

    // Current active round: highest round that has at least one assigned pair
    const activeMatches = allMatches.filter(m => m.pair1 !== null || m.pair2 !== null);
    if (!activeMatches.length) throw new Error("No hay cruces generados");

    const maxRound = Math.max(...activeMatches.map(m => m.round));
    const currentRoundMatches = activeMatches
      .filter(m => m.round === maxRound)
      .sort((a, b) => a.matchNumber - b.matchNumber);

    const incomplete = currentRoundMatches.filter(m => m.status === "PENDING");
    if (incomplete.length > 0) {
      const hasRepechage = currentRoundMatches.some(m => m.isRepechage && m.status === "PENDING");
      throw new Error(hasRepechage
        ? "Hay partidos de repechaje pendientes de jugar"
        : "Hay partidos pendientes en la ronda actual");
    }

    // Build repechage winner map: byeTeamId → repechage match
    const repechajeByByeTeam = new Map<number, TournamentMatch>();
    currentRoundMatches
      .filter(m => m.isRepechage)
      .forEach(m => { if (m.pair1?.id != null) repechajeByByeTeam.set(m.pair1.id, m); });

    // Winners: for BYE matches that have a repechage, use the repechage winner
    const winners = currentRoundMatches
      .filter(m => !m.isRepechage)
      .map(m => {
        if (m.status === "BYE") {
          const rep = m.pair1?.id != null ? repechajeByByeTeam.get(m.pair1.id) : undefined;
          if (rep) return rep.pair1?.id === rep.winnerId ? rep.pair1 : rep.pair2;
          return m.pair1;
        }
        return m.winnerId === m.pair1?.id ? m.pair1 : m.pair2;
      })
      .filter(Boolean) as Pair[];

    if (winners.length < 2) throw new Error("No hay suficientes ganadores para generar la siguiente ronda");

    // Update the pre-created placeholder matches for the next round
    const nextRoundNum = maxRound + 1;
    const nextRoundMatches = allMatches
      .filter(m => m.round === nextRoundNum)
      .sort((a, b) => a.matchNumber - b.matchNumber);

    if (!nextRoundMatches.length) throw new Error("No se encontraron partidos para la siguiente ronda");

    let time = new Date(startTime);
    const addDuration = () => { time = new Date(time.getTime() + matchDuration * 60 * 1000); };

    for (let i = 0; i < winners.length; i += 2) {
      const match = nextRoundMatches[Math.floor(i / 2)];
      if (i + 1 < winners.length) {
        match.pair1 = winners[i];
        match.pair2 = winners[i + 1];
        match.status = "PENDING";
        // Preserve pre-configured scheduledAt; otherwise assign from startTime
        if (!match.scheduledAt) {
          match.scheduledAt = new Date(time);
          addDuration();
        }
      } else {
        match.pair1 = winners[i];
        match.pair2 = null as any;
        match.status = "BYE";
        match.winnerId = winners[i].id;
        match.scheduledAt = null;
      }
    }

    return await this.mRepo.save(nextRoundMatches);
  }

  async triggerRepechage(tournamentId: number): Promise<TournamentMatch[]> {
    const allMatches = await this.mRepo.find({
      where: { tournament: { id: tournamentId } },
      order: { round: "ASC", matchNumber: "ASC" },
    });

    const round1Regular = allMatches.filter(m => m.round === 1 && !m.isRepechage);
    const pending = round1Regular.filter(m => m.status === "PENDING");
    if (pending.length > 0) throw new Error("Hay partidos de la primera ronda aún pendientes");

    const unassigned = allMatches.filter(m => m.isRepechage && m.pair2 == null);
    if (unassigned.length === 0) throw new Error("No hay partidos de repechaje pendientes de configurar");

    // Collect losers from completed round-1 regular matches
    const losers: { pair: Pair; setsWon: number; gamesWon: number }[] = [];
    for (const m of round1Regular) {
      if (m.status !== "COMPLETED" || !m.winnerId) continue;
      const loser = m.pair1?.id === m.winnerId ? m.pair2 : m.pair1;
      if (!loser) continue;
      losers.push({ pair: loser, ...this.parseLoserScore(m.result, m.winnerId, m.pair1, m.pair2) });
    }
    losers.sort((a, b) => b.setsWon - a.setsWon || b.gamesWon - a.gamesWon);

    if (losers.length === 0) throw new Error("No hay resultados registrados para determinar el mejor perdedor");

    for (let i = 0; i < unassigned.length && i < losers.length; i++) {
      await this.mRepo.update(unassigned[i].id, { pair2Id: losers[i].pair.id } as any);
    }

    return await this.mRepo.find({
      where: { tournament: { id: tournamentId } },
      order: { round: "ASC", matchNumber: "ASC" },
    }).then(ms => ms.filter(m => m.isRepechage));
  }

  private parseLoserScore(
    result: string | null | undefined,
    winnerId: number | null | undefined,
    pair1?: Pair | null,
    pair2?: Pair | null,
  ): { setsWon: number; gamesWon: number } {
    if (!pair1 || !pair2 || !winnerId) return { setsWon: 0, gamesWon: 0 };
    // If pair1 won, loser is pair2 → loser scores are the second numbers
    const loserIsP2 = pair1.id === winnerId;
    const sets = (result ?? "").trim().split(/\s+/).filter(Boolean);
    let setsWon = 0, gamesWon = 0;
    for (const s of sets) {
      const [r1, r2] = s.split("-");
      const s1 = parseInt(r1, 10), s2 = parseInt(r2, 10);
      if (isNaN(s1) || isNaN(s2)) continue;
      const loserScore = loserIsP2 ? s2 : s1;
      const winnerScore = loserIsP2 ? s1 : s2;
      if (loserScore > winnerScore) setsWon++;
      gamesWon += loserScore;
    }
    return { setsWon, gamesWon };
  }

  async createPlaceholderMatch(tournamentId: number, round: number, matchNumber: number): Promise<TournamentMatch> {
    // Use query builder to reliably filter by the FK column directly
    const existing = await this.mRepo
      .createQueryBuilder("m")
      .where("m.tournamentId = :tournamentId AND m.round = :round AND m.matchNumber = :matchNumber", { tournamentId, round, matchNumber })
      .getOne();
    if (existing) return existing;
    return await this.mRepo.save(
      this.mRepo.create({
        tournament: { id: tournamentId } as any,
        pair1: null, pair2: null, court: null,
        scheduledAt: null, round, matchNumber, status: "PENDING",
      })
    );
  }

  async getMatchesByCourt(courtId: number): Promise<TournamentMatch[]> {
    return await this.mRepo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.tournament", "tournament")
      .leftJoinAndSelect("m.pair1", "pair1")
      .leftJoinAndSelect("pair1.player1", "p1a")
      .leftJoinAndSelect("pair1.player2", "p1b")
      .leftJoinAndSelect("m.pair2", "pair2")
      .leftJoinAndSelect("pair2.player1", "p2a")
      .leftJoinAndSelect("pair2.player2", "p2b")
      .leftJoinAndSelect("m.court", "court")
      .where("m.courtId = :courtId AND m.scheduledAt IS NOT NULL", { courtId })
      .orderBy("m.scheduledAt", "ASC")
      .getMany();
  }

  async updateMatch(matchId: number, dto: { scheduledAt?: string; pair1Id?: number | null; pair2Id?: number | null; winnerId?: number | null; result?: string; status?: string; courtId?: number | null; liveStatus?: string | null; delayedUntil?: string | null }): Promise<TournamentMatch | null> {
    // Load the full entity first so save() never zeros out unrelated columns (round, matchNumber, etc.)
    const match = await this.mRepo.findOne({ where: { id: matchId }, relations: { court: true, tournament: true } });
    if (!match) return null;

    if (dto.scheduledAt !== undefined) match.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (dto.pair1Id !== undefined) match.pair1 = dto.pair1Id != null ? { id: dto.pair1Id } as any : null;
    if (dto.pair2Id !== undefined) match.pair2 = dto.pair2Id != null ? { id: dto.pair2Id } as any : null;
    if (dto.winnerId !== undefined) match.winnerId = dto.winnerId ?? null;
    if (dto.result !== undefined) match.result = dto.result ?? null;
    if (dto.status !== undefined) match.status = dto.status as any;
    if (dto.courtId !== undefined) match.court = dto.courtId != null ? { id: dto.courtId } as any : null;
    if (dto.liveStatus !== undefined) match.liveStatus = (dto.liveStatus ?? null) as any;
    if (dto.delayedUntil !== undefined) match.delayedUntil = dto.delayedUntil ? new Date(dto.delayedUntil) : null;

    await this.mRepo.save(match);

    // Auto-advance bracket to the next round when the current round is fully completed
    if (dto.status === "COMPLETED" && match.tournament?.id) {
      this.autoAdvanceIfReady(match.tournament.id).catch(() => {});
    }

    // Reload after save to get full relations (especially court)
    return await this.mRepo.findOne({ where: { id: matchId }, relations: { court: true } });
  }

  private async autoAdvanceIfReady(tournamentId: number): Promise<void> {
    const tournament = await this.tRepo.findOneBy({ id: tournamentId });
    if (!tournament || tournament.format !== "BRACKET") return;

    const allMatches = await this.mRepo.find({
      where: { tournament: { id: tournamentId } },
      order: { round: "ASC", matchNumber: "ASC" },
    });

    // Current active round: highest round that has at least one assigned pair
    const activeMatches = allMatches.filter(m => m.pair1 !== null || m.pair2 !== null);
    if (!activeMatches.length) return;

    const maxRound = Math.max(...activeMatches.map(m => m.round));
    const currentRoundMatches = activeMatches.filter(m => m.round === maxRound);

    // All matches in the current round (including repechage) must be finished
    const allDone = currentRoundMatches.every(m => m.status !== "PENDING");
    if (!allDone) return;

    // There must be a next round with placeholder matches ready to receive winners
    const nextRoundMatches = allMatches.filter(m => m.round === maxRound + 1);
    if (!nextRoundMatches.length) return;

    // Use the first pre-scheduled time from the next round as the fallback startTime,
    // so unscheduled slots get a sensible default. nextRound() preserves scheduledAt
    // on matches that already have one set.
    const refTime = nextRoundMatches.find(m => m.scheduledAt)?.scheduledAt ?? new Date();

    await this.nextRound(tournamentId, refTime);
  }
}
