import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { erroresEntornoSupabase } from './scripts/validarEntornoSupabase';

function validarEntornoAlCompilar(): Plugin {
  return {
    name: 'spotterjn-validar-entorno',
    apply: 'build',
    configResolved(config) {
      const errores = erroresEntornoSupabase(config.env);
      if (errores.length > 0) {
        throw new Error(
          `Configuración de Supabase incompleta. Copia .env.example como .env y complétalo.\n- ${errores.join('\n- ')}`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), validarEntornoAlCompilar()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Las pruebas con el router de Ionic son pesadas: con la suite completa en paralelo superaban a veces 5 s.
    testTimeout: 15_000,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs}'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
