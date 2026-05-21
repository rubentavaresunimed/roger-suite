import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const dbPath = process.env.DB_PATH || "backend/database/roger.sqlite";
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const now = () => new Date().toISOString();

function columnExists(table, column) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  return columns.some((item) => item.name === column);
}

function ensureColumn(table, column, definition) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cpf TEXT,
      email TEXT NOT NULL UNIQUE,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      profile_id INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS systems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(system_id, slug),
      FOREIGN KEY (system_id) REFERENCES systems(id)
    );

    CREATE TABLE IF NOT EXISTS profile_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      allowed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(profile_id, resource_id, action),
      FOREIGN KEY (profile_id) REFERENCES profiles(id),
      FOREIGN KEY (resource_id) REFERENCES resources(id)
    );

    CREATE TABLE IF NOT EXISTS user_permission_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      allowed INTEGER NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, resource_id, action),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (resource_id) REFERENCES resources(id)
    );

    CREATE TABLE IF NOT EXISTS user_module_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      system_id INTEGER NOT NULL,
      allowed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, system_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (system_id) REFERENCES systems(id)
    );

    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event TEXT NOT NULL,
      detail TEXT,
      ip TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  ensureColumn("systems", "url", "TEXT");
  ensureColumn("systems", "icon", "TEXT");
  ensureColumn("systems", "color", "TEXT");
}

function seedProfiles() {
  const existing = db.prepare("SELECT name FROM profiles").all().map((row) => row.name);
  const insert = db.prepare(`
    INSERT INTO profiles (name, description, active, created_at, updated_at)
    VALUES (?, ?, 1, ?, ?)
  `);

  const rows = [
    ["Administrador", "Acesso administrativo total ao ROGER"],
    ["Prestador", "Usuário prestador que acessa módulos liberados"],
    ["Gestor", "Gestão operacional e consultas avançadas"],
    ["Analista", "Consulta, cadastros e execução operacional"],
    ["Consulta", "Acesso somente leitura"],
  ];

  const tx = db.transaction(() => {
    rows.forEach(([name, description]) => {
      if (!existing.includes(name)) {
        insert.run(name, description, now(), now());
      }
    });
  });

  tx();
}

function seedSystemsAndResources() {
  const systemCount = db.prepare("SELECT COUNT(*) AS total FROM systems").get().total;

  if (systemCount === 0) {
    const insertSystem = db.prepare(`
      INSERT INTO systems
        (name, slug, description, active, created_at, updated_at, url, icon, color)
      VALUES
        (?, ?, ?, 1, ?, ?, ?, ?, ?)
    `);

    const insertResource = db.prepare(`
      INSERT INTO resources (system_id, name, slug, description, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `);

    const systems = [
      {
        name: "ROGER",
        slug: "roger",
        description: "Gerenciador central de usuários, prestadores, módulos e acessos",
        url: "",
        icon: "shield",
        color: "green",
        resources: [
          ["Dashboard", "dashboard", "Painel inicial do ROGER"],
          ["Usuários", "usuarios", "Cadastro e gestão de usuários/prestadores"],
          ["Perfis", "perfis", "Cadastro e gestão de perfis"],
          ["Sistemas", "sistemas", "Cadastro e gestão de módulos"],
          ["Acessos", "acessos", "Liberação de módulos por prestador"],
          ["Logs", "logs", "Auditoria de acessos e operações"],
          ["Módulos", "modulos", "Portal de acesso aos módulos liberados"],
        ],
      },
      {
        name: "COSTA",
        slug: "costa",
        description: "Conferência de contas, validações de autorização, pendências e liberação para faturamento",
        url: "internal:costa",
        icon: "file-text",
        color: "green",
        resources: [["Acesso ao COSTA", "acesso", "Entrada no módulo COSTA"]],
      },
      {
        name: "ÁUREA",
        slug: "aurea",
        description: "Módulo futuro de indicadores e relatórios",
        url: "",
        icon: "bar-chart",
        color: "gold",
        resources: [["Acesso ao ÁUREA", "acesso", "Entrada no módulo ÁUREA"]],
      },
      {
        name: "DAVI",
        slug: "davi",
        description: "Módulo futuro de automações",
        url: "",
        icon: "activity",
        color: "green",
        resources: [["Acesso ao DAVI", "acesso", "Entrada no módulo DAVI"]],
      },
      {
        name: "PEDRO",
        slug: "pedro",
        description: "Módulo futuro",
        url: "",
        icon: "database",
        color: "blue",
        resources: [["Acesso ao PEDRO", "acesso", "Entrada no módulo PEDRO"]],
      },
      {
        name: "TEODORO",
        slug: "teodoro",
        description: "Módulo futuro de gestão financeira e orçamentária",
        url: "",
        icon: "wallet",
        color: "gold",
        resources: [["Acesso ao TEODORO", "acesso", "Entrada no módulo TEODORO"]],
      },
      {
        name: "ROMEU",
        slug: "romeu",
        description: "Módulo futuro de relatórios operacionais e monitoramento",
        url: "",
        icon: "file-text",
        color: "gray",
        resources: [["Acesso ao ROMEU", "acesso", "Entrada no módulo ROMEU"]],
      },
    ];

    const tx = db.transaction(() => {
      systems.forEach((system) => {
        const result = insertSystem.run(
          system.name,
          system.slug,
          system.description,
          now(),
          now(),
          system.url,
          system.icon,
          system.color
        );
        const systemId = result.lastInsertRowid;

        system.resources.forEach(([name, slug, description]) => {
          insertResource.run(systemId, name, slug, description, now(), now());
        });
      });
    });

    tx();
    return;
  }

  const roger = db.prepare("SELECT id FROM systems WHERE slug = ?").get("roger");
  const requiredRogerResources = [
    ["Perfis", "perfis", "Cadastro e gestão de perfis"],
    ["Acessos", "acessos", "Liberação de módulos por prestador"],
    ["Módulos", "modulos", "Portal de acesso aos módulos liberados"],
  ];

  if (roger) {
    const insertIgnore = db.prepare(`
      INSERT OR IGNORE INTO resources
        (system_id, name, slug, description, active, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, 1, ?, ?)
    `);

    requiredRogerResources.forEach(([name, slug, description]) => {
      insertIgnore.run(roger.id, name, slug, description, now(), now());
    });
  }

  const costa = db.prepare("SELECT id FROM systems WHERE slug = ?").get("costa");

  if (!costa) {
    const result = db.prepare(`
      INSERT INTO systems
        (name, slug, description, active, created_at, updated_at, url, icon, color)
      VALUES
        (?, ?, ?, 1, ?, ?, ?, ?, ?)
    `).run(
      "COSTA",
      "costa",
      "Conferência de contas, validações de autorização, pendências e liberação para faturamento",
      now(),
      now(),
      "internal:costa",
      "file-text",
      "green"
    );

    db.prepare(`
      INSERT OR IGNORE INTO resources
        (system_id, name, slug, description, active, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, 1, ?, ?)
    `).run(
      result.lastInsertRowid,
      "Acesso ao COSTA",
      "acesso",
      "Entrada no módulo COSTA",
      now(),
      now()
    );
  } else {
    db.prepare(`
      INSERT OR IGNORE INTO resources
        (system_id, name, slug, description, active, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, 1, ?, ?)
    `).run(
      costa.id,
      "Acesso ao COSTA",
      "acesso",
      "Entrada no módulo COSTA",
      now(),
      now()
    );
  }

  const defaults = [
    ["roger", "", "shield", "green"],
    ["costa", "internal:costa", "file-text", "green"],
    ["aurea", "", "bar-chart", "gold"],
    ["davi", "", "activity", "green"],
    ["pedro", "", "database", "blue"],
    ["teodoro", "", "wallet", "gold"],
    ["romeu", "", "file-text", "gray"],
  ];

  const update = db.prepare(`
    UPDATE systems
    SET url = COALESCE(url, ?),
        icon = COALESCE(icon, ?),
        color = COALESCE(color, ?),
        updated_at = ?
    WHERE slug = ?
  `);

  defaults.forEach(([slug, url, icon, color]) => {
    update.run(url, icon, color, now(), slug);
  });
}

function seedUsers() {
  const count = db.prepare("SELECT COUNT(*) AS total FROM users").get().total;
  if (count > 0) return;

  const adminProfile = db.prepare("SELECT id FROM profiles WHERE name = ?").get("Administrador");
  const prestadorProfile = db.prepare("SELECT id FROM profiles WHERE name = ?").get("Prestador");
  const gestorProfile = db.prepare("SELECT id FROM profiles WHERE name = ?").get("Gestor");
  const analistaProfile = db.prepare("SELECT id FROM profiles WHERE name = ?").get("Analista");

  const insert = db.prepare(`
    INSERT INTO users
      (name, cpf, email, login, password_hash, profile_id, active, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminHash = bcrypt.hashSync("admin", 10);
  const defaultHash = bcrypt.hashSync("123456", 10);

  const rows = [
    ["Administrador", "", "admin@roger.local", "admin", adminHash, adminProfile.id, 1],
    ["Dr. Prestador Teste", "000.000.000-01", "prestador@roger.local", "prestador", defaultHash, prestadorProfile.id, 1],
    ["Mariana Souza", "000.000.000-02", "mariana.souza@empresa.com.br", "mariana.souza", defaultHash, gestorProfile.id, 1],
    ["Carlos Nascimento", "000.000.000-03", "carlos.nascimento@empresa.com.br", "carlos.nascimento", defaultHash, analistaProfile.id, 1],
  ];

  const tx = db.transaction(() => {
    rows.forEach((row) => insert.run(...row, now(), now()));
  });

  tx();
}

function seedProfilePermissions() {
  const profiles = db.prepare("SELECT id, name FROM profiles").all();
  const resources = db.prepare(`
    SELECT r.id, r.slug AS resource_slug, s.slug AS system_slug
    FROM resources r
    JOIN systems s ON s.id = r.system_id
  `).all();

  const insertIgnore = db.prepare(`
    INSERT OR IGNORE INTO profile_permissions
      (profile_id, resource_id, action, allowed, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?)
  `);

  const actions = ["visualizar", "incluir", "alterar", "excluir", "administrar"];

  const can = (profileName, systemSlug, resourceSlug, action) => {
    if (profileName === "Administrador") return true;

    if (profileName === "Prestador") {
      return systemSlug === "roger" && ["dashboard", "modulos"].includes(resourceSlug) && action === "visualizar";
    }

    if (profileName === "Gestor") {
      if (systemSlug === "roger") {
        return ["dashboard", "usuarios", "sistemas", "logs", "modulos"].includes(resourceSlug)
          && ["visualizar", "incluir", "alterar"].includes(action);
      }
      return false;
    }

    if (profileName === "Analista") {
      if (systemSlug === "roger") {
        return ["dashboard", "usuarios", "logs", "modulos"].includes(resourceSlug)
          && ["visualizar", "incluir", "alterar"].includes(action);
      }
      return false;
    }

    if (profileName === "Consulta") {
      return systemSlug === "roger" && ["dashboard", "modulos"].includes(resourceSlug) && action === "visualizar";
    }

    return false;
  };

  const tx = db.transaction(() => {
    profiles.forEach((profile) => {
      resources.forEach((resource) => {
        actions.forEach((action) => {
          insertIgnore.run(
            profile.id,
            resource.id,
            action,
            can(profile.name, resource.system_slug, resource.resource_slug, action) ? 1 : 0,
            now(),
            now()
          );
        });
      });
    });
  });

  tx();
}

function seedModuleAccess() {
  const users = db.prepare(`
    SELECT u.id, p.name AS profile_name
    FROM users u
    LEFT JOIN profiles p ON p.id = u.profile_id
  `).all();

  const systems = db.prepare(`
    SELECT id, slug FROM systems WHERE slug <> 'roger'
  `).all();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO user_module_access
      (user_id, system_id, allowed, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    users.forEach((user) => {
      systems.forEach((system) => {
        const allowed =
          user.profile_name === "Administrador" ||
          (["Gestor", "Analista"].includes(user.profile_name) && system.slug === "costa") ||
          (user.profile_name === "Prestador" && ["aurea", "davi"].includes(system.slug));

        insert.run(user.id, system.id, allowed ? 1 : 0, now(), now());
      });
    });
  });

  tx();
}

export function logEvent({ userId = null, event, detail = "", ip = "" }) {
  db.prepare(`
    INSERT INTO access_logs (user_id, event, detail, ip, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, event, detail, ip, now());
}

export function initDatabase() {
  createTables();
  seedProfiles();
  seedSystemsAndResources();
  seedUsers();
  seedProfilePermissions();
  seedModuleAccess();
}
