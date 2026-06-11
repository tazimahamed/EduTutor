"""
EduTutor BD — Vercel Serverless Entry Point
All routes handled here via Mangum (ASGI adapter)
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
from typing import Optional
import os, json, re, time
from enum import Enum

# ── Groq Client ──────────────────────────────────────────────
from groq import Groq

_groq_client = None
def get_groq():
    global _groq_client
    if not _groq_client:
        _groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
    return _groq_client

GROQ_MODEL = "llama-3.3-70b-versatile"

# ── Supabase Client ──────────────────────────────────────────
from supabase import create_client, Client

_supa: Optional[Client] = None
def get_supa():
    global _supa
    if not _supa:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_KEY", "")
        _supa = create_client(url, key)
    return _supa

# ── Bloom Taxonomy ───────────────────────────────────────────
class BloomLevel(Enum):
    REMEMBER  = 1
    UNDERSTAND= 2
    APPLY     = 3
    ANALYZE   = 4
    EVALUATE  = 5
    CREATE    = 6

BLOOM_NAMES = {1:"মনে রাখা",2:"বোঝা",3:"প্রয়োগ",4:"বিশ্লেষণ",5:"মূল্যায়ন",6:"সৃষ্টি"}

# ── AI Helper ────────────────────────────────────────────────
SYSTEM_PERSONA = """তুমি একজন অভিজ্ঞ বাংলাদেশী শিক্ষক। SSC ও HSC শিক্ষার্থীদের পদার্থবিজ্ঞান, রসায়ন এবং গণিত পড়াও।
সবসময় বাংলায় কথা বলো। NCTB পাঠ্যক্রম অনুসরণ করো। শিক্ষার্থীকে উৎসাহিত করো।"""

def _generate(prompt: str) -> str:
    client = get_groq()
    for attempt in range(3):
        try:
            res = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PERSONA},
                    {"role": "user",   "content": prompt}
                ],
                max_tokens=2048,
                temperature=0.3,
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            if '429' in str(e) and attempt < 2:
                time.sleep(30)
            else:
                raise e

def _parse_json(text: str) -> Optional[dict]:
    text = re.sub(r'```json|```', '', text).strip()
    m = re.search(r'\{.*\}', text, re.DOTALL)
    if m:
        try: return json.loads(m.group())
        except: pass
    return None

def _get_nctb_context(subject: str, chapter_id: str) -> str:
    """Simple keyword-based context (no ChromaDB needed on Vercel)"""
    contexts = {
        "physics": "পদার্থবিজ্ঞান NCTB: নিউটনের গতিসূত্র, বল=ভর×ত্বরণ, শক্তির সংরক্ষণ সূত্র, তরঙ্গ ও শব্দ, আলোর প্রতিফলন ও প্রতিসরণ, ওহমের সূত্র V=IR, তড়িৎচৌম্বকত্ব।",
        "chemistry":"রসায়ন NCTB: পর্যায় সারণি, আয়নিক ও সমযোজী বন্ধন, মোল ধারণা, এসিড-ক্ষারক, pH স্কেল, রাসায়নিক বিক্রিয়ার সমতা, অ্যাভোগাড্রো সংখ্যা।",
        "math":    "গণিত NCTB: বীজগাণিত, দ্বিঘাত সমীকরণ, ত্রিকোণমিতি (sin,cos,tan), জ্যামিতির উপপাদ্য, পরিসংখ্যান (গড়,মধ্যক,প্রচুরক), সেট তত্ত্ব।",
    }
    return contexts.get(subject, "NCTB পাঠ্যক্রম অনুযায়ী প্রশ্ন তৈরি করো।")

# ── FastAPI App ──────────────────────────────────────────────
app = FastAPI(title="EduTutor BD API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ──────────────────────────────────────────
class SignUpRequest(BaseModel):
    email: str
    password: str
    name: str
    grade: str = "SSC"
    role: str = "student"

class SignInRequest(BaseModel):
    email: str
    password: str

class StartSessionRequest(BaseModel):
    student_id: str
    student_name: str
    grade: str
    subject: str
    chapter_id: str
    previous_score: Optional[float] = 50.0

class AnswerRequest(BaseModel):
    student_id: str
    subject: str
    chapter_id: str
    question: str
    student_answer: str
    expected_keywords: list
    bloom_level: int
    marks: int
    session_id: Optional[str] = None

class FollowupRequest(BaseModel):
    student_id: str
    subject: str
    chapter_id: str
    previous_question: str
    student_answer: str
    weak_areas: list
    bloom_level: int

# ── AUTH ROUTES ──────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "EduTutor BD API ✅", "version": "2.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/auth/signup")
async def sign_up(req: SignUpRequest):
    try:
        supa = get_supa()
        # Create auth user
        auth_res = supa.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {"name": req.name, "grade": req.grade, "role": req.role}
        })
        user_id = auth_res.user.id
        # Save to profiles table
        supa.table("profiles").insert({
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "grade": req.grade,
            "role": req.role
        }).execute()
        return {"success": True, "user_id": user_id, "message": f"স্বাগতম {req.name}! অ্যাকাউন্ট তৈরি হয়েছে।"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/signin")
async def sign_in(req: SignInRequest):
    try:
        supa = get_supa()
        auth_res = supa.auth.sign_in_with_password({"email": req.email, "password": req.password})
        user = auth_res.user
        profile = supa.table("profiles").select("*").eq("id", user.id).single().execute()
        p = profile.data or {}
        return {
            "success": True,
            "access_token": auth_res.session.access_token,
            "user_id": user.id,
            "user_name": p.get("name", ""),
            "role": p.get("role", "student"),
            "grade": p.get("grade", "SSC"),
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="ইমেইল বা পাসওয়ার্ড ভুল।")

# ── TUTOR ROUTES ─────────────────────────────────────────────
@app.post("/api/tutor/start-session")
async def start_session(req: StartSessionRequest):
    try:
        bloom = BloomLevel(1)
        ctx   = _get_nctb_context(req.subject, req.chapter_id)
        prompt = f"""বিষয়: {req.subject}, শ্রেণি: {req.grade}, অধ্যায়: {req.chapter_id}
Bloom স্তর: {BLOOM_NAMES[bloom.value]} (মনে রাখার স্তর)
NCTB প্রসঙ্গ: {ctx}

একটি প্রশ্ন তৈরি করো। শুধু JSON:
{{
  "question": "প্রশ্ন বাংলায়",
  "hints": ["হিন্ট ১", "হিন্ট ২"],
  "expected_keywords": ["কীওয়ার্ড ১", "কীওয়ার্ড ২"],
  "marks": 5,
  "chapter_reference": "অধ্যায় রেফারেন্স"
}}"""
        text   = _generate(prompt)
        result = _parse_json(text) or {}
        return {
            "success": True,
            "question":          result.get("question", text),
            "hints":             result.get("hints", []),
            "marks":             result.get("marks", 5),
            "bloom_level":       bloom.value,
            "expected_keywords": result.get("expected_keywords", []),
            "chapter_reference": result.get("chapter_reference", req.chapter_id),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"সেশন শুরু করতে সমস্যা: {str(e)}")

@app.post("/api/tutor/evaluate")
async def evaluate(req: AnswerRequest):
    try:
        if not req.student_answer or not req.student_answer.strip():
            return {"success":True,"score":0,"max_score":req.marks,"percentage":0,
                    "feedback_bengali":"উত্তর দাওনি।","correct_answer":"",
                    "weak_areas":[],"encouragement":"চেষ্টা করো!","is_correct":False}

        ctx = _get_nctb_context(req.subject, req.chapter_id)
        prompt = f"""প্রশ্ন: {req.question}
শিক্ষার্থীর উত্তর: {req.student_answer}
সর্বোচ্চ নম্বর: {req.marks}
প্রত্যাশিত কীওয়ার্ড: {', '.join(req.expected_keywords)}
NCTB তথ্য: {ctx}

উত্তর মূল্যায়ন করো। শুধু JSON:
{{
  "score": 0,
  "max_score": {req.marks},
  "percentage": 0,
  "feedback_bengali": "বিস্তারিত ফিডব্যাক বাংলায়",
  "correct_answer": "সঠিক উত্তর",
  "weak_areas": ["দুর্বল দিক"],
  "encouragement": "উৎসাহমূলক বার্তা",
  "is_correct": false
}}"""
        text   = _generate(prompt)
        result = _parse_json(text) or {}
        score  = result.get("score", 0)
        return {
            "success":          True,
            "score":            score,
            "max_score":        req.marks,
            "percentage":       round((score / req.marks) * 100) if req.marks else 0,
            "feedback_bengali": result.get("feedback_bengali", ""),
            "correct_answer":   result.get("correct_answer", ""),
            "weak_areas":       result.get("weak_areas", []),
            "encouragement":    result.get("encouragement", ""),
            "is_correct":       result.get("is_correct", False),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"মূল্যায়নে সমস্যা: {str(e)}")

@app.post("/api/tutor/followup")
async def followup(req: FollowupRequest):
    try:
        prompt = f"""আগের প্রশ্ন: {req.previous_question}
শিক্ষার্থীর উত্তর: {req.student_answer}
দুর্বল দিক: {', '.join(req.weak_areas)}

ফলো-আপ প্রশ্ন তৈরি করো। শুধু JSON:
{{
  "followup_question": "প্রশ্ন বাংলায়",
  "hints": ["হিন্ট"],
  "easier": true
}}"""
        text   = _generate(prompt)
        result = _parse_json(text) or {}
        return {
            "success":          True,
            "followup_question": result.get("followup_question", text),
            "hints":             result.get("hints", []),
            "easier":            result.get("easier", True),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ফলো-আপ সমস্যা: {str(e)}")

@app.get("/api/tutor/subjects")
async def get_subjects():
    return {
        "subjects": {"physics":"পদার্থবিজ্ঞান","chemistry":"রসায়ন","math":"গণিত"},
        "curriculum": {}
    }

# ── PROGRESS ROUTES ──────────────────────────────────────────
@app.post("/api/progress/save")
async def save_progress(data: dict):
    try:
        supa = get_supa()
        supa.table("sessions").insert(data).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/progress/report/{student_id}")
async def get_report(student_id: str):
    try:
        supa = get_supa()
        res  = supa.table("sessions").select("*").eq("student_id", student_id).execute()
        rows = res.data or []
        total   = len(rows)
        avg     = round(sum(r.get("percentage",0) for r in rows) / total) if total else 0
        subjects = {s:{"score":0,"sessions":0} for s in ["physics","chemistry","math"]}
        for r in rows:
            s = r.get("subject","")
            if s in subjects:
                subjects[s]["sessions"] += 1
                subjects[s]["score"]    += r.get("percentage", 0)
        for s in subjects:
            n = subjects[s]["sessions"]
            if n: subjects[s]["score"] = round(subjects[s]["score"] / n)
        return {"success":True,"report":{"total_sessions":total,"average_score":avg,"subjects":subjects,"weak_areas":[]}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/dashboard")
async def admin_dashboard():
    try:
        supa = get_supa()
        profiles = supa.table("profiles").select("*").eq("role","student").execute().data or []
        sessions = supa.table("sessions").select("*").execute().data or []
        total_s  = len(sessions)
        overall  = round(sum(r.get("percentage",0) for r in sessions)/total_s) if total_s else 0
        students_out = []
        for p in profiles:
            pid  = p["id"]
            sess = [r for r in sessions if r.get("student_id")==pid]
            n    = len(sess)
            avg  = round(sum(r.get("percentage",0) for r in sess)/n) if n else 0
            def subj_avg(s): 
                ss=[r for r in sess if r.get("subject")==s]
                return round(sum(r.get("percentage",0) for r in ss)/len(ss)) if ss else 0
            students_out.append({
                "id":p["id"],"name":p.get("name",""),"email":p.get("email",""),
                "grade":p.get("grade","SSC"),"total_sessions":n,"avg_score":avg,
                "physics_avg":subj_avg("physics"),"chemistry_avg":subj_avg("chemistry"),"math_avg":subj_avg("math")
            })
        return {"success":True,"total_students":len(profiles),"total_sessions":total_s,
                "overall_avg":overall,"students":students_out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class MCQRequest(BaseModel):
    student_id: str
    grade: str
    subject: str
    chapter_id: str
    count: int = 10

@app.post("/api/tutor/mcq")
async def generate_mcq(req: MCQRequest):
    try:
        ctx = _get_nctb_context(req.subject, req.chapter_id)
        prompt = f"""বিষয়: {req.subject}, শ্রেণি: {req.grade}, অধ্যায়: {req.chapter_id}
NCTB প্রসঙ্গ: {ctx}

এই অধ্যায় থেকে ঠিক {req.count}টি MCQ তৈরি করো।
প্রতিটিতে ৪টি option (A, B, C, D) এবং একটি সঠিক উত্তর থাকবে।
শুধু নিচের JSON format এ দাও, আর কিছু না:
{{
  "questions": [
    {{
      "question": "প্রশ্ন বাংলায়",
      "options": ["option A বাংলায়", "option B বাংলায়", "option C বাংলায়", "option D বাংলায়"],
      "correct_answer": "A",
      "explanation": "কেন এটি সঠিক তার ব্যাখ্যা বাংলায়"
    }}
  ]
}}"""
        text   = _generate(prompt)
        result = _parse_json(text) or {}
        questions = result.get("questions", [])
        clean = []
        for q in questions[:req.count]:
            if q.get("question") and len(q.get("options", [])) == 4 and q.get("correct_answer"):
                clean.append({
                    "question":       q["question"],
                    "options":        q["options"],
                    "correct_answer": q["correct_answer"].upper().strip(),
                    "explanation":    q.get("explanation", "")
                })
        if not clean:
            raise HTTPException(status_code=500, detail=f"MCQ parse failed. Raw: {text[:500]}")
        return {"success": True, "questions": clean, "count": len(clean)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCQ error: {str(e)}")

# ── Mangum Handler for Vercel ────────────────────────────────
handler = Mangum(app, lifespan="off")
