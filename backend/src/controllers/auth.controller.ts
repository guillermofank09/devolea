import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { AuthService } from "../services/auth.service";

function getService() {
  return new AuthService(AppDataSource.getRepository(User));
}

export async function register(req: Request, res: Response) {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    res.status(400).json({ message: "Todos los campos son requeridos." });
    return;
  }
  try {
    const result = await getService().register(email, name, password);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN") {
      res.status(409).json({ message: "El email ya está registrado." });
    } else {
      res.status(500).json({ message: "Error al registrar el usuario." });
    }
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email y contraseña son requeridos." });
    return;
  }
  try {
    const result = await getService().login(email, password);
    res.json(result);
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ message: "Email o contraseña incorrectos." });
    } else {
      res.status(500).json({ message: "Error al iniciar sesión." });
    }
  }
}
