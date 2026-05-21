import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import Topbar from "../components/Topbar";
import { api } from "../services/api";

const emptyForm = {
  name: "",
  cpf: "",
  email: "",
  login: "",
  password: "123456",
  profileId: "",
  active: true,
};

function can(user, key) {
  return Boolean(user?.permissions?.[key]);
}

export default function Usuarios({ user }) {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const canCreate = can(user, "roger.usuarios.incluir");
  const canEdit = can(user, "roger.usuarios.alterar");
  const canAdmin = can(user, "roger.usuarios.administrar");

  async function loadData() {
    const [usersData, profilesData] = await Promise.all([
      api.listUsers(),
      api.listProfiles(),
    ]);

    setUsers(usersData.users);
    setProfiles(profilesData.profiles);

    if (!form.profileId && profilesData.profiles[0]) {
      setForm((current) => ({
        ...current,
        profileId: String(profilesData.profiles[0].id),
      }));
    }
  }

  useEffect(() => {
    loadData().catch((err) => setMessage(err.message));
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return users;

    return users.filter((item) =>
      [item.name, item.email, item.login, item.profile]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, users]);

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      cpf: item.cpf || "",
      email: item.email || "",
      login: item.login || "",
      password: "123456",
      profileId: String(item.profileId || ""),
      active: Boolean(item.active),
    });
    setMessage("");
  }

  function handleNew() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      profileId: profiles[0] ? String(profiles[0].id) : "",
    });
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!editingId && !canCreate) {
      setMessage("Você não possui permissão para incluir usuários.");
      return;
    }

    if (editingId && !canEdit) {
      setMessage("Você não possui permissão para alterar usuários.");
      return;
    }

    const payload = {
      ...form,
      profileId: Number(form.profileId),
      active: Boolean(form.active),
    };

    try {
      if (editingId) {
        await api.updateUser(editingId, payload);
        setMessage("Usuário atualizado com sucesso.");
      } else {
        await api.createUser(payload);
        setMessage("Usuário criado com sucesso.");
      }

      handleNew();
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleResetPassword(item) {
    if (!canAdmin) {
      setMessage("Você não possui permissão para administrar senhas.");
      return;
    }

    try {
      await api.resetPassword(item.id, "123456");
      setMessage(`Senha de ${item.name} redefinida para 123456.`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <Topbar title="Usuários" subtitle="Gerencie os usuários da plataforma" />

      {(canCreate || canEdit) && (
        <section className="panel roger-card-highlight">
          <div className="panel-header">
            <div>
              <h3>{editingId ? "Editar usuário" : "Novo usuário"}</h3>
              <p>Cadastro real gravado no banco interno do ROGER</p>
            </div>

            <div className="panel-actions">
              <button onClick={handleNew}>Limpar</button>
            </div>
          </div>

          {message && <div className="form-info">{message}</div>}

          <form className="user-form-grid" onSubmit={handleSubmit}>
            <label>
              Nome
              <input
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Nome completo"
              />
            </label>

            <label>
              CPF
              <input
                value={form.cpf}
                onChange={(event) => handleChange("cpf", event.target.value)}
                placeholder="000.000.000-00"
              />
            </label>

            <label>
              E-mail
              <input
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="email@empresa.com.br"
              />
            </label>

            <label>
              Login
              <input
                value={form.login}
                onChange={(event) => handleChange("login", event.target.value)}
                placeholder="login.usuario"
              />
            </label>

            {!editingId && (
              <label>
                Senha inicial
                <input
                  value={form.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  placeholder="Senha inicial"
                />
              </label>
            )}

            <label>
              Perfil
              <select
                value={form.profileId}
                onChange={(event) => handleChange("profileId", event.target.value)}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="checkbox-form-line">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => handleChange("active", event.target.checked)}
              />
              Usuário ativo
            </label>

            <button className="primary-small" type="submit">
              {editingId ? "Salvar alterações" : "Criar usuário"}
            </button>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Usuários cadastrados</h3>
            <p>Controle de acesso central do ROGER</p>
          </div>
        </div>

        {message && !(canCreate || canEdit) && <div className="form-info">{message}</div>}

        <div className="filter-row">
          <div className="search-box wide">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, e-mail, login ou perfil..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Login</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.login}</td>
                  <td>{item.profile}</td>
                  <td>
                    <span className={`status ${item.active ? "ok" : "soon"}`}>
                      {item.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>{item.lastLoginAt || "-"}</td>
                  <td>
                    <div className="table-actions">
                      {canEdit && <button onClick={() => handleEdit(item)}>Editar</button>}
                      {canAdmin && (
                        <button onClick={() => handleResetPassword(item)}>Senha</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
