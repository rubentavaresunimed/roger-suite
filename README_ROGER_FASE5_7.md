# ROGER — Fases 5 a 7

Este pacote adiciona:

## Fase 5 — Segurança real por permissão
- Rotas do backend protegidas por permissão.
- Regra final:
  1. Exceção individual do usuário
  2. Permissão herdada do perfil
  3. Negado por padrão
- Menus ocultados no frontend conforme permissões do usuário.
- Tela de acesso negado.

## Fase 6 — Melhorias operacionais
- Botões e ações ocultos quando o usuário não tem permissão.
- Mensagens de acesso negado.
- Tela mais moderna/tecnológica, mantendo verde escuro.
- Auditoria de acesso negado no log.

## Fase 7 — Preparação para produção
- Porta frontend fixa em 5173 no desenvolvimento.
- Script `npm run prod` para gerar build e servir pelo backend.
- Backend serve `dist/` automaticamente quando existir.

## Como rodar em desenvolvimento

```powershell
cd C:\Sistemas\roger-suite
npm install
npm run dev
```

Acessar:
- Frontend: http://10.117.2.137:5173
- Backend: http://10.117.2.137:3001/api/health

## Como rodar em produção simples

```powershell
cd C:\Sistemas\roger-suite
npm run prod
```

Acessar pelo backend:
- http://10.117.2.137:3001

## O que validar

1. Login admin/admin.
2. Dashboard abre normalmente.
3. Menu mostra as telas conforme o perfil.
4. Usuário administrador consegue:
   - criar/editar usuários;
   - criar/editar perfis;
   - criar/editar sistemas e recursos;
   - editar permissões por perfil;
   - editar exceções por usuário;
   - visualizar logs.
5. Criar um usuário com perfil Consulta.
6. Entrar com esse usuário.
7. Confirmar que ele vê menos menus.
8. Dar uma exceção individual para esse usuário.
9. Entrar novamente e confirmar que a exceção mudou o acesso.
10. Rodar `npm run prod` e validar acesso em http://10.117.2.137:3001.
