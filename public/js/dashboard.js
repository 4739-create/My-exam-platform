(function () {
  const { api, money, escapeHtml, Auth } = window.App;

  if (!window.App.requireStudent()) return;

  function statusBadge(status) {
    const map = { pending: 'Pending', approved: 'Paid / Approved', rejected: 'Rejected' };
    return '<span class="status ' + status + '">' + (map[status] || status) + '</span>';
  }

  function paymentAction(p) {
    if (p.status === 'approved') {
      return (
        '<a class="btn btn-sm" href="exam.html?exam=' + p.examId + '">Document</a> ' +
        '<a class="btn btn-outline btn-sm" href="mock.html?exam=' + p.examId + '">Mock Exam</a>'
      );
    }
    if (p.status === 'pending') {
      return '<span class="small muted">Awaiting admin verification</span>';
    }
    return '<a class="btn btn-sm" href="payment.html?exam=' + p.examId + '">Try again</a>';
  }

  async function loadPayments() {
    const body = document.getElementById('paymentsBody');
    try {
      const { payments } = await api('/payments/mine', { auth: true });
      if (!payments.length) {
        body.innerHTML =
          '<tr><td colspan="6" class="muted">You have not submitted any payment yet. Choose a package below.</td></tr>';
        return;
      }
      body.innerHTML = payments
        .map(
          (p) =>
            '<tr>' +
            '<td><strong>' + escapeHtml(p.examTitle) + '</strong><br><span class="small muted">' +
            escapeHtml(p.department) + '</span></td>' +
            '<td>' + money(p.amount) + '</td>' +
            '<td><span class="small">' + escapeHtml(p.transactionRef) + '</span></td>' +
            '<td>' + statusBadge(p.status) + (p.note ? '<br><span class="small muted">' + escapeHtml(p.note) + '</span>' : '') + '</td>' +
            '<td class="small">' + escapeHtml((p.submittedAt || '').replace('T', ' ')) + '</td>' +
            '<td>' + paymentAction(p) + '</td>' +
            '</tr>'
        )
        .join('');
    } catch (err) {
      body.innerHTML = '<tr><td colspan="6" class="muted">' + escapeHtml(err.message) + '</td></tr>';
    }
  }

  async function loadCatalog() {
    const grid = document.getElementById('catalogGrid');
    const title = document.getElementById('catalogTitle');
    const subtitle = document.getElementById('catalogSubtitle');
    try {
      const { exams } = await api('/exams', { auth: true });
      const dept = String((Auth.user && Auth.user.department) || '').trim().toLowerCase();
      const mine = dept
        ? exams.filter((exam) => String(exam.department || '').trim().toLowerCase() === dept)
        : exams;
      const list = mine.length ? mine : exams;

      if (title) {
        title.textContent = mine.length ? 'Your department package' : 'Available exam packages';
      }
      if (subtitle) {
        subtitle.textContent = mine.length
          ? 'This package matches the department you selected during registration.'
          : 'No package is available for your department yet. Browse the packages below.';
      }

      grid.innerHTML = list
        .map((exam) => {
          let action;
          if (exam.access === 'approved') {
            action =
              '<a class="btn btn-sm" href="exam.html?exam=' + exam.id + '">Open</a>' +
              '<a class="btn btn-outline btn-sm" href="mock.html?exam=' + exam.id + '">Mock</a>';
          } else if (exam.access === 'pending') {
            action = '<span class="status pending">Pending</span>';
          } else {
            action = '<a class="btn btn-sm" href="payment.html?exam=' + exam.id + '">Pay &amp; Unlock</a>';
          }
          return (
            '<article class="card exam-card">' +
            '<span class="dept">' + escapeHtml(exam.department) + '</span>' +
            '<h3>' + escapeHtml(exam.title) + '</h3>' +
            '<div class="exam-meta"><span>' + exam.questionCount + ' questions</span><span>' + exam.duration + ' min</span></div>' +
            '<div class="exam-price">' + money(exam.price) + '</div>' +
            '<div class="actions">' + action + '</div>' +
            '</article>'
          );
        })
        .join('');
    } catch (err) {
      grid.innerHTML = '<p class="muted">' + escapeHtml(err.message) + '</p>';
    }
  }

  async function loadUser() {
    try {
      const data = await api('/auth/me', { auth: true });
      Auth.user = data.user;
      document.getElementById('welcome').textContent =
        'Welcome, ' + data.user.fullName + ' (' + data.user.department + ').';
    } catch (err) {
      if (err.status === 401) window.App.logout();
    }
  }

  loadUser();
  loadPayments();
  loadCatalog();
})();
