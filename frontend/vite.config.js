import { defineConfig } from 'vite'
import obfuscator from 'vite-plugin-obfuscator'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    ...(mode === 'production' ? [
      obfuscator({
        options: {
          rotateStringArray: true,
          controlFlowFlattening: true,
          debugProtection: true,
          stringArrayThreshold: 0.75,
          simplify: true
        }
      })
    ] : []),
  ],
  server: {
      host: '0.0.0.0',
      port: 3001,
      allowedHosts: ['.asia-northeast1.run.app', '.a.run.app']
  },
  preview: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: ['.asia-northeast1.run.app', '.a.run.app']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  publicDir: 'public'
}))