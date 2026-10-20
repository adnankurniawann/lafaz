# Cek Suara di browser, model diunduh otomatis

Cek Suara memakai `tarteel-ai/whisper-base-ar-quran` (Apache 2.0) versi ONNX lewat transformers.js, jalan di browser. Ukurannya sekitar 75 MB. Model diunduh otomatis di latar belakang setelah onboarding selesai, jadi Pelajar tidak perlu menunggu atau memilih. Selama model belum siap, soal ucapkan memakai Nilai Sendiri.

Hasilnya dibandingkan per kata dengan teks yang seharusnya. Kata yang cocok ditandai hijau, yang tidak cocok merah. Model ini tidak bisa menilai makhraj, panjang mad, atau ghunnah secara presisi, dan tidak bisa menilai huruf tunggal.

## Considered Options

- **Opsional dengan tawaran "Aktifkan cek suara (75 MB)"**: ditolak oleh pemilik. Langkah tambahan mengurangi orang yang mencoba fitur andalan.
- **Cek suara di server**: ditolak (ADR-0001), dan rekaman suara Pelajar tidak boleh keluar dari perangkat.

## Consequences

- Pelajar dengan kuota terbatas tetap mengunduh 75 MB. Unduhan harus berjalan di latar belakang dan tidak menghalangi lesson.
- Hasil Cek Suara selalu ditulis sebagai bantuan, bukan vonis, dan tidak pernah mengurangi apa pun.
- Huruf tunggal tetap memakai Nilai Sendiri.
