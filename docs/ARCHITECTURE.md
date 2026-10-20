# Lafaz Architecture

## 1. Gambaran

```
① SCRIPT (manual, sekali)            ② REPO                        ③ HOSTING        ④ BROWSER PELAJAR
─────────────────────────            ──────                        ─────────        ─────────────────
• fetch-quran: alquran.cloud    ──►  data/quran/*.json        ──►  Vercel      ──►  Next.js app
  + quran.com → teks, tajwid,        data/content/*.json            (rencana)        • progres: localStorage
  kata, waktu per kata               public/audio/huruf/                             • rekaman: IndexedDB
• build-letter-examples                                                              • audio qari: langsung
  → Contoh Kata per huruf                                                              dari CDN sumber
```

Tidak ada server dan database (ADR-0001). Data Qur'an diambil sekali oleh script dan di-commit. Saat app dipakai, satu-satunya permintaan jaringan adalah audio qari dari CDN sumber dan, nanti, model Cek Suara.

## 2. Stack

- Next.js 16 (App Router, `cacheComponents`), React 19, TypeScript strict, Tailwind CSS 4.
- zustand 5 dengan `persist` untuk state game.
- jszip untuk ekspor Rekaman Huruf dari Studio.
- tsx untuk menjalankan script.
- transformers.js untuk Cek Suara (ADR-0008). Tanya pemilik sebelum menambah dependensi lain.

## 3. Susunan Folder

```
lafaz/
├── data/
│   ├── quran/              # 38 file surah + index.json + text-notes.txt (hasil script)
│   └── content/
│       ├── hijaiyah.json        # nama, transliterasi, makhraj tiap huruf
│       ├── letter-examples.json # Contoh Kata per huruf (hasil script)
│       └── tajweed-rules.json   # kode tajwid → nama hukum
├── public/audio/huruf/     # Rekaman Huruf + manifest.json (masih kosong)
├── scripts/
│   ├── fetch-quran.ts
│   └── build-letter-examples.ts
└── src/
    ├── app/
    │   ├── (tabs)/         # Belajar (/), Huruf, Peta Ayat (/peta), Misi, Profil
    │   ├── onboarding/
    │   ├── lesson/[id]/
    │   ├── studio/
    │   └── debug/tajwid/   # cek hasil parser tajwid per surah
    ├── components/
    │   ├── lesson/         # LessonPlayer, Exercises (tiap jenis soal), LessonEnd
    │   ├── path/           # LearnPath, unitColors
    │   ├── screens/        # Onboarding, Letters, Profile, Quests, Studio
    │   └── *.tsx           # AppGate, TopBar, BottomNav, AudioButton, LetterSound, TajweedText, Mascot, Sheet
    └── lib/
        ├── course.ts       # Bagian, unit, node path, aturan buka-kunci, Huruf Mirip
        ├── exercises.ts    # tipe tiap jenis soal + penyusun soal per jenis lesson
        ├── store.ts        # state game, persist ke localStorage
        ├── quests.ts       # Misi Harian
        ├── trouble.ts      # Huruf Bandel: masuk saat salah, keluar setelah benar beruntun
        ├── badges.ts       # daftar badge
        ├── ayah-letters.ts # huruf di tiap ayat, untuk Peta Ayat dan sorot huruf
        ├── syllables.ts    # token suku kata Bagian Membaca: tulisan Arab dan bacaan latin dari huruf + tanda
        ├── review.ts       # Latihan Ulang terjadwal (Leitner, kotak 1-16 hari)
        ├── rank.ts         # Rank dari total XP
        ├── speech.ts, speech-worker.ts  # Cek Suara: transformers.js di Web Worker
        ├── speech-match.ts # cocokkan transkrip dengan kata Utsmani per kata
        ├── letters.ts      # materi huruf dari JSON
        ├── quran.ts        # baca data surah
        ├── tajweed.ts      # parser markup + projectTajweed
        ├── recordings.ts   # Rekaman Huruf (file + IndexedDB)
        ├── audio.ts        # satu pemutar untuk semua bacaan
        ├── sfx.ts          # efek suara Web Audio
        ├── use-recorder.ts # rekam mikrofon dengan MediaRecorder
        ├── dates.ts, random.ts
```

## 4. Alur Lesson

1. `course.ts` mendefinisikan path. Tiap unit huruf punya node: Kenalan, Dengar dan pilih, peti, Pasangkan dan baca, Ucapkan, Uji unit. Unit 9 punya Bentuk mirip, Bunyi mirip, peti, Ucapkan, Uji akhir huruf.
2. `exercises.ts` menyusun soal dari `lessonKind` dan huruf lesson. Jenis soal: `intro`, `listen-pick`, `word-initial`, `sound-pick`, `name-pick`, `match`, `sequence`, `speak`. Yang dinilai app (`GRADED`): `listen-pick`, `word-initial`, `sound-pick`, `name-pick`, `sequence`.
3. `LessonPlayer` memutar soal satu per satu, mengulang soal salah di akhir, lalu memanggil `store.completeLesson` dengan `LessonResult`.
4. `LessonEnd` menampilkan rangkaian layar akhir dari `LessonSummary`: hasil, sorot huruf di ayat (hanya Uji unit pertama kali), badge baru, streak, Target Harian, Misi Harian.
5. Id lesson khusus: `latihan` (Latihan Ulang), `taklukkan` (khusus Huruf Bandel), `tantangan-u1` dst. (Mode Tantangan, memakai soal Uji unit dengan 3 nyawa dan timer).

## 5. State & Penyimpanan

| Data | Di mana | Catatan |
|---|---|---|
| Progres (onboarding, XP per hari, streak, Penguasaan Huruf, Huruf Bandel, badge, tantangan, lesson selesai, misi) | localStorage, zustand `persist` | Versi 2: hati dan gems dihapus lewat `migrate` (ADR-0004, 0006) |
| Rekaman Huruf dari Studio | IndexedDB | Tidak pernah dikirim ke mana pun |
| Rekaman Pelajar di soal ucapkan | Memori saja, hilang setelah lesson | `src/lib/use-recorder.ts` |
| Model Cek Suara | Cache browser | ±102 MB (encoder 23 + decoder 79), diunduh di latar belakang setelah onboarding, jalan di Web Worker |
| Data Qur'an | `data/quran/` di repo, di-bundle saat build | |

Halaman di `(tabs)` memakai `export const instant = false` supaya dirender di klien setelah progres tersimpan terbaca.

## 6. Audio

- `audio.ts` memegang satu elemen audio untuk semua bacaan (huruf, kata, ayat, rekaman Pelajar), jadi dua bacaan tidak pernah bertumpuk.
- Efek suara memanggil `stopAudio()` dulu, sesuai aturan adab (`AGENTS.md` §2).
- Rencana Potongan Ayat: putar audio ayat dari `verses.quran.com`, lompat ke `timing` kata pertama, berhenti di akhir kata terakhir.

## 7. Deploy

Belum dideploy. Rencananya Vercel: push repo ke GitHub, import di vercel.com. HTTPS wajib untuk perekaman suara. Sebelum deploy portofolio, lihat syarat di `docs/PRD.md` §6.

## 8. Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server lokal di http://localhost:3000 |
| `npm run build` | Build produksi |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Cek tipe |
| `npm run check` | Cek kecil logika bercabang (`scripts/check.ts`) |
| `npm run fetch-quran` | Unduh ulang data Qur'an ke `data/quran/` |
| `npm run build-letter-examples` | Pilih ulang Contoh Kata dari `data/quran/` |
| `npm run build-reading-data` | Pilih kata qari per suku kata, kata dan ayat Momen Bisa Baca per unit, dan kata bertanda khusus (`data/content/reading.json`) |
| `uv run scripts/convert-speech-model.py` | Ubah model Tarteel ke ONNX untuk Cek Suara, hasil di `public/models/` (tidak di-commit) |
