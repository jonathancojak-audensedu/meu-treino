# Meu Treino

App de registro de treino de musculação. Responde um questionário, recebe um programa montado sob medida, registra as séries e acompanha a evolução ao longo do tempo.

HTML, CSS e JavaScript puro, sem framework e sem etapa de build. Funciona offline, roda no GitHub Pages e **todos os dados ficam no aparelho de quem usa**: não existe backend, conta nem login.

## O que o app faz

**Monta o programa a partir de 8 perguntas.** Nome, experiência, dias por semana, tempo por sessão, onde treina, objetivo, dores e prioridade muscular. O gerador escolhe a divisão e preenche os exercícios respeitando as três coisas que mais mudam um treino:

- **Equipamento disponível.** Quatro cenários: academia completa, academia simples, em casa com halteres ou elásticos, e só peso corporal. Nada é prescrito sem o equipamento que a pessoa declarou ter.
- **Dores.** Exercício que carrega uma articulação marcada como dolorida sai da lista. Quem declarou dor recebe mais movimento guiado (máquina e cabo), que é o mais seguro entre os que sobram.
- **Objetivo.** Força, hipertrofia, perder gordura ou saúde. Muda séries, faixa de repetição, descanso e se entra cardio.

Quatro objetivos, de 2 a 6 dias por semana, 11 modelos de dia. Priorizar braços rende uma divisão com dia dedicado, não só um empurrão na pontuação.

**Catálogo de 158 exercícios**, 139 deles com fotos de execução. Cada um traz padrão de movimento, músculos com peso, equipamento exigido, articulações que carrega e complexidade. O programa só prescreve séries e repetições, referenciando o id do exercício, então dá pra trocar tudo sem quebrar o histórico.

**Motor de progressão com dupla progressão.** Com a mesma carga, a pessoa vai enchendo as repetições dentro da faixa. Quando fecha todas as séries no topo, o app sugere subir a carga. Depois de três sessões no mesmo ponto, sugere aliviar pra destravar. O incremento sai do que o equipamento permite: barra de perna anda de 5 em 5, halter de 2 em 2, máquina de placa em placa.

Nada disso é automático. No fim do treino aparece um bloco com a carga proposta num campo editável, e ela só passa a valer depois de confirmar.

**Home de incentivo.** Saudação que muda a cada abertura, quanto falta pra fechar a meta da semana, faixa dos sete dias, gráfico de evolução desenhado à mão em SVG e o próximo treino como ação principal.

**Navegação de quatro abas:** Início, Treinos, Histórico e Ajustes.

**Durante o treino:** timer de descanso configurável, sugestão de carga pelo histórico, propagação de valores entre séries, trocar exercício com busca, reordenar, incluir e excluir, e fotos de execução em quem tem.

**Histórico:** todas as séries de todos os treinos, evolução por exercício com gráfico, calendário e tela de resumo com recordes. Dá pra compartilhar o treino como imagem, com foto tirada na hora.

## Estrutura

```
index.html              markup
css/app.css             todo o CSS
js/main.js              boot, tela inicial, backup, diagnóstico, eventos, window.MT
js/onboarding.js        as 8 perguntas, perfil, dados corporais, IMC/TMB
js/generator.js         gerarPrograma e auxiliares, função pura
js/catalog.js           catálogo de exercícios (EX, META, EQUIP)
js/session.js           sessão ativa, descanso, progressão, edição, compartilhar
js/store.js             IndexedDB com localStorage de reserva, migrações, backup
js/history.js           histórico, evolução, calendário, métricas da home
js/ui.js                folhas, confirmação, toast, formatações genéricas
sw.js                   service worker, cache offline
tests/                  37 arquivos de teste em Node com jsdom
img/exercicios/         fotos de execução
```

O app carrega como módulos ES nativos (`<script type="module" src="./js/main.js">`), sem bundler. Isso tem uma consequência direta: **abrir `index.html` pelo `file://` não funciona**, porque módulos ES exigem `http(s)://`. Para testar localmente, suba um servidor estático:

```bash
python3 -m http.server 8000
```

E abra `http://localhost:8000`.

## Armazenamento

IndexedDB é o armazenamento principal, com localStorage como rede de segurança. As chaves são `history`, `profile`, `corpo`, `overrides`, `custom_ex`, `program`, `favoritos`, `settings` e `avatar`.

O formato dos dados é versionado (`SCHEMA_VERSION`, hoje na 2). A migração roda no boot, antes de qualquer renderização, e salva uma cópia bruta antes de escrever qualquer coisa. Se uma migração falhar, nada é sobrescrito: os dados originais continuam intactos e a pessoa é avisada de que existe uma cópia de segurança.

Backup é manual, exportável e importável em JSON, por Ajustes.

## Como publicar

Todos os arquivos vão para a raiz do repositório (ou a pasta que o Pages serve). Os caminhos são relativos, então funciona tanto em `usuario.github.io` quanto em `usuario.github.io/meu-treino/`.

**Ao editar `index.html`, qualquer arquivo em `js/` ou `css/`, suba a `VERSION` no `sw.js`:**

```js
const VERSION = 'meu-treino-v52';
```

Sem isso o service worker continua servindo a versão antiga do cache e parece que a alteração não subiu. É o erro mais comum deste projeto.

Se criar um arquivo novo em `js/` ou `css/`, adicione o caminho na lista `SHELL` do `sw.js`, senão ele nunca entra no cache offline.

## Como instalar no celular

- **Android:** abra o site no Chrome e toque no menu (⋮), depois em "Adicionar à tela inicial" ou "Instalar app". Também há um atalho em Ajustes dentro do próprio app.
- **iPhone:** abra no Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".

Instalar não é opcional se você leva o histórico a sério. No iOS, o Safari apaga dados de sites não instalados depois de 7 dias sem uso. Apps na tela de início ficam de fora dessa regra.

## Testes

```bash
npm install          # instala o jsdom, só na primeira vez
node tests/run-all.js
```

Rode antes de commitar. São 37 arquivos cobrindo sessão de treino, persistência, onboarding, gerador (com 1.700 combinações de perfil), progressão de carga, evolução, migração de dados, acessibilidade, desempenho, compartilhamento e navegação.

O teste do gerador verifica nove propriedades por programa: equipamento disponível, exclusão por articulação com dor, complexidade compatível com iniciante, teto de exercícios pelo tempo, duração estimada, mínimo de exercícios por dia, ausência de repetição no mesmo dia, faixas de série válidas e prescrição completa.

## Depuração

No console do navegador, durante um treino: `MT.session`, `MT.history`, `MT.profile`, `MT.program`, `MT.settings`, `MT.gerar(MT.profile)`, `MT.volume(MT.program)`, `MT.schemaVersion`, `MT.erros`.

Há também uma tela de Diagnóstico em Ajustes, com versão do app, erros recentes, espaço usado e se está instalado.

## Princípios

Estes não se negociam sem motivo forte:

1. **Nunca perder dado do usuário.** Autosave a cada digitação, backup exportável e migração versionada.
2. **Funcionar com o celular no bolso e sem sinal.**
3. **Menos digitação possível durante o treino**, porque toda fricção vira abandono.
4. **Nunca prescrever exercício que carrega articulação marcada como dolorida.**
5. **Deixar claro que o app não substitui avaliação profissional.**
6. **Sem backend, sem login, sem framework e sem dependência nova.** O app precisa continuar funcionando como arquivos estáticos.

## Créditos

As fotos de execução dos exercícios (em `img/exercicios/`) vêm de [free-exercise-db](https://github.com/yuhonas/free-exercise-db), de yuhonas, licenciado sob [Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE) (domínio público, cópia e redistribuição livres). As imagens originais foram redimensionadas para 400px de largura e recomprimidas em WebP qualidade 80, com JPEG de reserva para navegadores sem suporte a WebP. Alguns exercícios do catálogo ficam sem foto por não ter correspondente identificado na fonte.

---

Este app não substitui avaliação de um profissional de educação física ou de saúde. Se você tem dor, lesão ou condição clínica, procure orientação antes de treinar.
