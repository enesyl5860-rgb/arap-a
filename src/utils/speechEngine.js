/**
 * Gelişmiş Ses & Gölgeleme (Shadowing) Motoru
 * Web Speech API (ar-SA öncelikli, ar-* yedekli), hız kontrolü (0.7x / 0.85x / 1.0x)
 * ve otomatik tekrar / gölgeleme (Dinle -> Durakla -> Sonraki) desteği.
 */

let currentRunId = 0;
let cachedVoices = [];

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  cachedVoices = window.speechSynthesis.getVoices() || [];
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function getArabicVoice() {
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase() === 'ar-sa') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('ar-')) ||
    voices.find((v) => v.lang?.toLowerCase() === 'ar') ||
    null
  );
}

export function stopSpeaking() {
  currentRunId += 1;
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Tek bir Arapça metni seslendirir.
 */
export function speakArabic(text, { rate = 0.85, onStart, onEnd, onError } = {}) {
  if (!text || !isSpeechSupported()) {
    onError?.('Tarayıcınız Web Speech seslendirmeyi desteklemiyor.');
    return false;
  }
  stopSpeaking();
  const runId = currentRunId;

  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = 'ar-SA';
  utterance.rate = rate;
  utterance.pitch = 1;

  const voice = getArabicVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => {
    if (runId === currentRunId) onStart?.();
  };
  utterance.onend = () => {
    if (runId === currentRunId) onEnd?.();
  };
  utterance.onerror = (e) => {
    if (runId === currentRunId) onError?.(e?.error || 'Seslendirme hatası');
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Bir cümleyi N kez tekrar eder veya diyalog/paragraf listesini gölgeleme duraklamalarıyla okur.
 * @param {string[]} lines Seslendirilecek Arapça satırlar
 * @param {object} options
 */
export async function playShadowingSequence(
  lines,
  { rate = 0.85, repeatEach = 1, pauseMs = 1800, onLineChange, onPhaseChange, onComplete } = {}
) {
  if (!lines?.length || !isSpeechSupported()) {
    onComplete?.();
    return;
  }
  stopSpeaking();
  const runId = currentRunId;

  const speakOnce = (txt) =>
    new Promise((resolve) => {
      if (runId !== currentRunId) return resolve(false);
      const u = new SpeechSynthesisUtterance(String(txt));
      u.lang = 'ar-SA';
      u.rate = rate;
      const v = getArabicVoice();
      if (v) u.voice = v;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(true);
      window.speechSynthesis.speak(u);
    });

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < lines.length; i++) {
    if (runId !== currentRunId) return;
    onLineChange?.(i);

    for (let r = 0; r < repeatEach; r++) {
      if (runId !== currentRunId) return;
      onPhaseChange?.('listen', i, r + 1);
      await speakOnce(lines[i]);
      if (runId !== currentRunId) return;

      if (pauseMs > 0) {
        onPhaseChange?.('shadow', i, r + 1);
        await wait(pauseMs);
      }
    }
  }

  if (runId === currentRunId) {
    onPhaseChange?.('idle', -1, 0);
    onLineChange?.(-1);
    onComplete?.();
  }
}

export const SPEECH_RATES = [
  { value: 0.7, label: '0.7x Yavaş' },
  { value: 0.85, label: '0.85x Doğal' },
  { value: 1.0, label: '1.0x Akıcı' }
];
