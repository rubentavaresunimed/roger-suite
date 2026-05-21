import { Router } from "express";

import {
  listUsersForModuleAccess,
  getUserModuleAccess,
  saveUserModuleAccess,
  listMyModules,
  accessModule,
} from "../controllers/moduleAccessController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = Router();

router.use(authMiddleware);

/*
  Meus Módulos deve ser liberado para qualquer usuário autenticado.
  A regra de bloqueio/liberação acontece em cima de cada módulo.
*/
router.get("/my", listMyModules);
router.post("/my/:slug/access", accessModule);

/*
  Administração de acessos continua restrita ao administrador/perfil autorizado.
*/
router.get("/users", requirePermission("roger", "acessos", "visualizar"), listUsersForModuleAccess);
router.get("/users/:userId", requirePermission("roger", "acessos", "visualizar"), getUserModuleAccess);
router.put("/users/:userId", requirePermission("roger", "acessos", "administrar"), saveUserModuleAccess);

export default router;
