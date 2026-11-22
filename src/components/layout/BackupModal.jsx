import React, { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext.jsx';

export function BackupModal({ isOpen, onClose }) {
  const { stats, exportProgressJson, importProgressJson, resetProgress } = useProgress();
  const [status, setStatus] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const json = exportProgressJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arapca-kulliyati-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ ok: true, msg: 'İlerleme yedeği JSON dosyası olarak indirildi.' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importProgressJson(String(reader.result || ''));
        setStatus({ ok: true, msg: 'Yedek başarıyla geri yüklendi!' });
      } catch (err) {
        setStatus({ ok: false, msg: err.message || 'JSON okunamadı.' });
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    try {
      importProgressJson(pasteText);
      setPasteText('');
      setStatus({ ok: true, msg: 'Yapıştırılan JSON yedeği başarıyla yüklendi!' });
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Geçersiz JSON.' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="İlerleme Yedekleme"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-popover)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              İlerlemeyi Dışa Aktar / İçe Aktar (JSON)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              SRS kartları, tatbikler, okunan metinler, hata defteri ve sınav puanları taşınır.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mevcut İlerleme Özeti */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="subtle-panel rounded-xl p-2.5">
              <div className="text-lg font-bold text-[var(--accent)]">{stats.learnedCards}</div>
              <div className="text-[11px] text-[var(--text-muted)]">SRS Kart</div>
            </div>
            <div className="subtle-panel rounded-xl p-2.5">
              <div className="text-lg font-bold text-[var(--accent)]">{stats.masteredDrills}</div>
              <div className="text-[11px] text-[var(--text-muted)]">Tatbik</div>
            </div>
            <div className="subtle-panel rounded-xl p-2.5">
              <div className="text-lg font-bold text-[var(--accent)]">{stats.readingsCount}</div>
              <div className="text-[11px] text-[var(--text-muted)]">Okuma</div>
            </div>
            <div className="subtle-panel rounded-xl p-2.5">
              <div className="text-lg font-bold text-[var(--amber)]">{stats.streakDays}g</div>
              <div className="text-[11px] text-[var(--text-muted)]">Seri</div>
            </div>
          </div>

          {status && (
            <div
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                status.ok
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                  : 'bg-[var(--irab-meczum-bg)] text-[var(--irab-meczum-fg)]'
              }`}
            >
              {status.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{status.msg}</span>
            </div>
          )}

          {/* Dışa & İçe Aktar Butonları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              id="btn-export-json"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#0b1311] text-sm font-semibold transition-colors cursor-pointer"
            >
              <Download size={16} />
              <span>JSON Dışa Aktar</span>
            </button>

            <button
              type="button"
              id="btn-import-json-trigger"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-sm font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Upload size={16} />
              <span>JSON Dosyası Yükle</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Yapıştırarak İçe Aktarma */}
          <div className="space-y-2">
            <label htmlFor="textarea-import-json" className="block text-xs font-medium text-[var(--text-secondary)]">
              Veya JSON yedeğini doğrudan yapıştırın:
            </label>
            <textarea
              id="textarea-import-json"
              rows={3}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder='{"version":"4.0.0","srs":{...}}'
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
            {pasteText.trim() && (
              <button
                type="button"
                id="btn-import-json-paste"
                onClick={handlePasteImport}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)] text-xs font-semibold cursor-pointer"
              >
                Yapıştırılan Yedeği Uygula
              </button>
            )}
          </div>

          {/* Sıfırlama */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-600 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Tüm ilerlemeyi sıfırla</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-600">Emin misiniz?</span>
                <button
                  type="button"
                  onClick={() => {
                    resetProgress();
                    setConfirmReset(false);
                    setStatus({ ok: true, msg: 'İlerleme sıfırlandı.' });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Evet, Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-xs cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
