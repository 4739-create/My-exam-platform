(function () {
  const { api, Auth } = window.App;

  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  if (Auth.studentToken) location.href = next || 'dashboard.html';

  const form = document.getElementById('loginForm');
  const alertBox = document.getElementById('alertBox');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.innerHTML = '';
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    if (!phone || !password) {
      alertBox.innerHTML = '<div class="alert error">Please enter your phone number and password.</div>';
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const data = await api('/auth/login', { method: 'POST', body: { phone, password } });
      Auth.studentToken = data.token;
      Auth.user = data.user;
      location.href = next || 'dashboard.html';
    } catch (err) {
      alertBox.innerHTML = '<div class="alert error">' + window.App.escapeHtml(err.message) + '</div>';
      btn.disabled = false;
      btn.textContent = 'Log in';
    }
  });
})();
