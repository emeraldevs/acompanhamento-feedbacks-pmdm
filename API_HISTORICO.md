# API de Histórico de Feedbacks - Documentação

## 📍 Localização do Endpoint

```
server/api/historico.get.ts
```

**Rota HTTP**: `GET /api/historico`

---

## 🔧 Como o D1 é Acessado

O endpoint acessa o Cloudflare D1 através de:

```typescript
const db = event.context.cloudflare?.env?.DB
```

Isso funciona porque:
1. **Nitro** é o servidor HTTP nativo do Nuxt 3
2. **Cloudflare** passa os bindings através de `event.context.cloudflare.env`
3. **DB** é o nome do binding configurado em `wrangler.toml` (sob `[[d1_databases]]`)

---

## 📋 Como Funciona o Endpoint

1. **Recebe**: Uma requisição GET em `/api/historico`
2. **Acessa**: O binding `DB` do Cloudflare D1
3. **Executa**: A query SQL preparada:
   ```sql
   SELECT id, tipo, regiao, unidade, nota, descricao, nome, telefone
   FROM feedbacks
   ORDER BY id DESC
   LIMIT 1000
   ```
4. **Retorna**: Array JSON com todas as colunas da tabela:
   ```json
   [
     {
       "id": 39,
       "tipo": "reclamacao",
       "regiao": "SEDE",
       "unidade": "CENTRO MUNICIPAL DE SAÚDE",
       "nota": 1,
       "descricao": "Meu médico estava marcado para determinado horário",
       "nome": null,
       "telefone": null
     }
   ]
   ```

Na página `/historico`, a lista é consultada novamente automaticamente a cada 15
segundos. A resposta da API não é armazenada em cache.

---

## 🧪 Como Testar Localmente

### Opção 1: Com Wrangler CLI (Recomendado)

```bash
# 1. Instale o Wrangler globalmente
npm install -g @cloudflare/wrangler

# 2. Configure o wrangler.toml (copie de wrangler.toml.example)
cp wrangler.toml.example wrangler.toml
# Edite o arquivo com os dados reais do seu D1

# 3. Inicie o servidor de desenvolvimento
wrangler pages dev -- npm run dev

# 4. Teste a API
curl http://localhost:3000/api/historico
```

### Opção 2: Sem Wrangler (Desenvolvimento local simples)

```bash
# 1. Inicie o servidor Nuxt normalmente
npm run dev

# 2. Acesse via navegador
http://localhost:3000/api/historico

# 3. Ou use curl
curl http://localhost:3000/api/historico
```

**Nota**: Sem o Wrangler, o binding D1 pode não estar disponível localmente. Para testar completamente, use a Opção 1.

### Opção 3: Com Curl/Postman (Pré-produção)

```bash
# GET request
curl -X GET https://seu-dominio/api/historico

# Ou com Pretty Print
curl -X GET https://seu-dominio/api/historico | json_pp
```

---

## 🛠️ Configuração Necessária

### Passo 1: Criar/Editar `wrangler.toml`

```toml
[[d1_databases]]
binding = "DB"
database_name = "acompanhamento_descricoes"
database_id = "seu-database-id-aqui"
```

### Passo 2: Verificar que a Tabela Existe

```sql
-- Execute no D1 dashboard ou via CLI
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  regiao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  nota INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  nome TEXT,
  telefone TEXT
);
```

### Passo 3: Inserir Dados de Teste

```sql
INSERT INTO feedbacks (tipo, regiao, unidade, nota, descricao, nome, telefone) VALUES
('informacao', 'SEDE', 'CENTRO MUNICIPAL DE SAÚDE', 10, 'Primeiro feedback', NULL, NULL),
('reclamacao', 'SEDE', 'CENTRO MUNICIPAL DE SAÚDE', 6, 'Segundo feedback', NULL, NULL);
```

---

## 🌐 URLs para Testar

| Ambiente | URL |
|----------|-----|
| Local | `http://localhost:3000/api/historico` |
| Staging | `https://staging-seu-dominio/api/historico` |
| Produção | `https://seu-dominio/api/historico` |

---

## ✅ Resposta Esperada

### Sucesso (200 OK)

```json
[
  {
    "id": 2,
    "tipo": "reclamacao",
    "regiao": "SEDE",
    "unidade": "CENTRO MUNICIPAL DE SAÚDE",
    "nota": 6,
    "descricao": "Segundo feedback",
    "nome": null,
    "telefone": null
  },
  {
    "id": 1,
    "tipo": "informacao",
    "regiao": "SEDE",
    "unidade": "CENTRO MUNICIPAL DE SAÚDE",
    "nota": 10,
    "descricao": "Primeiro feedback",
    "nome": null,
    "telefone": null
  }
]
```

### Erro (500 Internal Server Error)

```json
{
  "statusCode": 500,
  "statusMessage": "Internal Server Error",
  "message": "Falha ao buscar histórico de feedbacks"
}
```

---

## 🚀 Deploy no Cloudflare Pages

```bash
# 1. Construa a aplicação
npm run build

# 2. Deploy com Wrangler
wrangler pages deploy dist

# 3. Ou conecte seu repositório ao Cloudflare Pages via GitHub
# E configure as variáveis de ambiente
```

---

## 📝 Tipo de Dados

```typescript
interface Feedback {
  id: number
  tipo: string
  regiao: string
  unidade: string
  nota: number
  descricao: string
  nome: string | null
  telefone: string | null
}
```

---

## ⚠️ Tratamento de Erros

- **Database binding not found**: O wrangler.toml não está configurado corretamente
- **Query error**: Verifique se a tabela `feedbacks` existe no D1
- **Internal Server Error**: Erro genérico que não expõe detalhes internos

---

## 🔄 Próximos Passos

Após verificar que a API está funcionando:

1. ✅ Testar o endpoint localmente
2. ✅ Fazer deploy no Cloudflare Pages
3. ✅ Página `/historico` consome a API e exibe todas as colunas
4. ✅ A página pesquisa os valores de todas as colunas e atualiza automaticamente a cada 15 segundos
