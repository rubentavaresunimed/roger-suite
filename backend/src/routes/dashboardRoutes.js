import { Router } from "express";

import { getDashboardSummary } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/summary", requirePermission("roger", "dashboard", "visualizar"), getDashboardSummary);

export default router;
