import { db, logEvent } from "../database/db.js";

const ACTIONS = ["visualizar", "incluir", "alterar", "excluir", "administrar"];

function getResources() {
  return db.prepare(`
    SELECT
      r.id,
      r.name,
      r.slug,
      r.description,
      s.id AS system_id,
      s.name AS system_name,
      s.slug AS system_slug
    FROM resources r
    JOIN systems s ON s.id = r.system_id
    ORDER BY s.id, r.id
  `).all();
}

export function listPermissionCatalog(req, res) {
  const systems = db.prepare(`
    SELECT * FROM systems ORDER BY id
  `).all();

  const resources = getResources();

  res.json({
    ok: true,
    actions: ACTIONS,
    systems: systems.map((system) => ({
      id: system.id,
      name: system.name,
      slug: system.slug,
      description: system.description,
      active: Boolean(system.active),
      resources: resources
        .filter((resource) => resource.system_id === system.id)
        .map((resource) => ({
          id: resource.id,
          name: resource.name,
          slug: resource.slug,
          description: resource.description,
        })),
    })),
  });
}

export function getProfilePermissions(req, res) {
  const { profileId } = req.params;

  const rows = db.prepare(`
    SELECT
      pp.profile_id,
      pp.resource_id,
      pp.action,
      pp.allowed,
      r.name AS resource_name,
      r.slug AS resource_slug,
      s.name AS system_name,
      s.slug AS system_slug
    FROM profile_permissions pp
    JOIN resources r ON r.id = pp.resource_id
    JOIN systems s ON s.id = r.system_id
    WHERE pp.profile_id = ?
    ORDER BY s.id, r.id, pp.action
  `).all(profileId);

  res.json({
    ok: true,
    permissions: rows.map((row) => ({
      profileId: row.profile_id,
      resourceId: row.resource_id,
      action: row.action,
      allowed: Boolean(row.allowed),
      resource: row.resource_name,
      resourceSlug: row.resource_slug,
      system: row.system_name,
      systemSlug: row.system_slug,
    })),
  });
}

export function saveProfilePermissions(req, res) {
  const { profileId } = req.params;
  const { permissions = [] } = req.body || {};

  if (!Array.isArray(permissions)) {
    return res.status(400).json({
      ok: false,
      message: "Permissões devem ser uma lista",
    });
  }

  const date = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO profile_permissions
      (profile_id, resource_id, action, allowed, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?)
    ON CONFLICT(profile_id, resource_id, action)
    DO UPDATE SET
      allowed = excluded.allowed,
      updated_at = excluded.updated_at
  `);

  const tx = db.transaction(() => {
    permissions.forEach((permission) => {
      if (!permission.resourceId || !permission.action) return;
      upsert.run(
        profileId,
        permission.resourceId,
        permission.action,
        permission.allowed ? 1 : 0,
        date,
        date
      );
    });
  });

  tx();

  logEvent({
    userId: req.auth?.id,
    event: "PERMISSAO_PERFIL_ATUALIZADA",
    detail: `Perfil ${profileId} atualizado`,
    ip: req.ip,
  });

  res.json({
    ok: true,
    message: "Permissões do perfil salvas com sucesso",
  });
}

export function getUserEffectivePermissions(req, res) {
  const { userId } = req.params;

  const user = db.prepare(`
    SELECT id, profile_id FROM users WHERE id = ?
  `).get(userId);

  if (!user) {
    return res.status(404).json({
      ok: false,
      message: "Usuário não encontrado",
    });
  }

  const resources = getResources();

  const profileRows = db.prepare(`
    SELECT resource_id, action, allowed
    FROM profile_permissions
    WHERE profile_id = ?
  `).all(user.profile_id);

  const exceptionRows = db.prepare(`
    SELECT resource_id, action, allowed, reason
    FROM user_permission_exceptions
    WHERE user_id = ?
  `).all(userId);

  const profileMap = new Map(
    profileRows.map((row) => [`${row.resource_id}:${row.action}`, row])
  );

  const exceptionMap = new Map(
    exceptionRows.map((row) => [`${row.resource_id}:${row.action}`, row])
  );

  const permissions = [];

  resources.forEach((resource) => {
    ACTIONS.forEach((action) => {
      const key = `${resource.id}:${action}`;
      const profilePermission = profileMap.get(key);
      const exception = exceptionMap.get(key);

      const profileAllowed = profilePermission ? Boolean(profilePermission.allowed) : false;
      const hasException = Boolean(exception);
      const finalAllowed = hasException ? Boolean(exception.allowed) : profileAllowed;

      permissions.push({
        userId: Number(userId),
        resourceId: resource.id,
        action,
        system: resource.system_name,
        systemSlug: resource.system_slug,
        resource: resource.name,
        resourceSlug: resource.slug,
        profileAllowed,
        hasException,
        exceptionAllowed: hasException ? Boolean(exception.allowed) : null,
        reason: hasException ? exception.reason : "",
        allowed: finalAllowed,
        source: hasException ? "usuario" : "perfil",
      });
    });
  });

  res.json({
    ok: true,
    permissions,
  });
}

export function saveUserExceptions(req, res) {
  const { userId } = req.params;
  const { exceptions = [] } = req.body || {};

  if (!Array.isArray(exceptions)) {
    return res.status(400).json({
      ok: false,
      message: "Exceções devem ser uma lista",
    });
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);

  if (!user) {
    return res.status(404).json({
      ok: false,
      message: "Usuário não encontrado",
    });
  }

  const date = new Date().toISOString();

  const deleteException = db.prepare(`
    DELETE FROM user_permission_exceptions
    WHERE user_id = ? AND resource_id = ? AND action = ?
  `);

  const upsert = db.prepare(`
    INSERT INTO user_permission_exceptions
      (user_id, resource_id, action, allowed, reason, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, resource_id, action)
    DO UPDATE SET
      allowed = excluded.allowed,
      reason = excluded.reason,
      updated_at = excluded.updated_at
  `);

  const tx = db.transaction(() => {
    exceptions.forEach((exception) => {
      if (!exception.resourceId || !exception.action) return;

      if (exception.clear) {
        deleteException.run(userId, exception.resourceId, exception.action);
        return;
      }

      upsert.run(
        userId,
        exception.resourceId,
        exception.action,
        exception.allowed ? 1 : 0,
        exception.reason || "",
        date,
        date
      );
    });
  });

  tx();

  logEvent({
    userId: req.auth?.id,
    event: "EXCECAO_USUARIO_ATUALIZADA",
    detail: `Exceções do usuário ${userId} atualizadas`,
    ip: req.ip,
  });

  res.json({
    ok: true,
    message: "Exceções do usuário salvas com sucesso",
  });
}
