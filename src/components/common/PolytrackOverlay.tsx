import React, { useEffect, useRef } from 'react';
import {
  POLYTRACK_EXIT_MESSAGE_TYPE,
  POLYTRACK_SET_FROZEN_MESSAGE_TYPE,
  isExitPolytrackShortcut,
} from '../../utils/polytrackShortcuts';

interface PolytrackOverlayProps {
  isActive: boolean;
  onExit: () => void;
}

interface SavedHostState {
  title: string;
  htmlOverflow: string;
  bodyOverflow: string;
  iconHref: string | null;
  iconType: string | null;
}

/**
 * Full-viewport overlay hosting the local PolyTrack game.
 * Preserves the game instance when hidden by pausing and freezing rendering,
 * physics workers, and audio, then restores BetterSchool's title, favicon,
 * and scroll state.
 */
export const PolytrackOverlay: React.FC<PolytrackOverlayProps> = ({ isActive, onExit }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeKeyCleanupRef = useRef<(() => void) | null>(null);
  const savedHostStateRef = useRef<SavedHostState | null>(null);
  const onExitRef = useRef(onExit);
  const isActiveRef = useRef(isActive);
  onExitRef.current = onExit;
  isActiveRef.current = isActive;

  const restoreHostState = () => {
    const saved = savedHostStateRef.current;
    if (!saved) return;
    savedHostStateRef.current = null;

    document.title = saved.title;
    document.documentElement.style.overflow = saved.htmlOverflow;
    document.body.style.overflow = saved.bodyOverflow;

    const iconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (iconLink) {
      if (saved.iconHref !== null) {
        iconLink.setAttribute('href', saved.iconHref);
      } else {
        iconLink.removeAttribute('href');
      }
      if (saved.iconType !== null) {
        iconLink.setAttribute('type', saved.iconType);
      } else {
        iconLink.removeAttribute('type');
      }
    }
  };

  const postFrozenState = (frozen: boolean) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: POLYTRACK_SET_FROZEN_MESSAGE_TYPE, frozen },
        window.location.origin
      );
    } catch {
      // Ignore if iframe is not ready yet; handleIframeLoad will sync it
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === POLYTRACK_EXIT_MESSAGE_TYPE) {
        onExitRef.current();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframeKeyCleanupRef.current) {
        iframeKeyCleanupRef.current();
        iframeKeyCleanupRef.current = null;
      }
      restoreHostState();
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      if (!savedHostStateRef.current) {
        const iconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
        savedHostStateRef.current = {
          title: document.title,
          htmlOverflow: document.documentElement.style.overflow,
          bodyOverflow: document.body.style.overflow,
          iconHref: iconLink?.getAttribute('href') ?? null,
          iconType: iconLink?.getAttribute('type') ?? null,
        };

        if (iconLink) {
          iconLink.setAttribute('href', '/polytrack/images/icon.svg');
          iconLink.setAttribute('type', 'image/svg+xml');
        }
      }

      document.title = 'PolyTrack';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      postFrozenState(false);
      iframeRef.current?.focus();
      iframeRef.current?.contentWindow?.focus();
    } else {
      postFrozenState(true);
      restoreHostState();
      window.focus();
    }
  }, [isActive]);

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    postFrozenState(!isActiveRef.current);

    if (isActiveRef.current) {
      iframe.focus();
      iframe.contentWindow?.focus();
    }

    if (iframeKeyCleanupRef.current) {
      iframeKeyCleanupRef.current();
      iframeKeyCleanupRef.current = null;
    }

    try {
      const contentWindow = iframe.contentWindow;
      if (!contentWindow) return;

      const handleIframeKeyDown = (e: KeyboardEvent) => {
        if (isExitPolytrackShortcut(e)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          postFrozenState(true);
          onExitRef.current();
        }
      };

      contentWindow.addEventListener('keydown', handleIframeKeyDown, true);
      iframeKeyCleanupRef.current = () => {
        try {
          contentWindow.removeEventListener('keydown', handleIframeKeyDown, true);
        } catch {
          // Ignore cleanup errors if frame is already detached
        }
      };
    } catch {
      // Same-origin listener is handled inside /polytrack/index.html via postMessage
    }
  };

  return (
    <div
      aria-hidden={!isActive}
      className={
        isActive
          ? 'fixed inset-0 z-[99999] w-screen h-screen bg-black m-0 p-0 overflow-hidden'
          : 'hidden'
      }
    >
      <iframe
        ref={iframeRef}
        src="/polytrack/index.html"
        title="PolyTrack"
        className="w-full h-full border-0 block"
        allow="fullscreen; autoplay; gamepad"
        allowFullScreen
        onLoad={handleIframeLoad}
      />
    </div>
  );
};
