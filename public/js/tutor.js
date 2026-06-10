// ─── Tutor (CQ mode) ──────────────────────────────────────────
const SUBJECTS = {
  physics:   { name:'⚛️ পদার্থবিজ্ঞান', chapters:['অধ্যায় ১: ভৌত রাশি ও পরিমাপ','অধ্যায় ২: গতি','অধ্যায় ৩: বল','অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি','অধ্যায় ৫: পদার্থের অবস্থা ও চাপ','অধ্যায় ৬: তাপের প্রভাব','অধ্যায় ৭: তরঙ্গ ও শব্দ','অধ্যায় ৮: আলোর প্রতিফলন','অধ্যায় ৯: আলোর প্রতিসরণ','অধ্যায় ১০: স্থির বিদ্যুৎ','অধ্যায় ১১: চল বিদ্যুৎ','অধ্যায় ১২: তড়িৎচৌম্বক','অধ্যায় ১৩: তেজস্ক্রিয়তা'] },
  chemistry: { name:'🧪 রসায়ন',         chapters:['অধ্যায় ১: রসায়নের ধারণা','অধ্যায় ২: পদার্থের অবস্থা','অধ্যায় ৩: পদার্থের গঠন','অধ্যায় ৪: পর্যায় সারণি','অধ্যায় ৫: রাসায়নিক বন্ধন','অধ্যায় ৬: মোলের ধারণা','অধ্যায় ৭: রাসায়নিক বিক্রিয়া','অধ্যায় ৮: রসায়ন ও শক্তি','অধ্যায় ৯: এসিড-ক্ষারক','অধ্যায় ১০: ধাতু-অধাতু','অধ্যায় ১১: জীবাশ্ম জ্বালানি','অধ্যায় ১২: আমাদের জীবনে রসায়ন'] },
  math:      { name:'📐 গণিত',           chapters:['অধ্যায় ১: বাস্তব সংখ্যা','অধ্যায় ২: সেট ও ফাংশন','অধ্যায় ৩: বীজগাণিতিক রাশি','অধ্যায় ৪: সরল সমীকরণ','অধ্যায় ৫: দ্বিঘাত সমীকরণ','অধ্যায় ৬: জ্যামিতি','অধ্যায় ৭: ত্রিকোণমিতি','অধ্যায় ৮: পরিমিতি','অধ্যায় ৯: পরিসংখ্যান'] }
};
const BLOOM_NAMES = ['মনে রাখো','বুঝো','প্রয়োগ করো','বিশ্লেষণ করো','মূল্যায়ন করো','সৃষ্টি করো'];

let currentSubject  = '';
let currentChapter  = '';
let currentQuestion = null;
let currentBloom    = 0;
let hintIndex       = 0;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  currentSubject = localStorage.getItem('selected_subject') || 'physics';
  const subj = SUBJECTS[currentSubject];
  document.getElementById('subject-title').textContent = subj.name;
  renderChapters(subj.chapters);
});

function renderChapters(chapters) {
  const list = document.getElementById('chapter-list');
  list.innerHTML = '';
  chapters.forEach(ch => {
    const btn = document.createElement('button');
    btn.className   = 'chapter-btn';
    btn.textContent = ch;
    btn.onclick     = () => showModeSelect(ch);
    list.appendChild(btn);
  });
}

// ── Mode Selection ────────────────────────────────────────────
function showModeSelect(chapter) {
  currentChapter = chapter;
  document.getElementById('chapter-section').style.display  = 'none';
  document.getElementById('mode-section').style.display     = 'block';
  document.getElementById('selected-chapter-name').textContent = '📖 ' + chapter;
}

function goBackToChapters() {
  document.getElementById('mode-section').style.display    = 'none';
  document.getElementById('chapter-section').style.display = 'block';
}

function goBackToMode() {
  document.getElementById('question-section').style.display = 'none';
  document.getElementById('mcq-section').style.display      = 'none';
  document.getElementById('mode-section').style.display     = 'block';
  // Reset MCQ state
  document.getElementById('mcq-loading').style.display = 'block';
  document.getElementById('mcq-quiz').style.display    = 'none';
  document.getElementById('mcq-result').style.display  = 'none';
  document.getElementById('mcq-back-btn').style.display = 'block';
}

// ── CQ Mode ───────────────────────────────────────────────────
function startCQ() {
  currentBloom = 0;
  document.getElementById('mode-section').style.display    = 'none';
  document.getElementById('question-section').style.display = 'block';
  loadQuestion();
}

async function loadQuestion() {
  document.getElementById('loading-question').style.display = 'block';
  document.getElementById('question-text').style.display    = 'none';
  document.getElementById('feedback-section').style.display = 'none';
  document.getElementById('hints-section').style.display    = 'none';
  document.getElementById('hint-text').style.display        = 'none';
  document.getElementById('answer-input').value             = '';
  hintIndex = 0;
  document.getElementById('bloom-badge').textContent = BLOOM_NAMES[currentBloom] || 'মনে রাখো';

  try {
    const data = await apiCall('/tutor/start-session', {
      student_id:     localStorage.getItem('user_id') || 'guest',
      student_name:   localStorage.getItem('user_name') || 'Student',
      grade:          localStorage.getItem('user_grade') || 'SSC',
      subject:        currentSubject,
      chapter_id:     currentChapter,
      previous_score: 0
    });
    currentQuestion = data;
    document.getElementById('question-text').textContent = data.question;
    document.getElementById('marks-badge').textContent   = (data.marks || 5) + ' নম্বর';
    document.getElementById('loading-question').style.display = 'none';
    document.getElementById('question-text').style.display    = 'block';
    if (data.hints && data.hints.length)
      document.getElementById('hints-section').style.display = 'block';
  } catch(err) {
    document.getElementById('loading-question').innerHTML =
      `<p style="color:red">প্রশ্ন লোড হয়নি: ${err.message}</p>`;
  }
}

function showHint() {
  if (!currentQuestion?.hints) return;
  const hints = currentQuestion.hints;
  if (hintIndex < hints.length) {
    document.getElementById('hint-text').textContent    = '💡 ' + hints[hintIndex++];
    document.getElementById('hint-text').style.display = 'block';
  }
}

async function submitAnswer() {
  const answer = document.getElementById('answer-input').value.trim();
  if (!answer) { alert('উত্তর লিখো!'); return; }
  const btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = 'মূল্যায়ন হচ্ছে...';
  try {
    const data = await apiCall('/tutor/evaluate', {
      student_id:        localStorage.getItem('user_id') || 'guest',
      subject:           currentSubject,
      chapter_id:        currentChapter,
      question:          currentQuestion.question,
      student_answer:    answer,
      expected_keywords: currentQuestion.expected_keywords || [],
      bloom_level:       currentBloom + 1,
      marks:             currentQuestion.marks || 5
    });
    document.getElementById('score-display').textContent      = `${data.score}/${data.max_score} নম্বর (${data.percentage}%)`;
    document.getElementById('feedback-text').textContent      = data.feedback_bengali || '';
    document.getElementById('correct-answer').textContent     = data.correct_answer ? '✅ সঠিক উত্তর: ' + data.correct_answer : '';
    document.getElementById('encouragement-text').textContent = data.encouragement || '';
    document.getElementById('feedback-section').style.display = 'block';
    if (data.percentage >= 70 && currentBloom < 5) currentBloom++;
    await saveSession({
      subject: currentSubject, chapter_id: currentChapter,
      question: currentQuestion.question, student_answer: answer,
      score: data.score, max_score: data.max_score, percentage: data.percentage
    });
  } catch(err) { alert('মূল্যায়ন হয়নি: ' + err.message); }
  finally { btn.disabled = false; btn.textContent = 'উত্তর জমা দাও'; }
}

function nextQuestion() { loadQuestion(); }

async function getFollowup() {
  const answer = document.getElementById('answer-input').value.trim();
  try {
    const data = await apiCall('/tutor/followup', {
      student_id:        localStorage.getItem('user_id') || 'guest',
      subject:           currentSubject,
      chapter_id:        currentChapter,
      previous_question: currentQuestion.question,
      student_answer:    answer,
      weak_areas:        [],
      bloom_level:       currentBloom + 1,
    });
    currentQuestion = { question: data.followup_question, hints: data.hints||[], marks:5, expected_keywords:[] };
    document.getElementById('question-text').textContent      = data.followup_question;
    document.getElementById('feedback-section').style.display = 'none';
    document.getElementById('answer-input').value             = '';
  } catch(err) { alert('ফলো-আপ আনা যায়নি।'); }
}

// ── MCQ Mode entry ────────────────────────────────────────────
function startMCQ() {
  document.getElementById('mode-section').style.display = 'none';
  document.getElementById('mcq-section').style.display  = 'block';
  loadMCQ(currentSubject, currentChapter);
}
