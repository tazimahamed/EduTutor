// ─── MCQ Module ───────────────────────────────────────────────
let mcqQuestions    = [];   // full list from AI
let mcqAnswers      = {};   // { index: 'A'|'B'|'C'|'D' }
let mcqWrongIndexes = [];   // indexes of wrong answers for retry

// ── Load MCQs from backend ────────────────────────────────────
async function loadMCQ(subject, chapter) {
  // Show loading, hide quiz & result
  document.getElementById('mcq-loading').style.display  = 'block';
  document.getElementById('mcq-quiz').style.display     = 'none';
  document.getElementById('mcq-result').style.display   = 'none';
  document.getElementById('mcq-back-btn').style.display = 'block';

  mcqQuestions = [];
  mcqAnswers   = {};

  try {
    const data = await apiCall('/tutor/mcq', {
      student_id:  localStorage.getItem('user_id') || 'guest',
      grade:       localStorage.getItem('user_grade') || 'SSC',
      subject:     subject,
      chapter_id:  chapter,
      count:       10
    });
    mcqQuestions = data.questions || [];
    if (!mcqQuestions.length) throw new Error('প্রশ্ন পাওয়া যায়নি।');
    renderMCQQuiz();
  } catch(err) {
    document.getElementById('mcq-loading').innerHTML =
      `<p style="color:red;text-align:center">MCQ লোড হয়নি: ${err.message}</p>
       <button class="btn btn-outline" style="margin:16px auto;display:block" onclick="loadMCQ('${subject}','${chapter}')">আবার চেষ্টা করো</button>`;
  }
}

// ── Render Quiz ───────────────────────────────────────────────
function renderMCQQuiz(questionSubset) {
  const questions = questionSubset || mcqQuestions;
  mcqAnswers = {};

  document.getElementById('mcq-loading').style.display = 'none';
  document.getElementById('mcq-quiz').style.display    = 'block';
  document.getElementById('mcq-result').style.display  = 'none';
  document.getElementById('mcq-back-btn').style.display = 'block';

  // chapter label
  document.getElementById('mcq-chapter-label').textContent = currentChapter;

  // reset progress bar
  document.getElementById('mcq-progress-fill').style.width = '0%';

  const container = document.getElementById('mcq-questions-list');
  container.innerHTML = '';

  questions.forEach((q, i) => {
    const optionLetters = ['A','B','C','D'];
    const optionsHTML = (q.options || []).map((opt, oi) => `
      <label class="mcq-option" id="opt-${i}-${optionLetters[oi]}" data-q="${i}" data-letter="${optionLetters[oi]}">
        <span class="mcq-option-letter">${optionLetters[oi]}</span>
        <span class="mcq-option-text">${opt}</span>
        <span class="mcq-option-mark"></span>
      </label>
    `).join('');

    container.innerHTML += `
      <div class="mcq-card" id="mcq-card-${i}">
        <div class="mcq-q-header">
          <span class="mcq-q-num">${i + 1}</span>
          <p class="mcq-q-text">${q.question}</p>
        </div>
        <div class="mcq-options" id="opts-${i}">
          ${optionsHTML}
        </div>
      </div>
    `;
  });

  // Attach click handlers
  container.querySelectorAll('.mcq-option').forEach(label => {
    label.addEventListener('click', () => selectOption(label, questions));
  });

  // Show submit button
  document.getElementById('mcq-submit-btn').style.display = 'block';
  document.getElementById('mcq-submit-btn').disabled = false;
  document.getElementById('mcq-submit-btn').textContent = 'উত্তর জমা দাও ✅';
}

// ── Select an option ──────────────────────────────────────────
function selectOption(label, questions) {
  const qi     = parseInt(label.dataset.q);
  const letter = label.dataset.letter;

  // Deselect all in this question
  document.querySelectorAll(`[data-q="${qi}"]`).forEach(l => l.classList.remove('selected'));

  // Select clicked
  label.classList.add('selected');
  mcqAnswers[qi] = letter;

  // Update progress bar
  const answered = Object.keys(mcqAnswers).length;
  const total    = questions.length;
  document.getElementById('mcq-progress-fill').style.width = `${Math.round((answered / total) * 100)}%`;
}

// ── Submit MCQ ────────────────────────────────────────────────
function submitMCQ() {
  const total     = mcqQuestions.length;
  const answered  = Object.keys(mcqAnswers).length;

  if (answered < total) {
    const unanswered = total - answered;
    if (!confirm(`এখনো ${unanswered}টি প্রশ্নের উত্তর দাওনি। তবুও submit করবে?`)) return;
  }

  // Disable back button during review
  document.getElementById('mcq-back-btn').style.display = 'none';

  let correctCount = 0;
  mcqWrongIndexes  = [];

  // Mark each option
  mcqQuestions.forEach((q, i) => {
    const correct   = q.correct_answer;  // 'A','B','C','D'
    const selected  = mcqAnswers[i] || null;
    const isCorrect = selected === correct;
    if (isCorrect) correctCount++;
    else           mcqWrongIndexes.push(i);

    const optLetters = ['A','B','C','D'];
    optLetters.forEach(letter => {
      const el = document.getElementById(`opt-${i}-${letter}`);
      if (!el) return;
      el.style.pointerEvents = 'none'; // lock

      if (letter === correct) {
        el.classList.add('opt-correct');
        el.querySelector('.mcq-option-mark').textContent = '✔️';
      } else if (letter === selected && !isCorrect) {
        el.classList.add('opt-wrong');
        el.querySelector('.mcq-option-mark').textContent = '❌';
      }
    });

    // Show explanation for wrong answers
    if (!isCorrect) {
      const card = document.getElementById(`mcq-card-${i}`);
      const correctText = (q.options || [])[['A','B','C','D'].indexOf(correct)] || '';
      const expDiv = document.createElement('div');
      expDiv.className = 'mcq-explanation';
      expDiv.innerHTML = `
        <p><strong>সঠিক উত্তর:</strong> <span class="exp-correct-letter">${correct}</span> — ${correctText}</p>
        <p class="exp-text">📖 ${q.explanation || 'ব্যাখ্যা পাওয়া যায়নি।'}</p>
      `;
      card.appendChild(expDiv);
    }
  });

  const wrongCount = total - correctCount;
  const percentage = Math.round((correctCount / total) * 100);

  // Show result summary
  showMCQResult(correctCount, wrongCount, total, percentage);

  // Save to progress
  saveSession({
    subject:    currentSubject,
    chapter_id: currentChapter,
    question:   'MCQ (' + currentChapter + ')',
    score:      correctCount,
    max_score:  total,
    percentage: percentage
  }).catch(() => {});

  // Hide submit button, show back button in results
  document.getElementById('mcq-submit-btn').style.display = 'none';
}

// ── Show Result Summary ───────────────────────────────────────
function showMCQResult(correct, wrong, total, pct) {
  document.getElementById('mcq-result').style.display = 'block';
  document.getElementById('mcq-back-btn').style.display = 'none';

  // Scroll to results
  document.getElementById('mcq-result').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Icon & title based on score
  let icon, title;
  if (pct >= 80)      { icon = '🏆'; title = 'অসাধারণ! তুমি দারুণ করেছ!'; }
  else if (pct >= 60) { icon = '👍'; title = 'ভালো করেছ! আরও একটু চেষ্টা করো।'; }
  else if (pct >= 40) { icon = '📚'; title = 'পড়াশোনা আরও বাড়াও।'; }
  else                { icon = '💪'; title = 'হতাশ হয়ো না, আবার চেষ্টা করো!'; }

  document.getElementById('result-icon').textContent        = icon;
  document.getElementById('result-title').textContent       = title;
  document.getElementById('result-score-big').textContent   = `${pct}%`;
  document.getElementById('res-total').textContent          = total;
  document.getElementById('res-correct').textContent        = correct;
  document.getElementById('res-wrong').textContent          = wrong;

  // Color the score
  const scoreBig = document.getElementById('result-score-big');
  scoreBig.className = 'result-score-big ' + (pct >= 70 ? 'score-good' : pct >= 40 ? 'score-mid' : 'score-bad');

  // Build review list (wrong questions only)
  const reviewList = document.getElementById('mcq-review-list');
  reviewList.innerHTML = '';
  if (mcqWrongIndexes.length) {
    reviewList.innerHTML = '<h3 class="review-title">❌ ভুল প্রশ্নগুলোর সমাধান</h3>';
    mcqWrongIndexes.forEach(i => {
      const q = mcqQuestions[i];
      const correctLetter = q.correct_answer;
      const correctText   = (q.options || [])[['A','B','C','D'].indexOf(correctLetter)] || '';
      reviewList.innerHTML += `
        <div class="review-item">
          <p class="review-q"><strong>${i+1}.</strong> ${q.question}</p>
          <p class="review-ans">✅ সঠিক উত্তর: <span class="review-letter">${correctLetter}</span> — ${correctText}</p>
          <p class="review-exp">💡 ${q.explanation || ''}</p>
        </div>
      `;
    });
  } else {
    reviewList.innerHTML = '<p class="all-correct-msg">🎉 সব প্রশ্নের উত্তর সঠিক ছিল!</p>';
  }
}

// ── Retry Wrong Questions ─────────────────────────────────────
function retryWrongQuestions() {
  if (!mcqWrongIndexes.length) {
    alert('কোনো ভুল প্রশ্ন নেই — সব সঠিক ছিল! 🎉');
    return;
  }
  const wrongQuestions = mcqWrongIndexes.map(i => mcqQuestions[i]);
  document.getElementById('mcq-result').style.display = 'none';
  renderMCQQuiz(wrongQuestions);
}
