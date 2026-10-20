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

## BERIKUTNYA — Blok 2: Pembeda di Bagian Huruf
Tujuan: pembeda dari `docs/PRD.md` §3 sudah terasa di konten yang ada, sebelum menambah materi baru.

- [ ] Hapus hati: `MAX_HEARTS`, isi ulang, angka di bar atas, layar hati habis, +1 hati dari Latihan Ulang (ADR-0004).
- [ ] Hapus gems dan isi ulang hati berbayar (ADR-0006). Putuskan dulu isi Peti dan hadiah Misi Harian bersama pemilik (`docs/PRD.md` §8).
- [ ] Ganti teks onboarding dan Profil ke nada inklusif dan talaqqi sebagai ajakan (ADR-0009).
- [ ] Huruf Bandel: koleksi dari jawaban salah, lesson "Taklukkan", keluar setelah benar berturut-turut (FR-9).
- [ ] Badge: tampil di Profil. Mulai dengan Kenal semua huruf, Penakluk huruf bandel, Streak 7 hari, Juara tantangan (FR-10).
- [ ] Mode Tantangan per unit: 3 nyawa, timer, XP 2x, badge (FR-11). Putuskan detail timer bersama pemilik.
- [ ] Peta Ayat di tab bekas Liga dengan tanda "hurufnya dikenal" dan momen sorot huruf setelah unit selesai (FR-12, ADR-0007).
- [ ] Perayaan streak hari ke-7, 30, 100.

**Checkpoint:** di 375×812, selesaikan unit 1 tanpa hati, lihat sorot huruf di ayat, lihat ayat menyala di Peta Ayat, dan salah satu huruf masuk Huruf Bandel.

## Blok 3: Iqro Lanjutan → Bisa Baca Al-Fatihah
- [ ] Bagian harakat: kasrah dan dhammah, lalu tanwin, sukun, tasydid, mad dasar, huruf sambung (FR-15). Rekaman Huruf kasrah dan dhammah sudah didukung Studio.
- [ ] Script memilih kata dan ayat untuk Momen Bisa Baca dari data, ditandai perlu cek ustadz.
- [ ] Cek Suara: transformers.js + model Tarteel ONNX, unduh di latar belakang setelah onboarding, cocokkan per kata (FR-14, ADR-0008).
- [ ] Momen Bisa Baca lengkap: baca, Cek Suara, qari, tanda "bisa dibaca" di Peta Ayat.
- [ ] Kartu Pamer gambar (FR-13).
- [ ] Latihan Ulang terjadwal gaya Leitner.
- [ ] Badge Lancar harakat, Ayat pertama, Bisa baca Al-Fatihah.

**Checkpoint:** Pelajar baru bisa sampai membaca 1:1 sendiri, Cek Suara menandai per kata, dan Kartu Pamer bisa disimpan.

## Blok 4: Level Tajwid
- [ ] Pemutar Potongan Ayat dari `timing` (FR-16).
- [ ] Deteksi izhar dari Teks Utsmani, ditandai perlu cek ustadz.
- [ ] Unit nun mati dan tanwin dengan 6 jenis soal.
- [ ] Unit mim mati, qalqalah (sughra/kubra dari posisi, ditandai perlu cek), mad.
- [ ] Badge Level Tajwid.

**Checkpoint:** satu lesson ikhfa dari kenali bunyi sampai ucapkan potongan berjalan dengan audio qari yang terpotong tepat.

## Blok 5: Level Hafalan Juz Amma
- [ ] Alur tikrar per ayat lalu menyambung, dan tes hafalan (FR-17).
- [ ] Urutan: Al-Fatihah, lalu An-Nas mundur ke An-Naba'.
- [ ] Tanda "sudah hafal" di Peta Ayat.
- [ ] Badge Level Hafalan.

**Checkpoint:** Pelajar bisa menghafal An-Nas dari nol sampai lulus tes, dan badge "Tiga Qul" bisa didapat.

## Backlog
- Sebelum deploy portofolio: kredit sumber audio dan teks di dalam app, disclaimer prototype (`docs/PRD.md` §6), deploy ke Vercel.
- Sebelum produk publik: izin audio dari Quran Foundation dan everyayah.
- Identitas visual sendiri menggantikan gaya sementara (`docs/DESIGN.md`).
- Kartu Pamer dengan rekaman suara Pelajar.
- Tantang teman lewat link.
- Halaqah, kelompok belajar kolaboratif (butuh backend, butuh ADR baru yang menggantikan ADR-0001).
- Kosmetik maskot dan tema.
- Pesan khusus saat audio qari gagal dimuat.
- Test otomatis untuk `exercises.ts`, `store.ts`, dan `tajweed.ts`.
