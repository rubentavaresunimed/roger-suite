import { db, logEvent } from "../database/db.js";

const now = () => new Date().toISOString();

function systemRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    url: row.url || "",
    icon: row.icon || "layers",
    color: row.color || "green",
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function resourceRow(row) {
  return {
    id: row.id,
    systemId: row.system_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listSystems(req, res) {
  const systems = db.prepare(`
    SELECT * FROM systems ORDER BY id
  `).all();

  const resources = db.prepare(`
    SELECT * FROM resources ORDER BY system_id, id
  `).all();

  res.json({
    ok: true,
    systems: systems.map((system) => ({
      ...systemRow(system),
      resources: resources
        .filter((resource) => resource.system_id === system.id)
        .map(resourceRow),
    })),
  });
}

export function createSystem(req, res) {
  const {
    name,
    slug,
    description = "",
    url = "",
    icon = "layers",
    color = "green",
    active = true,
  } = req.body || {};

  if (!name || !slug) {
    return res.status(400).json({
      ok: false,
      message: "Nome e slug do sistema são obrigatórios",
    });
  }

  const exists = db.prepare(`
    SELECT id FROM systems WHERE name = ? OR slug = ?
  `).get(name, slug);

  if (exists) {
    return res.status(409).json({
      ok: false,
      message: "Já existe sistema com este nome ou slug",
    });
  }

  const date = now();

  const result = db.prepare(`
    INSERT INTO systems
      (name, slug, description, active, created_at, updated_at, url, icon, color)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, description, active ? 1 : 0, date, date, url, icon, color);

  logEvent({
    userId: req.auth?.id,
    event: "SISTEMA_CRIADO",
    detail: `Sistema criado: ${name}`,
    ip: req.ip,
  });

  const system = db.prepare("SELECT * FROM systems WHERE id = ?").get(result.lastInsertRowid);

  res.status(201).json({
    ok: true,
    system: systemRow(system),
  });
}

export function updateSystem(req, res) {
  const { id } = req.params;
  const {
    name,
    slug,
    description = "",
    url = "",
    icon = "layers",
    color = "green",
    active = true,
  } = req.body || {};

  if (!name || !slug) {
    return res.status(400).json({
      ok: false,
      message: "Nome e slug do sistema são obrigatórios",
    });
  }

  const exists = db.prepare("SELECT id FROM systems WHERE id = ?").get(id);

  if (!exists) {
    return res.status(404).json({
      ok: false,
      message: "Sistema não encontrado",
    });
  }

  const duplicated = db.prepare(`
    SELECT id FROM systems
    WHERE (name = ? OR slug = ?) AND id <> ?
  `).get(name, slug, id);

  if (duplicated) {
    return res.status(409).json({
      ok: false,
      message: "Já existe outro sistema com este nome ou slug",
    });
  }

  const date = now();

  db.prepare(`
    UPDATE systems
    SET name = ?,
        slug = ?,
        description = ?,
        active = ?,
        url = ?,
        icon = ?,
        color = ?,
        updated_at = ?
    WHERE id = ?
  `).run(name, slug, description, active ? 1 : 0, url, icon, color, date, id);

  logEvent({
    userId: req.auth?.id,
    event: "SISTEMA_ATUALIZADO",
    detail: `Sistema atualizado: ${name}`,
    ip: req.ip,
  });

  const system = db.prepare("SELECT * FROM systems WHERE id = ?").get(id);

  res.json({
    ok: true,
    system: systemRow(system),
  });
}

export function createResource(req, res) {
  const { systemId } = req.params;
  const { name, slug, description = "", active = true } = req.body || {};

  if (!name || !slug) {
    return res.status(400).json({
      ok: false,
      message: "Nome e slug do recurso são obrigatórios",
    });
  }

  const system = db.prepare("SELECT id, name FROM systems WHERE id = ?").get(systemId);

  if (!system) {
    return res.status(404).json({
      ok: false,
      message: "Sistema não encontrado",
    });
  }

  const exists = db.prepare(`
    SELECT id FROM resources
    WHERE system_id = ? AND slug = ?
  `).get(systemId, slug);

  if (exists) {
    return res.status(409).json({
      ok: false,
      message: "Este sistema já possui recurso com este slug",
    });
  }

  const date = now();

  const result = db.prepare(`
    INSERT INTO resources (system_id, name, slug, description, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(systemId, name, slug, description, active ? 1 : 0, date, date);

  logEvent({
    userId: req.auth?.id,
    event: "RECURSO_CRIADO",
    detail: `Recurso criado: ${system.name} / ${name}`,
    ip: req.ip,
  });

  const resource = db.prepare("SELECT * FROM resources WHERE id = ?").get(result.lastInsertRowid);

  res.status(201).json({
    ok: true,
    resource: resourceRow(resource),
  });
}

export function updateResource(req, res) {
  const { id } = req.params;
  const { name, slug, description = "", active = true } = req.body || {};

  if (!name || !slug) {
    return res.status(400).json({
      ok: false,
      message: "Nome e slug do recurso são obrigatórios",
    });
  }

  const resource = db.prepare(`
    SELECT * FROM resources WHERE id = ?
  `).get(id);

  if (!resource) {
    return res.status(404).json({
      ok: false,
      message: "Recurso não encontrado",
    });
  }

  const duplicated = db.prepare(`
    SELECT id FROM resources
    WHERE system_id = ? AND slug = ? AND id <> ?
  `).get(resource.system_id, slug, id);

  if (duplicated) {
    return res.status(409).json({
      ok: false,
      message: "Este sistema já possui outro recurso com este slug",
    });
  }

  const date = now();

  db.prepare(`
    UPDATE resources
    SET name = ?, slug = ?, description = ?, active = ?, updated_at = ?
    WHERE id = ?
  `).run(name, slug, description, active ? 1 : 0, date, id);

  logEvent({
    userId: req.auth?.id,
    event: "RECURSO_ATUALIZADO",
    detail: `Recurso atualizado: ${name}`,
    ip: req.ip,
  });

  const updated = db.prepare("SELECT * FROM resources WHERE id = ?").get(id);

  res.json({
    ok: true,
    resource: resourceRow(updated),
  });
}
