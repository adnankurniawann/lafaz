# Peta Ayat, bukan liga

Lafaz tidak punya liga atau papan peringkat. Tab Liga diganti Peta Ayat: ayat Al-Fatihah dan juz amma yang menyala satu per satu saat Pelajar mengenal hurufnya, membacanya, lalu menghafalnya. Sisi sosialnya lewat Kartu Pamer, gambar dari Momen Bisa Baca yang bisa dibagikan ke mana saja. Yang dipamerkan kemampuan, bukan peringkat.

Kompetisi dalam belajar Al-Qur'an mudah terasa riya'. Lawan bot yang diberi label "bot" juga terasa hampa. Tanpa backend (ADR-0001), lawan manusia tidak mungkin ada.

## Considered Options

- **Liga lawan bot (rencana Fase 3 lama)**: 10 tingkat, 30 peserta, 7 naik, 5 turun. Ditolak.
- **Halaqah, kelompok kecil kolaboratif**: ditunda. Butuh backend, jadi butuh ADR baru. Dicatat di backlog.
- **Tantang teman lewat link**: ditunda ke backlog. Bisa tanpa backend kalau soalnya disimpan di link.

## Consequences

- Halaman `/liga` sekarang diganti isinya menjadi Peta Ayat.
- Kartu Pamer awalnya hanya gambar. Kartu dengan rekaman suara Pelajar menyusul, karena butuh format video dan rawan privasi.
