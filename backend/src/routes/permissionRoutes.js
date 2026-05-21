import { Router } from "express";

import {
  listPermissionCatalog,
  getProfilePermissions,
  saveProfilePermissions,
  getUserEffectivePermissions,
  saveUserExceptions,
} from "../controllers/permissionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/catalog", requirePermission("roger", "perfis", "visualizar"), listPermissionCatalog);
router.get("/profiles/:profileId", requirePermission("roger", "perfis", "visualizar"), getProfilePermissions);
router.put("/profiles/:profileId", requirePermission("roger", "perfis", "administrar"), saveProfilePermissions);
router.get("/users/:userId", requirePermission("roger", "acessos", "visualizar"), getUserEffectivePermissions);
router.put("/users/:userId/exceptions", requirePermission("roger", "acessos", "administrar"), saveUserExceptions);

export default router;
