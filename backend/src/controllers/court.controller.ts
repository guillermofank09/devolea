import { Request, Response } from "express";
import { CourtService } from "../services/court.service";
import { AppDataSource } from "../data-source";
import { Court } from "../entities/Court";

const repo = AppDataSource.getRepository(Court);
const service = new CourtService(repo);

export const createCourt = async (req: Request, res: Response) => {
  const { name, type } = req.body;
  try {
    const doc = await service.create(name, type);
    res.json(doc);
  } catch {
    res.status(500).json({ error: "Error al crear la cancha" });
  }
};

export const getCourts = async (req: Request, res: Response) => {
  try {
    const docs = await service.getAll(req.query.search as string);
    res.json(docs);
  } catch {
    res.status(500).json({ error: "Error al obtener canchas" });
  }
};

export const getCourtById = async (req: Request, res: Response) => {
  try {
    const doc = await service.getById(Number(req.params.id));
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
};

export const updateCourt = async (req: Request, res: Response) => {
  const { name, type, status } = req.body;
  try {
    const updated = await service.update(Number(req.params.id), {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
    });
    if (!updated) return res.status(404).json({ error: "Cancha no encontrada" });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Error al actualizar la cancha" });
  }
};

export const deleteCourt = async (req: Request, res: Response) => {
  try {
    await service.delete(Number(req.params.id));
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
};
