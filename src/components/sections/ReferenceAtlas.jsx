import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  AlertCircle,
  Sparkles,
  BookMarked,
  Link2,
  GitBranch,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { ArabicText } from '../common/ArabicText.jsx';
import { AudioButton } from '../common/AudioControls.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import { normalizeArabicSearch } from '../../utils/arabicText.js';

export function ReferenceAtlas({ rootsIndex, atlasIndex }) {
  const { progress, removeErrorItem } = useProgress();
  const [tab, setTab] = useState('roots'); // 'roots' | 'verbs' | 'connectors' | 'cards' | 'practice' | 'errors'
  const [query, setQuery] = useState('');
  const [practiceCategory, setPracticeCategory] = useState('all');
  const [practiceAnswers, setPracticeAnswers] = useState({});

  const q = query.trim().toLowerCase();
  const qAr = normalizeArabicSearch(query);

  const filteredRoots = useMemo(() => {
    const list = rootsIndex?.roots || [];
    if (!q) return list;
    return list.filter((r) => {
      const hay = `${r.kok} ${r.kelimeler.map((k) => `${k.tr} ${k.okunus}`).join(' ')}`.toLowerCase();
      const hayAr = normalizeArabicSearch(`${r.kok} ${r.kelimeler.map((k) => k.ar).join(' ')}`);
      return hay.includes(q) || (qAr && hayAr.includes(qAr));
    });
  }, [rootsIndex, q, qAr]);

  const filteredVerbs = useMemo(() => {
    const list = atlasIndex?.prepositionalVerbs || [];
    if (!q) return list;
    return list.filter(
      (v) =>
        `${v.tr} ${v.not || ''} ${v.kategori || ''}`.toLowerCase().includes(q) ||
        (qAr && normalizeArabicSearch(`${v.ar} ${v.ornek || ''}`).includes(qAr))
    );
  }, [atlasIndex, q, qAr]);

  const filteredConnectors = useMemo(() => {
    const list = atlasIndex?.connectors || [];
    if (!q) return list;
    return list.filter(
      (c) =>
        `${c.tr} ${c.grup || ''} ${c.not || ''}`.toLowerCase().includes(q) ||
        (qAr && normalizeArabicSearch(`${c.ar} ${c.ornek || ''}`).includes(qAr))
    );
  }, [atlasIndex, q, qAr]);

  const filteredSummaries = useMemo(() => {
    const list = atlasIndex?.grammarCards || [];
    if (!q) return list;
    return list.filter(
      (g) =>
        `${g.baslik} ${g.formul} ${g.mantik}`.toLowerCase().includes(q) ||
        (qAr && normalizeArabicSearch(g.arBaslik || '').includes(qAr))
    );
  }, [atlasIndex, q, qAr]);

  const practicePool = useMemo(() => {
    const list = atlasIndex?.quickPractice || [];
    if (practiceCategory === 'all') return list;
    return list.filter((item) => item.kategori === practiceCategory);
  }, [atlasIndex, practiceCategory]);

  const practiceCategories = useMemo(
    () => Array.from(new Set((atlasIndex?.quickPractice || []).map((i) => i.kategori))),
    [atlasIndex]
  );

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Sekmeler */}
      <div className="surface-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--accent)]">
              Hızlı Referans Atlası & YDS/YÖKDİL Laboratuvarı
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
              Kök Aileleri, Harf-i Cerli Fiiller, Bağlaçlar & Hata Defteri
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Tamamlanan modüllerden otomatik beslenen aranabilir referans merkezi ve kategori bazlı hızlı pratik.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kök, fiil, bağlaç veya kural ara..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border-subtle)]">
          {[
            { id: 'roots', label: `Kök Aileleri (${rootsIndex?.roots?.length || 0})`, icon: GitBranch },
            { id: 'verbs', label: `Harf-i Cerli Fiiller (${atlasIndex?.prepositionalVerbs?.length || 0})`, icon: Link2 },
            { id: 'connectors', label: `YDS/YÖKDİL Bağlaçlar (${atlasIndex?.connectors?.length || 0})`, icon: Compass },
            { id: 'cards', label: `Sarf/Nahiv Kartelaları (${atlasIndex?.grammarCards?.length || 0})`, icon: BookMarked },
            { id: 'practice', label: `Hızlı Sınav Pratiği (${atlasIndex?.quickPractice?.length || 0})`, icon: Sparkles },
            { id: 'errors', label: `Hata Defteri (${progress.errorNotebook.length})`, icon: AlertCircle }
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                id={`tab-atlas-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  tab === t.id
                    ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1) KÖK AİLELERİ ATLASI */}
      {tab === 'roots' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRoots.map((root) => (
            <article key={root.kok} className="surface-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <ArabicText text={root.kok} forceMode="full" className="text-2xl font-bold text-[var(--accent)]" />
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  {root.kelimeler.length} kelime
                </span>
              </div>
              <div className="space-y-2">
                {root.kelimeler.map((w, idx) => (
                  <div key={idx} className="subtle-panel rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{w.tr}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {w.vezin} · M{w.moduleId}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ArabicText text={w.ar} forceMode="full" className="text-lg text-[var(--accent-strong)]" />
                      <AudioButton text={w.ar} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 2) HARF-İ CERLİ FİİLLER ATLASI */}
      {tab === 'verbs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVerbs.map((v, idx) => (
            <article key={idx} className="surface-card rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-strong)] text-[10px] font-bold">
                  {v.kategori}
                </span>
                <div className="flex items-center gap-2">
                  <ArabicText text={v.ar} forceMode="full" className="text-xl font-bold text-[var(--text-primary)]" />
                  <AudioButton text={v.ar} size="xs" />
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{v.tr}</p>
              {v.ornek && (
                <div className="subtle-panel rounded-xl p-2.5 space-y-1">
                  <ArabicText text={v.ornek} as="p" className="text-base text-right text-[var(--text-primary)]" />
                  <p className="text-xs text-[var(--text-secondary)]">{v.ornekTr}</p>
                </div>
              )}
              {v.not && <p className="text-xs text-[var(--text-muted)]">{v.not}</p>}
            </article>
          ))}
        </div>
      )}

      {/* 3) YDS / YÖKDİL BAĞLAÇLAR ATLASI */}
      {tab === 'connectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConnectors.map((c, idx) => (
            <article key={idx} className="surface-card rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-[var(--amber-soft)] text-[var(--amber)] text-[10px] font-bold">
                  {c.grup}
                </span>
                <div className="flex items-center gap-2">
                  <ArabicText text={c.ar} forceMode="full" className="text-xl font-bold text-[var(--accent)]" />
                  <AudioButton text={c.ar} size="xs" />
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{c.tr}</p>
              <p className="text-xs text-[var(--text-muted)]">{c.not}</p>
              {c.ornek && (
                <div className="subtle-panel rounded-xl p-2.5 space-y-1">
                  <ArabicText text={c.ornek} as="p" className="text-base text-right" />
                  <p className="text-xs text-[var(--text-secondary)]">{c.ornekTr}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* 4) SARF / NAHİV ÖZET KARTELALARI */}
      {tab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSummaries.map((g) => (
            <article key={g.id} className="surface-card rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--accent)]">Modül {g.moduleId}</span>
                {g.arBaslik && <ArabicText text={g.arBaslik} forceMode="full" className="text-lg text-[var(--accent-strong)]" />}
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">{g.baslik}</h3>
              <div className="subtle-panel rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">
                {g.formul}
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{g.mantik}</p>
            </article>
          ))}
        </div>
      )}

      {/* 5) KATEGORİ BAZLI HIZLI SINAV PRATİĞİ */}
      {tab === 'practice' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPracticeCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                practiceCategory === 'all'
                  ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              Tüm Kategoriler
            </button>
            {practiceCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setPracticeCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  practiceCategory === cat
                    ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {practicePool.map((q, idx) => {
              const chosen = practiceAnswers[q.id];
              const answered = chosen !== undefined;
              const ok = chosen === q.dogruIndeks;
              return (
                <div key={q.id} className="surface-card rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--accent)]">
                      Pratik {idx + 1} · {q.kategori}
                    </span>
                    <span className="text-[var(--text-muted)]">M{q.moduleId}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{q.soru}</p>
                  {q.soruAr && <ArabicText text={q.soruAr} as="p" className="text-xl text-right" />}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.secenekler.map((opt, oIdx) => {
                      let cls = 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]';
                      if (answered) {
                        if (oIdx === q.dogruIndeks) cls = 'border-[var(--accent)] bg-[var(--accent-soft)]';
                        else if (oIdx === chosen && !ok) cls = 'border-red-500/70 bg-[var(--irab-meczum-bg)]';
                      }
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setPracticeAnswers((p) => ({ ...p, [q.id]: oIdx }))}
                          className={`px-3.5 py-2 rounded-xl border text-left text-xs sm:text-sm cursor-pointer ${cls}`}
                        >
                          <strong>{String.fromCharCode(65 + oIdx)})</strong> {opt}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      <strong>Çözüm:</strong> {q.aciklama}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6) AKILLI HATA DEFTERİ */}
      {tab === 'errors' && (
        <div className="space-y-3">
          {progress.errorNotebook.length === 0 ? (
            <div className="surface-card rounded-2xl p-10 text-center space-y-2">
              <CheckCircle2 size={28} className="mx-auto text-[var(--accent)]" />
              <p className="text-sm font-bold text-[var(--text-primary)]">Hata Defteriniz Tertemiz!</p>
              <p className="text-xs text-[var(--text-muted)]">
                Tatbiklerde veya okuma sorularında yanlış yaptığınız sorular tekrar etmeniz için otomatik olarak burada toplanır.
              </p>
            </div>
          ) : (
            progress.errorNotebook.map((err) => (
              <div key={err.id} className="surface-card rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--amber)]">{err.source}</span>
                  <button
                    type="button"
                    onClick={() => removeErrorItem(err.id)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Öğrendim, Kaldır</span>
                  </button>
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{err.prompt}</p>
                <div className="subtle-panel rounded-xl p-3 text-xs space-y-1">
                  <div>
                    <span className="text-[var(--text-muted)]">Doğru Cevap: </span>
                    <strong className="text-[var(--accent-strong)]">{err.correctAnswer}</strong>
                  </div>
                  <p className="text-[var(--text-secondary)]">{err.explanation}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
