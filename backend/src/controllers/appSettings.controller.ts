import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { AppSettings } from "../entities/AppSettings";
import { AppSettingsService } from "../services/appSettings.service";

function getService() {
  return new AppSettingsService(AppDataSource.getRepository(AppSettings));
}

export async function getSettings(req: Request, res: Response) {
  const settings = await getService().get();
  res.json(settings);
}

export async function saveSettings(req: Request, res: Response) {
  const settings = await getService().save(req.body);
  res.json(settings);
}
