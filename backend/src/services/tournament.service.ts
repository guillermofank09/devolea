import { Repository } from "typeorm";
import { Tournament, TournamentFormat } from "../entities/Tournament";
import { Pair } from "../entities/Pair";
import { TournamentMatch } from "../entities/TournamentMatch";

export class TournamentService {
  constructor(
    private tRepo: Repository<Tournament>,
    private pRepo: Repository<Pair>,
    private mRepo: Repository<TournamentMatch>
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
    });
    return { ...tournament, pairs, matches };
  }

  async update(id: number, dto: Partial<Tournament>): Promise<Tournament | null> {
    await this.tRepo.update(id, dto);
    return await this.tRepo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.tRepo.delete(id);
  }

  async addPair(tournamentId: number, player1Id: number, player2Id: number): Promise<Pair> {
    // Check no matches exist yet
    const matchCount = await this.mRepo.count({ where: { tournament: { id: tournamentId } } });
    if (matchCount > 0) throw new Error("No se pueden agregar parejas después de generar los cruces");

    // Check players not already in a pair in this tournament
    const existingPairs = await this.pRepo.find({ where: { tournament: { id: tournamentId } } });
    const usedPlayerIds = existingPairs.flatMap(p => [p.player1.id, p.player2.id]);
    if (usedPlayerIds.includes(player1Id) || usedPlayerIds.includes(player2Id)) {
      throw new Error("Uno o ambos jugadores ya están en otra pareja del torneo");
    }
    if (player1Id === player2Id) throw new Error("Los jugadores de una pareja deben ser distintos");

    return await this.pRepo.save(
      this.pRepo.create({
        tournament: { id: tournamentId } as any,
        player1: { id: player1Id } as any,
        player2: { id: player2Id } as any,
      })
    );
  }

  async removePair(pairId: number): Promise<void> {
    const pair = await this.pRepo.findOne({ where: { id: pairId }, relations: ["tournament"] });
    if (!pair) throw new Error("Pareja no encontrada");
    const matchCount = await this.mRepo.count({ where: { tournament: { id: pair.tournament.id } } });
    if (matchCount > 0) throw new Error("No se puede eliminar una pareja después de generar los cruces");
    await this.pRepo.delete(pairId);
  }

  async generateMatches(tournamentId: number, startTime: Date, courtId?: number | null, matchDuration = 90): Promise<TournamentMatch[]> {
    const matchCount = await this.mRepo.count({ where: { tournament: { id: tournamentId } } });
    if (matchCount > 0) throw new Error("Los cruces ya fueron generados");

    const pairs = await this.pRepo.find({ where: { tournament: { id: tournamentId } } });
    if (pairs.length < 2) throw new Error("Se necesitan al menos 2 parejas para generar cruces");

    const format: TournamentFormat = pairs.length <= 4 ? "ROUND_ROBIN" : "BRACKET";
    await this.tRepo.update(tournamentId, { format, status: "ACTIVE" });

    const court = courtId ? { id: courtId } as any : null;
    const toCreate: Partial<TournamentMatch>[] = [];
    const t = { id: tournamentId };
    let time = new Date(startTime);
    const addDuration = () => { time = new Date(time.getTime() + matchDuration * 60 * 1000); };

    if (format === "ROUND_ROBIN") {
      let matchNum = 1;
      for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
          toCreate.push({ tournament: t as any, pair1: pairs[i], pair2: pairs[j], court, scheduledAt: new Date(time), round: 1, matchNumber: matchNum++, status: "PENDING" });
          addDuration();
        }
      }
    } else {
      // Bracket - shuffle and generate round 1
      const shuffled = [...pairs].sort(() => Math.random() - 0.5);
      let matchNum = 1;
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          toCreate.push({ tournament: t as any, pair1: shuffled[i], pair2: shuffled[i + 1], court, scheduledAt: new Date(time), round: 1, matchNumber: matchNum++, status: "PENDING" });
          addDuration();
        } else {
          // Bye
          toCreate.push({ tournament: t as any, pair1: shuffled[i], pair2: null, court: null, scheduledAt: null, round: 1, matchNumber: matchNum++, status: "BYE", winnerId: shuffled[i].id });
        }
      }
    }

    return await this.mRepo.save(toCreate.map(m => this.mRepo.create(m)));
  }

  async nextRound(tournamentId: number, startTime: Date, matchDuration = 90): Promise<TournamentMatch[]> {
    const matches = await this.mRepo.find({
      where: { tournament: { id: tournamentId } },
      order: { round: "DESC", matchNumber: "ASC" },
    });
    if (!matches.length) throw new Error("No hay cruces generados");

    const maxRound = matches[0].round;
    const currentRoundMatches = matches.filter(m => m.round === maxRound);
    const incomplete = currentRoundMatches.filter(m => m.status === "PENDING");
    if (incomplete.length > 0) throw new Error("Hay partidos pendientes en la ronda actual");

    const winners = currentRoundMatches
      .filter(m => m.status !== "PENDING")
      .map(m => (m.status === "BYE" ? m.pair1 : (m.winnerId === m.pair1?.id ? m.pair1 : m.pair2)))
      .filter(Boolean) as Pair[];

    if (winners.length < 2) throw new Error("No hay suficientes ganadores para generar la siguiente ronda");

    let time = new Date(startTime);
    const addDuration = () => { time = new Date(time.getTime() + matchDuration * 60 * 1000); };
    const toCreate: Partial<TournamentMatch>[] = [];
    let matchNum = 1;

    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        toCreate.push({ tournament: { id: tournamentId } as any, pair1: winners[i], pair2: winners[i + 1], scheduledAt: new Date(time), round: maxRound + 1, matchNumber: matchNum++, status: "PENDING" });
        addDuration();
      } else {
        toCreate.push({ tournament: { id: tournamentId } as any, pair1: winners[i], pair2: null, scheduledAt: null, round: maxRound + 1, matchNumber: matchNum++, status: "BYE", winnerId: winners[i].id });
      }
    }

    return await this.mRepo.save(toCreate.map(m => this.mRepo.create(m)));
  }

  async updateMatch(matchId: number, dto: { scheduledAt?: string; pair1Id?: number | null; pair2Id?: number | null; winnerId?: number | null; result?: string; status?: string; courtId?: number | null }): Promise<TournamentMatch | null> {
    const update: any = {};
    if (dto.scheduledAt !== undefined) update.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (dto.pair1Id !== undefined) update.pair1 = dto.pair1Id ? { id: dto.pair1Id } : null;
    if (dto.pair2Id !== undefined) update.pair2 = dto.pair2Id ? { id: dto.pair2Id } : null;
    if (dto.winnerId !== undefined) update.winnerId = dto.winnerId;
    if (dto.result !== undefined) update.result = dto.result;
    if (dto.status !== undefined) update.status = dto.status;
    if (dto.courtId !== undefined) update.court = dto.courtId ? { id: dto.courtId } : null;
    await this.mRepo.save({ id: matchId, ...update });
    return await this.mRepo.findOneBy({ id: matchId });
  }
}
