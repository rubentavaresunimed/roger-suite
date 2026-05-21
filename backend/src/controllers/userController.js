import bcrypt from "bcryptjs";
import { db, logEvent } from "../database/db.js";

function rowToUser(row) {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    email: row.email,
    login: row.login,
    profileId: row.profile_id,
    profile: row.profile_name,
    active: Boolean(row.active),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listUsers(req, res) {
  const rows = db.prepare(`
    SELECT u.*, p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    ORDER BY u.name
  `).all();

  res.json({
    ok: true,
    users: rows.map(rowToUser),
  });
}

export function createUser(req, res) {
  const {
    name,
    cpf = "",
    email,
    login,
    password = "123456",
    profileId,
    active = true,
  } = req.body || {};

  if (!name || !email || !login || !profileId) {
    return res.status(400).json({
      ok: false,
      message: "Nome, e-mail, login e perfil são obrigatórios",
    });
  }

  const exists = db.prepare(`
    SELECT id FROM users WHERE email = ? OR login = ?
  `).get(email, login);

  if (exists) {
    return res.status(409).json({
      ok: false,
      message: "Já existe usuário com este e-mail ou login",
    });
  }

  const date = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db.prepare(`
    INSERT INTO users
      (name, cpf, email, login, password_hash, profile_id, active, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, cpf, email, login, passwordHash, profileId, active ? 1 : 0, date, date);

  logEvent({
    userId: req.auth?.id,
    event: "USUARIO_CRIADO",
    detail: `Usuário criado: ${login}`,
    ip: req.ip,
  });

  const user = db.prepare(`
    SELECT u.*, p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    WHERE u.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({
    ok: true,
    user: rowToUser(user),
  });
}

export function updateUser(req, res) {
  const { id } = req.params;
  const {
    name,
    cpf = "",
    email,
    login,
    profileId,
    active = true,
  } = req.body || {};

  if (!name || !email || !login || !profileId) {
    return res.status(400).json({
      ok: false,
      message: "Nome, e-mail, login e perfil são obrigatórios",
    });
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);

  if (!user) {
    return res.status(404).json({
      ok: false,
      message: "Usuário não encontrado",
    });
  }

  const duplicated = db.prepare(`
    SELECT id FROM users
    WHERE (email = ? OR login = ?) AND id <> ?
  `).get(email, login, id);

  if (duplicated) {
    return res.status(409).json({
      ok: false,
      message: "Já existe outro usuário com este e-mail ou login",
    });
  }

  const date = new Date().toISOString();

  db.prepare(`
    UPDATE users
    SET name = ?, cpf = ?, email = ?, login = ?, profile_id = ?, active = ?, updated_at = ?
    WHERE id = ?
  `).run(name, cpf, email, login, profileId, active ? 1 : 0, date, id);

  logEvent({
    userId: req.auth?.id,
    event: "USUARIO_ATUALIZADO",
    detail: `Usuário atualizado: ${login}`,
    ip: req.ip,
  });

  const updated = db.prepare(`
    SELECT u.*, p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    WHERE u.id = ?
  `).get(id);

  res.json({
    ok: true,
    user: rowToUser(updated),
  });
}

export function resetPassword(req, res) {
  const { id } = req.params;
  const { password = "123456" } = req.body || {};

  const user = db.prepare("SELECT login FROM users WHERE id = ?").get(id);

  if (!user) {
    return res.status(404).json({
      ok: false,
      message: "Usuário não encontrado",
    });
  }

  const date = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?
  `).run(passwordHash, date, id);

  logEvent({
    userId: req.auth?.id,
    event: "SENHA_REDEFINIDA",
    detail: `Senha redefinida para: ${user.login}`,
    ip: req.ip,
  });

  res.json({
    ok: true,
    message: "Senha redefinida com sucesso",
  });
}
