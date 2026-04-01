import { Repository, Like, Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Court, CourtStatus, CourtType } from "../entities/Court";
import { Booking } from "../entities/Booking";
import { AppDataSource } from "../data-source";

export class CourtService {
  constructor(private repo: Repository<Court>) {}

  async create(name: string, type: CourtType): Promise<Court> {
    const doc = this.repo.create({ name, status: "AVAILABLE", type });
    return await this.repo.save(doc);
  }

  async getAll(search?: string): Promise<Court[]> {
    const courts = await this.repo.find({
      where: search ? { name: Like(`%${search}%`) } : {},
      order: { createdAt: "ASC" },
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const bookingRepo = AppDataSource.getRepository(Booking);
    const todayBookings = await bookingRepo.find({
      where: { status: "CONFIRMED", startTime: Between(startOfDay, endOfDay) },
      relations: ["court"],
    });

    return courts.map((court) => {
      // Manual override always wins
      if (court.status === "NOT AVAILABLE") return court;

      const courtBookings = todayBookings.filter((b) => b.court.id === court.id);

      const isInUse = courtBookings.some(
        (b) => new Date(b.startTime) <= now && new Date(b.endTime) >= now
      );

      const effectiveStatus: CourtStatus = isInUse ? "IN USE" : "AVAILABLE";

      return { ...court, status: effectiveStatus };
    });
  }

  async getById(id: number): Promise<Court | null> {
    return await this.repo.findOneBy({ id });
  }

  async update(id: number, data: Partial<Pick<Court, "name" | "type" | "status">>): Promise<Court | null> {
    await this.repo.update(id, data);
    return await this.repo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
