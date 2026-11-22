import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Table2,
  BookOpen,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { ArabicText, IrabBadge } from '../common/ArabicText.jsx';
import { AudioButton } from '../common/AudioControls.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';

const DRILL_TYPE_LABELS = {
  donusturme: 'Cümle / Kelime Dönüştürme',
  hata_bul: 'Hata Bul & Düzelt',
  bosluk: 'Boşluk Doldurma',
  tr_ar: 'Türkçe → Arapça Kurma'
};

export function GrammarStudio({ moduleData }) {
  const { progress, recordDrillResult } = useProgress();
  const [activeRuleIdx, setActiveRuleIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showTableModalTip, setShowTableModalTip] = useState(false);

  if (!moduleData) return null;
  const rules = moduleData.grammar || [];
  const rule = rules[activeRuleIdx] || rules[0];
  if (!rule) return null;

  const handleSelectOption = (drill, optionIndex) => {
    const isCorrect = optionIndex === drill.dogruIndeks;
    setSelectedAnswers((prev) => ({ ...prev, [drill.id]: optionIndex }));
    recordDrillResult(drill.id, isCorrect, {
      moduleId: moduleData.id,
      source: `M${moduleData.id} · ${rule.baslik}`,
      prompt: drill.soru,
      correctAnswer: drill.secenekler[drill.dogruIndeks],
      explanation: drill.aciklama
    });
  };

  const resetRuleDrills = () => {
    const next = { ...selectedAnswers };
    for (const d of rule.tatbikler || []) delete next[d.id];
    setSelectedAnswers(next);
  };

  const ruleDrills = rule.tatbikler || [];
  const solvedInRule = ruleDrills.filter((d) => progress.completedDrills[d.id]?.correct).length;

  return (
    <div className="space-y-6">
      {/* Modül Başlığı + İ'rab Renk Anahtarı */}
      <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--accent)]">
              Modül {moduleData.id} · {moduleData.cefr} · {moduleData.category}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5">
              {moduleData.title}
            </h2>
            <ArabicText
              text={moduleData.arabicTitle}
              display
              forceMode="full"
              as="p"
              className="text-xl text-[var(--accent-strong)]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <IrabBadge type="merfu" label="Merfû (ُ / ـٌ)" />
            <IrabBadge type="mansub" label="Mansûb (َ / ـً)" />
            <IrabBadge type="mecrur" label="Mecrûr (ِ / ـٍ)" />
            <IrabBadge type="meczum" label="Meczûm (ْ)" />
          </div>
        </div>

        {/* Kural Sekmeleri */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
          {rules.map((r, idx) => {
            const doneCount = (r.tatbikler || []).filter((d) => progress.completedDrills[d.id]?.correct).length;
            const totalCount = (r.tatbikler || []).length;
            const active = idx === activeRuleIdx;
            return (
              <button
                key={r.id}
                type="button"
                id={`tab-rule-${idx}`}
                onClick={() => setActiveRuleIdx(idx)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  active
                    ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>
                  {idx + 1}. {r.baslik}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    active ? 'bg-black/20 text-white dark:text-[#0b1311]' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  {doneCount}/{totalCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 PARÇALI GRAMER KURALI */}
      <article className="space-y-5">
        {/* 1) Sade Mantık & Kullanım */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                1 / 5 · Sade Mantık & Kullanım
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5">
                {rule.baslik}
              </h3>
            </div>
            {rule.arBaslik && (
              <ArabicText text={rule.arBaslik} display forceMode="full" className="text-xl text-[var(--accent)]" />
            )}
          </div>
          <p className="text-sm sm:text-[15px] text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
            {rule.mantik}
          </p>
        </section>

        {/* 2) Formül + Sesli Çekim / Terkip Tablosu */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                2 / 5 · Formül & Sesli Çekim / Terkip Tablosu
              </span>
              <h4 className="text-base font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-2">
                <Table2 size={17} className="text-[var(--accent)]" />
                <span>{rule.tablo?.baslik || 'Yapı ve Çekim Tablosu'}</span>
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowTableModalTip((s) => !s)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
            >
              {showTableModalTip ? 'İpucunu gizle' : 'Nasıl çalışmalı?'}
            </button>
          </div>

          {showTableModalTip && (
            <div className="rounded-xl bg-[var(--accent-soft)] px-4 py-2.5 text-xs text-[var(--accent-strong)]">
              Her satırdaki ses ikonuna tıklayarak telaffuzu dinleyin, ardından gözünüzü Türkçe sütununa çevirip Arapçasını sesli tekrar edin.
            </div>
          )}

          {/* Formül Kutusu */}
          <div className="subtle-panel rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
              {rule.formul}
            </div>
            {rule.formulAr && (
              <div className="flex items-center gap-2">
                <ArabicText text={rule.formulAr} forceMode="full" className="text-lg font-semibold text-[var(--accent-strong)]" />
                <AudioButton text={rule.formulAr} size="xs" />
              </div>
            )}
          </div>

          {/* Tablo */}
          {rule.tablo?.satirlar?.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-subtle)] text-left text-xs font-semibold text-[var(--text-secondary)]">
                    {(rule.tablo.sutunlar || []).map((col) => (
                      <th key={col} className="px-3.5 py-2.5 border-b border-[var(--border-subtle)]">
                        {col}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 border-b border-[var(--border-subtle)] w-16 text-center">Ses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {rule.tablo.satirlar.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                      {row.hucreler.map((cell, cIdx) => {
                        const isArabicCell = /[\u0600-\u06FF]/.test(cell);
                        return (
                          <td key={cIdx} className="px-3.5 py-2.5 align-middle">
                            {isArabicCell ? (
                              <ArabicText text={cell} forceMode="full" className="text-lg text-[var(--text-primary)]" />
                            ) : (
                              <span className="text-xs sm:text-sm text-[var(--text-secondary)]">{cell}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center">
                        {row.ses && <AudioButton text={row.ses} size="xs" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 3) Türkçe -> Arapça Kıyaslama İpucu & Sık Yapılan Hatalar */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="surface-card rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              <Lightbulb size={16} />
              <span>3 / 5 · Türkçe → Arapça Kıyaslama İpucu</span>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{rule.trKiyas}</p>
          </div>

          <div className="surface-card rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--amber)]">
              <AlertTriangle size={16} />
              <span>Sık Yapılan Hatalar & Tuzaklar</span>
            </div>
            <ul className="space-y-2">
              {(rule.sikHatalar || []).map((h, i) => (
                <li key={i} className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed flex gap-2">
                  <span className="text-[var(--amber)] font-bold">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4) 6+ Sesli Örnek */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                4 / 5 · Bağlam İçi Sesli Örnekler ({(rule.ornekler || []).length} Örnek)
              </span>
              <h4 className="text-base font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-2">
                <BookOpen size={17} className="text-[var(--accent)]" />
                <span>Örnek Cümle ve Yapılar</span>
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(rule.ornekler || []).map((ex, idx) => (
              <div
                key={idx}
                className="subtle-panel rounded-xl p-4 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <AudioButton text={ex.ar} size="xs" showShadow />
                  <ArabicText
                    text={ex.ar}
                    as="p"
                    className="text-xl text-[var(--text-primary)] text-right flex-1"
                  />
                </div>
                <div className="space-y-0.5 pt-1 border-t border-[var(--border-subtle)]/70">
                  <p className="text-xs font-mono text-[var(--accent-strong)]">{ex.okunus}</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{ex.tr}</p>
                  {ex.not && <p className="text-xs text-[var(--text-muted)]">{ex.not}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5) 10 Anlık Tatbik */}
        <section className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                5 / 5 · Anlık Tatbik ({solvedInRule}/{ruleDrills.length} Doğru)
              </span>
              <h4 className="text-base font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-2">
                <Sparkles size={17} className="text-[var(--amber)]" />
                <span>Dönüştürme, Hata Bul-Düzelt, Boşluk ve TR→AR Tatbikleri</span>
              </h4>
            </div>
            <button
              type="button"
              onClick={resetRuleDrills}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Seçimleri Temizle</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {ruleDrills.map((drill, dIdx) => {
              const chosen = selectedAnswers[drill.id];
              const answered = chosen !== undefined;
              const isCorrect = chosen === drill.dogruIndeks;
              const previouslyMastered = progress.completedDrills[drill.id]?.correct;

              return (
                <div
                  key={drill.id}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--accent)]">Tatbik {dIdx + 1}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                          {DRILL_TYPE_LABELS[drill.tip] || drill.tip}
                        </span>
                        {previouslyMastered && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--accent)]">
                            <CheckCircle2 size={12} /> Tamamlandı
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{drill.soru}</p>
                      {drill.soruAr && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <ArabicText text={drill.soruAr} className="text-lg text-[var(--text-primary)]" />
                          <AudioButton text={drill.soruAr} size="xs" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {drill.secenekler.map((opt, optIdx) => {
                      const isArOpt = /[\u0600-\u06FF]/.test(opt);
                      let btnCls =
                        'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]';
                      if (answered) {
                        if (optIdx === drill.dogruIndeks) {
                          btnCls = 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]';
                        } else if (optIdx === chosen && !isCorrect) {
                          btnCls = 'border-red-500/70 bg-[var(--irab-meczum-bg)] text-[var(--irab-meczum-fg)]';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(drill, optIdx)}
                          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${btnCls}`}
                        >
                          <span className="text-xs font-bold opacity-70 shrink-0">
                            {String.fromCharCode(65 + optIdx)})
                          </span>
                          {isArOpt ? (
                            <ArabicText text={opt} className="text-lg flex-1 text-right" />
                          ) : (
                            <span className="text-xs sm:text-sm flex-1">{opt}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {answered && (
                    <div
                      className={`rounded-xl px-3.5 py-2.5 text-xs flex items-start gap-2 ${
                        isCorrect
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                          : 'bg-[var(--amber-soft)] text-[var(--amber)]'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={15} className="shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong>{isCorrect ? 'Doğru! ' : 'Hata Defterine eklendi — '}</strong>
                        {drill.aciklama}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </article>
    </div>
  );
}
