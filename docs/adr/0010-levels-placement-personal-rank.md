# Level bisa dipilih, naik lewat tes, rank hanya gelar pribadi

Pelajar memilih tempat mulai di onboarding lewat satu pertanyaan, "Mau mulai dari mana?": Iqro, Tajwid, Hafalan, atau "Belum tahu, tes aku dulu". Pilihan di onboarding dipercaya tanpa tes, supaya Pelajar tetap sampai soal pertama dalam 60 detik. Yang memilih tes mengerjakan tes matrikulasi: paling banyak sekitar 15 soal, bertahap dari huruf, harakat, sampai baca kata dan ayat, dan berhenti di tahap pertama yang belum dikuasai. Hasilnya menaruh Pelajar sampai ke Bagian, bukan hanya ke Level.

Setelah Iqro, Level Tajwid dan Level Hafalan sejajar. Hafalan tidak menunggu Tajwid, karena syarat menghafal adalah bisa membaca. Naik ke Level di atas memakai tes yang sama dengan ujian akhir Level di bawahnya ("bisa baca Al-Fatihah" untuk Iqro). Gerbang ini melindungi Pelajar dari materi yang terlalu sulit, bukan untuk menghukum. Karena itu gagal tes hanya memberi saran, dan tetap ada tombol "tetap masuk". Turun Level selalu bebas. Level yang sudah terbuka tetap terbuka, dan progres tiap Level disimpan terpisah.

Materi yang dilewati lewat tes dihitung "dilewati": lesson berikutnya terbuka dan Peta Ayat menyala, tapi tidak memberi XP dan tidak memberi badge. Lesson itu tetap bisa dimainkan.

Rank adalah gelar pribadi dari total XP, misalnya dari "Pemula" naik terus. Rank tidak pernah turun, tidak memakai streak, dan tidak dibandingkan dengan Pelajar lain. Dengan begitu XP punya arti tanpa menghidupkan liga.

## Considered Options

- **Urutan ketat Iqro → Tajwid → Hafalan tanpa lompat**: ditolak. Pelajar yang sudah lancar membaca harus mengulang dari alif, lalu bosan dan berhenti.
- **Semua Level terbuka sejak awal**: ditolak. Pemula bisa masuk Tajwid sebelum bisa membaca, padahal ini yang dicegah ADR-0007.
- **Tes wajib di onboarding**: ditolak karena memperlambat soal pertama.
- **Gerbang naik yang mengunci mati**: ditolak. Tanpa liga tidak ada yang dirugikan oleh Pelajar yang memaksa naik.
- **Rank dari streak**: ditolak. Rank turun saat streak putus terasa sebagai hukuman (ADR-0004). Streak sudah punya badge dan perayaan.
- **Rank sebagai peringkat antar Pelajar**: ditolak. Butuh server (ADR-0001) dan bertentangan dengan ADR-0005.

## Consequences

- Pertanyaan "Seberapa kenal kamu dengan huruf hijaiyah?" di onboarding diganti "Mau mulai dari mana?" setelah Level Tajwid ada.
- Blok 3: tes matrikulasi di dalam Iqro (lompat dari huruf ke harakat) dan rank dari XP.
- Blok 4: pertanyaan "Mau mulai dari mana?", pemilih Level di bar atas tab Belajar, dan tes naik Level.
- Nama dan ambang tiap rank diputuskan saat dibangun. Nama yang memakai istilah Arab dicek ustadz.
