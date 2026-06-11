// ─── Home ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  const name = localStorage.getItem('user_name') || 'শিক্ষার্থী';
  document.getElementById('user-name').textContent  = name;
  document.getElementById('user-name-2').textContent = name;

  const studentId = localStorage.getItem('user_id') || '';

  // Load streak
  try {
    const s = await apiCall(`/progress/streak/${studentId}`);
    document.getElementById('streak-num').textContent = s.streak || '০';
    document.getElementById('streak-right').textContent =
      s.streak > 0
        ? `মোট ${s.total_days} দিন পড়েছো 🎉`
        : 'আজই পড়া শুরু করো!';
  } catch(e) {
    document.getElementById('streak-right').textContent = '';
  }

  // Daily goal
  const goal    = parseInt(localStorage.getItem('daily_goal') || '3');
  const today   = new Date().toISOString().slice(0,10);
  const todayKey= `sessions_${today}`;
  const done    = parseInt(localStorage.getItem(todayKey) || '0');
  const pct     = Math.min(100, Math.round((done/goal)*100));

  document.getElementById('goal-badge').textContent = `${done}/${goal} সেশন`;
  document.getElementById('goal-bar').style.width   = pct + '%';
  document.getElementById('goal-btns').style.display = 'flex';

  if (done >= goal) {
    document.getElementById('goal-text').textContent = '🎉 আজকের লক্ষ্য পূরণ হয়েছে! দারুণ!';
    document.getElementById('goal-text').style.color = '#1D9E75';
  } else {
    const left = goal - done;
    document.getElementById('goal-text').textContent = `আরো ${left}টি সেশন করলে আজকের লক্ষ্য পূরণ হবে!`;
  }
});

function goToTutor(subject) {
  localStorage.setItem('selected_subject', subject);
  window.location.href = '/tutor.html';
}

function changeGoal() {
  const g = prompt('দৈনিক কতটি সেশন করতে চাও? (১-১০)', localStorage.getItem('daily_goal') || '3');
  if (g && parseInt(g) > 0 && parseInt(g) <= 10) {
    localStorage.setItem('daily_goal', g);
    location.reload();
  }
}
