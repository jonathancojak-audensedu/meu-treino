# Meu Treino

App de registro de treino que roda no GitHub Pages, funciona offline e guarda tudo no próprio aparelho.

## Como publicar

Jogue todos os arquivos na raiz do repositório (ou na pasta que o Pages serve) e faça o commit:

```
index.html
app.js
sw.js
manifest.webmanifest
icon-192.png
icon-512.png
icon-maskable-512.png
apple-touch-icon.png
```

Todos os caminhos são relativos, então funciona tanto em `usuario.github.io` quanto em `usuario.github.io/meu-treino/`.

**Importante:** sempre que você editar `index.html` ou `app.js`, suba a versão na primeira linha útil do `sw.js`:

```js
const VERSION = 'meu-treino-v2';
```

Sem isso o service worker continua servindo a versão antiga do cache e parece que sua alteração não subiu.

## Como instalar no celular

- **Android:** abra o site no Chrome, vá em Ajustes dentro do app e toque em "Instalar na tela de início".
- **iPhone:** abra no Safari, toque em compartilhar e depois em "Adicionar à Tela de Início".

Instalar não é opcional se você leva o histórico a sério. No iOS, o Safari apaga dados de sites depois de 7 dias sem uso. Apps na tela de início ficam de fora dessa regra.

## O que mudou em relação à versão anterior

**Perda de dados**
- Sessão salva no armazenamento a cada digitação e a cada série marcada. Fechou o app, retomou de onde parou.
- Banner de "treino em andamento" na home, com opção de retomar ou descartar.
- IndexedDB como armazenamento principal e localStorage como rede de segurança.
- Exportar e restaurar backup em JSON.
- Sessão abandonada há mais de 12 horas não volta sozinha.

**Timer**
- Descanso calculado por horário de término, não por contador. Sobrevive a tela bloqueada e app em segundo plano.
- Recalcula sozinho quando o app volta do segundo plano.
- Bipe e vibração quando o descanso acaba. O áudio é destravado no toque em "Iniciar treino", que é a exigência do iOS.
- Tela não apaga durante o treino (Wake Lock), com chave para desligar nos ajustes.

**Progressão**
- Histórico guarda todas as séries, não só a melhor.
- A carga da última vez aparece abaixo de cada campo, e a carga da série anterior é repetida automaticamente quando você marca uma série com o campo vazio.
- Tela de resumo ao finalizar, com recordes batidos e comparação de volume com a última vez que você fez aquele treino.
- Exercícios de tempo e distância (prancha, farmer, fecho de pegada) ficam fora do cálculo de volume em kg.

**Estrutura**
- Catálogo de exercícios separado do programa. Cada exercício tem tipo, observações e alternativas.
- Botão "trocar" durante o treino, com as alternativas de cada exercício.
- Botões de mais e menos série durante o treino.

**Interface**
- Home destaca o próximo treino sugerido e mostra há quantos dias você fez cada um.
- Exercício concluído colapsa e a tela rola para o próximo.
- Timer de descanso não cobre mais a navegação.
- Botão de concluir série com 44x44px, o mínimo recomendado para toque.
- Contraste corrigido nos textos secundários, zoom liberado, campos com rótulo para leitor de tela, modais fecham com Esc e tocando no fundo.
- Alertas nativos trocados por folhas deslizantes.
- Fontes agora carregam de verdade.

## v2: o que entrou depois do primeiro uso

- **Ordem dos exercícios:** botões de subir e descer em cada exercício durante o treino. Ao finalizar, o app pergunta se a nova montagem vira o padrão daquele dia.
- **Trocar exercício com busca:** o botão "trocar" abre uma lista com campo de busca por nome ou grupo muscular, com as alternativas sugeridas no topo. Se não achar, dá para criar um exercício novo, que fica salvo no seu catálogo.
- **Incluir e excluir:** botão de adicionar exercício no fim da lista, e exclusão arrastando o card para a esquerda (com opção de desfazer) ou pelo botão "excluir".
- **Steppers de repetições:** os botões + e − ao lado do campo. O primeiro toque preenche com o alvo da série ou com o que você fez da última vez, os seguintes somam e subtraem de 1 em 1.
- **Treino livre:** card na home para montar um treino extra do zero, escolhendo os exercícios na hora.
- **Double perfect:** dois treinos no mesmo dia deixam o dia dourado com estrela no calendário, e a tela de resumo comemora.
- **Exercício concluído em destaque:** barra verde na lateral, selo de concluído e a lista das séries que você fez aparecendo no card fechado.
- **Descanso mais confiável:** o bipe agora é agendado no relógio do áudio quando a série é marcada, então toca na hora certa mesmo com o navegador congelando os temporizadores em segundo plano. Um áudio silencioso segura a sessão de som durante o descanso.
- **Campos só numéricos:** teclado numérico e bloqueio de letras nos campos de carga e repetição.
- **Ajustes:** opção de restaurar o programa original, desfazendo as montagens salvas.

Para inspecionar o estado durante um treino, abra o console e use `MT.session`, `MT.history` ou `MT.overrides`.

## Próximo passo

O onboarding que monta o treino a partir de respostas. A estrutura já está pronta para isso: o `PROGRAM` só prescreve padrões de movimento e o `EX` diz o que cada exercício exige. Falta o questionário e o motor de regras que escolhe o split e preenche os exercícios conforme equipamento disponível e dores relatadas.
