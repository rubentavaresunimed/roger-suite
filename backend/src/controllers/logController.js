import { db } from "../database/db.js";

export function listLogs(req, res) {
  const rows = db.prepare(`
    SELECT
      l.id,
      l.user_id,
      l.event,
      l.detail,
      l.ip,
      l.created_at,
      u.name AS user_name,
      u.login AS user_login
    FROM access_logs l
    LEFT JOIN users u ON u.id = l.user_id
    ORDER BY l.id DESC
    LIMIT 200
  `).all();

  res.json({
    ok: true,
    logs: rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      user: row.user_name || row.user_login || "Sistema",
      event: row.event,
      detail: row.detail,
      ip: row.ip,
      createdAt: row.created_at,
    })),
  });
}
