import React, { useState } from 'react';
import { Volume2, Repeat, Square } from 'lucide-react';
import { speakArabic, playShadowingSequence, stopSpeaking } from '../../utils/speechEngine.js';
import { useProgress } from '../../context/ProgressContext.jsx';

/**
 * Tek tıkla Arapça seslendirme düğmesi (+ opsiyonel 2x gölgeleme tekrarı)
 */
export function AudioButton({ text, size = 'sm', showShadow = false, label = '', className = '' }) {
  const { progress } = useProgress();
  const [playing, setPlaying] = useState(false);

  const handlePlay = (e) => {
    e?.stopPropagation?.();
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speakArabic(text, {
      rate: progress.settings.speechRate,
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false)
    });
  };

  const handleShadow = (e) => {
    e?.stopPropagation?.();
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    playShadowingSequence([text], {
      rate: progress.settings.speechRate,
      repeatEach: 2,
      pauseMs: 1700,
      onComplete: () => setPlaying(false)
    });
  };

  const pad = size === 'xs' ? 'p-1' : size === 'md' ? 'px-3 py-1.5' : 'p-1.5';
  const iconSize = size === 'xs' ? 14 : 16;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handlePlay}
        title={playing ? 'Durdur' : 'Arapça dinle'}
        aria-label={playing ? 'Seslendirmeyi durdur' : 'Arapça dinle'}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] text-[var(--text-secondary)] transition-colors cursor-pointer ${pad}`}
      >
        {playing ? <Square size={iconSize} className="fill-current" /> : <Volume2 size={iconSize} />}
        {label && <span className="text-xs font-medium">{label}</span>}
      </button>

      {showShadow && (
        <button
          type="button"
          onClick={handleShadow}
          title="Gölgeleme (2 kez dinle + tekrar boşluğu)"
          aria-label="Gölgeleme tekrarı"
          className={`inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--amber-soft)] hover:text-[var(--amber)] text-[var(--text-muted)] transition-colors cursor-pointer ${pad}`}
        >
          <Repeat size={iconSize - 1} />
        </button>
      )}
    </span>
  );
}
