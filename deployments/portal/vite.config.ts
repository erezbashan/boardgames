import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@erez/boardgame-core': path.resolve(__dirname, '../../packages/boardgame-core/src/index.ts'),
      '@erez/king-of-tokyo': path.resolve(__dirname, '../../games/king-of-tokyo/src/index.ts'),
      '@erez/flips': path.resolve(__dirname, '../../games/flips/src/index.ts'),
    }
  },
  optimizeDeps: {
    exclude: ['@erez/boardgame-core', '@erez/flips', '@erez/king-of-tokyo']
  }
})
