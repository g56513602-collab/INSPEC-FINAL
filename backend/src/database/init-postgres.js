import { initDb, runSQL } from './postgres-connection.js';

export async function initializeDatabase() {
  console.log('🔧 Inicializando banco PostgreSQL...');
  
  await initDb();
  console.log('✅ Conexão PostgreSQL estabelecida');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TABELA DE USUÁRIOS
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('tecnico', 'supervisor', 'superadm')),
      status TEXT NOT NULL CHECK(status IN ('active', 'inactive')),
      "lastLogin" TEXT,
      avatar TEXT,
      phone TEXT,
      "createdAt" TEXT NOT NULL
    )
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. TABELA DE ESTRUTURAS
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS structures (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Suspensão', 'Ancoragem', 'Transposição', 'Terminal', 'Ângulo', 'Estaiada')),
      classe TEXT,
      "coordX" REAL NOT NULL,
      "coordY" REAL NOT NULL,
      lat REAL,
      lng REAL,
      progressiva REAL NOT NULL,
      deflexao REAL,
      "alturaUtil" REAL,
      "vanFrente" REAL,
      "cotaCentro" REAL,
      lt TEXT NOT NULL,
      voltage TEXT NOT NULL,
      "cadeiaCondutor" TEXT,
      "qtdCadeias" INTEGER,
      "cadeiaParaRaios" TEXT,
      "qtdCadeiasPR" INTEGER,
      "estruturaCritica" INTEGER DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pendente', 'em-andamento', 'concluido', 'anomalia', 'atrasado')),
      observation TEXT,
      "createdBy" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY("createdBy") REFERENCES users(id)
    )
  `);

  // Migração: bancos existentes criados antes da coluna lat/lng não a possuem.
  await runSQL(`ALTER TABLE structures ADD COLUMN IF NOT EXISTS lat REAL`);
  await runSQL(`ALTER TABLE structures ADD COLUMN IF NOT EXISTS lng REAL`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. TABELA DE REGRAS DE COMPONENTES
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS "componentRules" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      anomalies TEXT NOT NULL
    )
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. TABELA DE ORDENS DE SERVIÇO
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS "serviceOrders" (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('inspecao', 'execucao')),
      om TEXT,
      "inspectionType" TEXT CHECK("inspectionType" IN ('MI', 'PA')),
      "structureId" TEXT NOT NULL,
      "structureName" TEXT NOT NULL,
      "supervisorId" TEXT NOT NULL,
      "supervisorName" TEXT NOT NULL,
      "technicianId" TEXT,
      "technicianName" TEXT,
      status TEXT NOT NULL CHECK(status IN ('pendente', 'em-andamento', 'pausado', 'concluido', 'cancelado')),
      "startDate" TEXT,
      "endDate" TEXT,
      priority TEXT CHECK(priority IN ('baixa', 'media', 'alta', 'critica')),
      description TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      "deadline" TEXT,
      FOREIGN KEY("structureId") REFERENCES structures(id),
      FOREIGN KEY("supervisorId") REFERENCES users(id),
      FOREIGN KEY("technicianId") REFERENCES users(id)
    )
  `);

  // Migração: bancos existentes criados antes das colunas om/inspectionType não as possuem.
  await runSQL(`ALTER TABLE "serviceOrders" ADD COLUMN IF NOT EXISTS om TEXT`);
  await runSQL(`ALTER TABLE "serviceOrders" ADD COLUMN IF NOT EXISTS "inspectionType" TEXT`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. TABELA DE INSPEÇÕES
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS "inspectionRecords" (
      id TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "estruturaId" TEXT NOT NULL,
      "estruturaNome" TEXT NOT NULL,
      "supervisorId" TEXT NOT NULL,
      "supervisorNome" TEXT NOT NULL,
      "tecnicoId" TEXT NOT NULL,
      "tecnicoNome" TEXT NOT NULL,
      "dataHoraAbertura" TEXT NOT NULL,
      "dataHoraFim" TEXT,
      status TEXT NOT NULL CHECK(status IN ('aberto', 'em-andamento', 'pausado', 'concluido', 'cancelado')),
      "observacoesGerais" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      FOREIGN KEY("orderId") REFERENCES "serviceOrders"(id),
      FOREIGN KEY("estruturaId") REFERENCES structures(id),
      FOREIGN KEY("supervisorId") REFERENCES users(id),
      FOREIGN KEY("tecnicoId") REFERENCES users(id)
    )
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. TABELA DE COMPONENTES INSPECIONADOS
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS "componentInspections" (
      id TEXT PRIMARY KEY,
      "inspectionId" TEXT NOT NULL,
      "componentId" TEXT NOT NULL,
      "componentName" TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pendente', 'ok', 'anomalia', 'nao-aplicavel')),
      notes TEXT,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY("inspectionId") REFERENCES "inspectionRecords"(id),
      FOREIGN KEY("componentId") REFERENCES "componentRules"(id)
    )
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. TABELA DE ANOMALIAS
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS anomalies (
      id TEXT PRIMARY KEY,
      "componentInspectionId" TEXT NOT NULL,
      "inspectionId" TEXT NOT NULL,
      "anomalyName" TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('leve', 'moderada', 'grave', 'critica')),
      phase TEXT,
      "isEmenda" BOOLEAN DEFAULT FALSE,
      "safetyRisk" TEXT CHECK("safetyRisk" IN ('leve', 'moderada', 'grave', 'critica')),
      "operationalRisk" TEXT CHECK("operationalRisk" IN ('leve', 'moderada', 'grave', 'critica')),
      "requiresShutdown" BOOLEAN DEFAULT FALSE,
      "isRecurrent" BOOLEAN DEFAULT FALSE,
      observation TEXT,
      photo TEXT,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY("componentInspectionId") REFERENCES "componentInspections"(id),
      FOREIGN KEY("inspectionId") REFERENCES "inspectionRecords"(id)
    )
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. TABELA DE EXECUÇÕES
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "estructuraId" TEXT NOT NULL,
      "estructuraNome" TEXT NOT NULL,
      "supervisorId" TEXT NOT NULL,
      "supervisorNome" TEXT NOT NULL,
      "tecnicoId" TEXT NOT NULL,
      "tecnicoNome" TEXT NOT NULL,
      "dataHoraAbertura" TEXT NOT NULL,
      "dataHoraFim" TEXT,
      status TEXT NOT NULL CHECK(status IN ('aberto', 'em-andamento', 'pausado', 'concluido', 'cancelado')),
      "observacoesGerais" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      FOREIGN KEY("orderId") REFERENCES "serviceOrders"(id)
    )
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. TABELA DE FOTOS
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      "inspectionId" TEXT,
      "executionId" TEXT,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      "componentName" TEXT,
      "anomalyName" TEXT,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      metadata TEXT,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY("inspectionId") REFERENCES "inspectionRecords"(id),
      FOREIGN KEY("executionId") REFERENCES executions(id)
    )
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. TABELA DE HISTÓRICO DE PAUSA
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS "pauseHistory" (
      id TEXT PRIMARY KEY,
      "inspectionId" TEXT NOT NULL,
      "userId" TEXT,
      "userName" TEXT,
      "pausedAt" TEXT NOT NULL,
      "resumedAt" TEXT,
      reason TEXT,
      FOREIGN KEY("inspectionId") REFERENCES "inspectionRecords"(id),
      FOREIGN KEY("userId") REFERENCES users(id)
    )
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. TABELA DE ESTADO/SINCRONIZAÇÃO
  // ─────────────────────────────────────────────────────────────────────────────
  await runSQL(`
    CREATE TABLE IF NOT EXISTS state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    )
  `);

  console.log('✅ Todas as tabelas criadas/verificadas com sucesso!');
}
