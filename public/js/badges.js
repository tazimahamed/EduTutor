document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  const studentId = localStorage.getItem('user_id') || '';
  try {
    const data = await apiCall(`/badges/${studentId}`);
    const pct  = Math.round((data.total_earned / data.total) * 100);

    document.getElementById('badge-prog-fill').style.width = pct + '%';
    document.getElementById('badge-prog-text').textContent =
      `${data.total_earned}/${data.total} Badge অর্জন করেছো (${pct}%)`;
    document.getElementById('earned-count').textContent = data.total_earned;
    document.getElementById('locked-count').textContent = data.locked.length;

    const earnedGrid = document.getElementById('earned-grid');
    data.earned.forEach(b => {
      earnedGrid.innerHTML += `
        <div class="badge-card earned">
          <div class="badge-glow"></div>
          <span class="earned-stamp">✓ অর্জিত</span>
          <span class="badge-icon">${b.icon}</span>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>`;
    });

    if (data.earned.length === 0) {
      earnedGrid.innerHTML = '<p style="color:#aaa;font-size:14px;grid-column:1/-1;text-align:center;padding:20px;">এখনো কোনো badge অর্জন হয়নি। পড়া শুরু করো!</p>';
    }

    const lockedGrid = document.getElementById('locked-grid');
    data.locked.forEach(b => {
      lockedGrid.innerHTML += `
        <div class="badge-card locked">
          <span class="locked-icon">🔒</span>
          <span class="badge-icon">${b.icon}</span>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>`;
    });

    document.getElementById('loading-badges').style.display = 'none';
    document.getElementById('badges-content').style.display = 'block';
  } catch(err) {
    document.getElementById('loading-badges').innerHTML = '<p>লোড হয়নি: ' + err.message + '</p>';
  }
});
