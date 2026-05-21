import { db, logEvent } from "../database/db.js";
import { canUser } from "../services/permissionService.js";

function moduleRow(row, userId) {
  const canAccess =
    row.slug === "roger"
      ? canUser(userId, "roger", "dashboard", "visualizar")
      : canUser(userId, row.slug, "acesso", "visualizar");

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    url: row.url || "",
    icon: row.icon || "layers",
    color: row.color || "green",
    active: Boolean(row.active),
    canAccess,
    status: row.url ? "Configurado" : "Aguardando URL",
  };
}

export function listModules(req, res) {
  const systems = db.prepare(`
    SELECT * FROM systems
    WHERE active = 1
    ORDER BY CASE WHEN slug = 'roger' THEN 0 ELSE 1 END, id
  `).all();

  const modules = systems.map((system) => moduleRow(system, req.auth.id));

  res.json({
    ok: true,
    modules,
  });
}

export function accessModule(req, res) {
  const { slug } = req.params;

  const system = db.prepare(`
    SELECT * FROM systems
    WHERE slug = ? AND active = 1
  `).get(slug);

  if (!system) {
    return res.status(404).json({
      ok: false,
      message: "Módulo não encontrado ou inativo",
    });
  }

  const allowed =
    system.slug === "roger"
      ? canUser(req.auth.id, "roger", "dashboard", "visualizar")
      : canUser(req.auth.id, system.slug, "acesso", "visualizar");

  if (!allowed) {
    logEvent({
      userId: req.auth.id,
      event: "MODULO_NEGADO",
      detail: `Tentativa de acesso ao módulo ${system.name}`,
      ip: req.ip,
    });

    return res.status(403).json({
      ok: false,
      message: "Você não possui permissão para acessar este módulo",
    });
  }

  logEvent({
    userId: req.auth.id,
    event: "MODULO_ACESSADO",
    detail: `Acesso ao módulo ${system.name}`,
    ip: req.ip,
  });

  if (!system.url) {
    return res.json({
      ok: true,
      message: "Módulo liberado, mas ainda sem URL configurada",
      module: moduleRow(system, req.auth.id),
      url: "",
    });
  }

  return res.json({
    ok: true,
    message: "Acesso ao módulo autorizado",
    module: moduleRow(system, req.auth.id),
    url: system.url,
  });
}
