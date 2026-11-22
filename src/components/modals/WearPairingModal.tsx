import React, { useState, useEffect, useRef } from 'react';
import {
  Watch,
  X,
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  KeyRound,
  Download,
  Terminal
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { getActiveUserId, getPlatformIdFromContext } from '../../services/smartschoolApi';
import { getHostPageInfo, evalHostExpression } from '../../services/smartschoolBridge';

interface WearPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPairCode?: string;
}

export const WearPairingModal: React.FC<WearPairingModalProps> = ({
  isOpen,
  onClose,
  initialPairCode = ''
}) => {
  const { student, isDemoMode } = useSchool();

  const [pairCode, setPairCode] = useState(initialPairCode);
  const [schoolHost, setSchoolHost] = useState('https://jean23.smartschool.be');
  const [userId, setUserId] = useState('4907_5748_0');
  const [platformId, setPlatformId] = useState('4907');
  const [cookiesStr, setCookiesStr] = useState('');
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialPairCode) {
      setPairCode(initialPairCode.replace(/[^0-9A-Z]/gi, '').toUpperCase().slice(0, 6));
    }
  }, [initialPairCode]);

  // Récupération automatique du contexte Smartschool actif (hôte, userId, cookies non-HttpOnly)
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    const activeId = getActiveUserId();
    if (activeId) setUserId(activeId);

    const platId = getPlatformIdFromContext();
    if (platId) setPlatformId(platId);

    getHostPageInfo().then((info) => {
      if (info.ok && info.data?.origin && info.data.origin.includes('smartschool.be')) {
        setSchoolHost(info.data.origin);
      }
    });

    evalHostExpression('document.cookie').then((res) => {
      if (res.ok && typeof res.result === 'string' && res.result.trim()) {
        setCookiesStr(res.result.trim());
      }
    });
  }, [isOpen]);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanningCamera(false);
  };

  const extractCodeFromScannedValue = (rawValue: string): string | null => {
    const trimmed = rawValue.trim();
    try {
      const url = new URL(trimmed);
      const codeParam = url.searchParams.get('wearPair');
      if (codeParam) {
        return codeParam.replace(/[^0-9A-Z]/gi, '').toUpperCase().slice(0, 6);
      }
    } catch {}
    const match = trimmed.match(/\b([0-9A-Z]{6})\b/i);
    return match ? match[1].toUpperCase() : null;
  };

  const startCameraScan = async () => {
    setCameraError(null);
    setStatusMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('La caméra n\'est pas disponible sur ce navigateur. Saisissez le code à 6 chiffres affiché sous le QR Code de la montre.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setIsScanningCamera(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);

      // Utilisation de l'API native BarcodeDetector (Chrome Android / Desktop)
      const BarcodeDetectorApi = (window as any).BarcodeDetector;
      if (BarcodeDetectorApi) {
        const detector = new BarcodeDetectorApi({ formats: ['qr_code'] });
        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const raw = barcodes[0].rawValue || '';
              const extracted = extractCodeFromScannedValue(raw);
              if (extracted) {
                setPairCode(extracted);
                stopCamera();
                handlePushSession(extracted);
              }
            }
          } catch {}
        }, 400);
      } else {
        setCameraError('Votre navigateur ne supporte pas le décodage QR natif. Scannez le QR Code de la montre avec l\'appareil photo de votre téléphone ou tapez le code à 6 chiffres ci-dessous.');
      }
    } catch (err: any) {
      setCameraError('Impossible d\'accéder à la caméra. Saisissez simplement le code à 6 chiffres affiché sur la montre.');
      setIsScanningCamera(false);
    }
  };

  const handlePushSession = async (overrideCode?: string) => {
    const cleanCode = (overrideCode || pairCode).replace(/[^0-9A-Z]/gi, '').toUpperCase();
    if (cleanCode.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'Veuillez scanner le QR Code de la montre ou entrer le code à 6 caractères affiché sur votre montre.'
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const sessionPayload = {
      version: 1,
      host: schoolHost.replace(/\/+$/, ''),
      userId: userId.trim(),
      platformId: platformId.trim(),
      studentName: student ? `${student.firstName} ${student.lastName}`.trim() : 'Élève BetterSchool',
      studentClass: student?.studentClass || '4T1',
      schoolName: student?.schoolName || 'Collège Jean XXIII',
      cookies: cookiesStr.trim(),
      isDemoMode: isDemoMode && !cookiesStr.trim(),
      pairedAt: new Date().toISOString()
    };

    // Envoi vers le relais courant ET/OU betterschool.dino.icu si exécuté depuis le bookmarklet sur smartschool.be
    const endpoints = [
      '/api/wear-pair/push',
      'https://betterschool.dino.icu/api/wear-pair/push'
    ];

    let succeeded = false;
    let lastError = '';

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: cleanCode,
            session: sessionPayload
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            succeeded = true;
            break;
          }
        }
      } catch (e: any) {
        lastError = e?.message || 'Erreur réseau';
      }
    }

    setIsSubmitting(false);

    if (succeeded) {
      setStatusMessage({
        type: 'success',
        text: `Montre connectée avec succès (Code ${cleanCode}) ! Votre montre Wear OS récupère maintenant vos données directement sur Smartschool.`
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `Impossible de joindre le relais d'appairage (${lastError || 'vérifiez votre connexion'}).`
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-modal border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-glow">
              <Watch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Connecter BetterSchool Wear OS
              </h2>
              <p className="text-xs text-slate-300">
                Scannez le QR Code affiché sur votre montre
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Téléchargement & Installation de l'APK sur la montre */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                  1. Installer l'app sur votre montre
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Téléchargez l'APK Wear OS puis installez-le en Wi-Fi via ADB ou Wear Installer 2.
                </p>
              </div>
              <a
                href="/betterschool-wearos.apk"
                download="betterschool-wearos.apk"
                className="shrink-0 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-subtle transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger l'APK</span>
              </a>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2 font-mono text-[11px] text-emerald-400">
              <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">adb connect &lt;IP_MONTRE&gt;:&lt;PORT&gt; &amp;&amp; adb install betterschool-wearos.apk</span>
            </div>
          </div>

          {/* Explication du flux */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3">
            <QrCode className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">2. Appairer votre session :</span> Ouvrez <strong>BetterSchool</strong> sur votre montre Wear OS et glissez jusqu'à l'écran <em>Connexion</em> (tout à droite). La montre affiche un <strong>QR Code</strong> et un <strong>code à 6 chiffres</strong>.
            </div>
          </div>

          {/* Bouton Scanner Caméra ou Vue Caméra */}
          <div className="space-y-3">
            {!isScanningCamera ? (
              <button
                type="button"
                onClick={startCameraScan}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-all m3-press"
              >
                <Camera className="w-4 h-4" />
                <span>Scanner le QR Code de la montre avec la caméra</span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-44 border-2 border-indigo-400 rounded-3xl shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
                >
                  Fermer caméra
                </button>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                {cameraError}
              </p>
            )}
          </div>

          {/* Code à 6 chiffres affiché sous le QR de la montre */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Code à 6 chiffres affiché sur la montre
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={7}
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                placeholder="Ex: 482915"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-lg font-extrabold tracking-widest text-center uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Paramètres de session Smartschool transmis à la montre */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                Session Smartschool transmise à la montre
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Requêtes directes Kotlin (Sans CORS)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Serveur Smartschool
                </label>
                <input
                  type="text"
                  value={schoolHost}
                  onChange={(e) => setSchoolHost(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Identifiant Élève (`userId`)
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Cookies de session (`PHPSESSID=...; smscndc=...; pid=...`)
              </label>
              <textarea
                rows={2}
                value={cookiesStr}
                onChange={(e) => setCookiesStr(e.target.value)}
                placeholder="PHPSESSID=votre_session; smscndc=...; pid=... (Laissez vide pour activer le Mode Démo sur la montre)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                La montre utilisera ce token pour interroger directement <code>{schoolHost}</code> en autonomie complète.
              </p>
            </div>
          </div>

          {/* Message de statut */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Bouton d'envoi */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePushSession()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-subtle m3-press"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi vers la montre...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Transférer la session à la montre</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
