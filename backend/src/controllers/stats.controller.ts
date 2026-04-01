import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../entities/Booking";
import { AppSettings } from "../entities/AppSettings";
import { ClubProfile } from "../entities/ClubProfile";
import { StatsService } from "../services/stats.service";

function getService() {
  return new StatsService(
    AppDataSource.getRepository(Booking),
    AppDataSource.getRepository(AppSettings),
    AppDataSource.getRepository(ClubProfile)
  );
}

export async function getRevenue(_req: Request, res: Response) {
  const stats = await getService().getRevenue();
  res.json(stats);
}
