import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, type Plugin } from 'vite'

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/generate-word-info', async (req, res) => {
        const mod = await server.ssrLoadModule('/api/generate-word-info.js')
        await mod.default(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'APPCFG_'],
  plugins: [
    react(),
    tailwindcss(),
    apiDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '중국어 단어장',
        short_name: '단어장',
        description: '화상 중국어 수업 단어 학습 및 시험',
        theme_color: '#dc2626',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
})
