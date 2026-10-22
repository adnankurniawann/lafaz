# Project Requirements Document (PRD)

## 1. Gambaran Proyek

### 1.1 Tujuan
Lafaz membawa siapa saja dari nol sampai **bisa membaca ayat Al-Qur'an sendiri**, lalu memahami tajwid lewat mendengar, lalu menghafal juz amma. Cara belajarnya seru dan bertahap seperti app bahasa, satu soal per layar, dengan suara qari asli.

### 1.2 Latar Belakang
Banyak orang dewasa belum lancar membaca Al-Qur'an dan malu belajar Iqro di TPA bersama anak-anak. App yang ada kebanyakan berbentuk buku digital atau terasa kaku. Mekanik Duolingo terbukti membuat orang kembali belajar setiap hari, tapi sebagian mekaniknya (hukuman salah, liga, mata uang) tidak cocok untuk belajar Al-Qur'an dan untuk Pelajar yang sudah malu duluan.

Proyek pribadi. Tujuan pertama portofolio, arahnya ke produk sungguhan. Biaya Rp0.

### 1.3 Ruang Lingkup

**Termasuk**
- **Level Iqro**: Huruf Hijaiyah (selesai), lalu harakat lengkap, tanwin, sukun, tasydid, mad dasar, dan huruf sambung, sampai Pelajar bisa membaca Al-Fatihah.
- **Level Tajwid**: nun mati dan tanwin, mim mati, qalqalah, mad, diajarkan lewat Potongan Ayat.
- **Level Hafalan**: Al-Fatihah, lalu juz amma dari An-Nas mundur ke An-Naba', dengan pola tikrar.
- Cek Suara di browser, Momen Bisa Baca, Peta Ayat, Kartu Pamer, Mode Tantangan, Huruf Bandel, badge.
- Data: Al-Fatihah dan juz 30 (38 surah, 602 ayat).

**Tidak termasuk (untuk sekarang)**
- Login, backend, sinkron antar perangkat (ADR-0001).
- Liga, toko, gems, hati (ADR-0004, 0005, 0006).
- Pembayaran, notifikasi push.
- Penilaian makhraj otomatis untuk huruf tunggal.
- Identitas visual sendiri. Tampilan gaya sekarang dipakai dulu (`docs/DESIGN.md`).
- Surah di luar Al-Fatihah dan juz 30.
- Bahasa antarmuka selain Indonesia.

## 2. Pemangku Kepentingan
- **Pemilik**: membangun proyek, memutuskan ruang lingkup.
- **Pelajar**: utamanya dewasa yang belum lancar dan malu, tapi terbuka untuk semua orang termasuk non-Muslim yang penasaran. Kebanyakan dari HP.
- **Ustadz**: memeriksa konten dan merekam Rekaman Huruf lewat Studio. Belum ada orangnya.

## 3. Pembeda dari Duolingo

Yang ditiru dari Duolingo hanya ritmenya: path, satu soal per layar, panel benar/salah, combo, streak, target harian, misi. Logo, maskot burung hantu, nama, font, dan efek suara Duolingo tidak dipakai. Pembedanya:

| Duolingo | Lafaz | Dasar |
|---|---|---|
| XP dan liga tanpa ujung | **Momen Bisa Baca**: ayat asli yang sekarang bisa kamu baca sendiri, terkumpul di Peta Ayat | ADR-0005, 0007 |
| Salah mengurangi hati, hati habis dikunci | **Salah tidak dihukum**. Huruf Bandel jadi koleksi yang bisa ditaklukkan. Ketegangan ada di Mode Tantangan yang opsional | ADR-0004 |
| Liga mingguan, peringkat | **Kartu Pamer**: yang dipamerkan kemampuan, bukan peringkat | ADR-0005 |
| Gems dan toko | Tidak ada mata uang. Hadiahnya ayat, badge, XP | ADR-0006 |
| Soal bicara dinilai mesin | **Cek Suara per kata** dengan model khusus Qur'an, jalan di HP, suara tidak dikirim ke mana pun | ADR-0008 |
| TTS untuk contoh suara | **Hanya qari dan ustadz**, tanpa suara sintetis | ADR-0002 |
| Netral agama | Inklusif tapi beradab: teks ayat tidak pernah diketik manual, talaqqi diajak dengan ramah | ADR-0003, 0009 |

## 4. Kebutuhan Fungsional

Status: ✅ ada, 🔧 ada tapi perlu diubah, ⏳ belum ada.

### FR-1 — Path Belajar ✅
- Level → Bagian → Unit → Lesson. Path zig-zag, node aktif memantul dengan label "MULAI", node terkunci abu-abu.
- Banner unit berwarna dengan tombol Panduan. Peti di tengah unit, piala (Uji Unit) di akhir.
- Lesson berikutnya terbuka setelah lesson sebelumnya selesai.

### FR-2 — Onboarding ✅
- Sambutan, tujuan, kemampuan awal, Target Harian, pengingat talaqqi, lalu langsung lesson pertama. ✅
- Teks diganti ke nada inklusif dan talaqqi sebagai ajakan (ADR-0009). ✅

### FR-3 — Mesin Lesson ✅
- Tombol keluar dengan konfirmasi, progress bar, satu soal per layar, tombol PERIKSA lalu LANJUT. ✅
- Panel umpan balik hijau atau merah dengan jawaban yang benar, efek suara Web Audio, getar halus, combo. ✅
- Soal salah diulang di akhir lesson. ✅
- Hati dihapus (ADR-0004). ✅

### FR-4 — Jenis Soal Bagian Huruf Hijaiyah ✅
Kenalan huruf, dengar dan pilih huruf, huruf awal dari kata, pilih bunyi, pilih nama, pasangkan, baca rangkaian gaya Iqro, ucapkan (Nilai Sendiri). 9 unit, 44 lesson, 9 peti. Unit 9 membedakan Huruf Mirip.

### FR-5 — Setelah Lesson ✅
Berurutan: hasil (XP, akurasi, waktu), streak, Target Harian, Misi Harian, peti kalau ada.

### FR-6 — Motivasi Harian ✅
- XP: 10 per lesson, +5 tanpa salah, +1 sampai +5 bonus combo. ✅
- Streak harian dengan 1 Pembeku Streak gratis per minggu. Tetap harian, tidak diganti target mingguan. ✅ Perayaan hari ke-7, 30, 100. ✅
- Target Harian: Santai 10, Biasa 20, Serius 30, Intens 50. ✅
- 3 Misi Harian. ✅ Hadiahnya XP bonus, begitu juga Peti (§8). ✅
- Gems dan isi ulang hati dihapus (ADR-0006). ✅

### FR-7 — Tab Huruf ✅
Grid 29 huruf dengan bar Penguasaan Huruf, kartu penjelasan (makhraj dan Contoh Kata), ketuk untuk mendengar, dan latihan huruf. Transliterasi latin tetap seperti sekarang.

### FR-8 — Studio ✅
`/studio`: ustadz merekam tiap huruf dengan fathah, kasrah, dan dhammah, lalu mengekspor zip untuk `public/audio/huruf/`.

### FR-9 — Huruf Bandel ✅
- Huruf yang sering salah masuk koleksi Huruf Bandel. Pelajar bisa berlatih khusus huruf itu.
- Huruf keluar dari koleksi setelah dijawab benar beberapa kali berturut-turut. Koleksi kosong memberi badge.

### FR-10 — Badge ✅
Sudah ada: semua badge di tabel ini.


| Level Iqro | Level Tajwid | Level Hafalan |
|---|---|---|
| Kenal semua huruf (29 huruf dikuasai) | Ahli nun mati & tanwin | Hafal Al-Fatihah |
| Penakluk huruf bandel | Ahli mim mati | Tiga Qul (Al-Ikhlas, Al-Falaq, An-Nas) |
| Lancar harakat (harakat, sukun, tasydid selesai) | Ahli qalqalah | 10 surah |
| Ayat pertama (Momen Bisa Baca pertama) | Ahli mad | 20 surah |
| Bisa baca Al-Fatihah (7 ayat dibaca sendiri) | Telinga tajwid (50 kali benar menebak hukum dari suara) | Juz amma lengkap (37 surah) |

Lintas level: **Juara tantangan** (Mode Tantangan pertama) dan **Streak 7 hari**.

### FR-11 — Mode Tantangan ✅
- Terbuka setelah sebuah unit selesai. 3 nyawa, 15 detik per soal, XP 2x, badge "Tantangan unit X" (tampil di badge Juara tantangan).
- Satu-satunya tempat ada nyawa (ADR-0004). Menggantikan "mode legendaris".

### FR-12 — Momen Bisa Baca & Peta Ayat ✅
- Sejak unit 1: ayat asli tampil, huruf yang sudah dikenal menyala, "kamu sudah kenal X dari Y huruf di ayat ini" (ADR-0007). ✅
- Setelah Iqro lanjutan: Pelajar membaca kata atau ayat asli, Cek Suara menandai per kata, lalu qari membacakannya.
- Peta Ayat di tab bekas Liga: tiap ayat punya tiga tanda (hurufnya dikenal, bisa dibaca, sudah hafal). Ketiga tanda ✅.

### FR-13 — Kartu Pamer ✅
Dari Momen Bisa Baca: gambar berisi ayat, nama surah dan nomor ayat, dan "Aku sekarang bisa baca ini". Dibagikan lewat Web Share atau disimpan. Hanya gambar dulu.

### FR-14 — Cek Suara ✅
Model Tarteel ONNX di browser, diunduh otomatis di latar belakang setelah onboarding (ADR-0008). Bacaan dibandingkan per kata, hijau atau merah. Tidak pernah mengurangi apa pun. Huruf tunggal tetap Nilai Sendiri.

### FR-15 — Iqro Lanjutan ✅
Harakat kasrah dan dhammah, tanwin, sukun, tasydid, mad dasar, bentuk huruf sambung. Latihan Ulang terjadwal gaya Leitner. Berakhir dengan Pelajar membaca Al-Fatihah.

### FR-16 — Tajwid Lewat Dengar ✅
- Pemutar Potongan Ayat dari audio ayat penuh memakai waktu tiap kata. Audio per kata tidak dipakai di sini karena hukum antar kata (ikhfa, idgham, iqlab) tidak terdengar.
- Urutan unit: nun mati dan tanwin (izhar, idgham bighunnah, idgham bilaghunnah, iqlab, ikhfa), mim mati, qalqalah, mad.
- Pola lesson per hukum: kenali bunyinya, dengar dan bandingkan, tebak dari Potongan Ayat, tebak dari suara (teks muncul setelah menjawab), cari di ayat, ucapkan potongan.
- Izhar dideteksi otomatis dari Teks Utsmani dan ditandai perlu cek ustadz. Qalqalah sughra dan kubra dibedakan dari posisinya, juga ditandai perlu cek.
- Mim mati, qalqalah, dan mad masing-masing satu unit, karena contohnya di juz 30 sedikit.

### FR-18 — Level, Tes Matrikulasi & Rank ✅
Sudah ada semua: Tes Matrikulasi di Iqro, Rank, pertanyaan "Mau mulai dari mana?", pemilih Level, tes naik Level ke Tajwid dan Hafalan.
- Onboarding: "Mau mulai dari mana?" (Iqro, Tajwid, Hafalan, atau tes dulu). Pilihan dipercaya tanpa tes (ADR-0010).
- Tes Matrikulasi ≤15 soal, bertahap, menaruh Pelajar di Bagian. Materi sebelumnya dihitung dilewati: membuka lesson dan Peta Ayat, tanpa XP dan badge.
- Setelah Iqro, Tajwid dan Hafalan sejajar. Naik memakai ujian akhir Level di bawahnya. Gagal tes hanya memberi saran, ada "tetap masuk". Turun bebas, progres per Level disimpan.
- Pemilih Level di bar atas tab Belajar, muncul setelah ada lebih dari satu Level.
- Rank: gelar pribadi dari total XP, tidak pernah turun.

### FR-17 — Hafalan Juz Amma ✅
Al-Fatihah dulu, lalu juz amma dari surah terpendek: An-Nas, Al-Falaq, Al-Ikhlas, dan seterusnya mundur ke An-Naba'. Pola tikrar (mengulang per ayat lalu menyambung), tes hafalan, dan tanda "sudah hafal" di Peta Ayat.
- Satu unit per surah. Ayat dikelompokkan per 3; tiap kelompok satu lesson.
- Tikrar per ayat: dengar qari 3 kali bersama teks dan arti, isi kata yang hilang, baca dari hafalan, lalu sambung dengan ayat sebelumnya.
- Tes hafalan: semua ayat dibaca dari hafalan per kelompok. Cek Suara membantu, Pelajar tetap menilai sendiri. Ayat yang diintip belum ditandai hafal.

## 5. Tujuan
1. Pelajar baru sampai soal pertama dalam 60 detik sejak membuka app.
2. Dalam 2 menit demo, orang melihat minimal satu pembeda dari §3 bekerja.
3. Tidak ada teks ayat yang diketik manual, dan setiap penandaan tajwid bisa ditelusuri ke data sumber atau ditandai perlu cek ustadz.
4. Tidak ada data Pelajar (progres, rekaman) yang keluar dari perangkat.
5. Biaya operasional Rp0.

## 6. Syarat Rilis Portofolio
1. Kredit sumber audio dan teks tampil di dalam app, bukan hanya di README.
2. Disclaimer: prototype, konten belum diverifikasi ustadz.
3. `npm run lint` dan `npm run build` bersih.
4. Bisa dipakai penuh di HP 375×812, di HTTPS (perekaman suara butuh HTTPS).

Sebelum jadi produk publik: minta izin pemakaian audio ke Quran Foundation dan everyayah (`docs/DATA.md` §1.1), dan konten sudah dicek ustadz.

## 7. Kebutuhan Non-Fungsional
- Mobile first. Di layar lebar tampil seperti app HP, lebar maksimal sekitar 430 px.
- Tanpa server dan database (ADR-0001).
- Teks Arab memakai font dengan dukungan rasm Utsmani, RTL dan harakat tidak terpotong.
- Bahasa antarmuka dan docs Indonesia, kode Inggris.

## 8. Pertanyaan Terbuka

Sudah diputuskan (20 Okt 2026):
- Penentuan Level, Tes Matrikulasi, naik Level lewat tes, dan Rank pribadi dari XP: ADR-0010.
- Model Cek Suara dikonversi sendiri (repo Tarteel tidak punya ONNX) dan disimpan di repo Hugging Face milik pemilik, ±102 MB.
- Peti dan Misi Harian memberi XP bonus, ikut dihitung ke Target Harian.
- Mode Tantangan: 15 detik per soal. Nyawa habis berarti tantangan gagal, tanpa XP dan tanpa badge, dengan tombol "Coba lagi".

Masih terbuka:
- **Momen Bisa Baca pertama yang nyata**: kata atau ayat mana yang pertama bisa dibaca setelah harakat dan sukun? Dipilih oleh script dari data, lalu dicek ustadz.
- **Ustadz pemeriksa**: siapa yang memeriksa konten dan merekam Rekaman Huruf.
