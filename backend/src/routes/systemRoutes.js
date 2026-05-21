import { Router } from "express";

import {
  listSystems,
  createSystem,
  updateSystem,
  createResource,
  updateResource,
} from "../controllers/systemController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermission("roger", "sistemas", "visualizar"), listSystems);
router.post("/", requirePermission("roger", "sistemas", "incluir"), createSystem);
router.put("/:id", requirePermission("roger", "sistemas", "alterar"), updateSystem);
router.post("/:systemId/resources", requirePermission("roger", "sistemas", "administrar"), createResource);
router.put("/resources/:id", requirePermission("roger", "sistemas", "administrar"), updateResource);

export default router;
