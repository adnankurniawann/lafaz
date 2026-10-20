# Lafaz — Aturan Desain

> Tampilan sekarang **sementara**. Gayanya mirip app belajar bahasa (warna cerah, tombol tebal, path zig-zag) supaya mekaniknya bisa dicoba dulu. Identitas visual sendiri dikerjakan nanti dan akan menggantikan §2 sampai §4. Aturan §1 dan §5 tetap berlaku setelah redesign.

## 1. Filosofi
- **Ayat di atas segalanya.** Teks ayat tidak pernah ditutupi animasi, maskot, konfeti, atau panel. Efek suara tidak pernah diputar bertumpuk dengan bacaan.
- **Ramah, tidak menghakimi.** Salah ditampilkan sebagai "Belum tepat" dengan jawaban yang benar, tanpa warna atau bunyi yang mempermalukan (ADR-0004, 0009).
- **Satu hal per layar.** Satu soal, satu tombol utama di bawah.

## 2. Warna (sementara)

Token di `src/app/globals.css`, dipetakan ke Tailwind lewat `@theme`.

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--background` | `#ffffff` | Latar |
| `--foreground` | `#3c3c3c` | Teks |
| `--muted` | `#8a8f98` | Teks sekunder |
| `--line` | `#e5e5e5` | Garis, node terkunci |
| `--green` / `--green-dark` | `#3fb950` / `#2e9a3f` | Benar, tombol utama |
| `--red` / `--red-dark` | `#ef4b4b` / `#c73636` | Belum tepat |
| `--gold` / `--gold-dark` | `#f5b400` / `#d29a00` | Streak, XP |
| `--blue`, `--orange`, `--purple`, `--pink`, `--teal` | | Warna banner unit (`unitColors.ts`) |

Warna hukum tajwid diatur terpisah di `TajweedText` dan tidak ikut redesign tanpa dicek ulang kontrasnya.

## 3. Tipografi
- Teks Arab: **Amiri Quran** (rasm Utsmani). Ukuran besar untuk huruf tunggal, line-height longgar supaya harakat tidak terpotong.
- Teks Latin: font sistem dengan bobot tebal untuk judul dan tombol.

## 4. Komponen (sementara)
- Bar atas: sekarang streak, gems, dan hati. Setelah Blok 2 tinggal streak, karena hati dan gems dihapus (ADR-0004, 0006).
- Tab bawah: Belajar, Huruf, Peta Ayat (bekas Liga), Misi, Profil.
- Tombol utama dengan bayangan bawah tebal. PERIKSA berubah jadi LANJUT.
- Panel umpan balik naik dari bawah: hijau "Benar!", merah "Belum tepat" dengan jawaban yang benar.
- Maskot Lafaz sendiri (`Mascot.tsx`), bukan burung hantu.

## 5. Teks Arab & Aksesibilitas
- Teks Arab selalu `dir="rtl"` dan `lang="ar"`. Rangkaian gaya Iqro dibaca dari kanan ke kiri.
- Harakat dan tanda mushaf tidak boleh terpotong oleh `overflow`, `line-height`, atau `clip`.
- Semua interaksi bisa dengan satu ketukan. Tidak ada yang hanya bisa di-hover.
- Lebar maksimal sekitar 430 px, di tengah layar lebar. Cek di 375×812.
- Hormati `prefers-reduced-motion` untuk animasi path dan konfeti.
