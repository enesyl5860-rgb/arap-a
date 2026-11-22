import React from 'react';
import { formatArabic } from '../../utils/arabicText.js';
import { useProgress } from '../../context/ProgressContext.jsx';

/**
 * 3 Kademeli Hareke Köprüsünü otomatik uygulayan Arapça metin bileşeni.
 * forceMode verilirse global ayarı geçersiz kılar (örn. gramer kurallarında %100 hareke).
 */
export function ArabicText({
  text,
  forceMode = null,
  display = false,
  as: Tag = 'span',
  className = '',
  ...rest
}) {
  const { progress } = useProgress();
  const mode = forceMode || progress.settings.harakaMode;
  const formatted = formatArabic(text, mode);
  const fontClass = display ? 'font-arabic-display' : 'font-arabic';

  return (
    <Tag dir="rtl" lang="ar" className={`${fontClass} ${className}`} {...rest}>
      {formatted}
    </Tag>
  );
}

/**
 * Renk kodlu İ'rab etiketi: Merfû / Mansûb / Mecrûr / Meczûm
 */
export function IrabBadge({ type, label }) {
  const map = {
    merfu: { cls: 'irab-merfu', defaultLabel: 'Merfû (Ötre / Ref)' },
    mansub: { cls: 'irab-mansub', defaultLabel: 'Mansûb (Üstün / Nasb)' },
    mecrur: { cls: 'irab-mecrur', defaultLabel: 'Mecrûr (Esre / Cer)' },
    meczum: { cls: 'irab-meczum', defaultLabel: 'Meczûm (Cezm)' }
  };
  const cfg = map[type] || map.merfu;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cfg.cls}`}>
      {label || cfg.defaultLabel}
    </span>
  );
}
