import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import Topbar from "../components/Topbar";
import { api } from "../services/api";

const emptyForm = {
  name: "",
  description: "",
  active: true,
};

export default function Perfis() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  async function loadProfiles() {
    const data = await api.listProfiles();
    setProfiles(data.profiles);
  }

  useEffect(() => {
    loadProfiles().catch((err) => setMessage(err.message));
  }, []);

  const filteredProfiles = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return profiles;

    return profiles.filter((profile) =>
      [profile.name, profile.description].join(" ").toLowerCase().includes(term)
    );
  }, [profiles, search]);

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNew() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  function handleEdit(profile) {
    setEditingId(profile.id);
    setForm({
      name: profile.name || "",
      description: profile.description || "",
      active: Boolean(profile.active),
    });
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (editingId) {
        await api.updateProfile(editingId, form);
        setMessage("Perfil atualizado com sucesso.");
      } else {
        await api.createProfile(form);
        setMessage("Perfil criado com sucesso.");
      }

      handleNew();
      await loadProfiles();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <Topbar
        title="Perfis"
        subtitle="Gerencie regras padrão de acesso do ROGER"
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>{editingId ? "Editar perfil" : "Novo perfil"}</h3>
            <p>Perfis definem as permissões padrão dos usuários</p>
          </div>

          <div className="panel-actions">
            <button onClick={handleNew}>Limpar</button>
          </div>
        </div>

        {message && <div className="form-info">{message}</div>}

        <form className="profile-form-grid" onSubmit={handleSubmit}>
          <label>
            Nome do perfil
            <input
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="Ex.: Auditor"
            />
          </label>

          <label>
            Descrição
            <input
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Descreva a finalidade do perfil"
            />
          </label>

          <label className="checkbox-form-line">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => handleChange("active", event.target.checked)}
            />
            Perfil ativo
          </label>

          <button className="primary-small" type="submit">
            {editingId ? "Salvar alterações" : "Criar perfil"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Perfis cadastrados</h3>
            <p>Base para permissões herdadas</p>
          </div>
        </div>

        <div className="filter-row">
          <div className="search-box wide">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou descrição..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Perfil</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Atualizado em</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredProfiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.name}</td>
                  <td>{profile.description}</td>
                  <td>
                    <span className={`status ${profile.active ? "ok" : "soon"}`}>
                      {profile.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    {profile.updatedAt
                      ? new Date(profile.updatedAt).toLocaleString("pt-BR")
                      : "-"}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => handleEdit(profile)}>Editar</button>
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
