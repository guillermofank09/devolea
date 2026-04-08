import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../entities/Booking";
import { AppSettings } from "../entities/AppSettings";
import { ClubProfile } from "../entities/ClubProfile";
import { Court } from "../entities/Court";
import { Profesor } from "../entities/Profesor";
import { StatsService } from "../services/stats.service";

function getService() {
  return new StatsService(
    AppDataSource.getRepository(Booking),
    AppDataSource.getRepository(AppSettings),
    AppDataSource.getRepository(ClubProfile),
    AppDataSource.getRepository(Court),
    AppDataSource.getRepository(Profesor)
  );
}

export async function getRevenue(req: Request, res: Response) {
  const userId = req.authUser!.sub;
  const stats = await getService().getRevenue(userId);
  res.json(stats);
}

export async function getProfesorStats(req: Request, res: Response) {
  const userId = req.authUser!.sub;
  const stats = await getService().getProfesorStats(userId);
  res.json(stats);
}
