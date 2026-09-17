import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

/**
 * Generates dist/404.html matching dist/index.html for seamless GitHub Pages SPA routing fallback.
 */
function githubPagesSpaPlugin(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        const indexPath = path.join(distDir, 'index.html');
        const notFoundPath = path.join(distDir, '404.html');
        if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
          fs.copyFileSync(indexPath, notFoundPath);
        }
      } catch (err) {
        // Non-fatal fallback
      }
    },
  };
}

export default defineConfig(() => {
  return {
    // Relative base ensures assets load on GitHub Pages subpaths (/repo/) as well as Vercel (/)
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss(), githubPagesSpaPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: false,
      sourcemap: false,
      chunkSizeWarningLimit: 3500,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // Standalone heavy document & spreadsheet generation libraries
            if (
              id.includes('xlsx') ||
              id.includes('docx') ||
              id.includes('jspdf') ||
              id.includes('jszip')
            ) {
              return 'vendor-office';
            }

            // Standalone canvas, image and screenshot tools
            if (
              id.includes('html2canvas') ||
              id.includes('html-to-image') ||
              id.includes('canvas-confetti')
            ) {
              return 'vendor-canvas';
            }

            // Standalone chart and data visualization engine
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }

            // Firebase authentication and firestore client SDK
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }

            // Icon library
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          },
        },
      },
    },
  };
});
