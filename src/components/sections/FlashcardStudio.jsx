import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Layers,
  Volume2,
  Star,
  RotateCw,
  CheckCircle2,
  Keyboard,
  Filter
} from 'lucide-react';
import { ArabicText } from '../common/ArabicText.jsx';
import { AudioButton } from '../common/AudioControls.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import { speakArabic } from '../../utils/speechEngine.js';

const STUDY_MODES = [
  { id: 'classic', label: 'Klasik Kart' },
  { id: 'listening', label: 'Dinleme' },
  { id: 'cloze', label: 'Cümle İçi Boşluk' },
  { id: 'quiz', label: '4 Şıklı Hızlı Test' }
];

const SRS_BUTTONS = [
  { rating: 1, key: '1', label: 'Tekrar', sub: '10 dk', cls: 'bg-[var(--irab-meczum-bg)] text-[var(--irab-meczum-fg)]' },
  { rating: 2, key: '2', label: 'Zor', sub: '1 gün', cls: 'bg-[var(--amber-soft)] text-[var(--amber)]' },
  { rating: 3, key: '3', label: 'İyi', sub: '4 gün', cls: 'bg-[var(--irab-mecrur-bg)] text-[var(--irab-mecrur-fg)]' },
  { rating: 4, key: '4', label: 'Kolay', sub: '8+ gün', cls: 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' }
];

export function FlashcardStudio({ flashcardsIndex, activeModuleId }) {
  const { progress, rateCard, toggleFavorite } = useProgress();

  const [studyMode, setStudyMode] = useState('classic');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'due' | 'new' | 'favorites'
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizSelected, setQuizSelected] = useState(null);
  const [clozeRevealed, setClozeRevealed] = useState(false);

  const allCards = flashcardsIndex?.cards || [];
  const availableModules = flashcardsIndex?.modules || [];
  const availableTypes = useMemo(
    () => Array.from(new Set(allCards.map((c) => c.tur).filter(Boolean))),
    [allCards]
  );

  const deck = useMemo(() => {
    const now = Date.now();
    return allCards.filter((c) => {
      if (moduleFilter === 'current' && c.moduleId !== activeModuleId) return false;
      if (moduleFilter !== 'all' && moduleFilter !== 'current' && c.moduleId !== moduleFilter) return false;
      if (typeFilter !== 'all' && c.tur !== typeFilter) return false;
      const srs = progress.srs[c.id];
      if (statusFilter === 'due') return !srs || srs.dueAt <= now;
      if (statusFilter === 'new') return !srs;
      if (statusFilter === 'favorites') return progress.favorites.includes(c.id);
      return true;
    });
  }, [allCards, moduleFilter, typeFilter, statusFilter, activeModuleId, progress.srs, progress.favorites]);

  const safeIndex = deck.length > 0 ? cardIndex % deck.length : 0;
  const card = deck[safeIndex] || null;
  const isFav = card ? progress.favorites.includes(card.id) : false;

  // 4 şıklı test seçenekleri (deterministik + kart bazlı)
  const quizOptions = useMemo(() => {
    if (!card || allCards.length < 4) return [];
    const distractors = [];
    const step = Math.max(1, Math.floor(allCards.length / 5));
    let cursor = (safeIndex + 1) % allCards.length;
    while (distractors.length < 3 && distractors.length < allCards.length - 1) {
      const cand = allCards[cursor];
      if (cand.id !== card.id && !distractors.some((d) => d.tr === cand.tr)) {
        distractors.push(cand);
      }
      cursor = (cursor + step) % allCards.length;
    }
    const combined = [card, ...distractors];
    // Karta özel deterministik karıştırma
    const shift = card.id.charCodeAt(card.id.length - 1) % combined.length;
    return [...combined.slice(shift), ...combined.slice(0, shift)];
  }, [card, allCards, safeIndex]);

  const handleRate = useCallback(
    (rating) => {
      if (!card) return;
      rateCard(card.id, rating);
      setFlipped(false);
      setQuizSelected(null);
      setClozeRevealed(false);
      setCardIndex((i) => (deck.length > 0 ? (i + 1) % deck.length : 0));
    },
    [card, rateCard, deck.length]
  );

  // Klavye kısayolları: Space (çevir), R (ses), 1-4 (SRS puanla)
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (!card) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (studyMode === 'cloze') setClozeRevealed((s) => !s);
        else setFlipped((f) => !f);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        speakArabic(card.ar, { rate: progress.settings.speechRate });
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        handleRate(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, studyMode, handleRate, progress.settings.speechRate]);

  // Cümle içi boşluk metni
  const clozeSentence = useMemo(() => {
    if (!card?.ornek) return '';
    if (card.ornek.includes(card.ar)) {
      return card.ornek.replace(card.ar, ' [ _____ ] ');
    }
    const parts = card.ornek.split(' ');
    if (parts.length > 2) {
      parts[Math.floor(parts.length / 2)] = '[ _____ ]';
      return parts.join(' ');
    }
    return `${card.ornek} [ _____ ]`;
  }, [card]);

  return (
    <div className="space-y-6">
      {/* Üst Başlık, 4 Çalışma Modu & Filtreler */}
      <div className="surface-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--accent)]">
              Akıllı Tekrar Stüdyosu (SRS) · {deck.length} Kart Seçili
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
              Aralıklı Tekrar & Kök Ailesi Kartları
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STUDY_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                id={`btn-srs-mode-${m.id}`}
                onClick={() => {
                  setStudyMode(m.id);
                  setFlipped(false);
                  setQuizSelected(null);
                  setClozeRevealed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  studyMode === m.id
                    ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre Çubuğu */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[var(--border-subtle)] text-xs">
          <Filter size={14} className="text-[var(--text-muted)]" />
          <select
            aria-label="Modül filtresi"
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setCardIndex(0);
              setFlipped(false);
            }}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
          >
            <option value="all">Tüm Hazır Modüller ({allCards.length})</option>
            <option value="current">Aktif Modül (M{activeModuleId})</option>
            {availableModules.map((m) => (
              <option key={m.id} value={m.id}>
                Modül {m.id} ({m.count} kart)
              </option>
            ))}
          </select>

          <select
            aria-label="Kelime türü filtresi"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCardIndex(0);
            }}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
          >
            <option value="all">Tüm Türler</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'due', label: 'Tekrar Zamanı' },
              { id: 'new', label: 'Yeni' },
              { id: 'favorites', label: `Favori / Zor (${progress.favorites.length})` }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setStatusFilter(st.id);
                  setCardIndex(0);
                  setFlipped(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KART ALANI */}
      {!card ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-2">
          <Layers size={28} className="mx-auto text-[var(--text-muted)]" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Bu filtreye uyan kart bulunamadı.
          </p>
          <button
            type="button"
            onClick={() => {
              setModuleFilter('all');
              setTypeFilter('all');
              setStatusFilter('all');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white dark:text-[#0b1311] text-xs font-semibold cursor-pointer"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Kart Üst Meta */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
            <span>
              Kart {safeIndex + 1} / {deck.length} · M{card.moduleId} · {card.tur}
            </span>
            <button
              type="button"
              id="btn-card-favorite"
              onClick={() => toggleFavorite(card.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border cursor-pointer ${
                isFav
                  ? 'border-[var(--amber)] bg-[var(--amber-soft)] text-[var(--amber)] font-semibold'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              <Star size={13} className={isFav ? 'fill-current' : ''} />
              <span>{isFav ? 'Favori / Zor Destede' : 'Zor Destesine Ekle'}</span>
            </button>
          </div>

          {/* MOD 1 & 2: KLASİK VE DİNLEME KARTI */}
          {(studyMode === 'classic' || studyMode === 'listening') && (
            <div className="surface-card rounded-2xl p-6 sm:p-8 min-h-[320px] flex flex-col justify-between gap-6">
              {!flipped ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  {studyMode === 'listening' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => speakArabic(card.ar, { rate: progress.settings.speechRate })}
                        className="h-20 w-20 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Volume2 size={36} />
                      </button>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Önce dinleyin ve anlamını hatırlamaya çalışın, sonra kartı çevirin.
                      </p>
                    </>
                  ) : (
                    <>
                      <ArabicText
                        text={card.ar}
                        display
                        as="div"
                        className="text-4xl sm:text-5xl text-[var(--text-primary)]"
                      />
                      <div className="flex items-center gap-2">
                        <AudioButton text={card.ar} size="md" showShadow label="Dinle (R)" />
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-muted)]">
                          Kök: {card.kok}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                    <div>
                      <h3 className="text-2xl font-bold text-[var(--text-primary)]">{card.tr}</h3>
                      <p className="text-sm font-mono text-[var(--accent-strong)] mt-0.5">{card.okunus}</p>
                    </div>
                    <div className="text-right">
                      <ArabicText text={card.ar} forceMode="full" display as="div" className="text-3xl text-[var(--accent)]" />
                      <span className="text-xs text-[var(--text-muted)]">Harekesiz: {card.harekesiz}</span>
                    </div>
                  </div>

                  {/* Kök, Vezin, Türevler ve Ek Bilgi */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="subtle-panel rounded-xl p-3">
                      <div className="text-[var(--text-muted)]">3 Harfli Kök</div>
                      <div className="font-arabic text-base font-bold text-[var(--text-primary)] mt-0.5">
                        {card.kok}
                      </div>
                    </div>
                    <div className="subtle-panel rounded-xl p-3">
                      <div className="text-[var(--text-muted)]">Vezin / Kalıp</div>
                      <div className="font-arabic text-base font-bold text-[var(--text-primary)] mt-0.5">
                        {card.vezin}
                      </div>
                    </div>
                    <div className="subtle-panel rounded-xl p-3">
                      <div className="text-[var(--text-muted)]">Ek Bilgi</div>
                      <div className="font-medium text-[var(--text-primary)] mt-0.5">{card.ekBilgi}</div>
                    </div>
                  </div>

                  {card.turevler?.length > 0 && (
                    <div className="subtle-panel rounded-xl p-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-[var(--text-muted)]">Kök Ailesi (Türevler)</div>
                      <div className="flex flex-wrap gap-2">
                        {card.turevler.map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs"
                          >
                            <ArabicText text={t.ar} forceMode="full" className="text-base text-[var(--accent-strong)]" />
                            <span className="text-[var(--text-secondary)]">{t.tr}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Harekeli Sesli Örnek Cümle */}
                  <div className="rounded-xl bg-[var(--accent-soft)]/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <AudioButton text={card.ornek} size="xs" showShadow />
                      <ArabicText text={card.ornek} as="p" className="text-xl text-[var(--text-primary)] text-right flex-1" />
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">{card.ornekTr}</p>
                    <p className="text-xs text-[var(--text-muted)]">Not: {card.kullanimNotu}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  id="btn-flip-card"
                  onClick={() => setFlipped((f) => !f)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                >
                  <RotateCw size={14} />
                  <span>{flipped ? 'Ön Yüzü Göster (Space)' : 'Cevabı & Kök Analizini Göster (Space)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* MOD 3: CÜMLE İÇİ BOŞLUK (CLOZE) */}
          {studyMode === 'cloze' && (
            <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Cümle İçi Boşluk (Cloze)
              </span>
              <ArabicText text={clozeSentence} display as="p" className="text-2xl sm:text-3xl text-[var(--text-primary)]" />
              <p className="text-sm text-[var(--text-secondary)]">{card.ornekTr}</p>
              <p className="text-xs text-[var(--text-muted)]">
                İpucu — Hedef anlam: <strong>{card.tr}</strong> · Kök: {card.kok}
              </p>

              {clozeRevealed ? (
                <div className="rounded-xl bg-[var(--accent-soft)] p-4 space-y-2">
                  <ArabicText text={card.ar} forceMode="full" display as="div" className="text-3xl text-[var(--accent-strong)]" />
                  <p className="text-xs font-mono text-[var(--accent-strong)]">{card.okunus}</p>
                  <AudioButton text={card.ornek} size="xs" label="Tam Cümleyi Dinle" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setClozeRevealed(true)}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white dark:text-[#0b1311] text-xs font-semibold cursor-pointer"
                >
                  Eksik Kelimeyi Göster (Space)
                </button>
              )}
            </div>
          )}

          {/* MOD 4: 4 ŞIKLI HIZLI TEST */}
          {studyMode === 'quiz' && (
            <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  4 Şıklı Hızlı Test
                </span>
                <ArabicText text={card.ar} display as="div" className="text-4xl text-[var(--text-primary)]" />
                <AudioButton text={card.ar} size="xs" label="Dinle" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quizOptions.map((opt, idx) => {
                  const isCorrect = opt.id === card.id;
                  const chosen = quizSelected === idx;
                  let cls = 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]';
                  if (quizSelected !== null) {
                    if (isCorrect) cls = 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]';
                    else if (chosen) cls = 'border-red-500/70 bg-[var(--irab-meczum-bg)] text-[var(--irab-meczum-fg)]';
                  }
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuizSelected(idx)}
                      className={`px-4 py-3 rounded-xl border text-left text-sm font-medium cursor-pointer ${cls}`}
                    >
                      <strong>{String.fromCharCode(65 + idx)})</strong> {opt.tr}
                    </button>
                  );
                })}
              </div>

              {quizSelected !== null && (
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[var(--accent)]" />
                    Doğru karşılık: <strong>{card.tr}</strong> ({card.okunus})
                  </span>
                  <span>Aşağıdan SRS puanı vererek sonraki karta geçin</span>
                </div>
              )}
            </div>
          )}

          {/* 4 DERECELİ SRS PUANLAMA ÇUBUĞU */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SRS_BUTTONS.map((b) => (
              <button
                key={b.rating}
                type="button"
                id={`btn-srs-rate-${b.rating}`}
                onClick={() => handleRate(b.rating)}
                className={`rounded-xl px-3 py-3 text-center transition-transform hover:-translate-y-0.5 cursor-pointer ${b.cls}`}
              >
                <div className="text-sm font-bold">
                  [{b.key}] {b.label}
                </div>
                <div className="text-[11px] opacity-80">{b.sub}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Keyboard size={13} />
            <span>Kısayollar: Space (Çevir) · R (Seslendir) · 1–4 (Tekrar / Zor / İyi / Kolay)</span>
          </div>
        </div>
      )}
    </div>
  );
}
