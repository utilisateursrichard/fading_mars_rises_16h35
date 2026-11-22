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
interface WearPairingEntry {
  code: string;
  createdAt: number;
  expiresAt: number;
  session: Record<string, unknown> | null;
}

const wearPairingStore = new Map<string, WearPairingEntry>();

const cleanExpiredPairings = () => {
  const now = Date.now();
  for (const [key, entry] of wearPairingStore.entries()) {
    if (entry.expiresAt <= now) {
      wearPairingStore.delete(key);
    }
  }
};

const attachWearPairingMiddleware = (middlewares: any) => {
  middlewares.use('/api/wear-pair', (req: any, res: any, next: any) => {
    cleanExpiredPairings();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    const pathname = parsedUrl.pathname;

    // 1. La montre crée un code d'appairage (et affiche le QR Code)
    if (req.method === 'POST' && pathname === '/create') {
      let bodyStr = '';
      req.on('data', (chunk: any) => { bodyStr += chunk; });
      req.on('end', () => {
        let requestedCode = '';
        try {
          if (bodyStr) {
            const parsed = JSON.parse(bodyStr);
            if (parsed.code && typeof parsed.code === 'string') {
              requestedCode = parsed.code.replace(/[^0-9A-Z]/gi, '').toUpperCase();
            }
          }
        } catch {}

        const code = requestedCode.length === 6
          ? requestedCode
          : String(Math.floor(100000 + Math.random() * 900000));

        const now = Date.now();
        const expiresAt = now + 5 * 60 * 1000; // 5 minutes TTL
        wearPairingStore.set(code, {
          code,
          createdAt: now,
          expiresAt,
          session: null
        });

        res.statusCode = 200;
        res.end(JSON.stringify({
          ok: true,
          code,
          pairUrl: `https://betterschool.dino.icu/?wearPair=${code}`,
          expiresAt
        }));
      });
      return;
    }

    // 2. La montre poll toutes les 2s pour récupérer la session poussée par le Web
    if (req.method === 'GET' && pathname === '/poll') {
      const rawCode = (parsedUrl.searchParams.get('code') || '').replace(/[^0-9A-Z]/gi, '').toUpperCase();
      const entry = wearPairingStore.get(rawCode);

      if (!entry) {
        res.statusCode = 404;
        res.end(JSON.stringify({ ok: false, status: 'expired', error: 'Code expiré ou introuvable.' }));
        return;
      }

      if (entry.session) {
        const sessionPayload = entry.session;
        // Suppression immédiate après lecture par la montre (Zero-retention)
        wearPairingStore.delete(rawCode);
        res.statusCode = 200;
        res.end(JSON.stringify({
          ok: true,
          status: 'paired',
          session: sessionPayload
        }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        ok: true,
        status: 'pending',
        expiresAt: entry.expiresAt
      }));
      return;
    }

    // 3. BetterSchool Web pousse la session Smartschool après avoir scanné le QR Code de la montre
    if (req.method === 'POST' && pathname === '/push') {
      let bodyStr = '';
      req.on('data', (chunk: any) => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(bodyStr || '{}');
          const rawCode = String(payload.code || '').replace(/[^0-9A-Z]/gi, '').toUpperCase();
          if (!rawCode || rawCode.length < 4) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: 'Code d\'appairage invalide.' }));
            return;
          }

          const now = Date.now();
          const existing = wearPairingStore.get(rawCode);
          wearPairingStore.set(rawCode, {
            code: rawCode,
            createdAt: existing ? existing.createdAt : now,
            expiresAt: now + 5 * 60 * 1000,
            session: payload.session || null
          });

          res.statusCode = 200;
          res.end(JSON.stringify({
            ok: true,
            code: rawCode,
            message: 'Session transmise à la montre Wear OS.'
          }));
        } catch (err: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: err?.message || 'Payload JSON invalide.' }));
        }
      });
      return;
    }

    next();
  });
};

const wearPairingRelayPlugin = () => ({
  name: 'betterschool-wear-pairing-relay',
  configureServer(server: any) {
    attachWearPairingMiddleware(server.middlewares);
  },
  configurePreviewServer(previewServer: any) {
    attachWearPairingMiddleware(previewServer.middlewares);
  }
});

export default defineConfig({
  plugins: [react(), wearPairingRelayPlugin()],
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
