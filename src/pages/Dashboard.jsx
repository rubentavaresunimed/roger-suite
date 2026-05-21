import { useEffect, useMemo, useState } from "react";
import { KeyRound, Layers, ShieldCheck, Users } from "lucide-react";

import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import ModuleCard from "../components/ModuleCard";

import { modules } from "../data/mockData";
import { api } from "../services/api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    api
      .getDashboardSummary()
      .then((data) => {
        setSummary(data.summary);
        setRecentLogs(data.recentLogs || []);
      })
      .catch(() => {
        setSummary(null);
        setRecentLogs([]);
      });
  }, []);

  const totalArea = useMemo(() => {
    if (!summary) return 0;

    return (
      Number(summary.usersActive || 0) +
      Number(summary.profilesActive || 0) +
      Number(summary.systemsActive || 0) +
      Number(summary.exceptionsTotal || 0)
    );
  }, [summary]);

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Visão geral do ROGER e da operação de acessos"
      />

      <section className="stats-grid">
        <StatCard
          icon={Users}
          label="Usuários ativos"
          value={summary ? summary.usersActive : "..."}
          description={`${summary ? summary.usersTotal : "..."} cadastrados`}
        />

        <StatCard
          icon={ShieldCheck}
          label="Perfis ativos"
          value={summary ? summary.profilesActive : "..."}
          description="Regras padrão"
        />

        <StatCard
          icon={Layers}
          label="Sistemas"
          value={summary ? summary.systemsActive : "..."}
          description="Módulos internos"
        />

        <StatCard
          icon={KeyRound}
          label="Exceções"
          value={summary ? summary.exceptionsTotal : "..."}
          description="Permissões por usuário"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel large">
          <div className="panel-header">
            <div>
              <h3>Resumo operacional</h3>
              <p>Dados reais do banco interno do ROGER</p>
            </div>

            <button>Atual</button>
          </div>

          <div className="donut-area">
            <div className="donut">
              <span>{totalArea || "..."}</span>
              <small>Registros</small>
            </div>

            <div className="legend">
              <p>
                <span className="dot green" /> Usuários{" "}
                <strong>{summary?.usersActive ?? "..."}</strong>
              </p>
              <p>
                <span className="dot gold" /> Perfis{" "}
                <strong>{summary?.profilesActive ?? "..."}</strong>
              </p>
              <p>
                <span className="dot blue" /> Sistemas{" "}
                <strong>{summary?.systemsActive ?? "..."}</strong>
              </p>
              <p>
                <span className="dot gray" /> Exceções{" "}
                <strong>{summary?.exceptionsTotal ?? "..."}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Logs recentes</h3>
              <p>Últimas operações reais registradas</p>
            </div>

            <button>Ver todos</button>
          </div>

          <div className="access-list">
            {recentLogs.slice(0, 5).map((item) => (
              <div className="access-item" key={item.id}>
                <div className="mini-avatar">{item.user[0]}</div>

                <div>
                  <strong>{item.user}</strong>
                  <p>{item.detail || item.event}</p>
                </div>

                <span>{item.event}</span>
                <small>{new Date(item.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</small>
              </div>
            ))}

            {recentLogs.length === 0 && (
              <p className="empty-state">Nenhum log encontrado ainda.</p>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Sistemas e módulos planejados</h3>
            <p>Ambiente centralizado para futuras integrações</p>
          </div>
        </div>

        <div className="modules-grid">
          {modules.map((module) => (
            <ModuleCard key={module.name} module={module} />
          ))}
        </div>
      </section>
    </>
  );
}
