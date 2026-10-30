import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Never inline assets as base64: every inlined byte lands in index.html
    // and delays first paint on a slow connection.
    assetsInlineLimit: 0,
    sourcemap: false,
  },
})
