# AGENTS.md

Instrucoes permanentes para agentes de desenvolvimento trabalhando neste repositorio.

## 1. Objetivo do projeto

Este repositorio hospeda o site institucional da Guap, uma experiencia web voltada a apresentar a empresa, seus mercados, solucoes, provas de resultado e acesso ao dashboard. O foco do projeto e comunicar uma marca premium, clara e orientada a conversao, com boa performance visual, responsividade e consistencia de UI/UX.

O escopo deste arquivo e o site principal localizado na raiz do repositorio.

## 2. Stack usada no projeto

- React 19
- Vite 8
- JavaScript com ES Modules
- JSX
- CSS puro para estilos globais, responsividade e componentes
- ESLint 10 com regras recomendadas de JavaScript, React Hooks e React Refresh
- Assets estaticos em `public/` e `src/assets/`

Arquivos principais da aplicacao raiz:

- `src/main.jsx`: entrada React.
- `src/App.jsx`: estrutura principal da homepage e interacoes.
- `src/App.css`: estilos da interface principal.
- `src/index.css`: tokens visuais, reset e estilos globais.
- `src/content/siteContent.js`: textos, listas, metricas, solucoes e dados exibidos no site.

## 3. Como rodar o projeto

Na raiz do repositorio:

```bash
npm install
npm run dev
```

O Vite exibira a URL local no terminal, normalmente `http://localhost:5173`.

## 4. Como rodar build

Na raiz do repositorio:

```bash
npm run build
```

Regra obrigatoria: sempre rodar o build aplicavel antes de encerrar uma tarefa. Se o build falhar, corrigir os erros encontrados e rodar novamente ate estabilizar.

## 5. Como testar

Este projeto ainda nao possui script automatizado de testes unitarios ou end-to-end em `package.json`.

Validacoes obrigatorias disponiveis hoje:

```bash
npm run lint
npm run build
```

Alem dos comandos, revisar manualmente a experiencia em navegador quando houver mudancas visuais, de conteudo, layout, interacao ou responsividade.

## 6. Convencoes de codigo

- Seguir o estilo existente do repositorio: componentes funcionais React, hooks nativos e CSS puro.
- Manter imports com caminhos relativos claros e extensoes consistentes com o padrao atual.
- Preservar a separacao entre conteudo (`src/content/siteContent.js`), estrutura (`src/App.jsx`) e estilos (`src/App.css` e `src/index.css`).
- Evitar duplicacao de estruturas, dados, estilos e logica. Reutilizar arrays de conteudo e componentes existentes quando fizer sentido.
- Nao introduzir novas bibliotecas sem necessidade real e sem verificar se o projeto ja resolve o problema com a stack atual.
- Manter nomes descritivos para estados, funcoes, listas e classes CSS.
- Evitar comentarios obvios. Comentar apenas trechos cuja intencao nao seja imediatamente clara.
- Manter acessibilidade basica: botoes com `type`, elementos decorativos com `aria-hidden`, textos legiveis e foco em interacoes previsiveis.
- Manter a UI responsiva a partir de 320px de largura e revisar que textos, botoes, cards, modais e secoes nao se sobreponham.
- Preservar o tom visual premium, escuro, espacial e orientado a conversao ja presente na interface.

## 7. Fluxo obrigatorio de trabalho

1. Analisar o projeto antes de alterar qualquer arquivo.
2. Ler `package.json`, estrutura de pastas e arquivos diretamente relacionados a tarefa.
3. Identificar os arquivos do site raiz diretamente afetados pela mudanca.
4. Fazer alteracoes pequenas e coesas, respeitando os padroes existentes.
5. Revisar imports quebrados, nomes incorretos, dados duplicados e estilos conflitantes.
6. Revisar UI/UX quando a mudanca afetar visual, texto, interacao ou fluxo.
7. Revisar responsividade em mobile e desktop para mudancas visuais.
8. Rodar `npm run lint` quando houver alteracao em JavaScript, JSX ou estrutura de projeto.
9. Rodar `npm run build` sempre antes de encerrar.
10. Corrigir erros encontrados e repetir validacoes ate o projeto estabilizar.

Nao encerrar uma tarefa apos apenas uma pequena alteracao se ainda existirem riscos evidentes, validacoes pendentes, erros no terminal, layout quebrado ou consequencias diretas nao revisadas. Trabalhar em ciclos de analise, ajuste e validacao ate a entrega estar consistente.

## 8. Criterios de revisao

Antes de considerar uma tarefa pronta, revisar:

- Build sem erros.
- Lint sem erros, quando aplicavel.
- Imports existentes e novos resolvendo corretamente.
- Ausencia de codigo duplicado desnecessario.
- Estados, hooks e efeitos sem regressao evidente.
- Responsividade em larguras mobile e desktop.
- UI sem sobreposicao, cortes de texto ou quebras de hierarquia.
- UX coerente com o objetivo da secao ou fluxo alterado.
- Conteudo sem inconsistencias, placeholders acidentais ou textos desalinhados com a marca Guap.
- Assets referenciados existentes em `public/` ou `src/assets/`.
- Mudancas restritas ao escopo solicitado, sem refatoracoes paralelas desnecessarias.

## 9. Criterios para finalizar tarefas

Uma tarefa so deve ser finalizada quando:

- O projeto foi analisado antes da edicao.
- A implementacao solicitada foi concluida no escopo correto.
- Erros encontrados durante a execucao foram corrigidos.
- O build aplicavel foi executado e passou.
- O lint foi executado e passou quando aplicavel.
- Responsividade e UI/UX foram revisadas para mudancas visuais.
- Imports quebrados, duplicacoes e regressos obvios foram verificados.
- O agente consegue explicar objetivamente o que mudou e quais comandos foram executados.

Se alguma validacao nao puder ser executada, registrar claramente o motivo e o risco restante antes de encerrar.
