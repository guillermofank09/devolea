import { Request, Response } from "express";
import { MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Player } from "../entities/Player";
import { Profesor } from "../entities/Profesor";
import { Tournament } from "../entities/Tournament";
import { Court } from "../entities/Court";
import { Booking } from "../entities/Booking";
import { ClubProfile } from "../entities/ClubProfile";
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
      res.status(403).json({ message: "Tu cuenta está deshabilitada. Contactá al administrador para poder utilizar el sistema." });
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

export async function getUserStats(req: Request, res: Response) {
  const userId = Number(req.params.id);
  const since = new Date();
  since.setDate(since.getDate() - 30);

  try {
    const [playerCount, profesorCount, tournamentCount, courts, bookings, profile] = await Promise.all([
      AppDataSource.getRepository(Player).count({ where: { userId } }),
      AppDataSource.getRepository(Profesor).count({ where: { userId } }),
      AppDataSource.getRepository(Tournament).count({ where: { userId, status: "ACTIVE" } }),
      AppDataSource.getRepository(Court).find({ where: { userId } }),
      AppDataSource.getRepository(Booking).find({
        where: { userId, status: "CONFIRMED", startTime: MoreThanOrEqual(since) },
        relations: ["court"],
      }),
      AppDataSource.getRepository(ClubProfile).findOneBy({ userId }),
    ]);

    // Average open hours/day from business hours profile (default 14h = 8am-10pm)
    let hoursPerDay = 14;
    if (profile?.businessHoursJson) {
      try {
        const bh: Array<{ isOpen?: boolean; openTime?: string; closeTime?: string }> = JSON.parse(profile.businessHoursJson);
        const openDays = bh.filter(d => d.isOpen);
        if (openDays.length > 0) {
          const total = openDays.reduce((sum, d) => {
            const [oh, om] = (d.openTime ?? "08:00").split(":").map(Number);
            const [ch, cm] = (d.closeTime ?? "22:00").split(":").map(Number);
            return sum + ((ch * 60 + cm) - (oh * 60 + om)) / 60;
          }, 0);
          hoursPerDay = total / openDays.length;
        }
      } catch { /* keep default */ }
    }

    const availableHours = hoursPerDay * 30;

    const courtStats = courts.map(court => {
      const bookedHours = bookings
        .filter(b => b.court?.id === court.id)
        .reduce((sum, b) => sum + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3_600_000, 0);
      return {
        id: court.id,
        name: court.name,
        bookedHours: Math.round(bookedHours * 10) / 10,
        occupancyPct: Math.min(100, Math.round((bookedHours / availableHours) * 100)),
      };
    });

    res.json({ playerCount, profesorCount, tournamentCount, courts: courtStats });
  } catch {
    res.status(500).json({ message: "Error al obtener métricas del usuario." });
  }
}

export async function impersonateUser(req: Request, res: Response) {
  try {
    const result = await getService().impersonateUser(Number(req.params.id));
    res.json(result);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      res.status(404).json({ message: "Usuario no encontrado." });
    } else if (err.message === "ACCOUNT_DISABLED") {
      res.status(403).json({ message: "El usuario está deshabilitado." });
    } else {
      res.status(500).json({ message: "Error al acceder al portal." });
    }
  }
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: "La contraseña actual y la nueva son requeridas." });
    return;
  }
  try {
    await getService().changePassword(req.authUser!.sub, currentPassword, newPassword);
    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (err: any) {
    if (err.message === "WRONG_PASSWORD") {
      res.status(401).json({ message: "La contraseña actual es incorrecta." });
    } else {
      res.status(500).json({ message: "Error al cambiar la contraseña." });
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
