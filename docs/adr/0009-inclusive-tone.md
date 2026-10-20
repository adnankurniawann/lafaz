# Nada inklusif, talaqqi sebagai ajakan

Lafaz terbuka untuk semua orang, termasuk non-Muslim dan yang sekadar penasaran dengan huruf Arab. Teks tampilan tidak mengasumsikan Pelajar sudah shalat atau pernah mengaji. Belajar Al-Qur'an tidak boleh terkesan kaku atau hanya bisa di masjid.

Pengingat talaqqi tetap ada di onboarding dan Profil, tapi sebagai ajakan, bukan syarat. Contohnya: "Mau makin mantap? Coba perdengarkan bacaanmu ke guru atau teman yang lancar."

## Considered Options

- **Kalimat lama** ("bacaan tetap perlu disetorkan dan dikoreksi langsung oleh guru"): ditolak. Bagi Pelajar yang malu, kalimat ini terbaca "app ini tidak cukup, ujungnya tetap harus ke masjid".
- **Menghapus pengingat talaqqi**: ditolak. Adabnya tetap penting dan app memang tidak bisa menilai makhraj.

## Consequences

- Teks di `OnboardingScreen.tsx` dan `ProfileScreen.tsx` diganti.
- Aturan adab konten Qur'an (`AGENTS.md` §2) tetap berlaku penuh. Yang berubah hanya nadanya, bukan isinya.
