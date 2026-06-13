# Deploy Final Undangan Online

1. Supabase SQL Editor: jalankan `RUN_THIS_FIRST_FINAL_REDATABASE.sql`.
2. Vercel Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Local test:
```bash
npm install
npm run build
npm run dev -- --host 0.0.0.0
```
4. GitHub update:
```bash
git add .
git commit -m "redesign total premium final"
git push origin main
```
5. Vercel: Redeploy, `Use Existing Build Cache = OFF`.
