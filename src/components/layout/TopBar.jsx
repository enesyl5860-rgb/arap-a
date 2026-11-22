import React from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Download,
  Gauge,
  Flame,
  BookOpen
} from 'lucide-react';
import { useProgress } from '../../context/ProgressContext.jsx';
import { HARAKA_MODES } from '../../utils/arabicText.js';
import { SPEECH_RATES } from '../../utils/speechEngine.js';

export function TopBar({
  onToggleSidebar,
  onOpenSearch,
  onOpenBackup,
  activeModuleMeta,
  activeSectionTitle
}) {
  const { progress, stats, theme, toggleTheme, setHarakaMode, setSpeechRate } = useProgress();
  const harakaMode = progress.settings.harakaMode;
  const speechRate = progress.settings.speechRate;
  const goalPct = Math.min(100, Math.round((stats.todayCount / Math.max(1, stats.dailyGoal)) * 100));

  const cycleSpeechRate = () => {
    const idx = SPEECH_RATES.findIndex((r) => r.value === speechRate);
    const next = SPEECH_RATES[(idx + 1) % SPEECH_RATES.length];
    setSpeechRate(next.value);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/92 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-5 h-15">
        {/* Sol: Menü + Aktif Konum */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            aria-label="Kenar çubuğunu aç/kapat"
            className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {activeSectionTitle}
              </span>
              {activeModuleMeta && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <BookOpen size={12} />
                  M{activeModuleMeta.id} · {activeModuleMeta.cefr}
                </span>
              )}
            </div>
            {activeModuleMeta && (
              <p className="hidden md:block text-xs text-[var(--text-muted)] truncate max-w-md">
                {activeModuleMeta.title}
              </p>
            )}
          </div>
        </div>

        {/* Sağ: 3 Kademeli Hareke Köprüsü + Hız + Arama + Seri + Tema + Yedek */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 3 Kademeli Hareke Anahtarı */}
          <div
            role="group"
            aria-label="3 Kademeli Hareke Köprüsü"
            className="hidden md:flex items-center p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]"
          >
            {HARAKA_MODES.map((m) => {
              const active = harakaMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  id={`btn-haraka-${m.id}`}
                  onClick={() => setHarakaMode(m.id)}
                  title={m.description}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {m.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Ses Hızı */}
          <button
            type="button"
            id="btn-speech-rate"
            onClick={cycleSpeechRate}
            title="Seslendirme hızını değiştir (0.7x / 0.85x / 1.0x)"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
          >
            <Gauge size={14} className="text-[var(--accent)]" />
            <span>{speechRate}x</span>
          </button>

          {/* Günlük Seri & Hedef */}
          <div
            title={`Günlük hedef: ${stats.todayCount}/${stats.dailyGoal} (${goalPct}%) · Seri: ${stats.streakDays} gün`}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)]"
          >
            <Flame size={14} className="text-[var(--amber)]" />
            <span>{stats.streakDays}g</span>
            <span className="text-[var(--border-strong)]">|</span>
            <span>
              {stats.todayCount}/{stats.dailyGoal}
            </span>
          </div>

          {/* Hızlı Arama (Ctrl+K) */}
          <button
            type="button"
            id="btn-open-search"
            onClick={onOpenSearch}
            title="Hızlı Arama (Ctrl+K)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs text-[var(--text-secondary)] cursor-pointer"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Ara</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* JSON Yedekleme */}
          <button
            type="button"
            id="btn-open-backup"
            onClick={onOpenBackup}
            title="İlerlemeyi Dışa Aktar / İçe Aktar (JSON)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Yedek</span>
          </button>

          {/* Tema Değiştirici */}
          <button
            type="button"
            id="btn-toggle-theme"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            aria-label="Temayı değiştir"
            className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-secondary)] cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Mobil için 3 Kademeli Hareke Köprüsü alt şeridi */}
      <div className="flex md:hidden items-center justify-between gap-2 px-3 py-1.5 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/60">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">Hareke:</span>
        <div className="flex items-center gap-1">
          {HARAKA_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setHarakaMode(m.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                harakaMode === m.id
                  ? 'bg-[var(--accent)] text-white dark:text-[#0d1412]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {m.shortLabel}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
