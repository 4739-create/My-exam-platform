(function () {
  const { api, money, escapeHtml, Auth, toast } = window.App;

  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginAlert = document.getElementById('loginAlert');
  const adminAlert = document.getElementById('adminAlert');
  const paymentsBody = document.getElementById('paymentsBody');
  let currentFilter = 'pending';

  function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
  }

  function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    loadStats();
    loadPayments();
    loadAttempts();
  }

  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.innerHTML = '';
    const name = document.getElementById('adminName').value;
    const password = document.getElementById('adminPassword').value;
    try {
      const data = await api('/admin/login', { method: 'POST', body: { name, password } });
      Auth.adminToken = data.token;
      toast('Administrator authenticated.', 'success');
      window.App.mountNav();
      showDashboard();
    } catch (err) {
      loginAlert.innerHTML = '<div class="alert error">' + escapeHtml(err.message) + '</div>';
    }
  });

  document.getElementById('adminLogout').addEventListener('click', () => {
    Auth.clearAdmin();
    window.App.mountNav();
    showLogin();
  });

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadPayments();
    });
  });

  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadStats();
    loadPayments();
    loadAttempts();
  });

  async function loadStats() {
    try {
      const s = await api('/admin/stats', { admin: true });
      document.getElementById('statsRow').innerHTML =
        stat('Pending', s.pending) +
        stat('Approved', s.approved) +
        stat('Rejected', s.rejected) +
        stat('Students', s.students) +
        stat('Revenue', money(s.revenue)) +
        stat('Attempts', s.attempts);
    } catch (err) {
      handleAuthError(err);
    }
  }

  function stat(label, value) {
    return '<div class="stat"><div class="num">' + value + '</div><div class="lbl">' + label + '</div></div>';
  }

  function statusBadge(status) {
    const map = { pending: 'Pending', approved: 'Paid', rejected: 'Rejected' };
    return '<span class="status ' + status + '">' + (map[status] || status) + '</span>';
  }

  async function loadPayments() {
    paymentsBody.innerHTML = '<tr><td colspan="7" class="muted">Loading...</td></tr>';
    try {
      const { payments } = await api('/admin/payments' + (currentFilter 
        ? '?status=' + currentFilter : ''), {
        admin: true,
      });
      if (!payments.length) {
        paymentsBody.innerHTML = '<tr><td colspan="7" class="muted">No payments in this category.</td></tr>';
        return;
      }
      paymentsBody.innerHTML = payments
  
      .map((p) => {
          const actions =
            p.status === 'pending'
              ? '<button class="btn btn-sm approve" data-id="' + p.id + '">Approve</button> ' +
                '<button class="btn btn-danger btn-sm reject" data-id="' + p.id + '">Reject</button>'
              : '<span class="small muted">Reviewed</span>';
          return (
            '<tr class="' + (p.status === 'pending' ? 'pending-row' : '') + '">' +
            '<td><strong>' + escapeHtml(p.studentName) + '</strong><br>' +
            '<span class="small muted">' + escapeHtml(p.studentPhone) + ' &middot; ' + escapeHtml(p.studentDepartment) + '</span></td>' +
            '<td>' + escapeHtml(p.examTitle) + '<br><span class="small muted">' + escapeHtml(p.examDepartment) + '</span></td>' +
            '<td>' + money(p.amount) + '<br><span class="small muted">' + escapeHtml(p.method) + '</span></td>' +
            '<td><span class="small">' + escapeHtml(p.transactionRef) + '</span><br>' +
            '<span class="small muted">' + escapeHtml(p.senderPhone || '-') + '</span></td>' +
            '<td>' + statusBadge(p.status) + (p.note ? '<br><span class="small muted">' + escapeHtml(p.note) + '</span>' : '') + '</td>' +
            '<td class="small">Submitted: ' + escapeHtml((p.submittedAt || '').replace('T', ' ')) +
            (p.approvedAt ? '<br>Approved: ' + escapeHtml(p.approvedAt.replace('T', ' ')) : '') + '</td>' +
            '<td>' + actions + '</td>' +
            '</tr>'
          );
        })
        .join('');

      paymentsBody.querySelectorAll('.approve').forEach((b) =>
        b.addEventListener('click', () => review(b.dataset.id, 'approve'))
      );
      paymentsBody.querySelectorAll('.reject').forEach((b) =>
        b.addEventListener('click', () => review(b.dataset.id, 'reject'))
      );
    } catch (err) {
      handleAuthError(err);
      paymentsBody.innerHTML = '<tr><td colspan="7" class="muted">' + escapeHtml(err.message) + '</td></tr>';
    }
  }

  async function review(id, action) {
    adminAlert.innerHTML = '';
    let note = '';
    if (action === 'reject') {
      note = prompt('Reason for rejection (optional):', 'Payment not found on Telebirr account') || '';
    } else if (!confirm('Confirm that the payment was received in the Telebirr account and approve it?')) {
      return;
    }
    try {
      await api('/admin/payments/' + id + '/' + action, { method: 'POST', admin: true, body: { note } });
      toast(action === 'approve' ? 'Payment approved. Student access unlocked.' : 'Payment rejected.', 'success');
      loadStats();
      loadPayments();
    } catch (err) {
      handleAuthError(err);
      adminAlert.innerHTML = '<div class="alert error">' + escapeHtml(err.message) + '</div>';
    }
  }

  async function loadAttempts() {
    try {
      const { attempts } = await api('/admin/attempts', { admin: true });
      const body = document.getElementById('attemptsBody');
      if (!attempts.length) {
        body.innerHTML = '<tr><td colspan="5" class="muted">No attempts recorded yet.</td></tr>';
        return;
      }
      body.innerHTML = attempts
        .map(
          (a) =>
            '<tr><td>' + escapeHtml(a.student_name) + '</td><td>' + escapeHtml(a.student_phone) + '</td>' +
            '<td>' + escapeHtml(a.exam_title) + '</td><td>' + a.score + ' / ' + a.total + '</td>' +
            '<td class="small">' + escapeHtml((a.end_time || '').replace('T', ' ')) + '</td></tr>'
        )
        .join('');
    } catch (err) {
      handleAuthError(err);
    }
  }

  function handleAuthError(err) {
    if (err.status === 401) {
      Auth.clearAdmin();
      window.App.mountNav();
      showLogin();
      loginAlert.innerHTML = '<div class="alert error">Session expired. Please log in again.</div>';
    }
  }

  if (Auth.adminToken) {
    showDashboard();
  } else {
    showLogin();
  }
})();
