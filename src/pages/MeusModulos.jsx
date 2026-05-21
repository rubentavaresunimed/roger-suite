import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  Database,
  DoorOpen,
  ExternalLink,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { api } from "../services/api";

const ICONS = {
  shield: ShieldCheck,
  "bar-chart": BarChart3,
  activity: Activity,
  database: Database,
  wallet: Wallet,
  "file-text": FileText,
  layers: Boxes,
};

export default function MeusModulos({ user, onLogout, onOpenModule }) {
  const [modules, setModules] = useState([]);
  const [message, setMessage] = useState("");

  async function loadModules() {
    const data = await api.listMyModules();
    setModules(data.modules || []);
  }

  useEffect(() => {
    loadModules().catch((err) => setMessage(err.message));
  }, []);

  async function handleAccess(module) {
    setMessage("");

    try {
      const data = await api.accessMyModule(module.slug);

      if (!data.url) {
        setMessage(
          `${module.name} está liberado para você, mas ainda não possui URL configurada.`
        );
        return;
      }

      onOpenModule({
        ...module,
        url: data.url,
      });
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <section className="prestador-topbar-clean">
        <div className="prestador-topbar-title">
          <h1>Meus Módulos</h1>
          <p>Escolha o sistema que deseja acessar</p>
        </div>

        <div className="prestador-topbar-user">
          <div className="prestador-user-chip">
            <strong>{user?.login || user?.name || "Usuário"}</strong>
            <span>{user?.profile || "Prestador"}</span>
          </div>

          <button className="logout-top-button" onClick={onLogout}>
            <DoorOpen size={16} />
            Sair
          </button>
        </div>
      </section>

      <section className="prestador-hero prestador-hero-centered">
        <div className="prestador-hero-content-center">
          <span>Bem-vindo ao ROGER</span>
          <h2>{user?.name || "Usuário"}</h2>
          <p>
            Use o menu lateral para entrar nos módulos liberados. Eles serão
            abertos dentro do próprio ROGER, mantendo a navegação centralizada.
          </p>
        </div>
      </section>

      {message && <div className="form-info">{message}</div>}

      <section className="module-portal-grid">
        {modules.map((module) => {
          const Icon = ICONS[module.icon] || Boxes;

          return (
            <article
              className={`module-portal-card ${module.color || "green"} ${
                !module.allowed ? "locked" : ""
              }`}
              key={module.slug}
            >
              <div className="module-card-topline">
                <div className="module-portal-icon">
                  <Icon size={28} />
                </div>

                <span className={`status ${module.allowed ? "ok" : "soon"}`}>
                  {module.allowed ? "Liberado" : "Bloqueado"}
                </span>
              </div>

              <h3>{module.name}</h3>
              <p>{module.description}</p>

              <div className="module-url-status">
                {module.url ? (
                  <>
                    <ExternalLink size={15} />
                    Abre dentro do ROGER
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
                disabled={!module.allowed}
                onClick={() => handleAccess(module)}
              >
                {module.allowed ? "Entrar no módulo" : "Sem acesso"}
              </button>
            </article>
          );
        })}
      </section>
    </>
  );
}
