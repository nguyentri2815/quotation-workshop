import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import manifest from './checkpoints/manifest.json' with { type: 'json' }
import { previewRunPlugin } from './scripts/preview-run-plugin'

export default defineConfig({
  plugins: [previewRunPlugin(), react()],
  build: {
    rolldownOptions: {
      input: {
        workshop: resolve(import.meta.dirname, 'index.html'),
        practice: resolve(import.meta.dirname, 'practice.html'),
        reference: resolve(import.meta.dirname, 'reference.html'),
        ...Object.fromEntries(
          manifest.checkpoints.map((checkpoint) => [
            `checkpoint-${checkpoint.id}`,
            resolve(import.meta.dirname, `checkpoints/${checkpoint.id}/index.html`),
          ]),
        ),
      },
    },
  },
})
