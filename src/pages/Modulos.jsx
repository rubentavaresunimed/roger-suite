import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  Database,
  ExternalLink,
  FileText,
  Layers,
  LockKeyhole,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import Topbar from "../components/Topbar";
import { api } from "../services/api";

const ICONS = {
  shield: ShieldCheck,
  "bar-chart": BarChart3,
  activity: Activity,
  database: Database,
  wallet: Wallet,
  "file-text": FileText,
  layers: Layers,
};

export default function Modulos() {
  const [modules, setModules] = useState([]);
  const [message, setMessage] = useState("");

  async function loadModules() {
    const data = await api.listModules();
    setModules(data.modules || []);
  }

  useEffect(() => {
    loadModules().catch((err) => setMessage(err.message));
  }, []);

  const stats = useMemo(() => {
    return {
      total: modules.length,
      allowed: modules.filter((module) => module.canAccess).length,
      configured: modules.filter((module) => module.url).length,
    };
  }, [modules]);

  async function handleAccess(module) {
    setMessage("");

    try {
      const data = await api.accessModule(module.slug);

      if (!data.url) {
        setMessage(
          `${module.name} está liberado para você, mas ainda não possui URL configurada. Configure em Sistemas.`
        );
        return;
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <Topbar
        title="Módulos"
        subtitle="Portal central de entrada para os sistemas integrados"
      />

      <section className="module-hero">
        <div>
          <span>Ecossistema ROGER</span>
          <h2>Controle central, módulos independentes.</h2>
          <p>
            O ROGER libera o acesso conforme perfil e exceções por usuário.
            Cada módulo pode ter sua própria URL, mas a entrada fica centralizada aqui.
          </p>
        </div>

        <div className="module-hero-stats">
          <div>
            <strong>{stats.total}</strong>
            <span>Módulos</span>
          </div>
          <div>
            <strong>{stats.allowed}</strong>
            <span>Liberados</span>
          </div>
          <div>
            <strong>{stats.configured}</strong>
            <span>Com URL</span>
          </div>
        </div>
      </section>

      {message && <div className="form-info">{message}</div>}

      <section className="module-portal-grid">
        {modules.map((module) => {
          const Icon = ICONS[module.icon] || Boxes;

          return (
            <article
              className={`module-portal-card ${module.color || "green"} ${
                !module.canAccess ? "locked" : ""
              }`}
              key={module.slug}
            >
              <div className="module-card-topline">
                <div className="module-portal-icon">
                  <Icon size={28} />
                </div>

                <span className={`status ${module.canAccess ? "ok" : "soon"}`}>
                  {module.canAccess ? "Liberado" : "Bloqueado"}
                </span>
              </div>

              <h3>{module.name}</h3>
              <p>{module.description}</p>

              <div className="module-url-status">
                {module.url ? (
                  <>
                    <ExternalLink size={15} />
                    URL configurada
                  </>
                ) : (
                  <>
                    <LockKeyhole size={15} />
                    Aguardando URL
                  </>
                )}
              </div>

              <button
                className="primary-small"
                disabled={!module.canAccess}
                onClick={() => handleAccess(module)}
              >
                {module.canAccess ? "Acessar módulo" : "Sem permissão"}
              </button>
            </article>
          );
        })}
      </section>
    </>
  );
}
