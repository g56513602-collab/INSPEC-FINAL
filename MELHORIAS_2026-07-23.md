# INSPEC360 — Melhorias Implementadas (23/07/2026)

Este documento registra as correções e melhorias implementadas nesta sessão, o raciocínio por trás de cada uma, e o que **não** foi feito por exigir um escopo muito maior (com os motivos).

---

## 1. Bugs críticos corrigidos

### 1.1 Tela branca ao abrir ordem concluída
**Arquivo:** `src/app/components/supervisor/CompletedOrdersTab.tsx`

A view de detalhes de uma ordem concluída referenciava a variável `selectedPhotos` em três pontos (contagem, título da seção, `.map()`), mas ela nunca foi declarada em lugar nenhum do componente — nem `useState`, nem `useMemo`, nem prop. Isso gerava um `ReferenceError` incondicional a cada render da tela, exatamente a tela branca reportada. Corrigido derivando `selectedPhotos` a partir do helper `collectOrderPhotos()` que já existia no mesmo arquivo (usado na exportação de PDF).

### 1.2 Sincronização apagando o banco de dados compartilhado
**Arquivos:** `src/hooks/useDataSync.ts`, `backend/src/routes/state.js`

O botão "Sincronizar" (presente tanto no app do técnico quanto no do supervisor) chamava `forceSync()`, que enviava `POST /api/state` com `{ state: null }` como um "ping" — a intenção, segundo o próprio comentário no código, era que o backend ignorasse esse valor. O backend não ignorava: fazia `JSON.stringify(null)` → a string `"null"` → e sobrescrevia a única linha da tabela `state` (`key = 'app_data'`) que guarda **todo** o estado compartilhado da aplicação (usuários, estruturas, ordens, inspeções). Qualquer usuário que apertasse "Sincronizar" — o gesto natural ao reconectar — apagava os dados de todo mundo.

Corrigido em duas camadas (defesa em profundidade):
- Backend agora rejeita com HTTP 400 qualquer `POST /api/state` com `state` nulo/ausente, antes de tocar no banco.
- `forceSync()` agora faz uma sincronização de verdade: `saveStore(getStore())` (envia mudanças locais) seguido de `loadFromBackend()` (busca o estado mais recente confirmado), em vez de enviar `null`.

---

## 2. Mapa: marcador sumindo ao editar estrutura

**Arquivos:** `src/app/data/store.ts` (`applyBackendState`), `backend/src/database/init-postgres.js`, `backend/src/database/queries-postgres.js`

A tabela `structures` no Postgres só guardava `coordX`/`coordY` (UTM) — nunca `lat`/`lng`. O boot do app (`main.tsx`) carrega o estado inicial via `/api/structures` (REST), que devolve exatamente essas colunas, sem `lat`/`lng`. O componente de mapa geralmente se recupera recalculando `lat`/`lng` a partir de `coordX`/`coordY`, mas isso falha sempre que os valores não caem na faixa reconhecida como UTM (dados importados, casos de borda) — nesse cenário `lat`/`lng` ficam `undefined` e o marcador simplesmente não é desenhado.

Corrigido em duas camadas:
- **Backend:** adicionadas colunas `lat`/`lng` à tabela `structures` (migração `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, segura para bancos já existentes), e `createStructure`/`updateStructure` agora persistem esses valores.
- **Frontend:** `applyBackendState()` agora recalcula `lat`/`lng` de todas as estruturas vindas do backend (reaproveitando a função `fillStructureCoordinates`) antes de gravar no `localStorage` — garante que o mapa nunca fique sem coordenadas válidas, independente do que o backend devolveu.

---

## 3. Campo OM (Ordem de Manutenção)

Adicionado como campo obrigatório na criação de ordens de serviço (`src/app/data/types.ts` → `ServiceOrder.om`), e propagado por:
- Formulário de criação de OS (`SupervisorApp.tsx`)
- Lista e detalhe de ordens, ordens concluídas (`CompletedOrdersTab.tsx`, incluindo PDF)
- Filtros e tabela do relatório (`ReportPanel.tsx`, incluindo PDF)
- Exportação CSV (`DatabasesPanel.tsx`)
- Backend: colunas `om`/`inspectionType` na tabela `serviceOrders` (com migração para bancos existentes)

## 4. Tipos de inspeção MI / PA

Adicionado `ServiceOrder.inspectionType: 'MI' | 'PA'`, selecionado pelo supervisor apenas para ordens do tipo inspeção, propagado pelos mesmos pontos do campo OM acima, além do mapa (breakdown MI/PA no dashboard).

## 5. Captura de GPS automática (sem botão manual)

**Arquivos:** `src/context/OfflineContext.tsx`, `src/hooks/useGeolocation.ts`, `src/components/PhotoManager.tsx`

A localização agora é solicitada e mantida em segundo plano (`watchPosition`) desde a abertura do app, num nível global (`OfflineProvider`, que já envolve toda a aplicação). `useGeolocation()` virou um wrapper fino que lê essa localização global — qualquer componente que já usava o hook (ex.: `CameraWithWatermark.tsx`) passou a se beneficiar automaticamente, sem mudanças. O botão manual "Capturar GPS" foi removido do `PhotoManager`; em seu lugar, um indicador mostra "Obtendo localização em segundo plano..." até a primeira leitura chegar.

## 6. Câmera nativa

**Arquivo:** `src/components/CameraWithWatermark.tsx`

O modo "Usar Câmera" usava `getUserMedia` para desenhar um preview de vídeo customizado dentro da página — o que **não** dá acesso a zoom, flash ou controle manual de foco (são recursos do app de câmera nativo do aparelho, não da API de vídeo web). Trocado por `<input type="file" accept="image/*" capture="environment">`, que entrega a captura ao aplicativo de câmera nativo do sistema operacional (com todos os seus controles de zoom/flash/autofoco/alta resolução) e devolve o arquivo capturado para o mesmo pipeline de marca d'água + legenda + preview que já existia.

## 7. Status dinâmico do mapa

**Arquivo novo:** `src/app/data/structureStatus.ts`

Criada `computeStructureStatus(structure, orders)`, que deriva o status de cada estrutura a partir das ordens de serviço associadas (em vez de um campo estático gravado na estrutura): Pendente (cinza) → Atribuída (azul) → Em Andamento (amarelo) → Concluída (verde) → Anomalia (vermelho) → Atrasada (vermelho escuro), com reversão automática para Pendente após 60 dias sem inspeção concluída. Usada no mapa, no popover de estrutura selecionada, na aba de estruturas e no breakdown de status do dashboard — um único cálculo, consistente em todos os lugares.

## 8. Exportação CSV

**Arquivo:** `src/app/components/superadm/DatabasesPanel.tsx`

Botão "Baixar CSV de Inspeções" no painel de bancos de dados do super admin, gerado no navegador a partir dos dados já carregados na tela (estrutura, OS, OM, tipo de inspeção, inspetor, supervisor, data, hora, status, coordenadas GPS, observações, status de sincronização). Optou-se por gerar no cliente em vez de um endpoint de backend porque este painel já mantém os dados corretos, com fallback automático para armazenamento local quando o backend está indisponível — replicar essa lógica num endpoint separado duplicaria a fonte de verdade.

## 9. Dashboard

**Arquivo:** `SupervisorApp.tsx`

Adicionado filtro por período (data inicial/final), indicador de status de sincronização (online/offline + registros pendentes, usando o `OfflineContext` já existente), breakdown MI/PA e duração média de inspeção (dias entre criação e conclusão).

---

## 10. O que NÃO foi feito nesta sessão (e por quê)

O pedido original cobria um escopo equivalente a uma reescrita completa (auditoria total, motor de sincronização offline robusto, reorganização de toda a arquitetura de backend, redesenho completo de dashboard/relatórios, documentação técnica completa, manual do usuário completo, e validação de QA de cada tela). Isso é trabalho de várias semanas para uma equipe real, não algo que se faz com segurança numa única sessão sem quebrar o que já funciona. Ficaram de fora deliberadamente:

- **Reorganização da arquitetura de backend** (controllers/services/repositories/validators): é uma refatoração ampla que toca todas as rotas; fazer isso sem conseguir rodar a aplicação para testar (este ambiente não tem Node.js/npm instalado) é arriscado demais para um sistema em produção.
- **Motor de sincronização offline mais profundo** (fila IndexedDB, resolução de conflitos, retry automático): os dois bugs mais graves de sincronização/perda de dados já foram corrigidos; uma reescrita completa do motor de sync é um projeto à parte.
- **Redesenho completo de Dashboard/Relatórios**: foram adicionadas melhorias reais e concretas (filtros por OM/tipo/data, indicadores de sincronização e duração média), mas não um redesenho visual completo.
- **Manual do usuário completo e QA exaustivo de cada tela**: não há como testar a aplicação de fato neste ambiente (sem Node.js/npm/build instalado) — qualquer validação além de revisão manual de código seria apenas simulada.

**Recomendação:** tratar os itens acima como próximos passos, cada um como sua própria tarefa com testes reais rodando a aplicação — idealmente em um ambiente com Node.js disponível para `npm install && npm run build` antes de qualquer deploy.
