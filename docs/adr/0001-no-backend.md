# Tanpa server, progres disimpan di perangkat Pelajar

Semua progres (XP, streak, Penguasaan Huruf, lesson yang selesai) disimpan di localStorage lewat zustand persist. Rekaman suara disimpan di IndexedDB. Data Qur'an diambil sekali oleh script lalu disimpan sebagai JSON di repo. Satu-satunya permintaan jaringan saat app dipakai adalah audio qari dari CDN sumber (`docs/DATA.md` §1) dan unduhan model Cek Suara. Biaya hosting tetap Rp0, tidak ada data pribadi yang meninggalkan perangkat, dan tidak perlu login.

Keputusan ini berlaku untuk fase prototype. Backend boleh ditambahkan saat Lafaz jadi produk, lewat ADR baru yang menggantikan ADR ini. ADR itu sebaiknya menjaga dua hal: login tetap opsional, dan rekaman suara Pelajar tidak dikirim tanpa pilihan Pelajar sendiri.

## Considered Options

- **Supabase atau Firebase untuk akun dan sinkron progres**: ditolak untuk prototype. Login menambah hambatan buat Pelajar yang malu dan menambah urusan privasi.
- **Liga dengan lawan manusia**: butuh backend, dan liganya sendiri dibuang (ADR-0005).

## Consequences

- Progres hilang kalau Pelajar menghapus data browser atau ganti HP. Tombol "Hapus semua progres" di Profil sengaja ada.
- Fitur sosial dibatasi pada yang bisa jalan lewat link atau gambar (Kartu Pamer). Halaqah atau sinkron antar perangkat butuh ADR baru yang menggantikan ADR ini.
