import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Search } from "lucide-react";

import Topbar from "../components/Topbar";
import { api } from "../services/api";

export default function Acessos() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    const data = await api.listModuleAccessUsers();
    setUsers(data.users || []);

    if (!selectedUserId && data.users?.[0]) {
      setSelectedUserId(String(data.users[0].id));
    }
  }

  async function loadUserAccess(userId) {
    if (!userId) return;

    const data = await api.getUserModuleAccess(userId);
    setSelectedUser(data.user);
    setModules(data.modules || []);
  }

  useEffect(() => {
    loadUsers().catch((err) => setMessage(err.message));
  }, []);

  useEffect(() => {
    loadUserAccess(selectedUserId).catch((err) => setMessage(err.message));
  }, [selectedUserId]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return users;

    return users.filter((user) =>
      [user.name, user.email, user.login, user.profile, user.cpf]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [users, search]);

  function toggleModule(systemId) {
    setModules((items) =>
      items.map((module) =>
        module.id === systemId
          ? {
              ...module,
              allowed: !module.allowed,
            }
          : module
      )
    );
  }

  async function saveAccess() {
    try {
      const payload = modules.map((module) => ({
        systemId: module.id,
        allowed: module.allowed,
      }));

      await api.saveUserModuleAccess(selectedUserId, payload);
      setMessage("Acessos do prestador salvos com sucesso.");
      await loadUserAccess(selectedUserId);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <Topbar
        title="Acessos"
        subtitle="Libere os módulos para cada prestador"
      />

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Prestadores/usuários</h3>
              <p>Selecione quem terá os módulos configurados</p>
            </div>
          </div>

          <div className="filter-row">
            <div className="search-box wide">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar prestador..."
              />
            </div>
          </div>

          <div className="access-user-list">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                className={`access-user-card ${
                  String(user.id) === String(selectedUserId) ? "active" : ""
                }`}
                onClick={() => setSelectedUserId(String(user.id))}
              >
                <strong>{user.name}</strong>
                <span>{user.profile}</span>
                <small>{user.login}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="panel roger-card-highlight">
          <div className="panel-header">
            <div>
              <h3>Acessos aos módulos</h3>
              <p>
                {selectedUser
                  ? `${selectedUser.name} — ${selectedUser.profile}`
                  : "Selecione um usuário"}
              </p>
            </div>

            <button className="primary-small" onClick={saveAccess}>
              Salvar acessos
            </button>
          </div>

          {message && <div className="form-info">{message}</div>}

          <div className="module-access-list">
            {modules.map((module) => (
              <button
                key={module.id}
                className={`module-access-row ${module.allowed ? "allowed" : ""}`}
                onClick={() => toggleModule(module.id)}
              >
                <div>
                  <strong>{module.name}</strong>
                  <span>{module.description}</span>
                </div>

                <div className="module-access-icon">
                  {module.allowed ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Circle size={24} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
