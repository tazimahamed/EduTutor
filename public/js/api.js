// ─── EduTutor BD — API Helper (Vercel + Supabase version) ───
const API = '/api';   // All calls go to Vercel serverless

async function apiCall(endpoint, body = null, method = null) {
    const token   = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const m       = method || (body ? 'POST' : 'GET');
    const options = { method: m, headers };
    if (body) options.body = JSON.stringify(body);

    const res  = await fetch(API + endpoint, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || 'সার্ভার error');
    return data;
}

// ── Aliases ──────────────────────────────────────────────────
const phpCall = (ep, body) => apiCall(ep.replace('/auth.php?action=', '/auth/').replace('/progress.php?action=', '/progress/').replace('/admin.php?action=', '/admin/'), body);
const pyCall  = apiCall;

// ── UI Helpers ───────────────────────────────────────────────
function showError(msg) {
    const el = document.getElementById('error-msg');
    if (el) { el.textContent = '❌ ' + msg; el.style.display = 'block'; }
}
function showSuccess(msg) {
    const el = document.getElementById('success-msg');
    if (el) { el.textContent = '✅ ' + msg; el.style.display = 'block'; }
}
function hideMessages() {
    ['error-msg','success-msg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}
function setLoading(btnId, loading, text = '') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled    = loading;
    btn.textContent = loading ? 'অপেক্ষা করুন...' : (text || btn.dataset.text || text);
}
function checkAuth() {
    if (!localStorage.getItem('access_token'))
        window.location.href = '/index.html';
}
function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}
async function saveSession(sd) {
    const student_id = localStorage.getItem('user_id');
    if (!student_id) return;
    try {
        await apiCall('/progress/save', { student_id, ...sd });
    } catch(e) { console.log('Session save:', e.message); }
}
