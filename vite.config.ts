import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

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
// 3. Base de données SQLite automatique pour persister la moyenne générale exacte de chaque utilisateur
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const sqliteDbPath = path.resolve(dataDir, 'betterschool_wear.sqlite');
const sqliteDb = new DatabaseSync(sqliteDbPath);

sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS user_averages (
    user_id TEXT PRIMARY KEY,
    platform_id TEXT DEFAULT '',
    student_name TEXT DEFAULT '',
    student_class TEXT DEFAULT '',
    school_name TEXT DEFAULT '',
    active_period TEXT DEFAULT '',
    overall_average_pct REAL NOT NULL,
    overall_average_20 REAL NOT NULL,
    total_weekly_hours INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );
`);

const upsertUserAverageStmt = sqliteDb.prepare(`
  INSERT INTO user_averages (
    user_id,
    platform_id,
    student_name,
    student_class,
    school_name,
    active_period,
    overall_average_pct,
    overall_average_20,
    total_weekly_hours,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    platform_id = excluded.platform_id,
    student_name = CASE WHEN excluded.student_name != '' THEN excluded.student_name ELSE user_averages.student_name END,
    student_class = CASE WHEN excluded.student_class != '' THEN excluded.student_class ELSE user_averages.student_class END,
    school_name = CASE WHEN excluded.school_name != '' THEN excluded.school_name ELSE user_averages.school_name END,
    active_period = excluded.active_period,
    overall_average_pct = excluded.overall_average_pct,
    overall_average_20 = excluded.overall_average_20,
    total_weekly_hours = excluded.total_weekly_hours,
    updated_at = excluded.updated_at;
`);

const getUserAverageStmt = sqliteDb.prepare(`
  SELECT
    user_id,
    platform_id,
    student_name,
    student_class,
    school_name,
    active_period,
    overall_average_pct,
    overall_average_20,
    total_weekly_hours,
    updated_at
  FROM user_averages
  WHERE user_id = ?;
`);

const saveUserAverageToSqlite = (data: {
  userId?: string;
  platformId?: string;
  studentName?: string;
  studentClass?: string;
  schoolName?: string;
  activePeriod?: string;
  overallAveragePct?: number;
  overallAverage20?: number;
  totalWeeklyHours?: number;
}) => {
  const cleanUserId = String(data.userId || '').trim();
  const pct = Number(data.overallAveragePct);
  if (!cleanUserId || isNaN(pct) || pct <= 0) return false;

  const avg20 = typeof data.overallAverage20 === 'number' && !isNaN(data.overallAverage20)
    ? data.overallAverage20
    : Number(((pct / 100) * 20).toFixed(2));

  upsertUserAverageStmt.run(
    cleanUserId,
    String(data.platformId || ''),
    String(data.studentName || ''),
    String(data.studentClass || ''),
    String(data.schoolName || ''),
    String(data.activePeriod || ''),
    Number(pct.toFixed(1)),
    Number(avg20.toFixed(2)),
    Number(data.totalWeeklyHours || 0),
    new Date().toISOString()
  );
  return true;
};

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
  // Endpoint SQLite pour synchroniser et lire la moyenne générale exacte de chaque élève
  middlewares.use('/api/user-average', (req: any, res: any, next: any) => {
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

    if (req.method === 'GET') {
      const userId = (parsedUrl.searchParams.get('userId') || '').trim();
      if (!userId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Paramètre userId manquant.' }));
        return;
      }

      const row = getUserAverageStmt.get(userId) as any;
      if (!row) {
        res.statusCode = 404;
        res.end(JSON.stringify({ ok: false, error: 'Aucune moyenne enregistrée pour cet utilisateur.' }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        ok: true,
        userId: row.user_id,
        platformId: row.platform_id,
        studentName: row.student_name,
        studentClass: row.student_class,
        schoolName: row.school_name,
        activePeriod: row.active_period,
        overallAveragePct: row.overall_average_pct,
        overallAverage20: row.overall_average_20,
        totalWeeklyHours: row.total_weekly_hours,
        updatedAt: row.updated_at
      }));
      return;
    }

    if (req.method === 'POST') {
      let bodyStr = '';
      req.on('data', (chunk: any) => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(bodyStr || '{}');
          const saved = saveUserAverageToSqlite(payload);
          if (!saved) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: 'userId ou overallAveragePct invalide.' }));
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
        } catch (err: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: err?.message || 'JSON invalide.' }));
        }
      });
      return;
    }

    next();
  });

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
          const sessionObj = payload.session || null;

          // Si la session poussée contient une moyenne générale, la persister immédiatement dans SQLite
          if (sessionObj && sessionObj.userId && typeof sessionObj.overallAveragePct === 'number') {
            saveUserAverageToSqlite({
              userId: sessionObj.userId,
              platformId: sessionObj.platformId,
              studentName: sessionObj.studentName,
              studentClass: sessionObj.studentClass,
              schoolName: sessionObj.schoolName,
              activePeriod: sessionObj.activePeriod,
              overallAveragePct: sessionObj.overallAveragePct
            });
          } else if (sessionObj && sessionObj.userId) {
            // Enrichir avec la moyenne SQLite déjà connue si disponible
            const existingRow = getUserAverageStmt.get(String(sessionObj.userId).trim()) as any;
            if (existingRow && typeof existingRow.overall_average_pct === 'number') {
              sessionObj.overallAveragePct = existingRow.overall_average_pct;
            }
          }

          wearPairingStore.set(rawCode, {
            code: rawCode,
            createdAt: existing ? existing.createdAt : now,
            expiresAt: now + 5 * 60 * 1000,
            session: sessionObj
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
