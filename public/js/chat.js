let currentSubject = 'physics';

function setSubject(s, el) {
  currentSubject = s;
  document.querySelectorAll('.subject-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function getTime() {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

function addMsg(text, type) {
  const box  = document.getElementById('chat-messages');
  const icon = type === 'user' ? '🧑‍🎓' : '🤖';
  const div  = document.createElement('div');
  div.className = `msg ${type}`;
  div.innerHTML = `
    <div class="msg-avatar">${icon}</div>
    <div>
      <div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div>
      <div class="msg-time">${getTime()}</div>
    </div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function showTyping() {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = 'typing-msg';
  div.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing-msg');
  if (t) t.remove();
}

async function sendMsg() {
  const input = document.getElementById('chat-input');
  const btn   = document.getElementById('send-btn');
  const text  = input.value.trim();
  if (!text) return;

  addMsg(text, 'user');
  input.value = '';
  btn.disabled = true;
  showTyping();

  try {
    const grade = localStorage.getItem('user_grade') || 'SSC';
    const data  = await apiCall('/chat', { message: text, subject: currentSubject, grade }, 'POST');
    removeTyping();
    addMsg(data.reply, 'ai');
  } catch(e) {
    removeTyping();
    addMsg('দুঃখিত, উত্তর দিতে পারিনি। আবার চেষ্টা করো।', 'ai');
  }
  btn.disabled = false;
  input.focus();
}

function sendQuick(q) {
  document.getElementById('chat-input').value = q;
  sendMsg();
}

document.addEventListener('DOMContentLoaded', () => { checkAuth(); });
