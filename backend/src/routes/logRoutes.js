import { Router } from "express";

import { listLogs } from "../controllers/logController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermission("roger", "logs", "visualizar"), listLogs);

export default router;
