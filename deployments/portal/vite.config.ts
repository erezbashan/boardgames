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
      '@erez/acquire': path.resolve(__dirname, '../../games/acquire/src/index.ts'),
      '@erez/splendor': path.resolve(__dirname, '../../games/splendor/src/index.ts'),
      '@erez/flips': path.resolve(__dirname, '../../games/flips/src/index.ts'),
      '@erez/dominion': path.resolve(__dirname, '../../games/dominion/src/index.ts'),
    }
  },
  optimizeDeps: {
    exclude: ['@erez/boardgame-core', '@erez/flips', '@erez/king-of-tokyo', '@erez/acquire', '@erez/splendor', '@erez/dominion']
  }
})
