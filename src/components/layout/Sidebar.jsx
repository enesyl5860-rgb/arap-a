import React from 'react';
import {
  Map,
  BookMarked,
  Blocks,
  BookOpenText,
  MessagesSquare,
  Layers,
  Award,
  Compass,
  X,
  Download
} from 'lucide-react';
import { useProgress } from '../../context/ProgressContext.jsx';

export const NAV_SECTIONS = [
  { id: 'map', label: 'Külliyat Haritası', short: '55 Modül · 5 Faz', icon: Map },
  { id: 'grammar', label: 'Gramer & Tatbik', short: 'Sarf / Nahiv + 10 Tatbik', icon: BookMarked },
  { id: 'workshop', label: 'Cümle Kurma Atölyesi', short: 'Kalıp, Merdiven, Blok', icon: Blocks },
  { id: 'reading', label: 'Okuma Stüdyosu', short: '3 Uzun Metin + Analiz', icon: BookOpenText },
  { id: 'dialogue', label: 'Diyaloglar & Partner', short: '4 Diyalog + Gölgeleme', icon: MessagesSquare },
  { id: 'flashcards', label: 'Akıllı Tekrar (SRS)', short: '4 Mod · Aralıklı Tekrar', icon: Layers },
  { id: 'finals', label: 'Seviye Finalleri', short: 'A1 / A2 / B1 / B2–YDS', icon: Award },
  { id: 'atlas', label: 'Referans Atlası & YDS', short: 'Kök, Bağlaç, Hata Defteri', icon: Compass }
];

export function Sidebar({
  activeSection,
  onSelectSection,
  activeModuleId,
  onSelectModule,
  availableModuleIds,
  curriculum,
  isOpen,
  onClose,
  onOpenBackup
}) {
  const { stats } = useProgress();
  const readyModules = curriculum.phases
    .flatMap((p) => p.modules)
    .filter((m) => availableModuleIds.has(m.id));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-20 h-screen w-72 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Marka Başlığı */}
        <div className="px-4 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white dark:text-[#0b1311] font-arabic-display text-lg font-bold">
                ض
              </span>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                  Arapça Külliyatı
                </h1>
                <p className="text-[11px] text-[var(--text-muted)]">v4.0 · 0 → B2 + YDS/YÖKDİL</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Aktif Modül Hızlı Seçici */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50">
          <label htmlFor="select-active-module" className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            Aktif Modül ({readyModules.length}/{curriculum.totalModules} Hazır)
          </label>
          <select
            id="select-active-module"
            value={activeModuleId}
            onChange={(e) => onSelectModule(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            {curriculum.phases.map((phase) => (
              <optgroup key={phase.id} label={`${phase.code} (${phase.cefr})`}>
                {phase.modules.map((m) => {
                  const ready = availableModuleIds.has(m.id);
                  return (
                    <option key={m.id} value={m.id}>
                      {ready ? '● ' : '○ '}M{m.id} — {m.title}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>

        {/* 8 Ana Bölüm Navigasyonu */}
        <nav aria-label="Ana Bölümler" className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {NAV_SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            const badge =
              item.id === 'flashcards' && stats.dueCards > 0
                ? stats.dueCards
                : item.id === 'atlas' && stats.errorCount > 0
                  ? stats.errorCount
                  : null;

            return (
              <button
                key={item.id}
                type="button"
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectSection(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={18} className={active ? 'text-[var(--accent)] shrink-0' : 'text-[var(--text-muted)] shrink-0'} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-tight truncate">{item.label}</div>
                  <div className="text-[11px] text-[var(--text-muted)] font-normal truncate">{item.short}</div>
                </div>
                {badge !== null && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--amber-soft)] text-[var(--amber)]">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Alt Özet & Yedekleme */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] py-1.5 px-1">
              <div className="text-sm font-bold text-[var(--accent)]">{stats.learnedCards}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Kart</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] py-1.5 px-1">
              <div className="text-sm font-bold text-[var(--accent)]">{stats.masteredDrills}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Tatbik</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] py-1.5 px-1">
              <div className="text-sm font-bold text-[var(--accent)]">{stats.readingsCount}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Okuma</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBackup}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>İlerlemeyi Dışa / İçe Aktar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
