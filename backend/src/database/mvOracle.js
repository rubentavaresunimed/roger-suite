import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import oracledb from "oracledb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const backendRoot = path.resolve(__dirname, "../..");

// Carrega .env da raiz e do backend, sem depender da pasta em que o npm foi iniciado.
dotenv.config({ path: path.join(projectRoot, ".env"), override: false });
dotenv.config({ path: path.join(backendRoot, ".env"), override: false });
dotenv.config({ override: false });

let pool = null;
let oracleClientInitialized = false;
let oracleClientMode = "thin";
let oracleClientWarning = "";

function firstEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function normalizeWindowsPath(value) {
  if (!value) return "";
  return value.replace(/^"|"$/g, "").trim();
}

function buildConnectString() {
  const explicitConnectString = firstEnv(
    "MV_ORACLE_CONNECT_STRING",
    "ORACLE_CONNECT_STRING",
    "ORACLE_CONNECTION_STRING",
    "ORA_CONNECT_STRING",
    "DB_CONNECT_STRING",
    "DB_CONNECTION_STRING",
    "MV_DB_CONNECT_STRING",
    "MV_CONNECT_STRING"
  );

  if (explicitConnectString) return explicitConnectString;

  const host = firstEnv("MV_ORACLE_HOST", "ORACLE_HOST", "DB_HOST", "MV_DB_HOST");
  const port = firstEnv("MV_ORACLE_PORT", "ORACLE_PORT", "DB_PORT", "MV_DB_PORT") || "1521";
  const serviceName = firstEnv(
    "MV_ORACLE_SERVICE_NAME",
    "ORACLE_SERVICE_NAME",
    "DB_SERVICE_NAME",
    "MV_DB_SERVICE_NAME",
    "ORACLE_SERVICE",
    "DB_SERVICE"
  );

  if (host && port && serviceName) {
    return `${host}:${port}/${serviceName}`;
  }

  return "";
}

function getMvConfig() {
  return {
    user: firstEnv(
      "MV_ORACLE_USER",
      "ORACLE_USER",
      "ORA_USER",
      "DB_USER",
      "DB_USERNAME",
      "MV_DB_USER",
      "MV_USER"
    ),
    password: firstEnv(
      "MV_ORACLE_PASSWORD",
      "ORACLE_PASSWORD",
      "ORA_PASSWORD",
      "DB_PASSWORD",
      "DB_PASS",
      "MV_DB_PASSWORD",
      "MV_PASSWORD"
    ),
    connectString: buildConnectString(),
    clientLibDir: normalizeWindowsPath(
      firstEnv("ORACLE_CLIENT_LIB_DIR", "INSTANT_CLIENT_DIR", "ORACLE_INSTANT_CLIENT", "OCI_LIB_DIR")
    ),
    forceThick: firstEnv("ORACLE_FORCE_THICK", "MV_ORACLE_FORCE_THICK") !== "false",
    poolMin: Number(firstEnv("MV_ORACLE_POOL_MIN", "ORACLE_POOL_MIN") || 0),
    poolMax: Number(firstEnv("MV_ORACLE_POOL_MAX", "ORACLE_POOL_MAX") || 4),
  };
}

function windowsInstantClientCandidates() {
  const candidates = [
    // 1) Valor informado no .env. Este é o principal.
    getMvConfig().clientLibDir,

    // 2) Pasta dentro do próprio projeto. Se quiser evitar configurar path,
    // copie a pasta do Instant Client para C:\Sistemas\roger-suite\instantclient.
    path.join(projectRoot, "instantclient"),
    path.join(projectRoot, "instantclient_23_8"),
    path.join(projectRoot, "instantclient_21_13"),
    path.join(projectRoot, "instantclient_19_25"),
    path.join(backendRoot, "instantclient"),

    // 3) Locais comuns no Windows.
    "C:\\instantclient",
    "C:\\instantclient_23_8",
    "C:\\instantclient_23_7",
    "C:\\instantclient_21_13",
    "C:\\instantclient_21_12",
    "C:\\instantclient_19_25",
    "C:\\instantclient_19_23",
    "C:\\oracle\\instantclient",
    "C:\\oracle\\instantclient_23_8",
    "C:\\oracle\\instantclient_21_13",
    "C:\\oracle\\instantclient_19_25",
    "C:\\Sistemas\\instantclient",
    "C:\\Sistemas\\instantclient_23_8",
    "C:\\Sistemas\\instantclient_21_13",
    "C:\\Sistemas\\instantclient_19_25",
    "C:\\app\\instantclient_21_13",
    "C:\\app\\instantclient_19_25",
  ].filter(Boolean);

  return [...new Set(candidates)];
}

function looksLikeClientDir(dir) {
  if (!dir) return false;
  try {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function initThickModeIfPossible() {
  if (oracleClientInitialized) return;
  oracleClientInitialized = true;

  const config = getMvConfig();
  if (!config.forceThick) {
    oracleClientMode = "thin";
    return;
  }

  const attempts = [];

  for (const dir of windowsInstantClientCandidates()) {
    if (!looksLikeClientDir(dir)) continue;
    try {
      oracledb.initOracleClient({ libDir: dir });
      oracleClientMode = "thick";
      console.log(`[MV] Oracle Client inicializado em Thick Mode: ${dir}`);
      return;
    } catch (error) {
      attempts.push(`${dir}: ${error.message}`);
    }
  }

  try {
    // Tenta usar Oracle Client disponível no PATH/instalação padrão.
    oracledb.initOracleClient();
    oracleClientMode = "thick";
    console.log("[MV] Oracle Client inicializado em Thick Mode usando PATH/instalação padrão.");
    return;
  } catch (error) {
    attempts.push(`PATH: ${error.message}`);
  }

  oracleClientMode = "thin";
  oracleClientWarning = attempts.join(" | ");
  console.warn("[MV] Não foi possível ativar Thick Mode. Tentando Thin Mode.", oracleClientWarning);
}

export function getMvStatus() {
  const config = getMvConfig();
  return {
    configured: Boolean(config.user && config.password && config.connectString),
    user: config.user,
    connectString: config.connectString,
    clientMode: oracleClientMode,
    clientWarning: oracleClientWarning,
    hasClientLibDir: Boolean(config.clientLibDir),
  };
}

export function isMvConfigured() {
  return getMvStatus().configured;
}

export function isMvOracleConfigured() {
  return isMvConfigured();
}

function decorateOracleError(error) {
  const message = String(error?.message || error || "Erro desconhecido ao consultar Oracle/MV");

  if (message.includes("NJS-116") || message.includes("password verifier type")) {
    return new Error(
      "O MV/Oracle exige node-oracledb em Thick Mode por causa do tipo de senha do banco. " +
        "Instale/aponte o Oracle Instant Client Basic 19/21/23 e preencha ORACLE_CLIENT_LIB_DIR no .env. " +
        `Modo atual: ${oracleClientMode}. Erro original: ${message}`
    );
  }

  if (message.includes("DPI-1047")) {
    return new Error(
      "Oracle Client não localizado para Thick Mode. Instale o Oracle Instant Client Basic e configure ORACLE_CLIENT_LIB_DIR no .env. " +
        `Erro original: ${message}`
    );
  }

  return error;
}

export async function getMvConnection() {
  const config = getMvConfig();

  if (!config.user || !config.password || !config.connectString) {
    throw new Error(
      "Configuração do MV não encontrada. Confirme ORACLE_HOST, ORACLE_PORT, ORACLE_SERVICE_NAME, ORACLE_USER e ORACLE_PASSWORD no .env da raiz ou em backend/.env."
    );
  }

  initThickModeIfPossible();
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

  try {
    if (!pool) {
      pool = await oracledb.createPool({
        user: config.user,
        password: config.password,
        connectString: config.connectString,
        poolMin: config.poolMin,
        poolMax: config.poolMax,
        poolIncrement: 1,
      });
    }

    return await pool.getConnection();
  } catch (error) {
    throw decorateOracleError(error);
  }
}

export async function executeMv(sql, binds = {}, options = {}) {
  let connection;

  try {
    connection = await getMvConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: false,
      ...options,
    });

    return result;
  } catch (error) {
    throw decorateOracleError(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function executeMvQuery(sql, binds = {}, options = {}) {
  const result = await executeMv(sql, binds, options);
  return result.rows || [];
}
