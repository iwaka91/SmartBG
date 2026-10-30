# SmartBG — Penghapus Latar Pas Foto

Aplikasi web untuk menghapus latar belakang pas foto, memilih warna latar (putih, merah, biru, palet), merapikan hasil, mengubah rasio (1x1, 3x4, 4x6), dan mengekspor JPG/PNG. Rencananya dibungkus menjadi APK.

**Versi 2** menggantikan versi lama (React + IMG.LY) yang dinyatakan gagal pada pengujian. Berkas versi lama disimpan di `archive/`.

## Fitur
- Pilih foto lalu tampil di preview sebelum diproses
- Hapus background dengan MediaPipe Selfie Segmentation, diproses di perangkat
- Tepi dirapikan mengikuti foto asli, warna sisa latar lama dibuang
- Warna latar: putih, merah, biru, palet, dan warna bebas
- Tab **Poles**: Penghapus, Kuas, Ajaib, Blur, Undo/Redo, slider Tepi, lingkaran zoom, Cek Tepi, Bersihkan Sisa Latar, Presisi Tepi (Sedang/Tinggi/Maksimal)
- Tab **Crop**: rasio foto 1x1, 3x4, 4x6 dengan geser dan zoom
- Tab **Percantik**: tombol Percantik AI, Kulit Mulus, Cahaya, Kilap Minyak, Bawah Mata, Warna Kulit, Mata dan Alis, Sebelum/Sesudah, Undo/Redo/Reset (memakai MediaPipe Face Mesh; berkasnya perlu ada di `lib/` agar offline)
- Tab **Poles** juga memuat **Koreksi Bias Latar Belakang** (kulit saja) dan **Outline** (putih/palet, tebal bisa diatur)
- Pilihan **Standar** atau **Pembersihan Tingkat Lanjut** (tepi lebih tajam) di beranda
- Ekspor JPG atau PNG, kualitas maksimal/sedang/rendah dengan estimasi ukuran, nama berkas bisa diubah, dan menu Bagikan

## Struktur
- `index.html` — seluruh aplikasi (satu berkas)
- `lib/` — MediaPipe selfie_segmentation 0.1.1675465747 (Apache-2.0), dimuat lebih dulu sebelum CDN
- `docs/STATUS.md` — laporan status
- `archive/` — arsip versi lama
- Fitur Atribut (jas dan dasi) dihapus di v2.7.1; versi lengkapnya tersimpan di cabang `arsip/atribut-v2.7.02`

## Menjalankan
Berkas harus dibuka lewat server (bukan klik ganda), mis. `python3 -m http.server`, lalu buka `http://localhost:8000`. Untuk APK, `index.html` dan `lib/` dibungkus bersama agar bisa offline.

SmartBG ©2026 | totogutomo.com
