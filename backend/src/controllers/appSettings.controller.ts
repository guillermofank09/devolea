import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { AppSettings } from "../entities/AppSettings";
import { AppSettingsService } from "../services/appSettings.service";

function getService() {
  return new AppSettingsService(AppDataSource.getRepository(AppSettings));
}

export async function getSettings(req: Request, res: Response) {
  const userId = req.authUser!.sub;
  const settings = await getService().get(userId);
  res.json(settings);
}

export async function saveSettings(req: Request, res: Response) {
  const userId = req.authUser!.sub;
  // Strip virtual (parsed) fields — only the *Json columns exist on the entity
  const { sportPrices, sportClassPrices, tournamentDurations, tournamentSets, ...rest } = req.body;
  const settings = await getService().save(rest, userId);
  res.json(settings);
}
