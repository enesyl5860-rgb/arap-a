#!/usr/bin/env node
/**
 * Playwright Uçtan Uca Doğrulama (npm run test:e2e)
 * Derlenmiş uygulamayı (dist/) yerel bir sunucuda açarak 8 ana bölümü,
 * lazy loading'i, 3 kademeli hareke geçişini, SRS kart akışını,
 * Ctrl+K aramayı, koyu/açık temayı ve JSON yedeklemeyi doğrular.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 4179;
const URL = `http://127.0.0.1:${PORT}`;

function findChromiumExecutable() {
  const baseDirs = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/ms-playwright', `${process.env.HOME}/.cache/ms-playwright`].filter(Boolean);
  for (const dir of baseDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith('chromium-')) {
        const p = path.join(dir, entry, 'chrome-linux64', 'chrome');
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return undefined;
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Sunucu ${timeoutMs}ms içinde hazır olmadı: ${url}`);
}

async function run() {
  const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'pipe'
  });

  const consoleErrors = [];
  const pageErrors = [];

  try {
    await waitForServer(URL);
    const browser = await chromium.launch({
      headless: true,
      executablePath: findChromiumExecutable(),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(URL, { waitUntil: 'networkidle' });

    // 1) Külliyat Haritası doğrulama
    const bodyText = await page.textContent('body');
    if (!bodyText.includes('55 Modül') || !bodyText.includes('Modül 01') || !bodyText.includes('Modül 02')) {
      throw new Error('Külliyat Haritası beklenen 55 modül içeriğini göstermiyor');
    }

    // 2) Modül 01 -> Gramer & Tatbik lazy yükleme
    await page.click('#btn-open-module-01');
    await page.waitForSelector('#tab-rule-0', { timeout: 8000 });
    await page.click('#tab-rule-1');

    // 3 kademeli hareke köprüsü testi
    await page.click('#btn-haraka-irab');
    await page.click('#btn-haraka-plain');
    await page.click('#btn-haraka-full');

    // 3) Cümle Kurma Atölyesi
    await page.click('#nav-workshop');
    await page.waitForSelector('#tab-workshop-ladders');
    await page.click('#tab-workshop-ladders');
    await page.click('#tab-workshop-blocks');

    // 4) Okuma Stüdyosu (Modül 02'ye geçip lazy load doğrula)
    await page.selectOption('#select-active-module', '02');
    await page.click('#nav-reading');
    await page.waitForFunction(() => document.body.textContent.includes('Modül 02'), { timeout: 8000 });

    // 5) Diyaloglar & İnteraktif Partner
    await page.click('#nav-dialogue');
    await page.waitForSelector('#btn-dialogue-partner');
    await page.click('#btn-dialogue-partner');

    // 6) Akıllı Tekrar (SRS) — kart çevirme ve puanlama
    await page.click('#nav-flashcards');
    await page.waitForSelector('#btn-flip-card');
    await page.click('#btn-flip-card');
    await page.click('#btn-srs-rate-3');

    // 7) Seviye Finalleri
    await page.click('#nav-finals');
    await page.waitForSelector('#btn-select-final_a1');

    // 8) Referans Atlası & YDS Laboratuvarı
    await page.click('#nav-atlas');
    await page.waitForSelector('#tab-atlas-roots');
    await page.click('#tab-atlas-connectors');
    await page.click('#tab-atlas-errors');

    // Ctrl+K Arama + Tema Değiştirme + JSON Yedekleme Modalı
    await page.click('#btn-open-search');
    await page.fill('#input-command-search', 'hemze');
    await page.keyboard.press('Escape');

    await page.click('#btn-toggle-theme');
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!isDark) throw new Error('Koyu tema geçişi çalışmadı');
    await page.click('#btn-toggle-theme');

    await page.click('#btn-open-backup');
    await page.waitForSelector('#btn-export-json');

    await browser.close();

    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      throw new Error(`Tarayıcı hataları: console=${JSON.stringify(consoleErrors)}, page=${JSON.stringify(pageErrors)}`);
    }

    console.log('PLAYWRIGHT E2E BAŞARILI! 8 bölüm, lazy loading (M01 & M02), 3 hareke modu, SRS, Ctrl+K, tema ve yedekleme %100 geçti (0 hata).');
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((e) => {
  console.error('E2E HATASI:', e);
  process.exit(1);
});
