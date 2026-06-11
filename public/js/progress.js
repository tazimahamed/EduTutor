// ─── Progress ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  const studentId = localStorage.getItem('user_id') || '';
  try {
    const [data, streakData, weeklyData] = await Promise.all([
      apiCall(`/progress/report/${studentId}`),
      apiCall(`/progress/streak/${studentId}`),
      apiCall(`/progress/weekly/${studentId}`)
    ]);

    const report = data.report;
    document.getElementById('total-sessions').textContent = report.total_sessions || '০';
    document.getElementById('avg-score').textContent      = (report.average_score || 0) + '%';
    document.getElementById('streak-count').textContent   = (streakData.streak || 0) + ' দিন';

    // Weekly Chart
    const weekly = weeklyData.weekly || [];
    const labels = weekly.map(w => {
      const d = new Date(w.date);
      return ['রবি','সোম','মঙ্গল','বুধ','বৃহ','শুক্র','শনি'][d.getDay()];
    });
    const scores   = weekly.map(w => w.avg_score);
    const sessions = weekly.map(w => w.sessions);

    const ctx = document.getElementById('weeklyChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'গড় স্কোর (%)',
            data: scores,
            backgroundColor: 'rgba(29,158,117,0.7)',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'সেশন সংখ্যা',
            data: sessions,
            type: 'line',
            borderColor: '#EF9F27',
            backgroundColor: 'rgba(239,159,39,0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Hind Siliguri' } } } },
        scales: {
          y:  { position: 'left',  min: 0, max: 100, title: { display: true, text: 'স্কোর %' } },
          y1: { position: 'right', min: 0, grid: { drawOnChartArea: false }, title: { display: true, text: 'সেশন' } }
        }
      }
    });

    // Subject progress
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
