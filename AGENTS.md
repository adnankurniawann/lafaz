# Lafaz - Aturan Inti Proyek

**Kamu sedang mengerjakan Lafaz: app belajar membaca Al-Qur'an dari nol, lewat suara, satu soal per layar.**
Pelajar mengenal huruf gaya Iqro sampai bisa membaca ayat sendiri, lalu belajar tajwid lewat mendengar, lalu menghafal juz amma. Seru dan inklusif, bukan kaku.
**Ikuti aturan ini di seluruh proyek.**

## Dokumen Konteks
Baca sebelum mengambil keputusan desain atau memulai tugas:
- **`GLOSSARY.md`**: bahasa domain. Pakai istilahnya di docs, teks tampilan, dan commit.
- **`docs/PRD.md`**: sumber kebenaran untuk ruang lingkup, kebutuhan, dan pembeda dari Duolingo.
- **`docs/ARCHITECTURE.md`**: susunan folder, alur lesson, state, audio, deploy.
- **`docs/DATA.md`**: sumber data, lisensi, anotasi tajwid, konten yang perlu dicek ustadz.
- **`docs/DESIGN.md`**: aturan tampilan. Gaya sekarang sementara.
- **`docs/USERFLOW.md`**: apa yang dilakukan Pelajar dan ustadz.
- **`docs/TODO.md`**: daftar tugas. Kerjakan hanya tugas di blok ACTIVE.
- **`docs/adr/`**: keputusan yang disengaja. Jangan dibalik tanpa ADR baru yang menggantikannya.

## 1. Stack
- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4. Baca blok Next.js di bawah sebelum menulis kode.
- State game di localStorage lewat zustand `persist`. Rekaman di IndexedDB.
- **Tanpa server, tanpa database, tanpa login** (ADR-0001). Kalau fitur butuh menyimpan data di luar perangkat Pelajar, berhenti dan tanya pemilik.
- Mobile first: lebar maksimal sekitar 430 px. Bahasa antarmuka Indonesia.
- **Dependensi**: tanya pemilik sebelum menambah selain `next`, `react`, `zustand`, `jszip`, `tailwindcss`, `tsx`, dan `@huggingface/transformers` untuk Cek Suara (ADR-0008).

## 2. Adab Konten Qur'an
Paling penting dan tidak boleh dilanggar.
1. Jangan pernah mengetik teks ayat atau kata Qur'an secara manual atau dari ingatan. Semuanya dari script (ADR-0003).
2. Jangan mengarang contoh hukum tajwid. Hasil deteksi otomatis dan contoh tambahan ditandai `"review": "perlu cek ustadz"`.
3. Tidak ada suara sintetis (TTS). Hanya rekaman qari dari sumber resmi atau rekaman ustadz (ADR-0002).
4. Materi (nama huruf, transliterasi, makhraj, penjelasan hukum) ada di JSON terpisah dari kode dan ditandai perlu cek ustadz sampai diperiksa.
5. Efek suara tidak boleh bertumpuk dengan audio Qur'an. Animasi, maskot, dan panel tidak boleh menutupi teks ayat.
6. Teks Arab memakai font dengan dukungan rasm Utsmani. RTL dan harakat tidak boleh terpotong. Tampilkan Teks Utsmani, bukan teks edisi tajwid.
7. Ajakan talaqqi ada di onboarding dan Profil, dengan nada ajakan (ADR-0009).

## 3. Nada & Motivasi
- Inklusif: jangan mengasumsikan Pelajar Muslim, sudah shalat, atau pernah mengaji (ADR-0009).
- Kesalahan tidak dihukum di lesson biasa. Nyawa hanya ada di Mode Tantangan (ADR-0004).
- Tidak ada liga, peringkat, gems, atau toko (ADR-0005, 0006). Hadiah utama adalah Momen Bisa Baca.
- Hasil Cek Suara selalu ditulis sebagai bantuan, bukan vonis.

## 4. Alur Kerja & Ruang Lingkup
- **Ikuti TODO.md**: kerjakan hanya blok ACTIVE. Jangan membangun fitur dari blok lain lebih awal.
- **Satu blok, lalu berhenti dan laporkan.** Setiap blok berakhir dengan checkpoint yang bisa dibuka.
- **Cara paling sederhana yang jalan**: tanpa abstraksi spekulatif.
- **Tampilan**: jangan redesign. Gaya sekarang dipakai sampai pemilik membuka tugas identitas visual (`docs/DESIGN.md`).
- **Commit**: kecil dan rapi, pesan singkat dalam bahasa Inggris. **Jangan tambahkan baris Co-Authored-By, link sesi, atau atribusi AI apa pun** di commit maupun PR.

## 5. Penamaan di Kode
Kode, nama file, dan variabel memakai bahasa Inggris. Teks tampilan dan docs memakai Bahasa Indonesia. Nama dibuat biasa dan jelas. Padanan istilah:

| Glossary | Kode |
|---|---|
| Pelajar | `learner` |
| Level | `level` (belum ada) |
| Bagian | `Section` |
| Unit | `Unit` |
| Lesson | `LessonNode`, `lessonKind` |
| Soal | `Exercise` |
| Penguasaan Huruf | `mastery` |
| Huruf Mirip | `SIMILAR_GROUPS` |
| Huruf Bandel | `troubleLetters` (belum ada) |
| Contoh Kata | `letterExamples`, `WordExample` |
| Rekaman Huruf | `recordings` |
| Potongan Ayat | `clip` (belum ada) |
| Cek Suara | `speechCheck` (belum ada) |
| Peta Ayat | `ayahMap` (belum ada) |
| Momen Bisa Baca | `readMoment` (belum ada) |
| Kartu Pamer | `shareCard` (belum ada) |
| Mode Tantangan | `challenge` (belum ada) |
| Misi Harian | `quests` |
| Peti | `ChestNode` |

## 6. Memverifikasi Pekerjaan
- Jalankan `npm run lint` dan `npx tsc --noEmit`. Error memblokir tugas.
- Jalankan `npm run build` sebelum menandai blok selesai.
- Cek di `npm run dev` pada ukuran 375×812 dan desktop.
- Logika dengan cabang (penyusun soal, streak, Huruf Bandel, pencocokan Cek Suara) punya satu cek kecil yang bisa dijalankan langsung.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
