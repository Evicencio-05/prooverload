import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import type { IncomingMessage, ServerResponse } from 'node:http'
async function authMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const { handleAuthApi } = await import('./server/auth-api.ts')
  if (await handleAuthApi(req, res)) return
  next()
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v
  }

  return {
    plugins: [
      react(),
      {
        name: 'prooverload-auth',
        configureServer(server) {
          server.middlewares.use(authMiddleware)
        },
        configurePreviewServer(server) {
          server.middlewares.use(authMiddleware)
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
        devOptions: { enabled: true },
        manifest: {
          name: 'ProOverload',
          short_name: 'ProOverload',
          description: 'Log gym sessions in seconds. Track overload. See what you trained.',
          theme_color: '#101418',
          background_color: '#101418',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.hostname.includes('instantdb.com'),
              handler: 'NetworkFirst',
              options: { cacheName: 'instant-api' },
            },
          ],
        },
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      allowedHosts: true,
    },
  }
})
