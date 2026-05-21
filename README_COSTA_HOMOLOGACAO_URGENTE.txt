ROGER + COSTA - pacote de homologação urgente

O que foi ajustado:
1. .env preenchido na raiz e em backend/.env com o Oracle informado.
2. Backend carrega .env da raiz e de backend/.env, independente da pasta onde o npm for executado.
3. COSTA usa a fila real do MV pela última movimentação recebida no MOVEDOC.
4. Query filtra apenas dbamv.atendime.tp_atendimento = 'I'.
5. node-oracledb tenta ativar Thick Mode automaticamente para resolver NJS-116.

Comando:
cd C:\Sistemas\roger-suite
npm install
npm run dev

Se aparecer NJS-116:
O Oracle do MV não aceita Thin Mode do node-oracledb. Instale Oracle Instant Client Basic 19/21/23 na máquina e informe no arquivo .env:
ORACLE_CLIENT_LIB_DIR=C:\instantclient_21_13

Depois reinicie com npm run dev.
