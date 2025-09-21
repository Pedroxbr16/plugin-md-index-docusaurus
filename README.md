# docusaurus-plugin-md-index

Plugin para Docusaurus que varre seus arquivos **.md/.mdx** em `docs/`, remove a formatação e gera um índice leve com **rota**, **título**, **headings** e **texto plano**.  
O índice fica disponível via `usePluginData('md-index')` e também é gravado como `md-index.json`.

## Instalação

> Requer Node.js ≥ 18 e Docusaurus 3.

### 1. Instale via npm

```bash
npm i docusaurus-plugin-md-index
```

### 2. Configure no `docusaurus.config.mjs`

```js
export default {
  plugins: [
    [
      'docusaurus-plugin-md-index',
      {
        docsDir: 'docs',        // opcional
        routeBasePath: 'docs',  // opcional
        maxLen: 40000,          // opcional
      },
    ],
  ],
};
```

### 3. Consumindo no front

```tsx
import { usePluginData } from '@docusaurus/useGlobalData';

type Item = { route:string; title:string; headings:string[]; text:string };

export default function SearchBox() {
  const data = usePluginData('md-index') as Item[];
  return <pre>{JSON.stringify(data.slice(0,5), null, 2)}</pre>;
}
```

## Saída gerada (shape)

```json
[
  {
    "route": "/base/docs/guia/intro",
    "title": "Intro",
    "headings": ["Introdução", "Como usar", "Exemplos"],
    "text": "conteúdo em texto puro sem formatação ..."
  }
]
```

## Licença

MIT
