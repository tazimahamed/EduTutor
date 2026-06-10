// ─── Progress ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  const studentId = localStorage.getItem('user_id') || '';
  try {
    const data   = await apiCall(`/progress/report/${studentId}`);
    const report = data.report;
    document.getElementById('total-sessions').textContent = report.total_sessions || '০';
    document.getElementById('avg-score').textContent      = (report.average_score || 0) + '%';
    const names = { physics:'⚛️ পদার্থবিজ্ঞান', chemistry:'🧪 রসায়ন', math:'📐 গণিত' };
    const list  = document.getElementById('subject-progress');
    list.innerHTML = '';
    Object.entries(report.subjects || {}).forEach(([key, val]) => {
      const score  = val.score || 0;
      const status = score>=70?'✅ ভালো করছ': score>=50?'⚠️ উন্নতি দরকার':'❌ বেশি মনোযোগ দরকার';
      list.innerHTML += `
        <div class="subject-progress-item">
          <h4>${names[key]||key}</h4>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${score}%"></div></div>
          <p style="font-size:13px;color:#888;margin-top:6px">${score}% · ${val.sessions||0} সেশন · ${status}</p>
        </div>`;
    });
    document.getElementById('loading-progress').style.display = 'none';
    document.getElementById('progress-content').style.display = 'block';
  } catch(err) {
    document.getElementById('loading-progress').innerHTML = '<p>লোড হয়নি: ' + err.message + '</p>';
  }
});
