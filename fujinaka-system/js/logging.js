/**
 * fujinaka-system/js/logging.js
 * 共通ロガー
 */
(function(global) {
  function logEvent(category, subcategory, content, userId) {
    try {
      if (typeof $ === 'undefined' || typeof $.ajax !== 'function') {
        console.warn('logEvent: jQuery is required');
        return;
      }
      $.ajax({
        // Use absolute path to avoid relative path issues from different pages
        url: '/forest-platform/fujinaka-system/php/log_event.php',
        type: 'POST',
        dataType: 'json',
        data: {
          category: category || '',
          subcategory: subcategory || '',
          content: content || '',
          user_id: userId || ''
        },
        success: function(res) {
          if (!res || res.status !== 'success') {
            console.warn('logEvent: server responded with error', res);
          }
        },
        error: function(xhr, textStatus, errorThrown) {
          console.error('logEvent failed:', 'status:', xhr.status, 'textStatus:', textStatus, 'error:', errorThrown);
          console.error('response:', xhr.responseText);
        }
      });
    } catch (e) {
      console.error('logEvent exception:', e);
    }
  }

  // グローバル公開
  global.logEvent = logEvent;
})(window);