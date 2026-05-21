import { Router } from "express";

import {
  listProfiles,
  createProfile,
  updateProfile,
} from "../controllers/profileController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermission("roger", "perfis", "visualizar"), listProfiles);
router.post("/", requirePermission("roger", "perfis", "incluir"), createProfile);
router.put("/:id", requirePermission("roger", "perfis", "alterar"), updateProfile);

export default router;
