import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDataPath = path.resolve(__dirname, '../../data/estruturas.json');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL não está definida. Configure a variável de ambiente antes de rodar.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const INSERT_SQL = `INSERT INTO structures
  (id, name, type, classe, "coordX", "coordY", progressiva, deflexao, "alturaUtil", "vanFrente", "cotaCentro", lt, voltage, "cadeiaCondutor", "qtdCadeias", "cadeiaParaRaios", "qtdCadeiasPR", "estruturaCritica", status, observation, "createdBy", "createdAt")
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
`;

function parseNumber(value, fallback = 0, allowNull = false) {
  if (value === undefined || value === null || value === '' || value === 'nan' || value === 'NaN') {
    return allowNull ? null : fallback;
  }

  const numeric = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(numeric)) {
    return allowNull ? null : fallback;
  }

  return numeric;
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return '';
  }

  const text = String(value).trim();
  return text.toLowerCase() === 'nan' ? '' : text;
}

function validateStructure(item, index) {
  const required = ['name', 'type', 'coordX', 'coordY', 'lt', 'voltage'];
  for (const field of required) {
    if (item[field] === undefined || item[field] === null || item[field] === '') {
      throw new Error(`Item ${index + 1}: campo obrigatório faltando -> ${field}`);
    }
  }
}

function normalizeStructure(item) {
  return {
    id: item.id || randomUUID(),
    name: item.name,
    type: item.type,
    classe: item.classe || '',
    coordX: parseNumber(item.coordX),
    coordY: parseNumber(item.coordY),
    progressiva: parseNumber(item.progressiva),
    deflexao: parseNumber(item.deflexao, null, true),
    alturaUtil: parseNumber(item.alturaUtil),
    vanFrente: parseNumber(item.vanFrente),
    cotaCentro: parseNumber(item.cotaCentro),
    lt: item.lt,
    voltage: item.voltage,
    cadeiaCondutor: item.cadeiaCondutor || '',
    qtdCadeias: parseNumber(item.qtdCadeias, 0),
    cadeiaParaRaios: item.cadeiaParaRaios || '',
    qtdCadeiasPR: parseNumber(item.qtdCadeiasPR, 0),
    estruturaCritica: parseNumber(item.estruturaCritica, 0),
    status: item.status || 'pendente',
    observation: normalizeText(item.observation),
    createdBy: item.createdBy || 'admin',
    createdAt: item.createdAt || new Date().toISOString()
  };
}

async function resetStructures(dataPath) {
  const client = await pool.connect();
  try {
    console.log('🧹 Limpando estruturas e dados relacionados...');
    await client.query('BEGIN');
    await client.query('SET session_replication_role = REPLICA');

    await client.query('DELETE FROM "pauseHistory"');
    await client.query('DELETE FROM photos');
    await client.query('DELETE FROM anomalies');
    await client.query('DELETE FROM "componentInspections"');
    await client.query('DELETE FROM "inspectionRecords"');
    await client.query('DELETE FROM "serviceOrders"');
    await client.query('DELETE FROM executions');
    await client.query('DELETE FROM structures');

    await client.query('SET session_replication_role = DEFAULT');
    console.log('✅ Dados antigos removidos.');

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const items = JSON.parse(raw);

    if (!Array.isArray(items)) {
      throw new Error('O arquivo deve conter um array JSON de estruturas.');
    }

    const normalized = items.map((item, index) => {
      validateStructure(item, index);
      return normalizeStructure(item);
    });

    for (const item of normalized) {
      await client.query(INSERT_SQL, [
        item.id,
        item.name,
        item.type,
        item.classe,
        item.coordX,
        item.coordY,
        item.progressiva,
        item.deflexao,
        item.alturaUtil,
        item.vanFrente,
        item.cotaCentro,
        item.lt,
        item.voltage,
        item.cadeiaCondutor,
        item.qtdCadeias,
        item.cadeiaParaRaios,
        item.qtdCadeiasPR,
        item.estruturaCritica,
        item.status,
        item.observation,
        item.createdBy,
        item.createdAt
      ]);
    }

    await client.query('COMMIT');
    console.log(`✅ ${normalized.length} estruturas importadas com sucesso.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Falha ao resetar estruturas:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

const dataFile = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : defaultDataPath;
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ Arquivo não encontrado: ${dataFile}`);
  console.error('Uso: node src/database/reset-structures.js <caminho/para/structures.json>');
  process.exit(1);
}

resetStructures(dataFile).catch((error) => {
  console.error(error);
  process.exit(1);
});
