import express from 'express';
import * as queries from '../database/queries-postgres.js';

const router = express.Router();

// GET /api/components - Obter todos os componentes
router.get('/', async (req, res) => {
  try {
    const components = await queries.getAllComponents();
    res.json(components);
  } catch (error) {
    console.error('❌ Erro ao buscar componentes:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/components/:id - Obter componente por ID
router.get('/:id', async (req, res) => {
  try {
    const component = await queries.getComponentById(req.params.id);
    if (!component) {
      return res.status(404).json({ error: 'Componente não encontrado' });
    }
    res.json(component);
  } catch (error) {
    console.error('❌ Erro ao buscar componente:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/components - Criar novo componente
router.post('/', async (req, res) => {
  try {
    const component = await queries.createComponent(req.body);
    res.status(201).json(component);
  } catch (error) {
    console.error('❌ Erro ao criar componente:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/components/:id - Atualizar componente
router.put('/:id', async (req, res) => {
  try {
    const component = await queries.updateComponent(req.params.id, req.body);
    if (!component) {
      return res.status(404).json({ error: 'Componente não encontrado' });
    }
    res.json(component);
  } catch (error) {
    console.error('❌ Erro ao atualizar componente:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/components/:id - Excluir componente
router.delete('/:id', async (req, res) => {
  try {
    await queries.deleteComponent(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao excluir componente:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
