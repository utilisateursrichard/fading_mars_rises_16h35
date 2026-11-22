import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Watch,
  X,
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  UserCheck,
  HelpCircle,
  Copy,
  Check,
  Terminal,
  Smartphone,
  Settings,
  Wifi,
  Lock,
  ChevronDown,
  ChevronUp
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
  const {
    student,
    isDemoMode,
    overallStats,
    activePeriodName
  } = useSchool();

  const [pairCode, setPairCode] = useState(initialPairCode);
  const [schoolHost, setSchoolHost] = useState('https://jean23.smartschool.be');
  const [smartschoolUsername, setSmartschoolUsername] = useState('');
  const [smartschoolPassword, setSmartschoolPassword] = useState('');
  const [smartschoolBirthDate, setSmartschoolBirthDate] = useState('');
  const [cookiesStr, setCookiesStr] = useState('');
  const [showAdvancedSession, setShowAdvancedSession] = useState(false);

  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [copiedCmdIndex, setCopiedCmdIndex] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialPairCode) {
      setPairCode(initialPairCode.replace(/[^0-9A-Z]/gi, '').toUpperCase().slice(0, 6));
    }
  }, [initialPairCode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTutorialOpen) {
          setIsTutorialOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isTutorialOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const refOrigin = new URL(document.referrer).origin;
        if (refOrigin.includes('smartschool.be')) {
          setSchoolHost(refOrigin);
        }
      } catch {}
    }

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
      setCameraError('Caméra non détectée sur cet appareil. Entrez simplement le code à 6 chiffres affiché sur votre montre.');
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
              }
            }
          } catch {}
        }, 400);
      } else {
        setCameraError('Scannez le QR Code avec l\'appareil photo de votre téléphone ou tapez le code à 6 chiffres ci-dessous.');
      }
    } catch {
      setCameraError('Impossible d\'ouvrir la caméra. Entrez le code à 6 chiffres affiché sur la montre.');
      setIsScanningCamera(false);
    }
  };

  const handlePushSession = async (overrideCode?: string) => {
    const cleanCode = (overrideCode || pairCode).replace(/[^0-9A-Z]/gi, '').toUpperCase();
    if (cleanCode.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'Entrez le code à 6 chiffres affiché sur votre montre ou scannez son QR Code.'
      });
      return;
    }

    const hasCreds =
      smartschoolUsername.trim().length > 0 &&
      smartschoolPassword.length > 0 &&
      smartschoolBirthDate.trim().length > 0;
    const hasPhpSessId = cookiesStr.includes('PHPSESSID=');

    if (!hasCreds && !hasPhpSessId) {
      setStatusMessage({
        type: 'error',
        text: 'Veuillez renseigner votre identifiant, votre mot de passe ET votre date de naissance Smartschool (nécessaire pour /account-verification).'
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const verifiedUserId = getActiveUserId() || student?.ineNumber || '';
    const verifiedPlatformId = getPlatformIdFromContext() || '4907';
    const exactWebAveragePct = overallStats?.currentPct ?? overallStats?.current ?? undefined;

    // AUCUN snapshot statique n'est envoyé : la montre reçoit uniquement sa session
    // et exécute elle-même 100% des requêtes HTTP vers Smartschool.
    const sessionPayload = {
      version: 2,
      host: schoolHost.trim().replace(/\/+$/, ''),
      userId: verifiedUserId,
      platformId: verifiedPlatformId,
      studentName: student ? `${student.firstName} ${student.lastName}`.trim() : '',
      studentClass: student?.studentClass || '',
      schoolName: student?.schoolName || 'Smartschool',
      username: smartschoolUsername.trim(),
      password: smartschoolPassword,
      birthDate: smartschoolBirthDate.trim(),
      cookies: cookiesStr.trim(),
      isDemoMode: false,
      activePeriod: activePeriodName || '',
      overallAveragePct: exactWebAveragePct,
      pairedAt: new Date().toISOString()
    };

    const endpoints = [
      '/api/wear-pair/push',
      'https://betterschool.dino.icu/api/wear-pair/push'
    ];

    let succeeded = false;
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
      } catch {}
    }

    setIsSubmitting(false);

    if (succeeded) {
      setSmartschoolPassword('');
      setStatusMessage({
        type: 'success',
        text: 'Montre associée ! Elle se connecte maintenant directement à Smartschool en totale autonomie.'
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Impossible de joindre la montre. Vérifiez que le code à 6 chiffres est toujours affiché sur son écran.'
      });
    }
  };

  const handleCopyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedCmdIndex(idx);
    setTimeout(() => setCopiedCmdIndex(null), 1800);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const tutorialCommands = [
    {
      label: '1. Associer la montre en Wi-Fi (une seule fois)',
      cmd: 'adb pair <IP_MONTRE>:<PORT_ASSOCIATION> <CODE_6_CHIFFRES>'
    },
    {
      label: '2. Connecter ADB à la montre',
      cmd: 'adb connect <IP_MONTRE>:<PORT_CONNEXION>'
    },
    {
      label: '3. Installer l’application BetterSchool Wear OS',
      cmd: 'adb install -r betterschool-wearos.apk'
    }
  ];

  return createPortal(
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="wear-modal-slide-bounce relative w-full max-w-md my-auto bg-white rounded-[28px] shadow-modal border border-slate-200/80 overflow-hidden"
        >
          {/* En-tête M3E Pro */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center shrink-0">
                <Watch className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg leading-6 font-bold tracking-tight text-slate-900 truncate">
                  Montre Wear OS
                </h3>
                <p className="font-sans text-xs leading-4 font-medium text-slate-500 truncate">
                  Connexion autonome directe à Smartschool
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsTutorialOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors m3-press"
                title="Tutoriel complet d'installation sur Wear OS"
                aria-label="Tutoriel d'installation"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors m3-press"
                title="Fermer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corps M3E Pro */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            {/* Carte Téléchargement APK */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[15px] leading-5 font-bold tracking-tight text-slate-900">
                    Application Wear OS
                  </span>
                  <span className="font-sans text-[11px] leading-[14px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                    APK
                  </span>
                </div>
                <p className="font-sans text-xs leading-4 font-medium text-slate-500 mt-0.5">
                  Besoin d'aide ? Cliquez sur <strong>?</strong> en haut à droite.
                </p>
              </div>
              <a
                href="/betterschool-wearos.apk"
                download="betterschool-wearos.apk"
                className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-sans text-xs leading-4 font-bold inline-flex items-center gap-1.5 shadow-subtle transition-all m3-press"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </a>
            </div>

            {/* Identifiants Smartschool stockés uniquement sur la montre pour requêtes 100% autonomes */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Identifiants Smartschool (sur la montre)</span>
                </span>
                <span className="font-sans text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Auto-login direct
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-sans text-[11px] font-bold text-slate-600 mb-1">
                    Identifiant Smartschool
                  </label>
                  <input
                    type="text"
                    value={smartschoolUsername}
                    onChange={(e) => setSmartschoolUsername(e.target.value)}
                    placeholder="Ex: e9139"
                    className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 font-sans text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[11px] font-bold text-slate-600 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={smartschoolPassword}
                    onChange={(e) => setSmartschoolPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 font-sans text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-[11px] font-bold text-slate-600 mb-1">
                  Date de naissance (vérification Smartschool)
                </label>
                <input
                  type="date"
                  value={smartschoolBirthDate}
                  onChange={(e) => setSmartschoolBirthDate(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 font-sans text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedSession(!showAdvancedSession)}
                className="font-sans text-[11px] font-bold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
              >
                {showAdvancedSession ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Options avancées (École / Cookie PHPSESSID)</span>
              </button>

              {showAdvancedSession && (
                <div className="space-y-2.5 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="block font-sans text-[11px] font-bold text-slate-600 mb-1">
                      École Smartschool
                    </label>
                    <input
                      type="text"
                      value={schoolHost}
                      onChange={(e) => setSchoolHost(e.target.value)}
                      placeholder="https://jean23.smartschool.be"
                      className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 font-mono text-[11px] text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[11px] font-bold text-slate-600 mb-1">
                      Ou Cookie de session direct (si connexion SSO Google/Microsoft)
                    </label>
                    <input
                      type="text"
                      value={cookiesStr}
                      onChange={(e) => setCookiesStr(e.target.value)}
                      placeholder="PHPSESSID=...; smscndc=...; pid=..."
                      className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 font-mono text-[11px] text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section Code à 6 chiffres / Scan QR de la montre */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-sans text-[11px] leading-[14px] font-bold uppercase tracking-wider text-slate-500">
                  Code affiché sur la montre
                </label>
                {!isScanningCamera && (
                  <button
                    type="button"
                    onClick={startCameraScan}
                    className="font-sans text-xs leading-4 font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scanner le QR Code</span>
                  </button>
                )}
              </div>

              {isScanningCamera && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-36 h-36 border-2 border-indigo-400 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
                  </div>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-slate-900/90 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {cameraError && (
                <p className="font-sans text-xs leading-4 font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  {cameraError}
                </p>
              )}

              <input
                type="text"
                maxLength={7}
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                placeholder="Code à 6 chiffres (ex: 482 915)"
                className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 font-mono text-sm font-semibold tracking-wider text-center uppercase text-slate-800 placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-2xl border flex items-start gap-2.5 font-sans text-xs leading-4 font-medium ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
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

            {/* Pied de modale M3E Pro */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-sans text-xs leading-4 font-bold text-slate-500 hover:bg-slate-100 transition-colors m3-press"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePushSession()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-sans text-xs leading-4 font-bold inline-flex items-center gap-1.5 shadow-subtle transition-all m3-press"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Connecter la montre</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seconde Pop-up M3E Pro : Tutoriel Complet d'Installation Wear OS */}
      {isTutorialOpen && (
        <div
          onClick={() => setIsTutorialOpen(false)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/55 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="wear-modal-slide-bounce relative w-full max-w-lg my-auto bg-white rounded-[28px] shadow-modal border border-slate-200/80 overflow-hidden"
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg leading-6 font-bold tracking-tight text-slate-900">
                    Tutoriel d'installation Wear OS
                  </h3>
                  <p className="font-sans text-xs leading-4 font-medium text-slate-500">
                    Guide pas-à-pas du téléchargement jusqu'à l'appairage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTutorialOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors m3-press"
                aria-label="Fermer le tutoriel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/70 font-sans text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-display text-[15px] leading-5 font-bold tracking-tight text-slate-900">
                      Télécharger le fichier APK
                    </h4>
                  </div>
                  <a
                    href="/betterschool-wearos.apk"
                    download="betterschool-wearos.apk"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-sans text-xs leading-4 font-bold inline-flex items-center gap-1.5 shadow-subtle transition-all m3-press"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>betterschool-wearos.apk</span>
                  </a>
                </div>
                <p className="font-sans text-xs leading-4 font-medium text-slate-600">
                  Enregistrez le fichier <code>betterschool-wearos.apk</code> sur votre ordinateur ou sur votre téléphone Android.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/70 font-sans text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="font-display text-[15px] leading-5 font-bold tracking-tight text-slate-900">
                    Préparer la montre (Débogage Wi-Fi)
                  </h4>
                </div>
                <ul className="font-sans text-xs leading-5 font-medium text-slate-600 space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      Sur la montre, ouvrez <strong>Paramètres &gt; Système &gt; À propos</strong> et appuyez <strong>7 fois</strong> sur <strong>Numéro de build</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Wifi className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Revenez dans <strong>Paramètres &gt; Options pour les développeurs</strong>, activez <strong>Débogage ADB</strong> puis <strong>Débogage sans fil</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      Appuyez sur <strong>Associer un nouvel appareil</strong> pour afficher l'adresse IP, le port et le code à 6 chiffres.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/70 font-sans text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h4 className="font-display text-[15px] leading-5 font-bold tracking-tight text-slate-900">
                    Commandes à exécuter dans votre terminal
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {tutorialCommands.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="font-sans text-[11px] leading-[14px] font-bold text-slate-500">
                        {item.label}
                      </p>
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <code className="font-mono text-[11px] leading-[14px] font-semibold text-slate-800 truncate">
                            {item.cmd}
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCommand(item.cmd, idx)}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-sans text-[11px] leading-[14px] font-bold inline-flex items-center gap-1 transition-colors m3-press"
                        >
                          {copiedCmdIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-display text-[15px] leading-5 font-bold tracking-tight text-slate-900">
                    Alternative sans PC (depuis un téléphone Android)
                  </h4>
                </div>
                <p className="font-sans text-xs leading-4 font-medium text-slate-600">
                  Installez l'application gratuite <strong>Wear Installer 2</strong> ou <strong>Bugjaeger</strong> depuis le Play Store, entrez l'adresse IP de votre montre et sélectionnez le fichier <code>betterschool-wearos.apk</code> téléchargé.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsTutorialOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-sans text-xs leading-4 font-bold shadow-subtle transition-all m3-press"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
