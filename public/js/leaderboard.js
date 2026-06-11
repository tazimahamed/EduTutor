// ─── Leaderboard ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  const myName = localStorage.getItem('user_name') || '';
  try {
    const data  = await apiCall('/leaderboard');
    const board = data.leaderboard || [];

    // Hero stats
    const totalSessions = board.reduce((a,b) => a + b.total_sessions, 0);
    const overallAvg    = board.length
      ? Math.round(board.reduce((a,b) => a + b.avg_score, 0) / board.length)
      : 0;
    document.getElementById('hero-students').textContent = board.length;
    document.getElementById('hero-sessions').textContent = totalSessions;
    document.getElementById('hero-avg').textContent      = overallAvg + '%';

    // Podium (top 3) — order: 2nd, 1st, 3rd
    const podium  = document.getElementById('lb-podium');
    const order   = [1, 0, 2];
    const classes = ['rank-2', 'rank-1', 'rank-3'];
    const crowns  = ['🥈', '🥇', '🥉'];
    const avCls   = ['av-2', 'av-1', 'av-3'];

    order.forEach((idx, ci) => {
      if (!board[idx]) return;
      const b   = board[idx];
      const init= b.name ? b.name[0].toUpperCase() : '?';
      podium.innerHTML += `
        <div class="podium-item ${classes[ci]}">
          <span class="podium-crown">${crowns[ci]}</span>
          <div class="podium-avatar ${avCls[ci]}">${init}</div>
          <div class="podium-name" title="${b.name}">${b.name}</div>
          <div class="podium-score">${b.avg_score}% · ${b.total_sessions} সেশন</div>
          <div class="podium-block">
            <div class="podium-rank-num">${b.rank}</div>
          </div>
        </div>`;
    });

    // Full list
    const list = document.getElementById('lb-list');
    let myShown = false;

    board.forEach((b, i) => {
      const isMe = b.name === myName;
      if (isMe) myShown = true;
      const init   = b.name ? b.name[0].toUpperCase() : '?';
      const avCl   = i===0?'av-1':i===1?'av-2':i===2?'av-3':i===3?'av-4':i===4?'av-5':'';
      const rankCl = i < 4 ? 'gold' : '';
      const itemCl = isMe ? 'me' : i < 4 ? 'top4' : '';

      list.innerHTML += `
        <div class="lb-item ${itemCl}">
          <div class="lb-rank-wrap">
            <div class="lb-rank ${rankCl}">#${b.rank}</div>
          </div>
          <div class="lb-avatar ${avCl}">${init}</div>
          <div class="lb-info">
            <div class="lb-name">
              ${b.name}
              ${isMe ? '<span class="me-badge">তুমি</span>' : ''}
            </div>
            <div class="lb-meta">${b.grade} · ${b.total_sessions} সেশন · ${b.avg_score}% গড়</div>
          </div>
          <div class="lb-right">
            <div class="lb-points">${b.total_points}</div>
            <div class="lb-pts-label">পয়েন্ট</div>
          </div>
        </div>`;
    });

    // If I'm not visible, show my position at bottom
    const me = board.find(b => b.name === myName);
    if (me && !myShown) {
      const init = me.name[0].toUpperCase();
      list.innerHTML += `
        <div class="lb-divider">· · ·</div>
        <div class="lb-item me">
          <div class="lb-rank-wrap"><div class="lb-rank">#${me.rank}</div></div>
          <div class="lb-avatar">${init}</div>
          <div class="lb-info">
            <div class="lb-name">${me.name}<span class="me-badge">তুমি</span></div>
            <div class="lb-meta">${me.grade} · ${me.total_sessions} সেশন · ${me.avg_score}% গড়</div>
          </div>
          <div class="lb-right">
            <div class="lb-points">${me.total_points}</div>
            <div class="lb-pts-label">পয়েন্ট</div>
          </div>
        </div>`;
    }

    document.getElementById('loading-lb').style.display = 'none';
    document.getElementById('lb-content').style.display = 'block';
  } catch(err) {
    document.getElementById('loading-lb').innerHTML = '<p style="color:red">লোড হয়নি: ' + err.message + '</p>';
  }
});
