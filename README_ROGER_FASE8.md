# ROGER — Fase 8: Integração com módulos

Este pacote transforma o ROGER em um portal central de módulos.

## O que validar

1. Entrar com admin/admin.
2. Conferir se apareceu o menu **Módulos**.
3. Abrir a tela **Módulos**.
4. Ver cards para ROGER, ÁUREA, DAVI, PEDRO, TEODORO e ROMEU.
5. Clicar em **Acessar módulo**.
6. Como os módulos ainda não têm URL real, o sistema pode avisar que está aguardando URL.
7. Ir em **Sistemas**.
8. Editar um sistema, por exemplo DAVI.
9. Preencher uma URL de teste, por exemplo:
   `http://10.117.2.137:5173`
10. Voltar em **Módulos** e clicar em **Acessar módulo**.
11. Confirmar se abre em nova aba.
12. Conferir em **Logs** se o acesso ao módulo foi registrado.
13. Testar com um usuário sem permissão para ver se o módulo aparece bloqueado.

## Como aplicar

Extraia dentro de:

```powershell
C:\Sistemas\roger-suite
```

Depois rode:

```powershell
cd C:\Sistemas\roger-suite
npm install
npm run dev
```

## Depois de validar

```powershell
git status
git add .
git commit -m "Adiciona fase 8 integracao com modulos"
git push
```
