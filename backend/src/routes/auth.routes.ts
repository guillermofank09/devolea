import { Router } from "express";
import { login, createUser, getUsers, updateUser, deleteUser, initSuperAdmin } from "../controllers/auth.controller";
import { requireSuperAdmin } from "../middleware/auth.middleware";

const router = Router();

// Public
router.post("/auth/login", login);
router.post("/auth/init", initSuperAdmin); // One-time: creates superadmin if no users exist

// Superadmin only
router.get("/auth/users", requireSuperAdmin, getUsers);
router.post("/auth/users", requireSuperAdmin, createUser);
router.put("/auth/users/:id", requireSuperAdmin, updateUser);
router.delete("/auth/users/:id", requireSuperAdmin, deleteUser);

export default router;
