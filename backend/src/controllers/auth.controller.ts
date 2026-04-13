import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { AuthService } from "../services/auth.service";

function getService() {
  return new AuthService(AppDataSource.getRepository(User));
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "Usuario y contraseña son requeridos." });
    return;
  }
  try {
    const result = await getService().login(username, password);
    res.json(result);
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ message: "Usuario o contraseña incorrectos." });
    } else if (err.message === "ACCOUNT_DISABLED") {
      res.status(403).json({ message: "Tu cuenta está deshabilitada. Contactá con el administrador para poder utilizar el sistema." });
    } else {
      res.status(500).json({ message: "Error al iniciar sesión." });
    }
  }
}

export async function createUser(req: Request, res: Response) {
  const { username, name, password } = req.body;
  if (!username || !name || !password) {
    res.status(400).json({ message: "Todos los campos son requeridos." });
    return;
  }
  try {
    const result = await getService().createUser(username, name, password);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === "USERNAME_TAKEN") {
      res.status(409).json({ message: "El nombre de usuario ya está en uso." });
    } else {
      res.status(500).json({ message: "Error al crear el usuario." });
    }
  }
}

export async function getUsers(_req: Request, res: Response) {
  try {
    res.json(await getService().getUsers());
  } catch {
    res.status(500).json({ message: "Error al obtener los usuarios." });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { name, password, isActive, lastPaymentDate } = req.body;
  try {
    const dto: { name?: string; password?: string; isActive?: boolean; lastPaymentDate?: string | null } = {};
    if (name !== undefined) dto.name = name;
    if (password !== undefined) dto.password = password;
    if (isActive !== undefined) dto.isActive = isActive;
    if ("lastPaymentDate" in req.body) dto.lastPaymentDate = lastPaymentDate ?? null;
    const user = await getService().updateUser(Number(req.params.id), dto);
    res.json(user);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      res.status(404).json({ message: "Usuario no encontrado." });
    } else {
      res.status(500).json({ message: "Error al actualizar el usuario." });
    }
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    await getService().deleteUser(Number(req.params.id));
    res.json({ message: "Usuario eliminado." });
  } catch {
    res.status(500).json({ message: "Error al eliminar el usuario." });
  }
}

export async function initSuperAdmin(req: Request, res: Response) {
  const { username, name, password } = req.body;
  if (!username || !name || !password) {
    res.status(400).json({ message: "Todos los campos son requeridos." });
    return;
  }
  try {
    const user = await getService().initSuperAdmin(username, name, password);
    res.status(201).json(user);
  } catch (err: any) {
    if (err.message === "ALREADY_INITIALIZED") {
      res.status(409).json({ message: "Ya existe al menos un usuario registrado." });
    } else {
      res.status(500).json({ message: "Error al inicializar." });
    }
  }
}
