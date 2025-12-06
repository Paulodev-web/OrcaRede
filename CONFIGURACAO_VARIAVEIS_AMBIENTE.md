# 🔧 Configuração de Variáveis de Ambiente

Este guia explica como configurar as variáveis de ambiente necessárias para o projeto OrcaRede.

## 📋 Variáveis Necessárias

O projeto requer as seguintes variáveis de ambiente:

- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave pública (anon key) do Supabase

## 🚀 Passo a Passo

### 1. Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env` (sem extensão).

**Windows:**
```powershell
# No PowerShell, na raiz do projeto
New-Item -Path .env -ItemType File
```

**Linux/Mac:**
```bash
touch .env
```

### 2. Obter as credenciais do Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto (ou crie um novo se necessário)
3. Vá em **Settings** → **API**
4. Copie as seguintes informações:
   - **Project URL** → será usado como `VITE_SUPABASE_URL`
   - **anon public** key → será usado como `VITE_SUPABASE_ANON_KEY`

### 3. Configurar o arquivo `.env`

Abra o arquivo `.env` e adicione as variáveis com seus valores:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Exemplo real:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo
```

### 4. Verificar a configuração

1. Reinicie o servidor de desenvolvimento (se estiver rodando):
   ```bash
   # Pare o servidor (Ctrl+C) e inicie novamente
   npm run dev
   ```

2. Acesse a aplicação no navegador
3. Se tudo estiver correto, a aplicação deve carregar sem erros

## ⚠️ Importante

- **Nunca commite o arquivo `.env`** - Ele já está no `.gitignore`
- **Use `.env.example` como referência** - Este arquivo pode ser commitado (sem valores reais)
- **Variáveis devem começar com `VITE_`** - Isso é necessário para o Vite expor as variáveis no frontend
- **Reinicie o servidor** após criar ou modificar o `.env`

## 🐛 Troubleshooting

### Erro: "Missing environment variable: VITE_SUPABASE_URL"

**Soluções:**
- Verifique se o arquivo `.env` está na raiz do projeto (mesmo nível que `package.json`)
- Confirme que as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento após criar/modificar o `.env`
- Verifique se não há espaços extras ou aspas desnecessárias nos valores

### Erro de conexão com Supabase

**Soluções:**
- Verifique se a URL e a chave estão corretas
- Confirme que o projeto Supabase está ativo
- Verifique se há restrições de CORS ou firewall bloqueando a conexão

### Variáveis não são reconhecidas

**Soluções:**
- Certifique-se de que o servidor foi reiniciado após criar o `.env`
- No Vite, variáveis devem começar com `VITE_` para serem expostas ao frontend
- Verifique se não há erros de sintaxe no arquivo `.env` (sem espaços ao redor do `=`)

## 📚 Recursos Adicionais

- [Documentação do Vite - Variáveis de Ambiente](https://vitejs.dev/guide/env-and-mode.html)
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Troca de Banco de Dados](./GUIA_TROCA_BANCO_DADOS.md)

