import React, { useState } from 'react';
import {
  MessagesSquare,
  Play,
  Square,
  Repeat,
  Bot,
  Lightbulb,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { ArabicText } from '../common/ArabicText.jsx';
import { AudioButton } from '../common/AudioControls.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import { playShadowingSequence, stopSpeaking, speakArabic } from '../../utils/speechEngine.js';

export function DialogueStudio({ moduleData }) {
  const { progress, markDialogueComplete } = useProgress();
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState('script'); // 'script' | 'partner'
  const [showTr, setShowTr] = useState(true);
  const [showOkunus, setShowOkunus] = useState(false);

  // Sesli oynatma / gölgeleme durumu
  const [playingLine, setPlayingLine] = useState(-1);
  const [shadowPhase, setShadowPhase] = useState('idle'); // 'idle' | 'listen' | 'shadow'

  // İnteraktif Diyalog Partneri durumu (5 tur)
  const [partnerTurn, setPartnerTurn] = useState(0);
  const [partnerHistory, setPartnerHistory] = useState([]);
  const [showHint, setShowHint] = useState(false);

  if (!moduleData?.dialogues?.length) return null;
  const dialogues = moduleData.dialogues;
  const dlg = dialogues[activeIdx] || dialogues[0];
  const isCompleted = progress.completedDialogues.includes(dlg.id);

  const resetPartner = () => {
    setPartnerTurn(0);
    setPartnerHistory([]);
    setShowHint(false);
  };

  const switchDialogue = (idx) => {
    stopSpeaking();
    setPlayingLine(-1);
    setShadowPhase('idle');
    setActiveIdx(idx);
    resetPartner();
  };

  const startPlayback = (shadowing) => {
    if (playingLine !== -1) {
      stopSpeaking();
      setPlayingLine(-1);
      setShadowPhase('idle');
      return;
    }
    const lines = dlg.replikler.map((r) => r.ar);
    playShadowingSequence(lines, {
      rate: progress.settings.speechRate,
      repeatEach: shadowing ? 2 : 1,
      pauseMs: shadowing ? 2000 : 600,
      onLineChange: (i) => setPlayingLine(i),
      onPhaseChange: (phase) => setShadowPhase(phase),
      onComplete: () => {
        setPlayingLine(-1);
        setShadowPhase('idle');
      }
    });
  };

  const partnerTurns = dlg.partner || [];
  const currentTurnObj = partnerTurns[partnerTurn];
  const partnerFinished = partnerTurn >= partnerTurns.length && partnerTurns.length > 0;

  const choosePartnerReply = (optIdx) => {
    if (!currentTurnObj) return;
    const isCorrect = optIdx === currentTurnObj.dogruIndeks;
    const chosenOpt = currentTurnObj.secenekler[optIdx];
    speakArabic(chosenOpt.ar, { rate: progress.settings.speechRate });

    setPartnerHistory((prev) => [
      ...prev,
      {
        turn: partnerTurn + 1,
        promptAr: currentTurnObj.soruAr,
        promptTr: currentTurnObj.soruTr,
        chosenAr: chosenOpt.ar,
        chosenTr: chosenOpt.tr,
        isCorrect,
        feedback: currentTurnObj.aciklama
      }
    ]);

    if (isCorrect) {
      setShowHint(false);
      const next = partnerTurn + 1;
      setPartnerTurn(next);
      if (next >= partnerTurns.length) {
        markDialogueComplete(dlg.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Diyalog Seçici */}
      <div className="surface-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--accent)]">
              Modül {moduleData.id} · Diyaloglar & Gölgeleme Stüdyosu ({dialogues.length} Diyalog)
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">{dlg.baslik}</h2>
            <p className="text-xs text-[var(--text-muted)]">{dlg.ortam}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('script')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                viewMode === 'script'
                  ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              <MessagesSquare size={14} />
              <span>Diyalog ({dlg.replikler.length} Replik)</span>
            </button>
            <button
              type="button"
              id="btn-dialogue-partner"
              onClick={() => setViewMode('partner')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                viewMode === 'partner'
                  ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              <Bot size={14} />
              <span>İnteraktif Partner ({partnerTurns.length} Tur)</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border-subtle)]">
          {dialogues.map((d, i) => {
            const done = progress.completedDialogues.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => switchDialogue(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  i === activeIdx
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)] ring-1 ring-[var(--accent)]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                <span>{i + 1}. {d.baslik}</span>
                {done && <CheckCircle2 size={12} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* GÖRÜNÜM 1: DİYALOG METNİ & GÖLGELEME */}
      {viewMode === 'script' && (
        <div className="space-y-4">
          {/* Oynatma & Gölgeleme Kontrol Çubuğu */}
          <div className="surface-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => startPlayback(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#0b1311] text-xs font-semibold cursor-pointer"
              >
                {playingLine !== -1 ? <Square size={13} /> : <Play size={14} />}
                <span>{playingLine !== -1 ? 'Durdur' : 'Diyalogu Dinle'}</span>
              </button>

              <button
                type="button"
                onClick={() => startPlayback(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--amber-soft)] text-[var(--amber)] text-xs font-semibold cursor-pointer"
              >
                <Repeat size={14} />
                <span>Gölgeleme Modu (2x + Durakla)</span>
              </button>

              {shadowPhase !== 'idle' && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  {shadowPhase === 'listen' ? 'Dinle...' : 'Şimdi sesli tekrar et!'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTr((s) => !s)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)] cursor-pointer"
              >
                {showTr ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>Çeviri</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOkunus((s) => !s)}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)] cursor-pointer"
              >
                {showOkunus ? 'Okunuşu Gizle' : 'Okunuş'}
              </button>
              <button
                type="button"
                onClick={() => markDialogueComplete(dlg.id)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  isCompleted
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                    : 'border border-[var(--border-strong)] text-[var(--text-secondary)]'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>{isCompleted ? 'Tamamlandı' : 'Tamamla'}</span>
              </button>
            </div>
          </div>

          {/* Replikler (12+ satır) */}
          <div className="space-y-3">
            {dlg.replikler.map((line, lIdx) => {
              const isA = lIdx % 2 === 0;
              const active = playingLine === lIdx;
              return (
                <div
                  key={lIdx}
                  className={`flex ${isA ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`w-full max-w-2xl surface-card rounded-2xl p-4 space-y-2 transition-all ${
                      active ? 'ring-2 ring-[var(--accent)]' : ''
                    } ${isA ? '' : 'bg-[var(--bg-elevated)]'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--accent)]">
                        {line.konusan} · #{lIdx + 1}
                      </span>
                      <AudioButton text={line.ar} size="xs" showShadow />
                    </div>

                    <ArabicText
                      text={line.ar}
                      as="p"
                      className="text-xl text-[var(--text-primary)] text-right"
                    />

                    {showOkunus && (
                      <p className="text-xs font-mono text-[var(--accent-strong)]">{line.okunus}</p>
                    )}
                    {showTr && (
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]/70">
                        {line.tr}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GÖRÜNÜM 2: 5 TURLU İNTERAKTİF DİYALOG PARTNERİ */}
      {viewMode === 'partner' && (
        <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                İnteraktif Diyalog Partneri — {Math.min(partnerTurn + 1, partnerTurns.length)} / {partnerTurns.length}. Tur
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Partnerinizin sorusunu dinleyin, gerekirse ipucunu açın ve en uygun Arapça cevabı seçin.
              </p>
            </div>
            <button
              type="button"
              onClick={resetPartner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Baştan Başla</span>
            </button>
          </div>

          {/* Geçmiş Konuşma Akışı */}
          {partnerHistory.length > 0 && (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {partnerHistory.map((h, idx) => (
                <div key={idx} className="subtle-panel rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-muted)]">Tur {h.turn}</span>
                    <span className={h.isCorrect ? 'text-[var(--accent)] font-bold' : 'text-[var(--amber)] font-bold'}>
                      {h.isCorrect ? 'Doğru Yanıt ✓' : 'Tekrar Dene'}
                    </span>
                  </div>
                  <ArabicText text={h.chosenAr} as="p" className="text-base text-[var(--text-primary)] text-right" />
                  <p className="text-[var(--text-secondary)]">{h.feedback}</p>
                </div>
              ))}
            </div>
          )}

          {/* Aktif Tur */}
          {partnerFinished ? (
            <div className="rounded-2xl bg-[var(--accent-soft)] p-6 text-center space-y-3">
              <CheckCircle2 size={32} className="mx-auto text-[var(--accent)]" />
              <h4 className="text-lg font-bold text-[var(--accent-strong)]">
                Tebrikler! 5 Turlu Diyalog Pratiğini Tamamladınız
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Bu diyalog ilerlemenize işlendi. İsterseniz başka bir diyalog senaryosuna geçebilirsiniz.
              </p>
              <button
                type="button"
                onClick={resetPartner}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white dark:text-[#0b1311] text-xs font-semibold cursor-pointer"
              >
                Tekrar Pratik Yap
              </button>
            </div>
          ) : currentTurnObj ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-[var(--bg-subtle)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--accent)]">Partner Söylüyor:</span>
                  <AudioButton text={currentTurnObj.soruAr} size="xs" label="Dinle" />
                </div>
                <ArabicText text={currentTurnObj.soruAr} display as="p" className="text-2xl text-[var(--text-primary)] text-right" />
                <p className="text-xs text-[var(--text-secondary)]">{currentTurnObj.soruTr}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Sizin Cevabınız:</span>
                <button
                  type="button"
                  onClick={() => setShowHint((s) => !s)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--amber)] cursor-pointer"
                >
                  <Lightbulb size={13} />
                  <span>{showHint ? 'İpucunu Gizle' : 'İpucu Göster'}</span>
                </button>
              </div>

              {showHint && (
                <div className="rounded-xl bg-[var(--amber-soft)] px-3.5 py-2.5 text-xs text-[var(--amber)]">
                  <strong>İpucu:</strong> {currentTurnObj.ipucu}
                </div>
              )}

              <div className="space-y-2">
                {currentTurnObj.secenekler.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => choosePartnerReply(oIdx)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] p-3.5 text-right flex items-center justify-between gap-3 transition-all cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[var(--text-muted)] shrink-0">
                      {String.fromCharCode(65 + oIdx)})
                    </span>
                    <div className="flex-1">
                      <ArabicText text={opt.ar} as="div" className="text-lg text-[var(--text-primary)]" />
                      <div className="text-xs text-[var(--text-muted)] text-left">{opt.tr}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
