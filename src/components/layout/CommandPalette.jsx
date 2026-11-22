import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, BookOpen, Compass, Layers, ArrowRight } from 'lucide-react';
import { normalizeArabicSearch } from '../../utils/arabicText.js';
import { ArabicText } from '../common/ArabicText.jsx';

export function CommandPalette({ isOpen, onClose, searchIndex, onNavigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const items = searchIndex?.items || [];
    const q = query.trim().toLowerCase();
    const qAr = normalizeArabicSearch(query);
    if (!q) return items.slice(0, 12);

    return items
      .filter((item) => {
        const hay = `${item.title} ${item.subtitle || ''} ${item.keywords || ''}`.toLowerCase();
        const hayAr = normalizeArabicSearch(`${item.ar || ''} ${item.kok || ''}`);
        return hay.includes(q) || (qAr && hayAr.includes(qAr));
      })
      .slice(0, 18);
  }, [query, searchIndex]);

  if (!isOpen) return null;

  const iconFor = (type) => {
    if (type === 'module') return BookOpen;
    if (type === 'card' || type === 'root') return Layers;
    return Compass;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hızlı Arama"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-popover)] overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
          <Search size={18} className="text-[var(--accent)] shrink-0" />
          <input
            ref={inputRef}
            id="input-command-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Modül, kural, Arapça kelime veya kök ara (Türkçe / harekesiz Arapça)..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto divide-y divide-[var(--border-subtle)]">
          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">
              &ldquo;{query}&rdquo; için sonuç bulunamadı.
            </div>
          ) : (
            results.map((item) => {
              const Icon = iconFor(item.type);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-2 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] shrink-0">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-xs text-[var(--text-muted)] truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.ar && (
                      <ArabicText text={item.ar} className="text-base text-[var(--accent-strong)]" />
                    )}
                    <ArrowRight size={14} className="text-[var(--text-muted)]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[var(--bg-subtle)]/70 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>55 modül + kökler + gramer + atlas içinde anlık arama</span>
          <span>ESC ile kapat</span>
        </div>
      </div>
    </div>
  );
}
