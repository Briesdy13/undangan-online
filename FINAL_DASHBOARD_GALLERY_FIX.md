# Final Dashboard Gallery Fix

Masalah:
Dashboard Gallery masih render item gallery sebagai string URL (`src={url}`), padahal data dari Supabase sudah berbentuk object:
`{ id, imageUrl, sortOrder, caption }`.

Efek:
Dashboard menampilkan fallback `/fathir.jpeg` berulang, sementara frontend publik sudah benar.

Fix:
- Dashboard Gallery sekarang mengambil:
  - string URL lama: `item`
  - object Supabase baru: `item.imageUrl`
- Tombol Jadikan Cover pakai object/string yang benar.
- Tombol Edit Foto ditambahkan untuk mengganti foto yang dipilih.
- Delete tetap menghapus item sesuai index dan menghapus file Storage jika URL Supabase.
