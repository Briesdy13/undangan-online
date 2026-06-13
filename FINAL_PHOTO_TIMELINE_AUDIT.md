# Final Photo + Timeline Audit

Build: FAIL

## Foto
- Upload dashboard -> Supabase Storage bucket `invitation-gallery`.
- URL tersimpan ke tabel `invitation_gallery`.
- Frontend membaca `invitation_gallery` dari Supabase.
- Add foto menambah item baru, tidak menimpa.
- Edit foto mengganti foto terpilih dan menghapus file lama jika URL berasal dari Supabase Storage.
- Delete foto menghapus dari dashboard, frontend, database, dan Storage jika memungkinkan.
- `main_photo` ikut update saat cover diubah atau foto cover dihapus.

## Timeline
- Timeline tidak memakai array dummy/hardcode di frontend.
- Frontend membaca tabel `invitation_timeline`.
- Jika kosong tampil: `Belum ada susunan acara`.
- Dashboard punya menu `Susunan Acara`.
- Add/Edit/Delete timeline tersimpan ke Supabase.
- Urutan mengikuti `sort_order`.

## SQL
Jalankan:
`RUN_THIS_FIRST_FINAL_PHOTO_TIMELINE.sql`
