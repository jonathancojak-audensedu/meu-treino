# Meu Treino

App de registro de treino de musculação. HTML, CSS e JavaScript puro, sem framework e sem build. Publicado como site estático no GitHub Pages. Todos os dados ficam no aparelho do usuário, não existe backend.

## Arquivos

- `index.html` — markup
- `css/app.css` — todo o CSS
- `js/main.js` — ponto de entrada: boot(), tela inicial, backup, diagnóstico de erros, ligação de todos os eventos, `window.MT`
- `js/catalog.js` — catálogo de exercícios (`EX`, `META`, `EQUIP`)
- `js/generator.js` — `gerarPrograma` e auxiliares, função pura
- `js/store.js` — `Store` (IndexedDB com localStorage de reserva), versionamento dos dados, formato do backup
- `js/ui.js` — folhas, confirmação, toast, backdrop, seletores e formatações genéricas (`$`, `esc`)
- `js/history.js` — histórico, evolução (gráficos), calendário
- `js/session.js` — sessão ativa, descanso, edição de sessão/programa, seletor de exercício
- `js/onboarding.js` — as 8 perguntas, perfil, dados corporais, IMC/TMB
- `sw.js` — service worker, cache offline
- `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png` — PWA
- `silence.wav` — áudio silencioso que segura a sessão de som durante o descanso
- `tests/` — testes em Node com jsdom, mais `_helpers.js` e `_loader.mjs` (infraestrutura compartilhada, não são teste em si)

O app é carregado como módulos ES nativos (`<script type="module" src="./js/main.js">`), sem build. Isso tem uma consequência direta pro desenvolvimento local: **abrir `index.html` direto pelo `file://` não funciona**, porque módulos ES exigem `http(s)://`. Para testar no navegador localmente, suba um servidor estático primeiro, por exemplo `python3 -m http.server` na raiz do repositório, e abra `http://localhost:8000`.

## Regras obrigatórias

1. **Sempre suba a `VERSION` no `sw.js`** ao alterar `index.html`, qualquer arquivo em `js/` ou `css/`. Sem isso o service worker serve a versão antiga do cache e parece que a alteração não subiu. É o erro mais comum deste projeto. Essa `VERSION` e a `version` do `package.json` têm propósitos independentes: uma invalida o cache do navegador, a outra versiona o pacote. Não tente mantê-las iguais. Se criar um arquivo novo em `js/` ou `css/`, adicione o caminho na lista `SHELL` do `sw.js`, senão ele nunca entra no cache offline. Se a mudança for visível pra pessoa que usa o app, adicione também uma entrada em `NOVIDADES` (`js/main.js`), que alimenta a tela Sobre.
2. **Rode os testes antes de commitar:** `node tests/run-all.js`. Se algum falhar, corrija antes de subir.
3. **Nunca use `localStorage` ou `sessionStorage` como armazenamento principal.** O padrão é IndexedDB através do objeto `Store` (`js/store.js`), com localStorage só como rede de segurança.
4. **Todo texto visível é em português do Brasil**, com acentuação correta.
5. **Não use travessão** em nenhum texto de interface nem em comentário.
6. **Caminhos sempre relativos** (`./sw.js`, `icon-192.png`). O site roda em subpasta do GitHub Pages e caminho absoluto quebra o PWA.
7. **Não adicione dependência externa nem framework.** O app precisa continuar funcionando offline, servido como arquivos estáticos.

## Arquitetura que importa

**Estado mutável compartilhado usa par getter/setter entre módulos.** Um módulo ES não pode reatribuir um binding importado de outro (só mutar em lugar: `push`, `unshift`, `obj.chave = valor`). Onde um valor inteiro precisa ser substituído por outro módulo (`history`, `session`, `overrides`, `customEx`, `favoritos`, `profile`, `corpo`, `PROGRAM`), o módulo dono exporta `setX()` (ex: `setHistory`, `setSession`) e quem importa chama a função em vez de atribuir direto. Ao adicionar um novo pedaço de estado usado por mais de um módulo, siga esse padrão.

**Alguns módulos têm import circular com `main.js`**, por exemplo `history.js` importa `renderHome` de `main.js` e `main.js` importa quase tudo de `session.js`/`history.js`/`onboarding.js`. Isso funciona porque essas referências só são usadas dentro de corpo de função, nunca durante a avaliação inicial do módulo. Não referencie um import circular fora de uma função.

**`gerarPrograma(perfil)` é função pura.** Entra o perfil, sai o programa. Não toca em DOM nem em armazenamento. É isso que permite testar as 1.700 combinações de perfil. Se for mexer no gerador, mantenha essa propriedade.

**O catálogo é separado do programa.** `EX` tem nome, tipo e observações. `META` tem padrão de movimento, músculos com peso, equipamento exigido, articulações que carrega, complexidade e marcação de isolamento. O programa só prescreve séries e repetições, referenciando o id do exercício.

**Histórico é indexado por exercício, não por dia.** Por isso a carga da última vez continua aparecendo mesmo quando o programa é refeito.

**Timers usam horário de término, nunca contador.** `restEndsAt = Date.now() + segundos * 1000`. Navegador mobile congela `setInterval` em segundo plano, então contador atrasa. O bipe do fim do descanso é agendado no relógio do AudioContext no momento em que a série é marcada, justamente para tocar na hora certa mesmo com a aba congelada.

**Sessão salva a cada digitação.** Fechou o app, retoma de onde parou.

**Dados têm versão.** `SCHEMA_VERSION` em `js/store.js` e a chave `schemaVersion` no `Store` guardam qual é o formato atual. `migrarDados()` roda no início do `boot()`, antes de qualquer renderização, e aplica em sequência as funções de `MIGRACOES` entre a versão salva e `SCHEMA_VERSION`. Antes de escrever qualquer coisa, ela salva uma cópia bruta na chave `resgate_dados`. Se uma migração lançar erro, nada é sobrescrito: os dados originais continuam intactos nas chaves normais, e a pessoa vê um aviso de que existe uma cópia de segurança. Ao mudar o formato de uma chave do `Store`, adicione uma função nova em `MIGRACOES` no salto de versão correspondente, nunca reescreva os dados direto.

## Depuração

No console do navegador: `MT.session`, `MT.history`, `MT.profile`, `MT.program`, `MT.gerar(MT.profile)`, `MT.volume(MT.program)`, `MT.schemaVersion`, `MT.erros`.

## Testes

```
npm install          # instala o jsdom, só na primeira vez
node tests/run-all.js
```

- `01-sessao.test.js` — treino ativo, edição de exercícios, ordem, troca, treino livre, calendário
- `02-persistencia.test.js` — autosave, retomada, gesto de arrastar para excluir, backup
- `03-onboarding.test.js` — as 8 perguntas, perfil salvo, edição do perfil, dados corporais
- `04-gerador.test.js` — 1.280 combinações de perfil mais 420 com dor e prioridade

O teste do gerador verifica nove propriedades por programa: equipamento disponível, exclusão por articulação com dor, complexidade compatível com iniciante, teto de exercícios pelo tempo, duração estimada, mínimo de exercícios por dia, ausência de repetição no mesmo dia, faixas de série válidas e prescrição completa.

## Não faça

- Não crie backend, login ou banco de dados sem que isso seja pedido explicitamente. O app é offline-first por decisão de projeto.
- Não coloque chave de API no código. O site é estático e público, qualquer chave fica visível.
- Não mude os nomes das chaves do `Store` (`history`, `profile`, `program`, `overrides`, `custom_ex`, `corpo`, `settings`, `active_session`, `favoritos`, `avatar`, `schemaVersion`, `resgate_dados`, `erros_recentes`) sem escrever a migração, senão o usuário perde os dados.
- Toda mudança no formato de uma chave do `Store` precisa de uma função nova em `MIGRACOES` (`js/store.js`) e subir o `SCHEMA_VERSION`. Ver "Dados têm versão" acima.
- Não remova o aviso de que o app não substitui avaliação profissional.

## Roadmap

O planejamento ativo mora fora do repositório, em `ROADMAP.md` na pasta do projeto (fora do controle de versão). A FASE 0 (auditoria, versionamento dos dados, diagnóstico de erros, suíte de testes) está concluída. A FASE 1 (dividir o arquivo único em módulos ES) também: o app já roda como `js/main.js` mais os módulos listados em "Arquivos" acima. O item 1.2 da FASE 1 (extrair `css/app.css`) e as fases seguintes continuam nesse documento.
