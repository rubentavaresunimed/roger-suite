import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { initDatabase } from "./database/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import moduleAccessRoutes from "./routes/moduleAccessRoutes.js";
import costaRoutes from "./routes/costaRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: false });
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: false });
dotenv.config({ override: false });

const app = express();
const PORT = process.env.PORT || 3001;

initDatabase();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "ROGER",
    message: "Backend do ROGER rodando",
    mode: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/systems", systemRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/module-access", moduleAccessRoutes);
app.use("/api/costa", costaRoutes);

const distPath = path.resolve("dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error("[ROGER][ERRO]", err);
  res.status(500).json({
    ok: false,
    message: "Erro interno no servidor",
    detail: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ROGER backend rodando em http://0.0.0.0:${PORT}`);

  if (fs.existsSync(distPath)) {
    console.log(`Frontend de produção servido a partir de: ${distPath}`);
  }
});
