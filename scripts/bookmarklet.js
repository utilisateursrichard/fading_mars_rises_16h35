#!/usr/bin/env node

/**
 * BetterSchool - Générateur de Bookmarklet Chrome
 * 
 * Ce script génère le code JavaScript prêt à l'emploi pour créer un favori (bookmarklet)
 * dans Google Chrome qui transforme l'interface Smartschool en BetterSchool.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// URL cible par défaut (local ou distant)
const DEFAULT_URL = 'http://localhost:3000';

// 1. Code du Bookmarklet Mode Overlay (Recommandé : 0 conflit CSS/JS, fermeture facile)
const overlayBookmarkletCode = `javascript:(function(){
  const OVERLAY_ID = 'betterschool-overlay';
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
    return;
  }
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;border:none;background:#F8FAFC;margin:0;padding:0;overflow:hidden;';

  const iframe = document.createElement('iframe');
  iframe.src = '${DEFAULT_URL}?source=smartschool';
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
  iframe.title = 'BetterSchool Interface';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Quitter BetterSchool';
  closeBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483648;background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,0.15);padding:8px 16px;border-radius:9999px;font-family:sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);transition:all 0.2s;';
  closeBtn.onmouseenter = () => closeBtn.style.transform = 'scale(1.05)';
  closeBtn.onmouseleave = () => closeBtn.style.transform = 'scale(1)';
  closeBtn.onclick = () => overlay.remove();

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      window.removeEventListener('keydown', handleEsc);
    }
  };
  window.addEventListener('keydown', handleEsc);

  overlay.appendChild(iframe);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
})();`;

// Minification en une seule ligne pour URL Chrome
const minifiedBookmarklet = overlayBookmarkletCode.replace(/\s+/g, ' ').trim();

// 2. Générer la page d'installation HTML (Glisser-déposer dans la barre de favoris)
const installerHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Installation Bookmarklet BetterSchool</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #F8FAFC;
      color: #0F172A;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: white;
      max-width: 640px;
      width: 100%;
      border-radius: 24px;
      padding: 36px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(226, 232, 240, 0.8);
    }
    h1 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #1E293B;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
    }
    p {
      color: #64748B;
      margin-top: 10px;
      line-height: 1.6;
      font-size: 15px;
    }
    .drag-zone {
      margin: 28px 0;
      padding: 24px;
      border: 2px dashed #CBD5E1;
      border-radius: 18px;
      text-align: center;
      background: #F1F5F9;
    }
    .drag-button {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #4F46E5;
      color: white;
      text-decoration: none;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 26px;
      border-radius: 9999px;
      box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.4);
      cursor: grab;
      transition: transform 0.15s, background-color 0.15s;
    }
    .drag-button:hover {
      background: #4338CA;
      transform: translateY(-2px);
    }
    .drag-hint {
      margin-top: 12px;
      font-size: 13px;
      color: #64748B;
      font-weight: 500;
    }
    .steps {
      margin-top: 24px;
      border-top: 1px solid #E2E8F0;
      padding-top: 20px;
    }
    .step-item {
      display: flex;
      gap: 14px;
      margin-bottom: 16px;
      align-items: flex-start;
    }
    .step-num {
      background: #4F46E5;
      color: white;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
      flex-shrink: 0;
    }
    .step-text {
      font-size: 14px;
      color: #334155;
      line-height: 1.5;
    }
    .code-box {
      margin-top: 20px;
      background: #0F172A;
      color: #E2E8F0;
      padding: 16px;
      border-radius: 12px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
      max-height: 100px;
      overflow-y: auto;
      position: relative;
    }
    .copy-btn {
      margin-top: 10px;
      background: #E2E8F0;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .copy-btn:hover {
      background: #CBD5E1;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>
      <span>🚀 BetterSchool</span>
      <span class="badge">Draft Bookmarklet</span>
    </h1>
    <p>
      Transformez l'interface Smartschool en l'interface <strong>BetterSchool (Design M3E Pro)</strong> en un seul clic, avec toutes les fausses données préchargées !
    </p>

    <div class="drag-zone">
      <a class="drag-button" href="${minifiedBookmarklet}">
        ⭐ Activer BetterSchool
      </a>
      <div class="drag-hint">
        👉 <strong>Glissez ce bouton</strong> directement dans la <strong>barre de favoris</strong> de Chrome (Ctrl+Shift+B pour afficher la barre).
      </div>
    </div>

    <div class="steps">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          Assurez-vous que le serveur BetterSchool est lancé (<code>npm run dev</code> sur le port 3000).
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Ouvrez votre espace <strong>Smartschool</strong> habituel dans Chrome.
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          Cliquez sur le favori <strong>"Activer BetterSchool"</strong>. L'interface BetterSchool apparaît instantanément par-dessus Smartschool ! Vous pouvez la quitter à tout moment via la touche <kbd>Échap</kbd> ou le bouton en bas à droite.
        </div>
      </div>
    </div>

    <div style="margin-top: 24px;">
      <label style="font-size: 13px; font-weight: 600; color: #475569;">Ou copiez le code manuellement :</label>
      <div class="code-box" id="code">${minifiedBookmarklet}</div>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('code').innerText); alert('Code du bookmarklet copié !');">📋 Copier le code javascript:</button>
    </div>
  </div>
</body>
</html>
`;

const publicDir = path.join(rootDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath = path.join(publicDir, 'bookmarklet.html');
fs.writeFileSync(outputPath, installerHtml, 'utf8');

console.log('\n✅ Bookmarklet BetterSchool généré avec succès !');
console.log('----------------------------------------------------');
console.log('📍 Page d\'installation : public/bookmarklet.html');
console.log('🌐 Accessible sur : http://localhost:3000/bookmarklet.html');
console.log('----------------------------------------------------\n');
console.log('📋 Code du favori (URL du bookmarklet Chrome) :');
console.log(minifiedBookmarklet);
console.log('\n----------------------------------------------------\n');

