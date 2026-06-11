// ─── Leaderboard ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  const myName = localStorage.getItem('user_name') || '';
  try {
    const data  = await apiCall('/leaderboard');
    const board = data.leaderboard || [];

    // Podium (top 3)
    const podium  = document.getElementById('lb-podium');
    const order   = [1, 0, 2]; // 2nd, 1st, 3rd
    const classes = ['rank-2', 'rank-1', 'rank-3'];
    order.forEach((idx, ci) => {
      if (!board[idx]) return;
      const b   = board[idx];
      const init= b.name ? b.name[0].toUpperCase() : '?';
      podium.innerHTML += `
        <div class="podium-item ${classes[ci]}">
          <div class="podium-avatar">${init}</div>
          <div class="podium-name">${b.name}</div>
          <div class="podium-score">${b.avg_score}% গড়</div>
          <div class="podium-block"><div class="podium-rank">${b.rank}</div></div>
        </div>`;
    });

    // Full list (rank 4+)
    const list = document.getElementById('lb-list');
    board.slice(3).forEach(b => {
      const isMe = b.name === myName;
      const init = b.name ? b.name[0].toUpperCase() : '?';
      list.innerHTML += `
        <div class="lb-item${isMe?' me':''}">
          <div class="lb-rank${b.rank<=3?' top3':''}">#${b.rank}</div>
          <div class="lb-avatar">${init}</div>
          <div class="lb-info">
            <div class="lb-name">${b.name}${isMe?'<span class="me-badge">তুমি</span>':''}</div>
            <div class="lb-meta">${b.grade} · ${b.total_sessions} সেশন</div>
          </div>
          <div class="lb-score">
            <div class="lb-points">${b.total_points}</div>
            <div class="lb-pts-label">পয়েন্ট</div>
          </div>
        </div>`;
    });

    // Show my position if not in top list
    const me = board.find(b => b.name === myName);
    if (me && me.rank > 3) {
      const init = me.name[0].toUpperCase();
      document.getElementById('lb-list').innerHTML += `
        <div style="text-align:center;padding:8px;color:#888;font-size:13px;">· · ·</div>
        <div class="lb-item me">
          <div class="lb-rank">#${me.rank}</div>
          <div class="lb-avatar">${init}</div>
          <div class="lb-info">
            <div class="lb-name">${me.name}<span class="me-badge">তুমি</span></div>
            <div class="lb-meta">${me.grade} · ${me.total_sessions} সেশন</div>
          </div>
          <div class="lb-score">
            <div class="lb-points">${me.total_points}</div>
            <div class="lb-pts-label">পয়েন্ট</div>
          </div>
        </div>`;
    }

    document.getElementById('loading-lb').style.display  = 'none';
    document.getElementById('lb-content').style.display  = 'block';
  } catch(err) {
    document.getElementById('loading-lb').innerHTML = '<p>লোড হয়নি: ' + err.message + '</p>';
  }
});
