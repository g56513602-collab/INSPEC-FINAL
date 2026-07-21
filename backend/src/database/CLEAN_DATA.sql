-- 🧹 SCRIPT SQL PARA LIMPEZA DE DADOS SIMULADOS
-- INSPEC360 v2.2 - Junho 2026
-- 
-- Este script remove todos os dados simulados do banco PostgreSQL
-- Mantém apenas 3 usuários de teste:
--   - ismar.santos@vale-verde.com (técnico)
--   - jonson.santos@vale-verde.com (supervisor)
--   - gustavo.santos@vale-verde.com (administrador)
--
-- ⚠️  AVISO: Esta operação é irreversível! Faça backup antes!
-- ================================================== =

-- 1️⃣ Desabilitar constraints temporariamente
SET session_replication_role = REPLICA;

-- 2️⃣ Limpar dados de inspeções (ordem importa por FK)
DELETE FROM pauses;
DELETE FROM photos;
DELETE FROM anomalies;
DELETE FROM "componentInspections";
DELETE FROM "inspectionRecords";

-- 3️⃣ Limpar dados de ordens de serviço
DELETE FROM "serviceOrders";

-- 4️⃣ Limpar execuções
DELETE FROM executions;

-- 5️⃣ Limpar estruturas
DELETE FROM structures;

-- 6️⃣ Limpar componentes
DELETE FROM "componentRules";

-- 7️⃣ Limpar estado
DELETE FROM state;

-- 8️⃣ Reabilitar constraints
SET session_replication_role = DEFAULT;

-- 9️⃣ Deletar usuários simulados (manter apenas os 3 especificados)
DELETE FROM users 
WHERE email NOT IN (
  'ismar.santos@vale-verde.com',
  'jonson.santos@vale-verde.com',
  'gustavo.santos@vale-verde.com'
);

-- 🔟 Corrigir roles dos usuários mantidos
UPDATE users SET role = 'tecnico' WHERE email = 'ismar.santos@vale-verde.com';
UPDATE users SET role = 'supervisor' WHERE email = 'jonson.santos@vale-verde.com';
UPDATE users SET role = 'admin' WHERE email = 'gustavo.santos@vale-verde.com';

-- ✅ Verificação Final
-- Descomentar abaixo para ver estatísticas:
/*
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'structures', COUNT(*) FROM structures
UNION ALL
SELECT 'componentRules', COUNT(*) FROM "componentRules"
UNION ALL
SELECT 'serviceOrders', COUNT(*) FROM "serviceOrders"
UNION ALL
SELECT 'inspectionRecords', COUNT(*) FROM "inspectionRecords"
UNION ALL
SELECT 'componentInspections', COUNT(*) FROM "componentInspections"
UNION ALL
SELECT 'anomalies', COUNT(*) FROM anomalies
UNION ALL
SELECT 'photos', COUNT(*) FROM photos
UNION ALL
SELECT 'executions', COUNT(*) FROM executions
UNION ALL
SELECT 'pauses', COUNT(*) FROM pauses
UNION ALL
SELECT 'state', COUNT(*) FROM state;

-- Listar usuários mantidos
SELECT id, name, email, role FROM users ORDER BY role;
*/

-- ✅ Pronto! Banco limpo e com apenas 3 usuários de teste
