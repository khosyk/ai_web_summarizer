import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** dist용 manifest.json 생성 */
function extensionManifestPlugin() {
  return {
    name: 'extension-manifest',
    closeBundle() {
      const raw = readFileSync(
        path.resolve(__dirname, 'public/manifest.json'),
        'utf-8',
      );
      const manifest = JSON.parse(raw) as Record<string, unknown>;
      manifest.background = { service_worker: 'background.js', type: 'module' };
      delete manifest.web_accessible_resources;

      writeFileSync(
        path.resolve(__dirname, 'dist/manifest.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
      );

      const welcomeDir = path.resolve(__dirname, 'public/welcome');
      const requiredGuideImages = [
        'guide-step-1-api-page.png',
        'guide-step-2-create-key.png',
        'guide-step-3-copy-key.png',
        'guide-step-4-paste-settings.png',
      ];
      const missing = requiredGuideImages.filter(
        (name) => !existsSync(path.join(welcomeDir, name)),
      );
      if (missing.length > 0) {
        console.warn(
          `[Web Summary] Missing welcome guide images in public/welcome/: ${missing.join(', ')}`,
        );
      }

      const distDir = path.resolve(__dirname, 'dist');
      const publicPages = [
        'welcome.html',
        'legal.html',
        'third-party-notices.html',
      ] as const;
      const missingPages = publicPages.filter(
        (name) => !existsSync(path.join(distDir, name)),
      );
      if (missingPages.length > 0) {
        console.warn(
          `[Web Summary] Missing public pages in dist/: ${missingPages.join(', ')}`,
        );
      } else {
        console.log(
          '[Web Summary] Public pages ready in dist/: welcome.html, legal.html, third-party-notices.html (+ assets).',
        );
        console.log(
          '[Web Summary] CWS Privacy URL → deploy dist/legal.html to HTTPS (e.g. GitHub Pages).',
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), extensionManifestPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        options: path.resolve(__dirname, 'options.html'),
        welcome: path.resolve(__dirname, 'welcome.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
        content: path.resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
