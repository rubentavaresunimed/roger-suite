import { db, logEvent } from "../database/db.js";

function isAdmin(userId) {
  const user = db.prepare(`
    SELECT p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    WHERE u.id = ?
  `).get(userId);

  return user?.profile_name === "Administrador";
}

export function listUsersForModuleAccess(req, res) {
  const users = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.cpf,
      u.email,
      u.login,
      u.active,
      p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    ORDER BY u.name
  `).all();

  res.json({
    ok: true,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      cpf: user.cpf,
      email: user.email,
      login: user.login,
      profile: user.profile_name,
      active: Boolean(user.active),
    })),
  });
}

export function getUserModuleAccess(req, res) {
  const { userId } = req.params;

  const targetUser = db.prepare(`
    SELECT u.id, u.name, p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    WHERE u.id = ?
  `).get(userId);

  if (!targetUser) {
    return res.status(404).json({
      ok: false,
      message: "Usuário/prestador não encontrado",
    });
  }

  const modules = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.slug,
      s.description,
      s.url,
      s.icon,
      s.color,
      s.active,
      COALESCE(uma.allowed, 0) AS allowed
    FROM systems s
    LEFT JOIN user_module_access uma
      ON uma.system_id = s.id
     AND uma.user_id = ?
    WHERE s.slug <> 'roger'
    ORDER BY s.id
  `).all(userId);

  res.json({
    ok: true,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      profile: targetUser.profile_name,
    },
    modules: modules.map((module) => ({
      id: module.id,
      name: module.name,
      slug: module.slug,
      description: module.description,
      url: module.url || "",
      icon: module.icon || "layers",
      color: module.color || "green",
      active: Boolean(module.active),
      allowed: Boolean(module.allowed),
    })),
  });
}

export function saveUserModuleAccess(req, res) {
  const { userId } = req.params;
  const { modules = [] } = req.body || {};

  const targetUser = db.prepare("SELECT id, name FROM users WHERE id = ?").get(userId);

  if (!targetUser) {
    return res.status(404).json({
      ok: false,
      message: "Usuário/prestador não encontrado",
    });
  }

  const date = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO user_module_access
      (user_id, system_id, allowed, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, system_id)
    DO UPDATE SET
      allowed = excluded.allowed,
      updated_at = excluded.updated_at
  `);

  const tx = db.transaction(() => {
    modules.forEach((module) => {
      if (!module.systemId) return;
      upsert.run(userId, module.systemId, module.allowed ? 1 : 0, date, date);
    });
  });

  tx();

  logEvent({
    userId: req.auth?.id,
    event: "ACESSO_MODULO_ATUALIZADO",
    detail: `Acessos atualizados para ${targetUser.name}`,
    ip: req.ip,
  });

  res.json({
    ok: true,
    message: "Acessos do prestador salvos com sucesso",
  });
}

export function listMyModules(req, res) {
  const admin = isAdmin(req.auth.id);

  const modules = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.slug,
      s.description,
      s.url,
      s.icon,
      s.color,
      s.active,
      CASE
        WHEN ? = 1 THEN 1
        ELSE COALESCE(uma.allowed, 0)
      END AS allowed
    FROM systems s
    LEFT JOIN user_module_access uma
      ON uma.system_id = s.id
     AND uma.user_id = ?
    WHERE s.slug <> 'roger'
      AND s.active = 1
    ORDER BY s.id
  `).all(admin ? 1 : 0, req.auth.id);

  res.json({
    ok: true,
    modules: modules.map((module) => ({
      id: module.id,
      name: module.name,
      slug: module.slug,
      description: module.description,
      url: module.url || "",
      icon: module.icon || "layers",
      color: module.color || "green",
      active: Boolean(module.active),
      allowed: Boolean(module.allowed),
      status: module.url ? "Configurado" : "Aguardando URL",
    })),
  });
}

export function accessModule(req, res) {
  const { slug } = req.params;
  const admin = isAdmin(req.auth.id);

  const module = db.prepare(`
    SELECT
      s.*,
      COALESCE(uma.allowed, 0) AS allowed
    FROM systems s
    LEFT JOIN user_module_access uma
      ON uma.system_id = s.id
     AND uma.user_id = ?
    WHERE s.slug = ?
      AND s.slug <> 'roger'
      AND s.active = 1
  `).get(req.auth.id, slug);

  if (!module) {
    return res.status(404).json({
      ok: false,
      message: "Módulo não encontrado ou inativo",
    });
  }

  if (!admin && !module.allowed) {
    logEvent({
      userId: req.auth.id,
      event: "MODULO_NEGADO",
      detail: `Tentativa de acesso ao módulo ${module.name}`,
      ip: req.ip,
    });

    return res.status(403).json({
      ok: false,
      message: "Você não possui acesso liberado para este módulo",
    });
  }

  logEvent({
    userId: req.auth.id,
    event: "MODULO_ACESSADO",
    detail: `Acesso ao módulo ${module.name}`,
    ip: req.ip,
  });

  return res.json({
    ok: true,
    message: module.url
      ? "Acesso autorizado"
      : "Módulo liberado, mas ainda sem URL configurada",
    url: module.url || "",
    module: {
      id: module.id,
      name: module.name,
      slug: module.slug,
      description: module.description,
      url: module.url || "",
      icon: module.icon || "layers",
      color: module.color || "green",
      allowed: true,
    },
  });
}
