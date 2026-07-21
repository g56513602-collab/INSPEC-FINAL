import { runSQL, getQuery, getQueryOne } from './postgres-connection.js';
import { v4 as uuidv4 } from 'uuid';

// ═════════════════════════════════════════════════════════════════════════════
// USERS
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllUsers() {
  return await getQuery('SELECT * FROM users ORDER BY "createdAt" DESC');
}

export async function getUserById(id) {
  return await getQueryOne('SELECT * FROM users WHERE id = $1', [id]);
}

export async function getUserByEmail(email) {
  return await getQueryOne('SELECT * FROM users WHERE email = $1', [email]);
}

export async function createUser(data) {
  const id = data.id || uuidv4();
  const createdAt = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO users (id, name, email, password, role, status, "createdAt", phone, avatar)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, data.name, data.email, data.password, data.role || 'tecnico', 'active', createdAt, data.phone || '', data.avatar || '']
  );
  
  return await getUserById(id);
}

export async function updateUser(id, data) {
  const updatedAt = new Date().toISOString();
  const lastLogin = data.lastLogin || updatedAt;
  
  const fields = [];
  const params = [];
  let paramIndex = 1;
  
  if (data.name) { fields.push(`name = $${paramIndex}`); params.push(data.name); paramIndex++; }
  if (data.email) { fields.push(`email = $${paramIndex}`); params.push(data.email); paramIndex++; }
  if (data.password) { fields.push(`password = $${paramIndex}`); params.push(data.password); paramIndex++; }
  if (data.role) { fields.push(`role = $${paramIndex}`); params.push(data.role); paramIndex++; }
  if (data.status) { fields.push(`status = $${paramIndex}`); params.push(data.status); paramIndex++; }
  if (data.phone) { fields.push(`phone = $${paramIndex}`); params.push(data.phone); paramIndex++; }
  if (data.avatar) { fields.push(`avatar = $${paramIndex}`); params.push(data.avatar); paramIndex++; }
  
  fields.push(`"lastLogin" = $${paramIndex}`);
  params.push(lastLogin);
  paramIndex++;
  
  params.push(id);
  
  if (fields.length === 0) return await getUserById(id);
  
  await runSQL(`UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
  return await getUserById(id);
}

export async function deleteUser(id) {
  await runSQL('DELETE FROM users WHERE id = $1', [id]);
  return true;
}

// ═════════════════════════════════════════════════════════════════════════════
// STRUCTURES
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllStructures() {
  return await getQuery('SELECT * FROM structures ORDER BY name ASC');
}

export async function getStructureById(id) {
  return await getQueryOne('SELECT * FROM structures WHERE id = $1', [id]);
}

export async function createStructure(data) {
  const id = data.id || uuidv4();
  const createdAt = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO structures (id, name, type, classe, "coordX", "coordY", progressiva, deflexao, 
     "alturaUtil", "vanFrente", "cotaCentro", lt, voltage, "cadeiaCondutor", "qtdCadeias", 
     "cadeiaParaRaios", "qtdCadeiasPR", "estruturaCritica", status, observation, "createdBy", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
    [id, data.name, data.type, data.classe || '', data.coordX, data.coordY, data.progressiva,
     data.deflexao, data.alturaUtil, data.vanFrente, data.cotaCentro, data.lt, data.voltage,
     data.cadeiaCondutor || '', data.qtdCadeias || 0, data.cadeiaParaRaios || '', data.qtdCadeiasPR || 0,
     data.estruturaCritica || 0, 'pendente', data.observation || '', data.createdBy, createdAt]
  );
  
  return await getStructureById(id);
}

export async function updateStructure(id, data) {
  const fields = [];
  const params = [];
  let paramIndex = 1;
  
  if (data.name) { fields.push(`name = $${paramIndex}`); params.push(data.name); paramIndex++; }
  if (data.status) { fields.push(`status = $${paramIndex}`); params.push(data.status); paramIndex++; }
  if (data.observation !== undefined) { fields.push(`observation = $${paramIndex}`); params.push(data.observation); paramIndex++; }
  if (data.classe) { fields.push(`classe = $${paramIndex}`); params.push(data.classe); paramIndex++; }
  
  if (fields.length === 0) return await getStructureById(id);
  
  params.push(id);
  await runSQL(`UPDATE structures SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
  return await getStructureById(id);
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTS (REGRAS)
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllComponents() {
  return await getQuery('SELECT * FROM "componentRules" ORDER BY name ASC');
}

export async function getComponentById(id) {
  return await getQueryOne('SELECT * FROM "componentRules" WHERE id = $1', [id]);
}

export async function createComponent(data) {
  const id = data.id || uuidv4();
  
  await runSQL(
    `INSERT INTO "componentRules" (id, name, icon, description, anomalies)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, data.name, data.icon || '', data.description || '', data.anomalies || '']
  );
  
  return await getComponentById(id);
}

// ═════════════════════════════════════════════════════════════════════════════
// SERVICE ORDERS
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllServiceOrders() {
  return await getQuery('SELECT * FROM "serviceOrders" ORDER BY "createdAt" DESC');
}

export async function getServiceOrderById(id) {
  return await getQueryOne('SELECT * FROM "serviceOrders" WHERE id = $1', [id]);
}

export async function createServiceOrder(data) {
  const id = data.id || uuidv4();
  const now = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO "serviceOrders" 
     (id, type, "structureId", "structureName", "supervisorId", "supervisorName", "technicianId", 
      "technicianName", status, "startDate", priority, description, "createdAt", "updatedAt", deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [id, data.type || 'inspecao', data.structureId, data.structureName, data.supervisorId, 
     data.supervisorName, data.technicianId || null, data.technicianName || '', 
     data.status || 'pendente', data.startDate || now, data.priority || 'media', 
     data.description || '', now, now, data.deadline || null]
  );
  
  return await getServiceOrderById(id);
}

export async function updateServiceOrder(id, data) {
  const fields = [];
  const params = [];
  let paramIndex = 1;
  const updatedAt = new Date().toISOString();
  
  if (data.status) { fields.push(`status = $${paramIndex}`); params.push(data.status); paramIndex++; }
  if (data.technicianId !== undefined) { fields.push(`"technicianId" = $${paramIndex}`); params.push(data.technicianId); paramIndex++; }
  if (data.technicianName) { fields.push(`"technicianName" = $${paramIndex}`); params.push(data.technicianName); paramIndex++; }
  if (data.startDate) { fields.push(`"startDate" = $${paramIndex}`); params.push(data.startDate); paramIndex++; }
  if (data.endDate) { fields.push(`"endDate" = $${paramIndex}`); params.push(data.endDate); paramIndex++; }
  if (data.priority) { fields.push(`priority = $${paramIndex}`); params.push(data.priority); paramIndex++; }
  if (data.description !== undefined) { fields.push(`description = $${paramIndex}`); params.push(data.description); paramIndex++; }
  if (data.deadline) { fields.push(`deadline = $${paramIndex}`); params.push(data.deadline); paramIndex++; }
  
  fields.push(`"updatedAt" = $${paramIndex}`);
  params.push(updatedAt);
  paramIndex++;
  
  params.push(id);
  
  await runSQL(`UPDATE "serviceOrders" SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
  return await getServiceOrderById(id);
}

// ═════════════════════════════════════════════════════════════════════════════
// INSPECTIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllInspections() {
  return await getQuery('SELECT * FROM "inspectionRecords" ORDER BY "dataHoraAbertura" DESC');
}

export async function getInspectionById(id) {
  return await getQueryOne('SELECT * FROM "inspectionRecords" WHERE id = $1', [id]);
}

export async function createInspection(data) {
  const id = data.id || uuidv4();
  const now = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO "inspectionRecords" 
     (id, "orderId", "estruturaId", "estruturaNome", "supervisorId", "supervisorNome", "tecnicoId", 
      "tecnicoNome", "dataHoraAbertura", status, "observacoesGerais", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [id, data.orderId, data.estruturaId, data.estruturaNome, data.supervisorId, 
     data.supervisorNome, data.tecnicoId, data.tecnicoNome, data.dataHoraAbertura || now, 
     data.status || 'aberto', data.observacoesGerais || '', now, now]
  );
  
  return await getInspectionById(id);
}

export async function updateInspection(id, data) {
  const fields = [];
  const params = [];
  let paramIndex = 1;
  const updatedAt = new Date().toISOString();
  
  if (data.status) { fields.push(`status = $${paramIndex}`); params.push(data.status); paramIndex++; }
  if (data.dataHoraFim) { fields.push(`"dataHoraFim" = $${paramIndex}`); params.push(data.dataHoraFim); paramIndex++; }
  if (data.observacoesGerais !== undefined) { fields.push(`"observacoesGerais" = $${paramIndex}`); params.push(data.observacoesGerais); paramIndex++; }
  
  fields.push(`"updatedAt" = $${paramIndex}`);
  params.push(updatedAt);
  paramIndex++;
  
  params.push(id);
  
  await runSQL(`UPDATE "inspectionRecords" SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
  return await getInspectionById(id);
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT INSPECTIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function getComponentInspectionsByInspectionId(inspectionId) {
  return await getQuery('SELECT * FROM "componentInspections" WHERE "inspectionId" = $1 ORDER BY "createdAt" DESC', [inspectionId]);
}

export async function createComponentInspection(data) {
  const id = data.id || uuidv4();
  const now = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO "componentInspections" (id, "inspectionId", "componentId", "componentName", status, notes, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, data.inspectionId, data.componentId, data.componentName, data.status || 'pendente', data.notes || '', now]
  );
  
  return await getQueryOne('SELECT * FROM "componentInspections" WHERE id = $1', [id]);
}

// ═════════════════════════════════════════════════════════════════════════════
// ANOMALIES
// ═════════════════════════════════════════════════════════════════════════════

export async function getAnomaliesByInspectionId(inspectionId) {
  return await getQuery('SELECT * FROM anomalies WHERE "inspectionId" = $1 ORDER BY "createdAt" DESC', [inspectionId]);
}

export async function createAnomaly(data) {
  const id = data.id || uuidv4();
  const now = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO anomalies 
     (id, "componentInspectionId", "inspectionId", "anomalyName", severity, phase, "isEmenda", 
      "safetyRisk", "operationalRisk", "requiresShutdown", "isRecurrent", observation, latitude, longitude, accuracy, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [id, data.componentInspectionId, data.inspectionId, data.anomalyName, data.severity, 
     Array.isArray(data.phase) ? JSON.stringify(data.phase) : data.phase, data.isEmenda || false, 
     data.safetyRisk, data.operationalRisk, data.requiresShutdown || false, data.isRecurrent || false, 
     data.observation || '', data.latitude, data.longitude, data.accuracy, now]
  );
  
  return await getQueryOne('SELECT * FROM anomalies WHERE id = $1', [id]);
}

// ═════════════════════════════════════════════════════════════════════════════
// STATE (For sync purposes)
// ═════════════════════════════════════════════════════════════════════════════

export async function getState(key) {
  const result = await getQueryOne('SELECT value FROM state WHERE key = $1', [key]);
  return result ? result.value : null;
}

export async function setState(key, value) {
  const now = new Date().toISOString();
  
  // Try to update first
  const result = await runSQL(
    'UPDATE state SET value = $1, "updatedAt" = $2 WHERE key = $3',
    [value, now, key]
  );
  
  // If nothing was updated, insert
  if (result.changes === 0) {
    await runSQL(
      'INSERT INTO state (key, value, "updatedAt") VALUES ($1, $2, $3)',
      [key, value, now]
    );
  }
  
  return true;
}

// ═════════════════════════════════════════════════════════════════════════════
// PHOTOS
// ═════════════════════════════════════════════════════════════════════════════

export async function getPhotosByInspectionId(inspectionId) {
  return await getQuery('SELECT * FROM photos WHERE "inspectionId" = $1 ORDER BY "createdAt" DESC', [inspectionId]);
}

export async function createPhoto(data) {
  const id = data.id || uuidv4();
  const now = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO photos (id, "inspectionId", filename, path, "componentName", "anomalyName", latitude, longitude, accuracy, metadata, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, data.inspectionId, data.filename, data.path, data.componentName || '', 
     data.anomalyName || '', data.latitude, data.longitude, data.accuracy, 
     data.metadata || '{}', now]
  );
  
  return await getQueryOne('SELECT * FROM photos WHERE id = $1', [id]);
}

export async function getAllPhotos() {
  return await getQuery('SELECT * FROM photos ORDER BY "createdAt" DESC');
}

// ═════════════════════════════════════════════════════════════════════════════
// ANOMALIES - GETALL
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllAnomalies() {
  return await getQuery('SELECT * FROM anomalies ORDER BY "createdAt" DESC');
}

// ═════════════════════════════════════════════════════════════════════════════
// EXECUTIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllExecutions() {
  return await getQuery('SELECT * FROM executions ORDER BY "createdAt" DESC');
}

export async function getExecutionById(id) {
  return await getQueryOne('SELECT * FROM executions WHERE id = $1', [id]);
}

export async function createExecution(data) {
  const id = data.id || uuidv4();
  const now = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO executions 
     (id, "orderId", "estruturaId", "estruturaNome", "supervisorId", "supervisorNome", "technicianId", 
      "technicianName", status, "startDate", priority, description, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [id, data.orderId, data.estruturaId, data.estruturaNome, data.supervisorId, 
     data.supervisorNome, data.technicianId || null, data.technicianName || '', 
     data.status || 'pendente', data.startDate || now, data.priority || 'media', 
     data.description || '', now, now]
  );
  
  return await getExecutionById(id);
}

export async function updateExecution(id, data) {
  const fields = [];
  const params = [];
  let paramIndex = 1;
  const updatedAt = new Date().toISOString();
  
  if (data.status) { fields.push(`status = $${paramIndex}`); params.push(data.status); paramIndex++; }
  if (data.endDate) { fields.push(`"endDate" = $${paramIndex}`); params.push(data.endDate); paramIndex++; }
  if (data.observation !== undefined) { fields.push(`observation = $${paramIndex}`); params.push(data.observation); paramIndex++; }
  
  fields.push(`"updatedAt" = $${paramIndex}`);
  params.push(updatedAt);
  paramIndex++;
  
  params.push(id);
  
  await runSQL(`UPDATE executions SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
  return await getExecutionById(id);
}

// ═════════════════════════════════════════════════════════════════════════════
// PAUSE (Pausas de Inspeção)
// ═════════════════════════════════════════════════════════════════════════════

export async function createPause(data) {
  const id = data.id || uuidv4();
  const now = new Date().toISOString();
  
  await runSQL(
    `INSERT INTO pauses (id, "inspectionId", "startTime", reason, "createdAt")
     VALUES ($1, $2, $3, $4, $5)`,
    [id, data.inspectionId, now, data.reason || '', now]
  );
  
  return await getQueryOne('SELECT * FROM pauses WHERE id = $1', [id]);
}

export async function resumePause(pauseId) {
  const now = new Date().toISOString();
  
  await runSQL(
    'UPDATE pauses SET "endTime" = $1 WHERE id = $2',
    [now, pauseId]
  );
  
  return await getQueryOne('SELECT * FROM pauses WHERE id = $1', [pauseId]);
}
