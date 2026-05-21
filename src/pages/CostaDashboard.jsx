import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  HelpCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { api } from "../services/api";
import "../styles/costa.css";

const FALLBACK_DATA = {
  atendimentos: [
    {
      id: 1,
      atendimento: "179",
      conta: "482991",
      paciente: "MARIA DAS DORES",
      convenio: "UNIMED",
      entrada: "20/05/2026 08:42",
      usuarioMv: "RUBEN.TAVARES",
      setorOrigem: "Autorização",
      status: "Em análise",
      prioridade: "Alta",
      protocolo: "Pendente",
      assumidaEm: "20/05/2026 10:14",
    },
    {
      id: 2,
      atendimento: "3842",
      conta: "483006",
      paciente: "JOÃO CARLOS",
      convenio: "BRADESCO",
      entrada: "20/05/2026 09:18",
      usuarioMv: "RUBEN.TAVARES",
      setorOrigem: "Centro Cirúrgico",
      status: "Com pendência",
      prioridade: "Média",
      protocolo: "145889",
      assumidaEm: "20/05/2026 09:28",
    },
    {
      id: 3,
      atendimento: "9122",
      conta: "483077",
      paciente: "ANA PAULA",
      convenio: "PARTICULAR",
      entrada: "20/05/2026 10:03",
      usuarioMv: "RUBEN.TAVARES",
      setorOrigem: "Internação",
      status: "Aguardando análise",
      prioridade: "Normal",
      protocolo: "-",
      assumidaEm: "-",
    },
    {
      id: 4,
      atendimento: "7451",
      conta: "483090",
      paciente: "JOSÉ SILVA",
      convenio: "SULAMÉRICA",
      entrada: "20/05/2026 10:25",
      usuarioMv: "RUBEN.TAVARES",
      setorOrigem: "Autorização",
      status: "Atendimento devolvido",
      prioridade: "Alta",
      protocolo: "147002",
      assumidaEm: "20/05/2026 10:32",
    },
  ],
  validacoes: [
    {
      id: "opme",
      titulo: "OPME autorizado x OPME lançado",
      descricao: "Materiais autorizados localizados na conta.",
      status: "OK",
      tipo: "ok",
      horario: "10:14",
    },
    {
      id: "tuss",
      titulo: "TUSS autorizado x TUSS MV",
      descricao: "Necessária conferência manual do código TUSS.",
      status: "Manual",
      tipo: "manual",
      horario: "10:14",
    },
    {
      id: "diarias",
      titulo: "Diárias lançadas na conta",
      descricao: "Existe diária com lançamento fora do período autorizado.",
      status: "Alerta",
      tipo: "alerta",
      horario: "10:14",
    },
    {
      id: "taxas",
      titulo: "Taxas e salas",
      descricao: "Sem divergências automáticas encontradas.",
      status: "OK",
      tipo: "ok",
      horario: "10:14",
    },
  ],
};

const STEPS = [
  "Aguardando análise",
  "Em análise",
  "Com pendência",
  "Protocolo recebido",
  "Atendimento devolvido",
  "Liberada faturamento",
];

function statusClass(status) {
  if (status === "Liberada faturamento") return "success";
  if (status === "Com pendência") return "danger";
  if (status === "Em análise") return "warning";
  if (status === "Atendimento devolvido" || status === "Protocolo recebido") return "info";
  return "neutral";
}

function priorityClass(priority) {
  if (priority === "Alta") return "high";
  if (priority === "Média") return "medium";
  return "normal";
}

function ValidationIcon({ type }) {
  if (type === "ok") return <CheckCircle2 size={18} />;
  if (type === "manual") return <AlertTriangle size={18} />;
  return <HelpCircle size={18} />;
}

export default function CostaDashboard({ user }) {
  const [data, setData] = useState(FALLBACK_DATA);
  const [selectedId, setSelectedId] = useState(FALLBACK_DATA.atendimentos[0]?.id);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [manualTuss, setManualTuss] = useState("");
  const [manualDiaria, setManualDiaria] = useState("");
  const [observacao, setObservacao] = useState("");

  async function loadCosta() {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.getCostaDashboard();
      const payload = {
        atendimentos: Array.isArray(response.atendimentos) ? response.atendimentos : [],
        validacoes: response.validacoes?.length ? response.validacoes : FALLBACK_DATA.validacoes,
      };

      setData(payload);
      setMessage(response.message || "");
      setSelectedId((current) => {
        const stillExists = payload.atendimentos.some((item) => item.id === current);
        return stillExists ? current : payload.atendimentos[0]?.id;
      });
    } catch (err) {
      setMessage("Falha ao consultar a fila real do COSTA: " + err.message);
      setData({ atendimentos: [], validacoes: FALLBACK_DATA.validacoes });
      setSelectedId(undefined);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCosta();
  }, []);

  const filteredAtendimentos = useMemo(() => {
    const term = query.trim().toLowerCase();

    return data.atendimentos.filter((item) => {
      const atendimento = String(item.atendimento || "").toLowerCase();
      const conta = String(item.conta || "").toLowerCase();
      const paciente = String(item.paciente || "").toLowerCase();
      const convenio = String(item.convenio || "").toLowerCase();
      const matchStatus = statusFilter === "Todos" || item.status === statusFilter;
      const matchQuery =
        !term ||
        atendimento.includes(term) ||
        conta.includes(term) ||
        paciente.includes(term) ||
        convenio.includes(term);

      return matchStatus && matchQuery;
    });
  }, [data.atendimentos, query, statusFilter]);

  const selected = useMemo(() => {
    return data.atendimentos.find((item) => item.id === selectedId) || data.atendimentos[0];
  }, [data.atendimentos, selectedId]);

  const summary = useMemo(() => {
    return {
      aguardando: data.atendimentos.filter((item) => item.status === "Aguardando análise").length,
      analise: data.atendimentos.filter((item) => item.status === "Em análise").length,
      pendencia: data.atendimentos.filter((item) => item.status === "Com pendência").length,
      devolvidos: data.atendimentos.filter((item) => item.status === "Atendimento devolvido").length,
      liberadas: data.atendimentos.filter((item) => item.status === "Liberada faturamento").length,
    };
  }, [data.atendimentos]);

  if (!selected) {
    return (
      <section className="costa-page">
        <div className="costa-empty-state">
          <ClipboardList size={44} />
          <h1>COSTA</h1>
          <p>{message || "Nenhum atendimento encontrado para o usuário logado."}</p>
          <button className="costa-button primary" onClick={loadCosta}>Atualizar fila</button>
        </div>
      </section>
    );
  }

  const activeStepIndex = Math.max(0, STEPS.indexOf(selected.status));

  return (
    <section className="costa-page">
      <header className="costa-header">
        <div>
          <span className="costa-kicker">Módulo de autorização e liberação</span>
          <h1>COSTA · Fila de conferência</h1>
          <p>Atendimentos recebidos no usuário MV vinculado ao ROGER/RTP.</p>
        </div>

        <div className="costa-header-actions">
          <div className="costa-user-pill">
            <div className="costa-avatar">{(user?.login || "RT").slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{user?.login || user?.name || "Usuário"}</strong>
              <span>{user?.profile || "Perfil"} · RTP</span>
            </div>
          </div>

          <button className="costa-button primary" onClick={loadCosta} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Atualizar fila
          </button>
        </div>
      </header>

      {message && <div className="costa-message">{message}</div>}

      <div className="costa-summary-grid">
        <article className="costa-summary-card">
          <Clock3 size={22} />
          <div><strong>{summary.aguardando}</strong><span>Aguardando análise</span></div>
        </article>
        <article className="costa-summary-card active">
          <ShieldCheck size={22} />
          <div><strong>{summary.analise}</strong><span>Em análise</span></div>
        </article>
        <article className="costa-summary-card danger">
          <AlertTriangle size={22} />
          <div><strong>{summary.pendencia}</strong><span>Com pendência</span></div>
        </article>
        <article className="costa-summary-card info">
          <ArrowLeftRight size={22} />
          <div><strong>{summary.devolvidos}</strong><span>Devolvidas ao setor</span></div>
        </article>
        <article className="costa-summary-card success">
          <CheckCircle2 size={22} />
          <div><strong>{summary.liberadas}</strong><span>Liberadas faturamento</span></div>
        </article>
      </div>

      <div className="costa-main-grid">
        <article className="costa-card costa-queue-card">
          <div className="costa-card-title">
            <div>
              <h2>Minha fila de atendimentos</h2>
              <p>Contas filtradas pelo usuário MV recebido no MOVEDOC/script.</p>
            </div>
          </div>

          <div className="costa-filters">
            <label className="costa-search">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atendimento, paciente, conta ou convênio" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>Todos</option>
              {STEPS.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>

          <div className="costa-table-wrap">
            <table className="costa-table">
              <thead>
                <tr>
                  <th>Atendimento</th>
                  <th>Paciente</th>
                  <th>Convênio</th>
                  <th>Entrada</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {filteredAtendimentos.map((item) => (
                  <tr key={item.id} className={item.id === selected.id ? "selected" : ""} onClick={() => setSelectedId(item.id)}>
                    <td><strong>{item.atendimento}</strong><span>Conta {item.conta}</span></td>
                    <td>{item.paciente}</td>
                    <td>{item.convenio}</td>
                    <td>{item.entrada}</td>
                    <td><span className={`costa-status ${statusClass(item.status)}`}>{item.status}</span></td>
                    <td><span className={`costa-priority ${priorityClass(item.prioridade)}`}>{item.prioridade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="costa-card costa-detail-card">
          <div className="costa-card-title inline">
            <div>
              <h2>Atendimento selecionado</h2>
              <p>Visão rápida da conta</p>
            </div>
            <span className={`costa-status ${statusClass(selected.status)}`}>{selected.status}</span>
          </div>

          <div className="costa-detail-grid">
            <div><span>Atendimento</span><strong>{selected.atendimento}</strong></div>
            <div><span>Conta</span><strong>{selected.conta}</strong></div>
            <div><span>Convênio</span><strong>{selected.convenio}</strong></div>
            <div><span>Entrada na fila</span><strong>{selected.entrada}</strong></div>
            <div><span>Paciente</span><strong>{selected.paciente}</strong></div>
            <div><span>Usuário MV</span><strong>{selected.usuarioMv}</strong></div>
            <div><span>Setor origem</span><strong>{selected.setorOrigem}</strong></div>
            <div><span>Protocolo</span><strong>{selected.protocolo}</strong></div>
          </div>

          <div className="costa-flow">
            <h3>Esteira do processo</h3>
            <div className="costa-flow-line">
              {STEPS.map((step, index) => (
                <div key={step} className={`costa-flow-step ${index < activeStepIndex ? "done" : ""} ${index === activeStepIndex ? "current" : ""}`}>
                  <div className="costa-flow-dot">{index < activeStepIndex ? "✓" : index + 1}</div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="costa-bottom-grid">
        <article className="costa-card">
          <div className="costa-card-title inline">
            <div>
              <h2>Validações automáticas</h2>
              <p>Resultado dos scripts e consultas SQL no MV.</p>
            </div>
            <button className="costa-button ghost"><RefreshCw size={15} /> Revalidar</button>
          </div>

          <div className="costa-validation-list">
            {data.validacoes.map((validation) => (
              <div className={`costa-validation ${validation.tipo}`} key={validation.id}>
                <div className="costa-validation-icon"><ValidationIcon type={validation.tipo} /></div>
                <div>
                  <strong>{validation.titulo}</strong>
                  <p>{validation.descricao}</p>
                </div>
                <span>{validation.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="costa-card">
          <div className="costa-card-title">
            <div>
              <h2>Conferência manual obrigatória</h2>
              <p>Etapas que exigem validação da autorizadora.</p>
            </div>
          </div>

          <div className="costa-form-grid">
            <label>
              TUSS de OPME
              <select value={manualTuss} onChange={(event) => setManualTuss(event.target.value)}>
                <option value="">Selecione uma opção</option>
                <option>Conferido e correto</option>
                <option>Revalidar script</option>
              </select>
            </label>

            <label>
              Diárias lançadas na conta
              <select value={manualDiaria} onChange={(event) => setManualDiaria(event.target.value)}>
                <option value="">Selecione uma opção</option>
                <option>Conferido e correto</option>
                <option>Revalidar script</option>
              </select>
            </label>

            <label>
              Observação da análise
              <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} placeholder="Descreva a pendência, correção ou justificativa..." />
            </label>
          </div>
        </article>

        <article className="costa-card costa-actions-card">
          <div className="costa-card-title">
            <div>
              <h2>Ações da conta</h2>
              <p>Controle da esteira operacional.</p>
            </div>
          </div>

          <button className="costa-action release"><FileCheck2 size={17} /> Liberar para faturamento</button>
          <button className="costa-action manager"><UserRound size={17} /> Encaminhar para gestão</button>
          <button className="costa-action sector"><Building2 size={17} /> Encaminhar para correção do setor</button>
          <button className="costa-action remove"><Trash2 size={17} /> Solicitar remoção da fila</button>

          <div className="costa-release-doc">
            <FileText size={22} />
            <div>
              <strong>Documento de liberação</strong>
              <span>Responsável: {user?.login || selected.usuarioMv}</span>
              <span>Conta assumida em: {selected.assumidaEm}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
