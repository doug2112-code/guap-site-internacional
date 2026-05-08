3# Deploy GUAP

## Plataforma recomendada

Vercel ou Netlify funcionam bem para este projeto Vite/React. A configuração `vercel.json` já inclui headers básicos, cache de assets e fallback para `index.html`.

## Build

```bash
npm install
npm run lint
npm run build
```

Diretório de saída:

```bash
dist
```

## Variáveis

O site não precisa de variáveis de ambiente hoje.

## Antes de publicar

- Confirmar domínio final e atualizar `index.html`, `public/robots.txt` e `public/sitemap.xml` se não for `https://guapcompany.com.br/`.
- Conferir emails, telefone, CNPJ e Instagram.
- Testar mobile real, desktop, troca de idioma, CTAs e modal de soluções.
- Rodar `npm run lint` e `npm run build`.

## Pós-deploy

- Validar SSL e redirecionamento entre `www` e domínio raiz.
- Conferir Lighthouse mobile.
- Enviar `sitemap.xml` no Google Search Console.
- Instalar analytics/pixels apenas quando a estratégia de tracking estiver definida.
