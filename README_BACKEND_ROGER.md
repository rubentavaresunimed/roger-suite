# Backend do ROGER

Este pacote adiciona a primeira versão real do backend do ROGER:

- API Node/Express
- Banco interno SQLite
- Usuário administrador inicial
- Login real com JWT
- Endpoint de sessão `/api/auth/me`
- Proxy do Vite para `/api`

## Login inicial

Usuário:

```text
admin
```

Senha:

```text
admin
```

## Como usar

Extraia os arquivos deste ZIP dentro de:

```text
C:\Sistemas\roger-suite
```

Depois rode:

```powershell
cd C:\Sistemas\roger-suite
npm install
npm run dev
```

Acesse pela sua máquina:

```text
http://10.117.2.137:5173
```

Backend:

```text
http://10.117.2.137:3001/api/health
```

## Importante

O banco SQLite será criado automaticamente em:

```text
backend\data\roger.sqlite
```

O `.gitignore` já evita subir esse banco para o GitHub.

## CSS adicional

Se a tela de erro/login ou botão de sair ficarem sem estilo, copie o conteúdo de:

```text
src\App.backend-additions.css
```

e cole no final do arquivo:

```text
src\App.css
```
