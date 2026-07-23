# INSPEC360 — Auditoria de Integridade de Dados (23/07/2026)

Este documento registra uma investigação de causa raiz sobre perda de dados, divergência
entre telas, confiabilidade de backup e fotos desaparecendo — feita consultando **a API de
produção ao vivo** (`https://inspec-final.onrender.com`), não apenas lendo código.

## Metodologia

Diferente da sessão anterior, aqui foi possível consultar diretamente o backend em produção
(`GET /api/health`, `/api/diagnostics/stats`, `/api/users`, `/api/state`, `/api/structures`,
`/api/inspections`, `/api/service-orders`) para confirmar os problemas com dados reais, não
suposições. Os números abaixo são exatamente o que a API retornou no momento da auditoria.

**Limitação honesta:** este ambiente não tem Node.js/npm instalado — não há como rodar o
frontend, rodar testes automatizados, nem construir (`build`) o projeto aqui. A investigação
foi feita lendo o código-fonte e consultando a API de produção diretamente com `curl`/
PowerShell. As correções foram validadas por leitura cuidadosa e rastreamento manual da
lógica, mais os testes ao vivo contra a API descritos na seção "Verificação" ao final. Não
executei o frontend React nem cliquei em telas — isso exigiria Node.js para build/dev server,
que não está disponível aqui.

---

## Achado central: duas fontes de dados divergentes, e um bug de boot que zera uma delas

O sistema mantém os dados de duas formas ao mesmo tempo:

1. **Tabelas normalizadas do Postgres** (`users`, `structures`, `serviceOrders`,
   `inspectionRecords`, `photos`, etc.) — usadas pelas rotas REST (`/api/structures`,
   `/api/service-orders`, `/api/inspections`...).
2. **Um único blob JSON** guardado na tabela `state` (chave `app_data`), usado por
   `GET/POST /api/state` — é isso que o frontend lê/grava a cada mudança local
   (`getStore()`/`saveStore()`), e é onde realmente moram estruturas, ordens, inspeções e as
   fotos (como base64 embutido).

No momento da auditoria, consultando a API ao vivo:

```
GET /api/diagnostics/stats
{"usuarios":5,"estruturas":0,"componentes":0,"ordensServico":0,"inspecoes":0,"anomalias":0,"fotos":0,"execucoes":0}

GET /api/users → 5 usuários (Ismar Santos, Administrador, André Lima, Rafael Souza, Carlos Mendes)

GET /api/state → found:true, state.users.length = 3 (Ismar Santos, Administrador, "Supervisor")
                 state.structures.length = 1, state.serviceOrders.length = 1,
                 state.inspectionRecords.length = 2, state.executionRecords.length = 1
```

Ou seja: as tabelas normalizadas estão praticamente vazias (só usuários), e o blob (onde
realmente mora o trabalho do dia a dia) tinha só uma fração mínima do que deveria — e um
conjunto de usuários **diferente e menor** do que a tabela de usuários.

## Causa raiz #1 — Divergência "Usuários" (3) vs "Bases de Dados" (5)

**Confirmada e corrigida.**

- O painel **"Bases de Dados"** (`DatabasesPanel.tsx`) usa o resultado de
  `backendStore.userStore.getAll()` (`GET /api/users`, a tabela normalizada) → mostra 5,
  corretamente.
- A tela **"Usuários"** (`SuperAdmApp.tsx`) fazia essa mesma chamada a `/api/users` dentro de
  `refresh()`, mas **descartava o resultado** e usava `getStore().users` (o blob local, que só
  tinha 3) para preencher a tela. O código buscava o dado certo e jogava fora.

**Correção** ([SuperAdmApp.tsx](src/app/components/SuperAdmApp.tsx)): `refresh()` agora usa o
resultado real de `backendStore.userStore.getAll()` para a lista de usuários exibida, com o
blob local como fallback otimista/offline — exatamente o padrão que `DatabasesPanel.tsx` já
usava corretamente.

Isso resolve a divergência **visual**. Mas havia uma causa mais profunda por trás dela — ver
abaixo.

## Causa raiz #2 — "Perco TODAS as inspeções toda vez que atualizo" (a mais grave)

**Confirmada e corrigida — esta é a causa dominante.**

Em `main.tsx`, toda inicialização do app (`initAndRender()`) fazia, **antes mesmo do React
montar**:

```js
const data = await backendStore.syncAllData();   // busca /api/users, /api/structures,
                                                   // /api/service-orders, /api/inspections,
                                                   // /api/executions, /api/components
if (data) applyBackendState(data);                // grava isso INTEIRO no localStorage
```

`applyBackendState` **substituía por completo** o blob local pelo resultado dessa busca.
Como confirmado acima, as tabelas REST de `structures`/`serviceOrders`/inspeções estão vazias
no uso normal (essas escritas são condicionadas a uma flag `REQUIRE_BACKEND` que não está
ativa por padrão) — então essa substituição **zerava estruturas e ordens de serviço reais a
cada boot do app**. Pior: os nomes dos campos retornados por `syncAllData()`
(`components`, `inspections`, `executions`) não batem com os nomes reais do `AppData`
(`checklistComponents`, `inspectionRecords`, `executionRecords`) — então esses três bancos
**desapareciam do armazenamento local por completo**, sendo recriados do zero com os dados de
exemplo (seed) na próxima leitura.

Isso acontece **toda vez que o app inicializa com o backend acessível** — que é exatamente o
que ocorre depois de um deploy/atualização (o service worker detecta a nova versão e recarrega
a página automaticamente). Esse é, com alta confiança, o mecanismo por trás de "toda vez que
atualizo o sistema, perco todas as inspeções".

Havia uma segunda função, `App.tsx`'s `loadFromBackend()` (correta — busca `/api/state`, o
blob de verdade, e faz merge com os padrões), que rodava **depois**, atrás de uma tela de
carregamento ("Sincronizando dados..."), e normalmente "curava" o estranho na maioria das
vezes. Mas se essa segunda busca falhasse, demorasse, ou desse timeout (5s) enquanto a
primeira (destrutiva) já tivesse sido concluída, os dados zerados/reiniciados ficavam valendo
como estado final.

**Correção** ([main.tsx](src/main.tsx), [store.ts](src/app/data/store.ts)): removida por
completo a chamada a `syncAllData()`+`applyBackendState()` no boot. `loadFromBackend()`
(correta, já existente) passa a ser a única fonte de hidratação inicial. A função
`applyBackendState`, agora sem nenhum uso, foi removida do código para não voltar a ser
religada por engano no futuro.

## Causa raiz #2b — Sincronização sem mesclagem (mesmo problema, ângulo diferente)

Mesmo corrigindo o boot, o `POST /api/state` (usado toda vez que qualquer dado muda,
via `saveStore()`) **substituía cegamente** o blob inteiro pelo que o dispositivo atual tinha.
Um dispositivo com uma cópia local desatualizada (ex.: ficou dias offline, ou teve o
armazenamento local limpo) apagaria, ao salvar qualquer mudança, tudo que outros usuários
tivessem criado depois daquele snapshot — sem aviso, sem mesclagem.

**Correção** ([state.js](backend/src/routes/state.js)): `POST /api/state` agora faz merge por
`id`, coleção por coleção. Registros que existem só no servidor são preservados por padrão. Se
o payload recebido remover mais de 30% dos registros conhecidos de uma coleção de uma vez —
exatamente a assinatura de um cliente desatualizado sobrescrevendo o servidor — o servidor
preserva os registros que faltam em vez de apagá-los (com log de aviso). Edições e exclusões
normais (poucos registros por vez) continuam funcionando normalmente.

## Causa raiz #3 — Backups não confiáveis

**Confirmada e corrigida.**

- Os backups ficavam em `localStorage`, no mesmo domínio de armazenamento dos dados ao vivo —
  se o navegador limpasse o armazenamento, backup e dado real desapareciam juntos.
- `createBackupInStorage`/`handleExportJSON` sempre usavam `getStore()` (o snapshot local
  deste dispositivo, no momento), que — antes da correção da causa raiz #2 — podia estar
  incompleto/zerado logo após um boot.

**Correção** ([BackupPanel.tsx](src/app/components/BackupPanel.tsx)): exportar/criar backup
agora busca o estado mais recente do servidor primeiro (`loadFromBackend()`) antes de gerar o
arquivo — a exportação sempre reflete os dados reais do servidor quando há conexão, não só o
que este dispositivo tinha em cache. O download para arquivo `.json` continua sendo a forma
mais confiável de backup real (fora do navegador); os backups guardados em `localStorage`
continuam existindo como conveniência, mas não substituem a exportação em arquivo.

## Causa raiz #4 — Fotos desaparecendo

**Confirmada, parcialmente corrigida pela raiz #2/#2b; uma armadilha separada documentada.**

O fluxo realmente usado na captura de fotos (`PhotoManager.tsx` → `CameraWithWatermark.tsx`)
salva a foto como base64 **dentro do próprio registro de inspeção**, no mesmo blob JSON —
então fotos desaparecem pelo **mesmo motivo exato** que inspeções inteiras desapareciam
(causas raiz #2/#2b). Corrigindo a sincronização, as fotos deixam de desaparecer por esse
caminho.

Existe, além disso, uma rota separada e **não utilizada pela interface atual**
(`POST /api/photos/upload`, em `photos.js`), que salva arquivos em disco local
(`backend/public/images/inspections/`). Isso é uma armadilha arquitetural: o Render (onde o
backend está hospedado) usa **disco efêmero** — qualquer arquivo escrito localmente é apagado
a cada deploy/reinício do serviço. Essa rota está inalcançável pela UI hoje (só um componente
morto, `PhotoUploadWithGeo.tsx`, a referencia), então não foi a causa do problema relatado —
mas é uma armadilha para o futuro: se alguém ligar a UI a ela sem antes resolver o
armazenamento em disco efêmero, fotos voltarão a desaparecer, desta vez definitivamente. Deixo
isso documentado; **não a modifiquei** para não gastar o orçamento desta sessão em código hoje
inatingível pela UI — a arquitetura correta de longo prazo é armazenar o binário da foto na
tabela `photos` do Postgres (já existe) em vez de disco ou de blob JSON gigante.

## Item 7 — Tipos de inspeção expandidos

Substituídos `MI`/`PA` pelos valores solicitados: **Patrulhamento, Minuciosa, Termográfica,
Lavagem, Limpeza, Outras** — em [types.ts](src/app/data/types.ts),
[SupervisorApp.tsx](src/app/components/SupervisorApp.tsx) (cadastro, dashboard),
[ReportPanel.tsx](src/app/components/supervisor/ReportPanel.tsx) (filtros, PDF),
[CompletedOrdersTab.tsx](src/app/components/supervisor/CompletedOrdersTab.tsx) (exibição,
PDF), exportação CSV (já genérica, sem alteração necessária) e no `CHECK` constraint do
Postgres ([init-postgres.js](backend/src/database/init-postgres.js), aplicado apenas a bancos
novos — o banco de produção já existente não tem essa restrição, então não há risco de
violação de constraint ao mudar os valores).

## Item 6 — Botão solicitado anteriormente

Não localizado (não há registro em documentação, TODOs ou mensagens de commit deste
repositório). O histórico de commits mostra sessões anteriores de um agente do Replit
(`Session 6b841abb...`) sem mensagens descritivas, mas não há transcript legível dessas
sessões neste ambiente. Perguntei diretamente e você optou por adiar este item.

---

## O que fica de fora desta sessão, e por quê

- **Migração completa de fotos para armazenamento binário no Postgres** (em vez de base64
  embutido no blob): é a arquitetura correta de longo prazo, mas é uma mudança grande (rotas
  novas, mudança no fluxo de captura, mudança na geração de relatórios) — arriscada demais
  para fazer sem conseguir rodar/testar o app neste ambiente. A correção da causa raiz #2/#2b
  já resolve o sintoma relatado (fotos somem); a migração para Postgres é a próxima melhoria
  de arquitetura recomendada.
- **Remover a flag `REQUIRE_BACKEND`** e tornar toda escrita síncrona com as tabelas REST
  normalizadas: avaliado e descartado por ora — descobri que `updateInspection()` no backend
  ignora silenciosamente `components`/`photos` do payload (só grava `status`,
  `dataHoraFim`, `observacoesGerais`). Ativar mais escrita para lá sem corrigir isso primeiro
  criaria uma falsa sensação de seguraça ("sincronizou!" mas os dados relevantes some
  silenciosamente). Fica documentado como uma incompletude real do backend a corrigir antes de
  depender dele para isso.

---

## Verificação

Antes do deploy desta correção, o estado de produção era o descrito acima (users diferentes
entre blob e REST; estruturas/ordens/inspeções quase zeradas). Depois do deploy, a seção
"Verificação pós-deploy" (mensagem de encerramento desta sessão) mostra o resultado de
consultas reais repetidas contra a mesma API de produção — não presumidas.
