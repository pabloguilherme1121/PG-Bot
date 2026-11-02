# Telemetria experimental e homologação Android

## O que está disponível

A primeira integração transmite o estado **de Domínio Territorial** entre abas do PG Estratégia e do PG Bot, no mesmo navegador e sob a mesma origem `pabloguilherme1121.github.io`. Outros jogos do Arcade, outras arenas e as 150 missões ainda não emitem telemetria com este protocolo.

Abra `PG-Estrategia/independentes/dominio-territorial/`, marque **Compartilhar turno e suprimentos com o PG Bot** e deixe a aba aberta. Em outra aba abra `PG-Bot/?projeto=estrategia&jogo=dominio-territorial` e marque **Acompanhar partida nesta aba**. Ao encerrar um turno, a interface do PG Bot passa a mostrar a atualização recebida. Uma pergunta como **Qual meu turno atual?** também usa esse dado enquanto estiver recente. A comunicação para quando qualquer opção é desligada, ou quando a aba do jogo é encerrada/suspensa por tempo suficiente.

O emissor usa `BroadcastChannel('pg_telemetry_hub_v1')`, com `type=PG_STATE_TICK`, `version=1`, `project`, `gameId`, `timestamp`, `turn`, `score`, `phase`, `resources`. Envia apenas `turn`, `phase` e `resources` de Domínio Territorial, com `score: null`. A leitura valida tipos, limites, o contexto selecionado e uma validade de 15 segundos. Não envia nome do usuário, perguntas, mapa, histórico ou tokens; não utiliza servidor, cookies ou armazenamento para essa função. O guia `.txt` continua trazendo apenas as regras do catálogo, sem dados de partida.

**Limitações:** BroadcastChannel não autentica as outras abas da origem. Como vários projetos compartilham o mesmo host, uma aba que execute código não confiável na origem pode forjar mensagens. Portanto, estas mensagens são informativas, nunca autorizam ações nem devem conter segredos. Não há comunicação entre celulares e computadores distintos, e o Android pode suspender temporizadores em abas em segundo plano. Os 338 contextos ficam em um único catálogo local do PWA, não em 338 caches individuais. A primeira visita online continua necessária.

## Checklist de homologação física pendente

Ainda **não homologado em Android físico**. Registrar marca/modelo, Android, versão do Chrome, modo de navegação (gestos ou botões), data e evidências.

1. Abrir a versão publicada no Chrome Android e comprovar ausência de overflow nas larguras reais, orientação retrato e paisagem, teclado virtual aberto e fechando, zoom de fonte e foco.
2. Executar pelo menos cinco sessões frias e cinco sessões quentes; conferir toque único nas opções e no download do guia, teclado, TalkBack, barras do sistema e áreas seguras.
3. Com as duas páginas abertas, ativar a transmissão e confirmar que o turno do jogo chega ao PG Bot. Repetir após alternar abas, bloquear/desbloquear tela, suspender o Chrome e reabrir. Registrar a degradação/expiração quando o Android suspender a aba.
4. Visitar ambos os sites conectado, desligar rede e Wi-Fi (modo avião), atualizar as páginas, verificar o conteúdo local e o download do guia em `.txt`. Registrar se a versão do Chrome libera download local offline; conferir pasta Downloads.
5. Usar `adb devices -l` e `chrome://inspect/#devices` apenas após instalar/autorizar ADB, registrar console, falhas de rede, Cache Storage e detalhes de qualquer bug. Não declarar aprovação sem logs e provas de um dispositivo real.

Critério final: execução física registrada, sem erros reproduzíveis críticos de interface, sem vazamento de informações e sem promessas de sincronização quando o navegador suspender a aba.
