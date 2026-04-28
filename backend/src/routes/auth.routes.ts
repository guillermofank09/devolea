import { Router } from "express";
import { login, createUser, getUsers, updateUser, deleteUser, initSuperAdmin, changePassword, impersonateUser, getUserStats, getMe } from "../controllers/auth.controller";
import { requireAuth, requireSuperAdmin } from "../middleware/auth.middleware";

const router = Router();

// Public
router.post("/auth/login", login);
router.post("/auth/init", initSuperAdmin); // One-time: creates superadmin if no users exist

// Authenticated users
router.get("/auth/me", requireAuth, getMe);
router.put("/auth/me/password", requireAuth, changePassword);
router.post("/auth/impersonate/:id", requireSuperAdmin, impersonateUser);
router.get("/auth/users/:id/stats", requireSuperAdmin, getUserStats);

// Superadmin only
router.get("/auth/users", requireSuperAdmin, getUsers);
router.post("/auth/users", requireSuperAdmin, createUser);
router.put("/auth/users/:id", requireSuperAdmin, updateUser);
router.delete("/auth/users/:id", requireSuperAdmin, deleteUser);

export default router;
