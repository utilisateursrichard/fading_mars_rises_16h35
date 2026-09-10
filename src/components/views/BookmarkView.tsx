import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Laptop, 
  ShieldCheck, 
  ArrowLeft,
  MousePointerClick,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

export const BookmarkView: React.FC = () => {
  const { setActiveTab } = useSchool();
  const [copied, setCopied] = useState(false);
  const [testOverlayOpen, setTestOverlayOpen] = useState(false);
  const [customOrigin, setCustomOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomOrigin(window.location.origin);
    }
  }, []);

  const effectiveOrigin = customOrigin || 'http://localhost:3000';

  // Code du Bookmarklet minifié avec gestion dynamique du favicon, du titre et passerelle postMessage
  const bookmarkletCode = `javascript:(function(){const O='betterschool-overlay',F='betterschool-favicon',ex=document.getElementById(O);if(ex){if(window.__closeBS)window.__closeBS();else ex.remove();return;}const oldIcons=Array.from(document.querySelectorAll("link[rel*='icon']")),saved=oldIcons.map(el=>({el,parent:el.parentNode,next:el.nextSibling}));oldIcons.forEach(el=>el.remove());const fav=document.createElement('link');fav.id=F;fav.rel='icon';fav.type='image/svg+xml';fav.href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='rgb(79,70,229)'/><path d='M28 13v7M4 13l12-6 12 6-12 6z' stroke='white' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M9 16v5c3 3.5 11 3.5 14 0v-5' stroke='white' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>";document.head.appendChild(fav);const origTitle=document.title;document.title='BetterSchool — Smartschool';const overlay=document.createElement('div');overlay.id=O;overlay.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;border:none;background:rgb(248,250,252);margin:0;padding:0;overflow:hidden;';const iframe=document.createElement('iframe');iframe.src='${effectiveOrigin}?source=smartschool';iframe.style.cssText='width:100%;height:100%;border:none;display:block;';iframe.title='BetterSchool Interface';const closeBtn=document.createElement('button');closeBtn.textContent='✕ Quitter BetterSchool';closeBtn.style.cssText='position:fixed;bottom:20px;right:20px;z-index:2147483648;background:rgb(15,23,42);color:white;border:1px solid rgba(255,255,255,0.15);padding:8px 16px;border-radius:9999px;font-family:sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);transition:all 0.2s;';closeBtn.onmouseenter=()=>closeBtn.style.transform='scale(1.05)';closeBtn.onmouseleave=()=>closeBtn.style.transform='scale(1)';const onMsg=(ev)=>{try{if(ev.data&&ev.data.type==='BETTERSCHOOL'){if(ev.data.action==='CLOSE')cleanup();if(ev.data.action==='SET_TITLE'&&ev.data.title)document.title=ev.data.title;}}catch(e){}};window.addEventListener('message',onMsg);const cleanup=()=>{overlay.remove();const curFav=document.getElementById(F);if(curFav)curFav.remove();saved.forEach(({el,parent,next})=>{if(parent)parent.insertBefore(el,next);else document.head.appendChild(el);});document.title=origTitle;window.removeEventListener('keydown',handleEsc);window.removeEventListener('message',onMsg);delete window.__closeBS;};window.__closeBS=cleanup;closeBtn.onclick=cleanup;const handleEsc=(e)=>{if(e.key==='Escape')cleanup();};window.addEventListener('keydown',handleEsc);overlay.appendChild(iframe);overlay.appendChild(closeBtn);document.body.appendChild(overlay);})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', bookmarkletCode);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Breadcrumb & Return button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Retour au tableau de bord
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          BetterSchool v1.0 • M3E Pro
        </span>
      </div>

      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-2">
          <Bookmark className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-display">
          Activer BetterSchool sur <span className="text-indigo-600">Smartschool</span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-base">
          Transformez l'interface austère de Smartschool en une expérience moderne et fluide en un clic depuis votre barre de favoris Chrome.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-sm p-8 sm:p-10 text-center">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-indigo-100/50 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <MousePointerClick className="w-3.5 h-3.5 text-indigo-600" />
            Bouton d'installation rapide
          </div>

          <p className="text-sm font-medium text-slate-600 max-w-md mx-auto">
            Glissez ce bouton directement dans votre <strong>barre de favoris Chrome</strong> ou cliquez dessus pour copier le code :
          </p>

          {/* THE DRAGGABLE BOOKMARKLET BUTTON */}
          <div className="py-2">
            <a
              href={bookmarkletCode}
              draggable="true"
              onDragStart={handleDragStart}
              onClick={(e) => {
                e.preventDefault();
                handleCopy();
              }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold text-lg shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all cursor-grab active:cursor-grabbing border border-indigo-400/30 group"
              title="Glissez-moi dans votre barre de favoris !"
            >
              <Bookmark className="w-6 h-6 text-indigo-200 fill-indigo-200 group-hover:scale-110 transition-transform" />
              <span>⭐ Activer BetterSchool</span>
            </a>
          </div>

          {/* Keyboard tip */}
          <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <Laptop className="w-3.5 h-3.5" />
            <span>Barre de favoris masquée ? Affichez-la avec</span>
            <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] text-slate-700 font-bold">
              Ctrl + Shift + B
            </kbd>
            <span>(ou <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] text-slate-700 font-bold">⌘ Shift B</kbd> sur Mac)</span>
          </p>

          {/* Actions: Copy & Test */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Code javascript: copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copier l'URL JavaScript du favori</span>
                </>
              )}
            </button>

            <button
              onClick={() => setTestOverlayOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
              Tester l'overlay maintenant
            </button>
          </div>
        </div>
      </div>

      {/* 3 Step Instructions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white border border-slate-200/70 p-6 space-y-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
            1
          </div>
          <h3 className="text-sm font-bold text-slate-900">Glisser le favori</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Faites glisser le bouton violet ci-dessus dans la barre de favoris de votre navigateur Chrome.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/70 p-6 space-y-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
            2
          </div>
          <h3 className="text-sm font-bold text-slate-900">Ouvrir Smartschool</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Connectez-vous à votre espace Smartschool scolaire habituel dans un nouvel onglet Chrome.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/70 p-6 space-y-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
            3
          </div>
          <h3 className="text-sm font-bold text-slate-900">1 Clic pour basculer</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cliquez sur le favori : l'interface BetterSchool s'affiche instantanément par-dessus Smartschool avec vos données !
          </p>
        </div>
      </div>

      {/* Advanced / Source URL Config */}
      <div className="rounded-2xl bg-slate-100/80 border border-slate-200/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Paramètres du serveur cible
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">Auto-détecté</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={customOrigin}
            onChange={(e) => setCustomOrigin(e.target.value)}
            placeholder="http://localhost:3000 ou https://betterschool.dino.icu"
            className="w-full sm:flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setCustomOrigin(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
          >
            Réinitialiser
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Le bookmarklet pointera vers <code>{effectiveOrigin}</code>. Lorsque vous déployez BetterSchool en ligne, cette URL s'adapte automatiquement.
        </p>

        {/* Code Preview Collapsible */}
        <div className="space-y-1.5 pt-2">
          <label className="text-[11px] font-bold text-slate-600">Code JavaScript brut :</label>
          <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-3 rounded-xl overflow-x-auto max-h-24 select-all">
            {bookmarkletCode}
          </div>
        </div>
      </div>

      {/* Security & Info */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">100% Sécurisé et non invasif</p>
          <p className="text-emerald-800/80 leading-relaxed">
            Ce bookmarklet fonctionne entièrement en local dans votre navigateur. Il n'envoie aucune information à des tiers et ne modifie pas les serveurs de votre école. Vous pouvez fermer BetterSchool à tout moment avec la touche <kbd className="px-1.5 py-0.5 bg-white rounded border border-emerald-300 font-bold">Échap</kbd>.
          </p>
        </div>
      </div>

      {/* Test Overlay Modal */}
      {testOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Aperçu du fonctionnement</span>
              </div>
              <button
                onClick={() => setTestOverlayOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Lorsque vous cliquerez sur le favori dans Smartschool, un conteneur fluide s'ouvrira en plein écran avec l'interface BetterSchool.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
              <p>🎯 <strong>Raccourci de fermeture :</strong> Touche <kbd className="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">Échap</kbd></p>
              <p>🔘 <strong>Bouton flottant :</strong> Présent en bas à droite pour quitter d'un clic</p>
              <p>🎨 <strong>Favicon & Titre :</strong> L'icône et le titre de l'onglet Chrome passent automatiquement en BetterSchool et se restaurent à la fermeture.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTestOverlayOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                J'ai compris !
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

