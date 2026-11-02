# Telemetria experimental e homologação Android

## O que está disponível

A integração transmite o estado **de Domínio Territorial** e **de Gravidade dos Cristais** entre abas do PG Estratégia e do PG Bot, no mesmo navegador e sob a mesma origem `pabloguilherme1121.github.io`. Domínio Territorial informa turno, fase e suprimentos; Gravidade dos Cristais informa jogadas, fase e pontuação quando houver. Os demais jogos do Arcade, outras arenas e as 150 missões ainda não emitem telemetria com este protocolo.

Abra `PG-Estrategia/independentes/dominio-territorial/`, marque **Compartilhar turno e suprimentos com o PG Bot** e deixe a aba aberta. Em outra aba abra `PG-Bot/?projeto=estrategia&jogo=dominio-territorial` e marque **Acompanhar partida nesta aba**. Ao encerrar um turno, a interface do PG Bot passa a mostrar a atualização recebida. Uma pergunta como **Qual meu turno atual?** também usa esse dado enquanto estiver recente. A comunicação para quando qualquer opção é desligada, ou quando a aba do jogo é encerrada/suspensa por tempo suficiente.

Os emissores usam `BroadcastChannel('pg_telemetry_hub_v1')`, com `type=PG_STATE_TICK`, `version=1`, `project`, `gameId`, `timestamp`, `turn`, `score`, `phase`, `resources` e, opcionalmente, `moves`. Domínio Territorial informa `turn`, `phase`, `resources` e `score: null`; Gravidade dos Cristais informa `moves`, `phase`, `score` após vitória, `turn: null` e `resources: null`. A leitura valida tipos, limites, o contexto selecionado e uma validade de 15 segundos. Não envia nome do usuário, perguntas, mapa, histórico ou tokens; não utiliza servidor, cookies ou armazenamento para essa função. O guia `.txt` continua trazendo apenas as regras do catálogo, sem dados de partida.

**Limitações:** BroadcastChannel não autentica as outras abas da origem. Como vários projetos compartilham o mesmo host, uma aba que execute código não confiável na origem pode forjar mensagens. Portanto, estas mensagens são informativas, nunca autorizam ações nem devem conter segredos. Não há comunicação entre celulares e computadores distintos, e o Android pode suspender temporizadores em abas em segundo plano. Os 338 contextos ficam em um único catálogo local do PWA, não em 338 caches individuais. A primeira visita online continua necessária.

## Checklist de homologação física pendente

Ainda **não homologado em Android físico**. Registrar marca/modelo, Android, versão do Chrome, modo de navegação (gestos ou botões), data e evidências.

1. Abrir a versão publicada no Chrome Android e comprovar ausência de overflow nas larguras reais, orientação retrato e paisagem, teclado virtual aberto e fechando, zoom de fonte e foco.
2. Executar pelo menos cinco sessões frias e cinco sessões quentes; conferir toque único nas opções e no download do guia, teclado, TalkBack, barras do sistema e áreas seguras.
3. Com as duas páginas abertas, ativar a transmissão e confirmar que o turno do jogo chega ao PG Bot. Repetir após alternar abas, bloquear/desbloquear tela, suspender o Chrome e reabrir. Registrar a degradação/expiração quando o Android suspender a aba.
4. Visitar ambos os sites conectado, desligar rede e Wi-Fi (modo avião), atualizar as páginas, verificar o conteúdo local e o download do guia em `.txt`. Registrar se a versão do Chrome libera download local offline; conferir pasta Downloads.
5. Usar `adb devices -l` e `chrome://inspect/#devices` apenas após instalar/autorizar ADB, registrar console, falhas de rede, Cache Storage e detalhes de qualquer bug. Não declarar aprovação sem logs e provas de um dispositivo real.

Critério final: execução física registrada, sem erros reproduzíveis críticos de interface, sem vazamento de informações e sem promessas de sincronização quando o navegador suspender a aba.

## Android sem ADB e diagnóstico local

O checklist básico não exige ADB nem instalações: no Chrome do próprio celular, visitar os dois sites com Wi-Fi, ativar os dois controles de compartilhamento, alternar abas após uma jogada, verificar o contador e desativar ambos. Depois testar modo avião com os arquivos previamente abertos, refresh e guia `.txt`. Registrar modelo/Android/Chrome, vídeos ou capturas, horários de suspensão de abas e qualquer falha. ADB é **opcional** para coletar logs detalhados.

Evitar injetar `eruda` automaticamente por CDN em `?debug=1`: scripts de terceiros executados em `pabloguilherme1121.github.io` compartilham a origem com outros projetos, podem acessar armazenamento dessa origem e exigem rede. Se for necessário um console em produção, preferir um painel de diagnóstico próprio, com informações não sensíveis, ativado explicitamente e testado offline. Não usar `?debug=1` como promessa de diagnóstico até existir uma implementação auditada.
