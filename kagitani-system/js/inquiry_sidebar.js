(function() {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function setSidebarWidth(sidebar) {
    var width = Math.round(sidebar.getBoundingClientRect().width);
    document.documentElement.style.setProperty('--inquiry-sidebar-width', width + 'px');
  }

  function initResize() {
    var sidebar = qs('#inquirySidebar');
    var handle = qs('.inquiry-sidebar-resize', sidebar);
    if (!sidebar || !handle) return;

    var dragging = false;

    function onMove(e) {
      if (!dragging) return;
      var minWidth = 260;
      var maxWidth = Math.min(520, Math.floor(window.innerWidth * 0.9));
      var width = Math.max(minWidth, Math.min(maxWidth, window.innerWidth - e.clientX));
      sidebar.style.width = width + 'px';
      setSidebarWidth(sidebar);
    }

    function stop() {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('is-resizing');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', stop);
    }

    handle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      dragging = true;
      document.body.classList.add('is-resizing');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', stop);
    });
  }

  function setOpen(open) {
    var sidebar = qs('#inquirySidebar');
    if (!sidebar) return;
    if (open) {
      setSidebarWidth(sidebar);
      sidebar.classList.add('is-open');
      sidebar.setAttribute('aria-hidden', 'false');
      document.body.classList.add('inquiry-sidebar-open');
    } else {
      sidebar.classList.remove('is-open');
      sidebar.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('inquiry-sidebar-open');
    }
  }

  function bindHandlers() {
    var toggle = qs('#toggleInquirySidebarBtn');
    var closeBtn = qs('#inquirySidebarClose');

    if (toggle) {
      toggle.addEventListener('click', function() {
        var sidebar = qs('#inquirySidebar');
        var isOpen = sidebar && sidebar.classList.contains('is-open');
        setOpen(!isOpen);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        setOpen(false);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    setOpen(false);
    bindHandlers();
    initResize();
    window.addEventListener('resize', function() {
      if (document.body.classList.contains('inquiry-sidebar-open')) {
        var sidebar = qs('#inquirySidebar');
        if (sidebar) setSidebarWidth(sidebar);
      }
    });
  });
})();
