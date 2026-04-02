import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Profesor } from "../entities/Profesor";
import { ProfesorService } from "../services/profesor.service";

function getService() {
  return new ProfesorService(AppDataSource.getRepository(Profesor));
}

export const createProfesor = async (req: Request, res: Response) => {
  const { name, phone, email } = req.body;
  if (!name) { res.status(400).json({ error: "El nombre es requerido" }); return; }
  try {
    const profesor = await getService().create({ name, phone, email });
    res.status(201).json(profesor);
  } catch {
    res.status(500).json({ error: "Error al crear el profesor" });
  }
};

export const getProfesores = async (req: Request, res: Response) => {
  try {
    const profesores = await getService().getAll(req.query.search as string);
    res.json(profesores);
  } catch {
    res.status(500).json({ error: "Error al obtener profesores" });
  }
};

export const getProfesorById = async (req: Request, res: Response) => {
  try {
    const profesor = await getService().getById(Number(req.params.id));
    if (!profesor) { res.status(404).json({ error: "Profesor no encontrado" }); return; }
    res.json(profesor);
  } catch {
    res.status(500).json({ error: "Error al obtener el profesor" });
  }
};

export const updateProfesor = async (req: Request, res: Response) => {
  const { name, phone, email } = req.body;
  try {
    const profesor = await getService().update(Number(req.params.id), { name, phone, email });
    if (!profesor) { res.status(404).json({ error: "Profesor no encontrado" }); return; }
    res.json(profesor);
  } catch {
    res.status(500).json({ error: "Error al actualizar el profesor" });
  }
};

export const deleteProfesor = async (req: Request, res: Response) => {
  try {
    await getService().delete(Number(req.params.id));
    res.json({ message: "Profesor eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar el profesor" });
  }
};
