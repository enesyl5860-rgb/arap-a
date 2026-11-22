import React, { useState } from 'react';
import {
  Blocks,
  TrendingUp,
  Puzzle,
  CheckCircle2,
  RotateCcw,
  Shuffle
} from 'lucide-react';
import { ArabicText } from '../common/ArabicText.jsx';
import { AudioButton } from '../common/AudioControls.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';

export function SentenceWorkshop({ moduleData }) {
  const { progress, markWorkshopComplete } = useProgress();
  const [subTab, setSubTab] = useState('motors'); // 'motors' | 'ladders' | 'blocks'

  // Kalıp Motoru seçimleri: { [motorId]: number[] }
  const [motorSelections, setMotorSelections] = useState({});
  // Merdiven açık adım: { [ladderId]: number }
  const [ladderStep, setLadderStep] = useState({});
  // Kelime bloğu inşası: { [blockId]: number[] } (seçilen token indeksleri)
  const [blockChosen, setBlockChosen] = useState({});
  const [blockChecked, setBlockChecked] = useState({});

  if (!moduleData?.workshop) return null;
  const { motors = [], merdivenler = [], bloklar = [] } = moduleData.workshop;

  const getMotorSelection = (motor) =>
    motorSelections[motor.id] || motor.slotlar.map(() => 0);

  const setSlotIndex = (motor, slotIdx, optIdx) => {
    const cur = [...getMotorSelection(motor)];
    cur[slotIdx] = optIdx;
    setMotorSelections((prev) => ({ ...prev, [motor.id]: cur }));
  };

  const randomizeMotor = (motor) => {
    const next = motor.slotlar.map((s) => Math.floor(Math.random() * s.secenekler.length));
    setMotorSelections((prev) => ({ ...prev, [motor.id]: next }));
  };

  const toggleBlockToken = (block, tokenIdx) => {
    const cur = blockChosen[block.id] || [];
    const exists = cur.includes(tokenIdx);
    const next = exists ? cur.filter((i) => i !== tokenIdx) : [...cur, tokenIdx];
    setBlockChosen((prev) => ({ ...prev, [block.id]: next }));
    setBlockChecked((prev) => ({ ...prev, [block.id]: undefined }));
  };

  const checkBlock = (block) => {
    const chosenIdxs = blockChosen[block.id] || [];
    const built = chosenIdxs.map((i) => block.karisik[i]).join(' ').trim();
    const target = block.hedefAr.trim();
    const ok = built === target;
    setBlockChecked((prev) => ({ ...prev, [block.id]: ok }));
    if (ok) markWorkshopComplete(block.id);
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve 3 Alt Sekme */}
      <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-xs font-semibold text-[var(--accent)]">
            Modül {moduleData.id} · Cümle Kurma Atölyesi
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5">
            Üreterek Öğrenme Stüdyosu
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Kalıp motorlarıyla yüzlerce kombinasyon kurun, A1→B2 genişletme merdivenleriyle cümle büyütme mantığını kavrayın ve kelime bloklarını dizin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            id="tab-workshop-motors"
            onClick={() => setSubTab('motors')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              subTab === 'motors'
                ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
            }`}
          >
            <Blocks size={15} />
            <span>Kalıp Motorları ({motors.length})</span>
          </button>

          <button
            type="button"
            id="tab-workshop-ladders"
            onClick={() => setSubTab('ladders')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              subTab === 'ladders'
                ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
            }`}
          >
            <TrendingUp size={15} />
            <span>A1→B2 Genişletme Merdivenleri ({merdivenler.length})</span>
          </button>

          <button
            type="button"
            id="tab-workshop-blocks"
            onClick={() => setSubTab('blocks')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              subTab === 'blocks'
                ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
            }`}
          >
            <Puzzle size={15} />
            <span>Kelime Bloğu İnşası ({bloklar.length})</span>
          </button>
        </div>
      </div>

      {/* 1) 6 Etkileşimli Kalıp Motoru */}
      {subTab === 'motors' && (
        <div className="space-y-5">
          {motors.map((motor, mIdx) => {
            const sel = getMotorSelection(motor);
            const assembledAr = motor.slotlar
              .map((s, i) => s.secenekler[sel[i]]?.ar || '')
              .join(' ')
              .trim();
            const assembledOkunus = motor.slotlar
              .map((s, i) => s.secenekler[sel[i]]?.okunus || '')
              .join(' ')
              .trim();
            const assembledTr = motor.slotlar
              .map((s, i) => s.secenekler[sel[i]]?.tr || '')
              .join(' ')
              .trim();

            return (
              <section key={motor.id} className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[var(--accent)]">Kalıp Motoru {mIdx + 1}</span>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{motor.baslik}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{motor.formul}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => randomizeMotor(motor)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer"
                  >
                    <Shuffle size={13} />
                    <span>Rastgele Üret</span>
                  </button>
                </div>

                {/* Canlı Üretilen Cümle Önizleme */}
                <div className="rounded-xl bg-[var(--accent-soft)]/70 border border-[var(--accent)]/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <AudioButton text={assembledAr} size="md" showShadow label="Dinle" />
                  <div className="text-right flex-1">
                    <ArabicText text={assembledAr} display as="p" className="text-2xl sm:text-3xl text-[var(--text-primary)]" />
                    <p className="text-xs font-mono text-[var(--accent-strong)] mt-1">{assembledOkunus}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{assembledTr}</p>
                  </div>
                </div>

                {/* Slot Seçicileri (Her slotta 6 seçenek) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {motor.slotlar.map((slot, sIdx) => (
                    <div key={sIdx} className="subtle-panel rounded-xl p-3 space-y-2">
                      <div className="text-xs font-bold text-[var(--text-secondary)]">{slot.etiket}</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {slot.secenekler.map((opt, oIdx) => {
                          const active = sel[sIdx] === oIdx;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => setSlotIndex(motor, sIdx, oIdx)}
                              className={`px-2.5 py-2 rounded-lg border text-right transition-all cursor-pointer ${
                                active
                                  ? 'border-[var(--accent)] bg-[var(--bg-surface)] ring-1 ring-[var(--accent)]'
                                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 hover:border-[var(--accent)]'
                              }`}
                            >
                              <ArabicText text={opt.ar} as="div" className="text-base text-[var(--text-primary)]" />
                              <div className="text-[10px] text-[var(--text-muted)] text-left truncate">{opt.tr}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 2) 4 Adet 5 Basamaklı A1->B2 Genişletme Merdiveni */}
      {subTab === 'ladders' && (
        <div className="space-y-5">
          {merdivenler.map((ladder, lIdx) => {
            const visibleCount = ladderStep[ladder.id] || 5;
            return (
              <section key={ladder.id} className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[var(--accent)]">
                      Genişletme Merdiveni {lIdx + 1} · 5 Basamak
                    </span>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{ladder.baslik}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((stepNum) => (
                      <button
                        key={stepNum}
                        type="button"
                        onClick={() => setLadderStep((p) => ({ ...p, [ladder.id]: stepNum }))}
                        className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${
                          visibleCount >= stepNum
                            ? 'bg-[var(--accent)] text-white dark:text-[#0b1311]'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                        }`}
                      >
                        {stepNum}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {ladder.adimlar.slice(0, visibleCount).map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="subtle-panel rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                          {step.seviye}
                        </span>
                        <AudioButton text={step.ar} size="xs" showShadow />
                      </div>
                      <div className="flex-1 text-right space-y-1">
                        <ArabicText text={step.ar} as="p" className="text-xl text-[var(--text-primary)]" />
                        <p className="text-xs font-mono text-[var(--accent-strong)]">{step.okunus}</p>
                        <p className="text-sm font-medium text-[var(--text-primary)] text-left sm:text-right">
                          {step.tr}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] text-left sm:text-right">
                          + Eklenen: {step.ekleme}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 3) 15 Kelime Bloğu İnşası */}
      {subTab === 'blocks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bloklar.map((block, bIdx) => {
            const chosenIdxs = blockChosen[block.id] || [];
            const checked = blockChecked[block.id];
            const mastered = progress.completedWorkshops.includes(block.id);

            return (
              <section key={block.id} className="surface-card rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--accent)]">Blok İnşası {bIdx + 1}</span>
                  {mastered && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                      <CheckCircle2 size={14} /> Doğru Kuruldu
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-[var(--text-primary)]">{block.tr}</p>
                {block.ipucu && <p className="text-xs text-[var(--text-muted)]">İpucu: {block.ipucu}</p>}

                {/* Oluşturulan Cümle Alanı (RTL) */}
                <div
                  dir="rtl"
                  className="min-h-14 rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)] p-2.5 flex flex-wrap gap-2 items-center"
                >
                  {chosenIdxs.length === 0 ? (
                    <span dir="ltr" className="text-xs text-[var(--text-muted)] mx-auto">
                      Aşağıdaki bloklara sırayla tıklayarak cümleyi kurun
                    </span>
                  ) : (
                    chosenIdxs.map((tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => toggleBlockToken(block, tIdx)}
                        className="px-3 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)] font-arabic text-lg cursor-pointer"
                      >
                        <ArabicText text={block.karisik[tIdx]} />
                      </button>
                    ))
                  )}
                </div>

                {/* Karışık Havuz */}
                <div dir="rtl" className="flex flex-wrap gap-2">
                  {block.karisik.map((tok, tIdx) => {
                    const used = chosenIdxs.includes(tIdx);
                    return (
                      <button
                        key={tIdx}
                        type="button"
                        disabled={used}
                        onClick={() => toggleBlockToken(block, tIdx)}
                        className={`px-3 py-1 rounded-lg border font-arabic text-lg transition-all cursor-pointer ${
                          used
                            ? 'opacity-35 border-transparent bg-[var(--bg-subtle)] cursor-default'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <ArabicText text={tok} />
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => checkBlock(block)}
                      disabled={chosenIdxs.length === 0}
                      className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white dark:text-[#0b1311] text-xs font-semibold cursor-pointer"
                    >
                      Kontrol Et
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBlockChosen((p) => ({ ...p, [block.id]: [] }));
                        setBlockChecked((p) => ({ ...p, [block.id]: undefined }));
                      }}
                      className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] cursor-pointer"
                      title="Sıfırla"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                  <AudioButton text={block.hedefAr} size="xs" label="Hedefi Dinle" />
                </div>

                {checked !== undefined && (
                  <div
                    className={`rounded-xl px-3 py-2 text-xs ${
                      checked
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                        : 'bg-[var(--amber-soft)] text-[var(--amber)]'
                    }`}
                  >
                    {checked ? (
                      <span>Harika! Cümle tam doğru kuruldu.</span>
                    ) : (
                      <div className="space-y-1">
                        <span>Tekrar deneyin. Doğru sıralama:</span>
                        <ArabicText text={block.hedefAr} as="p" className="text-lg text-[var(--text-primary)]" />
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
