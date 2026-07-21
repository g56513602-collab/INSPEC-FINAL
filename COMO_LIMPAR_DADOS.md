# 🧹 LIMPEZA DE DADOS SIMULADOS

## ✅ Como Limpar o Banco de Dados

O sistema INSPEC360 v2.2 agora tem ferramentas para remover todos os dados simulados, mantendo apenas 3 usuários de teste.

---

## 🎯 O que será feito

### ❌ Será DELETADO:
- ❌ Todas as inspeções
- ❌ Todas as ordens de serviço
- ❌ Todas as estruturas
- ❌ Todas as execuções
- ❌ Todos os dados relacionados
- ❌ Todos os usuários simulados

### ✅ Será MANTIDO:
- ✅ Estrutura do banco (tabelas, campos)
- ✅ 3 usuários de teste:
  - `ismar.santos@vale-verde.com` (técnico)
  - `jonson.santos@vale-verde.com` (supervisor)
  - `gustavo.santos@vale-verde.com` (administrador)

---

## 🚀 OPÇÃO 1: Usando o Script Node.js (Recomendado)

### Pré-requisitos:
- Node.js v20+ instalado
- DATABASE_URL configurado

### Executar:

```bash
# Entrar na pasta backend
cd backend

# Executar script de limpeza
npm run clean-data
```

### Resultado esperado:
```
═══════════════════════════════════════════════════════════
🧹 LIMPEZA DE DADOS SIMULADOS - INSPEC360 v2.2
═══════════════════════════════════════════════════════════

🧹 Iniciando limpeza de dados simulados...

✅ Constraints desabilitadas
🗑️  Limpando dados de inspeções...
  ✓ Pauses deletadas
  ✓ Photos deletadas
  ✓ Anomalias deletadas
  ...
👤 USUÁRIOS MANTIDOS:

  👷 Ismar Santos (ismar.santos@vale-verde.com) - tecnico
  👨‍💼 Jonson Santos (jonson.santos@vale-verde.com) - supervisor
  👨‍💼 Gustavo Santos (gustavo.santos@vale-verde.com) - admin

✅ LIMPEZA CONCLUÍDA COM SUCESSO!
```

---

## 🚀 OPÇÃO 2: Usando SQL Direto (Se Node não estiver disponível)

### Pré-requisitos:
- PostgreSQL client (psql) ou DBeaver/pgAdmin
- DATABASE_URL disponível

### Usando psql:

```bash
# Windows
psql -U seu_usuario -d inspec360 -f "backend/src/database/CLEAN_DATA.sql"

# Linux/Mac
psql postgresql://user:pass@host:5432/inspec360 -f backend/src/database/CLEAN_DATA.sql
```

### Usando DBeaver:

1. Abra DBeaver
2. Conecte ao seu banco PostgreSQL
3. Abra arquivo: `backend/src/database/CLEAN_DATA.sql`
4. **Selecione todo o texto** (Ctrl+A)
5. **Execute** (Ctrl+Enter ou F9)

### Usando pgAdmin:

1. Abra pgAdmin (https://seu-pgadmin-url)
2. Navegue até seu banco `inspec360`
3. Vá em **Query Tool**
4. Abra arquivo `CLEAN_DATA.sql`
5. **Execute** (F5 ou ícone de play)

---

## ⚠️ **ANTES DE EXECUTAR - CHECKLIST IMPORTANTE**

- [ ] **FAÇA BACKUP DO BANCO** (muito importante!)
  ```bash
  pg_dump -U postgres inspec360 > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Verifique que DATABASE_URL está correto

- [ ] Confirme que deseja **PERDER TODOS** os dados simulados

- [ ] Tenha acesso de escrita no banco

- [ ] Nenhum outro processo está usando o banco

---

## 📊 VERIFICAÇÃO PÓS-LIMPEZA

Após executar, verifique os resultados:

```sql
-- Ver quantos registros restaram
SELECT 
  'users' as tabela, COUNT(*) as registros FROM users
UNION ALL SELECT 'structures', COUNT(*) FROM structures
UNION ALL SELECT 'inspectionRecords', COUNT(*) FROM "inspectionRecords"
UNION ALL SELECT 'anomalies', COUNT(*) FROM anomalies
UNION ALL SELECT 'photos', COUNT(*) FROM photos;

-- Ver usuários mantidos
SELECT id, name, email, role FROM users ORDER BY role;
```

**Resultado esperado:**
```
 tabela              | registros
---------------------+-----------
 users               |         3
 structures          |         0
 inspectionRecords   |         0
 anomalies           |         0
 photos              |         0
```

---

## 🔄 Se precisar restaurar dados

Se cometeu um erro e precisa restaurar:

```bash
# Restaurar backup
psql -U postgres inspec360 < backup_20260601_120000.sql
```

---

## 📁 Arquivos Fornecidos

- `clean-simulated-data.js` - Script Node.js (automático)
- `CLEAN_DATA.sql` - Script SQL (manual)
- Este documento - Instruções

---

## 🎯 Próximos Passos

Após limpar:

1. ✅ Sistema pronto com dados limpos
2. ✅ 3 usuários de teste disponíveis
3. ✅ Pronto para inserir dados reais
4. ✅ Pode iniciar novo ciclo de testes

---

## 🆘 Troubleshooting

### Erro: "Permission denied"
```
Solução: Usuário PostgreSQL não tem permissão
→ Use superuser: -U postgres
```

### Erro: "Database is in use"
```
Solução: Outro processo está usando o banco
→ Feche outras conexões
→ Reinicie o servidor
```

### Erro: "Cannot execute on live database"
```
Solução: Está apontando para produção
→ Verifique DATABASE_URL
→ Confirme que é desenvolvimento
```

### Quero apenas ALGUNS dados deletados
```
Solução: Edite o arquivo CLEAN_DATA.sql
→ Remova/comente as linhas que não quer deletar
→ Mantenha o DELETE para usuários
```

---

## 📝 Versão

- **Script**: v1.0
- **Data**: Junho 2026
- **INSPEC360**: v2.2.0
- **Status**: ✅ Testado e Pronto

---

## 🤝 Suporte

Se houver problemas:

1. Consulte este documento
2. Verifique os logs do terminal
3. Faça um novo backup e tente novamente
4. Ou restaure do backup anterior

---

**⚡ Banco limpo e pronto para dados reais! 🎉**
