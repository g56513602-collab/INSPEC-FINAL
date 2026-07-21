import express from 'express';
import * as queries from '../database/queries-postgres.js';

const router = express.Router();

// GET /api/service-orders - Obter todas as ordens de serviço
router.get('/', async (req, res) => {
  try {
    const orders = await queries.getAllServiceOrders();
    res.json(orders);
  } catch (error) {
    console.error('❌ Erro ao buscar ordens de serviço:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/service-orders/:id - Obter ordem por ID
router.get('/:id', async (req, res) => {
  try {
    const order = await queries.getServiceOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordem não encontrada' });
    }
    res.json(order);
  } catch (error) {
    console.error('❌ Erro ao buscar ordem:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/service-orders - Criar nova ordem
router.post('/', async (req, res) => {
  try {
    const order = await queries.createServiceOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error('❌ Erro ao criar ordem:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/service-orders/:id - Atualizar ordem
router.put('/:id', async (req, res) => {
  try {
    const order = await queries.updateServiceOrder(req.params.id, req.body);
    if (!order) {
      return res.status(404).json({ error: 'Ordem não encontrada' });
    }
    res.json(order);
  } catch (error) {
    console.error('❌ Erro ao atualizar ordem:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/service-orders/:id - Excluir ordem
router.delete('/:id', async (req, res) => {
  try {
    await queries.deleteServiceOrder(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao excluir ordem:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
