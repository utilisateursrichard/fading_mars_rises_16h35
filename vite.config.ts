import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Charge automatiquement .env.api dans l'environnement Vite
const loadCustomEnvFile = (filename: string) => {
  const filePath = path.resolve(__dirname, filename);
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
          val = val.slice(1, -1);
        }
        if (key.startsWith('VITE_') && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
};

loadCustomEnvFile('.env.api');
loadCustomEnvFile('.env');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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


