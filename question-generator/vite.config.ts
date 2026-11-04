import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const mathValleyRoot = resolve(rootDir, '..')

export default defineConfig({
  plugins: [react()],
  root: 'test-app',
  resolve: {
    alias: {
      '@qg': resolve(rootDir, 'src'),
      '@display': resolve(mathValleyRoot, 'src'),
    },
  },
  server: {
    port: 5174,
    fs: {
      allow: [mathValleyRoot],
    },
  },
})
