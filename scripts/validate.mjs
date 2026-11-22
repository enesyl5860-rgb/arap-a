#!/usr/bin/env node
/**
 * Otomatik Kalite Denetçisi (npm run validate)
 * Tüm curriculum.json, modul_XX.json ve final_*.json dosyalarının şemasını,
 * eksik alanlarını, mükerrer ID'lerini, Arapça hareke yoğunluğunu ve minimum
 * kotalarını doğrular.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const MODULES_DIR = path.join(DATA_DIR, 'modules');
const FINALS_DIR = path.join(DATA_DIR, 'finals');

const errors = [];
const warnings = [];
const globalIds = new Set();

function err(ctx, msg) {
  errors.push(`[HATA] ${ctx}: ${msg}`);
}
function warn(ctx, msg) {
  warnings.push(`[UYARI] ${ctx}: ${msg}`);
}

function registerId(ctx, id) {
  if (!id || typeof id !== 'string') {
    err(ctx, 'Geçersiz veya eksik ID');
    return;
  }
  if (globalIds.has(id)) {
    err(ctx, `Mükerrer ID tespit edildi: "${id}"`);
  } else {
    globalIds.add(id);
  }
}

function harakaDensity(text) {
  const s = String(text || '');
  const letters = (s.match(/[\u0621-\u064A]/g) || []).length;
  if (letters === 0) return 1;
  const marks = (s.match(/[\u064B-\u0652\u0670]/g) || []).length;
  return marks / letters;
}

function assertVocalized(ctx, text, minDensity = 0.45) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    err(ctx, 'Arapça metin alanı boş');
    return;
  }
  const letters = (text.match(/[\u0621-\u064A]/g) || []).length;
  if (letters === 0) {
    err(ctx, `Arapça harf bulunamadı: "${text.slice(0, 40)}"`);
    return;
  }
  const d = harakaDensity(text);
  if (d < minDensity) {
    err(ctx, `Yetersiz hareke yoğunluğu (${(d * 100).toFixed(1)}% < ${(minDensity * 100).toFixed(0)}%): "${text.slice(0, 60)}"`);
  }
}

function validateCurriculum() {
  const file = path.join(DATA_DIR, 'curriculum.json');
  if (!fs.existsSync(file)) {
    err('curriculum.json', 'Dosya bulunamadı');
    return null;
  }
  const cur = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (!Array.isArray(cur.phases) || cur.phases.length !== 5) {
    err('curriculum.json', `Tam 5 faz olmalı (bulunan: ${cur.phases?.length})`);
  }
  const allMods = (cur.phases || []).flatMap((p) => p.modules || []);
  if (allMods.length !== 55) {
    err('curriculum.json', `Tam 55 modül olmalı (bulunan: ${allMods.length})`);
  }
  const modIds = new Set();
  for (const m of allMods) {
    if (modIds.has(m.id)) err('curriculum.json', `Mükerrer modül ID: ${m.id}`);
    modIds.add(m.id);
    assertVocalized(`curriculum.json M${m.id}.arabicTitle`, m.arabicTitle, 0.4);
  }
  if (!Array.isArray(cur.finals) || cur.finals.length !== 4) {
    err('curriculum.json', `Tam 4 Büyük Final olmalı (bulunan: ${cur.finals?.length})`);
  }
  if (!Array.isArray(cur.volumes) || cur.volumes.length !== 5) {
    err('curriculum.json', `Tam 5 PDF Cildi tanımlı olmalı (bulunan: ${cur.volumes?.length})`);
  }
  return cur;
}

function validateModule(filePath) {
  const fname = path.basename(filePath);
  let mod;
  try {
    mod = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    err(fname, `JSON ayrıştırma hatası: ${e.message}`);
    return;
  }

  const tag = `M${mod.id || fname}`;
  for (const field of ['id', 'slug', 'cefr', 'title', 'arabicTitle', 'category', 'summary']) {
    if (!mod[field]) err(tag, `Eksik üst alan: ${field}`);
  }
  assertVocalized(`${tag}.arabicTitle`, mod.arabicTitle, 0.45);

  // 1) Gramer & Tatbik (>=5 kural, 6+ örnek, 10+ tatbik)
  if (!Array.isArray(mod.grammar) || mod.grammar.length < 5) {
    err(tag, `En az 5 gramer kuralı olmalı (bulunan: ${mod.grammar?.length || 0})`);
  } else {
    mod.grammar.forEach((r, idx) => {
      const rt = `${tag}.grammar[${idx}]`;
      registerId(rt, r.id);
      if (!r.baslik || !r.mantik || r.mantik.length < 80) {
        err(rt, 'baslik eksik veya mantik açıklaması 80 karakterden kısa');
      }
      if (!r.formul) err(rt, 'formul eksik');
      if (!r.trKiyas || r.trKiyas.length < 40) err(rt, 'trKiyas eksik veya çok kısa');
      if (!Array.isArray(r.sikHatalar) || r.sikHatalar.length < 2) {
        err(rt, 'En az 2 sık yapılan hata (sikHatalar) olmalı');
      }
      if (!r.tablo || !Array.isArray(r.tablo.satirlar) || r.tablo.satirlar.length < 3) {
        err(rt, 'tablo.satirlar en az 3 satır olmalı');
      }
      if (!Array.isArray(r.ornekler) || r.ornekler.length < 6) {
        err(rt, `En az 6 sesli örnek olmalı (bulunan: ${r.ornekler?.length || 0})`);
      } else {
        r.ornekler.forEach((ex, eIdx) => {
          assertVocalized(`${rt}.ornekler[${eIdx}]`, ex.ar, 0.45);
          if (!ex.tr || !ex.okunus) err(`${rt}.ornekler[${eIdx}]`, 'tr veya okunus eksik');
        });
      }
      if (!Array.isArray(r.tatbikler) || r.tatbikler.length < 10) {
        err(rt, `En az 10 anlık tatbik olmalı (bulunan: ${r.tatbikler?.length || 0})`);
      } else {
        r.tatbikler.forEach((d, dIdx) => {
          const dt = `${rt}.tatbikler[${dIdx}]`;
          registerId(dt, d.id);
          if (!d.tip || !d.soru || !d.aciklama) err(dt, 'tip, soru veya aciklama eksik');
          if (!Array.isArray(d.secenekler) || d.secenekler.length < 4) {
            err(dt, 'En az 4 seçenek olmalı');
          } else if (typeof d.dogruIndeks !== 'number' || d.dogruIndeks < 0 || d.dogruIndeks >= d.secenekler.length) {
            err(dt, `Geçersiz dogruIndeks: ${d.dogruIndeks}`);
          }
        });
      }
    });
  }

  // 2) Cümle Kurma Atölyesi (6 motor x 6 seçenek/slot, 4 merdiven x 5 adım, 15 blok)
  const ws = mod.workshop || {};
  if (!Array.isArray(ws.motors) || ws.motors.length < 6) {
    err(tag, `En az 6 kalıp motoru olmalı (bulunan: ${ws.motors?.length || 0})`);
  } else {
    ws.motors.forEach((m, i) => {
      registerId(`${tag}.workshop.motors[${i}]`, m.id);
      if (!Array.isArray(m.slotlar) || m.slotlar.length < 2) {
        err(`${tag}.workshop.motors[${i}]`, 'En az 2 slot olmalı');
      } else {
        m.slotlar.forEach((s, si) => {
          if (!Array.isArray(s.secenekler) || s.secenekler.length < 6) {
            err(`${tag}.workshop.motors[${i}].slotlar[${si}]`, `Her slotta en az 6 seçenek olmalı (bulunan: ${s.secenekler?.length || 0})`);
          } else {
            s.secenekler.forEach((opt, oi) => assertVocalized(`${tag}.motor[${i}].s[${si}].o[${oi}]`, opt.ar, 0.4));
          }
        });
      }
    });
  }

  if (!Array.isArray(ws.merdivenler) || ws.merdivenler.length < 4) {
    err(tag, `En az 4 genişletme merdiveni olmalı (bulunan: ${ws.merdivenler?.length || 0})`);
  } else {
    ws.merdivenler.forEach((lad, i) => {
      registerId(`${tag}.merdivenler[${i}]`, lad.id);
      if (!Array.isArray(lad.adimlar) || lad.adimlar.length !== 5) {
        err(`${tag}.merdivenler[${i}]`, `Her merdiven tam 5 basamaklı olmalı (bulunan: ${lad.adimlar?.length || 0})`);
      } else {
        lad.adimlar.forEach((st, si) => {
          assertVocalized(`${tag}.merdiven[${i}].adim[${si}]`, st.ar, 0.45);
          if (!st.seviye || !st.tr || !st.okunus || !st.ekleme) {
            err(`${tag}.merdiven[${i}].adim[${si}]`, 'seviye, tr, okunus veya ekleme eksik');
          }
        });
      }
    });
  }

  if (!Array.isArray(ws.bloklar) || ws.bloklar.length < 15) {
    err(tag, `En az 15 kelime bloğu inşası olmalı (bulunan: ${ws.bloklar?.length || 0})`);
  } else {
    ws.bloklar.forEach((b, i) => {
      const bt = `${tag}.bloklar[${i}]`;
      registerId(bt, b.id);
      assertVocalized(`${bt}.hedefAr`, b.hedefAr, 0.45);
      if (!b.tr || !Array.isArray(b.karisik) || b.karisik.length < 2) {
        err(bt, 'tr veya karisik token listesi eksik');
      } else {
        const expectedTokens = b.hedefAr.trim().split(/\s+/).sort().join('|');
        const givenTokens = [...b.karisik].map((t) => t.trim()).sort().join('|');
        if (expectedTokens !== givenTokens) {
          err(bt, `karisik tokenlar hedefAr ile birebir eşleşmiyor: "${b.hedefAr}"`);
        }
      }
    });
  }

  // 3) Okuma Stüdyosu (3 uzun metin x 4 paragraf x 5 soru)
  if (!Array.isArray(mod.readings) || mod.readings.length < 3) {
    err(tag, `En az 3 uzun okuma metni olmalı (bulunan: ${mod.readings?.length || 0})`);
  } else {
    mod.readings.forEach((r, i) => {
      const rt = `${tag}.readings[${i}]`;
      registerId(rt, r.id);
      assertVocalized(`${rt}.arBaslik`, r.arBaslik, 0.4);
      if (!Array.isArray(r.paragraflar) || r.paragraflar.length < 4) {
        err(rt, `Her metinde en az 4 paragraf olmalı (bulunan: ${r.paragraflar?.length || 0})`);
      } else {
        r.paragraflar.forEach((p, pi) => {
          assertVocalized(`${rt}.p[${pi}]`, p.ar, 0.45);
          if (!p.tr || !p.okunus) err(`${rt}.p[${pi}]`, 'tr veya okunus eksik');
          if (!Array.isArray(p.analiz) || p.analiz.length < 2) {
            err(`${rt}.p[${pi}]`, 'Her paragrafta en az 2 tıklanabilir analiz kelimesi olmalı');
          }
        });
      }
      if (!Array.isArray(r.sorular) || r.sorular.length < 5) {
        err(rt, `Her metinde en az 5 anlama sorusu olmalı (bulunan: ${r.sorular?.length || 0})`);
      } else {
        r.sorular.forEach((q, qi) => {
          registerId(`${rt}.q[${qi}]`, q.id);
          if (!q.soru || !q.aciklama || !Array.isArray(q.secenekler) || q.secenekler.length < 4) {
            err(`${rt}.q[${qi}]`, 'soru, aciklama veya 4 seçenek eksik');
          }
        });
      }
    });
  }

  // 4) Diyaloglar (4 diyalog x 12+ replik + 5 turlu partner)
  if (!Array.isArray(mod.dialogues) || mod.dialogues.length < 4) {
    err(tag, `En az 4 diyalog olmalı (bulunan: ${mod.dialogues?.length || 0})`);
  } else {
    mod.dialogues.forEach((d, i) => {
      const dt = `${tag}.dialogues[${i}]`;
      registerId(dt, d.id);
      if (!Array.isArray(d.replikler) || d.replikler.length < 12) {
        err(dt, `Her diyalogda en az 12 replik olmalı (bulunan: ${d.replikler?.length || 0})`);
      } else {
        d.replikler.forEach((line, li) => {
          assertVocalized(`${dt}.replik[${li}]`, line.ar, 0.45);
          if (!line.konusan || !line.tr || !line.okunus) {
            err(`${dt}.replik[${li}]`, 'konusan, tr veya okunus eksik');
          }
        });
      }
      if (!Array.isArray(d.partner) || d.partner.length < 5) {
        err(dt, `Her diyalogda en az 5 turlu İnteraktif Partner olmalı (bulunan: ${d.partner?.length || 0})`);
      } else {
        d.partner.forEach((t, ti) => {
          assertVocalized(`${dt}.partner[${ti}].soruAr`, t.soruAr, 0.45);
          if (!t.ipucu || !t.aciklama || !Array.isArray(t.secenekler) || t.secenekler.length < 3) {
            err(`${dt}.partner[${ti}]`, 'ipucu, aciklama veya en az 3 seçenek eksik');
          }
        });
      }
    });
  }

  // 5) SRS Flashcards (32+ zengin kart)
  if (!Array.isArray(mod.flashcards) || mod.flashcards.length < 32) {
    err(tag, `En az 32 SRS kartı olmalı (bulunan: ${mod.flashcards?.length || 0})`);
  } else {
    mod.flashcards.forEach((c, i) => {
      const ct = `${tag}.flashcards[${i}]`;
      registerId(ct, c.id);
      assertVocalized(`${ct}.ar`, c.ar, 0.45);
      assertVocalized(`${ct}.ornek`, c.ornek, 0.45);
      for (const f of ['harekesiz', 'okunus', 'tr', 'kok', 'vezin', 'ekBilgi', 'ornekTr', 'kullanimNotu', 'tur']) {
        if (!c[f]) err(ct, `Eksik kart alanı: ${f}`);
      }
      if (!Array.isArray(c.turevler) || c.turevler.length < 2) {
        err(ct, 'turevler (kök ailesi) en az 2 öğe içermeli');
      }
    });
  }
}

function validateFinal(filePath) {
  const fname = path.basename(filePath);
  const fin = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const tag = fin.id || fname;
  if (!Array.isArray(fin.diyaloglar) || fin.diyaloglar.length < 10) {
    err(tag, `Büyük finalde en az 10 diyalog olmalı (bulunan: ${fin.diyaloglar?.length || 0})`);
  }
  if (!Array.isArray(fin.okumalar) || fin.okumalar.length < 10) {
    err(tag, `Büyük finalde en az 10 okuma metni olmalı (bulunan: ${fin.okumalar?.length || 0})`);
  }
  if (!Array.isArray(fin.sinav) || fin.sinav.length < 20) {
    err(tag, `Büyük finalde en az 20 sınav sorusu olmalı (bulunan: ${fin.sinav?.length || 0})`);
  } else {
    fin.sinav.forEach((q, i) => registerId(`${tag}.sinav[${i}]`, q.id));
  }
}

// Çalıştır
console.log('Arapça Külliyatı v4.0 — Otomatik Kalite Denetçisi çalışıyor...');
validateCurriculum();

const moduleFiles = fs.existsSync(MODULES_DIR)
  ? fs.readdirSync(MODULES_DIR).filter((f) => /^modul_\d{2}\.json$/.test(f)).sort()
  : [];

if (moduleFiles.length === 0) {
  err('modules', 'Hiç modul_XX.json dosyası bulunamadı!');
}
for (const f of moduleFiles) {
  validateModule(path.join(MODULES_DIR, f));
}

const finalFiles = fs.existsSync(FINALS_DIR)
  ? fs.readdirSync(FINALS_DIR).filter((f) => /^final_[a-z0-9]+\.json$/.test(f)).sort()
  : [];
for (const f of finalFiles) {
  validateFinal(path.join(FINALS_DIR, f));
}

if (warnings.length > 0) {
  console.log(`\nUyarılar (${warnings.length}):`);
  warnings.forEach((w) => console.log(' ', w));
}

if (errors.length > 0) {
  console.error(`\nDOĞRULAMA BAŞARISIZ (${errors.length} hata):`);
  errors.slice(0, 40).forEach((e) => console.error(' ', e));
  if (errors.length > 40) console.error(`  ... ve ${errors.length - 40} ek hata.`);
  process.exit(1);
}

console.log(
  `DOĞRULAMA BAŞARILI! ${moduleFiles.length} modül, ${finalFiles.length} final, ${globalIds.size} tekil ID, şema + kota + hareke denetimi %100 geçti.`
);
