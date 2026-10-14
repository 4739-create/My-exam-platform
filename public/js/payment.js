(function () {
  const { api, money, escapeHtml, Auth, toast } = window.App;

  if (!window.App.requireStudent()) return;

  const params = new URLSearchParams(location.search);
  const examId = params.get('exam');
  const alertBox = document.getElementById('alertBox');
  const successBox = document.getElementById('successBox');
  const form = document.getElementById('paymentForm');
  const onlineBox = document.getElementById('onlinePayBox');
  const payNowBtn = document.getElementById('payNowBtn');
  let onlineEnabled = false;

  if (!examId) {
    document.getElementById('examTitle').textContent = 'No exam selected';
    form.classList.add('hidden');
    alertBox.innerHTML = '<div class="alert error">Please choose an exam package first.</div>';
    return;
  }

  function lockedOrDone(exam) {
    if (exam.access === 'approved') {
      form.classList.add('hidden');
      onlineBox.classList.add('hidden');
      successBox.innerHTML =
        '<div class="alert success">You already have approved access to this package. ' +
        '<a href="exam.html?exam=' + exam.id + '">Open the document</a> or ' +
        '<a href="mock.html?exam=' + exam.id + '">start the mock exam</a>.</div>';
      return true;
    }
    return false;
  }

  async function load() {
    try {
      const [examRes, cfg] = await Promise.all([api('/exams/' + examId, { auth: true }), api('/config')]);
      const exam = examRes.exam;
      onlineEnabled = Boolean(cfg.onlinePaymentEnabled);

      document.getElementById('examTitle').textContent = exam.title;
      document.getElementById('examDept').textContent = exam.department;
      document.getElementById('examMeta').innerHTML =
        '<span>' + exam.questionCount + ' questions</span><span>' + exam.duration + ' minutes</span>';
      document.getElementById('payAmount').textContent = money(exam.price);
      document.getElementById('telebirrAccount').textContent = cfg.telebirrAccount;

      if (lockedOrDone(exam)) return;

      if (onlineEnabled) {
        onlineBox.classList.remove('hidden');
        document.getElementById('payNowAmount').textContent = money(exam.price);
        document.getElementById('payNowNote').textContent =
          'Gateway: ' + cfg.gateway + '. You may pay with Telebirr, local cards or wallets.';
      }

      if (exam.access === 'pending') {
        successBox.innerHTML =
          '<div class="alert info">You already submitted a payment for this package and it is awaiting ' +
          'verification. Submitting again will update your reference.</div>';
      }
    } catch (err) {
      alertBox.innerHTML = '<div class="alert error">' + escapeHtml(err.message) + '</div>';
      form.classList.add('hidden');
    }
  }

  if (payNowBtn) {
    payNowBtn.addEventListener('click', async () => {
      alertBox.innerHTML = '';
      payNowBtn.disabled = true;
      payNowBtn.textContent = 'Starting secure checkout...';
      try {
        const data = await api('/payments/checkout', {
          method: 'POST',
          auth: true,
          body: { examId: Number(examId) },
        });
        window.location.href = data.checkoutUrl;
      } catch (err) {
        alertBox.innerHTML = '<div class="alert error">' + escapeHtml(err.message) + '</div>';
        payNowBtn.disabled = false;
        payNowBtn.innerHTML = 'Pay <span id="payNowAmount"></span> now';
        const amt = document.getElementById('payNowAmount');
        if (amt) amt.textContent = document.getElementById('payAmount').textContent;
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.innerHTML = '';
    const transactionRef = document.getElementById('transactionRef').value.trim();
    const senderPhone = document.getElementById('senderPhone').value.trim();

    if (transactionRef.length < 4) {
      alertBox.innerHTML = '<div class="alert error">Please enter a valid transaction reference.</div>';
      return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      const data = await api('/payments', {
        method: 'POST',
        auth: true,
        body: { examId: Number(examId), transactionRef, senderPhone },
      });
      toast('Payment submitted successfully.', 'success');
      successBox.innerHTML =
        '<div class="alert success"><strong>Payment submitted.</strong><br>' +
        escapeHtml(data.message) +
        '<br><a href="dashboard.html">Go to my dashboard</a></div>';
      form.classList.add('hidden');
    } catch (err) {
      alertBox.innerHTML = '<div class="alert error">' + escapeHtml(err.message) + '</div>';
      btn.disabled = false;
      btn.textContent = 'Submit for verification';
    }
  });

  load();
})();
