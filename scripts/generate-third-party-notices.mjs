import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docsPath = path.join(root, 'docs', 'THIRD_PARTY_NOTICES.md');
const htmlPath = path.join(root, 'public', 'third-party-notices.html');

const markdownBody = execSync(
  'license-checker --production --markdown --excludePrivatePackages',
  { cwd: root, encoding: 'utf-8', maxBuffer: 12 * 1024 * 1024 },
);

const markdown = `# Third-Party Notices

Web Summary bundles open-source software in \`dist/\`. This file lists licenses for **production** dependencies included in the extension build.

Regenerate: \`yarn notices\`

---

${markdownBody.trim()}
`;

mkdirSync(path.dirname(docsPath), { recursive: true });
writeFileSync(docsPath, `${markdown}\n`);

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Web Summary — Third-Party Notices</title>
    <meta
      name="description"
      content="Open-source software notices for the Web Summary Chrome extension."
    />
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --text: #1e293b;
        --muted: #64748b;
        --accent: #4f46e5;
        --border: #e2e8f0;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family:
          system-ui,
          -apple-system,
          'Segoe UI',
          Roboto,
          sans-serif;
        font-size: 14px;
        line-height: 1.55;
        color: var(--text);
        background: var(--bg);
      }
      .wrap {
        max-width: 960px;
        margin: 0 auto;
        padding: 2rem 1.25rem 4rem;
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0 0 0.5rem;
      }
      .meta {
        color: var(--muted);
        font-size: 0.85rem;
        margin-bottom: 1.25rem;
      }
      a {
        color: var(--accent);
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        padding: 1rem 1.15rem;
        font-size: 12px;
        line-height: 1.45;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <p class="meta"><a href="./legal.html">← Legal &amp; Privacy</a></p>
      <h1>Third-Party Notices</h1>
      <p class="meta">
        Open-source components bundled in the Web Summary extension (<code>dist/</code>).
        Privacy and data handling for end users are covered in
        <a href="./legal.html">Legal &amp; Privacy</a>.
      </p>
      <pre>${escapeHtml(markdown.trim())}</pre>
    </div>
  </body>
</html>
`;

writeFileSync(htmlPath, html);
console.log('[Web Summary] Wrote docs/THIRD_PARTY_NOTICES.md and public/third-party-notices.html');
