# Lafaz

Prototype app belajar Al-Qur'an dengan pola Duolingo. Fokus pertama membaca dengan tajwid yang benar, lalu hafalan.

Lafaz adalah pendamping belajar. Bacaan tetap sebaiknya disetorkan ke guru (talaqqi).

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Halaman debug parser tajwid ada di `/debug/tajwid`.

Perintah lain:

- `npm run fetch-quran` mengunduh ulang data Qur'an ke `data/quran/`
- `npm run build` build produksi
- `npm run lint`

## Sumber data

Semua teks ayat diambil lewat `scripts/fetch-quran.ts`, tidak ada yang diketik manual. Script berhenti dengan error kalau ada endpoint yang gagal atau formatnya tidak sesuai.

| Data | Sumber |
| --- | --- |
| Teks Utsmani | `https://api.alquran.cloud/v1/surah/{n}/quran-uthmani` |
| Terjemahan Indonesia | `https://api.alquran.cloud/v1/surah/{n}/id.indonesian` |
| Anotasi tajwid | `https://api.alquran.cloud/v1/surah/{n}/quran-tajweed` |
| Audio per ayat (Mishary Alafasy) | `https://everyayah.com/data/Alafasy_128kbps/{SSS}{AAA}.mp3` |
| Audio per kata | `https://audio.qurancdn.com/wbw/{sss}_{aaa}_{www}.mp3` (sudah dicek bisa diakses, belum dipakai) |

Surah yang diambil: Al-Fatihah (1) dan seluruh juz 30 (78 sampai 114), 38 surah, 602 ayat. Juz 30 diambil utuh supaya contoh tajwid bisa dipilih dari surah mana saja tanpa mengunduh ulang.

Hasilnya:

- `data/quran/001.json`, `078.json`, ... satu file per surah. Tiap ayat berisi `text` (Utsmani), `translation`, `tajweed` (markup mentah), dan `audio`.
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

- Pemetaan kode tajwid bertanda **belum** di tabel atas (`n`, `p`, `o`, `q`, `g`)
- Nama hukum dalam bahasa Indonesia di `data/content/tajweed-rules.json`
