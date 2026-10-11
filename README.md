# BlueDash

BlueDash, Ingilizce kitap sayfalarinda mavi kalemle isaretlenen kelimeleri bulmak, OCR koordinatlariyla dogru kelimeyi secmek ve kitapta yazan Turkce karsiligiyle Quizlet'e aktarilabilir UTF-8 TSV uretmek icin gelistirilmis React + TypeScript PWA uygulamasidir.

Bu bir Apple uygulamasi degil; GitHub Pages gibi statik hosting uzerinden yayinlanabilen web uygulamasidir. iPhone, MacBook ve modern tarayicili diger cihazlarda ayni URL ile kullanilabilir.

## Mimari

- `src/lib/blueMarks.ts`: Mavi kalem piksellerini HSV-benzeri renk kosullariyla maskeler, bagli bilesenleri bulur ve alt cizgi, daire, karalama olarak siniflandirir.
- `src/lib/imageFormats.ts`: iPhone HEIC/HEIF fotograflarini OCR oncesinde tarayicida JPEG'e donusturur.
- `src/lib/ocr.ts`: `tesseract.js` ile `eng+tur` OCR calistirir ve her kelime icin koordinat kutusu uretir.
- `src/lib/matcher.ts`: Mavi isaret kutularini OCR kelime kutulariyla karsilastirir. Turkce karsiligi ayni satirda, kelimenin saginda arar. Emin degilse satiri inceleme icin isaretler; anlam uydurmaz.
- `src/lib/quizlet.ts`: Mevcut set kelimelerini TSV/CSV metninden okur, tekrar eklemeyi engeller ve Quizlet Import icin TSV uretir.
- `src/lib/storage.ts`: Sonuclar ve fotograf blob'larini IndexedDB'de yerel olarak saklar. Kullanici tek tusla silebilir.
- `src/ui/App.tsx`: iPhone ve MacBook ekranlarina uyumlu PWA arayuzu, kamera/yukleme, tablo duzenleme, toplu onay, kopyalama ve indirme akislari.

## Quizlet durumu

Set basligi uygulamada zorunlu ve otomatik olarak `2027 YDS` atanir. Kullanici baslik girmez.

11 Ekim 2026 itibariyla dogrudan public Quizlet API ile mevcut sete otomatik kart ekleme icin resmi, self-service ve yetkili bir yol dogrulanamadi. Bu nedenle uygulama desteklenmeyen/izinsiz otomasyon yapmaz. Guvenli akis:

1. Quizlet'te `2027 YDS` adli seti acin veya olusturun.
2. Mevcut setteki terimleri disari aktarabiliyorsaniz TSV metnini BlueDash'teki "Mevcut 2027 YDS kelimeleri" alanina yapistirin.
3. BlueDash yeni ve onayli satirlari tekrarlar olmadan TSV olarak hazirlar.
4. Quizlet'in set duzenleme ekraninda Import aracini kullanip TSV metnini mevcut sete ekleyin.

## Kurulum

Bu ortamda global Node yoksa Codex paketlenmis Node yolunu PATH'e ekleyin:

```bash
export PATH=/Users/burakdugan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH
```

Bagimliliklar:

```bash
/Users/burakdugan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm install
```

Gelistirme sunucusu:

```bash
./node_modules/.bin/vite --host 127.0.0.1
```

Uretim build:

```bash
./node_modules/.bin/tsc -b
./node_modules/.bin/vite build
```

Testler:

```bash
./node_modules/.bin/vitest run
```

Not: Bu Codex ortaminda `pnpm run` komutlari, `tesseract.js` build-script onay kontrolune takilabildigi icin dogrulama komutlari dogrudan `node_modules/.bin` ile calistirildi.

## GitHub Pages ile yayinlama

1. Bu klasoru bir GitHub reposuna yukleyin.
2. GitHub reposunda `Settings > Pages` bolumune girin.
3. `Build and deployment` kaynagini `GitHub Actions` olarak secin.
4. `main` branch'e push yaptiginizda `.github/workflows/deploy.yml` otomatik calisir.
5. Build bittikten sonra uygulama GitHub Pages URL'nizde acilir.

Uygulama statik olarak yayinlanir; fotograf secimi, OCR ve tablo islemleri kullanicinin tarayicisinda calisir. Quizlet'e dogrudan gizli API anahtari koyulmadigi icin GitHub Pages'e acik sekilde deploy etmek uygundur.

## Kullanim

1. `Fotograf yukle` ile JPG, PNG, HEIC veya HEIF biciminde birden fazla sayfa secin ya da iPhone'da `Kamera ile tara` dugmesini kullanin.
2. Tarama bitince dusuk guvenli satirlari kontrol edin.
3. Yanlis OCR sonucunu tabloda duzeltin, gereksiz satiri silin veya toplu onaylayin.
4. Mevcut `2027 YDS` setindeki kelimeleri yapistirerek tekrarlarin dislanmasini saglayin.
5. `Kopyala` ile TSV'yi panoya alin veya `TSV indir` ile `2027-YDS-quizlet.tsv` dosyasini indirin.
6. Gizlilik icin `Verileri sil` dugmesi yerel fotograf ve sonuc verilerini temizler.

## Dogrulama

Calistirilanlar:

- `vitest run`: 3 test dosyasi, 9 test basarili.
- `tsc -b && vite build`: Uretim build basarili, PWA service worker uretildi.
- Sentetik ornek gorsel uzerinde mavi alt cizgi algilama testi basarili.

Test edilmemis/elde olmayanlar:

- Gercek kitap fotograflariyla toplu OCR kalite testi yapilmadi; bu oturumda kullanicidan gercek fotograf saglanmadi.
- Quizlet'e dogrudan otomatik ekleme yapilmadi ve desteklendigi iddia edilmedi.
