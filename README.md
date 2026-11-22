# 0'dan B2'ye + YDS/YÖKDİL Tam Kapsamlı Arapça Külliyatı (v4.0)

> **مَوْسُوعَةُ اللُّغَةِ الْعَرَبِيَّةِ الشَّامِلَةُ**  
> İki çıktılı modern Arapça eğitim platformu: **İnteraktif Web Uygulaması** (React + Vite + Tailwind CSS v4) + **5 Ciltli Yayın Kalitesinde A4 PDF Kitap Seti** (Playwright + Yerel Gömülü Arapça Fontlar).

## Mimari ve Öne Çıkan Özellikler

- **Ölçeklenebilir Tembel Yükleme (Code-Splitting):** `src/data/modules/modul_XX.json` ve `src/data/finals/final_*.json` dosyaları `import.meta.glob` ile yalnızca açıldığında yüklenir; SRS ve Referans Atlası `scripts/build-indexes.mjs` tarafından üretilen hafif indeksleri kullanır.
- **Arapça Tipografi & 3 Kademeli Hareke Köprüsü:** Yerel paketli `@fontsource/amiri` ve `@fontsource/noto-naskh-arabic` fontları, kusursuz `dir="rtl"` ve 3 kademeli okuma modu:
  1. **Tam Harekeli (A1)**
  2. **Kısmi / Son Hareke — İ'rab Modu (A2–B1)**
  3. **Harekesiz Gerçek Gazete / YDS Modu (B2)**
- **Ses & Gölgeleme (Shadowing) Motoru:** Web Speech API (`ar-SA`) ile `0.7x / 0.85x / 1.0x` hız ayarı ve 2x tekrar + duraklamalı gölgeleme modu.
- **8 Ana Bölüm:** Külliyat Haritası (55 Modül / 5 Faz), Gramer & Tatbik (5 parçalı anlatım + 50 tatbik/modül), Cümle Kurma Atölyesi (6 kalıp motoru, 4×5 genişletme merdiveni, 15 blok inşası), Okuma Stüdyosu (3 uzun metin + tıklanabilir kök müfettişi), Diyaloglar & 5 Turlu İnteraktif Partner, Akıllı Tekrar (4 modlu SM-2 SRS + `Space/R/1-4` kısayolları), Seviye Sonu Büyük Finalleri (A1/A2/B1/B2–YDS) ve Hızlı Referans Atlası & Hata Defteri.
- **İlerleme Yedekleme:** `localStorage` kalıcılığı ve tek tıkla JSON Dışa Aktar / İçe Aktar.

## Komutlar

```bash
npm install
npm run dev                        # İndeksleri üret + geliştirme sunucusunu başlat
npm run validate                   # Otomatik Kalite Denetçisi (şema, ID, hareke yoğunluğu, kotalar)
npm run build-indexes              # SRS, Kök Aileleri, Atlas ve Ctrl+K arama indekslerini üret
npm run build                      # Production bundle (lazy chunk ayrımıyla)
npm run build-pdf -- --cilt=1      # Cilt 1 A4 PDF kitabını üret (1..5 veya --modul=01 veya --all)
npm run test:e2e                   # Playwright uçtan uca doğrulama
```

## 5 Ciltli Müfredat Haritası

| Cilt | Faz & Seviye | Kapsam |
|---|---|---|
| **Cilt 1** | Faz 1 (0 → A1) | M01–M11 + `final_a1` |
| **Cilt 2** | Faz 2 (A1 → A2) | M12–M23 + `final_a2` |
| **Cilt 3** | Faz 3 (A2 → B1) | M24–M34 (Mezîd Fiiller, Müştak İsimler, Aksâm-ı Seb'a) |
| **Cilt 4** | Faz 4 (B1 → B1+) | M35–M45 + `final_b1` (İleri Nahiv, 5 Mef'ûl, Cümle İ'rabı) |
| **Cilt 5** | Faz 5 (B1+ → B2 / YDS–YÖKDİL) | M46–M55 + `final_b2` (Harf-i Cerli Fiiller, Bağlaçlar, YÖKDİL 3 Alan, Cloze/Çeviri/Restatement) |
