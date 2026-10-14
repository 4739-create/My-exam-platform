(function () {
  const { api, escapeHtml } = window.App;

  if (!window.App.requireStudent()) return;

  const params = new URLSearchParams(location.search);
  const txRef = params.get('tx_ref') || params.get('trx_ref');
  const title = document.getElementById('resultTitle');
  const text = document.getElementById('resultText');
  const actions = document.getElementById('resultActions');

  if (!txRef) {
    title.textContent = 'No payment reference found';
    text.textContent = 'We could not find a transaction reference in the link.';
    actions.innerHTML = '<a class="btn" href="dashboard.html">Go to my dashboard</a>';
    return;
  }

  let attempts = 0;
  const MAX_ATTEMPTS = 12;

  function succeed() {
    title.textContent = 'Payment confirmed';
    text.textContent = 'Your access is now unlocked. You can open the document and start the mock examination.';
    actions.innerHTML =
      '<a class="btn" href="dashboard.html">Go to my dashboard</a> ' +
      '<a class="btn btn-outline" href="index.html">Browse packages</a>';
  }

  function fail(status) {
    title.textContent = 'Payment not completed';
    text.textContent =
      status === 'rejected'
        ? 'The payment was not successful or the amount did not match. Please try again or use manual transfer.'
        : 'We could not confirm the payment yet. If you were charged, please contact support with your reference.';
    actions.innerHTML =
      '<a class="btn" href="dashboard.html">Go to my dashboard</a> ' +
      '<a class="btn btn-outline" href="index.html">Try again</a>';
  }

  async function check() {
    attempts += 1;
    try {
      const data = await api('/payments/verify?tx_ref=' + encodeURIComponent(txRef), { auth: true });
      if (data.status === 'approved') return succeed();
      if (data.status === 'rejected') return fail('rejected');
      if (attempts >= MAX_ATTEMPTS) return fail('pending');
      text.textContent = 'Still waiting for confirmation (attempt ' + attempts + ')...';
      setTimeout(check, 5000);
    } catch (err) {
      if (attempts >= MAX_ATTEMPTS) {
        title.textContent = 'Verification unavailable';
        text.textContent = escapeHtml(err.message);
        actions.innerHTML = '<a class="btn" href="dashboard.html">Go to my dashboard</a>';
        return;
      }
      setTimeout(check, 5000);
    }
  }

  check();
})();
