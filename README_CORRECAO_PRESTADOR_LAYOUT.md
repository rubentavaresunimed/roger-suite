# Correção — Área do prestador mais limpa

## Ajustes feitos

### Meus Módulos
- Remove busca, sino e card do usuário no topo.
- Coloca no topo apenas:
  - título da página
  - login/nome do usuário
  - botão Sair
- Centraliza o bloco "Bem-vindo".
- Remove os cards de contagem do lado direito.

### Sidebar do prestador
- Remove a seção "Ecossistema".
- Remove o card do usuário na parte de baixo.
- Mantém um layout mais limpo, focado só no acesso aos módulos.

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

## O que validar

1. Entrar com um usuário prestador.
2. Confirmar que no topo aparece apenas:
   - Meus Módulos
   - login/nome do usuário
   - botão Sair
3. Confirmar que a lateral ficou limpa.
4. Confirmar que o texto de boas-vindas ficou centralizado.
5. Confirmar que os módulos continuam funcionando.
