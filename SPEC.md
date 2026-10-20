# Lafaz, spesifikasi prototype (versi 2)

Lafaz adalah app belajar membaca Al-Qur'an yang meniru Duolingo semirip mungkin: alur belajarnya, ritme satu soal per layar, dan gamifikasinya. Mulainya seperti Iqro, dari mengenal tiap huruf hijaiyah lewat suara. Setelah itu tajwid diajarkan lewat mendengar. Pengguna mendengar bunyi suatu hukum di potongan ayat, lalu berlatih menebak hukumnya dari suara atau dari potongan ayat.

Versi ini menggantikan spec pertama. Hasil fase 1 lama (data Qur'an, parser tajwid, halaman debug) tetap dipakai.

Kerjakan per fase. Selesaikan satu fase, jalankan, lalu berhenti dan laporkan sebelum lanjut.

## Yang ditiru dari Duolingo

Yang ditiru mekaniknya dan rasa pakainya. Logo, maskot burung hantu, nama, font, dan efek suara Duolingo tidak dipakai. Lafaz punya maskot dan suara sendiri.

**Path belajar**
- Konten dibagi jadi Bagian, lalu Unit, lalu lesson. Satu lesson memakan 2 sampai 4 menit.
- Path berbentuk zig-zag. Node yang aktif memantul dan diberi label "MULAI". Node yang terkunci berwarna abu-abu.
- Ada peti hadiah di tengah unit dan piala di akhir unit.
- Tiap unit punya banner berwarna dan tombol "Panduan" berisi kartu materi.
- Lesson berikutnya baru terbuka setelah lesson sebelumnya selesai.

**Layar lesson**
- Di atas: tombol keluar (dengan konfirmasi), progress bar, dan jumlah hati.
- Satu soal per layar. Di bawah ada tombol "PERIKSA" yang berubah jadi "LANJUT".
- Setelah menjawab, panel umpan balik naik dari bawah. Hijau kalau benar, merah kalau salah, lengkap dengan jawaban yang benar.
- Ada efek suara benar/salah dan getar halus di HP.
- Ada combo: "5 benar berturut-turut!", dengan bonus XP.
- Soal yang salah diulang di akhir lesson.

**Setelah lesson selesai**, layar-layar ini muncul berurutan:
1. Lesson selesai: XP, akurasi, dan waktu.
2. Streak bertambah, dengan api menyala.
3. Progres target harian.
4. Progres misi harian.
5. Peti hadiah, kalau ada.

**Gamifikasi**

| Fitur | Aturan |
| --- | --- |
| XP | 10 per lesson. +5 kalau tanpa salah. +1 sampai +5 bonus combo. |
| Hati (versi lunak) | Maksimal 5. Salah di soal objektif mengurangi 1. Isi ulang otomatis 1 hati tiap 4 jam. Latihan ulang (muraja'ah) memberi +1 hati. Kalau hati habis, lesson baru tidak bisa dimulai, tapi latihan ulang tetap bisa. Soal yang dinilai sendiri atau oleh AI tidak mengurangi hati. |
| Streak | Bertambah kalau minimal 1 lesson selesai per hari. Ada 1 pembeku streak gratis per minggu. Ada perayaan di hari ke-7, 30, 100, dan seterusnya. |
| Target harian | Dipilih saat onboarding: Santai 10 XP, Biasa 20, Serius 30, Intens 50. |
| Gems | Didapat dari peti, misi, dan liga. Dipakai di toko. |
| Misi harian | 3 misi per hari, contohnya "Dapatkan 20 XP", "Jawab 5 benar berturut-turut", "Rekam suaramu 3 kali". Hadiahnya peti berisi gems. |
| Peti | Ada di path. Isinya gems. |
| Liga mingguan | 10 tingkat, dari Perunggu sampai Berlian. 30 peserta per grup. 7 teratas naik, 5 terbawah turun. Karena belum ada backend, lawannya bot yang diberi label "bot" dengan jelas. |
| Toko | Pembeku streak, isi penuh hati, dan XP boost 2x selama 15 menit. |
| Pencapaian | Badge bertingkat (misalnya "Kenal semua huruf", "Ahli ikhfa", "Streak 30 hari") dan rekor pribadi. |
| Maskot | Karakter Lafaz sendiri. Muncul di onboarding, di layar hasil, dan saat memberi semangat. |

**Halaman utama** memakai tab bawah: Belajar, Huruf, Liga, Misi, Profil. Bar atasnya menampilkan streak, gems, dan hati.

## Adab dan aturan konten Qur'an

Ini paling penting dan tidak boleh dilanggar.

1. Jangan pernah mengetik teks ayat secara manual atau dari ingatan. Semua teks ayat dan kata Qur'an diambil lewat script dari sumber resmi, lalu disimpan sebagai JSON.
2. Jangan mengarang contoh hukum tajwid. Penandaan hukum diambil dari data beranotasi. Hasil deteksi otomatis (misalnya izhar) dan contoh tambahan ditandai `"review": "perlu cek ustadz"`.
3. Suara huruf dan bacaan **tidak boleh** memakai suara sintetis (TTS). Hanya boleh memakai rekaman qari dari sumber resmi atau rekaman ustadz.
4. Materi (nama huruf, transliterasi, makhraj, penjelasan hukum) ditulis di file JSON terpisah dari kode dan ditandai perlu cek ustadz sampai diperiksa.
5. Efek suara gamifikasi tidak boleh diputar bertumpuk dengan audio Qur'an. Animasi dan maskot tidak boleh menutupi teks ayat.
6. Teks Arab memakai font dengan dukungan rasm Utsmani. Arah RTL dan harakat tidak boleh terpotong.
7. Di onboarding dan di halaman profil ada pengingat bahwa app ini pendamping, dan bacaan tetap disetorkan ke guru (talaqqi).

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS.
- Mobile first: di layar lebar tampil seperti app HP, lebar maksimal sekitar 430px, di tengah.
- State dan progres disimpan di localStorage lewat zustand persist. Rekaman audio disimpan di IndexedDB.
- Belum ada backend dan login.
- Bahasa antarmuka Indonesia.

## Sumber data

Semua sumber di bawah sudah dicek bisa diakses.

| Data | Sumber |
| --- | --- |
| Teks Utsmani | `api.alquran.cloud/v1/surah/{n}/quran-uthmani` |
| Terjemahan Indonesia | `api.alquran.cloud/v1/surah/{n}/id.indonesian` |
| Anotasi tajwid | `api.alquran.cloud/v1/surah/{n}/quran-tajweed` |
| Data per kata (teks, posisi, audio per kata) dan waktu tiap kata di audio ayat | `api.quran.com/api/v4/verses/by_chapter/{n}?words=true&audio=7` |
| Audio ayat Alafasy yang cocok dengan waktu per kata | `verses.quran.com/Alafasy/mp3/{SSS}{AAA}.mp3` |
| Audio per kata | `audio.qurancdn.com/wbw/{sss}_{aaa}_{www}.mp3` |
| Audio ayat cadangan | `everyayah.com/data/Alafasy_128kbps/{SSS}{AAA}.mp3` |

Surah yang diambil: Al-Fatihah dan juz 30.

**Penting soal audio per kata:** tiap kata di audio ini dibaca terpisah, jadi hukum tajwid yang terjadi antar kata (ikhfa, idgham, iqlab) tidak terdengar. Untuk potongan seperti مِّن سِجِّيلٍ, audionya diputar dari audio ayat penuh, dipotong memakai waktu mulai dan selesai tiap kata.

### Suara huruf hijaiyah

Belum ada rekaman huruf ber-harakat bergaya Iqro (أَ بَ تَ ...) dari qari yang lisensinya jelas. Karena itu:

1. **Studio rekam** (`/studio`): halaman untuk ustadz merekam tiap huruf dengan fathah, kasrah, dan dhammah. Rekaman tersimpan di IndexedDB dan bisa diekspor sebagai file untuk dimasukkan ke `public/audio/huruf/`. App memakai rekaman dari file dulu, lalu dari IndexedDB.
2. **Sambil menunggu rekaman**, latihan huruf memakai suara qari asli:
   - huruf muqatta'ah (contoh: نٓ di 68:1, قٓ di 50:1, صٓ di 38:1) untuk nama huruf;
   - kata Al-Qur'an yang diawali huruf tersebut, dengan audio per kata, dengan soal seperti "Dengar kata ini, huruf apa di awalnya?".
3. Kalau sebuah huruf belum punya rekaman, beri label kecil "suara huruf belum direkam". Soal yang butuh suara huruf diganti soal dengan contoh kata.

### Cek pelafalan

1. **Huruf tunggal:** pengguna merekam, lalu memutar rekamannya dan contohnya bergantian, lalu menilai sendiri dengan tombol "Sudah benar" atau "Ulangi". Belum ada model AI yang akurat untuk huruf tunggal.
2. **Kata dan potongan ayat:** dicek oleh model `tarteel-ai/whisper-base-ar-quran` (Apache 2.0) versi ONNX, dijalankan di browser lewat transformers.js. Ukurannya sekitar 75MB dan hanya diunduh sekali. Teks hasil pengenalan dibandingkan dengan teks yang seharusnya per kata, lalu kata yang benar ditandai hijau dan yang salah merah.
3. Model ini **tidak bisa** menilai makhraj atau panjang ghunnah dan mad secara presisi. Hasilnya ditampilkan sebagai bantuan, bukan vonis. Hasil cek suara tidak mengurangi hati.

## Struktur konten

### Bagian 1, Huruf Hijaiyah (gaya Iqro jilid 1)

Huruf diperkenalkan dengan fathah, mengikuti urutan Iqro.

| Unit | Huruf |
| --- | --- |
| 1 | ا ب ت ث |
| 2 | ج ح خ |
| 3 | د ذ ر ز |
| 4 | س ش ص ض |
| 5 | ط ظ ع غ |
| 6 | ف ق ك ل |
| 7 | م ن و هـ |
| 8 | ء ي |
| 9 | Huruf yang mirip: ب ت ث, ح خ ج, ح هـ, ع ء, س ش ص, ذ ز ظ, ت ط, ك ق, د ض |

Pola lesson di tiap unit:
1. **Kenalan:** huruf baru tampil besar dengan suara, nama, dan transliterasinya. Ketuk untuk mengulang suara.
2. **Dengar dan pilih:** suara diputar, pengguna memilih hurufnya. Pilihan pengecohnya huruf yang mirip bentuk atau bunyi.
3. **Lihat dan pilih bunyi:** huruf tampil, pengguna memilih bunyinya. Tombol tiap pilihan bisa diketuk untuk didengar.
4. **Pasangkan:** mencocokkan huruf dengan bunyi atau dengan nama hurufnya.
5. **Huruf di awal kata:** kata Al-Qur'an diputar dan ditampilkan, pengguna memilih huruf awalnya.
6. **Baca rangkaian (gaya Iqro):** rangkaian seperti بَ تَ ثَ. Pengguna memilih bacaan yang benar atau menyusun urutan bunyinya.
7. **Ucapkan:** pengguna merekam suaranya sendiri lalu membandingkan dengan contoh.
8. **Uji unit (piala):** campuran semua jenis soal dari unit itu.

### Bagian 2, Tajwid lewat dengar

Urutan unitnya: nun mati dan tanwin (izhar, idgham bighunnah, idgham bilaghunnah, iqlab, ikhfa), lalu mim mati, lalu qalqalah, lalu mad.

Pola lesson per hukum:
1. **Kenali bunyinya:** kartu singkat tentang ciri hurufnya dan cara membacanya. Lalu 2 sampai 3 potongan ayat pendek dengan bagian hukumnya diwarnai, dan audio qari dari potongan itu. Kalau perlu bisa diputar pelan.
2. **Dengar dan bandingkan:** dua potongan diputar, pengguna memilih mana yang mengandung hukum tersebut.
3. **Tebak dari potongan ayat:** satu bagian ayat disorot, pengguna memilih nama hukumnya.
4. **Tebak dari suara:** hanya audio potongan ayat yang diputar, teksnya tidak tampil. Pengguna memilih hukum yang terdengar. Teksnya baru muncul setelah menjawab.
5. **Cari di ayat:** pengguna mengetuk kata yang mengandung hukum tertentu.
6. **Ucapkan potongan:** pengguna merekam bacaannya, lalu dicek AI per kata dan dinilai sendiri untuk tajwidnya.

Izhar tidak ditandai di data sumber, jadi dideteksi otomatis dari teks Utsmani dan ditandai perlu cek ustadz. Qalqalah sughra dan kubra dibedakan dari posisinya (di akhir ayat dianggap kubra), juga ditandai perlu cek.

### Bagian berikutnya (setelah prototype inti)

- Iqro jilid 2 sampai 6: harakat kasrah dan dhammah, tanwin, sukun, tasydid, mad, dan bentuk huruf sambung.
- Hafalan dengan pola tikrar untuk Al-Fatihah, An-Nas, Al-Falaq, dan Al-Ikhlas.

## Fase pengerjaan

**Fase 1, kerangka Duolingo dan Huruf Hijaiyah**
- Tampilan ala Duolingo: tab bawah, bar atas (streak, gems, hati), path zig-zag, banner unit, dan panduan unit.
- Onboarding: tujuan, kemampuan awal, target harian, pengingat talaqqi, lalu langsung masuk lesson pertama.
- Mesin lesson: progress bar, hati, combo, panel umpan balik, efek suara (dibuat dengan Web Audio), soal salah diulang di akhir, dan rangkaian layar akhir.
- Gamifikasi inti: XP, hati, combo, streak dan pembekunya, target harian, gems, misi harian, dan peti.
- Bagian 1 unit 1 sampai 9 dengan jenis soal 1 sampai 8.
- Tab Huruf: grid huruf hijaiyah dengan bar penguasaan per huruf, ketuk untuk mendengar.
- Studio rekam dan latihan rekam suara dengan penilaian sendiri.
- Script data: data per kata dan waktu tiap kata dari quran.com, dan contoh kata per huruf dipilih otomatis dari juz 30.
- Berhenti dan laporkan.

**Fase 2, Tajwid lewat dengar**
- Pemutar potongan ayat berdasarkan waktu tiap kata.
- Bagian 2 unit nun mati dan tanwin, dengan jenis soal 1 sampai 6.
- Cek suara dengan AI (Tarteel di browser) untuk kata dan potongan ayat.
- Deteksi izhar.
- Berhenti dan laporkan.

**Fase 3, gamifikasi penuh**
- Liga lawan bot, toko, pencapaian dan badge, halaman profil, perayaan milestone streak, dan XP boost.
- Unit mim mati, qalqalah, dan mad.

**Fase 4, Iqro lanjutan dan muraja'ah**
- Harakat, tanwin, sukun, tasydid, dan mad. Bentuk huruf sambung.
- Latihan ulang terjadwal (gaya Leitner, bisa diganti model lain nanti), latihan dari kesalahan, dan mode "legendaris" per unit.

**Fase 5, Hafalan**
- Alur tikrar dan tes hafalan dari spec pertama.

## Di luar cakupan prototype

Login, backend, pembayaran, notifikasi push, dan penilaian makhraj otomatis untuk huruf tunggal.

## Catatan kerja

- Commit kecil dan rapi dengan pesan singkat dalam bahasa Inggris.
- Jangan tambahkan baris Co-Authored-By, link sesi, atau atribusi AI apa pun di commit maupun PR.
- Nama file, komponen, dan variabel dibuat biasa dan jelas, tidak berlebihan.
- README berisi cara menjalankan, sumber data, dan daftar konten yang masih perlu dicek ustadz.
