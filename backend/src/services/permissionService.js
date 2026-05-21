import { db } from "../database/db.js";

export const ACTIONS = ["visualizar", "incluir", "alterar", "excluir", "administrar"];

export function getUserById(userId) {
  return db.prepare(`
    SELECT u.*, p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
    WHERE u.id = ?
  `).get(userId);
}

export function getEffectivePermissions(userId) {
  const user = getUserById(userId);

  if (!user) {
    return [];
  }

  const resources = db.prepare(`
    SELECT
      r.id,
      r.name AS resource_name,
      r.slug AS resource_slug,
      s.name AS system_name,
      s.slug AS system_slug
    FROM resources r
    JOIN systems s ON s.id = r.system_id
    WHERE r.active = 1 AND s.active = 1
    ORDER BY s.id, r.id
  `).all();

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

      const adminBypass = user.profile_name === "Administrador";
      const profileAllowed = adminBypass || (profilePermission ? Boolean(profilePermission.allowed) : false);
      const hasException = Boolean(exception);
      const allowed = adminBypass ? true : hasException ? Boolean(exception.allowed) : profileAllowed;

      permissions.push({
        resourceId: resource.id,
        system: resource.system_name,
        systemSlug: resource.system_slug,
        resource: resource.resource_name,
        resourceSlug: resource.resource_slug,
        action,
        profileAllowed,
        hasException,
        exceptionAllowed: hasException ? Boolean(exception.allowed) : null,
        allowed,
        source: adminBypass ? "administrador" : hasException ? "usuario" : "perfil",
        reason: hasException ? exception.reason : "",
      });
    });
  });

  return permissions;
}

export function canUser(userId, systemSlug, resourceSlug, action = "visualizar") {
  const user = getUserById(userId);

  if (user?.profile_name === "Administrador") {
    return true;
  }

  const permissions = getEffectivePermissions(userId);

  return permissions.some(
    (permission) =>
      permission.systemSlug === systemSlug &&
      permission.resourceSlug === resourceSlug &&
      permission.action === action &&
      permission.allowed
  );
}

export function buildPermissionMap(userId) {
  const permissions = getEffectivePermissions(userId);
  const map = {};

  permissions.forEach((permission) => {
    const key = `${permission.systemSlug}.${permission.resourceSlug}.${permission.action}`;
    map[key] = permission.allowed;
  });

  return {
    list: permissions,
    map,
  };
}
