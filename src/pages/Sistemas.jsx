import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Topbar from "../components/Topbar";
import { api } from "../services/api";

const emptySystem = {
  name: "",
  slug: "",
  description: "",
  url: "",
  icon: "layers",
  color: "green",
  active: true,
};

export default function Sistemas() {
  const [systems, setSystems] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptySystem);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  async function loadSystems() {
    const data = await api.listSystems();
    setSystems(data.systems || []);
  }

  useEffect(() => {
    loadSystems().catch((err) => setMessage(err.message));
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return systems;
    return systems.filter((system) =>
      [system.name, system.slug, system.description, system.url]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [systems, search]);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function clear() {
    setEditingId(null);
    setForm(emptySystem);
    setMessage("");
  }

  function edit(system) {
    setEditingId(system.id);
    setForm({
      name: system.name || "",
      slug: system.slug || "",
      description: system.description || "",
      url: system.url || "",
      icon: system.icon || "layers",
      color: system.color || "green",
      active: Boolean(system.active),
    });
    setMessage("");
  }

  async function save(event) {
    event.preventDefault();

    try {
      if (editingId) {
        await api.updateSystem(editingId, form);
        setMessage("Sistema/módulo atualizado com sucesso.");
      } else {
        await api.createSystem(form);
        setMessage("Sistema/módulo criado com sucesso.");
      }

      clear();
      await loadSystems();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <Topbar
        title="Sistemas/Módulos"
        subtitle="Configure os módulos que aparecem para os prestadores"
      />

      <section className="panel roger-card-highlight">
        <div className="panel-header">
          <div>
            <h3>{editingId ? "Editar módulo" : "Novo módulo"}</h3>
            <p>Configure nome, URL e identidade visual do módulo</p>
          </div>
          <button onClick={clear}>Limpar</button>
        </div>

        {message && <div className="form-info">{message}</div>}

        <form className="user-form-grid" onSubmit={save}>
          <label>
            Nome
            <input value={form.name} onChange={(e) => change("name", e.target.value)} />
          </label>

          <label>
            Slug
            <input value={form.slug} onChange={(e) => change("slug", e.target.value)} />
          </label>

          <label>
            URL
            <input
              value={form.url}
              onChange={(e) => change("url", e.target.value)}
              placeholder="http://10.117.2.137:3002"
            />
          </label>

          <label>
            Ícone
            <select value={form.icon} onChange={(e) => change("icon", e.target.value)}>
              <option value="shield">Shield</option>
              <option value="bar-chart">Bar Chart</option>
              <option value="activity">Activity</option>
              <option value="database">Database</option>
              <option value="wallet">Wallet</option>
              <option value="file-text">File Text</option>
              <option value="layers">Layers</option>
            </select>
          </label>

          <label>
            Cor
            <select value={form.color} onChange={(e) => change("color", e.target.value)}>
              <option value="green">Verde</option>
              <option value="gold">Dourado</option>
              <option value="blue">Azul</option>
              <option value="gray">Cinza</option>
            </select>
          </label>

          <label>
            Descrição
            <input
              value={form.description}
              onChange={(e) => change("description", e.target.value)}
            />
          </label>

          <label className="checkbox-form-line">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => change("active", e.target.checked)}
            />
            Módulo ativo
          </label>

          <button className="primary-small" type="submit">
            {editingId ? "Salvar módulo" : "Criar módulo"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Módulos cadastrados</h3>
            <p>Esses módulos podem ser liberados na tela Acessos</p>
          </div>
        </div>

        <div className="filter-row">
          <div className="search-box wide">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar módulo..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Módulo</th>
                <th>Slug</th>
                <th>URL</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((system) => (
                <tr key={system.id}>
                  <td>{system.name}</td>
                  <td>{system.slug}</td>
                  <td>{system.url || "Não configurada"}</td>
                  <td>
                    <span className={`status ${system.active ? "ok" : "soon"}`}>
                      {system.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => edit(system)}>Editar</button>
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
