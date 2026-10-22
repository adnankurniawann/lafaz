# Lafaz

Bahasa domain untuk belajar membaca Al-Qur'an dari nol lewat suara. Istilah di sini dipakai di docs, teks tampilan, dan commit.

## Orang

**Pelajar**:
Siapa saja yang memakai Lafaz untuk belajar. Target utamanya orang dewasa yang belum lancar membaca dan malu belajar Iqro bareng anak-anak, tapi app terbuka untuk semua orang, termasuk yang sekadar penasaran.
_Hindari_: user, pengguna (di teks tampilan), santri, murid

**Qari**:
Pembaca Al-Qur'an yang rekamannya dipakai sebagai contoh bacaan. Saat ini Mishary Alafasy.
_Hindari_: reciter, imam, syaikh

**Ustadz**:
Guru yang memeriksa konten dan merekam suara huruf lewat Studio. Bentuk perempuannya ustadzah.
_Hindari_: admin, reviewer, kurator

**Talaqqi**:
Belajar langsung dari guru dengan memperdengarkan bacaan. Lafaz mengajak Pelajar melakukannya, tapi tidak mewajibkannya (ADR-0009).
_Hindari_: setoran wajib, ujian guru

## Struktur Belajar

**Level**:
Tiga tahap besar Lafaz: **Level Iqro** (huruf sampai bisa membaca ayat), **Level Tajwid** (hukum bacaan lewat mendengar), **Level Hafalan** (juz amma). Setelah Iqro, Tajwid dan Hafalan sejajar. Naik Level lewat tes, turun bebas (ADR-0010).
_Hindari_: tingkat, tahap, course

**Bagian**:
Kelompok unit di dalam satu Level, contohnya Bagian Huruf Hijaiyah.
_Hindari_: section, modul, bab

**Unit**:
Kelompok lesson tentang satu set huruf atau satu hukum, dengan banner, panduan, peti, dan uji unit di akhir.
_Hindari_: pelajaran (terlalu umum), topik

**Tes Matrikulasi**:
Tes pendek dan bertahap untuk Pelajar yang belum tahu harus mulai dari mana. Hasilnya menaruh Pelajar di sebuah Bagian. Materi sebelumnya dihitung "dilewati" (ADR-0010).
_Hindari_: placement test, tes penempatan, pretest

**Lesson**:
Satu sesi 2 sampai 4 menit berisi 8 sampai 14 Soal.
_Hindari_: kuis, sesi, latihan (kecuali Latihan Ulang)

**Soal**:
Satu layar yang meminta satu jawaban. Ada Soal Objektif (dinilai app) dan Soal Nilai Sendiri (Pelajar menilai rekamannya sendiri).
_Hindari_: pertanyaan, exercise, challenge

**Uji Unit**:
Lesson terakhir di tiap unit yang mencampur semua jenis soal dari unit itu. Tandanya piala di path.
_Hindari_: ujian, final

**Tikrar**:
Cara menghafal di Level Hafalan: mendengar dan mengulang satu ayat berkali-kali, lalu menyambungnya dengan ayat sebelumnya.
_Hindari_: drill, repetisi

**Tes Hafalan**:
Lesson terakhir tiap unit Level Hafalan: seluruh surah dibaca dari hafalan. Ayat yang dibaca tanpa mengintip mendapat tanda "sudah hafal".
_Hindari_: ujian hafalan, setoran (setoran adalah ke guru, lihat talaqqi)

**Latihan Ulang**:
Lesson yang disusun dari huruf yang sudah dipelajari, tanpa membuka lesson baru. Nama lainnya muraja'ah.
_Hindari_: review, practice

## Huruf & Bacaan

**Huruf Hijaiyah**:
29 huruf Arab dari alif sampai ya, dikenalkan dengan fathah mengikuti urutan Iqro jilid 1.
_Hindari_: alfabet Arab, abjad

**Harakat**:
Tanda baca vokal: fathah, kasrah, dhammah. Sukun, tanwin, dan tasydid disebut terpisah.
_Hindari_: baris, vokal, syakal

**Huruf Mirip**:
Pasangan atau kelompok huruf yang mirip bentuk atau bunyinya, dipakai sebagai pengecoh. Daftarnya `SIMILAR_GROUPS` di `src/lib/course.ts`.
_Hindari_: huruf kembar, huruf sejenis

**Penguasaan Huruf**:
Seberapa sering Pelajar menjawab benar untuk satu huruf. Tampil sebagai bar di tab Huruf.
_Hindari_: skor huruf, level huruf

**Huruf Bandel**:
Huruf yang sering dijawab salah oleh Pelajar. Dikumpulkan jadi koleksi yang bisa ditaklukkan untuk mendapat badge (ADR-0004).
_Hindari_: huruf gagal, kesalahan, daftar salah

**Contoh Kata**:
Kata Al-Qur'an yang diawali satu huruf, dipilih otomatis oleh script, dipakai untuk mengenalkan huruf itu.
_Hindari_: kata contoh buatan, kosakata

**Teks Utsmani**:
Teks ayat dengan rasm Utsmani dari edisi `quran-uthmani`. Satu-satunya teks ayat yang tampil di app.
_Hindari_: teks Arab, tulisan Qur'an

**Potongan Ayat**:
Beberapa kata berurutan dari satu ayat, diputar dari audio ayat penuh memakai waktu tiap kata.
_Hindari_: klip, snippet, penggalan

**Hukum Tajwid**:
Aturan cara membaca, contohnya ikhfa atau qalqalah. Penandaannya diambil dari data beranotasi, tidak dikarang.
_Hindari_: aturan tajwid, rule

## Suara

**Rekaman Huruf**:
Rekaman ustadz untuk satu huruf dengan satu harakat, contohnya `ba-fathah`. Dari file di `public/audio/huruf/` atau dari Studio.
_Hindari_: TTS, suara huruf sintetis

**Studio**:
Halaman `/studio` untuk ustadz merekam dan mengekspor Rekaman Huruf.
_Hindari_: recorder, admin

**Nilai Sendiri**:
Pelajar merekam suaranya, memutar rekaman dan contohnya bergantian, lalu memilih "Sudah benar" atau "Ulangi".
_Hindari_: self-assessment, cek manual

**Cek Suara**:
Model AI Tarteel di browser yang mencocokkan bacaan Pelajar dengan teks per kata. Hasilnya bantuan, bukan vonis, dan tidak menilai makhraj.
_Hindari_: koreksi AI, penilaian otomatis, speech recognition

## Motivasi

**XP**:
Poin dari menyelesaikan lesson. 10 per lesson, +5 tanpa salah, +1 sampai +5 bonus combo.
_Hindari_: poin, skor

**Combo**:
Jumlah soal yang dijawab benar berturut-turut dalam satu lesson.
_Hindari_: streak (itu harian)

**Streak**:
Jumlah hari berturut-turut Pelajar menyelesaikan minimal satu lesson. Ada 1 Pembeku Streak gratis per minggu.
_Hindari_: runtutan, rentetan

**Target Harian**:
XP yang ingin dicapai per hari: Santai 10, Biasa 20, Serius 30, Intens 50.
_Hindari_: goal, kuota

**Misi Harian**:
3 tugas kecil per hari, contohnya "Rekam suaramu 3 kali".
_Hindari_: quest, tantangan (itu Mode Tantangan)

**Momen Bisa Baca**:
Layar setelah unit tertentu yang menampilkan kata atau ayat asli yang sekarang bisa dibaca Pelajar. Pelajar membacanya, lalu mendengar qari. Ini hadiah utama Lafaz.
_Hindari_: reward, unlock, level up

**Peta Ayat**:
Kumpulan ayat yang menyala satu per satu saat Pelajar mengenal hurufnya, membacanya, lalu menghafalnya. Menggantikan liga (ADR-0005).
_Hindari_: leaderboard, koleksi ayat, progres

**Kartu Pamer**:
Gambar siap dibagikan dari Momen Bisa Baca: ayatnya dan kalimat "Aku sekarang bisa baca ini".
_Hindari_: share card, sertifikat

**Mode Tantangan**:
Versi opsional sebuah unit yang sudah selesai: 3 nyawa, timer per soal, XP 2x, dan badge. Satu-satunya tempat ada nyawa (ADR-0004).
_Hindari_: hard mode, mode legendaris, ujian

**Badge**:
Tanda pencapaian. Tiap Level punya 5 badge, ditambah badge lintas level.
_Hindari_: medali, trofi, achievement

**Rank**:
Gelar pribadi dari total XP. Tidak pernah turun dan tidak dibandingkan dengan Pelajar lain (ADR-0010).
_Hindari_: peringkat, liga, tier

**Peti**:
Hadiah di tengah path unit. Isinya XP bonus yang ikut dihitung ke Target Harian.
_Hindari_: chest, kotak hadiah

## Dihapus

**Hati** dan **Gems**: pernah ada di Fase 1. Hati dihapus oleh ADR-0004, gems dan toko oleh ADR-0006. Jangan dipakai di teks baru.
