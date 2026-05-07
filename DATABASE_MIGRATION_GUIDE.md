# Database Migration Guide: Supabase to Neon/Aiven

Is guide mein bataya gaya hai ki kaise aap apne database ko Supabase se **Neon.tech** ya **Aiven.io** par shift kar sakte hain taaki database kabhi "pause" na ho.

## Step 1: Naya Database Setup karein
1. **[Neon.tech](https://neon.tech/)** par jayein aur free account banayein.
2. Ek naya project create karein.
3. Dashboard se **Connection String** (PostgreSQL URL) copy karein.
   - *Tip: "Pooled connection" wala option select karein agar available ho.*

## Step 2: Environment Variables Update karein
1. Apne project folder mein `.env` file kholein.
2. `DATABASE_URL` field mein apni nayi connection string paste karein:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/neondb?sslmode=require
   ```
3. File ko **Save** karein.

## Step 3: Database Tables Initialize karein
Terminal ya PowerShell mein ye command chalayein:
```powershell
python backend/init_db.py
```
Isse `users`, `usage`, `settings`, aur `applications` tables aapke naye database mein ban jayenge.

## Step 4: Application Start karein
Ab aap normal tarike se apna dashboard chala sakte hain:
```powershell
run.bat
```

---

### Key Changes Made in the Project:
- **`backend/database.py`**: Ab ye Supabase SDK ki jagah standard `psycopg2` driver use karta hai.
- **`backend/requirements.txt`**: `psycopg2-binary` add kiya gaya hai.
- **`backend/init_db.py`**: Naya script jo tables create karta hai.

> **Note:** Naya database khali hoga, isliye aapko ek baar phir se frontend par register karna padega.
