# Lafaz

**Belajar baca Al-Qur'an dari nol, tanpa malu.**

App belajar membaca Al-Qur'an lewat suara, satu soal per layar. Mulai dari mengenal huruf hijaiyah gaya Iqro sampai bisa membaca ayat sendiri, lalu tajwid lewat mendengar bacaan qari, lalu hafalan juz amma. Salah tidak dihukum, dan hadiah utamanya adalah ayat yang sekarang bisa kamu baca.

Lafaz itu teman latihan. Kalau mau makin mantap, perdengarkan bacaanmu ke guru atau teman yang lancar.

Status: prototype. Level Iqro (huruf hijaiyah sampai membaca Al-Fatihah) dan Level Tajwid (nun mati dan tanwin, mim mati, qalqalah, mad) sudah bisa dicoba. Data: Al-Fatihah dan juz 30.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Pelajar baru masuk ke onboarding, lalu langsung ke lesson pertama. Progres disimpan di browser. Untuk mengulang dari awal, pakai "Hapus semua progres" di tab Profil.

## Dokumen

- Aturan untuk agen: `AGENTS.md`
- Istilah domain: `GLOSSARY.md`
- Ruang lingkup dan pembeda: `docs/PRD.md` · Arsitektur: `docs/ARCHITECTURE.md` · Data, lisensi, dan konten yang perlu dicek ustadz: `docs/DATA.md` · Desain: `docs/DESIGN.md` · Alur pengguna: `docs/USERFLOW.md`
- Tugas: `docs/TODO.md`
- Keputusan: `docs/adr/`

Audio bacaan: Mishary Alafasy via everyayah.com dan Quran.com. Teks: alquran.cloud. Font: Amiri Quran (OFL). Lihat `docs/DATA.md` §1.1 untuk lisensi.
