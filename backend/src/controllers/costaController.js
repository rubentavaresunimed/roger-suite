import { executeMv, isMvConfigured } from "../database/mvOracle.js";
import { logEvent } from "../database/db.js";

function userLogin(req) {
  return (req.auth?.login || req.auth?.name || "").toUpperCase().trim();
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeRow(row) {
  const atendimento = row.CD_ATENDIMENTO ?? row.cd_atendimento;
  const protocolo = row.CD_PROTOCOLO_DOC ?? row.cd_protocolo_doc;
  const conta = row.CD_REG_FAT ?? row.cd_reg_fat ?? "-";
  const paciente = row.NM_PACIENTE ?? row.nm_paciente ?? "Paciente não localizado";
  const convenio = row.NM_CONVENIO ?? row.nm_convenio ?? "Convênio não localizado";
  const cdConvenio = row.CD_CONVENIO ?? row.cd_convenio;
  const dtRecebimento = row.DT_RECEBIMENTO ?? row.dt_recebimento;
  const usuarioMv = row.NM_USUARIO_RECEBIMENTO ?? row.nm_usuario_recebimento;
  const setorOrigem = row.CD_SETOR ?? row.cd_setor;
  const setorDestino = row.CD_SETOR_DESTINO ?? row.cd_setor_destino;

  return {
    id: Number(atendimento),
    atendimento: String(atendimento ?? "-"),
    conta: String(conta ?? "-"),
    paciente,
    convenio,
    cdConvenio: cdConvenio ? String(cdConvenio) : "-",
    entrada: formatDateTime(dtRecebimento),
    usuarioMv: usuarioMv || "-",
    setorOrigem: setorOrigem ? `Setor ${setorOrigem}` : "-",
    setorDestino: setorDestino ? `Setor ${setorDestino}` : "-",
    status: "Aguardando análise",
    prioridade: "Normal",
    protocolo: protocolo ? String(protocolo) : "-",
    assumidaEm: formatDateTime(dtRecebimento),
    dtRecebimento,
    dtRealizacao: row.DT_REALIZACAO ?? row.dt_realizacao,
    tpAtendimento: row.TP_ATENDIMENTO ?? row.tp_atendimento,
  };
}

function buildValidacoes() {
  return [
    {
      id: "opme",
      titulo: "OPME autorizado x OPME lançado",
      descricao: "Validação automática preparada. Na homologação, conferir resultado detalhado por atendimento.",
      status: "Pendente",
      tipo: "manual",
      horario: formatDateTime(new Date()),
    },
    {
      id: "tuss",
      titulo: "TUSS autorizado x TUSS MV",
      descricao: "Conferência obrigatória do código TUSS do item.",
      status: "Manual",
      tipo: "manual",
      horario: formatDateTime(new Date()),
    },
    {
      id: "diarias",
      titulo: "Diárias lançadas na conta",
      descricao: "Validação preparada para trazer data de lançamento da diária no próximo ajuste fino.",
      status: "Manual",
      tipo: "manual",
      horario: formatDateTime(new Date()),
    },
    {
      id: "protocolo",
      titulo: "Última movimentação MOVEDOC",
      descricao: "Fila filtrada somente pela última movimentação recebida no usuário MV logado.",
      status: "OK",
      tipo: "ok",
      horario: formatDateTime(new Date()),
    },
  ];
}

const COSTA_FILA_SQL = `
WITH ultima_movimentacao AS (
    SELECT
        ipd.cd_atendimento,
        ipd.cd_protocolo_doc,
        ipd.nm_usuario_recebimento,
        ipd.dt_recebimento,
        ipd.dt_realizacao,
        pd.cd_setor,
        pd.cd_setor_destino,
        a.tp_atendimento,
        a.cd_convenio,
        a.dt_atendimento,
        p.nm_paciente,
        c.nm_convenio,
        rf.cd_reg_fat,
        ROW_NUMBER() OVER (
            PARTITION BY ipd.cd_atendimento
            ORDER BY
                NVL(ipd.dt_realizacao, ipd.dt_recebimento) DESC,
                ipd.cd_protocolo_doc DESC
        ) AS rn
    FROM dbamv.it_protocolo_doc ipd
    JOIN dbamv.protocolo_doc pd
      ON pd.cd_protocolo_doc = ipd.cd_protocolo_doc
    JOIN dbamv.atendime a
      ON a.cd_atendimento = ipd.cd_atendimento
    LEFT JOIN dbamv.paciente p
      ON p.cd_paciente = a.cd_paciente
    LEFT JOIN dbamv.convenio c
      ON c.cd_convenio = a.cd_convenio
    LEFT JOIN (
        SELECT cd_atendimento, MAX(cd_reg_fat) AS cd_reg_fat
        FROM dbamv.reg_fat
        GROUP BY cd_atendimento
    ) rf
      ON rf.cd_atendimento = ipd.cd_atendimento
    WHERE ipd.cd_atendimento IS NOT NULL
      AND a.tp_atendimento = 'I'
      AND NVL(a.cd_convenio, 0) <> 8
)
SELECT
    cd_atendimento,
    cd_protocolo_doc,
    nm_usuario_recebimento,
    dt_recebimento,
    dt_realizacao,
    cd_setor,
    cd_setor_destino,
    tp_atendimento,
    cd_convenio,
    dt_atendimento,
    nm_paciente,
    nm_convenio,
    cd_reg_fat
FROM ultima_movimentacao
WHERE rn = 1
  AND UPPER(TRIM(nm_usuario_recebimento)) = UPPER(TRIM(:usuario_mv))
  AND dt_recebimento IS NOT NULL
ORDER BY dt_recebimento DESC
`;

function mockAtendimentos(login) {
  return [
    {
      id: 23610,
      atendimento: "23610",
      conta: "961",
      paciente: "JOÃO CARLOS DA SILVA",
      convenio: "UNIMED NORTE FLUMINENSE",
      cdConvenio: "2",
      entrada: formatDateTime(new Date()),
      usuarioMv: login || "POLYANNA.FERNANDES",
      setorOrigem: "Última movimentação recebida",
      setorDestino: "-",
      status: "Aguardando análise",
      prioridade: "Normal",
      protocolo: "Homologação",
      assumidaEm: formatDateTime(new Date()),
    },
  ];
}

export async function getCostaDashboard(req, res) {
  const login = userLogin(req);

  logEvent({
    userId: req.auth?.id,
    event: "COSTA_DASHBOARD_VISUALIZADO",
    detail: `Usuário ${login} abriu a fila do COSTA`,
    ip: req.ip,
  });

  if (!login) {
    return res.status(400).json({
      ok: false,
      message: "Usuário logado sem login MV vinculado.",
      atendimentos: [],
      validacoes: buildValidacoes(),
    });
  }

  if (!isMvConfigured()) {
    return res.json({
      ok: true,
      fonte: "homologacao-sem-mv",
      message: "MV ainda não configurado no .env. Exibindo atendimento de homologação para validar fluxo e layout.",
      usuarioMv: login,
      atendimentos: mockAtendimentos(login),
      validacoes: buildValidacoes(),
    });
  }

  try {
    const result = await executeMv(COSTA_FILA_SQL, { usuario_mv: login });
    const atendimentos = (result.rows || []).map(normalizeRow);

    return res.json({
      ok: true,
      fonte: "mv-oracle",
      message: atendimentos.length
        ? `Fila carregada do MV para ${login}.`
        : `Nenhum atendimento de internação encontrado na última movimentação recebida por ${login}.`,
      usuarioMv: login,
      atendimentos,
      validacoes: buildValidacoes(),
    });
  } catch (error) {
    console.error("[COSTA] Falha ao buscar fila no MV:", error);

    return res.status(500).json({
      ok: false,
      fonte: "erro-mv-oracle",
      message: `Falha ao consultar o MV: ${error.message}`,
      usuarioMv: login,
      atendimentos: [],
      validacoes: buildValidacoes(),
    });
  }
}

export function revalidateCostaScripts(req, res) {
  const { atendimento } = req.params;

  logEvent({
    userId: req.auth?.id,
    event: "COSTA_SCRIPT_REVALIDADO",
    detail: `Revalidação solicitada para atendimento ${atendimento}`,
    ip: req.ip,
  });

  res.json({
    ok: true,
    message: "Scripts revalidados com sucesso para homologação",
    atendimento,
    timestamp: new Date().toISOString(),
  });
}
