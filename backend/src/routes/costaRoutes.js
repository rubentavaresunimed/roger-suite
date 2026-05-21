import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getCostaDashboard, revalidateCostaScripts } from "../controllers/costaController.js";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard", getCostaDashboard);
router.post("/atendimentos/:atendimento/revalidar", revalidateCostaScripts);

export default router;
