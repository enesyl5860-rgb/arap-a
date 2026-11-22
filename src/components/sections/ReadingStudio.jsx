import React, { useState } from 'react';
import {
  BookOpenText,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Star,
  Volume2,
  Square,
  Search
} from 'lucide-react';
import { ArabicText } from '../common/ArabicText.jsx';
import { AudioButton } from '../common/AudioControls.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import { HARAKA_MODES } from '../../utils/arabicText.js';
import { playShadowingSequence, stopSpeaking } from '../../utils/speechEngine.js';

export function ReadingStudio({ moduleData }) {
  const {
    progress,
    setHarakaMode,
    markReadingComplete,
    recordDrillResult,
    toggleFavorite
  } = useProgress();

  const [activeIdx, setActiveIdx] = useState(0);
  const [showTr, setShowTr] = useState(true);
  const [showOkunus, setShowOkunus] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [answers, setAnswers] = useState({});
  const [playingParaIdx, setPlayingParaIdx] = useState(-1);

  if (!moduleData?.readings?.length) return null;
  const readings = moduleData.readings;
  const textObj = readings[activeIdx] || readings[0];
  const isCompleted = progress.completedReadings.includes(textObj.id);

  const handlePlayAll = () => {
    if (playingParaIdx !== -1) {
      stopSpeaking();
      setPlayingParaIdx(-1);
      return;
    }
    const lines = textObj.paragraflar.map((p) => p.ar);
    playShadowingSequence(lines, {
      rate: progress.settings.speechRate,
      repeatEach: 1,
      pauseMs: 800,
      onLineChange: (idx) => setPlayingParaIdx(idx),
      onComplete: () => setPlayingParaIdx(-1)
    });
  };

  const handleAnswer = (q, optIdx) => {
    const ok = optIdx === q.dogruIndeks;
    setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
    recordDrillResult(q.id, ok, {
      moduleId: moduleData.id,
      source: `M${moduleData.id} Okuma · ${textObj.baslik}`,
      prompt: q.soru,
      correctAnswer: q.secenekler[q.dogruIndeks],
      explanation: q.aciklama
    });
  };

  return (
    <div className={`space-y-6 ${focusMode ? 'max-w-4xl mx-auto' : ''}`}>
      {/* Üst Kontrol Paneli */}
      <div className="surface-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--accent)]">
              Modül {moduleData.id} · Okuma Stüdyosu ({readings.length} Uzun Metin)
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">{textObj.baslik}</h2>
            <ArabicText text={textObj.arBaslik} display as="p" className="text-xl text-[var(--accent-strong)]" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePlayAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#0b1311] text-xs font-semibold cursor-pointer"
            >
              {playingParaIdx !== -1 ? <Square size={13} /> : <Volume2 size={14} />}
              <span>{playingParaIdx !== -1 ? 'Durdur' : 'Tümünü Dinle'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTr((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
            >
              {showTr ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>Çeviri</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOkunus((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
            >
              <span>{showOkunus ? 'Okunuşu Gizle' : 'Okunuş'}</span>
            </button>

            <button
              type="button"
              onClick={() => setFocusMode((s) => !s)}
              title="Okuma Odak Modu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
            >
              {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="hidden sm:inline">{focusMode ? 'Normal' : 'Odak'}</span>
            </button>
          </div>
        </div>

        {/* Metin Seçici + 3 Kademeli Hareke Anahtarı */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap gap-2">
            {readings.map((r, i) => {
              const done = progress.completedReadings.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setPlayingParaIdx(-1);
                    setActiveIdx(i);
                    setSelectedWord(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    i === activeIdx
                      ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <BookOpenText size={13} />
                  <span>Metin {i + 1}: {r.baslik}</span>
                  {done && <CheckCircle2 size={12} />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            {HARAKA_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setHarakaMode(m.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                  progress.settings.harakaMode === m.id
                    ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {m.shortLabel} ({m.badge})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Paragraf + Tıklanabilir Kök/Gramer Müfettişi */}
      <div className="space-y-4">
        {textObj.paragraflar.map((para, pIdx) => (
          <article
            key={pIdx}
            className={`surface-card rounded-2xl p-5 sm:p-6 space-y-3 transition-all ${
              playingParaIdx === pIdx ? 'ring-2 ring-[var(--accent)]' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[var(--accent)]">Paragraf {pIdx + 1}</span>
              <AudioButton text={para.ar} size="xs" showShadow label="Dinle" />
            </div>

            <ArabicText
              text={para.ar}
              display
              as="p"
              className="text-2xl sm:text-[26px] text-[var(--text-primary)] leading-[2.3] text-right"
            />

            {showOkunus && (
              <p className="text-xs font-mono text-[var(--accent-strong)] bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
                {para.okunus}
              </p>
            )}

            {showTr && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-2 border-t border-[var(--border-subtle)]">
                {para.tr}
              </p>
            )}

            {/* Tıklanabilir Kök / Gramer Analiz Kutucukları */}
            {para.analiz?.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  <Search size={12} />
                  <span>Kök & Gramer Analizi (incelemek için kelimeye tıklayın):</span>
                </div>
                <div dir="rtl" className="flex flex-wrap gap-1.5">
                  {para.analiz.map((item, wIdx) => {
                    const isSel = selectedWord?.kelime === item.kelime && selectedWord?.pIdx === pIdx;
                    return (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => setSelectedWord(isSel ? null : { ...item, pIdx })}
                        className={`px-2.5 py-1 rounded-lg border text-sm transition-all cursor-pointer ${
                          isSel
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <ArabicText text={item.kelime} className="text-base" />
                      </button>
                    );
                  })}
                </div>

                {selectedWord && selectedWord.pIdx === pIdx && (
                  <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-elevated)] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ArabicText text={selectedWord.kelime} forceMode="full" className="text-xl font-bold text-[var(--accent)]" />
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedWord.tr}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                        <span>Kök: <strong>{selectedWord.kok}</strong></span>
                        <span>·</span>
                        <span>Gramer: <strong>{selectedWord.gramer}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AudioButton text={selectedWord.kelime} size="xs" label="Ses" />
                      {selectedWord.cardId && (
                        <button
                          type="button"
                          onClick={() => toggleFavorite(selectedWord.cardId)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                            progress.favorites.includes(selectedWord.cardId)
                              ? 'bg-[var(--amber-soft)] border-[var(--amber)] text-[var(--amber)]'
                              : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <Star size={12} />
                          <span>SRS Zor</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* 5 Anlama Sorusu + Metni Tamamla */}
      <section className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Okuduğunu Anlama Soruları ({textObj.sorular.length} Soru)
          </h3>
          <button
            type="button"
            onClick={() => markReadingComplete(textObj.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              isCompleted
                ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                : 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{isCompleted ? 'Okundu Olarak İşaretlendi' : 'Okumayı Tamamla'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {textObj.sorular.map((q, qIdx) => {
            const chosen = answers[q.id];
            const answered = chosen !== undefined;
            const ok = chosen === q.dogruIndeks;

            return (
              <div key={q.id} className="subtle-panel rounded-xl p-4 space-y-2.5">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {qIdx + 1}. {q.soru}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.secenekler.map((opt, oIdx) => {
                    let cls = 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]';
                    if (answered) {
                      if (oIdx === q.dogruIndeks) cls = 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]';
                      else if (oIdx === chosen && !ok) cls = 'border-red-500/70 bg-[var(--irab-meczum-bg)] text-[var(--irab-meczum-fg)]';
                    }
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleAnswer(q, oIdx)}
                        className={`px-3 py-2 rounded-lg border text-left text-xs sm:text-sm cursor-pointer ${cls}`}
                      >
                        <strong>{String.fromCharCode(65 + oIdx)})</strong> {opt}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <p className="text-xs text-[var(--text-secondary)] pt-1">
                    <strong>Açıklama:</strong> {q.aciklama}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
