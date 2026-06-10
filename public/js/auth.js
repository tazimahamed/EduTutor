// ─── Login ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('access_token')) {
    const role = localStorage.getItem('user_role');
    window.location.href = role === 'admin' ? '/admin.html' : '/home.html';
  }
  const btn = document.getElementById('login-btn');
  if (btn) btn.dataset.text = 'লগইন করুন';
});

async function handleLogin() {
  hideMessages();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) { showError('ইমেইল ও পাসওয়ার্ড দিন।'); return; }

  setLoading('login-btn', true);
  try {
    const data = await apiCall('/auth/signin', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_id',      data.user_id);
    localStorage.setItem('user_name',    data.user_name);
    localStorage.setItem('user_role',    data.role);
    localStorage.setItem('user_grade',   data.grade);
    window.location.href = data.role === 'admin' ? '/admin.html' : '/home.html';
  } catch (err) {
    showError(err.message || 'লগইন ব্যর্থ হয়েছে।');
  } finally {
    setLoading('login-btn', false, 'লগইন করুন');
  }
}
