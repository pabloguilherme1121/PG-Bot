# PG Bot

Site independente do PG Bot, conectado por **links diretos** ao PG Arcade e ao PG Estratégia.

- Site: https://pabloguilherme1121.github.io/PG-Bot/
- Código: https://github.com/pabloguilherme1121/PG-Bot
- PG Arcade: https://pabloguilherme1121.github.io/PG-Arcade/
- PG Estratégia: https://pabloguilherme1121.github.io/PG-Estrategia/

## O que faz

O PG Bot responde perguntas em português sobre objetivos, controles, dicas, acessibilidade, recordes, reinício e modo offline de **150 jogos reais do Arcade, 150 missões do Estratégia e 36 jogos independentes**. Permite buscar por nome, escolher um título e abrir a partida certa.

**Não é um modelo de IA conectado.** O código usa regras locais e um catálogo JSON de instruções retiradas dos projetos. As perguntas não são enviadas a uma API nem gravadas em um servidor. O site não vê a partida em tempo real: para consultar turno e placar, o usuário abre o PG Bot dentro do jogo correspondente.

O site é um PWA: depois de uma visita conectada e de armazenar os recursos no navegador, o assistente pode funcionar offline. Os próprios jogos têm políticas de cache separadas; a primeira visita sem internet pode falhar.

## Novas ferramentas

- Filtro por tipo: escolha entre missões e jogos originais no PG Estratégia. O PG Arcade continua com seu catálogo de jogos.
- Busca contextual: encontre jogos também pelas regras, objetivos, orientações e dificuldade; nomes e IDs recebem prioridade nos resultados.
- Guia rápido: reúne objetivo, dificuldade quando disponível, regras, controles e dicas presentes no catálogo para o jogo selecionado, sem inventar dados da partida.
- Sugestão de partida: escolhe um título real dentro da busca e dos filtros ativos, sem inventar rankings.
- Link de ajuda: permite compartilhar uma URL com `projeto` e `jogo` validados, sem incluir perguntas ou histórico de conversa. Se o navegador bloquear a cópia, o endereço atual pode ser copiado manualmente.
- Limpar conversa: apaga as mensagens exibidas nesta aba. Perguntas continuam sem armazenamento permanente ou envio a servidores.
- Plano de 3 passos: reúne objetivo, controles e dica do título selecionado, usando somente o catálogo local. O painel de mensagens pode receber foco no teclado para ler orientações longas.
- Links diretos para qualquer ID do catálogo, mesmo fora dos primeiros 80 resultados exibidos.
- Histórico local de até seis títulos consultados, incluindo Arcade e Estratégia, com retorno direto e opção de limpar. Guarda só IDs válidos, sem retomar o estado real das partidas.
- Cache PWA v4: invalida somente versões antigas do próprio PG Bot, preservando o cache separado dos jogos.

## Favoritos locais

- Adicione ou remova jogos dos favoritos diretamente no catálogo e filtre para mostrar somente os salvos.
- Os favoritos usam apenas IDs de títulos existentes, separados por projeto. Não são enviadas perguntas nem informações de progresso.
- A preferência fica somente neste navegador. Se o armazenamento estiver indisponível, continua funcionando na aba atual, com aviso explícito.
- A lista armazenada é validada contra os jogos reais na próxima abertura, sem recuperar IDs removidos ou inexistentes.

## Organização

- `index.html`: navegação, seleção dos catálogos e chat acessível.
- `styles.css`: design responsivo, telas 320/390 px, estilos de foco e redução de movimento.
- `app.mjs`: motor de perguntas e interface, sem bibliotecas de IA.
- `recent.mjs`: histórico local curto de consultas, sem registrar perguntas ou progresso.
- `data/games.json`: snapshot versionado de IDs, nomes, descrições e instruções reais dos dois catálogos.
- `brand/pg-bot/mascot.webp`: mascote original, servido localmente.
- `sw.js`, `manifest.webmanifest`: cache e PWA isolados dos outros projetos.
- `tests/` e `e2e/`: testes unitários, validação estática e browser.
- `scripts/`: servidor local para desenvolvimento e verificação do site.

## Rodar

Node.js 22+.

```bash
npm ci
npm test
npm run build
npm run dev
```

Prévia local: http://127.0.0.1:5482/PG-Bot/

Para validar interação em navegadores:

```bash
npx playwright install chromium firefox webkit
npm run test:e2e
```

## Auditoria dos catálogos e links

O build verifica os 336 registros, contagens, tipos, IDs repetidos e destinos HTTPS. Uma comparação adicional com os repositórios de origem confirma se os IDs do PG Arcade, das 150 missões, dos nove clássicos e dos 27 jogos independentes continuam correspondentes.

Com checkouts locais ao lado do PG Bot:

```bash
node scripts/audit-catalog.mjs --arcade-root=../PG-Arcade --strategy-root=../PG-Estrategia
```

No GitHub Actions, o job **Comparar catálogo com Arcade e Estratégia** executa essa verificação em PRs, commits na main e semanalmente. Ele falha se houver divergência, sem modificar ou publicar os projetos. A auditoria confere IDs e URLs, mas não garante que todas as descrições e regras continuem idênticas às fontes. Esse conteúdo exige revisão quando um jogo mudar.

## Sincronização assistida das fontes

Quando um jogo independente publica um manifesto `game.meta.json`, o extrator verifica ID, título, motor, objetivo, instruções de toque e teclado, versão e exatamente três orientações estratégicas. Campos vazios, HTML e IDs divergentes bloqueiam a importação. O manifesto passa a ser a fonte principal de nome, objetivo e instruções daquele jogo; o texto editorial do PG Bot continua protegido pela revisão de diferenças.

O job [Propor sincronização do catálogo PG Bot](./.github/workflows/catalog-sync.yml) verifica diariamente o PG Arcade e o PG Estratégia. O script `scripts/sync-catalog.mjs` extrai metadados declarativos (nome, descrição e instruções explícitas), mantendo uma linha de base em `data/source-metadata.json`.

Uma mudança na fonte **só atualiza automaticamente um campo do candidato quando o campo do PG Bot ainda coincide com o texto da fonte anterior**. Se o PG Bot tiver uma descrição ou ajuda personalizada, o texto é mantido e aparece como pendência em `docs/catalog-sync-review.md`. Novos jogos são sinalizados sem serem inventados nem incluídos automaticamente. Toda alteração é proposta em **pull request em rascunho**: nenhuma mesclagem ou publicação acontece sem revisão.

Executar manualmente com cópias dos dois projetos:

```bash
node scripts/sync-catalog.mjs --arcade-root=../PG-Arcade --strategy-root=../PG-Estrategia
node scripts/sync-catalog.mjs --arcade-root=../PG-Arcade --strategy-root=../PG-Estrategia --write
```

A criação automática de PRs pelo `GITHUB_TOKEN` depende de a configuração do repositório permitir essa ação. Se a automação falhar por permissão, habilite em Settings → Actions → General a criação de pull requests pelo GitHub Actions; não use tokens pessoais no código.

## Manutenção dos dados

`data/games.json` é um snapshot extraído do código original dos jogos em 1º de novembro de 2026, não um feed em tempo real. Quando um jogo é adicionado, removido ou renomeado no Arcade ou Estratégia, o catálogo do PG Bot precisa ser revalidado e atualizado junto aos testes. Mantenha os IDs e URLs reais, sem inventar títulos ou funcionalidades.

O site estático é publicado pelo GitHub Pages a partir da branch `main` (raiz `/`). Antes de publicar uma nova versão, executar os testes e atualizar o snapshot de acordo com o estado real dos dois projetos.

## Licença

MIT, preservada do projeto PG Arcade.
