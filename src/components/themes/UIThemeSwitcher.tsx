import React, { useState, useEffect, useRef } from 'react';
import { Settings, Check, X } from 'lucide-react';
import { UI_THEMES, useUITheme } from '../../context/UIThemeContext';

/**
 * Floating gear button that opens a persistent theme selector popover (saved in cookies).
 */
export const UIThemeSwitcher: React.FC = () => {
  const { uiTheme, setUiTheme } = useUITheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = uiTheme === 'obsidian' || uiTheme === 'nova';

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 lg:bottom-4 right-4 z-[9000] select-none flex flex-col items-end gap-2"
    >
      {isOpen && (
        <div
          role="dialog"
          aria-label="Choisir le thème de l'interface"
          className={`w-64 p-2.5 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isDark
              ? 'bg-[#141720]/95 border-white/15 text-slate-100'
              : 'bg-white/95 border-slate-200/90 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-65">
              Thème de l'interface
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {UI_THEMES.map((theme) => {
              const active = uiTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setUiTheme(theme.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                    active
                      ? isDark
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'bg-slate-900 text-white shadow-xs'
                      : isDark
                        ? 'text-slate-200 hover:bg-white/10'
                        : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 ring-1 ring-black/15 flex items-center justify-center"
                      style={{ backgroundColor: theme.previewBg }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: theme.previewAccent }}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{theme.label}</div>
                      <div
                        className={`text-[10px] leading-tight truncate ${
                          active ? 'opacity-75' : 'opacity-55'
                        }`}
                      >
                        {theme.shortTag}
                      </div>
                    </div>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Paramètres de thème"
        aria-label="Changer le thème"
        aria-expanded={isOpen}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-md transition-all active:scale-95 ${
          isDark
            ? 'bg-[#161922]/95 text-slate-100 border-white/15 hover:bg-[#1E2230]'
            : 'bg-white/95 text-slate-800 border-slate-300/80 hover:bg-slate-50'
        }`}
      >
        <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
    </div>
  );
};
