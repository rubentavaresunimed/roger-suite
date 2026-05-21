import { Router } from "express";

import { listModules, accessModule } from "../controllers/moduleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermission("roger", "modulos", "visualizar"), listModules);
router.post("/:slug/access", requirePermission("roger", "modulos", "visualizar"), accessModule);

export default router;
