# Tanpa gems dan toko

Setelah hati dihapus (ADR-0004), gems kehilangan kegunaan utamanya. Isi toko yang tersisa hanya pembeku streak dan XP boost. Gems dan toko dihapus. Hadiah Lafaz cukup Momen Bisa Baca, badge, dan XP. Hadiah utamanya tetap jelas: ayat.

## Considered Options

- **Gems untuk kosmetik** (baju maskot, tema warna): ditunda sampai identitas UI sendiri dibuat.
- **Biarkan dulu**: ditolak. Mata uang yang tidak bisa dipakai membingungkan Pelajar.

## Consequences

- `gems`, `STARTING_GEMS`, dan angka gems di bar atas dihapus. Pembeku Streak tetap gratis 1 per minggu, tidak dibeli.
- Peti dan Misi Harian sekarang berhadiah gems. Penggantinya masih pertanyaan terbuka (`docs/PRD.md` §8).
