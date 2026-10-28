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

### Hasil uji (28 Okt 2026, MediaPipe asli, peramban headless)
- Foto pas foto berlatar polos: tepi bersih, tidak ada garis kuning sisa latar
- Masih ada: sedikit sisa latar di pojok bawah yang menyentuh tepi gambar (bisa dihapus dengan Ajaib mode Hapus); telinga dan bahu pada foto selfie dekat kadang terpotong
- Foto seluruh badan atau orang kecil di dalam bingkai: tepi masih kasar. Aplikasi ditujukan untuk pas foto
- Belum diuji di perangkat Android dan setelah dibungkus APK

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
