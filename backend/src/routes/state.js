import express from 'express';
import { runSQL, getQuery } from '../database/postgres-connection.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// MERGE SEGURO DE ESTADO
//
// O estado inteiro do app (usuários, estruturas, ordens, inspeções, fotos
// embutidas em base64, etc.) é sincronizado como um único blob JSON nesta
// rota. Antes desta correção, POST /api/state simplesmente SUBSTITUÍA esse
// blob pelo payload recebido — então qualquer dispositivo com uma cópia local
// desatualizada (ex.: acabou de reabrir o app após ficar dias sem sincronizar,
// ou teve o armazenamento local limpo) apagava silenciosamente tudo que outros
// usuários tinham criado depois daquele snapshot. Essa é a causa raiz
// confirmada (via inspeção do banco de produção) da perda total de dados
// relatada após "atualizações".
//
// A correção: em vez de substituir, mesclamos cada coleção (array) por id.
// Registros que só existem no servidor são preservados por padrão — exceto
// quando o payload recebido claramente reflete uma exclusão legítima e
// pequena (poucos registros removidos de uma coleção grande), caso em que
// confiamos no cliente. Se o payload recebido remove uma fração grande dos
// registros conhecidos de uma só vez — a assinatura exata de um cliente
// desatualizado sobrescrevendo o servidor — preservamos os registros que
// faltam em vez de apagá-los.
// ─────────────────────────────────────────────────────────────────────────────

function hasId(item) {
  return item !== null && typeof item === 'object' && 'id' in item;
}

function mergeCollection(existingArr, incomingArr, collectionName) {
  if (!Array.isArray(existingArr)) return incomingArr;
  if (!Array.isArray(incomingArr)) return existingArr;

  const existingIds = new Set(existingArr.filter(hasId).map((i) => i.id));
  const incomingIds = new Set(incomingArr.filter(hasId).map((i) => i.id));
  const missingFromIncoming = [...existingIds].filter((id) => !incomingIds.has(id));

  const dropRatio = existingIds.size > 0 ? missingFromIncoming.length / existingIds.size : 0;
  const looksLikeStaleOverwrite = existingIds.size >= 3 && dropRatio > 0.3;

  if (!looksLikeStaleOverwrite) {
    // Payload confiável — pode incluir a adição/edição normal de registros,
    // ou a exclusão legítima e pequena de 1-poucos itens.
    return incomingArr;
  }

  console.warn(
    `⚠️  [state-merge] Payload para "${collectionName}" removeria ${missingFromIncoming.length}/${existingIds.size} ` +
    `registros existentes de uma vez — tratado como sincronização desatualizada, não como exclusão. Preservando registros do servidor.`
  );

  const byId = new Map();
  existingArr.forEach((i) => hasId(i) && byId.set(i.id, i));
  incomingArr.forEach((i) => hasId(i) && byId.set(i.id, i));
  const withoutId = existingArr.filter((i) => !hasId(i));
  return [...byId.values(), ...withoutId];
}

function mergeAppState(existing, incoming) {
  if (!existing || typeof existing !== 'object') return incoming;
  if (!incoming || typeof incoming !== 'object') return existing;

  const merged = { ...existing, ...incoming };

  for (const key of Object.keys(existing)) {
    if (Array.isArray(existing[key])) {
      merged[key] = mergeCollection(existing[key], incoming[key], key);
    }
  }

  return merged;
}

// GET /api/state — load full app state
router.get('/', async (req, res) => {
  try {
    try {
      const rows = await getQuery('SELECT value FROM state WHERE key = $1', ['app_data']);
      if (rows.length > 0) {
        res.json({ state: JSON.parse(rows[0].value), found: true });
      } else {
        res.json({ state: null, found: false });
      }
    } catch (dbError) {
      // Se falhar banco de dados, retornar sem estado
      console.warn('⚠️ Aviso ao carregar estado do BD:', dbError.message);
      res.json({ state: null, found: false, offline: true });
    }
  } catch (error) {
    console.error('❌ Erro ao processar GET state:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/state — save full app state (merge seguro, nunca substitui às cegas)
router.post('/', async (req, res) => {
  try {
    // Nunca persistir um estado nulo/vazio — isso apagaria todo o banco
    // compartilhado (users, structures, service orders, inspections, etc.)
    // que fica armazenado nesta única linha (key='app_data').
    if (req.body.state === null || req.body.state === undefined) {
      return res.status(400).json({
        error: 'state ausente ou nulo — operação rejeitada para evitar perda de dados',
      });
    }

    const incoming = req.body.state;
    const now = new Date().toISOString();

    try {
      const existingRows = await getQuery('SELECT value FROM state WHERE key = $1', ['app_data']);

      let toStore = incoming;
      if (existingRows.length > 0) {
        let existing = null;
        try {
          existing = JSON.parse(existingRows[0].value);
        } catch {
          existing = null; // valor corrompido — trata como se não houvesse estado anterior
        }
        toStore = mergeAppState(existing, incoming);
        await runSQL('UPDATE state SET value = $1, "updatedAt" = $2 WHERE key = $3', [
          JSON.stringify(toStore), now, 'app_data',
        ]);
      } else {
        await runSQL('INSERT INTO state (key, value, "updatedAt") VALUES ($1, $2, $3)', [
          'app_data', JSON.stringify(toStore), now,
        ]);
      }
    } catch (dbError) {
      // Se falhar banco de dados, apenas log e continue (localStorage é fallback)
      console.warn('⚠️ Aviso ao salvar estado no BD:', dbError.message);
    }

    // Sempre retornar sucesso - o frontend tem localStorage como fallback
    res.json({ success: true, updated_at: now });
  } catch (error) {
    console.error('❌ Erro ao processar estado:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/state/export — download the state as a JSON file
router.get('/export', async (req, res) => {
  try {
    try {
      const rows = await getQuery('SELECT value, "updatedAt" FROM state WHERE key = $1', ['app_data']);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Sem dados para exportar' });
      }
      const state = JSON.parse(rows[0].value);
      const filename = `inspec360_export_${new Date().toISOString().slice(0,10)}.json`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/json');
      res.json({
        exported_at: rows[0].updatedAt,
        version: '2.2.0',
        data: state,
      });
    } catch (dbError) {
      console.warn('⚠️ Aviso ao exportar estado:', dbError.message);
      return res.status(503).json({ error: 'Banco de dados indisponível', offline: true });
    }
  } catch (error) {
    console.error('❌ Erro ao processar export:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
