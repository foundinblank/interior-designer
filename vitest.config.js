import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Test environment (browser-like for DOM testing)
    environment: 'jsdom',

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
      ],
    },

    // Test file patterns
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],

    // Setup files (if needed later)
    // setupFiles: ['./tests/setup.js'],
  },

  // Alias resolution (same as vite.config.js)
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
})
