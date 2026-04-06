import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../entities/Booking";
import { AppSettings } from "../entities/AppSettings";
import { ClubProfile } from "../entities/ClubProfile";
import { Court } from "../entities/Court";
import { StatsService } from "../services/stats.service";

function getService() {
  return new StatsService(
    AppDataSource.getRepository(Booking),
    AppDataSource.getRepository(AppSettings),
    AppDataSource.getRepository(ClubProfile),
    AppDataSource.getRepository(Court)
  );
}

export async function getRevenue(req: Request, res: Response) {
  const userId = req.authUser!.sub;
  const stats = await getService().getRevenue(userId);
  res.json(stats);
}
