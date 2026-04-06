import { Repository, Like, Between } from "typeorm";
import { Court, CourtStatus, CourtType } from "../entities/Court";
import { Booking } from "../entities/Booking";
import { AppDataSource } from "../data-source";

export class CourtService {
  constructor(private repo: Repository<Court>) {}

  async create(name: string, type: CourtType, userId: number): Promise<Court> {
    const doc = this.repo.create({ name, status: "AVAILABLE", type, userId });
    return await this.repo.save(doc);
  }

  async getAll(userId: number, search?: string): Promise<Court[]> {
    const where: any = { userId };
    if (search) where.name = Like(`%${search}%`);
    const courts = await this.repo.find({ where, order: { createdAt: "ASC" } });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const bookingRepo = AppDataSource.getRepository(Booking);
    const todayBookings = await bookingRepo.find({
      where: { userId, status: "CONFIRMED", startTime: Between(startOfDay, endOfDay) },
      relations: ["court"],
    });

    return courts.map((court) => {
      if (court.status === "NOT AVAILABLE") return court;
      const courtBookings = todayBookings.filter((b) => b.court.id === court.id);
      const isInUse = courtBookings.some(
        (b) => new Date(b.startTime) <= now && new Date(b.endTime) >= now
      );
      return { ...court, status: isInUse ? "IN USE" as CourtStatus : "AVAILABLE" as CourtStatus };
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
