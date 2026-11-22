/**
 * 3 Kademeli Hareke Köprüsü & Arapça Metin Yardımcıları
 *
 * Modlar:
 *  - 'full'  : (1) Tam Harekeli (A1) — kaynak %100 harekeli metin
 *  - 'irab'  : (2) Kısmi / Son Hareke — İ'rab Modu (A2–B1) — iç kısa harekeler gizlenir,
 *                  kelime sonu i'rab harekeleri, tenvîn ve şedde korunur.
 *  - 'plain' : (3) Harekesiz Gerçek Gazete / YDS Modu (B2) — tüm harekeler temizlenir.
 */

const TASHKEEL_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const HARAKA_CHAR_RE = /[\u064B-\u065F\u0670]/;
const SHADDA = '\u0651';
const ARABIC_LETTER_RE = /[\u0621-\u064A\u0671]/;

/**
 * Tüm harekeleri kaldırır (B2 / YDS Gazete Modu ve arama normalizasyonu).
 */
export function stripHarakat(text = '') {
  if (!text) return '';
  return String(text).replace(TASHKEEL_RE, '');
}

/**
 * Arama için Arapça metni normalize eder (harekesiz + hemze/elif/tâ-i merbûta eşitleme).
 */
export function normalizeArabicSearch(text = '') {
  return stripHarakat(text)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

/**
 * Tek bir Arapça kelimede yalnızca son harfin i'rab harekelerini ve kelime içi şeddeleri korur.
 */
function toIrabWord(word) {
  if (!word) return '';
  // Kelimedeki son Arapça harfin indeksini bul
  let lastLetterIdx = -1;
  for (let i = word.length - 1; i >= 0; i--) {
    if (ARABIC_LETTER_RE.test(word[i])) {
      lastLetterIdx = i;
      break;
    }
  }
  if (lastLetterIdx === -1) return word;

  let out = '';
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (HARAKA_CHAR_RE.test(ch)) {
      // Son harften sonraki tüm harekeleri (i'rab + tenvîn) ve her yerdeki şeddeyi koru
      if (i > lastLetterIdx || ch === SHADDA) {
        out += ch;
      }
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * 3 kademeli hareke köprüsünü uygular.
 * @param {string} text Tam harekeli Arapça metin
 * @param {'full' | 'irab' | 'plain'} mode Hareke seviyesi
 */
export function formatArabic(text = '', mode = 'full') {
  if (!text) return '';
  if (mode === 'full') return text;
  if (mode === 'plain') return stripHarakat(text);
  // 'irab' modu: boşluk ve noktalama sınırlarından kelimelere ayırarak son hareke + şeddeyi koru
  return String(text).replace(/[\u0600-\u06FF]+/g, (token) => toIrabWord(token));
}

/**
 * Arapça metindeki hareke yoğunluğunu ölçer (validate.mjs ile uyumlu).
 */
export function computeHarakaDensity(text = '') {
  const letters = (String(text).match(/[\u0621-\u064A]/g) || []).length;
  if (letters === 0) return 0;
  const marks = (String(text).match(/[\u064B-\u0652\u0670]/g) || []).length;
  return marks / letters;
}

export const HARAKA_MODES = [
  {
    id: 'full',
    shortLabel: 'Tam Harekeli',
    badge: 'A1',
    description: 'Tüm harekeler, şedde ve tenvîn görünür'
  },
  {
    id: 'irab',
    shortLabel: "İ'rab Modu",
    badge: 'A2–B1',
    description: "Yalnızca kelime sonu i'rab harekeleri ve şedde görünür"
  },
  {
    id: 'plain',
    shortLabel: 'Harekesiz YDS',
    badge: 'B2',
    description: 'Gerçek gazete ve YDS/YÖKDİL sınav görünümü'
  }
];
