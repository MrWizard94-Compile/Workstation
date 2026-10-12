import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

const chunkBudget: Plugin = {
  name: 'workstation-chunk-budget',
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue;
      const bytes = Buffer.byteLength(chunk.code, 'utf8');
      // WebLLM 0.2.84 publishes a single ~6 MB JavaScript module. Keep that
      // one measured exception visible, and fail on every other oversized chunk.
      const limit = chunk.name === 'web-llm' ? 6_100_000 : 500_000;
      if (bytes > limit) {
        this.error(`${chunk.fileName} is ${bytes} bytes, above its ${limit}-byte budget`);
      }
    }
  },
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), chunkBudget],
    build: {
      // Vite's global warning threshold cannot exempt just WebLLM's monolith;
      // chunkBudget above retains a strict cap for every output chunk.
      chunkSizeWarningLimit: 6100,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@mlc-ai/web-llm')) return 'web-llm';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
