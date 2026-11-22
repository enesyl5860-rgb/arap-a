#!/usr/bin/env node
/**
 * 5 Ciltli Yayın Kalitesinde A4 PDF Kitap Motoru (npm run build-pdf)
 * Kullanım:
 *   node scripts/build-pdf.mjs --cilt=1
 *   node scripts/build-pdf.mjs --modul=01
 *   node scripts/build-pdf.mjs --all
 *
 * Yerel @fontsource/amiri, @fontsource/noto-naskh-arabic ve @fontsource/inter
 * fontlarını gömerek internetsiz, bellek dostu, basılabilir A4 kitap PDF üretir.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUT_DIR = path.join(ROOT, 'dist-pdf');
const PUBLIC_PDF_DIR = path.join(ROOT, 'public', 'pdf');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_PDF_DIR, { recursive: true });

function findChromiumExecutable() {
  const candidates = [];
  const baseDirs = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/ms-playwright', `${process.env.HOME}/.cache/ms-playwright`].filter(Boolean);
  for (const dir of baseDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith('chromium-')) {
        candidates.push(path.join(dir, entry, 'chrome-linux64', 'chrome'));
        candidates.push(path.join(dir, entry, 'chrome-linux', 'chrome'));
      }
    }
  }
  return candidates.find((p) => fs.existsSync(p)) || undefined;
}

function fontFileToDataUri(relPath) {
  const abs = path.join(ROOT, 'node_modules', relPath);
  if (!fs.existsSync(abs)) return '';
  const b64 = fs.readFileSync(abs).toString('base64');
  return `data:font/woff2;base64,${b64}`;
}

function buildEmbeddedFontsCss() {
  const amiriReg = fontFileToDataUri('@fontsource/amiri/files/amiri-arabic-400-normal.woff2');
  const amiriBold = fontFileToDataUri('@fontsource/amiri/files/amiri-arabic-700-normal.woff2');
  const notoReg = fontFileToDataUri('@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-400-normal.woff2');
  const notoBold = fontFileToDataUri('@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-700-normal.woff2');
  const interReg = fontFileToDataUri('@fontsource/inter/files/inter-latin-ext-400-normal.woff2') || fontFileToDataUri('@fontsource/inter/files/inter-latin-400-normal.woff2');
  const interBold = fontFileToDataUri('@fontsource/inter/files/inter-latin-ext-700-normal.woff2') || fontFileToDataUri('@fontsource/inter/files/inter-latin-700-normal.woff2');

  return `
    ${amiriReg ? `@font-face { font-family: 'Amiri'; font-weight: 400; src: url('${amiriReg}') format('woff2'); }` : ''}
    ${amiriBold ? `@font-face { font-family: 'Amiri'; font-weight: 700; src: url('${amiriBold}') format('woff2'); }` : ''}
    ${notoReg ? `@font-face { font-family: 'Noto Naskh Arabic'; font-weight: 400; src: url('${notoReg}') format('woff2'); }` : ''}
    ${notoBold ? `@font-face { font-family: 'Noto Naskh Arabic'; font-weight: 700; src: url('${notoBold}') format('woff2'); }` : ''}
    ${interReg ? `@font-face { font-family: 'Inter'; font-weight: 400; src: url('${interReg}') format('woff2'); }` : ''}
    ${interBold ? `@font-face { font-family: 'Inter'; font-weight: 700; src: url('${interBold}') format('woff2'); }` : ''}
  `;
}

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderModuleHtml(mod, answerBank) {
  const grammarHtml = (mod.grammar || [])
    .map((rule, rIdx) => {
      const tableCols = (rule.tablo?.sutunlar || []).map((c) => `<th>${esc(c)}</th>`).join('');
      const tableRows = (rule.tablo?.satirlar || [])
        .map(
          (row) =>
            `<tr>${row.hucreler
              .map((cell) => {
                const isAr = /[\u0600-\u06FF]/.test(cell);
                return `<td class="${isAr ? 'ar-cell' : ''}">${esc(cell)}</td>`;
              })
              .join('')}</tr>`
        )
        .join('');

      const examplesHtml = (rule.ornekler || [])
        .map(
          (ex) => `
          <div class="example-box">
            <div class="ar-lg">${esc(ex.ar)}</div>
            <div class="okunus">${esc(ex.okunus)}</div>
            <div class="tr">${esc(ex.tr)}</div>
            ${ex.not ? `<div class="note">${esc(ex.not)}</div>` : ''}
          </div>`
        )
        .join('');

      const drillsHtml = (rule.tatbikler || [])
        .map((d, dIdx) => {
          const letter = String.fromCharCode(65 + d.dogruIndeks);
          answerBank.push({
            ref: `M${mod.id} · Kural ${rIdx + 1} · Tatbik ${dIdx + 1}`,
            answer: `${letter}) ${d.secenekler[d.dogruIndeks]}`,
            explanation: d.aciklama
          });
          return `
            <div class="drill-item">
              <div class="drill-q"><strong>${dIdx + 1}.</strong> ${esc(d.soru)} ${d.soruAr ? `<span class="ar-inline">${esc(d.soruAr)}</span>` : ''}</div>
              <div class="drill-opts">
                ${d.secenekler.map((opt, oi) => `<span><strong>${String.fromCharCode(65 + oi)})</strong> <span class="${/[\u0600-\u06FF]/.test(opt) ? 'ar-inline' : ''}">${esc(opt)}</span></span>`).join('')}
              </div>
            </div>`;
        })
        .join('');

      return `
        <div class="rule-block">
          <div class="rule-header">
            <h3>${rIdx + 1}. ${esc(rule.baslik)}</h3>
            ${rule.arBaslik ? `<div class="ar-title">${esc(rule.arBaslik)}</div>` : ''}
          </div>
          <p class="mantik">${esc(rule.mantik)}</p>
          <div class="formula-box">
            <div><strong>Formül:</strong> ${esc(rule.formul)}</div>
            ${rule.formulAr ? `<div class="ar-md">${esc(rule.formulAr)}</div>` : ''}
          </div>
          ${tableRows ? `<table><thead><tr>${tableCols}</tr></thead><tbody>${tableRows}</tbody></table>` : ''}
          <div class="two-col">
            <div class="tip-box"><strong>Türkçe → Arapça Kıyaslama:</strong><p>${esc(rule.trKiyas)}</p></div>
            <div class="warn-box"><strong>Sık Yapılan Hatalar:</strong><ul>${(rule.sikHatalar || []).map((h) => `<li>${esc(h)}</li>`).join('')}</ul></div>
          </div>
          <h4>Bağlam İçi Örnekler</h4>
          <div class="examples-grid">${examplesHtml}</div>
          <h4>Anlık Tatbikler</h4>
          <div class="drills-list">${drillsHtml}</div>
        </div>`;
    })
    .join('');

  const laddersHtml = (mod.workshop?.merdivenler || [])
    .map(
      (lad, li) => `
      <div class="ladder-box">
        <h4>Genişletme Merdiveni ${li + 1}: ${esc(lad.baslik)}</h4>
        ${lad.adimlar
          .map(
            (st) => `
          <div class="ladder-step">
            <span class="badge">${esc(st.seviye)}</span>
            <div class="ar-md">${esc(st.ar)}</div>
            <div class="tr">${esc(st.tr)} <span class="note">(${esc(st.ekleme)})</span></div>
          </div>`
          )
          .join('')}
      </div>`
    )
    .join('');

  const readingsHtml = (mod.readings || [])
    .map((r, ri) => {
      const paras = r.paragraflar
        .map(
          (p) => `
          <div class="reading-para">
            <div class="ar-reading">${esc(p.ar)}</div>
            <div class="tr">${esc(p.tr)}</div>
          </div>`
        )
        .join('');
      const qs = r.sorular
        .map((q, qi) => {
          const letter = String.fromCharCode(65 + q.dogruIndeks);
          answerBank.push({
            ref: `M${mod.id} · Okuma ${ri + 1} · Soru ${qi + 1}`,
            answer: `${letter}) ${q.secenekler[q.dogruIndeks]}`,
            explanation: q.aciklama
          });
          return `<div class="drill-item"><strong>${qi + 1}.</strong> ${esc(q.soru)}<div class="drill-opts">${q.secenekler
            .map((o, oi) => `<span><strong>${String.fromCharCode(65 + oi)})</strong> ${esc(o)}</span>`)
            .join('')}</div></div>`;
        })
        .join('');
      return `
        <div class="reading-block">
          <h3>Okuma ${ri + 1}: ${esc(r.baslik)} <span class="ar-inline">${esc(r.arBaslik)}</span></h3>
          ${paras}
          <h4>Anlama Soruları</h4>
          ${qs}
        </div>`;
    })
    .join('');

  const dialoguesHtml = (mod.dialogues || [])
    .map(
      (d, di) => `
      <div class="dialogue-block">
        <h3>Diyalog ${di + 1}: ${esc(d.baslik)}</h3>
        <div class="note">${esc(d.ortam)}</div>
        <table class="dlg-table">
          <tbody>
            ${d.replikler
              .map(
                (line) => `
              <tr>
                <td class="speaker">${esc(line.konusan)}</td>
                <td class="ar-cell">${esc(line.ar)}</td>
                <td>${esc(line.tr)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`
    )
    .join('');

  const vocabRows = (mod.flashcards || [])
    .map(
      (c, ci) => `
      <tr>
        <td>${ci + 1}</td>
        <td class="ar-cell">${esc(c.ar)}</td>
        <td>${esc(c.okunus)}</td>
        <td><strong>${esc(c.tr)}</strong></td>
        <td class="ar-cell">${esc(c.kok)}</td>
        <td class="ar-cell">${esc(c.vezin)}</td>
      </tr>`
    )
    .join('');

  return `
    <section class="module-chapter">
      <div class="chapter-banner">
        <div class="chapter-kicker">MODÜL ${esc(mod.id)} · ${esc(mod.cefr)} · ${esc(mod.category)}</div>
        <h2>${esc(mod.title)}</h2>
        <div class="ar-chapter">${esc(mod.arabicTitle)}</div>
        <p>${esc(mod.summary)}</p>
      </div>

      <h2 class="section-heading">I. Gramer &amp; Anlık Tatbikler</h2>
      ${grammarHtml}

      <h2 class="section-heading">II. Cümle Kurma &amp; Genişletme Merdivenleri</h2>
      ${laddersHtml}

      <h2 class="section-heading">III. Okuma Stüdyosu</h2>
      ${readingsHtml}

      <h2 class="section-heading">IV. Diyaloglar</h2>
      ${dialoguesHtml}

      <h2 class="section-heading">V. Kelime, Kök ve Vezin Dizini (${(mod.flashcards || []).length} Kart)</h2>
      <table>
        <thead><tr><th>#</th><th>Arapça</th><th>Okunuş</th><th>Türkçe</th><th>Kök</th><th>Vezin</th></tr></thead>
        <tbody>${vocabRows}</tbody>
      </table>
    </section>`;
}

function buildDocumentHtml({ title, arabicTitle, subtitle, badge, modules, finalData }) {
  const fontsCss = buildEmbeddedFontsCss();
  const answerBank = [];

  const tocItems = modules
    .map(
      (m) => `
      <div class="toc-row">
        <span class="toc-title">Modül ${esc(m.id)} — ${esc(m.title)}</span>
        <span class="toc-ar">${esc(m.arabicTitle)}</span>
      </div>`
    )
    .join('');

  const modulesHtml = modules.map((m) => renderModuleHtml(m, answerBank)).join('');

  let finalHtml = '';
  if (finalData) {
    const finalDialoguesHtml = (finalData.diyaloglar || [])
      .map(
        (d, di) => `
        <div class="dialogue-block">
          <h3>Diyalog ${di + 1}: ${esc(d.baslik)}</h3>
          ${d.ortam ? `<div class="note">${esc(d.ortam)}</div>` : ''}
          <table class="dlg-table">
            <tbody>
              ${(d.replikler || [])
                .map(
                  (line) => `
                <tr>
                  <td class="speaker">${esc(line.konusan)}</td>
                  <td class="ar-cell">${esc(line.ar)}</td>
                  <td>${esc(line.tr)}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>`
      )
      .join('');

    const finalReadingsHtml = (finalData.okumalar || [])
      .map(
        (r, ri) => `
        <div class="reading-block">
          <h3>Okuma ${ri + 1}: ${esc(r.baslik)}${r.arBaslik ? ` <span class="ar-inline">${esc(r.arBaslik)}</span>` : ''}</h3>
          <div class="para-block">
            <div class="ar-para">${esc(r.ar)}</div>
            ${r.okunus ? `<div class="tr-line"><em>${esc(r.okunus)}</em></div>` : ''}
            <div class="tr-line">${esc(r.tr)}</div>
          </div>
        </div>`
      )
      .join('');

    const examHtml = (finalData.sinav || [])
      .map((q, qi) => {
        const letter = String.fromCharCode(65 + q.dogruIndeks);
        answerBank.push({
          ref: `${finalData.id.toUpperCase()} · Soru ${qi + 1}`,
          answer: `${letter}) ${q.secenekler[q.dogruIndeks]}`,
          explanation: q.aciklama
        });
        return `<div class="drill-item"><strong>${qi + 1}.</strong> ${esc(q.soru)}${
          q.soruAr ? ` <span class="ar-inline">${esc(q.soruAr)}</span>` : ''
        }<div class="drill-opts">${q.secenekler
          .map((o, oi) => `<span><strong>${String.fromCharCode(65 + oi)})</strong> ${esc(o)}</span>`)
          .join('')}</div></div>`;
      })
      .join('');
    finalHtml = `
      <section class="module-chapter">
        <div class="chapter-banner">
          <div class="chapter-kicker">SEVİYE SONU BÜYÜK FİNAL</div>
          <h2>${esc(finalData.title)}</h2>
          <div class="ar-chapter">${esc(finalData.arabicTitle)}</div>
          ${finalData.description ? `<p>${esc(finalData.description)}</p>` : ''}
        </div>
        <h2 class="section-heading">I. 10 Diyalog Senaryosu</h2>
        ${finalDialoguesHtml}
        <h2 class="section-heading">II. 10 Kapsamlı Okuma Metni</h2>
        ${finalReadingsHtml}
        <h2 class="section-heading">III. 20 Soruluk Çözümlü Değerlendirme Sınavı</h2>
        ${examHtml}
      </section>`;
  }

  const answersHtml = answerBank
    .map(
      (a) => `
      <div class="answer-row">
        <strong>${esc(a.ref)}:</strong> <span class="ans-val">${esc(a.answer)}</span>
        <div class="note">${esc(a.explanation)}</div>
      </div>`
    )
    .join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    ${fontsCss}
    @page { size: A4; margin: 18mm 15mm 18mm 15mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1c1917;
      font-size: 9.5pt;
      line-height: 1.5;
    }
    .cover {
      page-break-after: always;
      min-height: 252mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20mm 14mm;
      background: linear-gradient(160deg, #faf7f2 0%, #efe6d5 100%);
      border: 2px solid #0f5c4d;
      border-radius: 8px;
    }
    .cover-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #0f5c4d;
      color: #ffffff;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      border-radius: 6px;
    }
    .cover h1 { font-size: 24pt; margin: 16px 0 10px; color: #0a3f34; line-height: 1.2; }
    .cover-ar {
      font-family: 'Amiri', serif;
      direction: rtl;
      font-size: 24pt;
      color: #b45309;
      margin: 10px 0 16px;
      line-height: 2;
    }
    .cover-sub { font-size: 11pt; color: #44403c; max-width: 90%; }
    .cover-footer {
      border-top: 1px solid #cfc1a9;
      padding-top: 12px;
      font-size: 9pt;
      color: #57534e;
      display: flex;
      justify-content: space-between;
    }
    .toc-page { page-break-after: always; }
    .toc-page h2 { color: #0f5c4d; border-bottom: 2px solid #0f5c4d; padding-bottom: 6px; }
    .toc-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 7px 0;
      border-bottom: 1px dashed #d6cbb8;
      gap: 12px;
    }
    .toc-title { font-weight: 600; font-size: 10pt; }
    .toc-ar { font-family: 'Noto Naskh Arabic', serif; direction: rtl; font-size: 11pt; color: #0f5c4d; }

    .module-chapter { page-break-before: always; }
    .chapter-banner {
      background: #f3ede2;
      border-left: 5px solid #0f5c4d;
      padding: 14px 16px;
      border-radius: 6px;
      margin-bottom: 14px;
    }
    .chapter-kicker { font-size: 8.5pt; font-weight: 700; color: #0f5c4d; letter-spacing: 0.06em; }
    .chapter-banner h2 { margin: 4px 0; font-size: 16pt; color: #1c1917; }
    .ar-chapter { font-family: 'Amiri', serif; direction: rtl; font-size: 17pt; color: #0f5c4d; line-height: 2; }
    .section-heading {
      margin: 18px 0 10px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #0f5c4d;
      color: #0a3f34;
      font-size: 12.5pt;
    }
    .rule-block { margin-bottom: 16px; }
    .rule-header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .rule-header h3 { margin: 0 0 6px; font-size: 11.5pt; color: #0f5c4d; }
    .ar-title { font-family: 'Amiri', serif; direction: rtl; font-size: 14pt; color: #b45309; }
    .mantik { margin: 4px 0 8px; text-align: justify; }
    .formula-box {
      background: #e4f2ee;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      break-inside: avoid;
    }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 9pt; }
    th, td { border: 1px solid #d6cbb8; padding: 5px 8px; text-align: left; vertical-align: middle; }
    th { background: #f3ede2; font-weight: 700; }
    .ar-cell { font-family: 'Noto Naskh Arabic', serif; direction: rtl; text-align: right; font-size: 12pt; line-height: 2; }
    .ar-inline { font-family: 'Noto Naskh Arabic', serif; direction: rtl; unicode-bidi: isolate; font-size: 11.5pt; }
    .ar-md { font-family: 'Noto Naskh Arabic', serif; direction: rtl; font-size: 13pt; line-height: 2; }
    .ar-lg { font-family: 'Noto Naskh Arabic', serif; direction: rtl; text-align: right; font-size: 14pt; line-height: 2.1; color: #1c1917; }
    .ar-reading { font-family: 'Amiri', serif; direction: rtl; text-align: right; font-size: 15pt; line-height: 2.25; color: #1c1917; margin-bottom: 4px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0 12px; break-inside: avoid; }
    .tip-box { background: #f3ede2; padding: 8px 10px; border-radius: 6px; font-size: 8.8pt; }
    .warn-box { background: #fef3c7; padding: 8px 10px; border-radius: 6px; font-size: 8.8pt; }
    .warn-box ul { margin: 4px 0 0 16px; padding: 0; }
    .examples-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .example-box { border: 1px solid #e5dccb; border-radius: 6px; padding: 7px 10px; break-inside: avoid; background: #fffdf9; }
    .okunus { font-size: 8pt; color: #0f5c4d; font-family: monospace; }
    .tr { font-size: 9pt; color: #292524; }
    .note { font-size: 8pt; color: #78716c; }
    .drill-item { border: 1px solid #e5dccb; border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; break-inside: avoid; }
    .drill-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-top: 4px; font-size: 8.8pt; }
    .ladder-box, .reading-block, .dialogue-block { margin-bottom: 14px; }
    .ladder-step { border-left: 3px solid #0f5c4d; padding: 5px 10px; margin-bottom: 5px; background: #faf7f2; break-inside: avoid; }
    .badge { display: inline-block; background: #0f5c4d; color: #fff; font-size: 7.5pt; padding: 1px 6px; border-radius: 4px; font-weight: 700; }
    .reading-para { margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px dotted #d6cbb8; break-inside: avoid; }
    .speaker { font-weight: 700; color: #0f5c4d; width: 78px; }
    .answers-section { page-break-before: always; }
    .answer-row { border-bottom: 1px solid #e5dccb; padding: 5px 0; break-inside: avoid; font-size: 8.5pt; }
    .ans-val { color: #0f5c4d; font-weight: 700; font-family: 'Noto Naskh Arabic', 'Inter', serif; }
  </style>
</head>
<body>
  <section class="cover">
    <div>
      <span class="cover-badge">${esc(badge)}</span>
      <h1>${esc(title)}</h1>
      <div class="cover-ar">${esc(arabicTitle)}</div>
      <p class="cover-sub">${esc(subtitle)}</p>
    </div>
    <div class="cover-footer">
      <span>Arapça Külliyatı v4.0 · 0'dan B2'ye + YDS/YÖKDİL</span>
      <span>${modules.length} Modül${finalData ? ' + Büyük Final' : ''} · Çözümlü Cevap Anahtarlı</span>
    </div>
  </section>

  <section class="toc-page">
    <h2>İçindekiler</h2>
    ${tocItems}
    ${finalData ? `<div class="toc-row"><span class="toc-title">Seviye Sonu Büyük Final: ${esc(finalData.title)}</span><span class="toc-ar">${esc(finalData.arabicTitle)}</span></div>` : ''}
    <div class="toc-row"><span class="toc-title">Çözümlü Cevap Anahtarı (${answerBank.length} Soru)</span><span class="toc-ar">مِفْتَاحُ الْإِجَابَاتِ</span></div>
  </section>

  ${modulesHtml}
  ${finalHtml}

  <section class="answers-section">
    <h2 class="section-heading">Çözümlü Cevap Anahtarı (${answerBank.length} Soru)</h2>
    ${answersHtml}
  </section>
</body>
</html>`;
}

async function generatePdf({ html, outFile, headerTitle }) {
  const executablePath = findChromiumExecutable();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: outFile,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;font-size:7.5pt;color:#78716c;padding:0 15mm;display:flex;justify-content:space-between;"><span>Arapça Külliyatı v4.0</span><span>${esc(headerTitle)}</span></div>`,
      footerTemplate: `<div style="width:100%;font-size:7.5pt;color:#78716c;padding:0 15mm;display:flex;justify-content:space-between;"><span>Günday &amp; Şahin Sistematiği + YDS/YÖKDİL</span><span>Sayfa <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const ciltArg = args.find((a) => a.startsWith('--cilt='))?.split('=')[1];
  const modulArg = args.find((a) => a.startsWith('--modul='))?.split('=')[1];
  const allFlag = args.includes('--all');

  const curriculum = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'curriculum.json'), 'utf8'));

  if (modulArg) {
    const id = String(modulArg).padStart(2, '0');
    const modPath = path.join(DATA_DIR, 'modules', `modul_${id}.json`);
    if (!fs.existsSync(modPath)) {
      console.error(`Modül dosyası bulunamadı: ${modPath}`);
      process.exit(1);
    }
    const mod = JSON.parse(fs.readFileSync(modPath, 'utf8'));
    const html = buildDocumentHtml({
      title: `Modül ${id}: ${mod.title}`,
      arabicTitle: mod.arabicTitle,
      subtitle: mod.summary,
      badge: `MODÜL ${id} · ${mod.cefr}`,
      modules: [mod],
      finalData: null
    });
    const outFile = path.join(OUT_DIR, `arapca-kulliyati-modul-${id}.pdf`);
    await generatePdf({ html, outFile, headerTitle: `Modül ${id} — ${mod.title}` });
    console.log(`PDF üretildi: ${outFile} (${(fs.statSync(outFile).size / 1024).toFixed(1)} KB)`);
    return;
  }

  const targetVolumes = allFlag
    ? curriculum.volumes
    : curriculum.volumes.filter((v) => String(v.cilt) === String(ciltArg || '1'));

  if (targetVolumes.length === 0) {
    console.error('Geçersiz --cilt değeri (1..5 arası olmalı).');
    process.exit(1);
  }

  for (const vol of targetVolumes) {
    const loadedModules = [];
    for (const mId of vol.modules) {
      const mPath = path.join(DATA_DIR, 'modules', `modul_${mId}.json`);
      if (fs.existsSync(mPath)) {
        loadedModules.push(JSON.parse(fs.readFileSync(mPath, 'utf8')));
      }
    }
    if (loadedModules.length === 0) {
      console.log(`Cilt ${vol.cilt} için henüz modül dosyası yok, atlandı.`);
      continue;
    }

    let finalData = null;
    if (vol.finalId) {
      const fPath = path.join(DATA_DIR, 'finals', `${vol.finalId}.json`);
      if (fs.existsSync(fPath)) finalData = JSON.parse(fs.readFileSync(fPath, 'utf8'));
    }

    const html = buildDocumentHtml({
      title: vol.title,
      arabicTitle: vol.arabicTitle,
      subtitle: `${curriculum.subtitle} · Kapsam: ${vol.cefr} (Hazır Modüller: ${loadedModules.map((m) => 'M' + m.id).join(', ')})`,
      badge: `CİLT ${vol.cilt} / 5 · ${vol.cefr}`,
      modules: loadedModules,
      finalData
    });

    const outFile = path.join(OUT_DIR, `arapca-kulliyati-cilt-${vol.cilt}.pdf`);
    await generatePdf({ html, outFile, headerTitle: vol.title });
    fs.copyFileSync(outFile, path.join(PUBLIC_PDF_DIR, `arapca-kulliyati-cilt-${vol.cilt}.pdf`));
    console.log(`PDF üretildi: ${outFile} (${(fs.statSync(outFile).size / 1024).toFixed(1)} KB)`);
  }
}

main().catch((e) => {
  console.error('PDF üretim hatası:', e);
  process.exit(1);
});
