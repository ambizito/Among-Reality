import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const baseAllowedHosts = [
    'localhost',
    '127.0.0.1',
    '[::1]',
    '.trycloudflare.com',
  ]
  const extraAllowedHosts = (env.VITE_EXTRA_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
  const allowedHosts = [...baseAllowedHosts, ...extraAllowedHosts]

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      allowedHosts,
      proxy: {
        '/state': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/events': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
    },
  }
})
