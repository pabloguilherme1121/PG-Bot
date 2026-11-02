# Validação Android físico: PG Bot, PG Estratégia e PG Arcade

**Estado em 02/11/2026:** pendente. O desktop de teste não possui `adb` disponível e nenhum dispositivo Android foi identificado entre os dispositivos PnP presentes. **Não confundir testes Playwright em desktop com teste físico.**

## Preparação verificável

1. Instale o Android SDK Platform-Tools oficial no Windows e adicione o diretório `platform-tools` ao PATH. Consulte https://developer.android.com/tools/releases/platform-tools.
2. Conecte o celular por USB, desbloqueie-o e habilite temporariamente a depuração USB. Execute `adb devices -l`. Só inicie testes quando constar exatamente um dispositivo **device** autorizado, não `offline` nem `unauthorized`. Revogue a depuração depois dos testes.
3. Anote localmente modelo, Android, versão do Chrome, resolução CSS, bateria aproximada e tipo de conexão. Não publique número de série, contas nem dados pessoais.

## Rodada obrigatória

Executar 5 sessões **frias** (abrir em aba nova após encerrar o processo) e 5 **quentes** (retornar ao jogo já carregado). Em cada rodada:

- Abrir o PG Bot e trocar entre Arcade/Estratégia, buscar título por regra, selecionar jogo, pedir Guia rápido e Plano de 3 passos, adicionar/remover favorito, reabrir aba, voltar pelo link compartilhado e limpar histórico recente.
- Verificar o teclado virtual, área de toque mínima, foco, leitura em 320/390 CSS px equivalentes quando aplicável, zoom 200%, orientação retrato/paisagem e ausência de rolagem horizontal na página.
- Jogar pelo menos 2 minutos em seis motores diferentes do Arcade: um de tabuleiro, um de cartas, um de reflexo, um de ação, um cooperativo local e um clássico. Documentar toque, pausa/retomada, reinício, vitória/derrota e retorno ao catálogo.
- Testar três missões de famílias diferentes no Estratégia, com diferentes dificuldades, e três jogos independentes. Conferir se o PG Bot da arena usa apenas dados reais do estado atual.
- Visitar cada site conectado, carregar um jogo, colocar em modo avião e recarregar. **Anotar separadamente** se o shell do PG Bot, a arena do Arcade, a missão e o jogo independente funcionam offline após o primeiro acesso; não assumir que todos os jogos estejam em cache.
- Observar travamentos, aquecimento, tempo até poder interagir, atrasos percebidos nos gestos, uso de memória se houver ferramenta de inspeção, persistência do progresso e comportamento quando o armazenamento é bloqueado.

## Critério de aceite e evidência

Aprovar somente com zero erros críticos reproduzíveis, nenhum controle essencial inacessível, dados de jogos preservados após reinício e offline funcionando nas páginas efetivamente testadas. Registrar em issue ou PR apenas modelo/versão/observação, nunca identificador único do dispositivo; anexar vídeo ou trace somente sem informações pessoais. **Os 150 jogos exigem uma auditoria automatizada adicional; seis sessões não comprovam sua conclusão.**

A auditoria de navegadores no desktop é complementar e não substitui esta etapa.
