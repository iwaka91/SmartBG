# SmartBg — Smart Background Remover

Aplikasi web React untuk menghapus background foto dan mengeditnya dengan Canvas. Sumber kode berasal dari arsip **Smart Background Remover.txt** tertanggal 23 September 2026.

## Fitur
- Hapus latar otomatis dengan `@imgly/background-removal` di browser
- Kuas hapus/kembalikan, undo/redo, dan tahan untuk melihat gambar asli
- Latar transparan, warna, foto lain, dan efek blur
- Latar generatif opsional lewat Gemini API, memerlukan API key pengguna
- Ekspor PNG transparan atau JPEG (latar tidak transparan)

## Mulai
Node.js 20+ (direkomendasikan 22) dan npm:

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
npm run preview
```

Deploy Netlify: build command `npm run build`, publish `dist`. Konfigurasi `netlify.toml` tersedia.

## Privasi & keterbatasan
- Penghapusan latar diproses di perangkat. **Koneksi diperlukan untuk mengunduh file model/wasm pada penggunaan pertama**; mode offline tidak dijamin tanpa penyimpanan model/cache yang tepat.
- Fitur generatif online opsional **mengirim gambar dan prompt ke layanan Gemini**. Key dimasukkan pengguna, sementara berada di state aplikasi; tidak dipaketkan dalam repo. Layanan publik sebaiknya memakai backend/proxy yang aman untuk API key.
- Model Gemini `gemini-3.1-flash-image` dari source asli belum diverifikasi berjalan dengan API saat ini. Kuota/biaya dapat berlaku sesuai layanan.
- Status: kode dipulihkan dan scaffolding Vite disiapkan, tetapi **build dan uji perangkat belum diverifikasi** karena registry npm tidak tersedia di lingkungan penyusunan. Lihat `docs/STATUS.md`.
- Kode asli tanpa perubahan ada di `archive/Smart Background Remover.txt`.

Jangan commit API key, `node_modules`, atau output build.
