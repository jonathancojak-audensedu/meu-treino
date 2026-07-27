# Auditoria de estado (item 0.1 do ROADMAP)

Data: 2026-07-27. Baseado na leitura completa de `app.js` (3.164 linhas), `index.html` (597 linhas) e `sw.js`, e na execução real da suíte de testes. Nada aqui foi presumido, cada afirmação foi conferida por leitura de código, grep ou execução.

## 1. Resultado real dos testes

```
node tests/run-all.js
```

13 arquivos, todos passando: `01-sessao`, `02-persistencia`, `03-onboarding`, `04-gerador`, `05-editar-programa`, `06-progressao-carga`, `07-evolucao`, `08-feedback`, `09-saude`, `10-editar-data`, `11-cardio`, `12-timer-descanso`, `13-catalogo`. Zero FALHA.

O gerador (`04-gerador.test.js`) cobre 1.700 combinações de perfil, verificando nove propriedades por programa. Calendário tem cobertura dentro de `01-sessao.test.js`, não em arquivo próprio.

## 2. Regras do CLAUDE.md, conferidas uma a uma

| Regra | Status | Evidência |
|---|---|---|
| VERSION do sw.js sobe a cada mudança de index.html/app.js | seguida | histórico de commits recentes, `sw.js` em v16 |
| Testes rodados antes de commit | seguida nesta sessão | ver seção 1 |
| IndexedDB como armazenamento principal, localStorage só de rede de segurança | implementada | `Store.get/set/del` em `app.js:254-299`, tenta IndexedDB primeiro, cai para `localStorage` só no catch |
| Texto de interface em português correto | implementada | conferido por amostragem no HTML gerado |
| Sem travessão em texto de interface | implementada | nenhuma ocorrência de "—" encontrada em strings visíveis |
| Caminhos relativos | implementada | `sw.js` e `manifest.webmanifest` referenciados com `./` |
| Sem dependência externa nem framework | implementada | `app.js` e `index.html` não importam nada; `jsdom` só existe em `devDependencies` para teste, não é servido ao usuário |
| Gerador é função pura | implementada | `gerarPrograma` (app.js:2579) não toca em `$`, `document` nem `Store` |
| Histórico indexado por exercício | implementada | `lastPerformance`, `bestEver`, `exerciciosComHistorico` percorrem `history` por `exId`, não por dia |
| Timer por horário de término | implementada | `session.rest.endsAt = Date.now() + segundos*1000` (app.js:985), bipe agendado no relógio do `AudioContext` (`scheduleBeep`) |
| Sessão salva a cada digitação | implementada | `onInput` chama `saveSession()` (app.js:1130) |
| Chaves do Store não podem mudar de nome sem migração | **desatualizada** | a lista de chaves protegidas no CLAUDE.md (`history, profile, program, overrides, custom_ex, corpo, settings, active_session`) não inclui `favoritos`, que já existe em produção desde o item 11 do roadmap anterior (`Store.get('favoritos')`, `app.js:2127`) |

## 3. Itens do ROADMAP v4 já pedidos para verificar ou que podem já existir parcialmente

- **2.3 Propagar valores para as séries seguintes**: **ausente**. O que existe é só a lógica antiga que o próprio item pede para remover: em `toggleSet` (app.js:1172-1177), marcar uma série concluída copia peso e reps da série anterior, sem marca de `auto:true`, sem distinguir sugestão de valor editado manualmente. Precisa ser substituída, não coexistir com a nova lógica.
- **2.2 Editar horário de início e fim**: **parcial**. Só existe a edição de data e horário de um treino já registrado no histórico (`editarDataTreino`, app.js:1593). Não existe editar o início durante a sessão ativa (tocar no cronômetro não faz nada, `#sess-timer` não tem handler de clique) nem ajuste na tela de resumo antes de confirmar.
- **2.1 Botão de iniciar fixo na base**: **ausente**. `.startbar` (index.html:151) é `display:flex` normal, sem `position:fixed`, sem `env(safe-area-inset-bottom)`, sem contagem de exercícios/duração na barra.
- **5.2 Acessibilidade**: **parcial**. Vários alvos de toque já em 44px (`.checkbtn`, `.restbtn`, `.onb-back`) e `aria-label` presente na maioria dos botões de ícone (calendário, fechar folha, setas do calendário, favoritar). Não há auditoria formal de contraste nem verificação de navegação por teclado nas folhas.
- Todos os demais itens das Fases 1 a 5 (módulos ES, extrair CSS, foto de perfil, compartilhar resumo, lembrete de backup, tela sobre, revisão do gerador com o catálogo ampliado, desempenho): **ausentes**, sem nenhum vestígio de implementação parcial no código.

## 4. Código morto

Varredura: todas as 125 funções `function nome(...)` de nível superior aparecem pelo menos duas vezes no arquivo (a definição mais pelo menos um uso). Nenhuma função órfã encontrada.

Todas as 179 classes CSS declaradas no `<style>` de `index.html` aparecem também fora do bloco de estilo (no HTML estático ou em alguma string gerada por `app.js`). Nenhuma classe órfã encontrada.

Ressalva sobre o método: é uma varredura textual (regex de nome), não semântica. Não pega função referenciada só dentro de um `if` que nunca é alcançado, nem uso indireto por concatenação de string fora do padrão comum do arquivo. Dado que o arquivo é pequeno o bastante para leitura integral (o que foi feito), a confiança no resultado é alta, mas não é uma prova formal.

## 5. Duplicação de comportamento

Não encontrei dois caminhos de código fazendo a mesma coisa hoje. O único risco concreto é o apontado na seção 3: se o item 2.3 for implementado sem remover a cópia de carga em `toggleSet`, as duas lógicas vão competir pela mesma série.

## 6. Números conferidos (não presumidos)

- `app.js`: 155.851 bytes, 3.164 linhas, 125 funções de nível superior
- `index.html`: 41.682 bytes, 597 linhas, todo o CSS embutido em 179 classes
- `sw.js`: 2.004 bytes, VERSION em v16 no momento desta auditoria
- Catálogo: 156 exercícios (133 diretos em `EX` + 23 vindos de `EX_EXTRA`), 156 entradas em `META`, sem lacuna em nenhuma direção (checado também por `tests/13-catalogo.test.js`)
- 13 arquivos de teste, suíte inteira passando no momento desta auditoria

Os números batem com o que o roadmap descreve na seção "Leitura do estado atual" (arquivo único grande, catálogo triplicado, zero dependências).
