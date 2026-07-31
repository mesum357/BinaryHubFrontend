(function () {
  var modal = document.getElementById('enrollModal');
  if (!modal) return;

  var closeBtn = document.getElementById('enrollCloseBtn');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.course-card'));
  var filters = document.querySelectorAll('#courseFilters .page-filter-btn');
  var search = document.getElementById('courseSearch');

  function openEnrollModal(course, courseId, fee) {
    document.getElementById('modalCourseTitle').textContent = course || 'Course';
    document.getElementById('enrollCourseId').value = courseId || '';
    document.getElementById('enrollCourseName').value = course || '';
    var f = fee != null ? Number(fee) : 5000;
    document.getElementById('enrollAmount').value = f;
    var label = 'PKR ' + f.toLocaleString();
    document.getElementById('displayAmount').value = label;
    var total = document.getElementById('modalTotalDisplay');
    if (total) total.textContent = label;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.enroll-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openEnrollModal(
        btn.getAttribute('data-name'),
        btn.getAttribute('data-id'),
        btn.getAttribute('data-fee')
      );
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) {
        b.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      var filter = btn.getAttribute('data-filter');
      cards.forEach(function (card) {
        var cat = card.getAttribute('data-category');
        var show = filter === 'all' || cat === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  if (search) {
    search.addEventListener('input', function () {
      var q = search.value.toLowerCase().trim();
      cards.forEach(function (card) {
        var title = card.getAttribute('data-title') || '';
        card.style.display = !q || title.indexOf(q) !== -1 ? '' : 'none';
      });
    });
  }

  document.querySelectorAll('.enroll-radio input').forEach(function (input) {
    input.addEventListener('change', function () {
      document.querySelectorAll('.enroll-radio').forEach(function (el) {
        el.classList.remove('is-active');
      });
      input.closest('.enroll-radio').classList.add('is-active');
    });
  });

  var fileInput = document.getElementById('fileInput');
  var fileNameDisplay = document.getElementById('fileNameDisplay');
  var dropZone = document.getElementById('dropZone');
  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener('change', function () {
      fileNameDisplay.textContent =
        fileInput.files && fileInput.files[0]
          ? fileInput.files[0].name
          : 'Click to upload payment receipt';
    });
  }
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', function (e) {
      if (e.target !== fileInput) fileInput.click();
    });
  }

  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var val = btn.getAttribute('data-copy') || '';
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(val).then(function () {
        var prev = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () {
          btn.textContent = prev;
        }, 1200);
      });
    });
  });
})();
