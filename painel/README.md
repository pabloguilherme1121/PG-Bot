# PG Bot Control Center

Painel estático isolado em `painel/`, para acompanhar integração entre PG Bot, PG Estratégia e PGA Arcade.

## O que faz
- Rastreia 18 critérios críticos por projeto, links e revisão de evidências.
- Monitora PRs públicas e runs de qualidade na `main` somente quando o usuário seleciona **Consultar GitHub** (API pública, sem token).
- Distingue merge, execução de CI, revisão humana e publicação.
- Organiza catálogo de integrações, testes Playwright 320/390, telemetria, contratos, offline, Android e fila prioritária.
- Permite editar estados/checklists, anexar URL HTTPS e exportar/importar JSON.

## Limites
- Edições persistem somente no navegador: não há backend, login ou sincronização entre dispositivos.
- GitHub API pode retornar erro ou rate limit. Nesses casos permanece o último snapshot, sem inventar status.
- Revisão humana é marcada explicitamente, não é uma verificação automática.
- O painel não faz merge, deploy, mudanças nos motores, nem executa testes no aparelho físico.
- `100%` mede gates críticos com prova validada, não linhas de código ou funcionamento universal.

## Teste
No repositório PG-Bot: `npx playwright test e2e/control-center.spec.ts`.
O workflow de qualidade já executa os arquivos `e2e/*.spec.ts` nas 3 engines.
Para abrir localmente, rode `npm run dev` na raiz e acesse `http://127.0.0.1:5482/PG-Bot/painel/`.

## Arquitetura
`data.mjs` define snapshot e gates, `app.mjs` apresenta estado e fluxos, `styles.css` trata mobile e acessibilidade. O código não importa `app.mjs`, `live-telemetry.mjs` ou motores de jogos da aplicação principal, reduzindo risco de regressão. Não há novas dependências npm.
