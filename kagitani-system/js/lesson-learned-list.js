// 教訓一覧の表示処理を集約するファイル
// 今後、モーダルやサイドパネルでの詳細表示に拡張可能

(function(){
  // Helper: generate user-specific localStorage key
  function getStorageKey(baseName) {
    var mapId = window.MAPID || 'default';
    return baseName + '_' + mapId;
  }
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
    tip.style.width = '350px';  // 横幅を固定
    tip.style.minWidth = '350px';
    tip.style.maxWidth = '350px';
    tip.style.boxSizing = 'border-box';

    tip.innerHTML = '<button id="lessonsTooltipClose" aria-label="閉じる" style="position:absolute;top:-12px;right:-12px;width:32px;height:32px;border-radius:50%;border:2px solid #e5e7eb;background:#fff;color:#6b7280;font-size:18px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);transition:all 0.15s ease;z-index:10;">×</button>' +
      '<div id="lessonsTooltipHeader" style="background:linear-gradient(135deg, #f97316, #fb923c);color:#fff;padding:10px 14px;margin:-10px -14px 12px -14px;border-radius:16px 16px 0 0;font-weight:700;font-size:14px;">🗺️ SRL整理マップから</div>' +
      '<div id="lessonsTooltipBody" style="max-height:240px;overflow:auto;line-height:1.45;padding-top:6px"></div>' +
      '<div style="height:1px;margin:14px 0;background:linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02));"></div>' +
      '<div id="lessonsTooltipHeaderSRL" style="background:linear-gradient(135deg, #28a745, #5cb85c);color:#fff;padding:10px 14px;margin:0 -14px 12px -14px;font-weight:700;font-size:14px;">📒 SRLジャーナルから</div>' +
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
    // map_idをパラメータとして渡す
    var mapIdParam = (window.MAPID !== undefined && window.MAPID !== null) ? '?map_id=' + encodeURIComponent(window.MAPID) : '';
    fetch('php/get_lessons.php' + mapIdParam)
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
          card.style.cssText = 'background:linear-gradient(135deg, #fef9f3 0%, #fdf6ed 100%);border-radius:6px;padding:8px 12px 8px 14px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:4px solid #f97316;transition:transform 0.15s ease, box-shadow 0.15s ease;position:relative;';

          // ヘッダー部分（ラベル + 場所 + 日付2つ）
          const header = document.createElement('div');
          header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px;';

          // 左側：ラベル + 場所情報
          const leftWrap = document.createElement('div');
          leftWrap.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';

          // ラベル（色付きバッジ）- SRL整理マップはオレンジ
          const label = document.createElement('span');
          const oppLabel = (item.opportunity && String(item.opportunity).trim() !== '') ? item.opportunity : '実践するとき';
          label.style.cssText = 'display:inline-block;background:#f97316;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;';
          label.textContent = oppLabel;
          leftWrap.appendChild(label);

          // 場所情報（バッジの右側）
          const hasSourceNode = item.source_node_content && String(item.source_node_content).trim() !== '';
          const hasTopicTag = item.topic_tag_content && String(item.topic_tag_content).trim() !== '';
          
          if (hasSourceNode || hasTopicTag) {
            const sourceInfo = document.createElement('span');
            sourceInfo.style.cssText = 'font-size:10px;color:#6b7280;display:inline-flex;align-items:center;gap:2px;';
            sourceInfo.innerHTML = '📍';
            
            let sourceText = '';
            if (hasTopicTag) {
              sourceText = item.topic_tag_content.length > 25 
                ? item.topic_tag_content.substring(0, 25) + '...' 
                : item.topic_tag_content;
            } else if (hasSourceNode) {
              sourceText = item.source_node_content.length > 25 
                ? item.source_node_content.substring(0, 25) + '...' 
                : item.source_node_content;
            }
            const textSpan = document.createElement('span');
            textSpan.textContent = sourceText;
            sourceInfo.appendChild(textSpan);
            leftWrap.appendChild(sourceInfo);
          }

          // 日付2つ（作成日 + 更新日）
          const dateWrap = document.createElement('div');
          dateWrap.style.cssText = 'display:flex;gap:8px;font-size:10px;color:#9ca3af;';
          const createdAt = item.created_at || item.updated_at || '';
          const updatedAt = item.updated_at || '';
          dateWrap.innerHTML = '<span>' + escapeHtml(createdAt) + '</span><span>' + escapeHtml(updatedAt) + '</span>';

          header.appendChild(leftWrap);
          header.appendChild(dateWrap);

          // 本文（教訓テキスト）
          const content = document.createElement('div');
          content.style.cssText = 'font-size:13px;line-height:1.4;color:#1f2937;font-weight:600;white-space:pre-wrap;';
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
    // map_idをパラメータとして渡す
    var srlMapIdParam = (window.MAPID !== undefined && window.MAPID !== null) ? '&map_id=' + encodeURIComponent(window.MAPID) : '';
    fetch('php/get_lessons_srl.php?debug=1' + srlMapIdParam)
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
          card.style.cssText = 'background:linear-gradient(135deg, #f3faf5 0%, #edf7f0 100%);border-radius:6px;padding:8px 12px 8px 14px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:4px solid #28a745;transition:transform 0.15s ease, box-shadow 0.15s ease;position:relative;';

          // ヘッダー部分（ラベル + 期間 + 日付2つ）
          const header = document.createElement('div');
          header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px;';

          // 左側：ラベル + 期間情報
          const leftWrap = document.createElement('div');
          leftWrap.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';

          // ラベル（色付きバッジ）- SRLジャーナルは緑色
          const label = document.createElement('span');
          const oppLabel = (item.opportunity && String(item.opportunity).trim() !== '') ? item.opportunity : '次の機会に活用';
          label.style.cssText = 'display:inline-block;background:#28a745;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;';
          label.textContent = oppLabel;
          leftWrap.appendChild(label);

          // 期間情報（バッジの右側）
          if (item.journal_start_date || item.journal_finish_date) {
            const sourceInfo = document.createElement('span');
            sourceInfo.style.cssText = 'font-size:10px;color:#6b7280;display:inline-flex;align-items:center;gap:2px;';
            sourceInfo.innerHTML = '📅';
            
            let dateRange = '';
            if (item.journal_start_date && item.journal_finish_date) {
              const startDate = new Date(item.journal_start_date);
              const endDate = new Date(item.journal_finish_date);
              const formatDate = (d) => (d.getMonth()+1) + '/' + d.getDate();
              dateRange = formatDate(startDate) + ' 〜 ' + formatDate(endDate);
            } else if (item.journal_start_date) {
              const startDate = new Date(item.journal_start_date);
              dateRange = (startDate.getMonth()+1) + '/' + startDate.getDate() + ' 〜';
            } else if (item.journal_finish_date) {
              const endDate = new Date(item.journal_finish_date);
              dateRange = '〜 ' + (endDate.getMonth()+1) + '/' + endDate.getDate();
            }
            const textSpan = document.createElement('span');
            textSpan.textContent = '期間: ' + dateRange;
            sourceInfo.appendChild(textSpan);
            leftWrap.appendChild(sourceInfo);
          }

          // 日付2つ（作成日 + 更新日）
          const dateWrap = document.createElement('div');
          dateWrap.style.cssText = 'display:flex;gap:8px;font-size:10px;color:#9ca3af;';
          const createdAt = item.created_at || item.updated_at || '';
          const updatedAt = item.updated_at || '';
          dateWrap.innerHTML = '<span>' + escapeHtml(createdAt) + '</span><span>' + escapeHtml(updatedAt) + '</span>';

          header.appendChild(leftWrap);
          header.appendChild(dateWrap);

          // 本文（教訓テキスト）
          const content = document.createElement('div');
          content.style.cssText = 'font-size:13px;line-height:1.4;color:#1f2937;font-weight:600;white-space:pre-wrap;';
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
  // Also open the thinking process map for map-derived lessons
  function handleLessonCardActivation(item, source){
    console.log('lessonCardClick:', { item: item, source: source });
    
    // 教訓一覧を閉じる
    hideTooltip();
    
    // SRL整理マップから生まれた教訓の場合、マップを開く
    if (source === 'map' && item.node_id) {
      openProcessMapForLesson(item.node_id, item.source_node_content || '');
    }
    
    // SRLジャーナルから生まれた教訓の場合、振り返りモーダルを開く
    if (source === 'srl' && item.object_journal_id) {
      openJournalReportForLesson(item);
    }
    
    try {
      var ev = new CustomEvent('lessonCardClick', { detail: { item: item, source: source } });
      window.dispatchEvent(ev);
    } catch(e) {
      // fallback: open a simple alert if CustomEvent is not available or listener absent
      if (console && console.warn) console.warn('lessonCardClick event dispatch failed', e);
    }
  }

  // SRLジャーナルからの教訓カードから振り返りモーダルを開く処理
  function openJournalReportForLesson(item) {
    console.log('openJournalReportForLesson:', item);
    
    var objectJournalId = item.object_journal_id;
    var startDate = item.journal_start_date;
    var endDate = item.journal_finish_date;
    
    if (!objectJournalId) {
      console.warn('object_journal_id が見つかりません');
      return;
    }
    
    // 「振り返る」ボタンと同じ処理を実行
    // goal_list.jsのweeklyGoalsから該当するゴールを探してボタンをクリックするか、
    // 直接journal_report.jsの処理を呼び出す
    
    // まず、localStorageからweeklyGoalsを取得してobject_journal_idが一致するものを探す
    try {
      var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
      var targetIdx = -1;
      for (var i = 0; i < goals.length; i++) {
        var goal = goals[i];
        var goalJournalId = goal.object_journal_id || goal.object_goal_id || goal.object_goal || goal.objectJournalId || goal.objectGoalId || null;
        if (goalJournalId === objectJournalId) {
          targetIdx = i;
          break;
        }
      }
      
      if (targetIdx >= 0) {
        // 該当する「振り返る」ボタンを探してクリック
        var exportBtn = document.querySelector('#exportWeeklyGoalBtn' + targetIdx);
        if (exportBtn) {
          console.log('振り返るボタンをクリック:', targetIdx);
          exportBtn.click();
          return;
        }
      }
      
      // 該当するボタンが見つからない場合は、直接データを使ってモーダルを開く
      // journal_report.jsの処理を参考に、同様のAJAXリクエストを発行
      console.log('直接ジャーナル振り返りを開きます:', objectJournalId);
      triggerJournalReportDirectly(objectJournalId, startDate, endDate);
      
    } catch (e) {
      console.error('openJournalReportForLesson エラー:', e);
    }
  }

  // 直接ジャーナル振り返りモーダルを開く（「振り返る」ボタンが見つからない場合のフォールバック）
  function triggerJournalReportDirectly(objectJournalId, startDate, endDate) {
    // journal_report.jsで定義されている処理を模倣
    // まずnode_idsを取得
    $.ajax({
      url: 'php/get_object_journal_nodes.php',
      type: 'GET',
      dataType: 'json',
      data: { object_journal_id: objectJournalId },
      success: function (res) {
        if (!(res && res.success && Array.isArray(res.node_ids))) {
          console.warn('journal_report: node_ids が見つかりません', res);
          alert('振り返りデータが見つかりませんでした');
          return;
        }
        
        // weeklyGoalsに仮のエントリを追加して「振り返る」ボタンを生成・クリック
        var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
        var tempGoal = {
          object_journal_id: objectJournalId,
          start: startDate,
          start_date: startDate,
          end: endDate,
          finish_date: endDate,
          contents: []
        };
        
        // 既存のgoalsに一時的に追加してrenderし、ボタンをクリック
        goals.unshift(tempGoal);
        localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));
        
        // renderWeeklyGoals を呼び出し
        if (typeof window.renderWeeklyGoals === 'function') {
          window.renderWeeklyGoals();
        }
        
        // 少し待ってからボタンをクリック
        setTimeout(function() {
          var exportBtn = document.querySelector('#exportWeeklyGoalBtn0');
          if (exportBtn) {
            exportBtn.click();
          }
          
          // 一時的に追加したゴールを削除
          setTimeout(function() {
            var goalsAfter = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
            if (goalsAfter.length > 0 && goalsAfter[0].object_journal_id === objectJournalId) {
              goalsAfter.shift();
              localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goalsAfter));
              if (typeof window.renderWeeklyGoals === 'function') {
                window.renderWeeklyGoals();
              }
            }
          }, 500);
        }, 100);
      },
      error: function (xhr, status, error) {
        console.error('get_object_journal_nodes エラー:', error);
        alert('振り返りデータの取得に失敗しました');
      }
    });
  }

  // 教訓カードからマップを開く処理
  function openProcessMapForLesson(nodeId, nodeText) {
    console.log('openProcessMapForLesson:', { nodeId: nodeId, nodeText: nodeText });
    
    // 保存用（process map 側で参照できるように）
    try {
      if (nodeId) sessionStorage.setItem('processMap_targetNodeId', nodeId);
      if (nodeText) sessionStorage.setItem('processMap_targetText', nodeText);
    } catch (err) {
      window.processMap_targetNodeId = nodeId;
      window.processMap_targetText = nodeText;
    }

    // 1) jsMind の選択を明示的にセット
    try {
      if (typeof _jm !== 'undefined' && _jm && typeof _jm.select_node === 'function' && nodeId) {
        try {
          _jm.select_node(nodeId);
        } catch (selErr) {
          console.warn('select_node failed', selErr);
        }
      }
    } catch (err) {
      console.warn('select_node check failed', err);
    }

    // 2) 対応する jmnode 要素を探してアイコンクリックを発火
    var iconClicked = false;
    try {
      if (nodeId) {
        var jmElem = document.querySelector('jmnode[nodeid="' + nodeId + '"]');
        if (!jmElem) {
          // 試しに id 属性でも検索
          jmElem = document.querySelector('jmnode[id="' + nodeId + '"]');
        }
        if (jmElem) {
          var iconWrapper = jmElem.querySelector('.node-icon-wrapper');
          if (iconWrapper) {
            // dispatch a real click event
            try {
              iconWrapper.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
              iconClicked = true;
            } catch (evErr) {
              try { iconWrapper.click(); iconClicked = true; } catch(e){/* fallthrough */}
            }
          }
        }
      }
    } catch (err) {
      console.warn('icon wrapper click failed', err);
    }

    // 3) フォールバック: showThinkingProcessMap を直接呼び出す
    if (!iconClicked) {
      try {
        if (typeof showNavigatorGreeting === 'function') {
          try { showNavigatorGreeting(); } catch(e){ console.warn('showNavigatorGreeting error', e); }
        }
      } catch(e){/* ignore */}

      try {
        if (typeof showThinkingProcessMap === 'function') {
          showThinkingProcessMap();
        } else {
          console.warn('showThinkingProcessMap 関数が見つかりません');
        }
      } catch (err) {
        console.error('showThinkingProcessMap 呼出しエラー', err);
      }
    }
    
    // 4) feedbackTooltip を表示（少し遅延させてマップの描画を待つ）
    setTimeout(function() {
      showFeedbackTooltipForNode(nodeId);
    }, 300);
  }
  
  // 特定のノードに対してfeedbackTooltipを表示する
  // nodeIdはjsMindのノードIDなので、vis.jsの対応するノードIDを探す必要がある
  function showFeedbackTooltipForNode(jmNodeId) {
    try {
      if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess) {
        // jsMindノードIDからvis.jsネットワークノードIDを探す
        var networkNodeId = null;
        
        // ConnectMindMapNodeIdとConnectNetworkNodeIdの対応を探す
        if (defaultThinkingProcess.ConnectMindMapNodeId && defaultThinkingProcess.ConnectNetworkNodeId) {
          var idx = defaultThinkingProcess.ConnectMindMapNodeId.indexOf(jmNodeId);
          if (idx !== -1) {
            networkNodeId = defaultThinkingProcess.ConnectNetworkNodeId[idx];
            console.log('Found network node:', networkNodeId, 'for jmNode:', jmNodeId);
          }
        }
        
        // 対応が見つからない場合、ノードのラベルテキストで検索を試みる
        if (!networkNodeId) {
          // sessionStorageからノードテキストを取得
          var nodeText = null;
          try {
            nodeText = sessionStorage.getItem('processMap_targetText');
          } catch(e) {
            nodeText = window.processMap_targetText;
          }
          
          if (nodeText && defaultThinkingProcess.nodes) {
            var allNodes = defaultThinkingProcess.nodes.get();
            for (var i = 0; i < allNodes.length; i++) {
              var n = allNodes[i];
              if (n.label && n.label.indexOf(nodeText) !== -1) {
                networkNodeId = n.id;
                console.log('Found network node by text:', networkNodeId, 'for text:', nodeText);
                break;
              }
            }
          }
        }
        
        // ネットワークノードが見つかったらfeedbackTooltipを表示
        if (networkNodeId && defaultThinkingProcess.nodes && defaultThinkingProcess.nodes.get(networkNodeId)) {
          defaultThinkingProcess.selectId = networkNodeId;
          if (typeof defaultThinkingProcess.showFeedbackTooltip === 'function') {
            defaultThinkingProcess.showFeedbackTooltip();
            console.log('feedbackTooltip displayed for network node:', networkNodeId);
          }
        } else {
          console.warn('Network node not found for jmNode:', jmNodeId);
        }
      } else {
        console.warn('defaultThinkingProcess is not available');
      }
    } catch (err) {
      console.error('showFeedbackTooltipForNode error:', err);
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

