import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    },
    // Reduce file watching overhead
    watch: {
      ignored: ['**/node_modules/**', '**/.venv/**', '**/dist/**', '**/logs/**', '**/media/**']
    }
  },
  
  // Performance optimizations
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Optimize dependencies
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'markdown': ['react-markdown']
        }
      }
    },
    
    // Faster builds in development
    sourcemap: false
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: []
  }
})
