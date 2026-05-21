# COSTA - Homologação rápida

## O que esta versão já faz

- Abre o COSTA como módulo interno do ROGER/RTP.
- Usa o usuário logado no ROGER como usuário MV.
- Busca a fila real no MV quando as variáveis Oracle estão configuradas no `.env`.
- Filtra somente atendimento de internação: `dbamv.atendime.tp_atendimento = 'I'`.
- Traz somente a última movimentação do atendimento no MOVEDOC.
- Mostra na fila apenas quando a última movimentação está recebida pelo usuário logado.
- Mantém validações manuais e ações de fluxo já visíveis para homologação.

## Configurar conexão MV

Edite `backend/.env`:

```env
MV_ORACLE_USER=SEU_USUARIO
MV_ORACLE_PASSWORD=SUA_SENHA
MV_ORACLE_CONNECT_STRING=IP:1521/SERVICE_NAME
```

Se sua máquina exigir Instant Client manual:

```env
ORACLE_CLIENT_LIB_DIR=C:\\oracle\\instantclient_21_13
```

## Rodar

```powershell
cd C:\Sistemas\roger-suite
npm install
npm run dev
```

## Query usada na fila

A regra central está em `backend/src/controllers/costaController.js`.
Ela usa `ROW_NUMBER()` para pegar a última movimentação por atendimento e filtra pelo usuário MV logado.
