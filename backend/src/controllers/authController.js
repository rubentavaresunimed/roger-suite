import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { db, logEvent } from "../database/db.js";
import { buildPermissionMap } from "../services/permissionService.js";

dotenv.config();

function sanitizeUser(user) {
  const permissionData = buildPermissionMap(user.id);

  return {
    id: user.id,
    name: user.name,
    cpf: user.cpf,
    email: user.email,
    login: user.login,
    profileId: user.profile_id,
    profile: user.profile_name,
    active: Boolean(user.active),
    lastLoginAt: user.last_login_at,
    permissions: permissionData.map,
    permissionsList: permissionData.list,
  };
}

export function login(req, res) {
  const { login, password } = req.body || {};

  if (!login || !password) {
    return res.status(400).json({
      ok: false,
      message: "Informe login e senha",
    });
  }

  const user = db.prepare(`
    SELECT u.*, p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    WHERE u.login = ? OR u.email = ?
  `).get(login, login);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logEvent({
      event: "LOGIN_FALHOU",
      detail: `Tentativa de login: ${login}`,
      ip: req.ip,
    });

    return res.status(401).json({
      ok: false,
      message: "Login ou senha inválidos",
    });
  }

  if (!user.active) {
    return res.status(403).json({
      ok: false,
      message: "Usuário inativo ou bloqueado",
    });
  }

  const lastLoginAt = new Date().toISOString();

  db.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?")
    .run(lastLoginAt, lastLoginAt, user.id);

  logEvent({
    userId: user.id,
    event: "LOGIN_OK",
    detail: "Login realizado com sucesso",
    ip: req.ip,
  });

  const token = jwt.sign(
    {
      id: user.id,
      login: user.login,
      profileId: user.profile_id,
      profile: user.profile_name,
    },
    process.env.JWT_SECRET || "roger_dev_secret_change_me",
    { expiresIn: "8h" }
  );

  return res.json({
    ok: true,
    token,
    user: sanitizeUser({ ...user, last_login_at: lastLoginAt }),
  });
}

export function me(req, res) {
  const user = db.prepare(`
    SELECT u.*, p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    WHERE u.id = ?
  `).get(req.auth.id);

  if (!user) {
    return res.status(404).json({
      ok: false,
      message: "Usuário não encontrado",
    });
  }

  return res.json({
    ok: true,
    user: sanitizeUser(user),
  });
}
