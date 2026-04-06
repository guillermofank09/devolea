import { Request, Response } from "express";
import { CourtService } from "../services/court.service";
import { AppDataSource } from "../data-source";
import { Court } from "../entities/Court";

function getService() {
  return new CourtService(AppDataSource.getRepository(Court));
}

export const createCourt = async (req: Request, res: Response) => {
  const { name, type } = req.body;
  const userId = req.authUser!.sub;
  try {
    const doc = await getService().create(name, type, userId);
    res.json(doc);
  } catch {
    res.status(500).json({ error: "Error al crear la cancha" });
  }
};

export const getCourts = async (req: Request, res: Response) => {
  const userId = req.authUser!.sub;
  try {
    const docs = await getService().getAll(userId, req.query.search as string);
    res.json(docs);
  } catch {
    res.status(500).json({ error: "Error al obtener canchas" });
  }
};

export const getCourtById = async (req: Request, res: Response) => {
  try {
    const doc = await getService().getById(Number(req.params.id));
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
};

export const updateCourt = async (req: Request, res: Response) => {
  const { name, type, status } = req.body;
  try {
    const updated = await getService().update(Number(req.params.id), {
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
    await getService().delete(Number(req.params.id));
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
};
