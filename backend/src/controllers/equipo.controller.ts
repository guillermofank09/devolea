import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Equipo } from "../entities/Equipo";
import { EquipoService } from "../services/equipo.service";

function getService() {
  return new EquipoService(AppDataSource.getRepository(Equipo));
}

export const createEquipo = async (req: Request, res: Response) => {
  const { name, city, sex, avatarUrl } = req.body;
  if (!name) { res.status(400).json({ error: "El nombre es requerido" }); return; }
  const userId = req.authUser!.sub;
  try {
    const equipo = await getService().create({ name, city, sex, avatarUrl }, userId);
    res.status(201).json(equipo);
  } catch {
    res.status(500).json({ error: "Error al crear el equipo" });
  }
};

export const getEquipos = async (req: Request, res: Response) => {
  const userId = req.authUser!.sub;
  try {
    const equipos = await getService().getAll(userId, req.query.search as string);
    res.json(equipos);
  } catch {
    res.status(500).json({ error: "Error al obtener equipos" });
  }
};

export const getEquipoById = async (req: Request, res: Response) => {
  try {
    const equipo = await getService().getById(Number(req.params.id));
    if (!equipo) { res.status(404).json({ error: "Equipo no encontrado" }); return; }
    res.json(equipo);
  } catch {
    res.status(500).json({ error: "Error al obtener el equipo" });
  }
};

export const updateEquipo = async (req: Request, res: Response) => {
  const { name, city, sex, avatarUrl } = req.body;
  try {
    const equipo = await getService().update(Number(req.params.id), { name, city, sex, avatarUrl });
    if (!equipo) { res.status(404).json({ error: "Equipo no encontrado" }); return; }
    res.json(equipo);
  } catch {
    res.status(500).json({ error: "Error al actualizar el equipo" });
  }
};

export const deleteEquipo = async (req: Request, res: Response) => {
  try {
    await getService().delete(Number(req.params.id));
    res.json({ message: "Equipo eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar el equipo" });
  }
};
