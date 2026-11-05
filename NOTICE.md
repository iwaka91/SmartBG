# Pemberitahuan pihak ketiga

SmartBG (kode di repo ini) berlisensi MIT, lihat `LICENSE`. Bagian berikut dimiliki pihak lain dan tetap memakai lisensinya sendiri.

## MediaPipe (Google), Apache License 2.0
Folder `lib/` memuat berkas MediaPipe yang tidak diubah:
- `selfie_segmentation` versi 0.1.1675465747 (pengenal orang untuk hapus background)
- `face_mesh` versi 0.4.1633559619 (pengenal wajah untuk fitur Percantik)

Hak cipta Google LLC dan kontributor MediaPipe. Teks lisensi: `lib/LICENSE-MediaPipe-Apache-2.0.txt`. Sumber: https://github.com/google-ai-edge/mediapipe

## Arsip versi 1
Folder `archive/` berisi kode versi 1 (React) yang sudah tidak dipakai, hanya untuk riwayat. Kode itu bergantung pada pustaka pihak ketiga (React, Vite, Tailwind, lucide-react, dan `@imgly/background-removal`) yang masing-masing punya lisensi sendiri. Pustaka itu tidak disertakan di repo; periksa lisensinya sebelum membangun ulang versi 1.

## Cabang arsip
Cabang `arsip/atribut-v2.7.02` memuat fitur Atribut lama (gambar jas dan dasi buatan AI). Gambar-gambar itu tidak termasuk lisensi MIT repo ini tanpa pemeriksaan ulang oleh pemilik.
