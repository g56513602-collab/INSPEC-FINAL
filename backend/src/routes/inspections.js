import express from 'express';
import * as queries from '../database/queries-postgres.js';

const router = express.Router();

// GET /api/inspections - Obter todas as inspeções
router.get('/', async (req, res) => {
  try {
    const inspections = await queries.getAllInspections();
    res.json(inspections);
  } catch (error) {
    console.error('❌ Erro ao buscar inspeções:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inspections/:id - Obter inspeção por ID
router.get('/:id', async (req, res) => {
  try {
    const inspection = await queries.getInspectionById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ error: 'Inspeção não encontrada' });
    }
    res.json(inspection);
  } catch (error) {
    console.error('❌ Erro ao buscar inspeção:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inspections - Criar nova inspeção
router.post('/', async (req, res) => {
  try {
    const inspection = await queries.createInspection(req.body);
    res.status(201).json(inspection);
  } catch (error) {
    console.error('❌ Erro ao criar inspeção:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inspections/:id - Atualizar inspeção
router.put('/:id', async (req, res) => {
  try {
    const inspection = await queries.updateInspection(req.params.id, req.body);
    if (!inspection) {
      return res.status(404).json({ error: 'Inspeção não encontrada' });
    }
    res.json(inspection);
  } catch (error) {
    console.error('❌ Erro ao atualizar inspeção:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inspections/:id/components - Adicionar componente à inspeção
router.post('/:id/components', async (req, res) => {
  try {
    const component = await queries.createComponentInspection({
      inspectionId: req.params.id,
      ...req.body
    });
    res.status(201).json(component);
  } catch (error) {
    console.error('❌ Erro ao adicionar componente:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inspections/:id/anomalies - Adicionar anomalia
router.post('/:id/anomalies', async (req, res) => {
  try {
    const anomaly = await queries.createAnomaly({
      inspectionId: req.params.id,
      ...req.body
    });
    res.status(201).json(anomaly);
  } catch (error) {
    console.error('❌ Erro ao adicionar anomalia:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inspections/:id/photos - Adicionar foto
router.post('/:id/photos', async (req, res) => {
  try {
    const photo = await queries.createPhoto({
      inspectionId: req.params.id,
      ...req.body
    });
    res.status(201).json(photo);
  } catch (error) {
    console.error('❌ Erro ao adicionar foto:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inspections/:id/pause - Pausar inspeção
router.post('/:id/pause', async (req, res) => {
  try {
    const pause = await queries.createPause({
      inspectionId: req.params.id,
      ...req.body
    });
    res.status(201).json(pause);
  } catch (error) {
    console.error('❌ Erro ao pausar inspeção:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inspections/pause/:pauseId/resume - Retomar inspeção
router.put('/pause/:pauseId/resume', async (req, res) => {
  try {
    const pause = await queries.resumePause(req.params.pauseId);
    res.json(pause);
  } catch (error) {
    console.error('❌ Erro ao retomar inspeção:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
