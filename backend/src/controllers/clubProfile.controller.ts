import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ClubProfile } from "../entities/ClubProfile";
import { ClubProfileService } from "../services/clubProfile.service";

function getService() {
  return new ClubProfileService(AppDataSource.getRepository(ClubProfile));
}

export async function getProfile(req: Request, res: Response) {
  const userId = req.authUser!.sub;
  const profile = await getService().get(userId);
  res.json(profile);
}

export async function saveProfile(req: Request, res: Response) {
  const userId = req.authUser!.sub;
  const profile = await getService().save(req.body, userId);
  res.json(profile);
}
