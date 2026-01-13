# 🧹 Limpeza de Arquivos - Hathor Imports

## Arquivos Identificados para Remoção

### ❌ Arquivos Obsoletos/Não Utilizados

#### 1. `backend/importFromHtml.js`
**Motivo:** Arquivo antigo que não é mais usado
- Usa modelo de IA local (TinyLlama) que foi substituído
- O projeto agora usa Hugging Face API (mais eficiente)
- Não é importado em nenhum lugar
- **Ação:** REMOVER

#### 2. `backend/yupoo-browser.js`
**Motivo:** Implementação com Puppeteer não utilizada
- Usa Puppeteer para scraping (mais pesado)
- O projeto usa `yupoo.js` com Axios/Cheerio (mais leve)
- Não é importado no `server.js`
- **Ação:** REMOVER (ou mover para `/archive` se quiser manter)

#### 3. `frontend/store-old.html`
**Motivo:** Backup da versão antiga
- É o backup que criamos da versão anterior
- Já temos a nova versão funcionando
- **Ação:** REMOVER (já fizemos o backup)

#### 4. `frontend/js/store-page.js`
**Motivo:** Substituído por `store-improved.js`
- Era usado pela `store.html` antiga
- Agora usamos `store-improved.js`
- Tem o bug que corrigimos na Fase 1
- **Ação:** REMOVER

#### 5. `frontend/js/store-improved.js`
**Motivo:** Nome confuso agora que é o principal
- É o arquivo principal da loja agora
- Nome "improved" não faz mais sentido
- **Ação:** RENOMEAR para `store-catalog.js` ou manter

### ✅ Arquivos que DEVEM Permanecer

```
✅ backend/yupoo.js              # Scraper principal em uso
✅ backend/server.js             # Servidor principal
✅ backend/firebase-admin.js     # Configuração Firebase
✅ backend/routes/auth.js        # Rotas de autenticação
✅ frontend/js/store.js          # Funções do Firestore
✅ frontend/js/notifications.js  # Sistema de notificações
✅ frontend/store.html           # Página principal da loja
✅ Todos os outros arquivos      # Em uso ativo
```

## 📋 Plano de Limpeza

### Opção 1: Remoção Completa (Recomendado)
```bash
# Backend
rm backend/importFromHtml.js
rm backend/yupoo-browser.js

# Frontend
rm frontend/store-old.html
rm frontend/js/store-page.js
```

### Opção 2: Arquivar (Manter histórico)
```bash
# Criar pasta de arquivo
mkdir -p archive/backend
mkdir -p archive/frontend/js

# Mover arquivos
mv backend/importFromHtml.js archive/backend/
mv backend/yupoo-browser.js archive/backend/
mv frontend/store-old.html archive/frontend/
mv frontend/js/store-page.js archive/frontend/js/
```

### Opção 3: Renomear store-improved.js
```bash
# Se quiser nome mais descritivo
mv frontend/js/store-improved.js frontend/js/store-catalog.js

# Atualizar import em store.html
# Trocar: <script type="module" src="./js/store-improved.js"></script>
# Para:   <script type="module" src="./js/store-catalog.js"></script>
```

## 🎯 Recomendação Final

**Remover completamente:**
1. ✅ `backend/importFromHtml.js` - Não usado
2. ✅ `backend/yupoo-browser.js` - Não usado
3. ✅ `frontend/store-old.html` - Backup desnecessário
4. ✅ `frontend/js/store-page.js` - Substituído

**Manter:**
- `frontend/js/store-improved.js` - É o arquivo principal agora

## 📊 Impacto da Limpeza

### Antes:
- **Total de arquivos:** 35+
- **Arquivos obsoletos:** 4
- **Confusão:** Múltiplas versões

### Depois:
- **Total de arquivos:** 31
- **Arquivos obsoletos:** 0
- **Clareza:** Apenas código em uso

## ⚠️ Verificação Antes de Remover

Antes de executar a remoção, verifique:
- [ ] Nenhum arquivo importa `importFromHtml.js`
- [ ] Nenhum arquivo importa `yupoo-browser.js`
- [ ] `store.html` não referencia `store-page.js`
- [ ] `store.html` usa `store-improved.js`
- [ ] Backup do projeto foi feito (Git)

## 🚀 Executar Limpeza

Após confirmar, execute:
```bash
cd /Users/kauanbertolo/Documents/pessoal_project/hathorimports

# Remover arquivos obsoletos
rm backend/importFromHtml.js
rm backend/yupoo-browser.js
rm frontend/store-old.html
rm frontend/js/store-page.js

# Confirmar remoção
echo "✅ Limpeza concluída!"
```

---

**Data:** 13/01/2026  
**Versão:** 2.0.0