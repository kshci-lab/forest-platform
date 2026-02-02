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
    tip.classList.add('fl-card');
    tip.style.color = '#1f2937';
    tip.style.pointerEvents = 'auto';
    tip.style.opacity = '0';
    tip.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    tip.style.cursor = 'move';
    tip.style.userSelect = 'none';
    tip.style.left = '20px';
    tip.style.top = '60px';

    tip.innerHTML = '<button id="lessonsTooltipClose" aria-label="閉じる" style="position:absolute;top:-12px;right:-12px;width:32px;height:32px;border-radius:50%;border:2px solid #e5e7eb;background:#fff;color:#6b7280;font-size:18px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);transition:all 0.15s ease;z-index:10;">×</button>' +
      '<div id="lessonsTooltipHeader" class="fl-header">SRL整理マップから生まれた教訓</div>' +
      '<div id="lessonsTooltipBody" style="max-height:240px;overflow:auto;line-height:1.45;padding-top:6px"></div>' +
      '<div style="height:1px;margin:10px 0;background:linear-gradient(90deg, rgba(212,172,72,0.12), rgba(0,0,0,0.04));"></div>' +
      '<div id="lessonsTooltipHeaderSRL" class="fl-header" style="margin-top:6px; font-weight:700;">SRLジャーナルから生まれた教訓</div>' +
      '<div id="lessonsTooltipBodySRL" style="max-height:320px;overflow:auto;line-height:1.45;padding-top:6px"></div>';

    document.body.appendChild(tip);

    var closeBtn = tip.querySelector('#lessonsTooltipClose');
    // ホバー時のスタイル変更
    closeBtn.addEventListener('mouseenter', function(){ 
      this.style.background = '#ef4444'; 
      this.style.color = '#fff'; 
      this.style.borderColor = '#ef4444';
      this.style.transform = 'scale(1.1)';
    });
    closeBtn.addEventListener('mouseleave', function(){ 
      this.style.background = '#fff'; 
      this.style.color = '#6b7280'; 
      this.style.borderColor = '#e5e7eb';
      this.style.transform = 'scale(1)';
    });
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
    // fade out and then remove from DOM so it no longer captures pointer/cursor
    tip.style.opacity = '0';
    tip.style.transform = 'translateY(-6px)';
    tip.style.pointerEvents = 'none';
    // remove after transition completes (slightly longer than CSS transition)
    setTimeout(function(){
      if(tip && tip.parentNode) tip.parentNode.removeChild(tip);
    }, 220);
  }

  // fetch and render map-derived lessons
  function renderLessons(){
    var tip = ensureTooltip();
    var body = tip.querySelector('#lessonsTooltipBody');
    body.innerHTML = '<div style="color:#6b7280;padding:8px 6px;font-size:13px">読み込み中...</div>';
    fetch('php/get_lessons.php')
      .then(r => {
        if (!r.ok) return r.text().then(txt => { throw new Error('Server returned ' + r.status + ' - ' + txt); });
        return r.json();
      })
      .then(data => {
        if (!data || !data.items || data.items.length === 0) {
          body.innerHTML = '<div style="color:#6b7280;padding:8px 6px;font-size:13px">該当する教訓は見つかりませんでした。</div>';
          return;
        }
        body.innerHTML = '';
        data.items.forEach(item => {
          const card = document.createElement('div');
          card.style.cssText = 'background:#fff;border-radius:12px;padding:16px 18px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e5e7eb;transition:transform 0.15s ease, box-shadow 0.15s ease;';

          // ヘッダー部分（ラベル + 日付）
          const header = document.createElement('div');
          header.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;';

          // ラベル（丸いドット + テキスト）
          const label = document.createElement('div');
          label.style.cssText = 'display:flex;align-items:center;gap:6px;';
          const dot = document.createElement('span');
          dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#22c55e;flex-shrink:0;';
          const labelText = document.createElement('span');
          labelText.style.cssText = 'font-size:12px;color:#6b7280;font-weight:500;';
          // 機会（opportunity）をラベルとして表示
          const oppLabel = (item.opportunity && String(item.opportunity).trim() !== '') ? item.opportunity : '次の機会に活用';
          labelText.textContent = oppLabel;
          label.appendChild(dot);
          label.appendChild(labelText);

          // 日付（右上）
          const date = document.createElement('div');
          date.style.cssText = 'font-size:12px;color:#9ca3af;white-space:nowrap;';
          date.textContent = item.updated_at ? item.updated_at : '';

          header.appendChild(label);
          header.appendChild(date);

          // 本文（教訓テキスト）
          const content = document.createElement('div');
          content.style.cssText = 'font-size:16px;line-height:1.6;color:#1f2937;font-weight:600;white-space:pre-wrap;';
          const applicationText = item.application || item.lesson_learned || item['lesson_learned'] || item['lesson'] || '';
          content.innerHTML = escapeHtml(applicationText);

          card.appendChild(header);
          card.appendChild(content);

          // make card interactive
          card.setAttribute('role','button');
          card.setAttribute('tabindex','0');
          card.style.cursor = 'pointer';
          card.addEventListener('click', function(e){ e.stopPropagation(); handleLessonCardActivation(item, 'map'); });
          card.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLessonCardActivation(item, 'map'); } });
          card.addEventListener('mouseover', function(){ card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'; });
          card.addEventListener('mouseout', function(){ card.style.transform = 'none'; card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; });

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
    fetch('php/get_lessons_srl.php?debug=1')
      .then(r => {
        if (!r.ok) {
          return r.text().then(txt => {
            console.error('get_lessons_srl non-OK', r.status, txt);
            throw new Error('Server returned ' + r.status);
          });
        }
        return r.json();
      })
      .then(data => {
        if (!data.items || data.items.length === 0) {
          body.innerHTML = '<div style="color:#6b7280;padding:8px 6px;font-size:13px">該当する教訓は見つかりませんでした。</div>';
          return;
        }
        body.innerHTML = '';
        data.items.forEach(item => {
          const card = document.createElement('div');
          card.style.cssText = 'background:#fff;border-radius:12px;padding:16px 18px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e5e7eb;transition:transform 0.15s ease, box-shadow 0.15s ease;';

          // ヘッダー部分（ラベル + 日付）
          const header = document.createElement('div');
          header.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;';

          // ラベル（丸いドット + テキスト）- SRLはオレンジ色のドット
          const label = document.createElement('div');
          label.style.cssText = 'display:flex;align-items:center;gap:6px;';
          const dot = document.createElement('span');
          dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#f97316;flex-shrink:0;';
          const labelText = document.createElement('span');
          labelText.style.cssText = 'font-size:12px;color:#6b7280;font-weight:500;';
          const oppLabel = (item.opportunity && String(item.opportunity).trim() !== '') ? item.opportunity : '次の機会に活用';
          labelText.textContent = oppLabel;
          label.appendChild(dot);
          label.appendChild(labelText);

          // 日付（右上）
          const date = document.createElement('div');
          date.style.cssText = 'font-size:12px;color:#9ca3af;white-space:nowrap;';
          date.textContent = item.updated_at ? item.updated_at : '';

          header.appendChild(label);
          header.appendChild(date);

          // 本文（教訓テキスト）
          const content = document.createElement('div');
          content.style.cssText = 'font-size:16px;line-height:1.6;color:#1f2937;font-weight:600;white-space:pre-wrap;';
          const lesson = item.lesson_learned || item['lesson_learned'] || item['lesson'] || '';
          content.innerHTML = escapeHtml(lesson);

          card.appendChild(header);
          card.appendChild(content);

          // make SRL card interactive
          card.setAttribute('role','button');
          card.setAttribute('tabindex','0');
          card.style.cursor = 'pointer';
          card.addEventListener('click', function(e){ e.stopPropagation(); handleLessonCardActivation(item, 'srl'); });
          card.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLessonCardActivation(item, 'srl'); } });
          card.addEventListener('mouseover', function(){ card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'; });
          card.addEventListener('mouseout', function(){ card.style.transform = 'none'; card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; });

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

  // Handle card activation: dispatch a CustomEvent with the item and its source ('map' or 'srl')
  function handleLessonCardActivation(item, source){
    try {
      var ev = new CustomEvent('lessonCardClick', { detail: { item: item, source: source } });
      window.dispatchEvent(ev);
    } catch(e) {
      // fallback: open a simple alert if CustomEvent is not available or listener absent
      if (console && console.warn) console.warn('lessonCardClick event dispatch failed', e);
      alert((item.lesson_learned || item.application || item['lesson'] || '').substring(0, 100));
    }
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

