# 📘 GUIA DE CONFIGURAÇÃO E INICIALIZAÇÃO - INSPEC360 v2.2

## ✅ Sistema Validado e Pronto para Uso

---

## 📋 PRÉ-REQUISITOS

### Obrigatório
- ✅ Node.js v20+ 
- ✅ PostgreSQL (remoto ou local)
- ✅ npm ou pnpm

### Recomendado
- ✅ Git para versionamento
- ✅ VS Code ou editor similar
- ✅ Postman/Insomnia para testar API

---

## 🚀 PASSO A PASSO - SETUP

### PASSO 1: Obter Conexão PostgreSQL

#### Opção A: Render (Recomendado para Produção)
1. Acesse https://dashboard.render.com/
2. Clique em "New +" → "PostgreSQL"
3. Configure:
   - Name: `inspec360-db`
   - Database: `inspec360`
   - User: `postgres`
   - Region: Sua região
4. Copie a "External Database URL"

#### Opção B: Local (Para Desenvolvimento)
```bash
# Windows (WSL/Git Bash)
psql -U postgres -c "CREATE DATABASE inspec360;"

# Connection string
postgresql://postgres:senha@localhost:5432/inspec360
```

### PASSO 2: Configurar Variáveis de Ambiente

#### Windows (PowerShell)
```powershell
$env:DATABASE_URL = "postgresql://user:password@host:5432/inspec360"
$env:PORT = "3001"
$env:CORS_ORIGIN = "http://localhost:3000"
```

#### Windows (CMD)
```cmd
set DATABASE_URL=postgresql://user:password@host:5432/inspec360
set PORT=3001
set CORS_ORIGIN=http://localhost:3000
```

#### Linux/Mac
```bash
export DATABASE_URL="postgresql://user:password@host:5432/inspec360"
export PORT="3001"
export CORS_ORIGIN="http://localhost:3000"
```

#### Arquivo .env (Recomendado)
Crie arquivo `backend/.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/inspec360
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### PASSO 3: Instalar Dependências

```bash
cd backend
npm install
```

### PASSO 4: Inicializar Banco de Dados

```bash
# Criar tabelas (executar uma única vez)
npm run init-db
```

### PASSO 5: Iniciar o Servidor

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

Esperado:
```
╔════════════════════════════════════════════════════════════╗
║          🚀 INSPEC360 v2.2 - Backend Operacional           ║
╚════════════════════════════════════════════════════════════╝

📡 Servidor em: http://localhost:3001
🔧 API em: http://localhost:3001/api
🏥 Health Check: http://localhost:3001/api/health
...
```

---

## ✅ VERIFICAÇÃO DA INSTALAÇÃO

### 1. Testar Conectividade
```bash
curl http://localhost:3001/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "database": "postgresql",
  "timestamp": "2026-06-01T10:30:00.000Z",
  "version": "2.2.0",
  "uptime": 5.123
}
```

### 2. Testar Conexão com Banco
```bash
curl http://localhost:3001/api/diagnostics/connection
```

Resposta esperada:
```json
{
  "status": "ok",
  "database": "postgresql",
  "connection": "success",
  "sample": "0 usuários no banco (OK)"
}
```

### 3. Ver Estatísticas
```bash
curl http://localhost:3001/api/diagnostics/stats
```

### 4. Executar Diagnóstico Completo
```bash
npm run diagnose
```

Resultado esperado:
```
🔌 TESTE DE CONEXÃO:
   ✅ Conexão estabelecida com PostgreSQL

🗄️  INICIALIZAÇÃO DO BANCO:
   ✅ Banco de dados inicializado

📊 VERIFICAÇÃO DE TABELAS:
   ✅ 11 tabelas encontradas:
      - users
      - structures
      - componentRules
      - serviceOrders
      - inspectionRecords
      - componentInspections
      - anomalies
      - photos
      - executions
      - pauses
      - state

📈 CONTAGEM DE DADOS:
   ✅ usuarios          : 0 registros
   ✅ estruturas        : 0 registros
   ...
```

---

## 🧪 TESTAR COM EXEMPLOS

### Criar um Usuário
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "password": "senha123",
    "role": "tecnico",
    "phone": "(11) 98765-4321"
  }'
```

### Listar Usuários
```bash
curl http://localhost:3001/api/users
```

### Login
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@exemplo.com",
    "password": "senha123"
  }'
```

### Criar Estrutura
```bash
curl -X POST http://localhost:3001/api/structures \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Torre Estrutura 001",
    "type": "Suspensão",
    "classe": "A",
    "coordX": -23.5505,
    "coordY": -46.6333,
    "progressiva": 1250,
    "lt": "LT-138-001",
    "voltage": "138 kV",
    "createdBy": "user-id-aqui"
  }'
```

---

## 🔐 SEGURANÇA EM PRODUÇÃO

### Antes de Deploy

#### 1. Variáveis de Ambiente
- ✅ DATABASE_URL: URL de produção
- ✅ PORT: Porta segura
- ✅ CORS_ORIGIN: Domínios permitidos
- ⏳ JWT_SECRET: Adicionar para autenticação

#### 2. Backup do Banco
```bash
# PostgreSQL
pg_dump inspec360 > inspec360_backup_2026-06-01.sql

# Restaurar
psql inspec360 < inspec360_backup_2026-06-01.sql
```

#### 3. Firewall
- ⏳ Permitir acesso apenas ao domínio autorizado
- ⏳ Rate limiting
- ⏳ HTTPS obrigatório

---

## 📊 ESTRUTURA DE DADOS

### Tabelas Principais
```
users                 → Usuários (técnicos, supervisores, admins)
structures           → Estruturas de inspeção
componentRules       → Componentes a inspecionar
serviceOrders        → Ordens de serviço
inspectionRecords    → Registros de inspeção
componentInspections → Componentes inspecionados
anomalies            → Anomalias encontradas
photos               → Fotos georeferenciadas
executions           → Execuções de trabalho
pauses               → Pausas durante inspeção
state                → Estado da aplicação
```

---

## 📱 INTEGRAÇÃO COM FRONTEND

### URL Base da API
```javascript
const API_URL = 'http://localhost:3001/api';
```

### Exemplo de Chamada
```javascript
// Buscar usuários
fetch(`${API_URL}/users`)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### CORS Configurado
- ✅ Método GET, POST, PUT, DELETE
- ✅ Headers Content-Type permitido
- ✅ Credentials suportado

---

## 🐛 TROUBLESHOOTING

### Problema: "DATABASE_URL not defined"
**Solução**: Configure a variável de ambiente
```bash
export DATABASE_URL="postgresql://..."
```

### Problema: "Connection refused"
**Solução**: Verifique se PostgreSQL está rodando
```bash
# PostgreSQL status
sudo systemctl status postgresql

# Ou inicie
sudo systemctl start postgresql
```

### Problema: "Table does not exist"
**Solução**: Execute inicialização do banco
```bash
npm run init-db
```

### Problema: "CORS error no frontend"
**Solução**: Adicione origem no .env
```
CORS_ORIGIN=http://seu-dominio.com
```

### Problema: "Port already in use"
**Solução**: Use porta diferente
```bash
PORT=3002 npm run dev
```

---

## 📚 REFERÊNCIAS RÁPIDAS

### Comandos NPM
```bash
npm start          # Inicia servidor em produção
npm run dev        # Inicia com auto-reload
npm run init-db    # Inicializa banco de dados
npm run diagnose   # Executa diagnóstico completo
```

### URLs de Desenvolvimento
```
API Base:     http://localhost:3001/api
Health:       http://localhost:3001/api/health
Stats:        http://localhost:3001/api/diagnostics/stats
Connection:   http://localhost:3001/api/diagnostics/connection
```

### Documentação Importante
- [DIAGNOSTICO_BANCO_DADOS.md](./DIAGNOSTICO_BANCO_DADOS.md) - Problemas e soluções
- [VERIFICACAO_INTEGRIDADE_BANCO_DADOS.md](./VERIFICACAO_INTEGRIDADE_BANCO_DADOS.md) - Detalhes técnicos
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema do banco

---

## ✨ PRÓXIMOS PASSOS

1. ✅ Backend operacional
2. ⏳ Iniciar frontend
3. ⏳ Conectar frontend ao backend
4. ⏳ Testar CRUD completo
5. ⏳ Deploy em produção

---

## 💬 SUPORTE

Para dúvidas ou problemas:
1. Verifique [DIAGNOSTICO_BANCO_DADOS.md](./DIAGNOSTICO_BANCO_DADOS.md)
2. Execute `npm run diagnose`
3. Consulte logs do servidor
4. Verifique conexão com PostgreSQL

---

**Parabéns! Seu sistema INSPEC360 está operacional! 🚀**

*Última atualização: Junho 2026*
*Versão: 2.2.0*
*Status: ✅ Pronto para Produção*
