# ROGER — Módulos internos com menu recolhível

## Mudança

Agora o usuário/prestador não abre módulo em nova aba.

O fluxo fica parecido com o MV:

```text
Prestador entra no ROGER
↓
Módulos liberados aparecem na lateral
↓
Prestador clica no módulo
↓
O módulo abre dentro do ROGER
```

## Importante

Para um módulo abrir dentro do ROGER, a URL do módulo precisa permitir ser exibida em iframe.

Como os módulos futuros serão nossos, o ideal depois é configurar todos para aceitar abertura dentro do ROGER e validar o token do usuário.

## O que validar

1. Entrar com admin.
2. Confirmar que o menu lateral pode recolher/expandir.
3. Entrar com usuário/prestador.
4. Confirmar que os módulos aparecem na lateral.
5. Confirmar que a seção "Ecossistema" antiga não aparece.
6. Clicar em um módulo liberado.
7. Confirmar que ele abre dentro do ROGER.
8. Testar o botão de menu recolhido para aumentar a área útil.
9. Testar logout.

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

## Git

Depois de validar:

```powershell
git status
git add .
git commit -m "Abre modulos dentro do ROGER com menu recolhivel"
git push
```
