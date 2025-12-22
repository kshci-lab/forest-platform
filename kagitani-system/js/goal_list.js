// node_idからobject_node_id一覧を取得する関数
function fetchObjectNodeInfo(nodeId) {
    return new Promise(function(resolve) {
        console.log('get_object_node_info.phpへ送信するnode_id:', nodeId);
        $.ajax({
            url: 'php/get_object_node_info.php',
            type: 'GET',
            dataType: 'json',
            data: {
                node_id: nodeId
            },
            success: function(res) {
                // サーバーが返す object_node_ids をログ出力
                try { console.log('get_object_node_info.php object_node_ids for', nodeId, res.object_node_ids); } catch(e){}
                // サーバーが返す object_node_history_ids と histories もログ出力
                try { console.log('get_object_node_info.php object_node_history_ids for', nodeId, res.object_node_history_ids); } catch(e){}
                try { console.log('get_object_node_info.php histories for', nodeId, res.histories); } catch(e){}
                var rows = [];
                if (res && res.success && Array.isArray(res.data) && res.data.length) {
                    // 履歴が返っている場合、object_node_id ごとに紐づけるためのマップを作成
                    var historyMap = {};
                    if (res.histories && Array.isArray(res.histories)) {
                        res.histories.forEach(function(h) {
                            var onid = h.object_node_id || '';
                            if (!historyMap[onid]) historyMap[onid] = [];
                            historyMap[onid].push(h);
                        });
                    }
                    res.data.forEach(function(row) {
                        var onid = row.object_node_id;
                        var linkedHistories = historyMap[onid] || [];
                        var historyIds = linkedHistories.map(function(h){ return h.object_node_history_id; });
                        rows.push({
                            object_node_id: onid,
                            node_id: row.node_id,
                            content: row.content,
                            object_node_history_ids: historyIds,
                            histories: linkedHistories
                        });
                    });
                    var objectNodeIds = rows.map(function(row) { return row.object_node_id; });
                    console.log('取得object_node_id: ' + objectNodeIds.join(', '));
                } else {
                    rows.push({ object_node_id: '', node_id: nodeId, content: '' });
                }
                resolve(rows);
            },
            error: function(xhr, status, error) {
                console.error('get_object_node_info.php error:', status, error);
                resolve([{ object_node_id: '', node_id: nodeId, content: '' }]);
            }
        });
    });
}
// --- 目標管理エリア（小・中・大目標） ---
document.addEventListener('DOMContentLoaded', function() {
    // ヘルパ: 現在の言語を取得（トグルの状態に依存）
    function getCurrentLang() {
        var toggle = document.getElementById('language-toggle');
        return (toggle && toggle.checked) ? 'en' : 'ja';
    }

    // ヘルパ: 言語辞書からキーを取得、なければフォールバックを返す
    var _fallbacks = {
        'pleaseEnterDates': '開始日と終了日を入力してください',
        'noWeeklyGoals': 'まだ小目標がありません',
        'unlinked': '未リンク',
        'edit': '編集',
        'exportReport': '詳細表示',
        'delete': '削除',
        'dash': 'ー',
        'dateEditTitle': '日付編集',
        'startLabel': '開始日:',
        'endLabel': '終了日:',
        'save': '保存',
        'close': '閉じる',
        'communicationError': '通信エラー',
        'dbRegisterFail': 'DB登録失敗: '
    };

    function t(key) {
        var lang = getCurrentLang();
        try {
            if (window.langDict && window.langDict[lang] && typeof window.langDict[lang][key] !== 'undefined') {
                return window.langDict[lang][key];
            }
        } catch (e) {
            // ignore
        }
        return _fallbacks[key] || key;
    }
    // ページ表示時にDBから小目標を取得
    function fetchWeeklyGoalsFromDB() {
        $.ajax({
            url: 'php/get_latest_object_goal.php',
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                console.log('get_latest_object_goal.php response:', res);
                if (res.success && Array.isArray(res.goals)) {
                    // object_journal_idごとにnode_idをまとめる
                    var goalMap = {};
                    res.goals.forEach(function(row) {
                        if (!goalMap[row.object_journal_id]) {
                            goalMap[row.object_journal_id] = {
                                start: row.start_date,
                                end: row.finish_date,
                                object_journal_id: row.object_journal_id,
                                contents: []
                            };
                        }
                        if (row.content) {
                            goalMap[row.object_journal_id].contents.push(row.content);
                        }
                    });
                    var goals = Object.values(goalMap);
                    // 最新の目標を先頭に表示するため、開始日で降順ソート（新しいものを先頭に）
                    goals.sort(function(a, b) {
                        var da = new Date(a.start || a.start_date);
                        var db = new Date(b.start || b.start_date);
                        return db - da;
                    });
                    localStorage.setItem('weeklyGoals', JSON.stringify(goals));
                    renderWeeklyGoals();
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX通信エラー:', status, error, xhr);
            }
        });
    }
    fetchWeeklyGoalsFromDB();
    // 小目標
    var addWeeklyBtn = document.getElementById('addWeeklyGoalBtn');
    var weeklyStartInput = document.getElementById('weeklyGoalStart');
    var weeklyEndInput = document.getElementById('weeklyGoalEnd');
    var weeklyListDiv = document.getElementById('weeklyGoalsList');

    // 中目標
    var addMediumBtn = document.getElementById('addMediumGoalBtn');
    var mediumInput = document.getElementById('mediumGoalText');
    var mediumListDiv = document.getElementById('mediumGoalsList');

    // 大目標（要素が存在しない場合もあるので安全に取得）
    var largeGoalYearSelect = document.getElementById('largeGoalYearSelect');
    var largeInput = document.getElementById('largeGoalInput');
    var largeListDiv = document.getElementById('largeGoalsList');
    var addLargeBtn = document.getElementById('addLargeGoalBtn');

    // 小目標: クリックで日付入力モーダルを表示して登録するように変更
    if (addWeeklyBtn) {
        addWeeklyBtn.onclick = function() {
            // モーダル生成
            var modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.4)';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '9999';

            var modalContent = document.createElement('div');
            modalContent.style.background = '#fff';
            modalContent.style.padding = '24px';
            modalContent.style.borderRadius = '10px';
            modalContent.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
            modalContent.style.minWidth = '320px';
            modalContent.style.maxWidth = '90vw';

            var title = document.createElement('h3');
            title.textContent = t('期間を設定してください') || '小目標を追加';
            title.style.marginTop = '0';
            modalContent.appendChild(title);

            var startLabel = document.createElement('label');
            startLabel.textContent = t('startLabel');
            startLabel.className = 'weekly-modal-label';
            startLabel.style.display = 'block';
            startLabel.style.marginTop = '8px';
            var startInput = document.createElement('input');
            startInput.type = 'date';
            startInput.style.width = '100%';
            startInput.style.marginTop = '6px';

            var endLabel = document.createElement('label');
            endLabel.textContent = t('endLabel');
            endLabel.className = 'weekly-modal-label';
            endLabel.style.display = 'block';
            endLabel.style.marginTop = '12px';
            var endInput = document.createElement('input');
            endInput.type = 'date';
            endInput.style.width = '100%';
            endInput.style.marginTop = '6px';

            modalContent.appendChild(startLabel);
            modalContent.appendChild(startInput);
            modalContent.appendChild(endLabel);
            modalContent.appendChild(endInput);

            var btnWrap = document.createElement('div');
            btnWrap.style.marginTop = '16px';
            btnWrap.style.textAlign = 'right';

            var saveBtn = document.createElement('button');
            saveBtn.textContent = t('save');
            saveBtn.style.padding = '8px 16px';
            saveBtn.style.background = '#28a745';
            saveBtn.style.color = '#fff';
            saveBtn.style.border = 'none';
            saveBtn.style.borderRadius = '6px';
            saveBtn.style.cursor = 'pointer';

            var cancelBtn = document.createElement('button');
            cancelBtn.textContent = t('close') || '閉じる';
            cancelBtn.style.marginRight = '8px';
            cancelBtn.style.padding = '8px 12px';
            cancelBtn.style.background = '#aaa';
            cancelBtn.style.color = '#fff';
            cancelBtn.style.border = 'none';
            cancelBtn.style.borderRadius = '6px';
            cancelBtn.style.cursor = 'pointer';

            btnWrap.appendChild(cancelBtn);
            btnWrap.appendChild(saveBtn);
            modalContent.appendChild(btnWrap);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            cancelBtn.onclick = function() {
                document.body.removeChild(modal);
            };

            saveBtn.onclick = function() {
                var startDate = startInput.value;
                var endDate = endInput.value;
                if (!startDate || !endDate) {
                    alert(t('pleaseEnterDates'));
                    return;
                }
                var goal_type = 'weekly';
                $.ajax({
                    url: 'php/insert_object_goal.php',
                    type: 'POST',
                    data: {
                        goal_type: goal_type,
                        start_date: startDate,
                        finish_date: endDate
                    },
                    dataType: 'json',
                    success: function(res) {
                        console.log('insert_object_goal.php response:', res);
                        if (res.success) {
                            var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
                            goals.unshift({ start: startDate, end: endDate, createdAt: new Date().toISOString(), object_journal_id: res.object_journal_id });
                            localStorage.setItem('weeklyGoals', JSON.stringify(goals));
                            document.body.removeChild(modal);
                            renderWeeklyGoals();
                        } else {
                            alert(t('dbRegisterFail') + (res.error || '不明なエラー'));
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('AJAX通信エラー:', status, error, xhr);
                        alert(t('communicationError'));
                    }
                });
            };
        };
    }
    window.renderWeeklyGoals = function() {
        var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
        if (!weeklyListDiv) return;
        if (goals.length === 0) {
            weeklyListDiv.innerHTML = '<div style="color:#888;text-align:center;padding:12px;">' + t('noWeeklyGoals') + '</div>';
            return;
        }
        var html = '';
        goals.forEach(function(goal, idx) {
            // 編集ボタンのツールチップ（ローカライズ）
            var editBtnTitle = (getCurrentLang() === 'ja') ? '日付を編集できます' : 'You can edit dates';
            var jmnodeStyle = 'display:inline-block;margin:4px 6px 4px 0;padding:10px;background-color:#bee2f9;color:#333;border-radius:12px;box-shadow:1px 1px 1px #666;font:12px/1.125 Verdana,Arial,Helvetica,sans-serif;border:1.5px solid #7ec3e6;';
            var nodeHtml = '';
            if (goal.contents && goal.contents.length) {
                nodeHtml = goal.contents.map(function(content, cidx) {
                    // data 属性を付与して後でイベントバインドしやすくする
                    return '<div class="jmnode" data-goal-idx="' + idx + '" data-content-idx="' + cidx + '" style="' + jmnodeStyle + '">' +
                        '<span>' + content + '</span>' +
                        '<button onclick="deleteGoalNode(' + idx + ',' + cidx + ')" class="goal-delete-btn" title="削除">' +
                        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><circle cx="8" cy="8" r="7" fill="#dc3545"/><path d="M5 8h6" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>' +
                        '</button>' +
                        '</div>';
                }).join('');
            } else {
                nodeHtml = '<div class="jmnode" style="' + jmnodeStyle + 'color:#888;">' + t('unlinked') + '</div>';
            }
            var startDate = new Date(goal.start || goal.start_date);
            var endDate = new Date(goal.end || goal.finish_date);
            var startStr = (startDate.getMonth()+1) + '月' + startDate.getDate() + '日';
            var endStr = (endDate.getMonth()+1) + '月' + endDate.getDate() + '日';
            html += '<div style="background:#eafbe7;border:1.5px solid #28a745;border-radius:7px;padding:12px;margin-bottom:10px;display:flex;flex-direction:column;gap:6px;font-size:16px;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                + '<span class="weekly-goal-date-range" data-start="' + startStr + '" data-end="' + endStr + '">' + startStr + '〜' + endStr + '</span>'
                + '<button title="' + editBtnTitle + '" class="edit-weekly-date-btn" data-idx="' + idx + '" id="editWeeklyGoalBtn' + idx + '" style="margin-left:8px;padding:4px 10px;background:#ffc107;color:#333;border:none;border-radius:5px;font-size:13px;cursor:pointer;"><span id="editWeeklyGoalBtnText' + idx + '">' + t('edit') + '</span></button>'
                + '<button class="export-weekly-btn" data-idx="' + idx + '" id="exportWeeklyGoalBtn' + idx + '" style="margin-left:8px;padding:4px 10px;background:#007bff;color:#fff;border:none;border-radius:5px;font-size:13px;cursor:pointer;"><span id="exportWeeklyGoalBtnText' + idx + '">' + t('exportReport') + '</span></button>'
                + '</div>'
                + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;">' + nodeHtml + '</div>'
                + '<div style="text-align:right;margin-top:8px;">'
                + '<button onclick="deleteWeeklyGoal(' + idx + ')" class="goal-delete-btn" title="' + t('delete') + '" id="deleteWeeklyGoalBtn' + idx + '" style="padding:4px 10px;background:#dc3545;color:#fff;border:none;border-radius:5px;font-size:13px;cursor:pointer;">'
                + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><circle cx="8" cy="8" r="7" fill="#dc3545"/><path d="M5 8h6" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
                + ' <span id="deleteWeeklyGoalBtnText' + idx + '">' + t('dash') + '</span></button>'
                + '</div>'
                + '</div>';
        });
        weeklyListDiv.innerHTML = html;
        // 生成された .jmnode 要素にクリックリスナを登録（削除ボタンのクリックは除外）
        try {
            var jmnodes = weeklyListDiv.querySelectorAll('.jmnode');
            jmnodes.forEach(function(el) {
                // remove existing listener if any (defensive)
                el.removeEventListener('click', el._goalClickHandler);
                var handler = function(e) {
                    // 削除ボタンがクリックされた場合は無視
                    if (e.target.closest('.goal-delete-btn')) return;
                    var gidx = el.getAttribute('data-goal-idx');
                    var cidx = el.getAttribute('data-content-idx');
                    var text = (el.querySelector('span') ? el.querySelector('span').textContent.trim() : '');

                    // mindmap の jmnode 要素から nodeid を探すヘルパ
                    function findMindmapNodeIdByText(targetText) {
                        if (!targetText) return null;
                        try {
                            var jmnodes = document.getElementsByTagName('jmnode');
                            var normTarget = targetText.replace(/\s+/g, ' ').trim().toLowerCase();
                            for (var i = 0; i < jmnodes.length; i++) {
                                var node = jmnodes[i];
                                var nodeText = (node.textContent || node.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase();
                                if (!nodeText) continue;
                                // 完全一致を優先、その後に包含チェックを行う
                                if (nodeText === normTarget || nodeText.indexOf(normTarget) !== -1 || normTarget.indexOf(nodeText) !== -1) {
                                    var nid = node.getAttribute('nodeid') || node.getAttribute('id') || null;
                                    if (nid) return nid;
                                }
                            }
                        } catch (err) {
                            console.warn('findMindmapNodeIdByText failed', err);
                        }
                        return null;
                    }

                    var nodeId = findMindmapNodeIdByText(text);
                    console.log('クリックした', { goalIndex: gidx, contentIndex: cidx, text: text, nodeId: nodeId });

                    // 優先: マインドマップ上で対応するノードを選択して、
                    // そのノードのアイコン（.node-icon-wrapper）をプログラム的にクリックする。
                    // アイコンが見つからない場合は既存のフォールバック処理を実行。
                    (function openProcessMapForNode(nodeId) {
                        // 保存用（process map 側で参照できるように）
                        try {
                            if (nodeId) sessionStorage.setItem('processMap_targetNodeId', nodeId);
                            sessionStorage.setItem('processMap_targetText', text);
                        } catch (err) {
                            window.processMap_targetNodeId = nodeId;
                            window.processMap_targetText = text;
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
                                            return; // 成功したらここで終わり
                                        } catch (evErr) {
                                            try { iconWrapper.click(); return; } catch(e){/* fallthrough */}
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            console.warn('icon wrapper click failed', err);
                        }

                        // フォールバック: アイコンが無ければ既存の処理（ナビ挨拶＋マップ表示）を実行
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
                    })(nodeId);
                };
                el._goalClickHandler = handler;
                el.addEventListener('click', handler);
            });
            // 追加: 未リンク（表示テキストが t('unlinked')） の jmnode をクリックした場合は案内アラートを表示
            jmnodes.forEach(function(el) {
                try {
                    var hasGoalAttr = el.hasAttribute('data-goal-idx') || el.hasAttribute('data-content-idx');
                    var text = (el.textContent || '').trim();
                    if (!hasGoalAttr && text === t('unlinked')) {
                        // remove existing special handler if any
                        if (el._unlinkedHandler) el.removeEventListener('click', el._unlinkedHandler);
                        var unlinkedHandler = function(e) {
                            // ignore clicks on delete button (defensive)
                            if (e.target.closest('.goal-delete-btn')) return;
                            var lang = (document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja';
                            var msg = (lang === 'ja') ? '問いノードを右クリックして目標として追加してください' : 'Please right-click the question node and add it to the goal.';
                            alert(msg);
                            e.stopPropagation();
                        };
                        el._unlinkedHandler = unlinkedHandler;
                        el.addEventListener('click', unlinkedHandler);
                    }
                } catch (e) {
                    // ignore per-element errors
                }
            });
        } catch (e) {
            console.error('jmnode click bind error', e);
        }
        // 表示済みのボタンラベルを現在の言語に合わせて更新（setLanguageが先に実行されている/されていない場合に備える）
        try {
            var currentLang = (document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja';
            var dict = (window.langDict && window.langDict[currentLang]) ? window.langDict[currentLang] : null;
            // 編集ボタン
            var editBtnsText = weeklyListDiv.querySelectorAll('[id^="editWeeklyGoalBtnText"]');
            editBtnsText.forEach(function(el) {
                if (dict && typeof dict['editWeeklyGoalBtnText'] !== 'undefined') {
                    el.textContent = dict['editWeeklyGoalBtnText'];
                } else if (dict && typeof dict['edit'] !== 'undefined') {
                    el.textContent = dict['edit'];
                } else {
                    el.textContent = t('edit');
                }
            });
            // レポート出力ボタン
            var exportBtnsText = weeklyListDiv.querySelectorAll('[id^="exportWeeklyGoalBtnText"]');
            exportBtnsText.forEach(function(el) {
                if (dict && typeof dict['exportWeeklyGoalBtnText'] !== 'undefined') {
                    el.textContent = dict['exportWeeklyGoalBtnText'];
                } else if (dict && typeof dict['exportReport'] !== 'undefined') {
                    el.textContent = dict['exportReport'];
                } else {
                    el.textContent = t('exportReport');
                }
            });
            // 削除ボタン
            var deleteBtnsText = weeklyListDiv.querySelectorAll('[id^="deleteWeeklyGoalBtnText"]');
            deleteBtnsText.forEach(function(el) {
                if (dict && typeof dict['deleteWeeklyGoalBtnText'] !== 'undefined') {
                    el.textContent = dict['deleteWeeklyGoalBtnText'];
                } else if (dict && typeof dict['delete'] !== 'undefined') {
                    el.textContent = dict['delete'];
                } else {
                    el.textContent = t('delete');
                }
            });
        } catch (e) {
            // ignore.localization errors
            console.error('update weekly button texts error', e);
        }
        // 編集ボタンのイベントリスナー追加（innerHTML後に）
        var editBtns = weeklyListDiv.querySelectorAll('.edit-weekly-date-btn');
        editBtns.forEach(function(btn) {
            // ensure aria and title are present
            try { if (!btn.getAttribute('title')) btn.setAttribute('title', (getCurrentLang() === 'ja') ? '日付を編集できます' : 'You can edit dates'); } catch(e){}
            try { if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', (getCurrentLang() === 'ja') ? '日付を編集できます' : 'You can edit dates'); } catch(e){}

            // custom tooltip to ensure visibility on all platforms
            var showCustomTooltip = function(text, target) {
                var existing = document.getElementById('gl_custom_tooltip');
                if (existing) existing.parentNode.removeChild(existing);
                var tip = document.createElement('div');
                tip.id = 'gl_custom_tooltip';
                tip.textContent = text;
                tip.style.position = 'absolute';
                tip.style.background = 'rgba(0,0,0,0.8)';
                tip.style.color = '#fff';
                tip.style.padding = '6px 8px';
                tip.style.borderRadius = '6px';
                tip.style.fontSize = '13px';
                tip.style.zIndex = 20000;
                tip.style.pointerEvents = 'none';
                document.body.appendChild(tip);
                var rect = target.getBoundingClientRect();
                var top = rect.top - tip.offsetHeight - 8 + window.scrollY;
                if (top < 6) top = rect.bottom + 8 + window.scrollY;
                var left = rect.left + (rect.width - tip.offsetWidth) / 2 + window.scrollX;
                if (left < 6) left = 6 + window.scrollX;
                tip.style.top = top + 'px';
                tip.style.left = left + 'px';
            };
            var hideCustomTooltip = function() {
                var existing = document.getElementById('gl_custom_tooltip');
                if (existing) existing.parentNode.removeChild(existing);
            };

            btn.addEventListener('mouseenter', function(e){
                var text = (getCurrentLang() === 'ja') ? '日付を編集できます' : 'You can edit dates';
                showCustomTooltip(text, btn);
            });
            btn.addEventListener('mouseleave', function(e){ hideCustomTooltip(); });
            btn.addEventListener('focus', function(e){ var text = (getCurrentLang() === 'ja') ? '日付を編集できます' : 'You can edit dates'; showCustomTooltip(text, btn); });
            btn.addEventListener('blur', function(e){ hideCustomTooltip(); });

            btn.addEventListener('click', function(e) {
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
                var goal = goals[idx];
                if (!goal) return;
                // モーダル生成
                var modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.background = 'rgba(0,0,0,0.4)';
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                modal.style.zIndex = '9999';
                var modalContent = document.createElement('div');
                modalContent.style.background = '#fff';
                modalContent.style.padding = '32px 24px';
                modalContent.style.borderRadius = '12px';
                modalContent.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
                modalContent.style.minWidth = '320px';
                modalContent.style.maxWidth = '90vw';
                modalContent.style.maxHeight = '80vh';
                modalContent.style.overflowY = 'auto';
                var title = document.createElement('h3');
                title.textContent = t('dateEditTitle');
                title.style.marginBottom = '16px';
                modalContent.appendChild(title);
                var startLabel = document.createElement('label');
                startLabel.textContent = t('startLabel');
                startLabel.className = 'weekly-modal-label';
                startLabel.style.marginRight = '8px';
                var startInput = document.createElement('input');
                startInput.type = 'date';
                startInput.value = (goal.start || goal.start_date) ? (goal.start || goal.start_date) : '';
                startInput.style.marginBottom = '12px';
                var endLabel = document.createElement('label');
                endLabel.textContent = t('endLabel');
                endLabel.className = 'weekly-modal-label';
                endLabel.style.marginRight = '8px';
                var endInput = document.createElement('input');
                endInput.type = 'date';
                endInput.value = (goal.end || goal.finish_date) ? (goal.end || goal.finish_date) : '';
                endInput.style.marginBottom = '12px';
                modalContent.appendChild(startLabel);
                modalContent.appendChild(startInput);
                modalContent.appendChild(document.createElement('br'));
                modalContent.appendChild(endLabel);
                modalContent.appendChild(endInput);
                modalContent.appendChild(document.createElement('br'));
                var saveBtn = document.createElement('button');
                saveBtn.textContent = t('save');
                saveBtn.style.marginTop = '18px';
                saveBtn.style.padding = '8px 24px';
                saveBtn.style.background = '#28a745';
                saveBtn.style.color = '#fff';
                saveBtn.style.border = 'none';
                saveBtn.style.borderRadius = '6px';
                saveBtn.style.fontSize = '15px';
                saveBtn.style.cursor = 'pointer';
                saveBtn.onclick = function() {
                    var newStart = startInput.value;
                    var newEnd = endInput.value;
                    if (!newStart || !newEnd) {
                        alert('開始日と終了日を入力してください');
                        return;
                    }
                    var object_journal_id = goals[idx].object_journal_id;
                    // DB更新
                    $.ajax({
                        url: 'php/update_object_goal.php',
                        type: 'POST',
                        data: {
                            object_journal_id: object_journal_id,
                            start_date: newStart,
                            finish_date: newEnd
                        },
                        dataType: 'json',
                        success: function(res) {
                            if (res.success) {
                                goals[idx].start = newStart;
                                goals[idx].end = newEnd;
                                localStorage.setItem('weeklyGoals', JSON.stringify(goals));
                                document.body.removeChild(modal);
                                renderWeeklyGoals();
                            } else {
                                alert('DB更新失敗: ' + (res.error || '不明なエラー'));
                            }
                        },
                        error: function(xhr, status, error) {
                            alert('通信エラー: ' + error);
                        }
                    });
                };
                modalContent.appendChild(saveBtn);
                var closeBtn = document.createElement('button');
                closeBtn.textContent = '閉じる';
                closeBtn.style.marginLeft = '16px';
                closeBtn.style.padding = '8px 24px';
                closeBtn.style.background = '#aaa';
                closeBtn.style.color = '#fff';
                closeBtn.style.border = 'none';
                closeBtn.style.borderRadius = '6px';
                closeBtn.style.fontSize = '15px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.onclick = function() {
                    document.body.removeChild(modal);
                };
                modalContent.appendChild(closeBtn);
                modal.appendChild(modalContent);
                document.body.appendChild(modal);
            });
        });
        // レポート出力は外部モジュールに委譲（weekly_report.js）
        var exportBtns = weeklyListDiv.querySelectorAll('.export-weekly-btn');
        // ハンドラは `weekly_report.js` の `window.initWeeklyReportHandlers` が設定します
        if (window.initWeeklyReportHandlers && typeof window.initWeeklyReportHandlers === 'function') {
            try { window.initWeeklyReportHandlers(window._goalListHelpers || {}); } catch(e){ console.warn('initWeeklyReportHandlers failed', e); }
        }
    }

// 関連ノード（contents）個別削除（グローバル定義）
window.deleteGoalNode = function(goalIdx, contentIdx) {
    var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
    if (goals[goalIdx] && goals[goalIdx].contents && goals[goalIdx].contents.length > contentIdx) {
        var deletedContent = goals[goalIdx].contents[contentIdx];
        // DB論理削除リクエスト
        $.ajax({
            url: 'php/delete_goal_node.php',
            type: 'POST',
            data: {
                object_journal_id: goals[goalIdx].object_journal_id,
                content: deletedContent
            },
            success: function(res) {
                console.log('delete_goal_node.php response:', res);
            },
            error: function(xhr, status, error) {
                console.error('ノード削除通信エラー:', error);
            }
        });
        goals[goalIdx].contents.splice(contentIdx, 1);
        localStorage.setItem('weeklyGoals', JSON.stringify(goals));
        window.renderWeeklyGoals();
    }
};
    window.deleteWeeklyGoal = function(idx) {
        var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
        var goal = goals[idx];
        // Confirm before deleting
        try {
            var lang = (document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja';
            var confirmMsg = (lang === 'ja') ? '本当に削除しますか？' : 'Are you sure you want to delete this weekly goal?';
            if (!confirm(confirmMsg)) return;
        } catch (e) {
            if (!confirm('Are you sure you want to delete this weekly goal?')) return;
        }

        if (goal && goal.object_journal_id) {
            $.ajax({
                url: 'php/delete_object_goal.php',
                type: 'POST',
                data: { object_journal_id: goal.object_journal_id },
                dataType: 'json',
                success: function(res) {
                    console.log('delete_object_goal.php response:', res);
                    if (!res.success) {
                        alert('DB削除失敗: ' + (res.error || '不明なエラー'));
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX通信エラー:', status, error, xhr);
                }
            });
        }
        goals.splice(idx, 1);
        localStorage.setItem('weeklyGoals', JSON.stringify(goals));
        renderWeeklyGoals();
    };

    // 中目標
    if (addMediumBtn) {
        addMediumBtn.onclick = function() {
            var text = mediumInput.value.trim();
            if (!text) {
                alert('中目標内容を入力してください');
                return;
            }
            var goals = JSON.parse(localStorage.getItem('mediumGoals') || '[]');
            goals.push({ text: text, createdAt: new Date().toISOString() });
            localStorage.setItem('mediumGoals', JSON.stringify(goals));
            mediumInput.value = '';
            renderMediumGoals();
        };
    }
    function renderMediumGoals() {
        var goals = JSON.parse(localStorage.getItem('mediumGoals') || '[]');
        if (!mediumListDiv) return;
        if (goals.length === 0) {
            mediumListDiv.innerHTML = '<div style="color:#aaa;text-align:center;padding:8px;font-size:12px;">まだ中目標がありません</div>';
            return;
        }
        var html = '';
        goals.forEach(function(goal, idx) {
            html += '<div style="background:#f7f3fa;border:1px solid #6f42c1;border-radius:6px;padding:7px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">'
                                + '<span>' + goal.text + '</span>'
                                + '<button onclick="deleteMediumGoal(' + idx + ')" class="goal-delete-btn" title="削除">'
                                + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><circle cx="8" cy="8" r="7" fill="#dc3545"/><path d="M5 8h6" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
                                + '</button>'
                + '</div>';
        });
        mediumListDiv.innerHTML = html;
    }
    window.deleteMediumGoal = function(idx) {
        var goals = JSON.parse(localStorage.getItem('mediumGoals') || '[]');
        goals.splice(idx, 1);
        localStorage.setItem('mediumGoals', JSON.stringify(goals));
        renderMediumGoals();
    };

    // 大目標 (年別管理に修正)
    // 年選択のUIを動的に生成
    function setupYearSelect() {
        if (!largeGoalYearSelect) return;
        var currentYear = new Date().getFullYear();
        var startYear = currentYear - 5; // 過去5年
        var endYear = currentYear + 5;   // 未来5年
        for (let year = startYear; year <= endYear; year++) {
            var option = document.createElement('option');
            option.value = year;
            option.textContent = year + '年';
            if (year === currentYear) {
                option.selected = true;
            }
            largeGoalYearSelect.appendChild(option);
        }
        largeGoalYearSelect.onchange = renderLargeGoals;
    }

    if (addLargeBtn) {
        addLargeBtn.onclick = function() {
            var text = largeInput.value.trim();
            if (!text) {
                alert('大目標内容を入力してください');
                return;
            }
            var selectedYear = largeGoalYearSelect.value;
            var allGoals = JSON.parse(localStorage.getItem('largeGoalsByYear') || '{}');
            var goalsForYear = allGoals[selectedYear] || [];
            
            goalsForYear.push({ text: text, createdAt: new Date().toISOString() });
            allGoals[selectedYear] = goalsForYear;
            localStorage.setItem('largeGoalsByYear', JSON.stringify(allGoals));
            largeInput.value = '';
            renderLargeGoals();
        };
    }
    function renderLargeGoals() {
        var selectedYear = largeGoalYearSelect ? largeGoalYearSelect.value : new Date().getFullYear();
        var allGoals = JSON.parse(localStorage.getItem('largeGoalsByYear') || '{}');
        var goals = allGoals[selectedYear] || [];
        
        if (!largeListDiv) return;
        if (goals.length === 0) {
            largeListDiv.innerHTML = '<div style="color:#aaa;text-align:center;padding:8px;font-size:12px;">' + selectedYear + '年の大目標はまだありません</div>';
            return;
        }
        var html = '';
        goals.forEach(function(goal, idx) {
            html += '<div style="background:#f2f6fa;border:1px solid #1976d2;border-radius:6px;padding:7px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">'
                + '<span>' + goal.text + '</span>'
                + '<button onclick="deleteLargeGoal(' + idx + ')" style="background:#dc3545;color:white;border:none;border-radius:3px;padding:3px 8px;font-size:12px;cursor:pointer;">削除</button>'
                + '</div>';
        });
        largeListDiv.innerHTML = html;
    }
    window.deleteLargeGoal = function(idx) {
        var selectedYear = largeGoalYearSelect.value;
        var allGoals = JSON.parse(localStorage.getItem('largeGoalsByYear') || '{}');
        var goalsForYear = allGoals[selectedYear] || [];

        goalsForYear.splice(idx, 1);
        allGoals[selectedYear] = goalsForYear;
        localStorage.setItem('largeGoalsByYear', JSON.stringify(allGoals));
        renderLargeGoals();
    };

    // 追加: メニューラベルを週目標表示と同期するヘルパ
    function updateAddWeeklyMenuLabel() {
        try {
            var labelEl = document.getElementById('addWeeklyGoalMenuLabel');
            if (!labelEl) return;
            var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
            if (goals && goals.length > 0) {
                var g = goals[0];
                var s = new Date(g.start || g.start_date);
                var e = new Date(g.end || g.finish_date);
                if (isNaN(s.getTime()) || isNaN(e.getTime())) {
                    // 日付が不正な場合はフォールバックテキストを使用
                    var currentLang = getCurrentLang();
                    var fallback = (window.langDict && window.langDict[currentLang] && window.langDict[currentLang]['addWeeklyGoalMenuLabel']) ? window.langDict[currentLang]['addWeeklyGoalMenuLabel'] : '小目標に追加';
                    labelEl.textContent = fallback;
                } else {
                    var sStr = (s.getMonth() + 1) + '月' + s.getDate() + '日';
                    var eStr = (e.getMonth() + 1) + '月' + e.getDate() + '日';
                    labelEl.textContent = sStr + '〜' + eStr + 'の目標として追加';
                }
            } else {
                var currentLang = getCurrentLang();
                var fallback = (window.langDict && window.langDict[currentLang] && window.langDict[currentLang]['addWeeklyGoalMenuLabel']) ? window.langDict[currentLang]['addWeeklyGoalMenuLabel'] : '小目標に追加';
                labelEl.textContent = fallback;
            }
        } catch (e) {
            console.warn('updateAddWeeklyMenuLabel error', e);
        }
    }

    // weeklyGoalsList が存在すれば変化を監視してラベル同期を行う
    if (weeklyListDiv) {
        try {
            var mo = new MutationObserver(function(mutations) {
                updateAddWeeklyMenuLabel();
            });
            mo.observe(weeklyListDiv, { childList: true, subtree: true, characterData: true });
        } catch (e) {
            console.warn('MutationObserver setup failed', e);
        }
    }

    // 初期化
    setupYearSelect();
    renderWeeklyGoals();
    // expose minimal helpers for weekly_report.js to reuse
    try {
        window._goalListHelpers = {
            t: t,
            getCurrentLang: getCurrentLang,
            fetchWeeklyGoalsFromDB: fetchWeeklyGoalsFromDB,
            fetchObjectNodeInfo: fetchObjectNodeInfo,
            renderWeeklyGoals: function(){ if (typeof window.renderWeeklyGoals === 'function') window.renderWeeklyGoals(); }
        };
        if (window.initWeeklyReportHandlers && typeof window.initWeeklyReportHandlers === 'function') {
            try { window.initWeeklyReportHandlers(window._goalListHelpers); } catch(e) { console.warn('initWeeklyReportHandlers after init failed', e); }
        }
    } catch(e){ console.warn('expose goal helpers failed', e); }
    // render後にラベルを同期
    updateAddWeeklyMenuLabel();
    renderMediumGoals();
    renderLargeGoals();
});

window.addWeeklyGoal = function() {
    console.log('[goal_list] addWeeklyGoal called');
    try {
        if (typeof _jm === 'undefined' || !_jm) {
            console.warn('[goal_list] _jm is undefined');
        }
    } catch (e) {
        console.warn('[goal_list] _jm check failed', e);
    }
    // 選択中ノードIDを取得
    var selected_node_id = null;
    try {
        var sel = (typeof _jm !== 'undefined' && _jm && typeof _jm.get_selected_node === 'function') ? _jm.get_selected_node() : null;
        selected_node_id = sel && sel.id ? sel.id : null;
    } catch (err) {
        console.error('[goal_list] get_selected_node error', err);
    }
    console.log('[goal_list] selected_node_id:', selected_node_id);
    if (!selected_node_id) {
        alert('ノードが選択されていません');
        return;
    }
    // 画面を即座に更新（localStorageに仮追加）
    var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
    if (goals.length > 0) {
        // 最新の小目標にノード内容を追加（先頭が最新）
        var latestGoal = goals[0];
        if (!latestGoal.contents) latestGoal.contents = [];
        // マインドマップからノード内容取得
        var selectedNode = sel || ((typeof _jm !== 'undefined' && _jm && typeof _jm.get_selected_node === 'function') ? _jm.get_selected_node() : null);
        var nodeContent = selectedNode && selectedNode.topic ? selectedNode.topic : '(内容なし)';
        console.log('[goal_list] adding nodeContent to latestGoal:', nodeContent);
        latestGoal.contents.push(nodeContent);
        localStorage.setItem('weeklyGoals', JSON.stringify(goals));
        try { renderWeeklyGoals(); } catch(e){ console.warn('[goal_list] renderWeeklyGoals error', e); }
    }
    // PHPへAJAXリクエスト送信
    console.log('[goal_list] sending AJAX to update_latest_goal_node.php with node_id=', selected_node_id);
    $.ajax({
        url: 'php/update_latest_goal_node.php',
        type: 'POST',
        data: { node_id: selected_node_id },
        success: function(response) {
            console.log('[goal_list] 最新の小目標にnode_idを保存しました:', response);
            // DB反映後に再取得
            if (typeof fetchWeeklyGoalsFromDB === 'function') {
                try { fetchWeeklyGoalsFromDB(); } catch(e){ console.warn('[goal_list] fetchWeeklyGoalsFromDB failed', e); }
            }
        },
        error: function(xhr, status, error) {
            console.error('[goal_list] 保存に失敗しました:', error, status);
            alert('保存に失敗しました');
        }
    });
};

// グローバル: node-icon-container に対してホバー/フォーカスでカスタムツールチップを表示
(function(){
    function getCurrentLangSafe() {
        try { return (document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja'; } catch(e){ return 'ja'; }
    }
    function showGlobalTooltip(text, target) {
        try {
            var existing = document.getElementById('gl_custom_tooltip');
            if (existing) existing.parentNode.removeChild(existing);
            var tip = document.createElement('div');
            tip.id = 'gl_custom_tooltip';
            tip.textContent = text;
            tip.style.position = 'absolute';
            tip.style.background = 'rgba(0,0,0,0.8)';
            tip.style.color = '#fff';
            tip.style.padding = '6px 8px';
            tip.style.borderRadius = '6px';
            tip.style.fontSize = '13px';
            tip.style.zIndex = 20000;
            tip.style.pointerEvents = 'none';
            document.body.appendChild(tip);
            var rect = target.getBoundingClientRect();
            // position above if space, otherwise below
            var top = rect.top - tip.offsetHeight - 8 + window.scrollY;
            if (top < 6) top = rect.bottom + 8 + window.scrollY;
            var left = rect.left + (rect.width - tip.offsetWidth) / 2 + window.scrollX;
            if (left < 6) left = 6 + window.scrollX;
            tip.style.top = top + 'px';
            tip.style.left = left + 'px';
        } catch (e) {
            // ignore
        }
    }
    function hideGlobalTooltip() {
        try { var ex = document.getElementById('gl_custom_tooltip'); if (ex) ex.parentNode.removeChild(ex); } catch(e){}
    }

    // マウスオーバー/アウト（delegation）
    document.addEventListener('mouseover', function(e){
        var node = e.target.closest && e.target.closest('.node-icon-container');
        if (node) {
            var text = (getCurrentLangSafe() === 'ja') ? '目標手段階層マップがあります' : 'Goal hierarchy map available';
            showGlobalTooltip(text, node);
        }
    });
    document.addEventListener('mouseout', function(e){
        var node = e.target.closest && e.target.closest('.node-icon-container');
        if (node) hideGlobalTooltip();
    });

    // キーボードフォーカス対応
    document.addEventListener('focusin', function(e){
        var node = e.target.closest && e.target.closest('.node-icon-container');
        if (node) {
            var text = (getCurrentLangSafe() === 'ja') ? '目標手段階層マップがあります' : 'Goal hierarchy map available';
            showGlobalTooltip(text, node);
        }
    });
    document.addEventListener('focusout', function(e){
        var node = e.target.closest && e.target.closest('.node-icon-container');
        if (node) hideGlobalTooltip();
    });

    // クリックで目標手段階層マップを開く
    document.addEventListener('click', function(e) {
        var icon = e.target.closest && e.target.closest('.node-icon-container');
        if (!icon) return;
        // 近傍の jmnode や node 要素から node id を取得する
        var nodeElem = icon.closest && (icon.closest('jmnode') || icon.closest('[nodeid]') || icon.closest('[data-nodeid]') || icon.closest('[id]'));
        var nodeId = null;
        var nodeText = '';
        try {
            if (nodeElem) {
                nodeId = nodeElem.getAttribute('nodeid') || nodeElem.getAttribute('data-nodeid') || nodeElem.getAttribute('id') || null;
                nodeText = (nodeElem.textContent || '').trim();
            }
        } catch (err) {
            console.warn('node id detection failed', err);
        }
        try {
            if (nodeId) {
                try { sessionStorage.setItem('processMap_targetNodeId', nodeId); } catch(e) { window.processMap_targetNodeId = nodeId; }
            } else if (nodeText) {
                try { sessionStorage.setItem('processMap_targetText', nodeText); } catch(e) { window.processMap_targetText = nodeText; }
            }
        } catch(e){}
        // マップを開く
        try {
            if (typeof showThinkingProcessMap === 'function') {
                showThinkingProcessMap();
            } else {
                // フォールバック: 関数がなければナビゲータ表示を試みる
                if (typeof showNavigatorGreeting === 'function') showNavigatorGreeting();
            }
        } catch(err) {
            console.error('showThinkingProcessMap call failed', err);
        }
    });
})();
