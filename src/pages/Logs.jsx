import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import Topbar from "../components/Topbar";
import { api } from "../services/api";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadLogs() {
    const data = await api.listLogs();
    setLogs(data.logs);
  }

  useEffect(() => {
    loadLogs().catch((err) => setMessage(err.message));
  }, []);

  const filteredLogs = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return logs;

    return logs.filter((log) =>
      [log.user, log.event, log.detail, log.ip]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [logs, search]);

  return (
    <>
      <Topbar title="Logs" subtitle="Auditoria de acessos e operações" />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Eventos registrados</h3>
            <p>Histórico real gravado no banco interno do ROGER</p>
          </div>

          <button onClick={loadLogs}>Atualizar</button>
        </div>

        {message && <div className="form-info">{message}</div>}

        <div className="filter-row">
          <div className="search-box wide">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por usuário, evento, detalhe ou IP..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Usuário</th>
                <th>Evento</th>
                <th>Detalhe</th>
                <th>IP</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString("pt-BR")
                      : "-"}
                  </td>
                  <td>{log.user}</td>
                  <td>{log.event}</td>
                  <td>{log.detail}</td>
                  <td>{log.ip}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5">Nenhum log encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
