(function () {
  const { api, escapeHtml, toast } = window.App;

  if (!window.App.requireStudent()) return;
  window.App.protectContent();

  const params = new URLSearchParams(location.search);
  const examId = params.get('exam');
  const examArea = document.getElementById('examArea');
  const introCard = document.getElementById('introCard');
  const questionsEl = document.getElementById('questions');
  const alertBox = document.getElementById('alertBox');
  const timerEl = document.getElementById('timer');
  let timerId = null;
  let remaining = 0;
  let submitting = false;

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return m + ':' + s;
  }

  function renderQuestions(questions) {
    questionsEl.innerHTML = questions
      .map((q, idx) => {
        const options = ['A', 'B', 'C', 'D']
          .map(
            (key) =>
              '<label class="option" data-q="' + q.id + '" data-opt="' + key + '">' +
              '<input type="radio" name="q_' + q.id + '" value="' + key + '" />' +
              '<span><strong>' + key + '.</strong> ' + escapeHtml(q.options[key]) + '</span>' +
              '</label>'
          )
          .join('');
        return (
          '<div class="question">' +
          '<p class="q-text">' + (idx + 1) + '. ' + escapeHtml(q.text) + '</p>' +
          options +
          '</div>'
        );
      })
      .join('');

    questionsEl.addEventListener('change', (e) => {
      if (e.target.matches('input[type=radio]')) {
        const group = e.target.name;
        questionsEl
          .querySelectorAll('input[name="' + group + '"]')
          .forEach((input) => input.closest('.option').classList.remove('selected'));
        e.target.closest('.option').classList.add('selected');
      }
    });
  }

  function startTimer(minutes) {
    remaining = minutes * 60;
    timerEl.textContent = 'Time left: ' + formatTime(remaining);
    timerId = setInterval(() => {
      remaining -= 1;
      timerEl.textContent = 'Time left: ' + formatTime(remaining);
      if (remaining <= 60) timerEl.classList.add('low');
      if (remaining <= 0) {
        clearInterval(timerId);
        toast('Time is up. Submitting your examination.', 'warn');
        submitExam(true);
      }
    }, 1000);
  }

  function collectAnswers() {
    const answers = {};
    questionsEl.querySelectorAll('input[type=radio]:checked').forEach((input) => {
      answers[input.name.replace('q_', '')] = input.value;
    });
    return answers;
  }

  async function submitExam(auto) {
    if (submitting) return;
    if (!auto) {
      const answered = questionsEl.querySelectorAll('input[type=radio]:checked').length;
      const total = questionsEl.querySelectorAll('.question').length;
      if (!confirm('You have answered ' + answered + ' of ' + total + ' questions. Submit now?')) return;
    }
    submitting = true;
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Scoring...';
    if (timerId) clearInterval(timerId);

    try {
      const result = await api('/exams/' + examId + '/submit', {
        method: 'POST',
        auth: true,
        body: { answers: collectAnswers() },
      });
      showResult(result);
    } catch (err) {
      alertBox.innerHTML = '<div class="alert error">' + escapeHtml(err.message) + '</div>';
      submitting = false;
      btn.disabled = false;
      btn.textContent = 'Submit examination';
    }
  }

  function showResult(result) {
    examArea.classList.add('hidden');
    introCard.classList.add('hidden');
    const resultArea = document.getElementById('resultArea');
    resultArea.classList.remove('hidden');
    document.getElementById('scoreText').textContent =
      'You scored ' + result.score + ' / ' + result.total + ' (' + result.percentage + '%)';
    document.getElementById('scoreSub').textContent =
      result.percentage >= 50 ? 'Well done. Review the explanations below.' : 'Keep studying and try again.';

    document.getElementById('review').innerHTML = result.review
      .map((r, idx) => {
        const opts = ['A', 'B', 'C', 'D']
          .map((key) => {
            const classes = ['option'];
            if (key === r.correctOption) classes.push('result-correct');
            if (key === r.selected && key !== r.correctOption) classes.push('result-wrong');
            return (
              '<div class="' + classes.join(' ') + '"><span><strong>' + key + '.</strong> ' +
              escapeHtml(r.options[key]) +
              (key === r.correctOption ? ' <span class="ok">(correct answer)</span>' : '') +
              '</span></div>'
            );
          })
          .join('');
        return (
          '<div class="question">' +
          '<p class="q-text">' + (idx + 1) + '. ' + escapeHtml(r.text) + '</p>' +
          opts +
          '<div class="answer-key">Your answer: <span class="' +
          (r.isCorrect ? 'ok' : 'no') + '">' + (r.selected || 'Not answered') + '</span>. ' +
          'Correct answer: <span class="ok">' + r.correctOption + '</span>.<br>' +
          '<strong>Explanation:</strong> ' + escapeHtml(r.explanation) + '</div>' +
          '</div>'
        );
      })
      .join('');
    window.scrollTo(0, 0);
  }

  async function load() {
    if (!examId) {
      introCard.innerHTML = '<div class="alert error">No exam selected.</div>';
      return;
    }
    try {
      const data = await api('/exams/' + examId + '/questions', { auth: true });
      document.getElementById('examTitle').textContent = data.exam.title;
      document.title = data.exam.title + ' Mock Exam | Exit Exam Prep';
      introCard.innerHTML =
        '<p>This examination has <strong>' + data.questions.length + '</strong> multiple-choice questions and a time limit of <strong>' +
        data.exam.duration + ' minutes</strong>. Choose the best answer for each question. The timer starts now.</p>' +
        '<p class="muted small">Once the time runs out the examination is submitted automatically.</p>' +
        '<button class="btn btn-lg mt" id="beginBtn">Begin examination</button>';
      document.getElementById('beginBtn').addEventListener('click', () => {
        introCard.classList.add('hidden');
        examArea.classList.remove('hidden');
        renderQuestions(data.questions);
        startTimer(data.exam.duration);
      });
      document.getElementById('mockForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitExam(false);
      });
    } catch (err) {
      introCard.innerHTML = '';
      if (err.status === 403) {
        alertBox.innerHTML =
          '<div class="alert error">Access locked. Your payment must be approved first. ' +
          '<a href="payment.html?exam=' + escapeHtml(examId) + '">Go to payment</a> or ' +
          '<a href="dashboard.html">check your status</a>.</div>';
      } else {
        alertBox.innerHTML = '<div class="alert error">' + escapeHtml(err.message) + '</div>';
      }
    }
  }

  load();

  window.addEventListener('beforeunload', (e) => {
    if (timerId && !submitting) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
})();
