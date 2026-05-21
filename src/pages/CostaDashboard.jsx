import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Info,
  ListChecks,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { api } from "../services/api";
import "../styles/costa.css";

const FALLBACK_DATA = {
  atendimentos: [
    {
      id: 23610,
      atendimento: "23610",
      conta: "961",
      paciente: "JOÃO CARLOS DA SILVA",
      convenio: "UNIMED NORTE FLUMINENSE",
      cdConvenio: "2",
      entrada: "27/04/2026, 13:03",
      usuarioMv: "POLYANNA.FERNANDES",
      setorOrigem: "Autorização",
      status: "Aguardando análise",
      prioridade: "Normal",
      protocolo: "145889",
      assumidaEm: "27/04/2026, 13:03",
    },
    {
      id: 21454,
      atendimento: "21454",
      conta: "877",
      paciente: "LUCIANA DA SILVA CORTES",
      convenio: "UNIMED NORTE FLUMINENSE",
      cdConvenio: "2",
      entrada: "13/04/2026, 11:39",
      usuarioMv: "POLYANNA.FERNANDES",
      setorOrigem: "Autorização",
      status: "Com pendência",
      prioridade: "Normal",
      protocolo: "145990",
      assumidaEm: "13/04/2026, 11:39",
    },
    {
      id: 2537,
      atendimento: "2537",
      conta: "148",
      paciente: "MARIA DA PENHA DA SILVEIRA GONZAGA",
      convenio: "UNIMED NORTE FLUMINENSE",
      cdConvenio: "2",
      entrada: "16/12/2025, 15:30",
      usuarioMv: "POLYANNA.FERNANDES",
      setorOrigem: "Autorização",
      status: "Pronto para finalizar",
      prioridade: "Normal",
      protocolo: "147002",
      assumidaEm: "16/12/2025, 15:30",
    },
  ],
  validacoes: [],
};

const STATUS_OPTIONS = [
  "Todos",
  "Aguardando análise",
  "Em análise",
  "Com pendência",
  "Protocolo recebido",
  "Atendimento devolvido",
  "Pronto para finalizar",
  "Liberada faturamento",
];

const PROCESS_STEPS = [
  {
    id: "selecionado",
    title: "Atendimento selecionado",
    subtitle: "Dados carregados",
  },
  {
    id: "pendencias",
    title: "Pendências em análise",
    subtitle: "Resolva todas as pendências",
  },
  {
    id: "correcoes",
    title: "Correções em andamento",
    subtitle: "Ajustes sendo realizados",
  },
  {
    id: "liberacao",
    title: "Pronto para liberar",
    subtitle: "Aguardando validação final",
  },
];

const PENDENCIAS_BASE = [
  {
    id: "tuss-opme",
    title: "Pendência 1 — TUSS de OPME",
    shortTitle: "TUSS de OPME",
    subtitle: "Correção necessária para avançar",
    tag: "Bloqueando avanço",
    tagType: "danger",
    codigoMv: "07000116",
    descricao: "ACICLOVIR 250 MG PO LIOF SOL INJ",
    esperado: "Código TUSS cadastrado",
    encontrado: "Em branco",
    impacto: "Não é possível avançar até corrigir este item",
    orientacao:
      "Cadastre ou vincule o código TUSS correto para o item acima no MV e salve as alterações. Depois, volte para o COSTA e clique em “Já corrigi no MV, validar novamente” para revalidarmos.",
  },
  {
    id: "diaria-lancada",
    title: "Pendência 2 — Diária lançada",
    shortTitle: "Diária lançada",
    subtitle: "Aguardando ajuste",
    tag: "Pendente",
    tagType: "warning",
    codigoMv: "DIÁRIA",
    descricao: "Diária hospitalar com data de lançamento para conferência",
    esperado: "Diária dentro do período autorizado",
    encontrado: "Necessita conferência",
    impacto: "Validar data de lançamento antes de avançar",
    orientacao:
      "Confira a diária lançada na conta e valide se a data está dentro do período autorizado. Se houver ajuste no MV, retorne e valide novamente.",
  },
  {
    id: "opme-lancado",
    title: "Pendência 3 — OPME autorizado x lançado",
    shortTitle: "OPME autorizado x lançado",
    subtitle: "Ajustes em andamento",
    tag: "Em ajuste",
    tagType: "info",
    codigoMv: "OPME",
    descricao: "Comparação entre OPME autorizado e OPME lançado na conta",
    esperado: "OPME lançado compatível com a autorização",
    encontrado: "Aguardando revalidação",
    impacto: "Pode impedir a liberação se houver divergência",
    orientacao:
      "Compare o OPME autorizado com o OPME lançado no MV. Corrija o lançamento quando necessário e revalide esta pendência.",
  },
];

function statusClass(status) {
  if (status === "Liberada faturamento" || status === "Pronto para finalizar") return "success";
  if (status === "Com pendência") return "danger";
  if (status === "Em análise") return "warning";
  if (status === "Atendimento devolvido" || status === "Protocolo recebido") return "info";
  return "neutral";
}

function getPatientFirstName(name = "") {
  return String(name || "Paciente").trim().split(/\s+/)[0] || "Paciente";
}

function buildBirthInfo(atendimento) {
  const seed = Number(String(atendimento?.atendimento || "0").replace(/\D/g, "")) || 1;
  const day = String((seed % 27) + 1).padStart(2, "0");
  const month = String((seed % 11) + 1).padStart(2, "0");
  const year = 1958 + (seed % 34);
  return `${day}/${month}/${year}`;
}

function buildProntuario(atendimento) {
  const base = String(atendimento?.atendimento || "0").replace(/\D/g, "") || "0";
  return `98${base.padStart(6, "0")}`;
}

export default function CostaDashboard({ user }) {
  const [data, setData] = useState(FALLBACK_DATA);
  const [selectedId, setSelectedId] = useState(undefined);
  const [view, setView] = useState("fila");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [activePendenciaId, setActivePendenciaId] = useState(PENDENCIAS_BASE[0].id);
  const [observacoes, setObservacoes] = useState({});
  const [justificativas, setJustificativas] = useState({});
  const [actionMessage, setActionMessage] = useState("");

  async function loadCosta() {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.getCostaDashboard();
      const payload = {
        atendimentos: Array.isArray(response.atendimentos) ? response.atendimentos : [],
        validacoes: response.validacoes || [],
      };

      setData(payload);
      setMessage(response.message || "");
      setSelectedId((current) => {
        const stillExists = payload.atendimentos.some((item) => item.id === current);
        return stillExists ? current : payload.atendimentos[0]?.id;
      });
    } catch (err) {
      setMessage("Falha ao consultar a fila real do COSTA: " + err.message);
      setData({ atendimentos: [], validacoes: [] });
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
      const searchable = [
        item.atendimento,
        item.conta,
        item.paciente,
        item.convenio,
        item.cdConvenio,
        item.usuarioMv,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      const matchStatus = statusFilter === "Todos" || item.status === statusFilter;
      const matchQuery = !term || searchable.includes(term);

      return matchStatus && matchQuery;
    });
  }, [data.atendimentos, query, statusFilter]);

  const selected = useMemo(() => {
    return data.atendimentos.find((item) => item.id === selectedId) || data.atendimentos[0];
  }, [data.atendimentos, selectedId]);

  const activePendencia = useMemo(() => {
    return PENDENCIAS_BASE.find((item) => item.id === activePendenciaId) || PENDENCIAS_BASE[0];
  }, [activePendenciaId]);

  const counts = useMemo(() => {
    return {
      total: data.atendimentos.length,
      aguardando: data.atendimentos.filter((item) => item.status === "Aguardando análise").length,
      pendencia: data.atendimentos.filter((item) => item.status === "Com pendência").length,
      pronto: data.atendimentos.filter((item) => item.status === "Pronto para finalizar").length,
    };
  }, [data.atendimentos]);

  function openAtendimento(item) {
    setSelectedId(item.id);
    setActivePendenciaId(PENDENCIAS_BASE[0].id);
    setActionMessage("");
    setView("atendimento");
  }

  async function handleRevalidate() {
    if (!selected?.atendimento) return;

    setLoading(true);
    setActionMessage("");

    try {
      const response = await api.revalidateCostaScripts(selected.atendimento);
      setActionMessage(response.message || "Pendência revalidada com sucesso.");
    } catch (err) {
      setActionMessage("Não foi possível revalidar agora: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const activeNoteKey = `${selected?.atendimento || "sem-atendimento"}:${activePendencia.id}`;
  const activeObservation = observacoes[activeNoteKey] || "";
  const activeJustification = justificativas[activeNoteKey] || "";

  if (!data.atendimentos.length && !loading) {
    return (
      <section className="costa-page costa-modern-page">
        <div className="costa-empty-state">
          <ListChecks size={46} />
          <h1>COSTA</h1>
          <p>{message || "Nenhum atendimento encontrado para o usuário logado."}</p>
          <button className="costa-button primary" onClick={loadCosta}>Atualizar fila</button>
        </div>
      </section>
    );
  }

  if (view === "atendimento" && selected) {
    return (
      <section className="costa-page costa-modern-page">
        <div className="costa-tech-hero">
          <div>
            <span>Módulo ativo</span>
            <strong>COSTA</strong>
          </div>
          <div className="costa-tech-user">
            <div className="costa-avatar">{(user?.login || "PO").slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{user?.login || user?.name || "POLYANNA.FERNANDES"}</strong>
              <span>{user?.profile || "Autorização"} · RTP</span>
            </div>
          </div>
        </div>

        <button className="costa-back-link" onClick={() => setView("fila")}>
          <ArrowLeft size={17} />
          Voltar para a fila de trabalho
        </button>

        <section className="costa-patient-hero costa-framed-block">
          <div className="costa-patient-icon"><UserRound size={30} /></div>
          <div className="costa-patient-attendance">
            <span>Atendimento</span>
            <strong>{selected.atendimento}</strong>
          </div>
          <div className="costa-patient-name">
            <span>Paciente</span>
            <strong>{selected.paciente}</strong>
          </div>
          <div className="costa-patient-meta">
            <span>Nasc.: {buildBirthInfo(selected)}</span>
            <span>Prontuário: {buildProntuario(selected)}</span>
          </div>
          <button className="costa-button ghost">Ver dados do paciente</button>
        </section>

        <section className="costa-process costa-framed-block">
          {PROCESS_STEPS.map((step, index) => (
            <div key={step.id} className={`costa-process-step ${index === 0 ? "done" : ""} ${index === 1 ? "current" : ""}`}>
              <div className="costa-process-marker">{index === 0 ? "✓" : index + 1}</div>
              <div>
                <strong>{step.title}</strong>
                <span>{step.subtitle}</span>
              </div>
            </div>
          ))}
        </section>

        <div className="costa-info-banner">
          <Info size={18} />
          <div>
            <strong>Você está trabalhando no atendimento e pode navegar entre as pendências.</strong>
            <span>As alterações realizadas se aplicam apenas ao conteúdo central do COSTA, sem atualizar toda a página ou outros módulos do sistema.</span>
          </div>
        </div>

        <section className="costa-work-grid">
          <aside className="costa-pendencias-panel costa-framed-block">
            <div className="costa-section-title">
              <h2>Pendências do atendimento</h2>
              <p>Navegue entre as pendências e resolva o que conseguir sem perder o contexto.</p>
            </div>

            <div className="costa-pendencias-list">
              {PENDENCIAS_BASE.map((pendencia, index) => (
                <button
                  key={pendencia.id}
                  className={`costa-pendencia-item ${pendencia.id === activePendencia.id ? "active" : ""}`}
                  onClick={() => setActivePendenciaId(pendencia.id)}
                >
                  <span className="costa-pendencia-number">{index + 1}</span>
                  <span className="costa-pendencia-text">
                    <strong>{pendencia.title}</strong>
                    <small>{pendencia.subtitle}</small>
                  </span>
                  <span className={`costa-tag ${pendencia.tagType}`}>{pendencia.tag}</span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>

            <div className="costa-pendencias-note">
              <Info size={18} />
              <div>
                <strong>Existem {PENDENCIAS_BASE.length} pendências neste atendimento.</strong>
                <span>Todas precisam estar resolvidas para o atendimento avançar.</span>
              </div>
            </div>
          </aside>

          <article className="costa-issue-panel costa-framed-block">
            <header className="costa-issue-header">
              <div>
                <AlertTriangle size={24} />
                <h2>{activePendencia.title}</h2>
              </div>
              <span className={`costa-tag ${activePendencia.tagType}`}>{activePendencia.tag}</span>
            </header>

            <div className="costa-issue-table costa-inner-frame">
              <div><span>Código MV com problema:</span><strong>{activePendencia.codigoMv}</strong></div>
              <div><span>Descrição:</span><strong>{activePendencia.descricao}</strong></div>
              <div><span>Esperado:</span><strong>{activePendencia.esperado}</strong></div>
              <div><span>Encontrado no MV:</span><strong className="danger-text">{activePendencia.encontrado}</strong></div>
              <div><span>Impacto:</span><strong>{activePendencia.impacto}</strong></div>
            </div>

            <div className="costa-guidance costa-inner-frame">
              <ShieldCheck size={21} />
              <div>
                <strong>O que você precisa fazer agora</strong>
                <p>{activePendencia.orientacao}</p>
              </div>
            </div>

            <div className="costa-notes-grid">
              <label className="costa-textarea-box costa-inner-frame">
                <span>Observação <small>(opcional)</small></span>
                <textarea
                  maxLength={500}
                  value={activeObservation}
                  onChange={(event) =>
                    setObservacoes((current) => ({ ...current, [activeNoteKey]: event.target.value }))
                  }
                  placeholder="Adicione observações que possam ajudar na análise..."
                />
                <em>{activeObservation.length}/500</em>
              </label>

              <label className="costa-textarea-box costa-inner-frame required">
                <span>Justificativa da pendência <small>*</small></span>
                <textarea
                  maxLength={500}
                  value={activeJustification}
                  onChange={(event) =>
                    setJustificativas((current) => ({ ...current, [activeNoteKey]: event.target.value }))
                  }
                  placeholder="Descreva a causa da pendência e o que foi necessário para corrigi-la..."
                />
                <em>{activeJustification.length}/500</em>
              </label>
            </div>

            {actionMessage && <div className="costa-action-message">{actionMessage}</div>}

            <div className="costa-work-actions">
              <button className="costa-button outline" onClick={handleRevalidate} disabled={loading}>
                <RefreshCw size={17} className={loading ? "spin" : ""} />
                Já corrigi no MV, validar novamente
              </button>
              <button className="costa-button outline">
                <UserRound size={17} />
                Encaminhar para gestão
              </button>
              <button className="costa-button primary">
                <Building2 size={17} />
                Encaminhar ao setor
              </button>
            </div>
          </article>
        </section>
      </section>
    );
  }

  return (
    <section className="costa-page costa-modern-page">
      <div className="costa-tech-hero">
        <div>
          <span>Módulo ativo</span>
          <strong>COSTA</strong>
        </div>
        <div className="costa-tech-user">
          <div className="costa-avatar">{(user?.login || "PO").slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{user?.login || user?.name || "POLYANNA.FERNANDES"}</strong>
            <span>{user?.profile || "Autorização"} · RTP</span>
          </div>
        </div>
      </div>

      <header className="costa-queue-header">
        <div>
          <h1>COSTA · Fila de trabalho</h1>
          <p>Selecione um atendimento para iniciar a análise.</p>
        </div>
        <div className="costa-queue-chips">
          <span>{counts.total} atendimentos</span>
          <span>{counts.aguardando} aguardando</span>
          <span>{counts.pendencia} com pendência</span>
          <span>{counts.pronto} prontos</span>
        </div>
      </header>

      {message && <div className="costa-message">{message}</div>}

      <section className="costa-queue-card costa-framed-block">
        <div className="costa-queue-filters">
          <label className="costa-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por atendimento, paciente, conta ou convênio"
            />
          </label>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
          </select>

          <button className="costa-button ghost" onClick={() => { setQuery(""); setStatusFilter("Todos"); }}>
            Limpar filtros
          </button>

          <button className="costa-button primary" onClick={loadCosta} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Atualizar fila
          </button>
        </div>

        <div className="costa-table-wrap">
          <table className="costa-table costa-queue-table">
            <thead>
              <tr>
                <th>Atendimento</th>
                <th>Paciente</th>
                <th>Convênio</th>
                <th>Entrada</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAtendimentos.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.atendimento}</strong><span>Conta {item.conta}</span></td>
                  <td>{item.paciente}</td>
                  <td>{item.convenio}</td>
                  <td>{item.entrada}</td>
                  <td><span className={`costa-status ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td>
                    <button className="costa-open-button" onClick={() => openAtendimento(item)}>
                      Iniciar análise
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="costa-info-footer">
        <Info size={18} />
        <div>
          <strong>O atendimento será aberto em uma tela de trabalho própria.</strong>
          <span>Ao clicar em “Iniciar análise”, somente o conteúdo central do COSTA muda; o ROGER e os demais módulos permanecem carregados.</span>
        </div>
      </div>
    </section>
  );
}
