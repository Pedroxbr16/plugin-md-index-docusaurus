import path from 'path';
import fs from 'fs/promises';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import strip from 'strip-markdown';
import remarkStringify from 'remark-stringify'; // compiler

function rmExt(p) { return p.replace(/\.(md|mdx)$/i, ''); }

async function mdToText(markdown) {
  const file = await unified()
    .use(remarkParse)      // Markdown -> MDAST
    .use(strip)            // remove formatação
    .use(remarkStringify)  // MDAST -> string
    .process(markdown || '');
  return String(file).replace(/\s+/g, ' ').trim();
}

/**
 * options:
 * - docsDir: pasta dos docs (default: "docs")
 * - routeBasePath: base do plugin de docs (default: "docs")
 * - maxLen: corte de segurança (default: 40000 chars)
 */
export default function mdIndexPlugin(context, options = {}) {
  const { siteDir, baseUrl } = context; // ex.: "/faq_wiki/"
  const docsDir = options.docsDir || 'docs';
  const routeBasePath = options.routeBasePath || 'docs';
  const maxLen = options.maxLen ?? 40000;

  // normaliza baseUrl sem barra final
  const base = String(baseUrl || '/').replace(/\/$/, '');

  return {
    name: 'md-index',
    async loadContent() {
      const absDocsDir = path.join(siteDir, docsDir);
      const patterns = [`${absDocsDir.replace(/\\/g, '/')}/**/*.{md,mdx}`];

      const files = await fg(patterns, { dot: false, onlyFiles: true });

      const out = [];
      for (const absPath of files) {
        try {
          const relFromDocs = path.relative(absDocsDir, absPath).replace(/\\/g, '/'); // ex: guia/intro.md
          const raw = await fs.readFile(absPath, 'utf8');
          const { data: fm, content } = matter(raw);

          const text = (await mdToText(content)).slice(0, maxLen);

          const title =
            fm.title ||
            path.basename(rmExt(relFromDocs)).replace(/[-_]/g, ' ') ||
            'Untitled';

          // rota esperada, AGORA com baseUrl
          const middle = routeBasePath === '/' ? '' : `/${routeBasePath}`;
          const route = `${base}${middle}/${rmExt(relFromDocs)}`.replace(/\/{2,}/g, '/');

          // headings simples (opcional)
          const headings = Array.from(text.matchAll(/\b([A-Z][^\.\!\?]{2,60})\b/g))
            .slice(0, 20)
            .map(m => m[1]);

          out.push({ route, title, headings, text });
        } catch (err) {
          console.warn(`[md-index] Falha ao processar ${absPath}: ${err.message}`);
        }
      }
      return out;
    },

    async contentLoaded({ content, actions }) {
      const { createData, setGlobalData } = actions;
      // mantém um arquivo gerado (útil para debugging), mas o consumo será via usePluginData
      await createData('md-index.json', JSON.stringify(content, null, 2));
      setGlobalData(content); // <- torna disponível em usePluginData('md-index')
    },
  };
};
