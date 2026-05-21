import { db } from "../database/db.js";

export function getDashboardSummary(req, res) {
  const users = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active
    FROM users
  `).get();

  const profiles = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active
    FROM profiles
  `).get();

  const systems = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active
    FROM systems
  `).get();

  const exceptions = db.prepare(`
    SELECT COUNT(*) AS total
    FROM user_permission_exceptions
  `).get();

  const recentLogs = db.prepare(`
    SELECT
      l.id,
      l.event,
      l.detail,
      l.ip,
      l.created_at,
      u.name AS user_name,
      u.login AS user_login
    FROM access_logs l
    LEFT JOIN users u ON u.id = l.user_id
    ORDER BY l.id DESC
    LIMIT 8
  `).all();

  const topAreas = [
    { name: "ROGER", total: Number(users.active || 0) + Number(profiles.active || 0) },
    { name: "Usuários", total: Number(users.total || 0) },
    { name: "Perfis", total: Number(profiles.total || 0) },
    { name: "Sistemas", total: Number(systems.total || 0) },
  ];

  res.json({
    ok: true,
    summary: {
      usersActive: Number(users.active || 0),
      usersTotal: Number(users.total || 0),
      profilesActive: Number(profiles.active || 0),
      profilesTotal: Number(profiles.total || 0),
      systemsActive: Number(systems.active || 0),
      systemsTotal: Number(systems.total || 0),
      exceptionsTotal: Number(exceptions.total || 0),
      authMode: "JWT",
    },
    topAreas,
    recentLogs: recentLogs.map((log) => ({
      id: log.id,
      event: log.event,
      detail: log.detail,
      ip: log.ip,
      createdAt: log.created_at,
      user: log.user_name || log.user_login || "Sistema",
    })),
  });
}
