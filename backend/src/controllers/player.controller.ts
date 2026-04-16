import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Player } from "../entities/Player";
import { PlayerService } from "../services/player.service";

function getService() {
  return new PlayerService(AppDataSource.getRepository(Player));
}

export const createPlayer = async (req: Request, res: Response) => {
  const { name, category, city, sex, birthDate, phone, avatarUrl } = req.body;
  const userId = req.authUser!.sub;
  try {
    const player = await getService().create({ name, category, city, sex, birthDate, phone, avatarUrl }, userId);
    res.status(201).json(player);
  } catch {
    res.status(500).json({ error: "Error al crear el jugador" });
  }
};

export const getPlayers = async (req: Request, res: Response) => {
  const userId = req.authUser!.sub;
  try {
    const players = await getService().getAll(userId, req.query.search as string);
    res.json(players);
  } catch {
    res.status(500).json({ error: "Error al obtener jugadores" });
  }
};

export const getPlayerById = async (req: Request, res: Response) => {
  try {
    const player = await getService().getById(Number(req.params.id));
    if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
    res.json(player);
  } catch {
    res.status(500).json({ error: "Error al obtener el jugador" });
  }
};

export const updatePlayer = async (req: Request, res: Response) => {
  const { name, category, city, sex, birthDate, phone, avatarUrl } = req.body;
  try {
    const player = await getService().update(Number(req.params.id), { name, category, city, sex, birthDate, phone, avatarUrl });
    if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
    res.json(player);
  } catch {
    res.status(500).json({ error: "Error al actualizar el jugador" });
  }
};

export const deletePlayer = async (req: Request, res: Response) => {
  try {
    await getService().delete(Number(req.params.id));
    res.json({ message: "Jugador eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar el jugador" });
  }
};
