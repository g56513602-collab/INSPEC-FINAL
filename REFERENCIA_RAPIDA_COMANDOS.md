# ⚡ REFERÊNCIA RÁPIDA - COMANDOS E ENDPOINTS

## 🚀 Sistema INSPEC360 v2.2

---

## 📋 ÍNDICE RÁPIDO

- Variáveis de Ambiente
- Comandos Node.js
- Endpoints da API
- Curl Examples
- Troubleshooting

---

## 🔧 VARIÁVEIS DE AMBIENTE

### Windows (PowerShell)
```powershell
# Definir
$env:DATABASE_URL = "postgresql://user:pass@host:5432/inspec360"
$env:PORT = "3001"
$env:CORS_ORIGIN = "http://localhost:3000"

# Verificar
echo $env:DATABASE_URL
```

### Windows (CMD)
```cmd
set DATABASE_URL=postgresql://user:pass@host:5432/inspec360
set PORT=3001
set CORS_ORIGIN=http://localhost:3000

echo %DATABASE_URL%
```

### Linux/Mac
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/inspec360"
export PORT="3001"
export CORS_ORIGIN="http://localhost:3000"

echo $DATABASE_URL
```

### Arquivo .env (Recomendado)
```bash
# backend/.env
DATABASE_URL=postgresql://user:pass@host:5432/inspec360
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

---

## 🎮 COMANDOS NODE.JS

### Inicialização
```bash
# Entrar na pasta backend
cd backend

# Instalar dependências
npm install

# Instalar dependência específica
npm install express

# Atualizar dependências
npm update
```

### Desenvolvimento
```bash
# Iniciar servidor
npm run dev

# Inicializar banco de dados
npm run init-db

# Executar diagnóstico
npm run diagnose

# Parar servidor
Ctrl+C
```

### Produção
```bash
# Iniciar servidor (produção)
npm start

# Usar porta diferente
PORT=3002 npm start

# Debug mode
DEBUG=* npm run dev
```

### Banco de Dados
```bash
# Recriar esquema
npm run init-db

# Fazer backup (PostgreSQL)
pg_dump -U postgres inspec360 > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres inspec360 < backup_20260601.sql
```

---

## 🔌 ENDPOINTS PRINCIPAIS

### Health & Diagnostics
```
GET  /api/health                    → Health check
GET  /api/diagnostics/stats         → Estatísticas
GET  /api/diagnostics/connection    → Teste de conexão
```

### Usuários
```
GET    /api/users                   → Listar todos
GET    /api/users/:id               → Obter um
POST   /api/users                   → Criar novo
PUT    /api/users/:id               → Atualizar
DELETE /api/users/:id               → Deletar
POST   /api/users/login             → Autenticação
```

### Estruturas
```
GET    /api/structures              → Listar todas
GET    /api/structures/:id          → Obter uma
POST   /api/structures              → Criar nova
PUT    /api/structures/:id          → Atualizar
```

### Componentes
```
GET    /api/components              → Listar todos
GET    /api/components/:id          → Obter um
POST   /api/components              → Criar novo
```

### Ordens de Serviço
```
GET    /api/service-orders          → Listar todas
GET    /api/service-orders/:id      → Obter uma
POST   /api/service-orders          → Criar nova
PUT    /api/service-orders/:id      → Atualizar
```

### Inspeções
```
GET    /api/inspections             → Listar todas
GET    /api/inspections/:id         → Obter uma
POST   /api/inspections             → Criar nova
PUT    /api/inspections/:id         → Atualizar

# Sub-endpoints
POST   /api/inspections/:id/components   → Adicionar componente
POST   /api/inspections/:id/anomalies    → Adicionar anomalia
POST   /api/inspections/:id/photos       → Adicionar foto
POST   /api/inspections/:id/pause        → Pausar inspeção
PUT    /api/inspections/pause/:pauseId/resume → Retomar
```

### Fotos
```
POST   /api/photos/upload           → Fazer upload
GET    /api/photos/:inspectionId    → Listar fotos de inspeção
```

### Execuções
```
GET    /api/executions              → Listar todas
GET    /api/executions/:id          → Obter uma
POST   /api/executions              → Criar nova
PUT    /api/executions/:id          → Atualizar
```

### Estado
```
GET    /api/state                   → Obter estado
POST   /api/state                   → Salvar estado
GET    /api/state/export            → Exportar estado
```

---

## 🧪 CURL EXAMPLES

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Listar Usuários
```bash
curl http://localhost:3001/api/users
```

### Criar Usuário
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "role": "tecnico"
  }'
```

### Buscar Usuário por ID
```bash
curl http://localhost:3001/api/users/abc123
```

### Atualizar Usuário
```bash
curl -X PUT http://localhost:3001/api/users/abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Atualizado"
  }'
```

### Deletar Usuário
```bash
curl -X DELETE http://localhost:3001/api/users/abc123
```

### Login
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### Criar Estrutura
```bash
curl -X POST http://localhost:3001/api/structures \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Estrutura A",
    "type": "Suspensão",
    "coordX": -23.5505,
    "coordY": -46.6333,
    "progressiva": 100.5,
    "lt": "LT-001",
    "voltage": "138",
    "createdBy": "user-id"
  }'
```

### Upload de Foto
```bash
curl -X POST http://localhost:3001/api/photos/upload \
  -F "file=@/path/to/photo.jpg" \
  -F "inspectionId=inspection-id" \
  -F "componentId=component-id" \
  -F "latitude=-23.5505" \
  -F "longitude=-46.6333"
```

### Diagnostics Stats
```bash
curl http://localhost:3001/api/diagnostics/stats
```

### Test de Conexão
```bash
curl http://localhost:3001/api/diagnostics/connection
```

---

## 🔍 POSTGRESQL COMMANDS

### Conectar ao Banco
```bash
psql postgresql://user:pass@host:5432/inspec360

# Ou se local
psql -U postgres -d inspec360
```

### Listar Tabelas
```sql
\dt
-- ou
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Ver Estrutura de Tabela
```sql
\d users
-- ou
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users';
```

### Listar Dados
```sql
SELECT * FROM users;
SELECT * FROM structures;
SELECT * FROM inspectionRecords;
```

### Contar Registros
```sql
SELECT count(*) FROM users;
SELECT count(*) FROM structures;
```

### Foreign Keys
```sql
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';
```

### Constraints
```sql
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK');
```

### Deletar Dados
```sql
DELETE FROM users WHERE id = 'abc123';
DELETE FROM structures WHERE name = 'Test';
```

### Backup
```bash
pg_dump -U user -h host inspec360 > backup.sql
```

### Restore
```bash
psql -U user -h host inspec360 < backup.sql
```

---

## 🚨 TROUBLESHOOTING RÁPIDO

### Problema: DATABASE_URL não definida
```bash
# Verificar se está definida
echo $DATABASE_URL              # Linux/Mac
echo %DATABASE_URL%             # Windows

# Se não estiver, definir
export DATABASE_URL="..."       # Linux/Mac
set DATABASE_URL=...            # Windows
$env:DATABASE_URL = "..."       # PowerShell
```

### Problema: Porta 3001 em uso
```bash
# Linux/Mac - Ver qual processo
lsof -i :3001

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3002 npm run dev
```

### Problema: PostgreSQL não responde
```bash
# Testar conexão
psql postgresql://user:pass@host:5432/inspec360

# Se falhar, verificar:
# 1. PostgreSQL está rodando?
# 2. Credenciais estão corretas?
# 3. Host e porta estão corretos?
# 4. Firewall está bloqueando?
```

### Problema: npm install falha
```bash
# Limpar cache
npm cache clean --force

# Remover node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

### Problema: Módulo não encontrado
```bash
# Instalar módulo específico
npm install express

# Verificar package.json
cat package.json

# Reinstalar tudo
npm install
```

### Problema: Banco não inicializa
```bash
# Executar diagnóstico
npm run diagnose

# Ver logs
npm run dev

# Se erro SQL, verificar:
# 1. DATABASE_URL está correta?
# 2. PostgreSQL está rodando?
# 3. Banco existe?
```

---

## 📊 TABELAS DO BANCO

```
users                   - Usuários do sistema
structures             - Estruturas a inspecionar
componentRules         - Componentes padronizados
serviceOrders          - Ordens de serviço
inspectionRecords      - Registros de inspeção
componentInspections   - Componentes inspecionados
anomalies              - Anomalias encontradas
photos                 - Fotos carregadas
executions             - Execuções de trabalho
pauses                 - Pausas de inspeção
state                  - Estado da aplicação
```

---

## 🔐 AUTENTICAÇÃO

### Login
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "senha"}'
```

### Token (futuro - JWT)
```bash
# Após implementação JWT
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/users
```

---

## 📝 FORMATO JSON COMUM

### Usuário
```json
{
  "id": "uuid",
  "name": "Nome",
  "email": "email@example.com",
  "password": "hash",
  "role": "tecnico|supervisor|admin",
  "createdAt": "2026-06-01T10:00:00Z"
}
```

### Estrutura
```json
{
  "id": "uuid",
  "name": "Estrutura A",
  "type": "Suspensão",
  "coordX": -23.5505,
  "coordY": -46.6333,
  "progressiva": 100.5,
  "lt": "LT-001",
  "voltage": "138",
  "createdBy": "user-id",
  "createdAt": "2026-06-01T10:00:00Z"
}
```

### Inspeção
```json
{
  "id": "uuid",
  "serviceOrderId": "order-id",
  "structureId": "structure-id",
  "technicianId": "user-id",
  "status": "em_progresso|finalizada",
  "startDate": "2026-06-01T10:00:00Z",
  "endDate": "2026-06-01T11:00:00Z"
}
```

---

## 🎯 ATALHOS ÚTEIS

```bash
# Iniciar backend (completo)
cd backend && npm install && npm run init-db && npm run dev

# Testar após iniciar
curl http://localhost:3001/api/health && npm run diagnose

# Resetar tudo
npm run init-db && npm run dev

# Ver logs
npm run dev 2>&1 | tee server.log
```

---

## 📞 DOCUMENTOS ASSOCIADOS

| Tarefa | Documento |
|--------|-----------|
| Setup completo | SETUP_E_INICIALIZACAO.md |
| Validação | CHECKLIST_VALIDACAO_POS_IMPLEMENTACAO.md |
| Problemas | DIAGNOSTICO_BANCO_DADOS.md |
| Roadmap | ROADMAP_PROXIMOS_PASSOS.md |

---

*Referência Rápida - Versão 2.2.0*
*Última atualização: Junho 2026*
*Status: ✅ Operacional*

---

**💡 Dica**: Salve este arquivo como favorito para rápido acesso!
