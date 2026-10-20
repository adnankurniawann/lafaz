# Tanpa hati, kesalahan tidak dihukum

Lesson biasa tidak punya hati. Jawaban salah hanya membuat soal diulang di akhir lesson. Huruf yang sering salah masuk koleksi Huruf Bandel, dan menaklukkannya memberi badge. Pelajar yang ingin tegang bisa memilih Mode Tantangan: 3 nyawa, timer per soal, XP 2x, dan badge. Mode ini terbuka setelah unitnya selesai.

Target utama Lafaz adalah orang dewasa yang sudah malu duluan. Dikunci karena salah membuat mereka berhenti. Hati di Duolingo juga ada untuk berjualan, dan Lafaz tidak menjual apa-apa.

## Considered Options

- **Hati versi lunak (Fase 1)**: 5 hati, isi ulang 1 tiap 4 jam, +1 dari Latihan Ulang. Ditolak karena tetap terasa sebagai hukuman.
- **Tanpa tantangan sama sekali**: ditolak. Sebagian Pelajar justru suka taruhan, jadi ketegangan dibuat opsional.

## Consequences

- `MAX_HEARTS`, `HEART_REFILL_MS`, `HEART_REFILL_COST`, angka hati di bar atas, dan layar "hati habis" dihapus dari Fase 1.
- Mode Tantangan menggantikan rencana "mode legendaris".
- Badge "Penakluk huruf bandel" dan "Juara tantangan" masuk daftar badge (`docs/PRD.md` §4 FR-10).
