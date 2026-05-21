import { db } from "../database/db.js";

function rowToProfile(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProfiles(req, res) {
  const rows = db.prepare(`
    SELECT * FROM profiles
    ORDER BY name
  `).all();

  res.json({
    ok: true,
    profiles: rows.map(rowToProfile),
  });
}

export function createProfile(req, res) {
  const { name, description = "", active = true } = req.body || {};

  if (!name) {
    return res.status(400).json({
      ok: false,
      message: "Nome do perfil é obrigatório",
    });
  }

  const date = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO profiles (name, description, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, description, active ? 1 : 0, date, date);

  const profile = db.prepare("SELECT * FROM profiles WHERE id = ?").get(result.lastInsertRowid);

  res.status(201).json({
    ok: true,
    profile: rowToProfile(profile),
  });
}

export function updateProfile(req, res) {
  const { id } = req.params;
  const { name, description = "", active = true } = req.body || {};

  if (!name) {
    return res.status(400).json({
      ok: false,
      message: "Nome do perfil é obrigatório",
    });
  }

  const exists = db.prepare("SELECT id FROM profiles WHERE id = ?").get(id);

  if (!exists) {
    return res.status(404).json({
      ok: false,
      message: "Perfil não encontrado",
    });
  }

  const date = new Date().toISOString();

  db.prepare(`
    UPDATE profiles
    SET name = ?, description = ?, active = ?, updated_at = ?
    WHERE id = ?
  `).run(name, description, active ? 1 : 0, date, id);

  const profile = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id);

  res.json({
    ok: true,
    profile: rowToProfile(profile),
  });
}
