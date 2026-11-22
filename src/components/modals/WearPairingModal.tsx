import React, { useState, useEffect, useRef } from 'react';
import {
  Watch,
  X,
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  UserCheck
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { getActiveUserId, getPlatformIdFromContext, getCachedRealEvaluations } from '../../services/smartschoolApi';
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
    todayEvents,
    homeworks,
    mailMessages
  } = useSchool();

  const [pairCode, setPairCode] = useState(initialPairCode);
  const [schoolHost, setSchoolHost] = useState('https://jean23.smartschool.be');
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

  // Détection silencieuse et automatique de la session Smartschool active (aucune saisie manuelle)
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
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
                handlePushSession(extracted);
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

    setIsSubmitting(true);
    setStatusMessage(null);

    // L'identifiant est extrait exclusivement de la session authentifiée (non modifiable par l'utilisateur)
    const verifiedUserId = getActiveUserId() || student?.ineNumber || '';
    const verifiedPlatformId = getPlatformIdFromContext() || '4907';
    const realEvals = getCachedRealEvaluations() || [];

    const sessionPayload = {
      version: 1,
      host: schoolHost.replace(/\/+$/, ''),
      userId: verifiedUserId,
      platformId: verifiedPlatformId,
      studentName: student ? `${student.firstName} ${student.lastName}`.trim() : 'Élève BetterSchool',
      studentClass: student?.studentClass || '',
      schoolName: student?.schoolName || 'Smartschool',
      cookies: cookiesStr.trim(),
      isDemoMode,
      pairedAt: new Date().toISOString(),
      // Synchronisation directe des données de la session active (fonctionne même si PHPSESSID est HttpOnly)
      snapshot: {
        courses: todayEvents.slice(0, 12).map((c) => ({
          id: c.id,
          subject: c.subject,
          subjectCode: c.subjectCode,
          teacher: c.teacher,
          room: c.room,
          startTime: c.startTime,
          endTime: c.endTime,
          date: c.date,
          status: c.status
        })),
        homeworks: homeworks.slice(0, 15).map((h) => ({
          id: h.id,
          assignmentId: h.assignmentId || h.id,
          platformId: h.platformId || verifiedPlatformId,
          subject: h.subject,
          title: h.title,
          dueDate: h.dueDate,
          dueTime: h.dueTime || '',
          isCompleted: h.isCompleted
        })),
        messages: mailMessages.slice(0, 10).map((m) => ({
          id: m.id,
          senderName: m.from,
          subject: m.subject,
          dateLabel: m.date,
          previewSnippet: m.snippet || m.subject,
          isUnread: m.unread
        })),
        grades: realEvals.slice(0, 10).map((ev) => ({
          id: ev.identifier,
          subject: ev.courses?.[0]?.name || 'Matière',
          title: ev.name,
          scoreText: ev.graphic?.description || `${ev.graphic?.value || ''}%`,
          percentage: typeof ev.graphic?.value === 'number' ? ev.graphic.value : 75,
          date: (ev.date || '').slice(0, 10),
          colorName: ev.graphic?.color || 'green',
          teacherName: ev.gradebookOwner?.name?.startingWithLastName || ''
        }))
      }
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
      setStatusMessage({
        type: 'success',
        text: 'Votre montre est connectée ! Vos horaires, messages et notes sont synchronisés.'
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Impossible de joindre la montre. Vérifiez que le code à 6 chiffres est toujours affiché sur son écran.'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-modal border border-slate-200/80 overflow-hidden">
        {/* En-tête épuré */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-glow">
              <Watch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Ma Montre Wear OS
              </h2>
              <p className="text-xs text-slate-300">
                Connexion rapide en 1 clic
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

        {/* Corps simplifié sans jargon technique */}
        <div className="p-6 space-y-5">
          {/* Bouton bien visible pour télécharger l'APK Wear OS */}
          <div className="p-4 rounded-2xl bg-indigo-600 text-white flex items-center justify-between gap-3 shadow-subtle">
            <div className="min-w-0">
              <p className="text-xs font-extrabold">
                Application BetterSchool Wear OS
              </p>
              <p className="text-[11px] text-indigo-100 mt-0.5">
                Fichier d'installation Android Wear (.apk)
              </p>
            </div>
            <a
              href="/betterschool-wearos.apk"
              download="betterschool-wearos.apk"
              className="shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition-all m3-press"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger l'APK</span>
            </a>
          </div>

          {/* Compte actuellement connecté (Verrouillé & Non modifiable pour empêcher toute usurpation) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {student ? `${student.firstName} ${student.lastName}` : 'Compte Élève'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {isDemoMode ? 'Mode Démo' : `${student?.schoolName || 'Smartschool'} • ${student?.studentClass || ''}`}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
              Session vérifiée
            </span>
          </div>

          {/* Étape unique : Scanner le QR de la montre ou entrer le code à 6 chiffres */}
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <QrCode className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                Sur votre montre, ouvrez <strong>BetterSchool</strong> et appuyez sur <strong>Afficher QR Code</strong>, puis scannez-le ou tapez le code à 6 chiffres :
              </p>
            </div>

            {!isScanningCamera ? (
              <button
                type="button"
                onClick={startCameraScan}
                className="w-full py-2.5 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 border border-indigo-200/80 transition-all m3-press"
              >
                <Camera className="w-4 h-4" />
                <span>Scanner le QR Code de la montre</span>
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
                  <div className="w-40 h-40 border-2 border-indigo-400 rounded-3xl shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
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

            <div>
              <input
                type="text"
                maxLength={7}
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                placeholder="CODE À 6 CHIFFRES (EX: 482915)"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 font-mono text-base font-extrabold tracking-widest text-center uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Message de confirmation ou d'erreur */}
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

          {/* Bouton principal de connexion */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handlePushSession()}
            className="w-full py-3 px-5 rounded-2xl bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-subtle m3-press"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connexion à la montre...</span>
              </>
            ) : (
              <>
                <Watch className="w-4 h-4" />
                <span>Connecter ma montre</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
