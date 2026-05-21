import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Home,
  KeyRound,
  Layers,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import rogerLogo from "../assets/roger-logo.png";
import { api } from "../services/api";

function can(user, key) {
  return Boolean(user?.permissions?.[key]);
}

const ICONS = {
  shield: ShieldCheck,
  "bar-chart": BarChart3,
  activity: Activity,
  database: Database,
  wallet: Wallet,
  "file-text": FileText,
  layers: Layers,
};

export default function Sidebar({
  activePage,
  setActivePage,
  user,
  collapsed,
  onToggleCollapsed,
  onOpenModule,
}) {
  const [modules, setModules] = useState([]);
  const [moduleMessage, setModuleMessage] = useState("");

  const isAdmin = user?.profile === "Administrador";

  const menu = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      permission: "roger.dashboard.visualizar",
      adminOnly: true,
    },
    {
      id: "modulos",
      label: "Meus Módulos",
      icon: Boxes,
      permission: null,
    },
    {
      id: "usuarios",
      label: "Usuários/Prestadores",
      icon: Users,
      permission: "roger.usuarios.visualizar",
      adminOnly: true,
    },
    {
      id: "perfis",
      label: "Perfis",
      icon: ShieldCheck,
      permission: "roger.perfis.visualizar",
      adminOnly: true,
    },
    {
      id: "sistemas",
      label: "Sistemas/Módulos",
      icon: Layers,
      permission: "roger.sistemas.visualizar",
      adminOnly: true,
    },
    {
      id: "acessos",
      label: "Acessos",
      icon: KeyRound,
      permission: "roger.acessos.visualizar",
      adminOnly: true,
    },
    {
      id: "logs",
      label: "Logs",
      icon: FileText,
      permission: "roger.logs.visualizar",
      adminOnly: true,
    },
  ];

  const visibleMenu = menu.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!item.permission) return true;
    return can(user, item.permission);
  });

  async function loadModules() {
    try {
      const data = await api.listMyModules();
      setModules((data.modules || []).filter((module) => module.allowed));
    } catch {
      setModules([]);
    }
  }

  useEffect(() => {
    loadModules();
  }, [user?.id]);

  async function handleModuleClick(module) {
    setModuleMessage("");

    try {
      const data = await api.accessMyModule(module.slug);

      if (!data.url) {
        setModuleMessage(`${module.name} ainda não possui URL configurada.`);
        setActivePage("modulos");
        return;
      }

      onOpenModule({
        ...module,
        url: data.url,
      });
    } catch (err) {
      setModuleMessage(err.message);
    }
  }

  return (
    <aside className={`sidebar sidebar-with-toggle ${collapsed ? "collapsed" : ""}`}>
      <button className="sidebar-collapse-button" onClick={onToggleCollapsed}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="brand brand-modern">
        <div className="brand-logo-wrap">
          <img src={rogerLogo} alt="Logo ROGER" className="brand-logo-img" />
        </div>

        {!collapsed && (
          <div className="brand-text">
            <h1>ROGER</h1>
            <p>Portal de acesso aos módulos</p>
          </div>
        )}
      </div>

      <nav className="nav">
        {visibleMenu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
              title={collapsed ? item.label : ""}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-module-list">
        {!collapsed && <span className="sidebar-module-title">Módulos liberados</span>}

        {modules.map((module) => {
          const Icon = ICONS[module.icon] || Boxes;

          return (
            <button
              key={module.slug}
              className={`module-link module-link-live ${
                activePage === "moduloInterno" ? "" : ""
              }`}
              onClick={() => handleModuleClick(module)}
              title={collapsed ? module.name : ""}
            >
              <Icon size={17} />
              {!collapsed && <span>{module.name}</span>}
            </button>
          );
        })}

        {!collapsed && moduleMessage && (
          <div className="sidebar-module-message">{moduleMessage}</div>
        )}
      </div>
    </aside>
  );
}
