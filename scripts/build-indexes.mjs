#!/usr/bin/env node
/**
 * Hafif İndeks Üreticisi (scripts/build-indexes.mjs)
 * Modül JSON dosyalarını (modul_01..55.json) tarayarak:
 *  - src/data/indexes/flashcards-index.json
 *  - src/data/indexes/roots-index.json
 *  - src/data/indexes/atlas-index.json
 *  - src/data/indexes/search-index.json
 * dosyalarını otomatik üretir. Böylece 55 modülde bile ilk açılış hafif kalır.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const MODULES_DIR = path.join(DATA_DIR, 'modules');
const INDEX_DIR = path.join(DATA_DIR, 'indexes');

fs.mkdirSync(INDEX_DIR, { recursive: true });

const curriculum = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'curriculum.json'), 'utf8'));
const moduleFiles = fs.existsSync(MODULES_DIR)
  ? fs.readdirSync(MODULES_DIR).filter((f) => /^modul_\d{2}\.json$/.test(f)).sort()
  : [];

// Temel YDS/YÖKDİL çekirdek atlası (M46-M49 eklendikçe otomatik genişler)
const BASE_PREPOSITIONAL_VERBS = [
  {
    ar: 'بَحَثَ عَنْ',
    tr: 'aramak, araştırmak',
    kategori: 'عَنْ',
    ornek: 'يَبْحَثُ الطَّالِبُ عَنِ الْكِتَابِ فِي الْمَكْتَبَةِ.',
    ornekTr: 'Öğrenci kütüphanede kitabı arıyor.',
    not: 'عَنْ ile "aramak", فِي ile "derinlemesine incelemek" anlamına gelir.'
  },
  {
    ar: 'اِعْتَمَدَ عَلَى',
    tr: '-e dayanmak, güvenmek',
    kategori: 'عَلَى',
    ornek: 'تَعْتَمِدُ اللُّغَةُ الْعَرَبِيَّةُ عَلَى نِظَامِ الْجُذُورِ.',
    ornekTr: 'Arap dili kök sistemine dayanır.',
    not: 'YDS/YÖKDİL metinlerinde en sık geçen akademik fiillerdendir.'
  },
  {
    ar: 'أَدَّى إِلَى',
    tr: '-e yol açmak, sebep olmak',
    kategori: 'إِلَى',
    ornek: 'يُؤَدِّي التَّكْرَارُ الْمُنْتَظَمُ إِلَى إِتْقَانِ اللُّغَةِ.',
    ornekTr: 'Düzenli tekrar dilde ustalaşmaya yol açar.',
    not: 'Neden–sonuç sorularında مِمَّا يُؤَدِّي إِلَى kalıbıyla çok sık çıkar.'
  },
  {
    ar: 'سَاهَمَ فِي',
    tr: '-e katkıda bulunmak',
    kategori: 'فِي',
    ornek: 'سَاهَمَتِ الْقِرَاءَةُ الْيَوْمِيَّةُ فِي تَطْوِيرِ الْمُفْرَدَاتِ.',
    ornekTr: 'Günlük okuma kelime dağarcığının gelişimine katkıda bulundu.',
    not: 'أَسْهَمَ فِي eş anlamlısı olarak da kullanılır.'
  },
  {
    ar: 'تَمَكَّنَ مِنْ',
    tr: '-i başarmak, -ebilmek',
    kategori: 'مِنْ',
    ornek: 'تَمَكَّنَ الْمُتَعَلِّمُ مِنْ قِرَاءَةِ النَّصِّ بِلَا حَرَكَاتٍ.',
    ornekTr: 'Öğrenen, metni harekesiz okumayı başardı.',
    not: 'اِسْتَطَاعَ fiilinin harf-i cerli akademik karşılığıdır.'
  },
  {
    ar: 'رَغِبَ فِي / رَغِبَ عَنْ',
    tr: 'istemek (فِي) / yüz çevirmek (عَنْ)',
    kategori: 'Anlam Değiştiren',
    ornek: 'أَرْغَبُ فِي تَعَلُّمِ الْعَرَبِيَّةِ الْفُصْحَى.',
    ornekTr: 'Fasih Arapça öğrenmek istiyorum.',
    not: 'Harf-i cer değişince anlam tam zıddına döner!'
  }
];

const BASE_CONNECTORS = [
  {
    ar: 'بِالرَّغْمِ مِنْ / عَلَى الرَّغْمِ مِنْ',
    tr: '-e rağmen',
    grup: 'Zıtlık / Rağmenlik',
    ornek: 'تَعَلَّمَ الْقِرَاءَةَ بِالرَّغْمِ مِنْ ضِيقِ الْوَقْتِ.',
    ornekTr: 'Vaktin darlığına rağmen okumayı öğrendi.',
    not: 'Ardından isim/mastar (mecrûr) gelir; cümle gelecekse أَنَّ eklenir.'
  },
  {
    ar: 'نَظَرًا لِـ / بِسَبَبِ',
    tr: '-den dolayı, sebebiyle',
    grup: 'Sebep',
    ornek: 'تَأَجَّلَ الدَّرْسُ نَظَرًا لِلسَّفَرِ.',
    ornekTr: 'Yolculuk sebebiyle ders ertelendi.',
    not: 'Ardından isim veya mastar gelir; cümle için نَظَرًا لِأَنَّ kullanılır.'
  },
  {
    ar: 'فَضْلًا عَنْ / بِالْإِضَافَةِ إِلَى',
    tr: '-e ek olarak, yanı sıra',
    grup: 'Ekleme',
    ornek: 'يَدْرُسُ الصَّرْفَ فَضْلًا عَنِ النَّحْوِ.',
    ornekTr: 'Nahvin yanı sıra sarf da okuyor.',
    not: 'Olumlu ekleme sorularında sıkça doğru seçenektir.'
  },
  {
    ar: 'إِلَّا أَنَّ / غَيْرَ أَنَّ / بَيْدَ أَنَّ',
    tr: 'ancak, ne var ki, şu kadar var ki',
    grup: 'İstidrâk / Zıtlık',
    ornek: 'الْكِتَابُ طَوِيلٌ، إِلَّا أَنَّ أُسْلُوبَهُ سَهْلٌ.',
    ornekTr: 'Kitap uzundur, ancak üslubu kolaydır.',
    not: 'İnne ailesi gibi amel eder; ardından isim cümlesi gelir.'
  },
  {
    ar: 'مِمَّا أَدَّى إِلَى',
    tr: 'bu da ...-e yol açtı',
    grup: 'Sonuç',
    ornek: 'تَدَرَّبَ كَثِيرًا، مِمَّا أَدَّى إِلَى نَجَاحِهِ.',
    ornekTr: 'Çok çalıştı, bu da başarısına yol açtı.',
    not: 'Önceki cümlenin tamamının sonucunu bağlar.'
  },
  {
    ar: 'بَيْنَمَا / فِي حِينِ',
    tr: 'iken, oysa',
    grup: 'Karşılaştırma & Zaman',
    ornek: 'الْحُرُوفُ الشَّمْسِيَّةُ تُدْغَمُ، بَيْنَمَا الْقَمَرِيَّةُ تُظْهَرُ.',
    ornekTr: 'Şemsî harfler idğam edilirken, kamerî harfler açık okunur.',
    not: 'İki farklı durumu karşılaştırır.'
  }
];

const cards = [];
const modulesSummary = [];
const rootMap = new Map();
const grammarCards = [];
const quickPractice = [];
const extraVerbs = [];
const extraConnectors = [];
const searchItems = [];

// Tüm 55 modülü arama indeksine ekle
for (const phase of curriculum.phases) {
  for (const m of phase.modules) {
    searchItems.push({
      id: `search_mod_${m.id}`,
      type: 'module',
      moduleId: m.id,
      title: `Modül ${m.id}: ${m.title}`,
      subtitle: `${phase.code} · ${m.cefr} · ${m.category}`,
      ar: m.arabicTitle,
      keywords: `${m.summary} ${(m.topics || []).join(' ')}`
    });
  }
}

for (const fname of moduleFiles) {
  const mod = JSON.parse(fs.readFileSync(path.join(MODULES_DIR, fname), 'utf8'));
  const modCards = mod.flashcards || [];

  modulesSummary.push({
    id: mod.id,
    title: mod.title,
    cefr: mod.cefr,
    count: modCards.length
  });

  // Kartlar ve Kök Aileleri
  for (const c of modCards) {
    cards.push({ ...c, moduleId: mod.id, cefr: mod.cefr });

    const rootKey = c.kok || 'Diğer';
    if (!rootMap.has(rootKey)) rootMap.set(rootKey, []);
    rootMap.get(rootKey).push({
      ar: c.ar,
      okunus: c.okunus,
      tr: c.tr,
      vezin: c.vezin,
      moduleId: mod.id
    });

    searchItems.push({
      id: `search_card_${c.id}`,
      type: 'card',
      moduleId: mod.id,
      title: `${c.tr} (${c.okunus})`,
      subtitle: `SRS Kartı · M${mod.id} · Kök: ${c.kok}`,
      ar: c.ar,
      kok: c.kok,
      keywords: `${c.harekesiz} ${c.vezin} ${c.tur}`
    });
  }

  // Gramer kartelaları ve hızlı pratik soruları
  for (const g of mod.grammar || []) {
    grammarCards.push({
      id: g.id,
      moduleId: mod.id,
      cefr: mod.cefr,
      baslik: g.baslik,
      arBaslik: g.arBaslik,
      formul: g.formul,
      mantik: g.mantik.slice(0, 260) + (g.mantik.length > 260 ? '…' : '')
    });

    searchItems.push({
      id: `search_gram_${g.id}`,
      type: 'grammar',
      moduleId: mod.id,
      title: g.baslik,
      subtitle: `Gramer Kuralı · M${mod.id}`,
      ar: g.arBaslik,
      keywords: `${g.formul} ${g.mantik.slice(0, 120)}`
    });

    // Her kuraldan 2 seçme tatbiki hızlı pratik havuzuna ekle
    for (const d of (g.tatbikler || []).slice(0, 2)) {
      quickPractice.push({
        id: `atlas_${d.id}`,
        moduleId: mod.id,
        kategori: mod.category || 'Gramer',
        soru: d.soru,
        soruAr: d.soruAr || '',
        secenekler: d.secenekler,
        dogruIndeks: d.dogruIndeks,
        aciklama: d.aciklama
      });
    }
  }

  if (Array.isArray(mod.atlasVerbs)) extraVerbs.push(...mod.atlasVerbs);
  if (Array.isArray(mod.atlasConnectors)) extraConnectors.push(...mod.atlasConnectors);
}

const roots = Array.from(rootMap.entries())
  .map(([kok, kelimeler]) => ({ kok, kelimeler }))
  .sort((a, b) => b.kelimeler.length - a.kelimeler.length || a.kok.localeCompare(b.kok));

const allVerbs = [...BASE_PREPOSITIONAL_VERBS, ...extraVerbs];
const allConnectors = [...BASE_CONNECTORS, ...extraConnectors];

allVerbs.forEach((v, i) => {
  searchItems.push({
    id: `search_verb_${i}`,
    type: 'verb',
    title: v.tr,
    subtitle: `Harf-i Cerli Fiil (${v.kategori})`,
    ar: v.ar,
    keywords: v.not || ''
  });
});

allConnectors.forEach((c, i) => {
  searchItems.push({
    id: `search_conn_${i}`,
    type: 'connector',
    title: c.tr,
    subtitle: `YDS/YÖKDİL Bağlaç (${c.grup})`,
    ar: c.ar,
    keywords: c.not || ''
  });
});

const writeJson = (name, obj) => {
  fs.writeFileSync(path.join(INDEX_DIR, name), JSON.stringify(obj, null, 2) + '\n', 'utf8');
};

writeJson('flashcards-index.json', {
  generatedAt: new Date().toISOString(),
  totalCards: cards.length,
  modules: modulesSummary,
  cards
});

writeJson('roots-index.json', {
  generatedAt: new Date().toISOString(),
  totalRoots: roots.length,
  roots
});

writeJson('atlas-index.json', {
  generatedAt: new Date().toISOString(),
  prepositionalVerbs: allVerbs,
  connectors: allConnectors,
  grammarCards,
  quickPractice
});

writeJson('search-index.json', {
  generatedAt: new Date().toISOString(),
  totalItems: searchItems.length,
  items: searchItems
});

console.log(
  `İndeksler üretildi: ${cards.length} SRS kart, ${roots.length} kök ailesi, ${grammarCards.length} gramer kartelası, ${searchItems.length} arama kaydı.`
);
