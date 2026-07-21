import express from 'express';
import * as queries from '../database/queries-postgres.js';

const router = express.Router();

// GET /api/users - Obter todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await queries.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Obter usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await queries.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Criar novo usuário
router.post('/', async (req, res) => {
  try {
    const user = await queries.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/login - Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await queries.getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }
    
    // Em produção: usar bcrypt.compare()
    if (user.password !== password) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }
    
    const updatedUser = await queries.updateUser(user.id, {});
    res.json(updatedUser);
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const user = await queries.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
