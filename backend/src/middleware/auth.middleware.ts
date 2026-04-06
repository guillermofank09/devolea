import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devolea_secret_key_change_in_prod";

export interface AuthPayload {
  sub: number;
  username: string;
  role: "superadmin" | "user";
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "No autenticado." });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as unknown as AuthPayload;
    req.authUser = payload;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado." });
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.authUser?.role !== "superadmin") {
      res.status(403).json({ message: "Acceso denegado. Se requiere rol superadmin." });
      return;
    }
    next();
  });
}
