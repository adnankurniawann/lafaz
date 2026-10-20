# Teks ayat hanya dari script, selalu Teks Utsmani

Teks ayat dan kata Qur'an tidak pernah diketik manual atau dari ingatan. Semuanya diambil oleh `scripts/fetch-quran.ts` dan disimpan sebagai JSON. Script berhenti dengan error kalau ada endpoint gagal atau format yang tidak sesuai.

Edisi tajwid punya encoding berbeda dari edisi Utsmani di 330 dari 602 ayat (tatwil, mim kecil iqlab, alif kecil, ى). Karena itu app selalu menampilkan Teks Utsmani, dan anotasi tajwid dipindahkan ke teks itu dengan penyelarasan per karakter (`projectTajweed` di `src/lib/tajweed.ts`). Script memastikan tidak ada hukum yang hilang saat dipindahkan.

## Considered Options

- **Menampilkan teks edisi tajwid langsung**: ditolak. Beberapa tanda mushaf tampil salah.
- **Menandai tajwid sendiri dengan aturan buatan**: ditolak, kecuali izhar yang tidak ada di data. Hasil deteksi sendiri wajib ditandai `"review": "perlu cek ustadz"`.

## Consequences

- Menambah surah berarti menjalankan ulang `npm run fetch-quran`, bukan menyalin teks.
- Batas segmen tajwid mengikuti data sumber apa adanya, termasuk kalau batasnya jatuh di antara huruf dan harakatnya.
