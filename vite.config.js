import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'vendor'
            }
            if (id.includes('recharts')) {
              return 'recharts'
            }
            if (id.includes('lucide-react')) {
              return 'lucide'
            }
          }
        }
      }
    }
  }
})


