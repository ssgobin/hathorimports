# 🔐 Guia de Importação de Produtos do Yupoo

## 📋 Visão Geral

Para importar produtos do Yupoo para o Hathor Imports, você precisa estar autenticado como **administrador** no sistema.

## 🔑 Como Obter o Token de Autenticação

### Método 1: Fazer Login como Admin (Recomendado)

1. **Acesse a página de login:**

   ```
   http://localhost:4000/login.html
   ```

2. **Faça login com uma conta de administrador**

   - Email: seu_email_admin@exemplo.com
   - Senha: sua_senha

3. **O token será armazenado automaticamente** no localStorage do navegador

4. **Acesse a página de admin:**

   ```
   http://localhost:4000/admin.html
   ```

5. **Use a funcionalidade de importação do Yupoo**

### Método 2: Obter Token Manualmente (Desenvolvimento)

Se você precisa do token para testes ou desenvolvimento:

1. **Abra o DevTools (F12)**

2. **Vá para a aba Console**

3. **Digite e execute:**

   ```javascript
   localStorage.getItem("authToken");
   ```

4. **Copie o token retornado** (começa com "eyJ...")

5. **Use o token nas requisições:**
   ```javascript
   fetch("http://localhost:4000/api/yupoo/import", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       Authorization: `Bearer SEU_TOKEN_AQUI`,
     },
     body: JSON.stringify({
       albumUrl: "URL_DO_ALBUM_YUPOO",
     }),
   });
   ```

## 👤 Como Criar um Usuário Administrador

Se você ainda não tem um usuário admin:

### Opção 1: Via Interface (Recomendado)

1. **Registre-se normalmente:**

   ```
   http://localhost:4000/register.html
   ```

2. **Acesse o Firebase Console:**

   - Vá para: https://console.firebase.google.com
   - Selecione seu projeto: `hathorimports-b1155`
   - Vá em **Firestore Database**

3. **Encontre seu usuário:**

   - Coleção: `users`
   - Documento: seu_uid

4. **Adicione o campo `role`:**

   - Campo: `role`
   - Valor: `admin`
   - Tipo: `string`

5. **Salve as alterações**

6. **Faça logout e login novamente**

### Opção 2: Via Firebase Console Direto

1. **Acesse Firebase Console:**

   ```
   https://console.firebase.google.com/project/hathorimports-b1155/firestore
   ```

2. **Vá em Firestore Database > users**

3. **Clique em "Add document":**

   ```
   Document ID: (auto-generate ou use um UID específico)

   Campos:
   - email: "admin@hathorimports.com"
   - name: "Administrador"
   - role: "admin"
   - createdAt: (timestamp atual)
   ```

4. **Crie o usuário no Authentication:**
   - Vá em **Authentication > Users**
   - Clique em "Add user"
   - Email: admin@hathorimports.com
   - Senha: (escolha uma senha segura)

## 🛠️ Como Usar a Importação do Yupoo

### Passo a Passo:

1. **Faça login como admin**

2. **Acesse a página de admin:**

   ```
   http://localhost:4000/admin.html
   ```

3. **Vá na aba "Importar do Yupoo"**

4. **Cole a URL do álbum Yupoo:**

   ```
   Exemplo: https://example.x.yupoo.com/albums/123456
   ```

5. **Clique em "Importar Álbum"**

6. **Aguarde o processamento:**

   - O sistema vai buscar as imagens
   - Analisar os produtos com IA
   - Calcular preços
   - Salvar no Firebase

7. **Verifique os produtos importados:**
   - Vá na aba "Produtos"
   - Os novos produtos aparecerão na lista

## ⚙️ Configuração de Preços

Os preços são calculados automaticamente baseados nas variáveis do `.env`:

```env
# Cotação Yuan para Real
PRICE_COTACAO=0.75

# Margem de lucro (1.3 = 30%)
PRICE_MARGEM=1.3

# Custo de frete fixo em BRL
PRICE_FRETE=80

# Custo de declaração em BRL
PRICE_DECLARACAO=100
```

**Fórmula:**

```
Preço Final = (Preço Yuan × Cotação + Frete + Declaração) × Margem
```

## 🔍 Troubleshooting

### Erro: "Token de autenticação não fornecido"

**Causa:** Você não está logado ou o token expirou.

**Solução:**

1. Faça logout
2. Faça login novamente
3. Tente importar novamente

### Erro: "Usuário não autorizado"

**Causa:** Seu usuário não tem permissão de admin.

**Solução:**

1. Verifique no Firebase se o campo `role` está como `admin`
2. Faça logout e login novamente

### Erro: "Erro ao buscar álbum do Yupoo"

**Causa:** URL inválida ou álbum não existe.

**Solução:**

1. Verifique se a URL está correta
2. Teste a URL no navegador
3. Certifique-se que o álbum é público

### Erro: "Erro na API de IA"

**Causa:** Problema com a API do Hugging Face.

**Solução:**

1. Verifique se `HF_API_KEY` está configurada no `.env`
2. Verifique se a chave é válida em: https://huggingface.co/settings/tokens
3. Verifique se você tem créditos disponíveis

## 📝 Notas Importantes

1. **Apenas administradores** podem importar produtos
2. **O processo pode demorar** alguns minutos dependendo do número de imagens
3. **As imagens são hospedadas no Yupoo**, não são baixadas para o servidor
4. **A IA analisa automaticamente** título, descrição, marca e categoria
5. **Você pode editar** os produtos após a importação

## 🔗 Links Úteis

- Firebase Console: https://console.firebase.google.com/project/hathorimports-b1155
- Hugging Face Tokens: https://huggingface.co/settings/tokens
- Documentação Yupoo: (se disponível)

## 💡 Dicas

- **Importe em lotes pequenos** primeiro para testar
- **Revise os produtos** após importação para garantir qualidade
- **Ajuste preços manualmente** se necessário
- **Adicione descrições detalhadas** para melhorar SEO
- **Use imagens de alta qualidade** do Yupoo

---

**Criado por Bob** 🤖
