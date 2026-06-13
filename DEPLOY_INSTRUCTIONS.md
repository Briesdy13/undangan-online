# Deploy Undangan Online Final

## 1. Supabase
1. Buka Supabase SQL Editor.
2. Jalankan `RUN_THIS_FIRST_FINAL_ULTRA_PREMIUM.sql`.
3. Pastikan bucket `invitation-gallery` dan `invitation-music` public.

## 2. Local test
```bash
npm install
npm run dev -- --host 0.0.0.0
```

## 3. GitHub
```bash
git init
git add .
git commit -m "final ultra premium undangan online"
git branch -M main
git remote add origin https://github.com/USERNAME/undangan-online.git
git push -u origin main
```

## 4. Vercel
Import repository ke Vercel.
Set Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build command: `npm run build`
Output directory: `dist`
