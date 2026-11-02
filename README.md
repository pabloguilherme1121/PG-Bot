# PG Bot

Site independente do assistente **PG Bot**, com ajuda local para [PG Arcade](https://github.com/pabloguilherme1121/PG-Arcade) e [PG Estratégia](https://github.com/pabloguilherme1121/PG-Estrategia).

- **Código da interface:** `index.html`, `app.mjs`, `styles.css`.
- **Respostas locais testadas:** `bot-core.mjs`. Não usa API paga, não envia perguntas a servidores e não grava conversas.
- **PWA:** `sw.js` guarda arquivos do site após uma visita conectada. A primeira visita precisa de internet.
- **Testes:** `npm test`; `npm run check`; `npm run test:e2e`; `npm run build`.
- **Publicação:** GitHub Pages pela branch principal após testes locais. O modelo de CI em `docs/pages-workflow.example.yml` pode ser ativado quando a autenticação GitHub tiver permissão `workflow`.

## Contexto por link

`?product=arcade&game=snake` mostra ajuda com o jogo Snake. `?product=estrategia&mission=Conquista%20territorial%3A%20Aurora&turn=3%2F12` mostra apenas dados informados no próprio link. O site **não consulta partidas ativas** em outros separadores e não deve apresentar esses dados como atuais.

## Organização

O PG Arcade continua responsável pelo catálogo de jogos e seus motores. O PG Estratégia possui repositório e site próprios. Este repositório é o ponto de ajuda para ambos, mas os PG Bots embarcados nos jogos permanecem locais para funcionar offline. A unificação em pacote compartilhado requer migração e testes específicos antes de mudar os jogos.

## Segurança

Não há backend, login ou analytics. Todo conteúdo de resposta é inserido com `textContent`, e não como HTML. Entradas têm limite de 240 caracteres. Nenhum recurso remoto é necessário para responder.
