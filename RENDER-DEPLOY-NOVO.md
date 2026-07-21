# 🆘 Reconfigurando Deploy no Render

## ❌ Problema

O Render não estava reconhecendo o `render.yaml` corretamente e estava tentando usar um build command genérico que falhava.

## ✅ Solução

Simplificamos a configuração para um **único serviço que serve frontend + backend**.

---

## 🚀 Passos para Deploy (NOVO)

### 1️⃣ Remover Deployment Antigo

1. Acesse: https://dashboard.render.com
2. Vá até seu Blueprint antigo (INSPEC360-v2.1)
3. Clique em **Settings** → **Danger Zone**
4. Clique em **Delete Service** (ou **Delete Blueprint**)

### 2️⃣ Criar Novo Web Service

1. No dashboard, clique **+ New**
2. Selecione **Web Service**
3. Conecte seu GitHub repository: `INSPEC360-v2.1`
4. Preencha com:
   - **Name**: `inspec360`
   - **Runtime**: Node
   - **Build Command**: `npm install -g pnpm && pnpm install && pnpm build && cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

### 3️⃣ Configurar Variáveis de Ambiente

Clique em **Environment** e adicione:

```
NODE_ENV=production
PORT=3000
```

### 4️⃣ Deploy

Clique em **Deploy** e aguarde (5-15 minutos)

---

## 📊 Como Funciona Agora

```
Render Web Service (porta 3000)
├─ Frontend (React + Vite)
│  └─ Servido em: /
│  └─ Build: pnpm build → dist/
└─ Backend (Node + Express)
   ├─ Rotas API: /api/*
   └─ Serve: dist/ como static files
```

---

## 🔍 Verificar se Funcionou

Após o deploy ficar verde (✅ Live):

1. Abra: https://inspec360.onrender.com
2. Você deve ver o login da aplicação
3. Backend estará em: https://inspec360.onrender.com/api

---

## 📝 Arquivos Atualizados

- ✅ `render.yaml` - Simplificado para um único serviço
- ✅ `package.json` - Adicionado `packageManager: pnpm` e `engines`
- ✅ `backend/package.json` - Adicionado `engines`
- ✅ `Procfile` - Configuração para Procfile-based deployments
- ✅ `render-build.sh` - Script de build melhorado

---

## 🆘 Se Ainda Falhar

### ❌ "npm install -g pnpm" não funciona

Tente este build command no Render:
```
npm install --legacy-peer-deps && npm run build && cd backend && npm install
```

### ❌ "Cannot find module" no backend

Execute no console do Render (SSH):
```bash
cd backend && npm install
```

### ❌ Porta já está em uso

Certifique-se que `PORT=3000` está definido nas variáveis de ambiente.

---

## 💡 Dicas

1. **Logs**: Sempre veja os logs do deploy (`Logs` tab)
2. **SSH**: Use SSH para debugar (`Connect` button)
3. **Restart**: Use `Restart Service` se precisar reiniciar
4. **Free Tier**: Serviço fica offline após 15 min de inatividade

---

## 🔄 Fazer Atualizações Depois

Sempre que fizer mudanças no código:

```bash
git add .
git commit -m "Sua mensagem"
git push v2.1 main
```

Render detectará automaticamente e fará novo deploy! 🎉
