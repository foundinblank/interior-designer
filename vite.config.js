import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  // ES2022 target for modern browsers
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
  },
  // Absolute import paths
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@data': path.resolve(__dirname, './src/data'),
      '@styles': path.resolve(__dirname, './src/styles'),
    }
  },
  // Dev server configuration
  server: {
    port: 5173,
    open: true,
  },
  // Root directory is src/
  root: 'src',
  publicDir: '../public',
})
