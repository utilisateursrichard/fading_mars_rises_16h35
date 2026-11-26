export const POLYTRACK_EXIT_MESSAGE_TYPE = 'BETTERSCHOOL_POLYTRACK_EXIT';
export const POLYTRACK_SET_FROZEN_MESSAGE_TYPE = 'BETTERSCHOOL_POLYTRACK_SET_FROZEN';

function isAngleBracketKey(e: KeyboardEvent): boolean {
  const legacyKeyCode = e.keyCode || e.which;
  return (
    e.key === '>' ||
    e.key === '<' ||
    e.code === 'IntlBackslash' ||
    legacyKeyCode === 226 ||
    legacyKeyCode === 60 ||
    legacyKeyCode === 62
  );
}

/**
 * Detects Ctrl + Shift + > or Ctrl + Shift + < (when Shift turns < into > on AZERTY).
 * Handles ISO AZERTY (IntlBackslash), Mac AZERTY (Backquote), QWERTY (Shift + Period),
 * X11/Wayland/browser cases where Ctrl suppresses Shift on e.key, and direct '>' with Ctrl.
 */
export function isEnterPolytrackShortcut(e: KeyboardEvent): boolean {
  if (e.repeat || !e.ctrlKey || e.altKey || e.metaKey) return false;
  if (e.key === '>') return true;
  if (e.shiftKey && e.code !== 'Comma' && isAngleBracketKey(e)) return true;
  return false;
}

/**
 * Detects Ctrl + < (AZERTY unshifted <) or Ctrl + Shift + < (QWERTY Shift + Comma).
 * Mutually exclusive with isEnterPolytrackShortcut.
 */
export function isExitPolytrackShortcut(e: KeyboardEvent): boolean {
  if (e.repeat || !e.ctrlKey || e.altKey || e.metaKey) return false;
  if (!e.shiftKey && e.key !== '>' && isAngleBracketKey(e)) return true;
  if (e.shiftKey && e.code === 'Comma' && e.key === '<') return true;
  return false;
}
