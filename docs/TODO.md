# Lafaz — Daftar Tugas Aktif

> **Aturan:** agen hanya boleh mengerjakan tugas di blok ACTIVE.
> Blok bertanda BERIKUTNYA atau di bawah garis (---) belum boleh dimulai sebelum pemilik memindahkannya ke ACTIVE.
> Setiap blok berakhir dengan **Checkpoint**: sesuatu yang bisa dibuka atau dijalankan. Setelah checkpoint, berhenti dan laporkan.

Saat ini **tidak ada blok ACTIVE**. Pemilik memilih blok berikutnya.

---

## DONE — Blok 0: Data & Fondasi
- [x] Next.js dengan layout mobile dan font Amiri Quran.
- [x] Parser markup tajwid dan pemetaan kode ke nama hukum (`src/lib/tajweed.ts`, `data/content/tajweed-rules.json`).
- [x] `fetch-quran`: Al-Fatihah + juz 30, 602 ayat, dengan data per kata dan waktu tiap kata.
- [x] Halaman debug `/debug/tajwid`.
- [x] Materi huruf `data/content/hijaiyah.json` dan Contoh Kata otomatis, diutamakan kata tanpa tanda khusus.

**Checkpoint:** `/debug/tajwid/1` menampilkan Al-Fatihah berwarna tajwid. ✅

## DONE — Blok 1: Kerangka & Huruf Hijaiyah
- [x] Tab bawah, bar atas, path zig-zag, banner dan panduan unit, peti, piala.
- [x] Onboarding sampai langsung masuk lesson pertama.
- [x] Mesin lesson: progress bar, combo, panel umpan balik, efek suara Web Audio, soal salah diulang, rangkaian layar akhir.
- [x] XP, streak + pembeku, Target Harian, Misi Harian, peti. (Hati dan gems juga dibuat, lalu diputuskan dihapus di Blok 2.)
- [x] Bagian Huruf Hijaiyah: 9 unit, 44 lesson, 8 jenis soal.
- [x] Tab Huruf dengan Penguasaan Huruf. Studio rekam dan ekspor.
- [x] Satu pemutar audio untuk semua bacaan, efek suara tidak bertumpuk.

**Checkpoint:** onboarding → lesson pertama → layar akhir berjalan di 375×812, `npm run lint` dan `npx tsc --noEmit` bersih. ✅ 20 Okt 2026.

Sisa yang belum bisa ditutup agen:
- [ ] Pemilik: cari ustadz untuk merekam huruf lewat Studio. `public/audio/huruf/manifest.json` masih kosong.
- [ ] Ustadz: cek konten di `docs/DATA.md` §5.

## DONE — Blok 2: Pembeda di Bagian Huruf
Tujuan: pembeda dari `docs/PRD.md` §3 sudah terasa di konten yang ada, sebelum menambah materi baru.

- [x] Hapus hati: `MAX_HEARTS`, isi ulang, angka di bar atas, layar hati habis, +1 hati dari Latihan Ulang (ADR-0004).
- [x] Hapus gems dan isi ulang hati berbayar (ADR-0006). Peti dan Misi Harian sekarang memberi XP bonus (keputusan pemilik, `docs/PRD.md` §8). State lama dimigrasi ke versi 2.
- [x] Ganti teks onboarding dan Profil ke nada inklusif dan talaqqi sebagai ajakan (ADR-0009).
- [x] Huruf Bandel: masuk saat dijawab salah, lesson "Taklukkan" di tab Huruf, keluar setelah benar 3 kali berturut-turut (FR-9).
- [x] Badge di Profil: Kenal semua huruf, Penakluk huruf bandel, Streak 7 hari, Juara tantangan (FR-10). Badge baru tampil di layar akhir lesson.
- [x] Mode Tantangan per unit: 3 nyawa, 15 detik per soal, XP 2x, badge. Nyawa habis = gagal, tombol "Coba lagi" (FR-11).
- [x] Peta Ayat di `/peta` (tab bekas Liga) dengan tanda "hurufnya dikenal", dan sorot huruf di ayat Al-Fatihah setelah Uji unit pertama kali lulus (FR-12, ADR-0007).
- [x] Perayaan streak hari ke-7, 30, 100.

**Checkpoint:** di 375×812, selesaikan unit 1 tanpa hati, lihat sorot huruf di ayat, lihat ayat menyala di Peta Ayat, dan salah satu huruf masuk Huruf Bandel. ✅ 20 Okt 2026.

Cek logika: `npm run check` (Huruf Bandel, huruf per ayat, pemilihan ayat sorot).

Sisa yang belum bisa ditutup agen:
- [ ] Ustadz: cek pemetaan bentuk huruf di `data/content/hijaiyah.json` (`variants`: ٱ أ إ → alif, ؤ ئ → hamzah, ة → ta, ى → ya).

## DONE — Blok 3: Iqro Lanjutan → Bisa Baca Al-Fatihah
Keputusan pemilik (20 Okt 2026): satu blok utuh, model Cek Suara dikonversi sendiri ke ONNX, Rank bertema cahaya.

- [x] Bagian 2 Membaca, urutan Iqro: u10 huruf sambung, u11 kasrah, u12 dhammah, u13 tanwin, u14 sukun, u15 tasydid, u16 mad, u17 tanda khusus (alif washal, alif kecil, lam syamsiyah), u18 Al-Fatihah (FR-15). Suku kata latihan dibuat kode dari huruf + tanda (`syllables.ts`), materi di `data/content/harakat.json`.
- [x] `npm run build-reading-data` memilih kata qari per suku kata, kata dan ayat Momen Bisa Baca per unit (ayat utuh pertama: 94:1 setelah sukun), dan kata bertanda khusus. Ditandai perlu cek ustadz.
- [x] Cek Suara: model Tarteel dikonversi ke ONNX q8 (±102 MB), jalan di Web Worker, diunduh di latar setelah onboarding, cocok per kata dengan ejaan Utsmani (FR-14, ADR-0008).
- [x] Momen Bisa Baca: baca sendiri, rekam, Cek Suara, dengar qari, tanda "bisa dibaca" di Peta Ayat.
- [x] Kartu Pamer gambar PNG lewat Web Share atau unduh (FR-13).
- [x] Latihan Ulang terjadwal gaya Leitner (1, 2, 4, 8, 16 hari) untuk huruf dan suku kata.
- [x] Badge Lancar harakat, Ayat pertama, Bisa baca Al-Fatihah.
- [x] Tes Matrikulasi di Iqro (≤15 soal, 3 tahap), dari onboarding ("Kenal sebagian" / "Sudah bisa membaca") dan dari header Bagian Membaca. Lesson yang dilewati tanpa XP dan badge (ADR-0010).
- [x] Rank dari total XP di Profil dan layar akhir lesson: Percikan 0, Nyala 100, Pelita 300, Lentera 700, Suar 1500, Cahaya 3000 XP.

**Checkpoint:** Pelajar baru bisa sampai membaca 1:1 sendiri, Cek Suara menandai per kata, dan Kartu Pamer bisa disimpan. ✅ 20 Okt 2026, diuji dengan audio qari sebagai pengganti mikrofon (browser pane tidak punya mikrofon): 1:1 terbaca 4 dari 4 kata hijau.

Sisa yang belum bisa ditutup agen:
- [ ] Pemilik: coba Momen Bisa Baca dengan suara sendiri di HP (mikrofon asli belum diuji).
- [ ] Pemilik: sebelum deploy, upload `public/models/tarteel-ai/whisper-base-ar-quran/` ke repo Hugging Face dan isi `NEXT_PUBLIC_SPEECH_MODEL`. Tanpa itu Cek Suara di produksi jatuh ke Nilai Sendiri.
- [ ] Ustadz: cek `data/content/harakat.json`, `data/content/reading.json`, dan cara baca latin suku kata (huruf tebal "o", tasydid dobel, mad tanpa sukun).
- [ ] Rekaman Huruf kasrah/dhammah lewat Studio. Sampai ada, 9 huruf berkasrah belum punya contoh suara qari.

## DONE — Blok 4: Level Tajwid
Dikerjakan atas permintaan pemilik di chat (21 Okt 2026), karena belum ada blok yang dipindah ke ACTIVE.

- [x] Level di kode (`LEVELS`, `level`, `levels` di store versi 3): onboarding "Mau mulai dari mana?" (Iqro, tes dulu, langsung Tajwid), pemilih Level di bar atas tab Belajar setelah ada lebih dari satu Level, kartu "Level berikutnya" di akhir path Iqro, dan tes naik Level `naik-tajwid` (baca 7 ayat Al-Fatihah) dengan saran dan tombol "Tetap masuk" kalau belum lulus (ADR-0010). Lulus Uji unit Al-Fatihah juga membuka Level Tajwid.
- [x] Pemutar Potongan Ayat dari `timing` (FR-16): `playSpan` berhenti tepat di akhir kata (cek tiap 15 ms, bukan `timeupdate` yang telat sampai 250 ms), bisa diputar pelan 0,7x tanpa mengubah nada.
- [x] `npm run build-tajweed-examples`: contoh 14 hukum dari 486 ayat ke `data/content/tajweed-examples.json`. Izhar halqi dan izhar syafawi dideteksi dari Teks Utsmani, qalqalah sughra/kubra dari posisinya. Semua hasil deteksi dan pemetaan yang belum yakin ditandai review.
- [x] Bagian nun mati dan tanwin: satu unit per hukum (izhar, idgham bighunnah, idgham bilaghunnah, iqlab, ikhfa) dan unit ulasan, dengan 6 jenis soal: kenali bunyinya, dengar dan bandingkan, tebak dari Potongan Ayat, tebak dari suara (teks muncul setelah menjawab), cari di ayat, ucapkan potongan (Cek Suara per kata + Nilai Sendiri).
- [x] Unit mim mati, qalqalah, dan mad, satu unit per bagian karena contohnya di juz 30 sedikit (idgham mimi 7, ikhfa syafawi 9, mad lazim 5).
- [x] Badge Level Tajwid: Ahli nun mati & tanwin, Ahli mim mati, Ahli qalqalah, Ahli mad, Telinga tajwid (50 kali benar menebak dari suara).

**Checkpoint:** unit ikhfa dari Kenali bunyinya sampai Ucapkan potongan berjalan di 375×812, Potongan Ayat terpotong tepat (112:4 kata 4–5: mulai 2,050 detik, berhenti 3,634 detik untuk target 3,630). `npm run lint`, `npx tsc --noEmit`, `npm run check`, dan `npm run build` bersih. ✅ 21 Okt 2026.

Sisa yang belum bisa ditutup agen:
- [ ] Ustadz: cek `data/content/tajweed-lessons.json` (penjelasan 14 hukum) dan contoh bertanda review di `data/content/tajweed-examples.json` (izhar, qalqalah sughra/kubra, mad thabi'i, mad wajib/jaiz, mad 'aridh).
- [ ] Ucapkan potongan dengan Cek Suara belum diuji: model belum ada di mesin ini (`public/models/` tidak di-commit), jadi soal jatuh ke Nilai Sendiri. Uji setelah model dikonversi atau di-upload.
- [x] Pilihan "Hafalan" di "Mau mulai dari mana?" ditambahkan bersama Blok 5.

## DONE — Blok 5: Level Hafalan Juz Amma
Dikerjakan atas permintaan pemilik di chat (21 Okt 2026), setelah Blok 4 dicek bersih.

- [x] Level Hafalan (`hafalan`) sejajar dengan Tajwid: pilihan "Langsung Hafalan" di onboarding, tes naik Level `naik-tajwid` dan Uji unit Al-Fatihah membuka Tajwid dan Hafalan sekaligus, kartu "Level berikutnya" di akhir path Iqro menampilkan keduanya. Store versi 4 membuka Hafalan untuk yang sudah lulus Uji unit Al-Fatihah.
- [x] Urutan: Al-Fatihah, lalu An-Nas mundur ke An-Naba', satu unit per surah (38 unit dalam 5 Bagian). Ayat dikelompokkan per 3, ayat tunggal di akhir ikut kelompok sebelumnya (`ayahGroups`).
- [x] Lesson tikrar per kelompok (FR-17): tiap ayat didengar 3 kali bersama teks dan artinya, isi kata yang hilang, baca dari hafalan (teks disembunyikan, hanya kata pertama, bisa diintip), lalu disambung dengan ayat sebelumnya. Lesson berikutnya diawali "ayat apa sesudahnya" dari kelompok sebelumnya.
- [x] Tes hafalan di akhir unit: pemanasan sambung ayat dan kata hilang, lalu tiap kelompok dibaca dari hafalan. Cek Suara membantu per kata, Pelajar tetap bisa memilih "Sudah hafal". Mengintip berarti ayat itu belum ditandai.
- [x] Tanda "sudah hafal" (emas) di Peta Ayat dari `memorized` di store.
- [x] Badge Level Hafalan: Hafal Al-Fatihah, Tiga Qul, 10 surah, 20 surah, Juz amma lengkap.
- [x] Cek Suara memotong rekaman lebih dari 30 detik jadi beberapa bagian (`chunk_length_s`), untuk sambungan ayat yang panjang.

**Checkpoint:** di 375×812, Pelajar baru memilih "Langsung Hafalan", menyelesaikan lesson An-Nas ayat 1–3 tanpa salah, lalu lulus Tes hafalan An-Nas, Al-Falaq, dan Al-Ikhlas. Badge "Tiga Qul" muncul, dan ketiga surah menyala emas di Peta Ayat. Rekaman diganti audio qari (browser pane tidak punya mikrofon): Cek Suara mendengar 5–11 dari 8–15 kata per kelompok. `npm run lint`, `npx tsc --noEmit`, `npm run check`, dan `npm run build` bersih. ✅ 21 Okt 2026.

Sisa yang belum bisa ditutup agen:
- [ ] Pemilik: coba tikrar dan Tes hafalan dengan suara sendiri di HP.
- [ ] Cek Suara sering tidak mendengar beberapa kata saat beberapa ayat dibaca bersambung, bahkan dari audio qari (An-Nas 1–3: 5 dari 8 kata). Ayat tunggal lebih baik. Perlu dilihat bersama rencana percepatan Cek Suara di Backlog.
- [ ] Rekaman lebih dari 30 detik dengan `chunk_length_s` belum diuji (sambungan ayat terpanjang di juz 30).

## Backlog
- Sebelum deploy portofolio: kredit sumber audio dan teks di dalam app, disclaimer prototype (`docs/PRD.md` §6), deploy ke Vercel.
- Sebelum deploy portofolio: percepat Cek Suara. Diukur 20 Okt 2026 di laptop 8 inti, model sudah dimuat: 1 kata 3,2 detik, 1 ayat 3,3 detik, cek pertama 4,4 detik. Whisper selalu memproses jendela 30 detik, WASM jalan 1 thread (`crossOriginIsolated` false), GPU tidak dipakai. Rencana:
  - A. Pemanasan model sekali setelah diunduh (cek pertama 4,4 → ±3,2 detik).
  - B. WebGPU dengan cadangan WASM. Perlu konversi ulang encoder fp16/fp32, naikkan `MODEL_VERSION`, uji di Safari.
  - Ditunda: banyak thread lewat header COOP/COEP (bisa memblokir audio qari dari CDN, terutama di Safari) dan whisper-tiny (lebih sering salah dengar).
- Sebelum produk publik: izin audio dari Quran Foundation dan everyayah.
- Identitas visual sendiri menggantikan gaya sementara (`docs/DESIGN.md`).
- Kartu Pamer dengan rekaman suara Pelajar.
- Tantang teman lewat link.
- Halaqah, kelompok belajar kolaboratif (butuh backend, butuh ADR baru yang menggantikan ADR-0001).
- Kosmetik maskot dan tema.
- Pesan khusus saat audio qari gagal dimuat.
- Test otomatis untuk `exercises.ts`, `store.ts`, dan `tajweed.ts`.
