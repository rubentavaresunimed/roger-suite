import { canUser } from "../services/permissionService.js";
import { logEvent } from "../database/db.js";

export function requirePermission(systemSlug, resourceSlug, action = "visualizar") {
  return (req, res, next) => {
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Usuário não autenticado",
      });
    }

    const allowed = canUser(userId, systemSlug, resourceSlug, action);

    if (!allowed) {
      logEvent({
        userId,
        event: "ACESSO_NEGADO",
        detail: `${systemSlug}.${resourceSlug}.${action}`,
        ip: req.ip,
      });

      return res.status(403).json({
        ok: false,
        message: "Acesso negado pelo ROGER",
        permission: {
          system: systemSlug,
          resource: resourceSlug,
          action,
        },
      });
    }

    next();
  };
}
