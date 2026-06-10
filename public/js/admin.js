// ─── Admin Dashboard ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const role = localStorage.getItem('user_role');
  if (role !== 'admin') { window.location.href = '/index.html'; return; }
  document.getElementById('admin-name').textContent = localStorage.getItem('user_name') || 'Admin';
  try {
    const data = await apiCall('/admin/dashboard');
    document.getElementById('total-students').textContent = data.total_students || '০';
    document.getElementById('total-sessions').textContent = data.total_sessions || '০';
    document.getElementById('overall-avg').textContent    = (data.overall_avg || 0) + '%';
    const list = document.getElementById('student-list');
    list.innerHTML = '';
    if (data.students?.length) {
      data.students.forEach(s => {
        const avg    = s.avg_score || 0;
        const status = avg>=70?'✅ ভালো': avg>=50?'⚠️ মাঝারি':'❌ দুর্বল';
        list.innerHTML += `
          <div class="subject-progress-item" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <h4 style="margin:0">${s.name}</h4><span style="font-size:13px;color:#888">${s.email}</span>
            </div>
            <div style="display:flex;gap:16px;font-size:13px;color:#888;margin:8px 0">
              <span>📚 ${s.total_sessions||0} সেশন</span>
              <span>📊 গড়: ${avg}%</span><span>${status}</span><span>🎓 ${s.grade||'SSC'}</span>
            </div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${avg}%"></div></div>
            <div style="display:flex;gap:8px;margin-top:8px;font-size:12px;color:#888">
              <span>⚛️ ${s.physics_avg||0}%</span><span>🧪 ${s.chemistry_avg||0}%</span><span>📐 ${s.math_avg||0}%</span>
            </div>
          </div>`;
      });
    } else list.innerHTML = '<p style="color:#888;text-align:center">এখনো কোনো শিক্ষার্থী নেই।</p>';
    document.getElementById('loading-admin').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
  } catch(err) {
    document.getElementById('loading-admin').innerHTML = '<p>লোড হয়নি: ' + err.message + '</p>';
  }
});
