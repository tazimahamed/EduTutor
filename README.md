# EduTutor BD — Free Live Demo Deployment Guide
## Stack: Vercel (backend + frontend) + Supabase (database/auth) + Groq (AI)

---

## STEP 1 — Get Free API Keys (5 mins)

### A. Groq API Key (Free — AI questions)
1. Go to: https://console.groq.com
2. Sign up → "API Keys" → "Create API Key"
3. Copy the key: `gsk_xxxxxxxxxxxx`

### B. Supabase (Free — Database + Auth)
1. Go to: https://supabase.com
2. "New Project" → set name: `edututor-bd`, set a DB password, choose region
3. Wait 2 minutes for project to start
4. Go to: Project Settings → API
5. Copy:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon key**: `eyJhbGci...` (under "Project API Keys")
   - **service_role key**: `eyJhbGci...` (click "Reveal" — keep this secret!)

---

## STEP 2 — Set Up Supabase Database (3 mins)

1. In Supabase dashboard → click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste ALL the contents of `supabase_schema.sql`
4. Click **Run** (green button)
5. You should see "Success" — tables are created ✅

---

## STEP 3 — Deploy to Vercel (5 mins)

### A. Push code to GitHub
```bash
# In the edututor-vercel/ folder:
git init
git add .
git commit -m "EduTutor BD v2 - Vercel deployment"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/edututor-bd.git
git push -u origin main
```

### B. Deploy on Vercel
1. Go to: https://vercel.com
2. Sign up/login with GitHub
3. Click **"Add New Project"**
4. Import your `edututor-bd` GitHub repo
5. **IMPORTANT — Set Root Directory**: leave as `/` (default)
6. Click **Deploy** → wait 2 minutes

### C. Add Environment Variables in Vercel
After deploy, go to: Project → **Settings** → **Environment Variables**

Add these 3 variables:
```
GROQ_API_KEY        = gsk_your_groq_key_here
SUPABASE_URL        = https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGci...your_service_role_key
```

Then go to: **Deployments** → click the 3 dots → **Redeploy**

---

## STEP 4 — Test Your Live Demo

Your URL will be: `https://edututor-bd.vercel.app`

1. Open your URL
2. Click "রেজিস্ট্রেশন করুন" → create a student account
3. Login → select Physics → pick a chapter
4. A Bengali question will appear from Groq AI ✅
5. Type an answer → submit → get Bengali feedback ✅
6. Your progress is saved in Supabase ✅

### Admin Account
- Register with role "Admin" 
- Admin code: `edu2024admin` (change in `public/js/register.js`)
- Login → see all students and their scores

---

## FILE STRUCTURE (what you upload to GitHub)
```
edututor-vercel/
├── vercel.json          ← Vercel routing config
├── requirements.txt     ← Python packages
├── api/
│   └── index.py        ← ALL backend (FastAPI + AI + Supabase)
├── public/
│   ├── index.html      ← Login page
│   ├── register.html   ← Registration
│   ├── home.html       ← Subject selection
│   ├── tutor.html      ← AI tutoring
│   ├── progress.html   ← Student progress
│   ├── admin.html      ← Admin dashboard
│   ├── css/
│   │   └── style.css   ← All styles
│   └── js/
│       ├── api.js      ← API helper
│       ├── auth.js     ← Login logic
│       ├── register.js ← Registration logic
│       ├── home.js     ← Home page
│       ├── tutor.js    ← Tutoring logic
│       ├── progress.js ← Progress display
│       └── admin.js    ← Admin dashboard
└── supabase_schema.sql  ← Run this in Supabase SQL Editor
```

---

## TROUBLESHOOTING

**"500 Internal Server Error" on first API call**
→ Check Vercel Environment Variables are set correctly
→ Redeploy after adding env vars

**"Auth error" on login**
→ Make sure you ran the SQL schema in Supabase
→ Check SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel

**"Rate limit" from Groq**
→ Free tier: 30 requests/min. The app auto-retries after 30 seconds.

**CSS looks broken**
→ Make sure `public/css/style.css` file is in the repo

---

## COSTS: $0 FOREVER (Free Tiers)
- Vercel Free: 100GB bandwidth, unlimited deployments
- Supabase Free: 500MB DB, 50,000 auth users, 2GB file storage
- Groq Free: 14,400 requests/day (30 req/min)
"# FinalEdututor" 
