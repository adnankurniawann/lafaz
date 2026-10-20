# Lafaz — Data & Konten

## 1. Sumber Data

Semua teks ayat diambil lewat `scripts/fetch-quran.ts`, tidak ada yang diketik manual (ADR-0003). Script berhenti dengan error kalau ada endpoint yang gagal atau formatnya tidak sesuai.

| Data | Sumber | Dipakai saat |
|---|---|---|
| Teks Utsmani | `https://api.alquran.cloud/v1/surah/{n}/quran-uthmani` | Script |
| Terjemahan Indonesia | `https://api.alquran.cloud/v1/surah/{n}/id.indonesian` | Script |
| Anotasi tajwid | `https://api.alquran.cloud/v1/surah/{n}/quran-tajweed` | Script |
| Data per kata (teks, audio per kata) dan waktu tiap kata di audio ayat | `https://api.quran.com/api/v4/verses/by_chapter/{n}?words=true&audio=7` | Script |
| Audio ayat yang cocok dengan waktu per kata | `https://verses.quran.com/Alafasy/mp3/{SSS}{AAA}.mp3` | App, langsung dari CDN |
| Audio per kata | `https://audio.qurancdn.com/wbw/{sss}_{aaa}_{www}.mp3` | App, langsung dari CDN |
| Audio per ayat (Mishary Alafasy) | `https://everyayah.com/data/Alafasy_128kbps/{SSS}{AAA}.mp3` | App, langsung dari CDN |
| Font Arab | [Amiri Quran](https://fonts.google.com/specimen/Amiri+Quran), Google Fonts | App |
| Model Cek Suara (rencana) | `tarteel-ai/whisper-base-ar-quran` versi ONNX, ±75 MB | App, diunduh sekali |

Surah yang diambil: Al-Fatihah (1) dan seluruh juz 30 (78 sampai 114), 38 surah, 602 ayat. Juz 30 diambil utuh supaya contoh tajwid dan hafalan bisa dari surah mana saja tanpa mengunduh ulang.

### 1.1 Lisensi

| Data | Lisensi | Status |
|---|---|---|
| Audio qari (everyayah, CDN quran.com) | Gratis diakses, **tanpa lisensi terbuka yang jelas**. Hak cipta ada pada qari atau penerbitnya | Aman untuk portofolio non-komersial dengan kredit. **Minta izin sebelum produk publik** |
| Teks dan terjemahan (alquran.cloud) | Gratis diakses, ikuti syarat pengelola API | Kredit di app |
| Data per kata (API quran.com) | Ikuti syarat Quran Foundation. Hanya dipanggil oleh script, bukan saat app dipakai | Cek syarat sebelum produk publik |
| Amiri Quran | SIL Open Font License | Bebas |
| Model Tarteel | Apache 2.0 | Bebas dengan atribusi |
| Rekaman Huruf dari Studio | Milik Lafaz, dengan persetujuan ustadz yang merekam | Belum ada rekaman |
| Efek suara | Dibuat sendiri dengan Web Audio (`src/lib/sfx.ts`), tanpa file | Milik Lafaz |

Audio tidak disimpan di repo. File `data/quran/*.json` hanya menyimpan URL, jadi browser mengambil audio langsung dari server sumber. Kalau server sumber mengganti URL atau memblokir hotlink, suara di app ikut mati, dan app tidak bisa dipakai offline.

## 2. Hasil Script

- `data/quran/001.json`, `078.json`, ... satu file per surah. Tiap ayat berisi `text` (Utsmani), `translation`, `tajweed` (markup mentah), `audio`, `words` (teks dan audio per kata), dan `timing` (waktu mulai dan selesai tiap kata di audio ayat, dalam milidetik).
- `data/quran/index.json`: daftar surah, URL sumber, waktu pengambilan, dan basmalah.
- `data/quran/text-notes.txt`: catatan perbedaan teks yang ditemukan script.
- `data/content/letter-examples.json`: Contoh Kata per huruf, dipilih oleh `scripts/build-letter-examples.ts`. Aturannya: kata diawali huruf itu, diutamakan yang berharakat fathah, tanpa tanda khusus mushaf, pendek, dan dari surah yang dikenal. Untuk ص ق ن juga disimpan rekaman qari menyebut nama hurufnya (38:1, 50:1, 68:1).

**Penting soal audio per kata**: tiap kata dibaca terpisah, jadi hukum tajwid antar kata (ikhfa, idgham, iqlab) tidak terdengar. Untuk Potongan Ayat, audionya diputar dari audio ayat penuh, dipotong dengan `timing`.

### 2.1 Penyesuaian oleh Script

Tidak ada huruf atau harakat yang diubah. Yang dilakukan hanya:

1. **BOM dibuang.** Teks 1:1 dari API diawali U+FEFF, bukan bagian dari teks.
2. **Basmalah di ayat 1 dibuang.** Edisi `quran-uthmani` menempelkan basmalah di depan ayat 1 setiap surah selain Al-Fatihah dan At-Taubah, edisi tajwid tidak. Basmalah dibuang dari teks ayat (dicocokkan persis dengan teks 1:1) dan disimpan sekali di `index.json`. Di surah 95 dan 97 basmalahnya punya tasydid tambahan di huruf ba (بِّسْمِ). Script hanya mengizinkan perbedaan itu dan mencatatnya.

## 3. Anotasi Tajwid

Markup edisi `quran-tajweed` berbentuk `[kode:id[teks]` atau `[kode[teks]`. Parsernya di `src/lib/tajweed.ts`, hasilnya daftar segmen `{ text, rule }`. Teks edisi tajwid berbeda encoding dari Teks Utsmani di 330 dari 602 ayat, jadi anotasinya dipindahkan ke Teks Utsmani (ADR-0003).

Pemetaan kode ke nama hukum ada di `data/content/tajweed-rules.json`, supaya bisa direvisi tanpa menyentuh kode. Kode dan deskripsi aslinya dari library `alquran/tools` (Tajweed.php) milik pengelola API.

| Kode | Nama di app | Deskripsi sumber | Yakin? |
|---|---|---|---|
| `h` | Hamzah washal | Hamzat ul Wasl | ya |
| `s` | Huruf tidak dibaca | Silent | ya |
| `l` | Alif lam syamsiyah | Lam Shamsiyyah | ya |
| `n` | Mad thabi'i | Normal Prolongation: 2 Vowels | **belum**, juga dipakai untuk mad shilah qashirah (لَهُۥ, 112:4) |
| `p` | Mad 'aridh lissukun | Permissible Prolongation: 2, 4, 6 Vowels | **belum**, dipakai untuk mad di akhir ayat dan mad lin saat waqaf (قُرَيْشٍ, 106:1) |
| `m` | Mad lazim | Necessary Prolongation: 6 Vowels | ya (lihat catatan) |
| `o` | Mad wajib muttashil / jaiz munfashil | Obligatory Prolongation: 4-5 Vowels | **belum**, data tidak membedakan keduanya |
| `q` | Qalqalah | Qalaqah | **belum**, data tidak membedakan sughra dan kubra |
| `c` | Ikhfa syafawi | Ikhafa' Shafawi - With Meem | ya |
| `f` | Ikhfa haqiqi | Ikhafa' | ya |
| `w` | Idgham mimi | Idgham Shafawi - With Meem | ya |
| `i` | Iqlab | Iqlab | ya |
| `a` | Idgham bighunnah | Idgham - With Ghunnah | ya |
| `u` | Idgham bilaghunnah | Idgham - Without Ghunnah | ya |
| `d` | Idgham mutajanisain | Idgham - Mutajanisayn | ya |
| `b` | Idgham mutaqaribain | Idgham - Mutaqaribayn | ya |
| `g` | Ghunnah | Ghunnah: 2 Vowels | **belum**, kemungkinan nun dan mim bertasydid |

Catatan soal mad: halaman panduan alquran.cloud memberi label Arab مد واجب untuk kode `m` dan مد لازم untuk kode `o`. Label ini tertukar dengan deskripsi library (6 harakat untuk `m`, 4-5 harakat untuk `o`). Contoh di data mengikuti deskripsi library: `m` ada di ٱلضَّآلِّينَ (1:7), `o` ada di جَآءَ (110:1) dan إِنَّآ أَعْطَيْنَٰكَ (108:1).

**Hukum yang tidak ditandai di data**: izhar halqi dan izhar syafawi tidak punya kode. Di juz 30 tidak ada contoh idgham mutaqaribain, dan idgham mutajanisain hanya ada satu.

Batas segmen mengikuti data sumber apa adanya, termasuk kalau batasnya jatuh di antara huruf dan harakatnya (contoh di 112:4, dhammah pada kaf ikut ditandai idgham). Chromium dan Firefox tetap menyambung huruf Arab dengan benar walau warnanya berbeda per span.

## 4. Suara Huruf

Urutan sumber suara satu huruf (`src/lib/recordings.ts`):

1. File di `public/audio/huruf/` yang terdaftar di `manifest.json`, contohnya `{ "ba-fathah": "ba-fathah.webm" }`. **Saat ini kosong.**
2. Rekaman dari Studio, tersimpan di IndexedDB browser yang merekam.
3. Contoh Kata dari audio per kata qari.

Cara memasukkan rekaman ustadz untuk semua Pelajar:
1. Buka `/studio`, rekam, lalu tekan "Ekspor".
2. Ekstrak zip-nya ke `public/audio/huruf/`. Isinya file rekaman dan `manifest.json`.

## 5. Konten yang Perlu Dicek Ustadz

| Konten | Tempat |
|---|---|
| Nama huruf, transliterasi gaya Iqro (kho, ro, sho, dho, tho, zho, gho, qo), penjelasan makhraj | `data/content/hijaiyah.json` |
| Contoh Kata per huruf, cocok atau tidak untuk mengenalkan huruf | `data/content/letter-examples.json` |
| Pengelompokan Huruf Mirip | `SIMILAR_GROUPS` di `src/lib/course.ts` |
| Pemetaan kode tajwid bertanda **belum** (`n`, `p`, `o`, `q`, `g`) | §3 dan `data/content/tajweed-rules.json` |
| Nama hukum dalam bahasa Indonesia | `data/content/tajweed-rules.json` |
| Hasil deteksi izhar dan pembedaan qalqalah (rencana) | Ditandai `"review": "perlu cek ustadz"` |
| Rekaman Huruf | Setelah dibuat lewat Studio |
