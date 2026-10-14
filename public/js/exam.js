(function () {
  const { api, escapeHtml } = window.App;

  if (!window.App.requireStudent()) return;
  window.App.protectContent();

  const params = new URLSearchParams(location.search);
  const examId = params.get('exam');
  const docArea = document.getElementById('docArea');
  const alertBox = document.getElementById('alertBox');

  if (!examId) {
    docArea.innerHTML = '<div class="alert error">No exam selected.</div>';
  } else {
    document.getElementById('mockLink').href = 'mock.html?exam=' + examId;
    api('/exams/' + examId + '/document', { auth: true })
      .then((data) => {
        document.title = data.title + ' | Exit Exam Prep';
        document.getElementById('docTitle').textContent = data.title;
        window.App.renderDocument(docArea, data.document);
        window.App.applyWatermark(data.watermark);
      })
      .catch((err) => {
        docArea.innerHTML = '';
        if (err.status === 403) {
          alertBox.innerHTML =
            '<div class="alert error">Access locked. Your payment must be approved first. ' +
            '<a href="payment.html?exam=' + escapeHtml(examId) + '">Go to payment</a> or ' +
            '<a href="dashboard.html">check your status</a>.</div>';
        } else {
          alertBox.innerHTML = '<div class="alert error">' + escapeHtml(err.message) + '</div>';
        }
        document.getElementById('mockLink').classList.add('hidden');
      });
  }
})();
