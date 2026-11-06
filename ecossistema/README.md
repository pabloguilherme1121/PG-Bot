# PG Bot | Consulta pública do ecossistema

Primeira entrega isolada da evolução do PG Bot. O assistente original, o painel em `painel/`, a telemetria e o service worker não são importados ou modificados por esta etapa.

## Capacidades incluídas

- Inventário dos **repositórios públicos** de `pabloguilherme1121`, com busca e paginação de seis itens.
- Consulta sob demanda de README, cinco PRs recentes e cinco runs recentes do projeto selecionado.
- Perguntas rápidas determinísticas sobre documentação, repositório, PRs, CI e endereço informado no GitHub. Toda resposta oferece origem e data quando disponível, distinguindo dados antigos de indisponíveis.
- Atualização ao abrir e no botão. Cache local de 15 minutos para evitar repetição de consultas; em erro de rede ou limite de API o último resultado válido permanece. Nenhum dado inventado.
- Fila local de sugestões com motivo, próximo passo, projeto, evidência, edição, revisão, exclusão e exportação JSON. **Nada é executado.**
- Interface mobile independente, com foco visível e controles por teclado, e componente incorporável com contexto de projeto explícito.

O módulo é deliberadamente **somente leitura**. Não acessa dados privados, não usa credenciais, não cria PRs, não faz merge, não publica e não acessa o estado dos jogos ou de outras aplicações. Resumos são extratos limitados de documentação, não respostas geradas por um modelo. A API pública GitHub limita o volume de requisições. Uma URL de homepage é um dado cadastrado no GitHub, **não uma publicação homologada**.

## Abrir

Com `npm run dev`, acesse `http://127.0.0.1:5482/PG-Bot/ecossistema/`.

No GitHub Pages, após deploy e smoke reais, a URL esperada é `https://pabloguilherme1121.github.io/PG-Bot/ecossistema/`. Não considerar publicada somente por existir no código.

## Integração opt-in, sem mudanças nos motores

O projeto hospedeiro pode usar:

```html
<script defer src="https://pabloguilherme1121.github.io/PG-Bot/ecossistema/embed.js" data-project="PG-Arcade"></script>
```

Troque `data-project` pelo **nome exato do repositório público** (por exemplo `PG-Estrategia`). O widget cria um botão e um iframe acessível em Shadow DOM. Ele **não lê dados da página hospedeira** nem recebe credenciais, dados privados, progresso do jogo ou telemetria. A integração deve ser testada individualmente no projeto antes de ser marcada como concluída. Em Cuidador(a), manter exclusivamente ajuda documental pública.

## Testes e critérios

```bash
npm test
npx playwright test e2e/ecosystem.spec.ts --project=chromium
npx playwright test e2e/ecosystem.spec.ts --project=firefox
npx playwright test e2e/ecosystem.spec.ts --project=webkit
```

Verificar manualmente a interface em 320 e 390 px, navegação teclado/tecnologia assistiva, modo offline, throttling e limite de API, preservação da fila e download. Depois, verificar o CI na SHA final e, **se aprovado**, avaliar merge e deploy como etapas separadas. Android físico depende de registros do aparelho e não é inferido de testes desktop.

## Ferramentas desta etapa

- GitHub conectado: inspeção de código, PRs e criação da branch de trabalho.
- GitHub Actions: runner dos testes após a PR.
- Playwright: testes acrescentados; aprovação depende das execuções efetivas dos jobs.

Nenhum plugin de design, scanner de segurança ou navegador foi declarado como executado sem evidência.
