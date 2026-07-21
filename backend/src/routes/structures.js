import express from 'express';
import * as queries from '../database/queries-postgres.js';

const router = express.Router();

// GET /api/structures - Obter todas as estruturas
router.get('/', async (req, res) => {
  try {
    const structures = await queries.getAllStructures();
    res.json(structures);
  } catch (error) {
    console.error('❌ Erro ao buscar estruturas:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/structures/:id - Obter estrutura por ID
router.get('/:id', async (req, res) => {
  try {
    const structure = await queries.getStructureById(req.params.id);
    if (!structure) {
      return res.status(404).json({ error: 'Estrutura não encontrada' });
    }
    res.json(structure);
  } catch (error) {
    console.error('❌ Erro ao buscar estrutura:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/structures - Criar nova estrutura
router.post('/', async (req, res) => {
  try {
    const structure = await queries.createStructure(req.body);
    res.status(201).json(structure);
  } catch (error) {
    console.error('❌ Erro ao criar estrutura:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/structures/import - Importar várias estruturas de uma carga JSON
router.post('/import', async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: 'Payload deve ser um array de estruturas' });
    }

    const structures = await queries.bulkCreateStructures(payload);
    res.status(201).json({ imported: structures.length, structures });
  } catch (error) {
    console.error('❌ Erro ao importar estruturas:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/structures/:id - Atualizar estrutura
router.put('/:id', async (req, res) => {
  try {
    const structure = await queries.updateStructure(req.params.id, req.body);
    if (!structure) {
      return res.status(404).json({ error: 'Estrutura não encontrada' });
    }
    res.json(structure);
  } catch (error) {
    console.error('❌ Erro ao atualizar estrutura:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/structures/:id - Excluir estrutura
router.delete('/:id', async (req, res) => {
  try {
    await queries.deleteStructure(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao excluir estrutura:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
