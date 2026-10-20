# Lafaz — Alur Pengguna

Status: ✅ ada, ⏳ rencana.

## 1. Kedatangan Pertama ✅
1. Pelajar baru diarahkan ke `/onboarding` oleh `AppGate`.
2. Sambutan bersama maskot.
3. **Tujuan**: kenapa ingin belajar.
4. **Kemampuan awal**: dari belum kenal huruf sampai sudah bisa membaca.
5. **Target Harian**: Santai, Biasa, Serius, Intens.
6. **Talaqqi**: ajakan ramah untuk memperdengarkan bacaan ke guru atau teman yang lancar (ADR-0009). Kalimatnya masih versi lama. ⏳
7. Tombol "Mulai lesson pertama" langsung membuka lesson pertama unit 1.
8. Model Cek Suara mulai diunduh di latar belakang (ADR-0008). ⏳

## 2. Belajar di Path ✅
1. Tab Belajar menampilkan path zig-zag per unit dengan banner berwarna.
2. Node aktif memantul dengan label "MULAI". Ketuk untuk membuka lesson.
3. Tombol Panduan di banner membuka kartu materi unit.
4. Peti di tengah unit bisa dibuka setelah lesson sebelumnya selesai.
5. Uji Unit (piala) di akhir unit.

## 3. Satu Lesson ✅
1. Atas: tombol keluar (dengan konfirmasi) dan progress bar.
2. Satu soal per layar. Pilih jawaban, tekan PERIKSA.
3. Panel naik dari bawah. Benar: hijau, efek suara, combo bertambah. Belum tepat: merah, jawaban yang benar tampil, soal masuk antrean ulang. Tidak ada hati (ADR-0004). ⏳
4. Mulai 2 benar beruntun, combo tampil di bawah soal. Tiap kelipatan 5 muncul pujian "5 benar berturut-turut!".
5. Soal ucapkan: rekam, putar rekaman dan contoh bergantian, pilih "Sudah benar" atau "Ulangi". Setelah Iqro lanjutan, kata dan ayat juga dicek Cek Suara. ⏳
6. Setelah soal terakhir dan semua soal ulang selesai: layar hasil (XP, akurasi, waktu), streak, Target Harian, Misi Harian, peti kalau ada.

## 4. Momen Bisa Baca ⏳
1. **Sejak unit 1**: setelah unit selesai, satu ayat asli tampil dengan huruf yang sudah dikenal menyala. "Kamu sudah kenal 9 dari 20 huruf di ayat ini." Ayat itu menyala di Peta Ayat (tanda pertama).
2. **Setelah Iqro lanjutan**: kata atau ayat asli tampil. Pelajar menekan rekam dan membacanya. Cek Suara menandai tiap kata hijau atau merah. Qari lalu membacakannya.
3. Layar "Kamu sekarang bisa baca ini" dengan tombol **Bagikan**. Kartu Pamer dibuat sebagai gambar, lalu dibagikan lewat menu bagikan HP atau disimpan.
4. Ayat itu mendapat tanda kedua di Peta Ayat. Momen pertama memberi badge "Ayat pertama".

## 5. Peta Ayat ⏳
Tab bekas Liga. Al-Fatihah dan juz amma ditampilkan per surah. Tiap ayat punya tiga tanda: hurufnya dikenal, bisa dibaca, sudah hafal. Ketuk ayat untuk mendengar qari.

## 6. Huruf Bandel ⏳
1. Huruf yang sering salah otomatis masuk koleksi Huruf Bandel, tampil di tab Huruf.
2. Ketuk "Taklukkan" untuk lesson pendek khusus huruf-huruf itu.
3. Huruf keluar dari koleksi setelah benar beberapa kali berturut-turut. Koleksi kosong pertama kali memberi badge "Penakluk huruf bandel".

## 7. Mode Tantangan ⏳
1. Unit yang sudah selesai menampilkan tombol Tantangan di banner.
2. 3 nyawa, timer per soal. Salah atau waktu habis mengurangi nyawa.
3. Selesai dengan nyawa tersisa: XP 2x dan badge "Tantangan unit X". Yang pertama juga memberi "Juara tantangan".
4. Lesson biasa tetap tanpa nyawa.

## 8. Tab Lain ✅
- **Huruf**: grid 29 huruf dengan bar Penguasaan Huruf. Ketuk untuk kartu penjelasan dan suara. Tombol latihan huruf.
- **Misi**: 3 Misi Harian dan progresnya.
- **Profil**: statistik, Target Harian, ajakan talaqqi, link ke Studio untuk guru, tombol "Hapus semua progres". Badge tampil di sini. ⏳

## 9. Studio (Ustadz) ✅
1. Buka `/studio` dari Profil.
2. Pilih huruf dan harakat (fathah, kasrah, dhammah), rekam, dengarkan, ulangi kalau perlu.
3. Tekan Ekspor, dapat zip. Pemilik mengekstraknya ke `public/audio/huruf/`.

## 10. Kasus Khusus

| Keadaan | Yang tampil |
|---|---|
| Huruf belum punya Rekaman Huruf | Tombol suara memutar Contoh Kata dari qari. Soal "dengar dan pilih huruf" diganti "huruf awal dari kata" |
| Mikrofon ditolak atau tidak didukung | Pesan untuk mengizinkan mikrofon, dan soal ucapkan bisa dilewati |
| Model Cek Suara belum selesai diunduh | Soal ucapkan memakai Nilai Sendiri ⏳ |
| Audio qari gagal dimuat (offline, CDN berubah) | Tombol suara tidak berbunyi. Belum ada pesan khusus ⏳ |
| Streak terputus, ada Pembeku Streak | Streak tetap, pembeku terpakai |
| Data browser dihapus | Progres hilang (ADR-0001) |
