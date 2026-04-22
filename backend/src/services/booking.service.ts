import { Repository, Between, Not } from "typeorm";
import { Booking } from "../entities/Booking";

export interface CreateBookingDto {
  courtId: number;
  playerId?: number;
  profesorId?: number;
  startTime: Date;
  endTime: Date;
  isRecurring?: boolean;
  price?: number;
}

function generateGroupId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export class BookingService {
  constructor(private repo: Repository<Booking>) {}

  private async hasOverlap(courtId: number, startTime: Date, endTime: Date): Promise<boolean> {
    const overlap = await this.repo.findOne({
      where: {
        court: { id: courtId },
        status: "CONFIRMED",
        startTime: Between(startTime, endTime),
      },
    });
    return !!overlap;
  }

  async create(dto: CreateBookingDto, userId: number): Promise<Booking | Booking[]> {
    if (!dto.isRecurring) {
      if (await this.hasOverlap(dto.courtId, dto.startTime, dto.endTime)) {
        throw new Error("El horario ya está reservado");
      }
      const booking = this.repo.create({
        court: { id: dto.courtId } as any,
        player: dto.playerId ? { id: dto.playerId } as any : null,
        profesor: dto.profesorId ? { id: dto.profesorId } as any : null,
        price: dto.price ?? null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: "CONFIRMED",
        isRecurring: false,
        recurringGroupId: null,
        userId,
      });
      return await this.repo.save(booking);
    }

    const groupId = generateGroupId();
    const WEEKS = 52;
    const created: Booking[] = [];

    for (let w = 0; w < WEEKS; w++) {
      const start = addWeeks(dto.startTime, w);
      const end   = addWeeks(dto.endTime,   w);
      if (await this.hasOverlap(dto.courtId, start, end)) continue;
      const booking = this.repo.create({
        court: { id: dto.courtId } as any,
        player: dto.playerId ? { id: dto.playerId } as any : null,
        profesor: dto.profesorId ? { id: dto.profesorId } as any : null,
        price: dto.price ?? null,
        startTime: start,
        endTime: end,
        status: "CONFIRMED",
        isRecurring: true,
        recurringGroupId: groupId,
        userId,
      });
      created.push(await this.repo.save(booking));
    }

    if (created.length === 0) {
      throw new Error("No se pudo crear ninguna reserva recurrente: todos los horarios están ocupados");
    }

    return created;
  }

  async getTodayBookings(userId: number): Promise<Booking[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return await this.repo.find({
      where: {
        userId,
        status: "CONFIRMED",
        startTime: Between(startOfDay, endOfDay),
      },
      order: { startTime: "ASC" },
    });
  }

  async getByCourtId(courtId: number): Promise<Booking[]> {
    return await this.repo.find({
      where: { court: { id: courtId }, status: Not("CANCELLED") },
      order: { startTime: "ASC" },
    });
  }

  async getByProfesorId(profesorId: number): Promise<Booking[]> {
    return await this.repo.find({
      where: { profesor: { id: profesorId }, status: Not("CANCELLED") },
      order: { startTime: "ASC" },
    });
  }

  async cancel(id: number): Promise<Booking | null> {
    await this.repo.update(id, { status: "CANCELLED" });
    return await this.repo.findOneBy({ id });
  }

  async cancelGroup(groupId: string): Promise<number> {
    const result = await this.repo.update(
      { recurringGroupId: groupId, status: "CONFIRMED" },
      { status: "CANCELLED" }
    );
    return result.affected ?? 0;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
