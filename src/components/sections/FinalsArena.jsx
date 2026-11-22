import React, { useState, useEffect } from 'react';
import { Award, BookOpenText, MessagesSquare, CheckCircle2, Clock, FileCheck2 } from 'lucide-react';
import { ArabicText } from '../common/ArabicText.jsx';
import { AudioButton } from '../common/AudioControls.jsx';
import { loadFinal } from '../../utils/moduleLoader.js';
import { useProgress } from '../../context/ProgressContext.jsx';

export function FinalsArena({ curriculum, availableFinalIds, initialFinalId = 'final_a1' }) {
  const { progress, recordFinalScore } = useProgress();
  const [selectedFinalId, setSelectedFinalId] = useState(initialFinalId);
  const [finalData, setFinalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState('exam'); // 'exam' | 'readings' | 'dialogues'
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelectedFinalId(initialFinalId);
  }, [initialFinalId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAnswers({});
    setSubmitted(false);
    loadFinal(selectedFinalId).then((data) => {
      if (!cancelled) {
        setFinalData(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedFinalId]);

  const meta = curriculum.finals.find((f) => f.id === selectedFinalId) || curriculum.finals[0];

  const handleSubmitExam = () => {
    if (!finalData?.sinav?.length) return;
    let score = 0;
    for (const q of finalData.sinav) {
      if (answers[q.id] === q.dogruIndeks) score += 1;
    }
    setSubmitted(true);
    recordFinalScore(selectedFinalId, score, finalData.sinav.length);
  };

  return (
    <div className="space-y-6">
      {/* 4 Büyük Final Seçici */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {curriculum.finals.map((f) => {
          const ready = availableFinalIds.has(f.id);
          const active = f.id === selectedFinalId;
          const rec = progress.finalScores[f.id];
          return (
            <button
              key={f.id}
              type="button"
              id={`btn-select-${f.id}`}
              onClick={() => setSelectedFinalId(f.id)}
              className={`surface-card rounded-xl p-4 text-left transition-all cursor-pointer ${
                active ? 'ring-2 ring-[var(--accent)]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--accent)]">{f.cefr}</span>
                {ready ? (
                  <span className="px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-strong)] text-[10px] font-semibold">
                    Hazır
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] text-[10px]">
                    <Clock size={10} /> Faz Sonu
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] mt-1.5">{f.title}</div>
              {rec ? (
                <div className="text-xs text-[var(--accent-strong)] font-semibold mt-1">
                  En İyi Skor: {rec.bestScore}/{rec.total}
                </div>
              ) : (
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  10 Diyalog · 10 Okuma · 20 Soru
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Seçili Final İçeriği */}
      {loading ? (
        <div className="surface-card rounded-2xl p-10 text-center text-sm text-[var(--text-muted)]">
          Büyük final yükleniyor...
        </div>
      ) : !finalData ? (
        <div className="surface-card rounded-2xl p-8 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-[var(--amber-soft)] text-[var(--amber)]">
              <Award size={24} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{meta.title}</h2>
              <ArabicText text={meta.arabicTitle} display forceMode="full" as="p" className="text-xl text-[var(--accent)]" />
              <p className="text-sm text-[var(--text-secondary)]">{meta.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="subtle-panel rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
                <MessagesSquare size={15} /> 10 Diyalog Senaryosu
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Seviyenin tüm iletişim hedeflerini ölçen sesli ve gölgelemeli gerçek yaşam diyalogları.
              </p>
            </div>
            <div className="subtle-panel rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
                <BookOpenText size={15} /> 10 Kapsamlı Okuma Metni
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                3 kademeli hareke köprüsüyle okunabilen, çevirili ve anlama sorulu seviye metinleri.
              </p>
            </div>
            <div className="subtle-panel rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
                <FileCheck2 size={15} /> 20 Soruluk Çözümlü Sınav
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Sarf, Nahiv, kelime, çeviri ve okuma bütünlüğünü ölçen detaylı açıklamalı değerlendirme testi.
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
            Bu final dosyası (<code>src/data/finals/{meta.id}.json</code>) ilgili fazın modülleri tamamlandığında otomatik olarak bu ekranda ve Cilt {meta.cilt} PDF kitabında aktifleşecektir.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="surface-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{finalData.title}</h2>
              <ArabicText text={finalData.arabicTitle} display as="p" className="text-lg text-[var(--accent)]" />
            </div>
            <div className="flex gap-2">
              {[
                { id: 'exam', label: `20 Soruluk Sınav (${finalData.sinav?.length || 0})` },
                { id: 'readings', label: `10 Okuma (${finalData.okumalar?.length || 0})` },
                { id: 'dialogues', label: `10 Diyalog (${finalData.diyaloglar?.length || 0})` }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSubTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    subTab === t.id
                      ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {subTab === 'exam' && (
            <div className="space-y-4">
              {(finalData.sinav || []).map((q, i) => {
                const chosen = answers[q.id];
                return (
                  <div key={q.id} className="surface-card rounded-2xl p-5 space-y-3">
                    <div className="text-xs font-bold text-[var(--accent)]">Soru {i + 1}</div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{q.soru}</p>
                    {q.soruAr && (
                      <div className="flex items-center gap-2">
                        <ArabicText text={q.soruAr} className="text-xl text-[var(--text-primary)]" />
                        <AudioButton text={q.soruAr} size="xs" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.secenekler.map((opt, oIdx) => {
                        let cls = 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]';
                        if (submitted) {
                          if (oIdx === q.dogruIndeks) cls = 'border-[var(--accent)] bg-[var(--accent-soft)]';
                          else if (chosen === oIdx) cls = 'border-red-500/70 bg-[var(--irab-meczum-bg)]';
                        } else if (chosen === oIdx) {
                          cls = 'border-[var(--accent)] bg-[var(--accent-soft)]';
                        }
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={submitted}
                            onClick={() => setAnswers((p) => ({ ...p, [q.id]: oIdx }))}
                            className={`px-3.5 py-2.5 rounded-xl border text-left text-xs sm:text-sm cursor-pointer ${cls}`}
                          >
                            <strong>{String.fromCharCode(65 + oIdx)})</strong> {opt}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && (
                      <p className="text-xs text-[var(--text-secondary)] pt-1">
                        <strong>Çözüm:</strong> {q.aciklama}
                      </p>
                    )}
                  </div>
                );
              })}

              {!submitted ? (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white dark:text-[#0b1311] text-sm font-bold cursor-pointer"
                >
                  Sınavı Bitir ve Değerlendir
                </button>
              ) : (
                <div className="surface-card rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--accent-strong)]">
                    <CheckCircle2 size={20} />
                    <span>
                      Puanınız: {progress.finalScores[selectedFinalId]?.score} / {finalData.sinav.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setSubmitted(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs font-semibold cursor-pointer"
                  >
                    Yeniden Çöz
                  </button>
                </div>
              )}
            </div>
          )}

          {subTab === 'readings' && (
            <div className="space-y-4">
              {(finalData.okumalar || []).map((r, i) => (
                <article key={r.id || i} className="surface-card rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{i + 1}. {r.baslik}</h3>
                    <AudioButton text={r.ar} size="xs" showShadow />
                  </div>
                  <ArabicText text={r.ar} display as="p" className="text-2xl text-right" />
                  <p className="text-sm text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">{r.tr}</p>
                </article>
              ))}
            </div>
          )}

          {subTab === 'dialogues' && (
            <div className="space-y-4">
              {(finalData.diyaloglar || []).map((d, i) => (
                <article key={d.id || i} className="surface-card rounded-2xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{i + 1}. {d.baslik}</h3>
                  <div className="space-y-2">
                    {(d.replikler || []).map((line, lIdx) => (
                      <div key={lIdx} className="subtle-panel rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--accent)]">{line.konusan}</span>
                          <AudioButton text={line.ar} size="xs" />
                        </div>
                        <ArabicText text={line.ar} as="p" className="text-lg text-right" />
                        <p className="text-xs text-[var(--text-secondary)]">{line.tr}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
