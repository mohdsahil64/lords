import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Deployed under https://lords-digiicampus.vercel.app/V2/
  base: '/V2/',
  // Emit the build INTO a /V2 folder so the physical file layout
  // (dist/V2/assets/...) matches the /V2/ URL paths exactly. This avoids
  // relying on rewrites to map assets, which was serving index.html for
  // every .js/.css request and causing the blank page.
  build: { outDir: 'dist/V2' },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
