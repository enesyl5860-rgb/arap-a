import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  Layers,
  FileText
} from 'lucide-react';
import { ArabicText } from '../common/ArabicText.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';

export function CurriculumMap({
  curriculum,
  availableModuleIds,
  availableFinalIds,
  activeModuleId,
  onOpenModule,
  onOpenFinal
}) {
  const { progress, stats } = useProgress();
  const [selectedPhase, setSelectedPhase] = useState('all');

  const readyCount = availableModuleIds.size;
  const phases =
    selectedPhase === 'all'
      ? curriculum.phases
      : curriculum.phases.filter((p) => String(p.id) === String(selectedPhase));

  const getModuleCompletion = (modId) => {
    const drillPrefix = `m${modId}_`;
    const drillsDone = Object.entries(progress.completedDrills).filter(
      ([k, v]) => k.startsWith(drillPrefix) && v.correct
    ).length;
    const readingsDone = progress.completedReadings.filter((id) => id.startsWith(drillPrefix)).length;
    const dialoguesDone = progress.completedDialogues.filter((id) => id.startsWith(drillPrefix)).length;
    const cardsDone = Object.entries(progress.srs).filter(
      ([k, v]) => k.startsWith(drillPrefix) && v.reps >= 1
    ).length;
    return { drillsDone, readingsDone, dialoguesDone, cardsDone };
  };

  return (
    <div className="space-y-8">
      {/* Üst Hero Özeti */}
      <section className="surface-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                5 Faz · 55 Modül · 4 Büyük Final · 5 Cilt A4 PDF
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--amber-soft)] text-[var(--amber)]">
                {readyCount} / {curriculum.totalModules} Modül Yayında
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {curriculum.title}
            </h2>
            <ArabicText
              text={curriculum.arabicTitle}
              display
              forceMode="full"
              as="p"
              className="text-xl sm:text-2xl text-[var(--accent)]"
            />
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {curriculum.subtitle}. Her modül; 5 parçalı Sarf/Nahiv anlatımı, 50+ anlık tatbik, cümle
              kurma atölyesi, 3 uzun okuma metni, 4 gölgelemeli diyalog ve 32 zengin kök-aileli SRS kartı içerir.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0 min-w-[240px]">
            <div className="subtle-panel rounded-xl p-3.5">
              <div className="text-xs text-[var(--text-muted)]">Öğrenilen Kart</div>
              <div className="text-2xl font-bold text-[var(--accent)] mt-0.5">{stats.learnedCards}</div>
            </div>
            <div className="subtle-panel rounded-xl p-3.5">
              <div className="text-xs text-[var(--text-muted)]">Çözülen Tatbik</div>
              <div className="text-2xl font-bold text-[var(--accent)] mt-0.5">{stats.masteredDrills}</div>
            </div>
            <div className="subtle-panel rounded-xl p-3.5">
              <div className="text-xs text-[var(--text-muted)]">Tamamlanan Okuma</div>
              <div className="text-2xl font-bold text-[var(--accent)] mt-0.5">{stats.readingsCount}</div>
            </div>
            <div className="subtle-panel rounded-xl p-3.5">
              <div className="text-xs text-[var(--text-muted)]">Hata Defteri</div>
              <div className="text-2xl font-bold text-[var(--amber)] mt-0.5">{stats.errorCount}</div>
            </div>
          </div>
        </div>

        {/* Faz Filtreleri */}
        <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedPhase('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedPhase === 'all'
                ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Tüm Fazlar (55 Modül)
          </button>
          {curriculum.phases.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPhase(String(p.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedPhase === String(p.id)
                  ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p.code} ({p.cefr})
            </button>
          ))}
        </div>
      </section>

      {/* 5 Faz & 55 Modül Kartları */}
      {phases.map((phase) => {
        const finalMeta = curriculum.finals.find((f) => f.id === phase.finalId);
        const phaseReadyCount = phase.modules.filter((m) => availableModuleIds.has(m.id)).length;

        return (
          <section key={phase.id} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                  <span>{phase.code}</span>
                  <span>·</span>
                  <span>{phase.cefr}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                    <FileText size={12} /> Cilt {phase.cilt} PDF
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5">
                  {phase.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
                  {phase.description}
                </p>
              </div>
              <div className="text-xs font-medium text-[var(--text-muted)] shrink-0">
                {phaseReadyCount}/{phase.modules.length} modül aktif
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {phase.modules.map((mod) => {
                const ready = availableModuleIds.has(mod.id);
                const isSelected = activeModuleId === mod.id;
                const comp = getModuleCompletion(mod.id);
                const activityTotal = comp.drillsDone + comp.readingsDone + comp.dialoguesDone + comp.cardsDone;

                return (
                  <article
                    key={mod.id}
                    className={`surface-card rounded-xl p-4 flex flex-col justify-between gap-3 transition-all ${
                      isSelected ? 'ring-2 ring-[var(--accent)]' : ''
                    } ${ready ? 'hover:-translate-y-0.5' : 'opacity-75'}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
                          <BookOpen size={14} />
                          Modül {mod.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                            {mod.category}
                          </span>
                          {ready ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                              <CheckCircle2 size={11} /> Hazır
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                              <Clock size={11} /> Planlandı
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                        {mod.title}
                      </h4>
                      <ArabicText
                        text={mod.arabicTitle}
                        forceMode="full"
                        as="p"
                        className="text-base text-[var(--accent-strong)]"
                      />
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {mod.summary}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {mod.topics.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[10px] text-[var(--text-secondary)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                      {ready ? (
                        <>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {activityTotal > 0
                              ? `${comp.drillsDone} tatbik · ${comp.cardsDone} kart`
                              : '5 Kural · 3 Okuma · 4 Diyalog · 32 Kart'}
                          </span>
                          <button
                            type="button"
                            id={`btn-open-module-${mod.id}`}
                            onClick={() => onOpenModule(mod.id, 'grammar')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#0b1311] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>Başla</span>
                            <ArrowRight size={13} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">
                          Sonraki içerik turunda eklenecek
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Faz Sonu Büyük Final Kartı */}
            {finalMeta && (
              <div className="surface-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-elevated)]">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[var(--amber-soft)] text-[var(--amber)] shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--amber)]">
                        Büyük Final · {finalMeta.cefr}
                      </span>
                      {progress.finalScores[finalMeta.id] && (
                        <span className="px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-strong)] text-[11px] font-semibold">
                          En İyi: {progress.finalScores[finalMeta.id].bestScore}/
                          {progress.finalScores[finalMeta.id].total}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                      {finalMeta.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{finalMeta.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenFinal(finalMeta.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text-primary)] shrink-0 cursor-pointer"
                >
                  <Layers size={14} />
                  <span>{availableFinalIds.has(finalMeta.id) ? 'Finali Çöz' : 'Final Kapsamını Gör'}</span>
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
