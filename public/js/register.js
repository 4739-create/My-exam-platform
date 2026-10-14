(function () {
  const { api, Auth } = window.App;

  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  if (Auth.studentToken) location.href = next || 'dashboard.html';

  const form = document.getElementById('registerForm');
  const alertBox = document.getElementById('alertBox');

  function showError(msg) {
    alertBox.innerHTML = '<div class="alert error">' + window.App.escapeHtml(msg) + '</div>';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.innerHTML = '';

    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const department = document.getElementById('department').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    if (!fullName || !phone || !department || !password) {
      return showError('Please fill in all fields.');
    }
    if (password.length < 6) {
      return showError('Password must be at least 6 characters.');
    }
    if (password !== confirm) {
      return showError('Passwords do not match.');
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: { fullName, phone, department, password },
      });
      Auth.studentToken = data.token;
      Auth.user = data.user;
      window.App.toast('Account created successfully.', 'success');

      if (next) {
        location.href = next;
        return;
      }

      try {
        const { exams } = await api('/exams', { auth: true });
        const wanted = String(data.user.department || '').trim().toLowerCase();
        const match = exams.find(
          (exam) => String(exam.department || '').trim().toLowerCase() === wanted
        );
        location.href = match ? 'payment.html?exam=' + match.id : 'dashboard.html';
      } catch {
        location.href = 'dashboard.html';
      }
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Create account';
    }
  });
})();
