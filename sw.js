/* SmartBG: service worker. Menyimpan seluruh aplikasi agar jalan tanpa internet.
   Ganti VERSI setiap kali berkas aplikasi berubah supaya penyimpanan lama diganti. */
const VERSI = 'smartbg-2.7.2';
const INTI = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
const LIB = [
  'selfie_segmentation.js', 'selfie_segmentation.binarypb', 'selfie_segmentation.tflite', 'selfie_segmentation_landscape.tflite',
  'selfie_segmentation_solution_simd_wasm_bin.js', 'selfie_segmentation_solution_simd_wasm_bin.wasm',
  'selfie_segmentation_solution_wasm_bin.js', 'selfie_segmentation_solution_wasm_bin.wasm',
  'face_mesh.js', 'face_mesh.binarypb', 'face_mesh_solution_packed_assets.data', 'face_mesh_solution_packed_assets_loader.js',
  'face_mesh_solution_simd_wasm_bin.js', 'face_mesh_solution_simd_wasm_bin.wasm',
  'face_mesh_solution_wasm_bin.js', 'face_mesh_solution_wasm_bin.wasm'
].map(n => './lib/' + n);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSI);
    await c.addAll(INTI);                                   // inti wajib berhasil
    await Promise.all(LIB.map(u => c.add(u).catch(() => {}))); // berkas model: bila satu gagal, sisanya tetap disimpan
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('smartbg-') && k !== VERSI) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'cek-simpan') {
  caches.open(VERSI).then(c => c.keys()).then(ks => e.source && e.source.postMessage({ simpan: ks.length, total: INTI.length + LIB.length }));
} });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return; // CDN dan tautan luar tidak disentuh
  e.respondWith((async () => {
    const c = await caches.open(VERSI);
    const hit = await c.match(r, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(r);
      if (res && res.ok) c.put(r, res.clone());
      return res;
    } catch (err) {
      if (r.mode === 'navigate') { const h = await c.match('./index.html'); if (h) return h; }
      throw err;
    }
  })());
});
