import { defineConfig } from 'vite';

export default defineConfig({
  // Sirve archivos estáticos desde la raíz del proyecto
  root: '.',

  server: {
    port: 5173,
    proxy: {
      // Redirige todas las peticiones /api al backend Express
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
