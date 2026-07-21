# 📋 PASSO-A-PASSO: Criar PostgreSQL no Render

## 🚀 Só você precisa fazer isso (5 minutos)

### **Passo 1: Entrar no Render Dashboard**
1. Vá para https://dashboard.render.com/
2. Faça login (use a mesma conta do serviço INSPEC360)

### **Passo 2: Criar um novo PostgreSQL**
1. Clique em **"New +"** no topo esquerdo
2. Selecione **"PostgreSQL"** (não é Web Service, é a opção abaixo)

### **Passo 3: Configurar PostgreSQL**
Preencha assim:
- **Name**: `inspec360-db` (qualquer nome, pode ser seu gosto)
- **Database**: `inspec360` (deixe ou mude se quiser)
- **User**: `postgres` (deixe padrão)
- **Region**: Mesma do seu serviço INSPEC360 anterior (ex: `São Paulo`)
- **PostgreSQL Version**: Deixe a default (versão mais recente)

**Clique em "Create Database"** ⏳ (leva 1-2 minutos)

### **Passo 4: Copiar Connection String**
Quando estiver criado, a página vai mostrar uma section chamada **"Connections"**

Procure por:
- **Internal Database URL** (para teste local)
- **External Database URL** (para Render - use ESSA)

**Copie o link tipo:** 
```
postgresql://user123:senha456@dpg-abc123def.render.internal:5432/inspec360?schema=public
```

⚠️ Ou pode vir assim:
```
postgresql://user123:senha456@dpg-abc123def.postgres.render.com:5432/inspec360
```

### **Passo 5: Me passar a connection string**
Depois de copiar, volta aqui e me passa a URL completa.

---

## ✅ Pronto!

Quando você me der a connection string, eu faço o resto:
1. ✅ Atualizar `render.yaml` com a variável `DATABASE_URL`
2. ✅ Fazer commit e push
3. ✅ Render auto-deploy e cria as tabelas
4. ✅ Sistema funcionando com dados persistentes

---

## 🆘 Dúvidas comuns

**P: Vou perder meu serviço Web Service que já está lá?**  
R: Não! PostgreSQL é um serviço separado. Seu Web Service continua como está.

**P: Vai cobrar?**  
R: Não! PostgreSQL no Render é gratuito no plano Free até certo limite (mais que suficiente).

**P: Posso ver os dados depois?**  
R: Sim! Render oferece uma interface web direto na dashboard para ver dados.

---

**Cole a connection string aqui quando estiver pronto! ⬇️**
