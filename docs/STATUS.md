# Status SmartBG — 29 Oktober 2026

## Versi 2 (aktif)
SmartBG v2 diklaim sebagai versi lanjutan. Pengujian versi 1 (React + IMG.LY) dinyatakan **gagal**, sehingga berkasnya dipindah ke `archive/v1-react/` (riwayat Git tetap utuh).

Tujuan sama: pas foto, hapus background, pilih warna latar, ubah rasio, ekspor. Mesin diganti MediaPipe Selfie Segmentation.

### Sudah ada
- Pilih foto dengan preview, tombol Hapus Background
- Orang dicari dulu, lalu diproses ulang lebih detail pada area orang
- Tepi mengikuti foto asli (penyaring berpemandu warna), serpihan dibuang, warna sisa latar lama diganti dengan warna dari bagian dalam
- Warna latar utama putih, merah, biru, palet, dan warna bebas
- Tab Poles: Penghapus, Kuas, Ajaib (kepekaan), Blur, Undo/Redo, slider Tepi (tajam-halus), lingkaran zoom, 1 jari mengedit dan 2 jari geser/zoom
- Tab Lainnya: rasio Asli, 1x1, 3x4, 4x6 dengan geser dan zoom
- Ekspor JPG/PNG dengan pilihan kualitas dan estimasi ukuran
- `lib/` berisi MediaPipe lokal, jadi bisa dipakai tanpa internet
- v2.3: tombol **Bersihkan Sisa Latar** (mengenali warna latar lama lalu membuang sisa di tepi dan sela tubuh, ada slider kepekaan, bisa di-Undo)
- v2.3: mode **Cek Tepi** di tab Poles (latar sementara hijau agar residu terlihat)
- v2.3: **Presisi Tepi** Sedang/Tinggi/Maksimal di tab Poles (mengulang penghapusan dengan penyaring tepi lebih besar; turun otomatis ke Sedang bila memori tidak cukup)
- v2.3: panel **Tips foto** di tab Utama
- v2.4: pilihan di beranda **Standar** (bawaan) atau **Pembersihan Tingkat Lanjut** (MediaPipe yang sama; presisi minimal Tinggi, penyaring tepi dua tahap, peralihan tepi lebih sempit, sisa latar dibersihkan otomatis). Bisa diganti setelah ada hasil (proses diulang, bisa di-Undo)
- v2.4: menu **Bagikan** di panel Ekspor (WA dan aplikasi lain lewat menu bagikan perangkat; tombol disembunyikan bila peramban tidak mendukung)
- v2.4: **nama berkas** bisa diubah dengan mengetuknya (bawaan `pasfoto-smartbg`; ekstensi mengikuti format)
- v2.4: halaman **About** disusun ulang: deskripsi, privasi, teknologi, lisensi, pengembang, tautan totogutomo.com, Saweria (ikon kopi), surel
- v2.5: urutan tab **Beranda, Poles, Crop, Percantik** (Utama diganti Beranda, Lainnya diganti Crop)
- v2.5: tab **Percantik**: kotak peringatan yang bisa ditutup (muncul lagi bila kekuatan di atas 60%), tombol **Percantik AI** (takaran natural), slider **Kekuatan**, tombol **Sebelum** (tahan), enam menu (Kulit Mulus, Cahaya, Kilap Minyak, Bawah Mata, Warna Kulit, Mata dan Alis), Undo/Redo/Reset. Tidak ada pengubah bentuk wajah (tirus, besarkan mata) dengan sengaja
- v2.5: tab Percantik terkunci sampai background dihapus (sama seperti Poles)

### Hasil uji (28 Okt 2026, MediaPipe asli, peramban headless)
- Foto pas foto berlatar polos: tepi bersih, tidak ada garis kuning sisa latar
- Sisa kuning di pojok bawah (sela bahu dan tepi gambar) hilang setelah Bersihkan Sisa Latar; syal putih tidak ikut terhapus
- Presisi Maksimal hanya sedikit lebih tajam pada rambut di foto uji; Sedang sudah cukup baik. Waktu proses sekitar 2-3 detik di komputer uji
- Foto berlatar kabut: Bersihkan Sisa Latar berjalan tanpa merusak masker, tetapi hasilnya hanya sedikit; bahu kiri masih agak kabur
- Masih ada: telinga dan bahu pada foto selfie dekat kadang terpotong
- Foto seluruh badan atau orang kecil di dalam bingkai: tepi masih kasar. Aplikasi ditujukan untuk pas foto
- Belum diuji di perangkat Android dan setelah dibungkus APK

### Keputusan 28 Okt 2026
- Rencana model lanjutan (BiRefNet/ONNX) **dibatalkan**: terlalu berat untuk HP dan perlu unduhan besar. Digantikan mode Tingkat Lanjut berbasis MediaPipe yang sama.
- Uji v2.4 (komputer, MediaPipe asli, 2 foto contoh): tepi setengah transparan berkurang sekitar 35% dibanding Standar, wajah dan rambut utuh. Perbedaannya halus; rambut keriting dan kerudung perlu diuji di HP.

### Percantik: yang masih harus dilakukan (29 Okt 2026)
- **Berkas model wajah belum ada di `lib/`.** Percantik memakai MediaPipe Face Mesh 0.4.1633559619 (`face_mesh.js`, `face_mesh.binarypb`, `face_mesh_solution_packed_assets.data`, `face_mesh_solution_packed_assets_loader.js`, dan dua pasang `face_mesh_solution_*wasm_bin`). Aplikasi mencoba `lib/` dulu lalu CDN jsdelivr. Tanpa berkas ini dan tanpa internet, **Bawah Mata** dan **Mata dan Alis** dilewati; Kulit Mulus, Cahaya, Kilap Minyak, Warna Kulit tetap jalan (area kulit dikenali dari warna di bagian atas tubuh)
- Uji komputer (Chromium, foto astronot domain publik): kedua jalur berjalan tanpa galat. Jalur dengan model wajah **hanya diuji dengan titik wajah tiruan**, belum dengan model asli. Perlu uji di HP dengan 3-5 foto nyata
- Takaran bawaan tombol Percantik AI: kulit 45, cahaya 40, kilap 50, bawah mata 35, warna kulit 40, mata dan alis 30 (bisa disetel ulang setelah uji HP)

### Aset Atribut (29 Okt 2026) — aset siap, fitur belum dibuat
- `assets/jas/`: 10 jas PNG transparan (6 jas pria, 2 jas hitam, 2 blazer wanita) + `jas.json`. Hasil generasi AI (aman lisensi). Bagian dalam/kerah belakang dan lubang leher sudah dihapus agar jas bisa menjadi lapisan atas foto; kerah depan, bahu, dan kancing utuh
- Semua jas diseragamkan: lebar bukaan leher 240 px. `jas.json` berisi `leherX` (tengah leher), `leherV` (titik V paling bawah, tempat dasi dipasang), `leherLebar`, lebar dan tinggi berkas
- `assets/dasi/`: 10 dasi PNG transparan (termasuk kupu-kupu) + `dasi.json` (`simpulX`, `simpulY` = titik atas tengah, `simpulLebar` = 100 px). Logo dan tali sudah dibuang
- Jas Hitam Dobel: saputangan saku dihapus. Jas kilap (mirip kulit), blazer hijau, dan jas krem dilewati
- Catatan: jas wol dan blazer hitam dipotong di atas saku; blazer hitam punya celah gelap kecil di sisi pinggang (bagian dalam jas)
- Total aset ±15 MB; berkas ini terpisah dari index.html dan akan masuk bundel APK

### Belum dikerjakan
- Tab **Atribut** (Jas dan Dasi): penempatan otomatis di bawah dagu + geser/zoom jari, sembunyikan tubuh lama di bawah leher, peringatan untuk dokumen resmi, label lima tab
- v2.6: Koreksi Bias Latar Belakang (kulit/wajah saja), perbaikan tombol ✕ peringatan (`w.hidden=B.warnOff`), Outline (putih/palet, paling bawah tab Poles)
- Pembungkusan APK

### Catatan perubahan repo
- Berkas v1 (React, Vite, Tailwind) ada di `archive/v1-react/`
- Alur CI lama dinonaktifkan: `archive/v1-react/.github-workflows/build.yml.nonaktif`
- `netlify.toml` sekarang menyajikan folder apa adanya (tanpa build)

---

## Arsip: status versi 1

Sumber asli: `archive/Smart Background Remover.txt`, 23 September 2026.
Target: `iwaka91/SmartBG` pada branch `main` (repository private).

## Dibawa ke repo
- Komponen React lengkap dan fitur editor Canvas dari arsip
- Struktur Vite + Tailwind + Lucide + React, Netlify config, CI build
- Arsip source asli tanpa perubahan

## Penyesuaian pada src/App.jsx
- Modul IMG.LY diimpor dari dependency npm; aset model menggunakan CDN bawaan package ketika pertama dipakai
- Mask memakai alpha transparan pada background dan kuas erase memakai destination-out
- Resolusi editor diselaraskan dengan hasil resize maksimum 1920 px
- Pembebasan object URL dan penanganan kegagalan toBlob
- Panel input/modals memakai render fungsi untuk mengurangi remount saat mengetik
- Klaim offline pada UI diperjelas

## Belum diuji
- `npm install && npm run build`: registry npm tidak dapat diakses dari lingkungan pemulihan
- Penghapusan latar dengan foto, performa memori, undo/redo dan export pada Xiaomi/PC
- API Gemini: akses model `gemini-3.1-flash-image`, izin akun, respons dan keamanan client key
- Deploy ke Netlify: perubahan repo **bukan** konfirmasi deployment

Status: SOURCE RESTORED · JSX SYNTAX CHECKED · BUILD NOT VERIFIED · QA PENDING.
