// 教訓一覧の表示処理を集約するファイル
// 今後、モーダルやサイドパネルでの詳細表示に拡張可能

(function(){
  // Helper: create tooltip DOM once
  function ensureTooltip(){
    var tip = document.getElementById('lessonsTooltip');
    if(tip) return tip;
    tip = document.createElement('div');
    tip.id = 'lessonsTooltip';
    tip.style.position = 'fixed';
    tip.style.zIndex = '2147483646';
    tip.style.padding = '10px 14px';
    // Bright, premium look: white card with soft gold accent
    tip.style.background = '#ffffff';
    tip.style.color = '#1f2937';
    tip.style.border = '1px solid rgba(212, 172, 72, 0.9)';
    tip.style.borderRadius = '10px';
    tip.style.boxShadow = '0 10px 30px rgba(16,24,40,0.08), inset 0 1px 0 rgba(255,255,255,0.6)';
    tip.style.fontSize = '14px';
    tip.style.fontWeight = '600';
    tip.style.pointerEvents = 'auto';
    tip.style.opacity = '0';
    tip.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    tip.style.cursor = 'move';
    tip.style.userSelect = 'none';
    tip.style.left = '20px';
    tip.style.top = '60px';

    tip.innerHTML = '<div id="lessonsTooltipHeader" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(0,0,0,0.06);">' +
      '<div style="width:8px;height:28px;background:#d4ac48;border-radius:4px;margin-right:8px;box-shadow:0 1px 0 rgba(255,255,255,0.3) inset"></div>' +
      '<div style="font-size:15px;color:#111827;font-weight:700;">目標手段階層マップから生まれた教訓</div>' +
      '<button id="lessonsTooltipClose" aria-label="閉じる" style="margin-left:auto;padding:4px 8px;font-size:13px;border:1px solid rgba(16,24,40,0.06);border-radius:6px;background:#fff;color:#374151;cursor:pointer;">×</button>' +
      '</div>' +
      '<div id="lessonsTooltipBody" style="max-height:240px;overflow:auto;line-height:1.45;padding-top:6px"></div>' +
      '<div style="height:1px;margin:10px 0;background:linear-gradient(90deg, rgba(212,172,72,0.12), rgba(0,0,0,0.04));"></div>' +
      '<div id="lessonsTooltipHeaderSRL" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-bottom:4px;">' +
      '<div style="width:6px;height:22px;background:#b8872f;border-radius:3px;margin-right:8px;"></div>' +
      '<div style="font-size:14px;color:#111827;font-weight:700;">SRLジャーナルから生まれた教訓</div>' +
      '</div>' +
      '<div id="lessonsTooltipBodySRL" style="max-height:320px;overflow:auto;line-height:1.45;padding-top:6px"></div>';

    document.body.appendChild(tip);

    var closeBtn = tip.querySelector('#lessonsTooltipClose');
    closeBtn.addEventListener('click', function(e){
      e.stopPropagation();
      hideTooltip();
    });

    makeDraggable(tip);
    return tip;
  }

  // Show tooltip, position near button if present
  function showTooltip(){
    var btn = document.getElementById('show-lessons-btn');
    var tip = ensureTooltip();
    var body = tip.querySelector('#lessonsTooltipBody');
    tip.style.opacity = '1';
    tip.style.transform = 'translateY(0)';

    if(btn){
      var r = btn.getBoundingClientRect();
      // position to the left of language toggle area: try above-right of button
      tip.style.left = Math.max(12, r.left - 360) + 'px';
      tip.style.top = (r.bottom + 8) + 'px';
    }

    // render both lists
    renderLessons();
    renderSRLLessons();
  }

  function hideTooltip(){
    var tip = document.getElementById('lessonsTooltip');
    if(!tip) return;
    tip.style.opacity = '0';
  }

  // fetch and render map-derived lessons
  function renderLessons(){
    var tip = ensureTooltip();
    var body = tip.querySelector('#lessonsTooltipBody');
    body.innerHTML = '<div style="color:#6b7280;padding:8px 6px;font-size:13px">読み込み中...</div>';
    fetch('php/get_lessons.php')
      .then(r => r.json())
      .then(data => {
        if (!data.items || data.items.length === 0) {
          body.innerHTML = '<div style="color:#6b7280;padding:8px 6px;font-size:13px">該当する教訓は見つかりませんでした。</div>';
          return;
        }
        body.innerHTML = '';
        data.items.forEach(item => {
          const card = document.createElement('div');
          card.style.padding = '8px';
          card.style.marginBottom = '8px';
          card.style.borderRadius = '8px';
          card.style.background = 'linear-gradient(180deg, #ffffff, #fbfbfb)';
          card.style.boxShadow = '0 1px 0 rgba(16,24,40,0.04)';

          const date = document.createElement('div');
          date.style.fontSize = '12px';
          date.style.color = '#6b7280';
          date.textContent = item.updated_at ? item.updated_at : '';

          const cl = document.createElement('div');
          cl.style.marginTop = '6px';
          cl.style.fontSize = '13px';
          cl.style.color = '#111827';
          cl.innerHTML = escapeHtml(item.challenges_learnings || '');

          const period = document.createElement('div');
          period.style.marginTop = '6px';
          period.style.fontSize = '12px';
          period.style.color = '#374151';
          var s = item.start_date ? item.start_date : '';
          var f = item.finish_date ? item.finish_date : '';
          if(s || f){
            period.textContent = (s ? ('開始: ' + s) : '') + (s && f ? ' 〜 ' : '') + (f ? ('終了: ' + f) : '');
          } else {
            period.textContent = '';
          }

          card.appendChild(date);
          card.appendChild(cl);
          card.appendChild(period);
          body.appendChild(card);
        });
      })
      .catch(err => {
        body.innerHTML = '<div style="color:#dc2626;padding:8px 6px;font-size:13px">読み込みに失敗しました。</div>';
        console.error('get_lessons error', err);
      });
  }

  // fetch and render SRL-derived lessons
  function renderSRLLessons(){
    var tip = ensureTooltip();
    var body = tip.querySelector('#lessonsTooltipBodySRL');
    if(!body) return;
    body.innerHTML = '<div style="color:#6b7280;padding:8px 6px;font-size:13px">読み込み中...</div>';
    fetch('php/get_lessons_srl.php')
      .then(r => r.json())
      .then(data => {
        if (!data.items || data.items.length === 0) {
          body.innerHTML = '<div style="color:#6b7280;padding:8px 6px;font-size:13px">該当する教訓は見つかりませんでした。</div>';
          return;
        }
        body.innerHTML = '';
        data.items.forEach(item => {
          const card = document.createElement('div');
          card.style.padding = '8px';
          card.style.marginBottom = '8px';
          card.style.borderRadius = '8px';
          card.style.background = 'linear-gradient(180deg, #ffffff, #fbfbfb)';
          card.style.boxShadow = '0 1px 0 rgba(16,24,40,0.04)';

          const date = document.createElement('div');
          date.style.fontSize = '12px';
          date.style.color = '#6b7280';
          date.textContent = item.updated_at ? item.updated_at : '';

          const cl = document.createElement('div');
          cl.style.marginTop = '6px';
          cl.style.fontSize = '13px';
          cl.style.color = '#111827';
          cl.innerHTML = escapeHtml(item.challenges_learnings || '');

          const period = document.createElement('div');
          period.style.marginTop = '6px';
          period.style.fontSize = '12px';
          period.style.color = '#374151';
          var s = item.start_date ? item.start_date : '';
          var f = item.finish_date ? item.finish_date : '';
          if(s || f){
            period.textContent = (s ? ('開始: ' + s) : '') + (s && f ? ' 〜 ' : '') + (f ? ('終了: ' + f) : '');
          } else {
            period.textContent = '';
          }

          card.appendChild(date);
          card.appendChild(cl);
          card.appendChild(period);
          body.appendChild(card);
        });
      })
      .catch(err => {
        body.innerHTML = '<div style="color:#dc2626;padding:8px 6px;font-size:13px">読み込みに失敗しました。</div>';
        console.error('get_lessons_srl error', err);
      });
  }

  function escapeHtml(str){
    if(str == null) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function makeDraggable(el){
    var dragging = false;
    var startX = 0, startY = 0, origX = 0, origY = 0;

    el.addEventListener('mousedown', function(e){
      // only start drag when left mouse button
      if(e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origX = parseFloat(el.style.left) || 0;
      origY = parseFloat(el.style.top) || 0;
      el.style.transition = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', function(e){
      if(!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      el.style.left = (origX + dx) + 'px';
      el.style.top = (origY + dy) + 'px';
    });

    window.addEventListener('mouseup', function(){
      if(!dragging) return;
      dragging = false;
      el.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    });
  }

  // expose API
  window.showLessonLearnedList = showTooltip;
  window.hideLessonLearnedList = hideTooltip;

})();

