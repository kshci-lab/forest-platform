(function() {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function setSidebarWidth(sidebar) {
    var width = Math.round(sidebar.getBoundingClientRect().width);
    document.documentElement.style.setProperty('--srl-sidebar-width', width + 'px');
  }

  function initResize() {
    var sidebar = qs('#srlSidebar');
    var handle = qs('.srl-sidebar-resize', sidebar);
    if (!sidebar || !handle) return;

    var dragging = false;

    function onMove(e) {
      if (!dragging) return;
      var minWidth = 260;
      var maxWidth = Math.min(520, Math.floor(window.innerWidth * 0.9));
      var width = Math.max(minWidth, Math.min(maxWidth, e.clientX));
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
    var sidebar = qs('#srlSidebar');
    var backdrop = qs('#srlSidebarBackdrop');
    var toggle = qs('#srlSidebarToggle');
    if (!sidebar || !backdrop) return;

    if (open) {
      setSidebarWidth(sidebar);
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-open');
      sidebar.setAttribute('aria-hidden', 'false');
      document.body.classList.add('srl-sidebar-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    } else {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      sidebar.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('srl-sidebar-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function activateTab(tabName) {
    var tabs = qsa('.srl-tab');
    var panels = qsa('.srl-tab-panel');

    tabs.forEach(function(tab) {
      var isActive = tab.getAttribute('data-tab') === tabName;
      tab.classList.toggle('is-active', isActive);
    });

    panels.forEach(function(panel) {
      var isActive = panel.getAttribute('data-tab-panel') === tabName;
      panel.classList.toggle('is-active', isActive);
    });

    if (tabName === 'lessons' && typeof window.renderLessonsSidebar === 'function') {
      window.renderLessonsSidebar();
    }
  }

  function moveFeedbackArea() {
    var feedbackArea = qs('#feedback_area');
    var holder = qs('#srlSidebarJournal');
    if (!feedbackArea || !holder) return;
    holder.appendChild(feedbackArea);
    feedbackArea.style.display = 'block';
  }

  function bindHandlers() {
    var toggle = qs('#srlSidebarToggle');
    var closeBtn = qs('#srlSidebarClose');
    var backdrop = qs('#srlSidebarBackdrop');
    var showLessonsBtn = qs('#show-lessons-btn');

    if (toggle) {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        var sidebar = qs('#srlSidebar');
        var isOpen = sidebar && sidebar.classList.contains('is-open');
        setOpen(!isOpen);
        if (!isOpen) activateTab('journal');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        setOpen(false);
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        e.preventDefault();
      });
    }

    if (showLessonsBtn) {
      showLessonsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.hideLessonLearnedList === 'function') {
          window.hideLessonLearnedList();
        }
        setOpen(true);
        activateTab('lessons');
      });
    }

    qsa('.srl-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        activateTab(tab.getAttribute('data-tab'));
      });
    });

    // no outside-click close; keep sidebar open until toggle/close button
  }

  document.addEventListener('DOMContentLoaded', function() {
    moveFeedbackArea();
    bindHandlers();
    initResize();
    window.addEventListener('resize', function() {
      if (document.body.classList.contains('srl-sidebar-open')) {
        var sidebar = qs('#srlSidebar');
        if (sidebar) setSidebarWidth(sidebar);
      }
    });
  });
})();
