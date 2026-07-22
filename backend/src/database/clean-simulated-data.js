const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const USERS_TO_KEEP = [
  { email: 'ismar.santos@vale-verde.com', name: 'Ismar Santos', role: 'tecnico' },
  { email: 'jonson.santos@vale-verde.com', name: 'Jonson Santos', role: 'supervisor' },
  { email: 'gustavo.santos@vale-verde.com', name: 'Gustavo Santos', role: 'admin' }
];

async function cleanDatabase() {
  const client = await pool.connect();

  try {
    console.log('🧹 Iniciando limpeza de dados simulados...\n');

    // Desabilitar constraints temporariamente
    await client.query('SET session_replication_role = REPLICA;');
    console.log('✅ Constraints desabilitadas');

    // 1. Limpar dados relacionados a inspeções
    console.log('🗑️  Limpando dados de inspeções...');
    
    // Pause history
    await client.query('DELETE FROM "pauseHistory";');
    console.log('  ✓ Histórico de pausas deletado');

    // Photos
    await client.query('DELETE FROM photos;');
    console.log('  ✓ Photos deletadas');

    // Anomalies
    await client.query('DELETE FROM anomalies;');
    console.log('  ✓ Anomalias deletadas');

    // Component Inspections
    await client.query('DELETE FROM "componentInspections";');
    console.log('  ✓ Component Inspections deletadas');

    // Inspection Records
    await client.query('DELETE FROM "inspectionRecords";');
    console.log('  ✓ Inspeções deletadas');

    // 2. Limpar Service Orders
    console.log('🗑️  Limpando Ordens de Serviço...');
    await client.query('DELETE FROM "serviceOrders";');
    console.log('  ✓ Ordens de Serviço deletadas');

    // 3. Limpar Executions
    console.log('🗑️  Limpando Execuções...');
    await client.query('DELETE FROM executions;');
    console.log('  ✓ Execuções deletadas');

    // 4. Limpar Structures
    console.log('🗑️  Limpando Estruturas...');
    await client.query('DELETE FROM structures;');
    console.log('  ✓ Estruturas deletadas');

    // 5. Limpar Component Rules
    console.log('🗑️  Limpando Componentes...');
    await client.query('DELETE FROM "componentRules";');
    console.log('  ✓ Componentes deletados');

    // 6. Limpar State
    console.log('🗑️  Limpando Estado...');
    await client.query('DELETE FROM state;');
    console.log('  ✓ Estado deletado');

    // 7. Reabilitar constraints
    await client.query('SET session_replication_role = DEFAULT;');
    console.log('✅ Constraints reabilitadas\n');

    // 8. Limpar usuários - manter apenas os 3 especificados
    console.log('👥 Processando usuários...');
    
    // Obter IDs dos usuários a manter
    const usersToKeep = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = ANY($1)',
      [USERS_TO_KEEP.map(u => u.email)]
    );

    console.log(`  ✓ Usuários encontrados para manter: ${usersToKeep.rows.length}`);

    // Deletar outros usuários
    const userEmails = USERS_TO_KEEP.map(u => u.email);
    const placeholders = userEmails.map((_, index) => `$${index + 1}`).join(', ');
    const deleteResult = await client.query(
      `DELETE FROM users WHERE email NOT IN (${placeholders})`,
      userEmails
    );

    console.log(`  ✓ Usuários simulados deletados: ${deleteResult.rowCount}`);

    // Verificar/corrigir roles dos usuários mantidos
    for (const user of USERS_TO_KEEP) {
      await client.query(
        'UPDATE users SET role = $1 WHERE email = $2',
        [user.role, user.email]
      );
    }
    console.log('  ✓ Roles dos usuários corrigidas\n');

    // 9. Mostrar estatísticas finais
    console.log('📊 ESTATÍSTICAS FINAIS:\n');

    const tables = [
      'users',
      'structures',
      'componentRules',
      'serviceOrders',
      'inspectionRecords',
      'componentInspections',
      'anomalies',
      'photos',
      'executions',
      'pauses',
      'state'
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM "${table}";`);
      const count = result.rows[0].count;
      console.log(`  ${table.padEnd(25)} : ${count} registro(s)`);
    }

    // 9. Listar usuários mantidos
    console.log('\n👤 USUÁRIOS MANTIDOS:\n');
    const users = await client.query('SELECT id, name, email, role FROM users ORDER BY role');
    for (const user of users.rows) {
      const roleEmoji = user.role === 'admin' ? '👨‍💼' : user.role === 'supervisor' ? '👨‍💼' : '👷';
      console.log(`  ${roleEmoji} ${user.name.padEnd(25)} (${user.email}) - ${user.role}`);
    }

    console.log('\n✅ LIMPEZA CONCLUÍDA COM SUCESSO!\n');
    console.log('📝 Resumo:');
    console.log('  • Todos dados simulados foram deletados');
    console.log('  • Apenas 3 usuários de teste foram mantidos');
    console.log('  • Estrutura do banco permanece intacta');
    console.log('  • Sistema pronto para dados reais\n');

  } catch (error) {
    console.error('❌ ERRO durante limpeza:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
console.log('═══════════════════════════════════════════════════════════');
console.log('🧹 LIMPEZA DE DADOS SIMULADOS - INSPEC360 v2.2');
console.log('═══════════════════════════════════════════════════════════\n');

cleanDatabase().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
