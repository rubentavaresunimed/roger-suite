# Correção — botão Sair no topo

## Problema

No painel administrativo do ROGER, o botão do usuário no canto superior direito não fazia logout.

## Correção

- O componente `Topbar` agora recebe `user` e `onLogout`.
- O canto superior direito mostra:
  - login/nome do usuário
  - perfil
  - botão `Sair`
- O botão executa logout real.

## Como aplicar

Extraia dentro de:

```powershell
C:\Sistemas\roger-suite
```

Depois rode:

```powershell
cd C:\Sistemas\roger-suite
npm run dev
```

## Validar

1. Entrar com admin.
2. Ver o botão Sair no topo direito.
3. Clicar em Sair.
4. Confirmar que volta para tela de login.
