# Status SmartBG — 28 Oktober 2026

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

### Belum dikerjakan
- Fitur jas dan dasi (butuh aset PNG transparan berlisensi atau buatan sendiri)
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
