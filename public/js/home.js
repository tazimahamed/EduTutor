// ─── Home ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  const name = localStorage.getItem('user_name') || 'শিক্ষার্থী';
  document.getElementById('user-name').textContent  = name;
  document.getElementById('user-name-2').textContent = name;
});

function goToTutor(subject) {
  localStorage.setItem('selected_subject', subject);
  window.location.href = '/tutor.html';
}
