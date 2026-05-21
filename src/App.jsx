import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./styles/fase3.css";
import "./styles/fase4.css";
import "./styles/fase5-7.css";
import "./styles/fase8-prestador.css";
import "./styles/login-clean.css";
import "./styles/topbar-logout.css";
import "./styles/modulos-internos.css";

import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MeusModulos from "./pages/MeusModulos";
import ModuleFrame from "./pages/ModuleFrame";
import Usuarios from "./pages/Usuarios";
import Perfis from "./pages/Perfis";
import Sistemas from "./pages/Sistemas";
import Acessos from "./pages/Acessos";
import Logs from "./pages/Logs";
import AcessoNegado from "./pages/AcessoNegado";
import { api, clearToken } from "./services/api";

function can(user, key) {
  return Boolean(user?.permissions?.[key]);
}

function AppShell({ activePage, setActivePage, user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openedModule, setOpenedModule] = useState(null);

  function handleOpenModule(moduleData) {
    setOpenedModule(moduleData);
    setActivePage("moduloInterno");
  }

  const pages = useMemo(
    () => ({
      dashboard: {
        permission: "roger.dashboard.visualizar",
        component: <Dashboard user={user} onLogout={onLogout} />,
      },
      modulos: {
        permission: null,
        component: (
          <MeusModulos
            user={user}
            onLogout={onLogout}
            onOpenModule={handleOpenModule}
          />
        ),
      },
      moduloInterno: {
        permission: null,
        component: (
          <ModuleFrame
            module={openedModule}
            user={user}
            onLogout={onLogout}
            onBack={() => setActivePage("modulos")}
          />
        ),
      },
      usuarios: {
        permission: "roger.usuarios.visualizar",
        component: <Usuarios user={user} onLogout={onLogout} />,
      },
      perfis: {
        permission: "roger.perfis.visualizar",
        component: <Perfis user={user} onLogout={onLogout} />,
      },
      sistemas: {
        permission: "roger.sistemas.visualizar",
        component: <Sistemas user={user} onLogout={onLogout} />,
      },
      acessos: {
        permission: "roger.acessos.visualizar",
        component: <Acessos user={user} onLogout={onLogout} />,
      },
      logs: {
        permission: "roger.logs.visualizar",
        component: <Logs user={user} onLogout={onLogout} />,
      },
    }),
    [user, onLogout, openedModule]
  );

  const currentPage = pages[activePage];

  const pageComponent =
    currentPage && (!currentPage.permission || can(user, currentPage.permission)) ? (
      currentPage.component
    ) : (
      <AcessoNegado permission={currentPage?.permission || activePage} />
    );

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        onOpenModule={handleOpenModule}
      />

      <main className="content">{pageComponent}</main>
    </div>
  );
}

export default function App() {
  const [logged, setLogged] = useState(false);
  const [activePage, setActivePage] = useState("modulos");
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((data) => {
        setUser(data.user);
        setLogged(true);
        setActivePage(data.user?.profile === "Administrador" ? "dashboard" : "modulos");
      })
      .catch(() => {
        clearToken();
        setLogged(false);
      })
      .finally(() => setLoadingSession(false));
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    setLogged(true);
    setActivePage(userData?.profile === "Administrador" ? "dashboard" : "modulos");
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setLogged(false);
    setActivePage("modulos");
  }

  if (loadingSession) {
    return (
      <main className="login-page">
        <section className="login-shell roger-glow-card">
          <div className="login-brand-panel">
            <h1>ROGER</h1>
            <h2>Carregando sessão...</h2>
          </div>
          <div className="login-form-panel">
            <h2>Preparando ambiente</h2>
            <p>Validando autenticação e módulos liberados.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!logged) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AppShell
      activePage={activePage}
      setActivePage={setActivePage}
      user={user}
      onLogout={handleLogout}
    />
  );
}
