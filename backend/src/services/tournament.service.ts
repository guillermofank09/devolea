import { Between, Not, IsNull, Repository } from "typeorm";
import { Tournament, TournamentFormat } from "../entities/Tournament";
import { Pair } from "../entities/Pair";
import { TournamentMatch } from "../entities/TournamentMatch";
import { TournamentTeam } from "../entities/TournamentTeam";
import { Booking } from "../entities/Booking";

function isTeamSport(sport?: string | null): boolean {
  if (!sport) return false;
  return sport.startsWith("FUTBOL") || sport === "VOLEY" || sport === "BASQUET";
}

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
    private ttRepo: Repository<TournamentTeam>,
  ) {}

  async create(dto: { name: string; category: string; sex?: string; startDate: string; endDate: string; sport?: string }, userId: number): Promise<Tournament> {
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
    const teams = await this.ttRepo.find({ where: { tournament: { id } } });
    const matches = await this.mRepo.find({
      where: { tournament: { id } },
      order: { round: "ASC", matchNumber: "ASC" },
      relations: { court: true },
    });
    return { ...tournament, pairs: pairs.map(deserializePair), teams, matches };
  }

  async addTeam(tournamentId: number, equipoId: number): Promise<TournamentTeam> {
    const matchCount = await this.mRepo.count({ where: { tournament: { id: tournamentId } } });
    if (matchCount > 0) throw new Error("No se pueden agregar equipos después de generar los cruces");
    const existing = await this.ttRepo.find({ where: { tournament: { id: tournamentId } } });
    if (existing.some(t => t.equipo.id === equipoId)) {
      throw new Error("Este equipo ya está en el torneo");
    }
    return await this.ttRepo.save(
      this.ttRepo.create({
        tournament: { id: tournamentId } as any,
        equipo: { id: equipoId } as any,
      })
    );
  }

  async removeTeam(teamId: number): Promise<void> {
    const team = await this.ttRepo.findOne({ where: { id: teamId }, relations: ["tournament"] });
    if (!team) throw new Error("Equipo no encontrado");
    // Free any matches that referenced this team
    const affected = await this.mRepo.find({ where: [{ team1: { id: teamId } }, { team2: { id: teamId } }] });
    if (affected.length > 0) {
      for (const m of affected) {
        if (m.winnerId === teamId) m.winnerId = null;
        (m as any).status = "PENDING";
        m.result = null;
      }
      await this.mRepo.save(affected);
    }
    await this.ttRepo.delete(teamId);
  }

  async update(id: number, dto: Partial<Tournament>): Promise<Tournament | null> {
    await this.tRepo.update(id, dto);
    return await this.tRepo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.tRepo.delete(id);
  }

  async addPair(tournamentId: number, player1Id: number, player2Id: number | null, opts?: {
    player1InscriptionPaid?: boolean;
    player2InscriptionPaid?: boolean;
    preferredStartTimes?: string[] | null;
  }): Promise<Pair> {
    const matchCount = await this.mRepo.count({ where: { tournament: { id: tournamentId } } });
    if (matchCount > 0) throw new Error("No se pueden agregar parejas después de generar los cruces");

    const existingPairs = await this.pRepo.find({ where: { tournament: { id: tournamentId } } });
    const usedPlayerIds = existingPairs.flatMap(p => [p.player1.id, p.player2?.id].filter(Boolean));
    if (usedPlayerIds.includes(player1Id)) throw new Error("Este jugador ya está en el torneo");
    if (player2Id != null) {
      if (usedPlayerIds.includes(player2Id)) throw new Error("Este jugador ya está en el torneo");
      if (player1Id === player2Id) throw new Error("Los jugadores de una pareja deben ser distintos");
    }

    const saved = await this.pRepo.save(
      this.pRepo.create({
        tournament: { id: tournamentId } as any,
        player1: { id: player1Id } as any,
        player2: player2Id != null ? { id: player2Id } as any : null,
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
      const newP2Id = dto.player2Id ?? pair.player2?.id ?? null;
      if (newP2Id != null && newP1Id === newP2Id) throw new Error("Los jugadores de una pareja deben ser distintos");
      const existing = await this.pRepo.find({ where: { tournament: { id: pair.tournament.id } } });
      const usedIds = existing.filter(p => p.id !== pairId).flatMap(p => [p.player1.id, p.player2?.id].filter(Boolean));
      if (usedIds.includes(newP1Id) || (newP2Id != null && usedIds.includes(newP2Id))) {
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
    // Free any matches that referenced this pair
    const affected = await this.mRepo.find({ where: [{ pair1: { id: pairId } }, { pair2: { id: pairId } }] });
    if (affected.length > 0) {
      for (const m of affected) {
        if (m.winnerId === pairId) m.winnerId = null;
        (m as any).status = "PENDING";
        m.result = null;
      }
      await this.mRepo.save(affected);
    }
    await this.pRepo.delete(pairId);
  }

  async disqualifyPair(pairId: number): Promise<Pair> {
    const pair = await this.pRepo.findOne({ where: { id: pairId } });
    if (!pair) throw new Error("Pareja no encontrada");
    pair.disqualified = !pair.disqualified;
    await this.pRepo.save(pair);
    const affected = await this.mRepo.find({ where: [{ pair1: { id: pairId } }, { pair2: { id: pairId } }] });
    if (affected.length > 0) {
      for (const m of affected) {
        if (pair.disqualified) {
          (m as any).status = "FORFEIT";
          const opponentId = m.pair1?.id === pairId ? m.pair2?.id : m.pair1?.id;
          m.winnerId = opponentId ?? null;
        } else {
          (m as any).status = "PENDING";
          m.winnerId = null;
          m.result = null;
        }
      }
      await this.mRepo.save(affected);
    }
    return deserializePair(pair);
  }

  async disqualifyTeam(teamId: number): Promise<TournamentTeam> {
    const team = await this.ttRepo.findOne({ where: { id: teamId } });
    if (!team) throw new Error("Equipo no encontrado");
    team.disqualified = !team.disqualified;
    await this.ttRepo.save(team);
    const affected = await this.mRepo.find({ where: [{ team1: { id: teamId } }, { team2: { id: teamId } }] });
    if (affected.length > 0) {
      for (const m of affected) {
        if (team.disqualified) {
          (m as any).status = "FORFEIT";
          const opponentId = m.team1?.id === teamId ? m.team2?.id : m.team1?.id;
          m.winnerId = opponentId ?? null;
        } else {
          (m as any).status = "PENDING";
          m.winnerId = null;
          m.result = null;
        }
      }
      await this.mRepo.save(affected);
    }
    return team;
  }

  async resetMatches(tournamentId: number): Promise<void> {
    await this.mRepo.delete({ tournament: { id: tournamentId } });
    await this.tRepo.update(tournamentId, { format: null as any, status: "DRAFT" });
  }

  async deleteMatch(matchId: number): Promise<void> {
    await this.mRepo.delete(matchId);
  }

  private async generateMatchesTeamMode(tournamentId: number, startTime: Date | null, courtIds: number[], matchDuration: number, formatOverride?: string): Promise<TournamentMatch[]> {
    const teams = await this.ttRepo.find({ where: { tournament: { id: tournamentId } } });
    if (teams.length < 2) throw new Error("Se necesitan al menos 2 equipos para generar cruces");

    const format: TournamentFormat = formatOverride === "ROUND_ROBIN" || formatOverride === "BRACKET"
      ? formatOverride
      : teams.length <= 4 ? "ROUND_ROBIN" : "BRACKET";
    await this.tRepo.update(tournamentId, { format, status: "ACTIVE" });

    const effectiveCourts = startTime ? courtIds : [];
    const courtBookingsMap = new Map<number, Array<{ startTime: Date; endTime: Date }>>();
    if (startTime) {
      const dayStart = new Date(startTime); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(startTime); dayEnd.setHours(23, 59, 59, 999);
      for (const cId of effectiveCourts) {
        const bookings = await this.bRepo.find({
          where: { court: { id: cId }, startTime: Between(dayStart, dayEnd), status: "CONFIRMED" },
          order: { startTime: "ASC" },
        });
        courtBookingsMap.set(cId, bookings.map(b => ({ startTime: b.startTime, endTime: b.endTime })));
      }
    }

    const nextFreeAt = new Map<number, number>();
    if (startTime) for (const cId of effectiveCourts) nextFreeAt.set(cId, startTime.getTime());

    const advancePastBookings = (cId: number, tMs: number): number => {
      const bookings = courtBookingsMap.get(cId) ?? [];
      let t = tMs; let changed = true;
      while (changed) {
        changed = false;
        const tEnd = t + matchDuration * 60 * 1000;
        for (const b of bookings) {
          if (b.startTime.getTime() < tEnd && b.endTime.getTime() > t) { t = b.endTime.getTime(); changed = true; break; }
        }
      }
      return t;
    };

    let cursor = startTime ? startTime.getTime() : 0;
    const getNextSlot = (): { court: any; scheduledAt: Date } | null => {
      if (effectiveCourts.length === 0) return null;
      let bestCId = effectiveCourts[0];
      let bestMs = advancePastBookings(bestCId, nextFreeAt.get(bestCId)!);
      for (const cId of effectiveCourts.slice(1)) {
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
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const slot = getNextSlot();
          const scheduledAt = slot ? slot.scheduledAt : startTime ? new Date(cursor) : null;
          if (!slot && startTime) cursor += matchDuration * 60 * 1000;
          toCreate.push({ tournament: t as any, team1: teams[i] as any, team2: teams[j] as any, court: slot?.court ?? null, scheduledAt, round: 1, matchNumber: matchNum++, status: "PENDING" });
        }
      }
    } else {
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      let matchNum = 1;
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          const slot = getNextSlot();
          const scheduledAt = slot ? slot.scheduledAt : startTime ? new Date(cursor) : null;
          if (!slot && startTime) cursor += matchDuration * 60 * 1000;
          toCreate.push({ tournament: t as any, team1: shuffled[i] as any, team2: shuffled[i + 1] as any, court: slot?.court ?? null, scheduledAt, round: 1, matchNumber: matchNum++, status: "PENDING" });
        } else {
          toCreate.push({ tournament: t as any, team1: shuffled[i] as any, team2: null, court: null, scheduledAt: null, round: 1, matchNumber: matchNum++, status: "BYE", winnerId: shuffled[i].id });
        }
      }
    }

    const savedR1 = await this.mRepo.save(toCreate.map(m => this.mRepo.create(m)));

    if (format === "BRACKET") {
      const r1Real = savedR1.filter(m => m.status !== "BYE");
      const r1ByeCount = savedR1.length - r1Real.length;
      const r2CrossCount = Math.floor(r1Real.length / 2) * 2;
      const r2ByeCount = (r1Real.length % 2) + r1ByeCount;
      const r2Total = r2CrossCount + r2ByeCount;

      if (r2Total > 0) {
        await this.mRepo.save(Array.from({ length: r2Total }, (_, i) =>
          this.mRepo.create({ tournament: t as any, round: 2, matchNumber: i + 1, status: "PENDING" })
        ));
      }

      const placeholders: Partial<TournamentMatch>[] = [];
      let roundMatchCount = r2Total; let roundNum = 3;
      while (roundMatchCount > 1) {
        roundMatchCount = Math.ceil(roundMatchCount / 2);
        for (let i = 0; i < roundMatchCount; i++) {
          placeholders.push({ tournament: t as any, round: roundNum, matchNumber: i + 1, status: "PENDING" });
        }
        roundNum++;
      }
      if (placeholders.length > 0) await this.mRepo.save(placeholders.map(m => this.mRepo.create(m)));
    }

    return savedR1;
  }

  async generateMatches(tournamentId: number, startTime: Date | null, courtIds: number[] = [], matchDuration = 90, formatOverride?: string): Promise<TournamentMatch[]> {
    const matchCount = await this.mRepo.count({ where: { tournament: { id: tournamentId } } });
    if (matchCount > 0) throw new Error("Los cruces ya fueron generados");

    const tournament = await this.tRepo.findOneBy({ id: tournamentId });
    const isTeamMode = isTeamSport(tournament?.sport);

    if (isTeamMode) {
      return await this.generateMatchesTeamMode(tournamentId, startTime, courtIds, matchDuration, formatOverride);
    }

    const pairs = await this.pRepo.find({ where: { tournament: { id: tournamentId } } });
    if (pairs.length < 2) throw new Error("Se necesitan al menos 2 parejas para generar cruces");

    const format: TournamentFormat = formatOverride === "ROUND_ROBIN" || formatOverride === "BRACKET"
      ? formatOverride
      : pairs.length <= 4 ? "ROUND_ROBIN" : "BRACKET";
    await this.tRepo.update(tournamentId, { format, status: "ACTIVE" });

    const effectiveCourts = startTime ? courtIds : [];
    const courtBookingsMap = new Map<number, Array<{ startTime: Date; endTime: Date }>>();
    if (startTime) {
      const dayStart = new Date(startTime); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(startTime); dayEnd.setHours(23, 59, 59, 999);
      for (const cId of effectiveCourts) {
        const bookings = await this.bRepo.find({
          where: { court: { id: cId }, startTime: Between(dayStart, dayEnd), status: "CONFIRMED" },
          order: { startTime: "ASC" },
        });
        courtBookingsMap.set(cId, bookings.map(b => ({ startTime: b.startTime, endTime: b.endTime })));
      }
    }

    const nextFreeAt = new Map<number, number>();
    if (startTime) for (const cId of effectiveCourts) nextFreeAt.set(cId, startTime.getTime());

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
      if (effectiveCourts.length === 0) return null;
      let bestCId = effectiveCourts[0];
      let bestMs = advancePastBookings(bestCId, nextFreeAt.get(bestCId)!);
      for (const cId of effectiveCourts.slice(1)) {
        const ms = advancePastBookings(cId, nextFreeAt.get(cId)!);
        if (ms < bestMs) { bestCId = cId; bestMs = ms; }
      }
      nextFreeAt.set(bestCId, bestMs + matchDuration * 60 * 1000);
      return { court: { id: bestCId } as any, scheduledAt: new Date(bestMs) };
    };

    const getPrefMs = (pair: Pair | null): number[] => {
      if (!pair?.preferredStartTimes) return [];
      try {
        return (JSON.parse(pair.preferredStartTimes) as string[])
          .map(s => new Date(s).getTime()).filter(n => !isNaN(n));
      } catch { return []; }
    };

    const pairPrefsMap = new Map<number, number[]>();
    for (const p of pairs) pairPrefsMap.set(p.id, getPrefMs(p));

    // --- Determine all matchups ---
    // BRACKET: seed pairs with shared preferred times against each other so Pass 1
    // (both-prefer) covers the maximum number of first-round matches.
    interface MatchupEntry { pair1: Pair; pair2: Pair | null; isBye: boolean; }
    const matchupList: MatchupEntry[] = [];

    const sharedPrefsCount = (a: Pair, b: Pair): number => {
      const pa = pairPrefsMap.get(a.id) ?? [];
      const pb = pairPrefsMap.get(b.id) ?? [];
      return pa.filter(ta => pb.some(tb => Math.abs(ta - tb) < 60_000)).length;
    };

    if (format === "ROUND_ROBIN") {
      for (let i = 0; i < pairs.length; i++)
        for (let j = i + 1; j < pairs.length; j++)
          matchupList.push({ pair1: pairs[i], pair2: pairs[j], isBye: false });
    } else {
      // Greedy preference-aware seeding: highest-overlap pairs face each other first
      const combos: { shared: number; i: number; j: number }[] = [];
      for (let i = 0; i < pairs.length; i++)
        for (let j = i + 1; j < pairs.length; j++)
          combos.push({ shared: sharedPrefsCount(pairs[i], pairs[j]), i, j });
      combos.sort((a, b) => b.shared - a.shared);

      const used = new Set<number>();
      const seeded: Pair[] = [];
      for (const { i, j } of combos) {
        if (used.has(i) || used.has(j)) continue;
        seeded.push(pairs[i], pairs[j]);
        used.add(i); used.add(j);
      }
      // Remaining pairs (no shared prefs) shuffled randomly
      pairs.filter((_, i) => !used.has(i)).sort(() => Math.random() - 0.5).forEach(p => seeded.push(p));

      for (let i = 0; i < seeded.length; i += 2) {
        if (i + 1 < seeded.length)
          matchupList.push({ pair1: seeded[i], pair2: seeded[i + 1], isBye: false });
        else
          matchupList.push({ pair1: seeded[i], pair2: null, isBye: true });
      }
    }

    // --- Court-time grid scheduling (4 sequential passes) ---
    // Pass 1: both pairs prefer this slot.
    // Pass 2: one pair prefers + opponent has NO preferences (flexible).
    // Pass 3: one pair prefers + opponent prefers a different slot (conflict).
    // Pass 4: greedy fill with any remaining matchup.
    // nextFreeAt carries between passes — courts never double-booked.
    const scheduledSlots = new Map<number, { court: any; scheduledAt: Date } | null>();
    const scheduled = new Set<number>();

    if (effectiveCourts.length > 0 && startTime) {
      const prefersSlot = (pair: Pair | null, tMs: number) =>
        (pairPrefsMap.get(pair?.id ?? -1) ?? []).some(t => Math.abs(t - tMs) < 60_000);
      const hasAnyPref = (pair: Pair | null) =>
        (pairPrefsMap.get(pair?.id ?? -1) ?? []).length > 0;

      const nonByeCount = matchupList.filter(m => !m.isBye).length;
      const baseMs = startTime.getTime();
      const upperBound = baseMs + (nonByeCount + 2) * matchDuration * 60_000;

      const opportunities: { cId: number; tMs: number }[] = [];
      for (const cId of effectiveCourts) {
        let t = baseMs;
        while (t <= upperBound) {
          const adj = advancePastBookings(cId, t);
          if (adj <= upperBound) opportunities.push({ cId, tMs: adj });
          t = adj + matchDuration * 60_000;
        }
      }
      opportunities.sort((a, b) =>
        a.tMs !== b.tMs ? a.tMs - b.tMs : effectiveCourts.indexOf(a.cId) - effectiveCourts.indexOf(b.cId)
      );

      const getUnscheduled = () => matchupList
        .map((m, i) => ({ m, i }))
        .filter(({ m, i }) => !m.isBye && !scheduled.has(i) && m.pair2 != null);

      const assign = (pick: { i: number }, cId: number, tMs: number) => {
        nextFreeAt.set(cId, tMs + matchDuration * 60_000);
        scheduledSlots.set(pick.i, { court: { id: cId } as any, scheduledAt: new Date(tMs) });
        scheduled.add(pick.i);
      };

      // Pass 1 — both pairs prefer this exact slot
      for (const { cId, tMs } of opportunities) {
        if (scheduled.size >= nonByeCount) break;
        if ((nextFreeAt.get(cId) ?? 0) > tMs) continue;
        const eligible = getUnscheduled().filter(({ m }) =>
          prefersSlot(m.pair1, tMs) && prefersSlot(m.pair2, tMs));
        if (eligible.length === 0) continue;
        assign(eligible[Math.floor(Math.random() * eligible.length)], cId, tMs);
      }

      // Pass 2 — one prefers this slot + opponent has NO preferences (flexible partner)
      for (const { cId, tMs } of opportunities) {
        if (scheduled.size >= nonByeCount) break;
        if ((nextFreeAt.get(cId) ?? 0) > tMs) continue;
        const eligible = getUnscheduled().filter(({ m }) =>
          (prefersSlot(m.pair1, tMs) && !hasAnyPref(m.pair2)) ||
          (prefersSlot(m.pair2, tMs) && !hasAnyPref(m.pair1)));
        if (eligible.length === 0) continue;
        assign(eligible[Math.floor(Math.random() * eligible.length)], cId, tMs);
      }

      // Pass 3 — one prefers this slot (opponent prefers a different slot)
      for (const { cId, tMs } of opportunities) {
        if (scheduled.size >= nonByeCount) break;
        if ((nextFreeAt.get(cId) ?? 0) > tMs) continue;
        const eligible = getUnscheduled().filter(({ m }) =>
          prefersSlot(m.pair1, tMs) || prefersSlot(m.pair2, tMs));
        if (eligible.length === 0) continue;
        assign(eligible[Math.floor(Math.random() * eligible.length)], cId, tMs);
      }

      // Pass 4 — greedy: any remaining matchup fills the next available slot
      for (const { cId, tMs } of opportunities) {
        if (scheduled.size >= nonByeCount) break;
        if ((nextFreeAt.get(cId) ?? 0) > tMs) continue;
        const eligible = getUnscheduled();
        if (eligible.length === 0) break;
        assign(eligible[Math.floor(Math.random() * eligible.length)], cId, tMs);
      }
    }

    // Final greedy fallback for any matchup not placed (e.g. no courts were selected)
    for (let i = 0; i < matchupList.length; i++) {
      if (!matchupList[i].isBye && !scheduledSlots.has(i))
        scheduledSlots.set(i, getNextSlot());
    }

    const t = { id: tournamentId };
    const toCreate: Partial<TournamentMatch>[] = matchupList.map((m, i) => {
      if (m.isBye) return { tournament: t as any, pair1: m.pair1, pair2: null, court: null, scheduledAt: null, round: 1, matchNumber: i + 1, status: "BYE", winnerId: m.pair1.id };
      const slot = scheduledSlots.get(i) ?? null;
      return { tournament: t as any, pair1: m.pair1, pair2: m.pair2 as Pair, court: slot?.court ?? null, scheduledAt: slot?.scheduledAt ?? null, round: 1, matchNumber: i + 1, status: "PENDING" };
    });

    const savedR1 = await this.mRepo.save(toCreate.map(m => this.mRepo.create(m)));

    // For bracket: pre-create placeholder matches for all future rounds
    if (format === "BRACKET") {
      const r1Real = savedR1.filter(m => m.status !== "BYE");
      const r1ByeCount = savedR1.length - r1Real.length;

      // Round 2: cross matches (winner of A vs loser of B, winner of B vs loser of A)
      // for each consecutive pair of R1 matches, plus BYEs for unpaired groups and R1 BYE pairs.
      const r2CrossCount = Math.floor(r1Real.length / 2) * 2;
      const r2ByeCount = (r1Real.length % 2) + r1ByeCount;
      const r2Total = r2CrossCount + r2ByeCount;

      if (r2Total > 0) {
        const r2Placeholders = Array.from({ length: r2Total }, (_, i) =>
          this.mRepo.create({
            tournament: t as any, pair1: null, pair2: null, court: null,
            scheduledAt: null, round: 2, matchNumber: i + 1, status: "PENDING",
          })
        );
        await this.mRepo.save(r2Placeholders);
      }

      // Rounds 3, 4, … : standard halving from r2Total
      const placeholders: Partial<TournamentMatch>[] = [];
      let roundMatchCount = r2Total;
      let roundNum = 3;
      while (roundMatchCount > 1) {
        roundMatchCount = Math.ceil(roundMatchCount / 2);
        for (let i = 0; i < roundMatchCount; i++) {
          placeholders.push({
            tournament: t as any, pair1: null, pair2: null, court: null,
            scheduledAt: null, round: roundNum, matchNumber: i + 1, status: "PENDING",
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

    // Current active round: highest round that has at least one assigned pair or team
    const activeMatches = allMatches.filter(m =>
      m.pair1 !== null || m.pair2 !== null || m.team1 !== null || m.team2 !== null
    );
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

    // ── R1 → R2: cross-group logic (new bracket format, no repechage in R1) ──────
    const tournament = await this.tRepo.findOneBy({ id: tournamentId });
    const isTeamMode = isTeamSport(tournament?.sport);
    const isNewBracket = tournament?.format === "BRACKET"
      && maxRound === 1
      && !currentRoundMatches.some(m => m.isRepechage);

    if (isNewBracket) {
      const r1Regular = currentRoundMatches.filter(m => m.status !== "BYE");
      const r1Byes   = currentRoundMatches.filter(m => m.status === "BYE");

      const nextRoundNum = maxRound + 1;
      const nextRoundMatches = allMatches
        .filter(m => m.round === nextRoundNum)
        .sort((a, b) => a.matchNumber - b.matchNumber);

      if (!nextRoundMatches.length) throw new Error("No se encontraron partidos para la siguiente ronda");

      let time = new Date(startTime);
      const addDuration = () => { time = new Date(time.getTime() + matchDuration * 60 * 1000); };

      let r2Idx = 0;

      // Paired R1 groups: winner of A vs loser of B, winner of B vs loser of A
      for (let i = 0; i + 1 < r1Regular.length; i += 2) {
        const mA = r1Regular[i];
        const mB = r1Regular[i + 1];

        const c1 = nextRoundMatches[r2Idx++];
        const c2 = nextRoundMatches[r2Idx++];

        if (isTeamMode) {
          const wAId = mA.team1?.id === mA.winnerId ? mA.team1?.id : mA.team2?.id;
          const lAId = mA.team1?.id === mA.winnerId ? mA.team2?.id : mA.team1?.id;
          const wBId = mB.team1?.id === mB.winnerId ? mB.team1?.id : mB.team2?.id;
          const lBId = mB.team1?.id === mB.winnerId ? mB.team2?.id : mB.team1?.id;
          if (c1 && wAId != null && lBId != null) {
            c1.team1 = { id: wAId } as any; c1.team2 = { id: lBId } as any; c1.status = "PENDING";
            if (!c1.scheduledAt) { c1.scheduledAt = new Date(time); addDuration(); }
          }
          if (c2 && wBId != null && lAId != null) {
            c2.team1 = { id: wBId } as any; c2.team2 = { id: lAId } as any; c2.status = "PENDING";
            if (!c2.scheduledAt) { c2.scheduledAt = new Date(time); addDuration(); }
          }
        } else {
          const wA = mA.winnerId === mA.pair1?.id ? mA.pair1 : mA.pair2;
          const lA = mA.winnerId === mA.pair1?.id ? mA.pair2 : mA.pair1;
          const wB = mB.winnerId === mB.pair1?.id ? mB.pair1 : mB.pair2;
          const lB = mB.winnerId === mB.pair1?.id ? mB.pair2 : mB.pair1;
          if (c1 && wA && lB) {
            c1.pair1 = wA; c1.pair2 = lB; c1.status = "PENDING";
            if (!c1.scheduledAt) { c1.scheduledAt = new Date(time); addDuration(); }
          }
          if (c2 && wB && lA) {
            c2.pair1 = wB; c2.pair2 = lA; c2.status = "PENDING";
            if (!c2.scheduledAt) { c2.scheduledAt = new Date(time); addDuration(); }
          }
        }
      }

      // Unpaired R1 match (odd count): winner advances directly as BYE in R2
      if (r1Regular.length % 2 === 1) {
        const last = r1Regular[r1Regular.length - 1];
        const byeSlot = nextRoundMatches[r2Idx++];
        if (isTeamMode) {
          const winnerTeamId = last.team1?.id === last.winnerId ? last.team1?.id : last.team2?.id;
          if (byeSlot && winnerTeamId != null) {
            byeSlot.team1 = { id: winnerTeamId } as any; byeSlot.team2 = null;
            byeSlot.status = "BYE"; byeSlot.winnerId = winnerTeamId; byeSlot.scheduledAt = null;
          }
        } else {
          const winner = last.winnerId === last.pair1?.id ? last.pair1 : last.pair2;
          if (byeSlot && winner) {
            byeSlot.pair1 = winner; byeSlot.pair2 = null as any;
            byeSlot.status = "BYE"; byeSlot.winnerId = winner.id; byeSlot.scheduledAt = null;
          }
        }
      }

      // R1 BYE entries advance as BYE in R2
      for (const r1Bye of r1Byes) {
        const byeSlot = nextRoundMatches[r2Idx++];
        if (isTeamMode) {
          if (byeSlot && r1Bye.team1) {
            byeSlot.team1 = r1Bye.team1; byeSlot.team2 = null;
            byeSlot.status = "BYE"; byeSlot.winnerId = r1Bye.team1.id; byeSlot.scheduledAt = null;
          }
        } else {
          if (byeSlot && r1Bye.pair1) {
            byeSlot.pair1 = r1Bye.pair1; byeSlot.pair2 = null as any;
            byeSlot.status = "BYE"; byeSlot.winnerId = r1Bye.pair1.id; byeSlot.scheduledAt = null;
          }
        }
      }

      return await this.mRepo.save(nextRoundMatches.slice(0, r2Idx));
    }
    // ── End cross-group logic ────────────────────────────────────────────────────

    // Team mode: simple winner propagation (no repechage for teams)
    if (isTeamMode) {
      const teamWinners = currentRoundMatches
        .filter(m => !m.isRepechage)
        .map(m => {
          if (m.status === "BYE") return m.team1?.id ?? null;
          return m.team1?.id === m.winnerId ? m.team1?.id : m.team2?.id;
        })
        .filter((id): id is number => id != null);

      if (teamWinners.length < 2) throw new Error("No hay suficientes ganadores para generar la siguiente ronda");

      const nextRoundNum = maxRound + 1;
      const nextRoundMatches = allMatches
        .filter(m => m.round === nextRoundNum)
        .sort((a, b) => a.matchNumber - b.matchNumber);
      if (!nextRoundMatches.length) throw new Error("No se encontraron partidos para la siguiente ronda");

      let time = new Date(startTime);
      const addDuration = () => { time = new Date(time.getTime() + matchDuration * 60 * 1000); };

      for (let i = 0; i < teamWinners.length; i += 2) {
        const match = nextRoundMatches[Math.floor(i / 2)];
        if (i + 1 < teamWinners.length) {
          match.team1 = { id: teamWinners[i] } as any;
          match.team2 = { id: teamWinners[i + 1] } as any;
          match.status = "PENDING";
          if (!match.scheduledAt) { match.scheduledAt = new Date(time); addDuration(); }
        } else {
          match.team1 = { id: teamWinners[i] } as any;
          match.team2 = null;
          match.status = "BYE";
          match.winnerId = teamWinners[i];
          match.scheduledAt = null;
        }
      }
      return await this.mRepo.save(nextRoundMatches);
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
    return await this.mRepo.find({
      where: { court: { id: courtId }, scheduledAt: Not(IsNull()) },
      relations: {
        tournament: true,
        pair1: { player1: true, player2: true },
        pair2: { player1: true, player2: true },
        court: true,
      },
      order: { scheduledAt: "ASC" },
    });
  }

  async updateMatch(matchId: number, dto: { scheduledAt?: string; pair1Id?: number | null; pair2Id?: number | null; team1Id?: number | null; team2Id?: number | null; winnerId?: number | null; result?: string; goals?: { playerName: string; teamId: number; minute: number }[] | null; status?: string; courtId?: number | null; liveStatus?: string | null; delayedUntil?: string | null }): Promise<TournamentMatch | null> {
    // Load the full entity including pair/team relations so propagation has the IDs
    const match = await this.mRepo.findOne({ where: { id: matchId }, relations: { court: true, tournament: true, pair1: true, pair2: true } });
    if (!match) return null;

    if (dto.scheduledAt !== undefined) match.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (dto.pair1Id !== undefined) match.pair1 = dto.pair1Id != null ? { id: dto.pair1Id } as any : null;
    if (dto.pair2Id !== undefined) match.pair2 = dto.pair2Id != null ? { id: dto.pair2Id } as any : null;
    if (dto.team1Id !== undefined) match.team1 = dto.team1Id != null ? { id: dto.team1Id } as any : null;
    if (dto.team2Id !== undefined) match.team2 = dto.team2Id != null ? { id: dto.team2Id } as any : null;
    if (dto.winnerId !== undefined) match.winnerId = dto.winnerId ?? null;
    if (dto.result !== undefined) match.result = dto.result ?? null;
    if (dto.goals !== undefined) match.goals = dto.goals ?? null;
    if (dto.status !== undefined) match.status = dto.status as any;
    if (dto.courtId !== undefined) match.court = dto.courtId != null ? { id: dto.courtId } as any : null;
    if (dto.liveStatus !== undefined) match.liveStatus = (dto.liveStatus ?? null) as any;
    if (dto.delayedUntil !== undefined) match.delayedUntil = dto.delayedUntil ? new Date(dto.delayedUntil) : null;

    await this.mRepo.save(match);

    // Immediately propagate the winner into the next-round placeholder
    if (dto.winnerId != null && match.tournament?.id) {
      this.propagateWinnerToNextRound(match).catch(() => {});
    }

    // Auto-complete PERSONALIZADO tournament when no pending matches remain
    if (match.tournament?.id) {
      this.checkAndCompletePersonalizado(match.tournament.id).catch(() => {});
    }

    // Reload after save to get full relations (especially court)
    return await this.mRepo.findOne({ where: { id: matchId }, relations: { court: true } });
  }

  private async propagateWinnerToNextRound(completedMatch: TournamentMatch): Promise<void> {
    if (!completedMatch.winnerId || !completedMatch.tournament?.id) return;

    const tournament = await this.tRepo.findOneBy({ id: completedMatch.tournament.id });
    if (!tournament || tournament.format !== "BRACKET") return;

    const currentRound = completedMatch.round;
    const nextRoundNum = currentRound + 1;

    // eager: true on pair1/pair2 means find() auto-loads them
    const allMatches = await this.mRepo.find({
      where: { tournament: { id: completedMatch.tournament.id } },
      order: { round: "ASC", matchNumber: "ASC" },
    });

    const currentRoundMatches = allMatches.filter(m => m.round === currentRound);
    const nextRoundMatches = allMatches
      .filter(m => m.round === nextRoundNum)
      .sort((a, b) => a.matchNumber - b.matchNumber);

    if (!nextRoundMatches.length) return; // final round, nothing to propagate

    // Skip old-style brackets that used repechage matches
    if (currentRoundMatches.some(m => m.isRepechage)) return;

    const isTeamMode = isTeamSport(tournament.sport);
    const winnerId = completedMatch.winnerId;
    const toSave: TournamentMatch[] = [];

    if (isTeamMode) {
      const winnerTeamId = completedMatch.team1?.id === winnerId ? completedMatch.team1?.id : completedMatch.team2?.id;
      const loserTeamId = completedMatch.team1?.id === winnerId ? completedMatch.team2?.id : completedMatch.team1?.id;
      if (winnerTeamId == null) return;

      if (currentRound === 1) {
        const r1Regular = currentRoundMatches
          .filter(m => m.status !== "BYE")
          .sort((a, b) => a.matchNumber - b.matchNumber);
        const realIndex = r1Regular.findIndex(m => m.id === completedMatch.id);
        if (realIndex === -1) return;

        if (realIndex < nextRoundMatches.length) {
          const winnerSlot = nextRoundMatches[realIndex];
          winnerSlot.team1 = { id: winnerTeamId } as any;
          toSave.push(winnerSlot);
        }
        if (loserTeamId != null) {
          const crossIndex = realIndex % 2 === 0 ? realIndex + 1 : realIndex - 1;
          if (crossIndex >= 0 && crossIndex < nextRoundMatches.length) {
            const loserSlot = nextRoundMatches[crossIndex];
            loserSlot.team2 = { id: loserTeamId } as any;
            if (!toSave.some(s => s.id === loserSlot.id)) toSave.push(loserSlot);
          }
        }
      } else {
        const matchIndex = completedMatch.matchNumber - 1;
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isSecond = matchIndex % 2 === 1;
        const nextMatch = nextRoundMatches[nextMatchIndex];
        if (!nextMatch) return;
        if (!isSecond) nextMatch.team1 = { id: winnerTeamId } as any;
        else nextMatch.team2 = { id: winnerTeamId } as any;
        toSave.push(nextMatch);
      }
      if (toSave.length) await this.mRepo.save(toSave);
      return;
    }

    const winnerPair = completedMatch.pair1?.id === winnerId ? completedMatch.pair1 : completedMatch.pair2;
    const loserPair  = completedMatch.pair1?.id === winnerId ? completedMatch.pair2  : completedMatch.pair1;
    if (!winnerPair) return;

    if (currentRound === 1) {
      // Cross-phase R1 → R2:
      //   real index i (0-based among non-BYE R1 matches)
      //   winner → R2[i].pair1   loser → R2[cross].pair2  (cross = i^1)
      const r1Regular = currentRoundMatches
        .filter(m => m.status !== "BYE")
        .sort((a, b) => a.matchNumber - b.matchNumber);
      const realIndex = r1Regular.findIndex(m => m.id === completedMatch.id);
      if (realIndex === -1) return;

      if (realIndex < nextRoundMatches.length) {
        const winnerSlot = nextRoundMatches[realIndex];
        winnerSlot.pair1 = winnerPair as any;
        toSave.push(winnerSlot);
      }

      if (loserPair) {
        const crossIndex = realIndex % 2 === 0 ? realIndex + 1 : realIndex - 1;
        if (crossIndex >= 0 && crossIndex < nextRoundMatches.length) {
          const loserSlot = nextRoundMatches[crossIndex];
          loserSlot.pair2 = loserPair as any;
          if (!toSave.some(s => s.id === loserSlot.id)) toSave.push(loserSlot);
        }
      }
    } else {
      // Standard elimination: matchNumber - 1 gives 0-based index
      const matchIndex = completedMatch.matchNumber - 1;
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const isSecond = matchIndex % 2 === 1;

      const nextMatch = nextRoundMatches[nextMatchIndex];
      if (!nextMatch) return;

      if (!isSecond) {
        nextMatch.pair1 = winnerPair as any;
      } else {
        nextMatch.pair2 = winnerPair as any;
      }
      toSave.push(nextMatch);
    }

    if (toSave.length) await this.mRepo.save(toSave);
  }

  private async checkAndCompletePersonalizado(tournamentId: number): Promise<void> {
    const tournament = await this.tRepo.findOneBy({ id: tournamentId });
    if (!tournament || tournament.format !== "PERSONALIZADO") return;

    const allMatches = await this.mRepo.find({ where: { tournament: { id: tournamentId } } });
    if (allMatches.length === 0) return;

    const maxRound = Math.max(...allMatches.map(m => m.round));
    const lastRound = allMatches.filter(m => m.round === maxRound);
    const isDone = lastRound.every(m => m.status !== "PENDING") && lastRound.some(m => m.winnerId != null);

    const newStatus = isDone ? "COMPLETED" : "ACTIVE";
    if (tournament.status !== newStatus) {
      await this.tRepo.update(tournamentId, { status: newStatus as any });
    }
  }
}
