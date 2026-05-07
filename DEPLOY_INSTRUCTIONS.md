# 🚀 Instruções de Deploy - Supabase

## ⚠️ IMPORTANTE: Este projeto usa Supabase, NÃO Firebase!

### Configuração Inicial

1. **Criar arquivo `.env.local`** na raiz do projeto (baseado em `.env.example`):
```bash
VITE_SUPABASE_URL=https://ymjthrmykjimhwpojgxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltanRocm15a2ppbWh3cG9qZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQyOTcsImV4cCI6MjA5Mzc0MDI5N30.Yl78kkD40bu8QG4j-PGjpXLjJy3wKv7j-wdPY1b-yRg
```

2. **Instalar dependências**:
```bash
npm install
```

### Desenvolvimento Local

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### Build para Produção

```bash
npm run build
```

Isso gera os arquivos otimizados em `./dist/`

### Deploy no Supabase

O deployment é feito automaticamente via GitHub Actions ou pode ser feito manualmente:

1. **Build local**:
```bash
npm run build
```

2. **Deploy manual** (se usar outro provedor como Vercel ou Netlify):
```bash
# Para Vercel
vercel deploy --prod

# Para Netlify
netlify deploy --prod
```

3. **Deploy no Supabase Hosting** (se configurado):
```bash
supabase functions deploy
```

### Variáveis de Ambiente

- `.env.local` - **NÃO commitar** (dados sensíveis locais)
- `.env.example` - **Commitar** (exemplo de configuração)
- `.env.production` - **NÃO commitar** (configuração de produção)

### Arquivos do Git

Arquivos que **NUNCA** devem ser commitados:
- `.firebaserc` ❌ (Este projeto não usa Firebase!)
- `firebase.json` ❌ (Este projeto não usa Firebase!)
- `.env.local` ❌ (Contém dados sensíveis)
- `.env.*.local` ❌ (Contém dados sensíveis)
- `node_modules/` ❌
- `dist/` ❌

Esses arquivos estão no `.gitignore` para proteção.

### Checklist Antes de Fazer Deploy

- [ ] Código foi testado localmente (`npm run dev`)
- [ ] Build é bem-sucedido (`npm run build`)
- [ ] Nenhum erro no console durante o build
- [ ] Variáveis de ambiente estão corretas
- [ ] Nenhum arquivo `.firebaserc` ou `firebase.json` será incluído
- [ ] Commit foi feito com mensagem clara

### Troubleshooting

**Erro: "Cannot find module '@supabase/supabase-js'"**
- Execute: `npm install`

**Erro: "VITE_SUPABASE_URL is undefined"**
- Crie o arquivo `.env.local` com as variáveis de ambiente corretas

**Build falha com erros de Firebase**
- O projeto usa Supabase, não Firebase
- Remova qualquer import de Firebase
- Use as funções em `src/services/supabase.js` e `src/services/supabaseAuth.js`

### Contato

Para dúvidas sobre o deploy, consulte:
- Documentação do Supabase: https://supabase.com/docs
- Variáveis de ambiente em: `.env.example`
