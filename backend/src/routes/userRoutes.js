import { Router } from "express";

import {
  listUsers,
  createUser,
  updateUser,
  resetPassword,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermission("roger", "usuarios", "visualizar"), listUsers);
router.post("/", requirePermission("roger", "usuarios", "incluir"), createUser);
router.put("/:id", requirePermission("roger", "usuarios", "alterar"), updateUser);
router.post(
  "/:id/reset-password",
  requirePermission("roger", "usuarios", "administrar"),
  resetPassword
);

export default router;
