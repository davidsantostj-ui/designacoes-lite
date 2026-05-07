# 🚨 IMPORTANTE - LEIA ANTES DE FAZER QUALQUER COISA

## Este projeto usa **SUPABASE**, NÃO Firebase!

### ⚠️ Configuração Crítica

Este workspace está configurado EXCLUSIVAMENTE para trabalhar com **Supabase**. 

**NÃO execute:**
- `firebase deploy`
- `npx firebase-tools deploy`
- Qualquer comando que envolva Firebase

**ISSO CORROMPARÁ O PROJETO DE PRODUÇÃO!**

---

## 🔧 Configuração Correta

### Variáveis de Ambiente

Crie um arquivo `.env.local` (não commitar) com:

```env
VITE_SUPABASE_URL=https://ymjthrmykjimhwpojgxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltanRocm15a2ppbWh3cG9qZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQyOTcsImV4cCI6MjA5Mzc0MDI5N30.Yl78kkD40bu8QG4j-PGjpXLjJy3wKv7j-wdPY1b-yRg
```

### Desenvolvimento Local

```bash
npm install
npm run dev
```

### Build para Produção

```bash
npm run build
```

### Deploy

O projeto está configurado para Supabase. O deploy é feito através de:
- **Vercel** (recomendado)
- **Netlify**
- **GitHub Pages**
- Outro provedor de hosting

**Não use Firebase Hosting para este projeto!**

---

## 📋 Arquivos Críticos

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `.env.local` | ❌ Não commitar | Variáveis de ambiente locais |
| `.firebaserc` | ❌ NÃO use | Configuração Firebase (ignorar) |
| `firebase.json` | ❌ NÃO use | Configuração Firebase (ignorar) |
| `.gitignore` | ✅ Commitar | Exclui Firebase e env files |
| `.env.example` | ✅ Commitar | Template de variáveis |
| `.workspace-config.json` | ✅ Commitar | Configuração do workspace |
| `.supabaserc` | ✅ Commitar | Configuração Supabase |

---

## 🚀 Primeiro Deploy

Se precisar fazer o primeiro deploy em produção:

1. **Build local:**
   ```bash
   npm run build
   ```

2. **Configure o provedor de hosting** (Vercel, Netlify, etc.)

3. **Deploy via CLI do provedor:**
   ```bash
   # Vercel
   vercel deploy --prod
   
   # Netlify
   netlify deploy --prod
   ```

---

## ❓ Dúvidas Frequentes

**P: Posso usar Firebase?**
R: Não. Este projeto usa Supabase exclusivamente.

**P: Como faço deploy?**
R: Execute `npm run build` e use o provedor de hosting configurado (Vercel, Netlify, etc).

**P: Esqueci e executei `firebase deploy`?**
R: Desfaça imediatamente! Reverta a versão no provedor original e restaure o projeto.

**P: Posso deletar `.firebaserc` e `firebase.json`?**
R: Sim! Eles estão no `.gitignore` e não devem ser usados.

---

## 📞 Suporte

Para mais informações, consulte:
- `DEPLOY_INSTRUCTIONS.md` - Guia completo de deploy
- `.workspace-config.json` - Configuração do workspace
- `.env.example` - Template de variáveis
