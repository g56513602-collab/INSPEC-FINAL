# ✅ CHECKLIST PASSO A PASSO - VALIDAÇÃO DO SISTEMA

## 🎯 Objetivo
Verificar que o sistema INSPEC360 v2.2 está 100% operacional com banco de dados real.

---

## 📋 PRÉ-REQUISITOS

- [ ] PostgreSQL instalado (local ou acesso remoto)
- [ ] Node.js v20+ instalado
- [ ] npm ou pnpm disponível
- [ ] Git (opcional)
- [ ] Terminal/PowerShell aberto na pasta `backend`

---

## 🔧 PASSO 1: CONFIGURAÇÃO INICIAL

### 1.1 Obter Connection String PostgreSQL

**Se usar Render (Recomendado):**
- [ ] Acesse https://dashboard.render.com/
- [ ] Crie novo PostgreSQL
- [ ] Copie "External Database URL"
- [ ] Salve em lugar seguro

**Se usar local:**
```bash
# PostgreSQL local
[ ] Connection string: postgresql://postgres:senha@localhost:5432/inspec360
```

### 1.2 Configurar Variável de Ambiente

**Windows (PowerShell):**
```powershell
[ ] $env:DATABASE_URL = "postgresql://user:password@host:5432/inspec360"
```

**Windows (CMD):**
```cmd
[ ] set DATABASE_URL=postgresql://user:password@host:5432/inspec360
```

**Linux/Mac:**
```bash
[ ] export DATABASE_URL="postgresql://user:password@host:5432/inspec360"
```

**Arquivo .env (Recomendado):**
- [ ] Crie arquivo `backend/.env`
- [ ] Adicione: `DATABASE_URL=postgresql://...`
- [ ] Salve arquivo

### 1.3 Verificar Variável

```bash
[ ] echo %DATABASE_URL%              # Windows
[ ] echo $DATABASE_URL                # Linux/Mac
```

**Resultado esperado:** 
- Deve mostrar a URL completa do banco

---

## 📦 PASSO 2: INSTALAR DEPENDÊNCIAS

```bash
[ ] cd backend
[ ] npm install
```

**Resultado esperado:**
- Sem erros
- Pasta `node_modules` criada
- Todos os pacotes instalados

---

## 🗄️ PASSO 3: INICIALIZAR BANCO DE DADOS

```bash
[ ] npm run init-db
```

**Resultado esperado:**
```
🔧 Inicializando banco PostgreSQL...
✅ Banco de dados inicializado com sucesso!
```

**Verificar no banco:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

**Tabelas esperadas:**
- [ ] users
- [ ] structures
- [ ] componentRules
- [ ] serviceOrders
- [ ] inspectionRecords
- [ ] componentInspections
- [ ] anomalies
- [ ] photos
- [ ] executions
- [ ] pauses
- [ ] state

---

## 🚀 PASSO 4: INICIAR SERVIDOR

```bash
[ ] npm run dev
```

**Resultado esperado:**
```
🚀 INSPEC360 v2.2 - Backend Operacional

📡 Servidor em: http://localhost:3001
🔧 API em: http://localhost:3001/api
🏥 Health Check: http://localhost:3001/api/health
```

**Se erro:**
- [ ] Verifique se DATABASE_URL está definida
- [ ] Verifique se PostgreSQL está rodando
- [ ] Verifique se porta 3001 está livre

---

## 🧪 PASSO 5: TESTAR CONECTIVIDADE

### 5.1 Health Check
```bash
[ ] curl http://localhost:3001/api/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "database": "postgresql",
  "timestamp": "2026-06-01T...",
  "version": "2.2.0"
}
```

### 5.2 Teste de Conexão com Banco
```bash
[ ] curl http://localhost:3001/api/diagnostics/connection
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "connection": "success",
  "database": "postgresql"
}
```

### 5.3 Estatísticas do Banco
```bash
[ ] curl http://localhost:3001/api/diagnostics/stats
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "stats": {
    "usuarios": 0,
    "estruturas": 0,
    ...
  },
  "total": 0
}
```

---

## 🔍 PASSO 6: EXECUTAR DIAGNÓSTICO COMPLETO

```bash
[ ] npm run diagnose
```

**Resultado esperado:**
```
✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO!

Banco de dados: OPERACIONAL (PostgreSQL)
Todas as tabelas: CRIADAS
CRUD: FUNCIONANDO
Integridade referencial: ATIVA
Sistema pronto para produção!
```

---

## 🧬 PASSO 7: TESTAR CRUD (Create, Read, Update, Delete)

### 7.1 CREATE - Criar Usuário
```bash
[ ] curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste CRUD",
    "email": "teste@example.com",
    "password": "senha123",
    "role": "tecnico"
  }'
```

**Resultado esperado:**
- Status 201
- Retorna usuário com ID

### 7.2 READ - Listar Usuários
```bash
[ ] curl http://localhost:3001/api/users
```

**Resultado esperado:**
- Array com usuários
- Usuário criado no passo anterior deve aparecer

### 7.3 READ - Buscar por ID
```bash
[ ] curl http://localhost:3001/api/users/{id-do-usuario}
```

**Resultado esperado:**
- Retorna usuário específico com todos dados

### 7.4 UPDATE - Atualizar Usuário
```bash
[ ] curl -X PUT http://localhost:3001/api/users/{id-do-usuario} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste CRUD Atualizado"
  }'
```

**Resultado esperado:**
- Retorna usuário atualizado
- Nome mudou para "Teste CRUD Atualizado"

### 7.5 DELETE - Deletar Usuário
```bash
[ ] curl -X DELETE http://localhost:3001/api/users/{id-do-usuario}
```

**Resultado esperado:**
- Usuário deletado
- Buscar por ID deve retornar 404

---

## 📊 PASSO 8: TESTAR OUTROS ENDPOINTS

### 8.1 Estruturas
```bash
[ ] GET    /api/structures               (deve retornar array)
[ ] POST   /api/structures               (criar nova)
[ ] GET    /api/structures/:id           (buscar por ID)
[ ] PUT    /api/structures/:id           (atualizar)
```

### 8.2 Componentes
```bash
[ ] GET    /api/components               (deve retornar array)
[ ] POST   /api/components               (criar novo)
```

### 8.3 Ordens de Serviço
```bash
[ ] GET    /api/service-orders           (deve retornar array)
[ ] POST   /api/service-orders           (criar nova)
```

### 8.4 Inspeções
```bash
[ ] GET    /api/inspections              (deve retornar array)
[ ] POST   /api/inspections              (criar nova)
```

### 8.5 Execuções
```bash
[ ] GET    /api/executions               (deve retornar array)
[ ] POST   /api/executions               (criar nova)
```

---

## 🔐 PASSO 9: VERIFICAR INTEGRIDADE

### 9.1 Foreign Keys
```sql
[ ] SELECT * FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY';
```

**Resultado esperado:**
- 18+ foreign keys listadas

### 9.2 Constraints
```sql
[ ] SELECT * FROM information_schema.table_constraints 
    WHERE constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK');
```

**Resultado esperado:**
- 35+ constraints listadas

### 9.3 Testar FK Inválida
```sql
[ ] INSERT INTO structures (id, name, type, coordX, coordY, progressiva, 
    lt, voltage, createdBy) 
    VALUES ('test', 'Test', 'Suspensão', 0, 0, 0, 'LT-1', '138', 
    'user-inexistente');
```

**Resultado esperado:**
- Erro: violação de foreign key
- FK está funcionando ✅

---

## 📈 PASSO 10: VERIFICAR LOGS E ERROS

### 10.1 Console do Servidor
- [ ] Verifique se há mensagens de erro
- [ ] Deve conter only mensagens informativas e de sucesso
- [ ] Nenhum erro crítico

### 10.2 Fazer Requisição com Erro Intencional
```bash
[ ] curl http://localhost:3001/api/users/id-inexistente
```

**Resultado esperado:**
- Erro 404 com mensagem clara
- No console: mensagem de erro registrada

---

## 💾 PASSO 11: FAZER BACKUP

```bash
# PostgreSQL
[ ] pg_dump -U postgres inspec360 > inspec360_backup_$(date +%Y%m%d).sql
```

**Verificar:**
- [ ] Arquivo criado
- [ ] Tamanho > 0
- [ ] Salvo em local seguro

---

## 🎯 PASSO 12: VALIDAÇÃO FINAL

### Checklist de Conformidade

**Banco de Dados:**
- [ ] PostgreSQL conectado
- [ ] 11 tabelas criadas
- [ ] Foreign keys ativas
- [ ] Constraints validadas

**Operação:**
- [ ] Health check respondendo
- [ ] CRUD funcionando
- [ ] Diagnósticos disponíveis
- [ ] Error handling ativo

**Dados:**
- [ ] Dados persistidos no banco
- [ ] Relações mantidas
- [ ] Integridade garantida

**Segurança:**
- [ ] Sem SQL injection aparente
- [ ] Error handling seguro
- [ ] Logs não expõem dados sensíveis

**Documentação:**
- [ ] Todos os documentos criados
- [ ] Setup instructions claras
- [ ] Endpoints documentados

---

## 📋 RESULTADO FINAL

### Tudo OK? 🎉

Se todos os checkboxes acima estão marcados:

```
✅ Sistema 100% Operacional
✅ Banco de Dados Real
✅ Integridade Garantida
✅ Pronto para Produção
```

### Se encontrou problemas? 🐛

1. [ ] Verifique DATABASE_URL
2. [ ] Verifique PostgreSQL status
3. [ ] Verifique logs do servidor
4. [ ] Execute `npm run diagnose`
5. [ ] Consulte DIAGNOSTICO_BANCO_DADOS.md

---

## 🚀 PRÓXIMOS PASSOS

- [ ] Inicializar frontend
- [ ] Conectar frontend ao backend
- [ ] Criar usuários iniciais
- [ ] Fazer testes e2e
- [ ] Deploy em produção

---

## 📞 SUPORTE

**Documentação Disponível:**
- SETUP_E_INICIALIZACAO.md - Guia de setup
- DIAGNOSTICO_BANCO_DADOS.md - Problemas comuns
- VERIFICACAO_INTEGRIDADE_BANCO_DADOS.md - Detalhes técnicos

**Comandos Úteis:**
```bash
npm run dev              # Iniciar servidor
npm run diagnose        # Executar diagnóstico
npm run init-db         # Reinicializar banco
```

---

## ✨ Conclusão

Parabéns! Você validou com sucesso o sistema INSPEC360 v2.2!

O sistema está **100% operacional** com:
- ✅ PostgreSQL real
- ✅ Dados persistidos
- ✅ Integridade garantida
- ✅ Funcionalidade comprovada

**Status: 🚀 PRODUÇÃO**

---

*Documento criado em: Junho 2026*
*Versão: 2.2.0*
*Última verificação: ✅ OK*
