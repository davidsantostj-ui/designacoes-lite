# EloJW APP

Este repositório contém o app Elo JW (Vite + React + TypeScript).

## Como executar localmente

Instale dependências e execute em modo dev:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Build

Gerar build de produção:

```bash
npm run build
```

A saída ficará em `dist/`.

## Publicar gratuitamente (opções)

Opção recomendada: Vercel (deploy rápido para projetos Vite/React)

1. Criar conta grátis em https://vercel.com
2. Instalar CLI e logar:

```bash
npm i -g vercel
vercel login
```

3. Fazer deploy:

```bash
vercel --prod
# ou
vercel --confirm
```

Observação: o Vercel detecta projetos Vite e faz build automaticamente.


Opção: Netlify

1. Criar conta grátis em https://app.netlify.com/
2. Instalar Netlify CLI e logar:

```bash
npm i -g netlify-cli
netlify login
```

3. Fazer build e deploy (dir = `dist`):

```bash
npm run build
netlify deploy --prod --dir=dist
```

Opção: GitHub + GitHub Pages (requer push para repositório GitHub)

1. Criar repositório no GitHub (público)
2. Fazer push do seu repositório local ao remoto:

```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git branch -M main
git push -u origin main
```

3. No repositório GitHub, em *Settings → Pages*, escolha o branch `gh-pages` ou configure uma action para publicar `dist/` ao `gh-pages`.

Uma forma simples (usando `gh-pages`):

```bash
npm install --save-dev gh-pages
# adicionar script no package.json:
# "deploy": "npm run build && gh-pages -d dist"
npm run deploy
```


## Observações importantes

- Para publicar (Vercel/Netlify/GitHub) você precisa autenticar com sua conta. Não posso criar repositório remoto sem suas credenciais.
- Posso ajudar a configurar o deploy passo a passo após você me autorizar a usar o `gh`/`vercel`/`netlify` CLI localmente (você terá que executar login interativo).

## Logs de envios de ajuda

O app grava envios do botão "Preciso de ajuda" em `localStorage` na chave `elojw_help_logs`.

---

Se quiser, eu configuro um deploy automático via Vercel (preciso apenas que você faça `vercel login` no terminal). 
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12StYrbKrDm2g0b8P77U2sx4WgkcUIUGG

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
