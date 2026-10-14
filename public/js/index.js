(function () {
  const { api, money, escapeHtml, Auth, toast } = window.App;

  async function loadConfig() {
    try {
      const cfg = await api('/config');
      ['telebirrInline', 'telebirrInline2'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = cfg.telebirrAccount;
      });
    } catch {
      /* ignore */
    }
  }

  function actionButtons(exam) {
    if (exam.access === 'approved') {
      return (
        '<a class="btn btn-sm" href="exam.html?exam=' + exam.id + '">Open Document</a>' +
        '<a class="btn btn-outline btn-sm" href="mock.html?exam=' + exam.id + '">Start Mock Exam</a>'
      );
    }
    if (exam.access === 'pending') {
      return (
        '<span class="status pending">Pending approval</span>' +
        '<a class="btn btn-ghost btn-sm" href="dashboard.html">View status</a>'
      );
    }
    return '<a class="btn btn-sm" href="payment.html?exam=' + exam.id + '">Pay &amp; Unlock</a>';
  }

  async function loadCatalog() {
    const grid = document.getElementById('catalogGrid');
    try {
      const { exams } = await api('/exams', { auth: Boolean(Auth.studentToken) });
      if (!exams.length) {
        grid.innerHTML = '<p class="muted">No exam packages are available yet.</p>';
        return;
      }
      grid.innerHTML = exams
        .map(
          (exam) =>
            '<article class="card exam-card">' +
            '<span class="dept">' + escapeHtml(exam.department) + '</span>' +
            '<h3>' + escapeHtml(exam.title) + '</h3>' +
            '<p class="muted small">' + escapeHtml(exam.description) + '</p>' +
            '<div class="exam-meta">' +
            '<span>' + exam.questionCount + ' questions</span>' +
            '<span>' + exam.duration + ' minutes</span>' +
            '</div>' +
            '<div class="exam-price">' + money(exam.price) + '</div>' +
            '<div class="actions">' + actionButtons(exam) + '</div>' +
            '</article>'
        )
        .join('');
    } catch (err) {
      grid.innerHTML = '<p class="muted">Could not load packages: ' + escapeHtml(err.message) + '</p>';
      toast(err.message, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    loadCatalog();
  });
})();
