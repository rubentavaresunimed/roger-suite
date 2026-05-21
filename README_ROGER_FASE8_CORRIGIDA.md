# ROGER — Fase 8 Corrigida: modelo Admin / Prestador / Módulos

Esta versão corrige o conceito da Fase 8.

## Ideia correta

O ROGER passa a funcionar parecido com a ideia do MV:

- Um perfil **Administrador** configura usuários/prestadores e acessos.
- O **prestador** entra com login e senha.
- Depois do login, ele vê a tela **Meus Módulos**.
- Ele escolhe qual módulo quer acessar.
- Se o prestador tem acesso ao módulo, ele entra no módulo.
- Dentro do módulo, por enquanto, ele tem acesso total.
- A única exceção futura será a parte de relatórios, principalmente no ÁUREA.

## O que muda

Sai o modelo pesado de permissão por recurso/ação para módulos.

Entra:

```text
Prestador X Módulo
Permitido ou Bloqueado
```

O controle fino fica reservado para o futuro, principalmente:

```text
ÁUREA > Relatórios
```

## O que validar

1. Entrar com admin/admin.
2. Ver que o admin tem menu administrativo:
   - Dashboard
   - Meus Módulos
   - Usuários
   - Perfis
   - Sistemas
   - Acessos
   - Logs
3. Acessar **Acessos**.
4. Selecionar um usuário/prestador.
5. Liberar ou bloquear módulos para ele.
6. Criar um usuário com perfil Consulta ou Prestador.
7. Logar com esse usuário.
8. Ver que ele cai na tela **Meus Módulos**.
9. Confirmar que ele vê apenas os módulos liberados.
10. Confirmar que módulos bloqueados aparecem bloqueados ou não acessam.
11. Configurar URL de um módulo em Sistemas.
12. Clicar em Acessar módulo e confirmar abertura em nova aba.
13. Conferir logs de acesso.

## Como aplicar

Extraia este ZIP dentro de:

```powershell
C:\Sistemas\roger-suite
```

Depois rode:

```powershell
cd C:\Sistemas\roger-suite
npm install
npm run dev
```

## Git

Depois de validar:

```powershell
git status
git add .
git commit -m "Ajusta fase 8 para acesso por prestador e modulo"
git push
```
