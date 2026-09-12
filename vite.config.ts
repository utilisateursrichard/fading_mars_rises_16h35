import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// 1. Synchronisation automatique de .env.api vers .env
const envApiPath = path.resolve(__dirname, '.env.api');
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envApiPath)) {
  fs.copyFileSync(envApiPath, envPath);
}

// 2. Injection des variables VITE_* dans Vite define pour le build de production
const envDefines: Record<string, string> = {};
const loadCustomEnvFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1).trim();
        }
        if (key.startsWith('VITE_')) {
          process.env[key] = val;
          envDefines[`import.meta.env.${key}`] = JSON.stringify(val);
        }
      }
    });
  }
};

loadCustomEnvFile(envApiPath);
loadCustomEnvFile(envPath);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: envDefines,
  server: {
    port: 3000,
    open: false,
    host: true,
    allowedHosts: ['betterschool.dino.icu', '.dino.icu']
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: ['betterschool.dino.icu', '.dino.icu']
  }
});
