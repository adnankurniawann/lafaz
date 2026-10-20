# Lafaz

Prototype app belajar membaca Al-Qur'an yang meniru Duolingo. Mulainya seperti Iqro, mengenal huruf hijaiyah lewat suara, lalu tajwid lewat mendengar. Spesifikasi lengkap ada di [SPEC.md](SPEC.md).

Lafaz adalah pendamping belajar. Bacaan tetap sebaiknya disetorkan ke guru (talaqqi).

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Pengguna baru masuk ke onboarding, lalu langsung ke lesson pertama. Progres disimpan di localStorage browser. Untuk mengulang dari awal, pakai tombol "Hapus semua progres" di tab Profil.

Perintah lain:

- `npm run fetch-quran` mengunduh ulang data Qur'an ke `data/quran/`
- `npm run build-letter-examples` memilih ulang contoh kata per huruf dari `data/quran/`
- `npm run build` build produksi
- `npm run lint`

## Yang sudah ada (fase 1)

- **Tampilan ala Duolingo.** Tab bawah (Belajar, Huruf, Liga, Misi, Profil), bar atas (streak, gems, hati), path zig-zag dengan banner unit, panduan unit, peti hadiah, dan piala di akhir unit.
- **Onboarding.** Tujuan, kemampuan awal, target harian, pengingat talaqqi, lalu langsung masuk lesson pertama.
- **Bagian 1, Huruf Hijaiyah.** 9 unit urutan Iqro jilid 1, dari ا ب ت ث sampai huruf yang mirip. Total 44 lesson dan 9 peti, tiap lesson 8 sampai 14 soal.
- **Jenis soal:**
  - kenalan huruf baru
  - dengar dan pilih huruf
  - huruf awal dari kata Al-Qur'an
  - pilih bunyi
  - pilih nama
  - pasangkan
  - baca rangkaian gaya Iqro (dari kanan ke kiri)
  - ucapkan (rekam lalu nilai sendiri)
- **Mesin lesson.** Progress bar, hati, combo, panel benar/salah dengan jawaban yang benar, efek suara (Web Audio, tanpa file), soal salah diulang di akhir, dan konfirmasi keluar.
- **Setelah lesson.** Layar hasil (XP, akurasi, waktu), streak, target harian, lalu misi harian.
- **Gamifikasi:**
  - XP dengan bonus tanpa salah dan bonus combo
  - 5 hati yang terisi 1 tiap 4 jam, +1 dari latihan, atau isi penuh dengan 100 gems
  - streak dengan 1 pembeku gratis per minggu
  - target harian
  - gems
  - 3 misi harian berhadiah peti
- **Tab Huruf.** Grid 29 huruf dengan bar penguasaan, kartu penjelasan (makhraj dan contoh kata), dan latihan huruf.
- **Studio rekam** (`/studio`, dari tab Profil). Untuk ustadz merekam huruf × fathah/kasrah/dhammah.
- **Halaman debug tajwid** (`/debug/tajwid`).

Liga, toko, pencapaian, dan Bagian 2 (Tajwid lewat dengar) dikerjakan di fase berikutnya, sesuai [SPEC.md](SPEC.md).

## Suara huruf

Tidak ada suara sintetis (TTS). Urutan sumber suara huruf:

1. File di `public/audio/huruf/` yang terdaftar di `manifest.json`, contoh `{ "ba-fathah": "ba-fathah.webm" }`.
2. Rekaman dari halaman Studio, tersimpan di IndexedDB browser itu.
3. Kalau belum ada keduanya, tombol suara memutar contoh kata Al-Qur'an yang diawali huruf tersebut, dibaca qari (audio per kata quran.com). Untuk ص ق ن juga ada rekaman qari menyebut nama hurufnya (huruf muqatta'ah di 38:1, 50:1, 68:1).

Soal "dengar dan pilih huruf" hanya muncul untuk huruf yang sudah punya rekaman. Selama belum ada rekaman, posisinya diganti soal "huruf awal dari kata".

Cara memasukkan rekaman ustadz untuk semua pengguna:

1. Buka `/studio`, rekam, lalu tekan "Ekspor".
2. Ekstrak zip-nya ke `public/audio/huruf/`. Isinya file rekaman dan `manifest.json`.

## Struktur kode

- `src/lib/course.ts` struktur bagian, unit, dan node path, serta aturan buka-kunci.
- `src/lib/exercises.ts` tipe tiap jenis soal dan penyusun soal per jenis lesson.
- `src/lib/store.ts` state game (XP, hati, streak, gems, misi, penguasaan huruf), disimpan dengan zustand persist.
- `src/lib/letters.ts` dan `data/content/hijaiyah.json` materi huruf.
- `src/lib/recordings.ts` rekaman huruf (file dan IndexedDB). `src/lib/audio.ts` satu pemutar untuk semua bacaan, supaya tidak pernah bertumpuk.
- `src/components/lesson/` layar lesson, komponen tiap jenis soal, dan layar akhir.

## Sumber data

Semua teks ayat diambil lewat `scripts/fetch-quran.ts`, tidak ada yang diketik manual. Script berhenti dengan error kalau ada endpoint yang gagal atau formatnya tidak sesuai.

| Data | Sumber |
| --- | --- |
| Teks Utsmani | `https://api.alquran.cloud/v1/surah/{n}/quran-uthmani` |
| Terjemahan Indonesia | `https://api.alquran.cloud/v1/surah/{n}/id.indonesian` |
| Anotasi tajwid | `https://api.alquran.cloud/v1/surah/{n}/quran-tajweed` |
| Audio per ayat (Mishary Alafasy) | `https://everyayah.com/data/Alafasy_128kbps/{SSS}{AAA}.mp3` |
| Data per kata (teks, audio per kata) dan waktu tiap kata di audio ayat | `https://api.quran.com/api/v4/verses/by_chapter/{n}?words=true&audio=7` |
| Audio ayat yang cocok dengan waktu per kata | `https://verses.quran.com/Alafasy/mp3/{SSS}{AAA}.mp3` |
| Audio per kata | `https://audio.qurancdn.com/wbw/{sss}_{aaa}_{www}.mp3` |

Surah yang diambil: Al-Fatihah (1) dan seluruh juz 30 (78 sampai 114), 38 surah, 602 ayat. Juz 30 diambil utuh supaya contoh tajwid bisa dipilih dari surah mana saja tanpa mengunduh ulang.

Hasilnya:

- `data/quran/001.json`, `078.json`, ... satu file per surah. Tiap ayat berisi `text` (Utsmani), `translation`, `tajweed` (markup mentah), `audio`, `words` (teks dan audio per kata dari quran.com), dan `timing` (waktu mulai dan selesai tiap kata di audio ayat, dalam milidetik).
- `data/content/letter-examples.json` contoh kata per huruf, dipilih otomatis oleh `scripts/build-letter-examples.ts`. Aturannya: kata diawali huruf itu, diutamakan yang berharakat fathah, tanpa tanda khusus mushaf, pendek, dan dari surah yang dikenal.
- `data/quran/index.json` daftar surah, URL sumber, dan waktu pengambilan.
- `data/quran/text-notes.txt` catatan perbedaan teks yang ditemukan script.

Font Arab: [Amiri Quran](https://fonts.google.com/specimen/Amiri+Quran) dari Google Fonts (lisensi OFL), mendukung rasm Utsmani dan tanda-tanda kecil mushaf.

### Penyesuaian yang dilakukan script

Tidak ada huruf atau harakat yang diubah. Yang dilakukan hanya:

1. **BOM dibuang.** Teks 1:1 dari API diawali karakter U+FEFF (byte order mark), bukan bagian dari teks.
2. **Basmalah di ayat 1 dibuang.** Edisi `quran-uthmani` menempelkan basmalah di depan ayat 1 setiap surah selain Al-Fatihah dan At-Taubah, sedangkan edisi tajwid tidak. Basmalah dibuang dari teks ayat (dicocokkan persis dengan teks 1:1) dan disimpan sekali di `index.json`. Di surah 95 dan 97, basmalah tersebut punya tasydid tambahan di huruf ba (بِّسْمِ). Script hanya mengizinkan perbedaan itu dan mencatatnya.

### Anotasi tajwid

Markup di edisi `quran-tajweed` bentuknya `[kode:id[teks]` atau `[kode[teks]`. Parser ada di `src/lib/tajweed.ts`, hasilnya daftar segmen `{ text, rule }`.

Teks di edisi tajwid **tidak sama persis** dengan edisi Utsmani. Ada 330 dari 602 ayat yang encoding-nya berbeda, misalnya tatwil sebelum alif kecil, mim kecil tanda iqlab (ۢ) yang tidak ada, alif kecil ditulis sebagai ٲ, dan ى ditulis sebagai ٮ. Kalau teks edisi tajwid ditampilkan langsung, beberapa tanda akan tampil salah. Karena itu app selalu menampilkan teks Utsmani. Anotasi tajwid dipindahkan ke teks Utsmani dengan penyelarasan per karakter (`projectTajweed`). Script fetch memastikan tidak ada hukum yang hilang dalam proses ini.

Batas segmen mengikuti data sumber apa adanya, termasuk kalau batasnya jatuh di antara huruf dan harakatnya (contoh di 112:4, damma pada kaf ikut ditandai idgham). Browser berbasis Chromium dan Firefox tetap menyambung huruf Arab dengan benar walau warnanya berbeda per span.

Pemetaan kode ke nama hukum ada di `data/content/tajweed-rules.json`, supaya bisa direvisi tanpa menyentuh kode. Kode dan deskripsi aslinya diambil dari library `alquran/tools` (Tajweed.php) milik pengelola API.

| Kode | Nama di app | Deskripsi sumber | Yakin? |
| --- | --- | --- | --- |
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

Catatan soal mad: halaman panduan di situs alquran.cloud memberi label Arab مد واجب untuk kode `m` dan مد لازم untuk kode `o`. Label ini tertukar dengan deskripsi library (6 harakat untuk `m`, 4-5 harakat untuk `o`). Contoh di data mengikuti deskripsi library: `m` ada di ٱلضَّآلِّينَ (1:7), `o` ada di جَآءَ (110:1) dan إِنَّآ أَعْطَيْنَٰكَ (108:1).

**Hukum yang tidak ditandai di data:** izhar halqi dan izhar syafawi tidak punya kode sama sekali. Di juz 30 juga tidak ada contoh idgham mutaqaribain, dan idgham mutajanisain hanya ada satu.

## Konten yang perlu dicek ustadz

- Nama huruf, transliterasi gaya Iqro (kho, ro, sho, dho, tho, zho, gho, qo), dan penjelasan makhraj di `data/content/hijaiyah.json`
- Contoh kata per huruf di `data/content/letter-examples.json`, apakah cocok untuk mengenalkan huruf
- Pengelompokan huruf yang mirip bentuk atau bunyi di `src/lib/course.ts` (`SIMILAR_GROUPS`)
- Pemetaan kode tajwid bertanda **belum** di tabel atas (`n`, `p`, `o`, `q`, `g`)
- Nama hukum dalam bahasa Indonesia di `data/content/tajweed-rules.json`
- Rekaman suara huruf, kalau sudah dibuat lewat Studio
