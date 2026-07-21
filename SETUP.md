# INSPEC360 - Setup Completo

## 🚀 Instruções de Instalação e Execução

### Pré-requisitos

- Node.js 18+ ou superior
- npm ou pnpm
- Git

### 📦 Instalação

#### 1. Frontend

```bash
# Instalar dependências
npm install
# ou
pnpm install

# Criar arquivo .env.local
cp .env.example .env.local
```

#### 2. Backend

```bash
cd backend

# Instalar dependências
npm install
# ou
pnpm install

# Inicializar banco de dados SQLite
npm run init-db
```

### 🏃 Executar o Sistema

**Em dois terminais diferentes:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# ou
npm start
```

Será iniciado em: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Será iniciado em: `http://localhost:5173` (Vite)

### 📚 Estrutura do Projeto

```
INPEC360 V2/
├── backend/                 # Backend Node.js/Express
│   ├── src/
│   │   ├── database/       # SQLite + queries
│   │   ├── routes/         # Rotas da API
│   │   └── server.js       # Servidor Express
│   ├── package.json
│   └── README.md
│
├── src/                    # Frontend React/Vite
│   ├── api/
│   │   └── client.js       # Cliente da API
│   ├── app/
│   │   ├── data/
│   │   │   ├── store.ts         # Store local
│   │   │   ├── backendStore.ts  # Store integrado
│   │   │   └── types.ts
│   │   └── components/
│   └── ...
│
├── public/
│   └── images/
│       └── inspections/    # Pasta para fotos
│
├── data/
│   └── inspec360.db        # Banco SQLite (criado automaticamente)
│
└── .env.local              # Configuração (criar a partir de .env.example)
```

### 🔑 Credenciais Padrão

**Super Admin:**
- Email: `admin@inspec360.com`
- Senha: `admin123`

**Supervisor:**
- Email: `supervisor@inspec360.com`
- Senha: `sup123`

**Técnico:**
- Email: `tecnico1@inspec360.com`
- Senha: `tec123`

### 📡 Sincronização Backend-Frontend

O sistema funciona de forma integrada:

1. **Frontend** faz requisições para a **API do Backend** (`http://localhost:3000/api`)
2. **Backend** armazena dados em **SQLite local** (`data/inspec360.db`)
3. **Imagens** são salvas em `public/images/inspections/`
4. **Sincronização automática** a cada 30 segundos

Use `backendStore` no frontend para sincronização:

```typescript
import { inspectionStore } from '@/app/data/backendStore';

// Criar inspeção
const inspection = await inspectionStore.create({
  orderId: 'ord_123',
  estruturaId: 'str_001',
  // ... outros dados
});

// Upload de foto
const photo = await inspectionStore.uploadPhoto(
  inspectionId,
  file,
  { componentId: 'isoladores', caption: 'Foto da anomalia' }
);
```

### 📸 Pasta de Imagens

As imagens de inspeção são armazenadas em:
```
public/images/inspections/
```

Estrutura:
```
inspections/
├── {inspection_id}/
│   ├── geral/
│   │   └── {photo_id}.jpg
│   └── components/
│       ├── isoladores/
│       │   └── {photo_id}.jpg
│       └── estrutura/
│           └── {photo_id}.jpg
```

### 🛠️ Desenvolvimento

**Adicionar novo endpoint:**

1. Criar função em `backend/src/database/queries.js`
2. Criar rota em `backend/src/routes/novo.js`
3. Importar em `backend/src/server.js`
4. Criar método em `src/api/client.js`
5. Usar em `src/app/data/backendStore.ts`

### 🐛 Troubleshooting

**Backend não conecta:**
```bash
# Verificar se porta 3000 está livre
lsof -i :3000

# Reiniciar banco de dados
rm data/inspec360.db
npm run init-db
```

**Frontend não encontra API:**
- Verificar `.env.local` com `VITE_API_URL=http://localhost:3000/api`
- Verificar se backend está rodando em `http://localhost:3000`

**Imagens não são salvas:**
- Verificar se pasta `public/images/inspections/` existe
- Verificar permissões de escrita

### 📋 Bancos de Dados

SQLite com 10 tabelas:
- `users` - Usuários do sistema
- `structures` - Estruturas/torres
- `componentRules` - Componentes
- `serviceOrders` - Ordens de serviço
- `inspectionRecords` - Inspeções
- `componentInspections` - Componentes inspecionados
- `anomalies` - Anomalias
- `inspectionPhotos` - Fotos
- `pauseHistory` - Histórico de pausas
- `executionRecords` - Execuções

### 🚀 Deploy para Produção

**Backend:**
```bash
# Usar NODE_ENV=production
NODE_ENV=production node src/server.js

# Usar banco remoto (PostgreSQL, MySQL, etc)
# Atualizar connection.js
```

**Frontend:**
```bash
npm run build
# Fazer deploy do diretório dist/
```

### 📞 Suporte

Para mais informações, consulte:
- Backend: [backend/README.md](backend/README.md)
- Database: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

### ✅ Checklist de Instalação

- [ ] Node.js instalado
- [ ] Dependências instaladas (npm install)
- [ ] Backend inicializado (npm run init-db)
- [ ] .env.local criado
- [ ] Backend rodando em :3000
- [ ] Frontend rodando em :5173
- [ ] Pasta public/images/inspections criada
- [ ] Login funcionando
- [ ] Sincronização de dados confirmada

---

**Versão:** 2.2.0  
**Última atualização:** 06/05/2026
