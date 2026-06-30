// node_idからobject_node_id一覧を取得する関数
function fetchObjectNodeInfo(nodeId) {
    return new Promise(function (resolve) {
        console.log('get_object_node_info.phpへ送信するnode_id:', nodeId);
        $.ajax({
            url: 'php/get_object_node_info.php',
            type: 'GET',
            dataType: 'json',
            data: {
                node_id: nodeId
            },
            success: function (res) {
                // サーバーが返す object_node_ids をログ出力
                try { console.log('get_object_node_info.php object_node_ids for', nodeId, res.object_node_ids); } catch (e) { }
                // サーバーが返す object_node_history_ids と histories もログ出力
                try { console.log('get_object_node_info.php object_node_history_ids for', nodeId, res.object_node_history_ids); } catch (e) { }
                try { console.log('get_object_node_info.php histories for', nodeId, res.histories); } catch (e) { }
                var rows = [];
                if (res && res.success && Array.isArray(res.data) && res.data.length) {
                    // 履歴が返っている場合、object_node_id ごとに紐づけるためのマップを作成
                    var historyMap = {};
                    if (res.histories && Array.isArray(res.histories)) {
                        res.histories.forEach(function (h) {
                            var onid = h.object_node_id || '';
                            if (!historyMap[onid]) historyMap[onid] = [];
                            historyMap[onid].push(h);
                        });
                    }
                    res.data.forEach(function (row) {
                        var onid = row.object_node_id;
                        var linkedHistories = historyMap[onid] || [];
                        var historyIds = linkedHistories.map(function (h) { return h.object_node_history_id; });
                        rows.push({
                            object_node_id: onid,
                            node_id: row.node_id,
                            content: row.content,
                            object_node_history_ids: historyIds,
                            histories: linkedHistories
                        });
                    });
                    var objectNodeIds = rows.map(function (row) { return row.object_node_id; });
                    console.log('取得object_node_id: ' + objectNodeIds.join(', '));
                } else {
                    rows.push({ object_node_id: '', node_id: nodeId, content: '' });
                }
                resolve(rows);
            },
            error: function (xhr, status, error) {
                console.error('get_object_node_info.php error:', status, error);
                resolve([{ object_node_id: '', node_id: nodeId, content: '' }]);
            }
        });
    });
}

// グローバルヘルパ: localStorageのキーを取得（MAPIDごとに分離）
function getStorageKey(baseName) {
    var mapId = window.MAPID || 'default';
    return baseName + '_' + mapId;
}

// --- 目標管理エリア（小・中・大目標） ---
document.addEventListener('DOMContentLoaded', function () {
    // 注意: SRLジャーナルのデータはDBの`object_journals`テーブルで管理
    // localStorageは表示キャッシュとしてのみ使用
    // map_idごとにDBからデータを取得して表示する（fetchWeeklyGoalsFromDB）

    // ヘルパ: 現在の言語を取得（トグルの状態に依存）
    function getCurrentLang() {
        var toggle = document.getElementById('language-toggle');
        return (toggle && toggle.checked) ? 'en' : 'ja';
    }

    // ヘルパ: 言語辞書からキーを取得、なければフォールバックを返す
    var _fallbacks = {
        'pleaseEnterDates': '開始日と終了日を入力してください',
        'noWeeklyGoals': '目標がありません',
        'unlinked': '未リンク',
        'edit': '編集',
        'exportReport': '振り返る',
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
            success: function (res) {
                console.log('get_latest_object_goal.php response:', res);
                if (res.success && Array.isArray(res.goals)) {
                    // object_journal_idごとにnode_idをまとめる
                    var goalMap = {};
                    res.goals.forEach(function (row) {
                        // Accept multiple possible column names from server: prefer object_journal_id, fall back to object_journal_id
                        var journalId = row.object_journal_id || row.object_goal_id || row.object_goal || row.objectJournalId || row.objectGoalId || null;
                        // If still null, synthesize an id from date range and any legacy id available
                        if (!journalId) journalId = (row.start_date || '') + '::' + (row.finish_date || '') + '::' + (row.object_journal_id || row.object_goal_id || '');

                        if (!goalMap[journalId]) {
                            goalMap[journalId] = {
                                start: row.start_date,
                                end: row.finish_date,
                                object_journal_id: journalId,
                                contents: []
                            };
                        }
                        goalMap[journalId].contents.push({
                            node_id: row.node_id || '',
                            content: row.content || ''
                        });
                    });
                    var goals = Object.values(goalMap);
                    // 最新の目標を先頭に表示するため、開始日で降順ソート（新しいものを先頭に）
                    goals.sort(function (a, b) {
                        var da = new Date(a.start || a.start_date);
                        var db = new Date(b.start || b.start_date);
                        return db - da;
                    });
                    localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));
                    renderWeeklyGoals();
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX通信エラー:', status, error, xhr);
            }
        });
    }
    // Ensure weeklyGoals entries always have `object_journal_id` normalized
    function normalizeWeeklyGoalsStorage() {
        try {
            var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
            if (!Array.isArray(goals) || !goals.length) return;
            var changed = false;
            goals = goals.map(function (g) {
                if (!g) return g;
                // If old property exists, migrate it into object_journal_id then remove deprecated keys
                var migrated = false;
                if (!g.object_journal_id) {
                    var fallback = g.object_goal_id || g.object_goal || g.objectGoalId || g.objectJournalId || null;
                    if (fallback) {
                        g.object_journal_id = fallback;
                        migrated = true;
                    }
                }
                // remove deprecated variants to avoid future confusion
                if (typeof g.object_goal_id !== 'undefined') { delete g.object_goal_id; migrated = true; }
                if (typeof g.object_goal !== 'undefined') { delete g.object_goal; migrated = true; }
                if (typeof g.objectGoalId !== 'undefined') { delete g.objectGoalId; migrated = true; }
                if (typeof g.objectJournalId !== 'undefined') { delete g.objectJournalId; /* this may be a duplicate form; remove to keep canonical */ migrated = true; }
                if (migrated) changed = true;
                return g;
            });
            if (changed) localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));
        } catch (e) {
            console.warn('normalizeWeeklyGoalsStorage failed', e);
        }
    }
    // Normalize any existing stored weeklyGoals before doing network fetches or rendering.
    try { normalizeWeeklyGoalsStorage(); } catch (e) { console.warn('initial normalizeWeeklyGoalsStorage failed', e); }

    // DBからデータを取得する前にlocalStorageをクリア
    // これにより、常にDBのmap_id別データが使用される
    try { localStorage.removeItem(getStorageKey('weeklyGoals')); } catch (e) { }

    fetchWeeklyGoalsFromDB();
    // 小目標
    var addWeeklyBtn = document.getElementById('addCycleBtn');
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
        addWeeklyBtn.onclick = function (e) {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
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
            modalContent.style.padding = '32px';
            modalContent.style.borderRadius = '12px';
            modalContent.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
            modalContent.style.border = '1px solid #e2e8f0';
            modalContent.style.minWidth = '360px';
            modalContent.style.maxWidth = '90vw';
            modalContent.style.color = '#2d3748';

            var title = document.createElement('h3');
            title.textContent = '🧭 次のMTまでの期間を設定してください';
            title.style.marginTop = '0';
            title.style.marginBottom = '24px';
            title.style.fontSize = '18px';
            title.style.fontWeight = '600';
            title.style.color = '#1a202c';
            modalContent.appendChild(title);

            var presetWrap = document.createElement('div');
            presetWrap.style.display = 'flex';
            presetWrap.style.gap = '8px';
            presetWrap.style.marginBottom = '12px';

            function createPresetBtn(text, onClick) {
                var btn = document.createElement('button');
                btn.textContent = text;
                btn.style.background = '#edf2f7';
                btn.style.color = '#4a5568';
                btn.style.border = 'none';
                btn.style.borderRadius = '6px';
                btn.style.padding = '6px 12px';
                btn.style.fontSize = '13px';
                btn.style.cursor = 'pointer';
                btn.style.transition = 'background 0.2s';
                btn.onmouseenter = function () { btn.style.background = '#e2e8f0'; };
                btn.onmouseleave = function () { btn.style.background = '#edf2f7'; };
                btn.onclick = onClick;
                return btn;
            }

            var startInput = document.createElement('input');
            startInput.type = 'date';
            startInput.style.border = 'none';
            startInput.style.background = 'transparent';
            startInput.style.color = '#2d3748';
            startInput.style.fontWeight = '500';
            startInput.style.outline = 'none';
            startInput.style.flex = '1';

            var endInput = document.createElement('input');
            endInput.type = 'date';
            endInput.style.border = 'none';
            endInput.style.background = 'transparent';
            endInput.style.color = '#2d3748';
            endInput.style.fontWeight = '500';
            endInput.style.outline = 'none';
            endInput.style.flex = '1';

            var btnOneWeekLater = createPresetBtn('[ 1週間後 ]', function () {
                var today = new Date();
                var nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                var offsetMs = today.getTimezoneOffset() * 60 * 1000;
                var localToday = new Date(today.getTime() - offsetMs);
                var localNextWeek = new Date(nextWeek.getTime() - offsetMs);

                startInput.value = localToday.toISOString().split('T')[0];
                endInput.value = localNextWeek.toISOString().split('T')[0];
            });

            presetWrap.appendChild(btnOneWeekLater);
            modalContent.appendChild(presetWrap);

            var dateWrap = document.createElement('div');
            dateWrap.style.display = 'flex';
            dateWrap.style.alignItems = 'center';
            dateWrap.style.background = '#eafbe7';
            dateWrap.style.border = '1px solid #c6f6d5';
            dateWrap.style.borderRadius = '8px';
            dateWrap.style.padding = '8px 12px';
            dateWrap.style.gap = '12px';
            dateWrap.style.marginBottom = '24px';

            var separator = document.createElement('span');
            separator.textContent = '〜';
            separator.style.color = '#718096';

            dateWrap.appendChild(startInput);
            dateWrap.appendChild(separator);
            dateWrap.appendChild(endInput);
            modalContent.appendChild(dateWrap);

            var btnWrap = document.createElement('div');
            btnWrap.style.display = 'flex';
            btnWrap.style.justifyContent = 'flex-end';
            btnWrap.style.gap = '12px';

            var cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'キャンセル';
            cancelBtn.style.padding = '10px 16px';
            cancelBtn.style.background = '#edf2f7';
            cancelBtn.style.color = '#718096';
            cancelBtn.style.border = 'none';
            cancelBtn.style.borderRadius = '8px';
            cancelBtn.style.cursor = 'pointer';
            cancelBtn.style.fontWeight = '600';
            cancelBtn.style.transition = 'background 0.2s';
            cancelBtn.onmouseenter = function () { cancelBtn.style.background = '#e2e8f0'; };
            cancelBtn.onmouseleave = function () { cancelBtn.style.background = '#edf2f7'; };

            var saveBtn = document.createElement('button');
            saveBtn.textContent = 'この期間でSRLジャーナルを作成';
            saveBtn.style.padding = '10px 20px';
            saveBtn.style.background = '#48bb78';
            saveBtn.style.color = '#fff';
            saveBtn.style.border = 'none';
            saveBtn.style.borderRadius = '8px';
            saveBtn.style.cursor = 'pointer';
            saveBtn.style.fontWeight = '600';
            saveBtn.style.boxShadow = '0 2px 8px rgba(72,187,120,0.3)';
            saveBtn.style.transition = 'background 0.2s, transform 0.1s';
            saveBtn.onmouseenter = function () { saveBtn.style.background = '#38a169'; };
            saveBtn.onmouseleave = function () { saveBtn.style.background = '#48bb78'; };
            saveBtn.onmousedown = function () { saveBtn.style.transform = 'scale(0.98)'; };
            saveBtn.onmouseup = function () { saveBtn.style.transform = 'scale(1)'; };

            btnWrap.appendChild(cancelBtn);
            btnWrap.appendChild(saveBtn);
            modalContent.appendChild(btnWrap);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            cancelBtn.onclick = function () {
                document.body.removeChild(modal);
            };

            saveBtn.onclick = function () {
                var startDate = startInput.value;
                var endDate = endInput.value;
                if (!startDate || !endDate) {
                    alert(t('pleaseEnterDates'));
                    return;
                }
                $.ajax({
                    url: 'php/insert_object_goal.php',
                    type: 'POST',
                    data: {
                        start_date: startDate,
                        finish_date: endDate,
                        map_id: (typeof window.MAPID !== 'undefined') ? window.MAPID : ''
                    },
                    dataType: 'json',
                    success: function (res) {
                        console.log('insert_object_goal.php response:', res);
                        if (res.success) {
                            var ojId = res.object_journal_id;
                            var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
                            goals.unshift({ start: startDate, end: endDate, createdAt: new Date().toISOString(), object_journal_id: ojId });
                            localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));

                            // Also create an initial reflection record linked to this object_journal
                            try {
                                $.ajax({
                                    url: 'php/insert_object_journal_reflection.php',
                                    type: 'POST',
                                    dataType: 'json',
                                    data: { object_journal_id: ojId },
                                    success: function (rres) {
                                        console.log('insert_object_journal_reflection.php response:', rres);
                                        try {
                                            if (rres && rres.success && rres.object_journal_reflection_id) {
                                                // persist the reflection id into localStorage for this newly created goal (it's at index 0)
                                                try {
                                                    var stored = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
                                                    if (stored && stored.length && stored[0] && stored[0].object_journal_id == ojId) {
                                                        stored[0].object_journal_reflection_id = rres.object_journal_reflection_id;
                                                        localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(stored));
                                                    }
                                                } catch (e) { console.warn('failed to persist reflection id for new weekly goal', e); }
                                            }
                                        } catch (e) { }
                                    },
                                    error: function (xhr, status, err) {
                                        console.warn('insert_object_journal_reflection failed', status, err, xhr && xhr.responseText);
                                    }
                                });
                            } catch (e) { console.warn('reflection insert ajax failed', e); }

                            document.body.removeChild(modal);
                            renderWeeklyGoals();
                        } else {
                            alert(t('dbRegisterFail') + (res.error || '不明なエラー'));
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('AJAX通信エラー:', status, error, xhr);
                        alert(t('communicationError'));
                    }
                });
            };
        };
    }
    window.renderWeeklyGoals = function () {
        // Normalize stored goals to ensure object_journal_id is present (fallback from object_goal_id)
        normalizeWeeklyGoalsStorage();
        var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
        if (!weeklyListDiv) return;
        if (goals.length === 0) {
            weeklyListDiv.innerHTML = '<div style="color:#888;text-align:center;padding:12px;">' + t('noWeeklyGoals') + '</div>';
            return;
        }
        var html = '';
        var currentYear = null;
        goals.forEach(function (goal, idx) {
            // 編集ボタンのツールチップ（ローカライズ）
            var editBtnTitle = (getCurrentLang() === 'ja') ? '日付を編集できます' : 'You can edit dates';
            var nodeHtml = '';
            if (goal.contents && goal.contents.length) {
                nodeHtml = goal.contents.map(function (contentItem, cidx) {
                    var contentText = '';
                    if (contentItem && typeof contentItem === 'object') {
                        contentText = (contentItem.content || contentItem.node_id || '').trim();
                    } else {
                        contentText = (contentItem || '').toString().trim();
                    }
                    if (!contentText) contentText = t('unlinked');
                    // data 属性を付与して後でイベントバインドしやすくする
                    var nodeIdAttr = (contentItem && typeof contentItem === 'object' && contentItem.node_id) ? contentItem.node_id : '';
                    return '<div class="jmnode question-item" draggable="true" data-goal-idx="' + idx + '" data-content-idx="' + cidx + '" data-node-id="' + nodeIdAttr + '" title="SRL整理マップを開けます">' +
                        '<div style="display:flex; align-items:center; gap:6px;">' +
                        '<span class="drag-handle" title="ドラッグして並び替え" style="cursor:grab; color:#ccc;">⋮⋮</span>' +
                        '<span>' + contentText + '</span>' +
                        '</div>' +
                        '<button onclick="deleteGoalNode(' + idx + ',' + cidx + ')" class="goal-delete-btn" title="削除" style="background:transparent;border:none;cursor:pointer;padding:0;">' +
                        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><path d="M4 8h8" stroke="#999" stroke-width="2" stroke-linecap="round"/></svg>' +
                        '</button>' +
                        '</div>';
                }).join('');
            } else {
                nodeHtml = '<div class="jmnode question-item" style="color:#888;">' + t('unlinked') + '</div>';
            }
            var startDate = new Date(goal.start || goal.start_date);
            var endDate = new Date(goal.end || goal.finish_date);
            var startStr = (startDate.getMonth() + 1) + '/' + startDate.getDate();
            var endStr = (endDate.getMonth() + 1) + '/' + endDate.getDate();
            // 振り返りデータはホバー時に動的フェッチするためプレースホルダーをセット
            var popoverHtml = '<div class="reflection-popover" data-loaded="false" data-loading="false">' +
                '<div class="popover-status-empty">読み込み中...</div>' +
                '</div>';

            var goalYear = startDate.getFullYear();
            if (currentYear !== goalYear) {
                html += '<div class="year-separator">' +
                    '<span class="year-text">' + goalYear + '</span>' +
                    '<div class="year-line"></div>' +
                    '</div>';
                currentYear = goalYear;
            }

            html += '<div class="weekly-goal-card-container journal-card" data-goal-idx="' + idx + '" title="クリックすると、ここに含まれるすべての問いのSRL整理マップを同時に開くことができます">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                + '<span class="weekly-goal-date-range journal-date" data-idx="' + idx + '" data-start="' + startStr + '" data-end="' + endStr + '">' + startStr + '〜' + endStr + '</span>'
                + '<div class="btn-reflect-container">'
                + '<button class="export-weekly-btn btn-reflect custom-tooltip" data-idx="' + idx + '" id="exportWeeklyGoalBtn' + idx + '" data-tooltip="' + startStr + '〜' + endStr + 'の活動を振り返る">'
                + (goal.reflection_count > 0 ? '<span style="font-size: 14px;">🌸</span>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path></svg>')
                + '</button>'
                + popoverHtml
                + '</div>'
                + '</div>'
                + '<div class="goal-nodes-container" style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;">' + nodeHtml + '</div>'
                + '<div style="text-align:right;margin-top:8px;">'
                + '<button onclick="deleteWeeklyGoal(' + idx + ')" class="goal-delete-btn btn-delete-cycle custom-tooltip" data-tooltip="' + t('delete') + '" id="deleteWeeklyGoalBtn' + idx + '">'
                + '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
                + '</button>'
                + '</div>'
                + '</div>';
        });
        weeklyListDiv.innerHTML = html;

        // ドラッグ＆ドロップによる並び替え処理
        var containers = weeklyListDiv.querySelectorAll('.goal-nodes-container');
        containers.forEach(function (container) {
            var draggedItem = null;
            container.addEventListener('dragstart', function (e) {
                var target = e.target.closest('.question-item');
                if (!target || e.target.closest('.goal-delete-btn')) return;
                draggedItem = target;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', ''); // Firefox用
                setTimeout(function () {
                    target.style.opacity = '0.5';
                }, 0);
            });
            container.addEventListener('dragend', function (e) {
                if (draggedItem) {
                    draggedItem.style.opacity = '1';
                    draggedItem = null;
                }
            });
            container.addEventListener('dragover', function (e) {
                e.preventDefault(); // ドロップを許可
                e.dataTransfer.dropEffect = 'move';
                var target = e.target.closest('.question-item');
                if (target && target !== draggedItem) {
                    var rect = target.getBoundingClientRect();
                    var next = (e.clientX - rect.left) / (rect.right - rect.left) > 0.5;
                    container.insertBefore(draggedItem, next ? target.nextSibling : target);
                }
            });
            container.addEventListener('drop', function (e) {
                e.preventDefault();
                if (draggedItem) {
                    var goalIdx = draggedItem.getAttribute('data-goal-idx');
                    var newOrder = Array.from(container.querySelectorAll('.question-item')).map(function (item) {
                        return {
                            node_id: item.getAttribute('data-node-id'),
                            content: (item.querySelector('span:not(.drag-handle)') ? item.querySelector('span:not(.drag-handle)').textContent.trim() : '')
                        };
                    });

                    var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
                    if (goals[goalIdx]) {
                        goals[goalIdx].contents = newOrder;
                        localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));

                        $.ajax({
                            url: 'php/reorder_goal_nodes.php',
                            type: 'POST',
                            data: {
                                object_journal_id: goals[goalIdx].object_journal_id,
                                ordered_nodes: JSON.stringify(newOrder)
                            },
                            success: function (res) {
                                console.log('Reorder saved', res);
                                // 順番の保存後に描画をリフレッシュして内部インデックスを同期する
                                window.renderWeeklyGoals();
                            }
                        });
                    }
                }
            });
        });

        // 生成された .jmnode 要素にクリックリスナを登録（削除ボタンのクリックは除外）
        try {
            var jmnodes = weeklyListDiv.querySelectorAll('.jmnode');
            jmnodes.forEach(function (el) {
                // remove existing listener if any (defensive)
                el.removeEventListener('click', el._goalClickHandler);
                var handler = function (e) {
                    // 削除ボタンがクリックされた場合は無視
                    if (e.target.closest('.goal-delete-btn')) return;
                    var gidx = el.getAttribute('data-goal-idx');
                    var cidx = el.getAttribute('data-content-idx');
                    var text = (el.querySelector('span') ? el.querySelector('span').textContent.trim() : '');
                    var explicitNodeId = el.getAttribute('data-node-id') || '';

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

                    var nodeId = explicitNodeId || findMindmapNodeIdByText(text);
                    console.log('クリックした', { goalIndex: gidx, contentIndex: cidx, text: text, nodeId: nodeId });

                    // 優先: マインドマップ上で対応するノードを選択して、
                    // そのノードのアイコン（.node-icon-wrapper）をプログラム的にクリックする。
                    // アイコンが見つからない場合は既存のフォールバック処理を実行。
                    (function openProcessMapForNode(nodeId, isShiftKey) {
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
                                            iconWrapper.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: isShiftKey }));
                                            return; // 成功したらここで終わり
                                        } catch (evErr) {
                                            try { iconWrapper.click(); return; } catch (e) {/* fallthrough */ }
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
                                try { showNavigatorGreeting(); } catch (e) { console.warn('showNavigatorGreeting error', e); }
                            }
                        } catch (e) {/* ignore */ }

                        try {
                            if (typeof showThinkingProcessMap === 'function') {
                                showThinkingProcessMap(nodeId, isShiftKey);
                            } else {
                                console.warn('showThinkingProcessMap 関数が見つかりません');
                            }
                        } catch (err) {
                            console.error('showThinkingProcessMap 呼出しエラー', err);
                        }
                    })(nodeId, e.shiftKey);
                };
                el._goalClickHandler = handler;
                el.addEventListener('click', handler);
            });
            // 追加: 未リンク（表示テキストが t('unlinked')） の jmnode をクリックした場合は案内アラートを表示
            jmnodes.forEach(function (el) {
                try {
                    var hasGoalAttr = el.hasAttribute('data-goal-idx') || el.hasAttribute('data-content-idx');
                    var text = (el.textContent || '').trim();
                    if (!hasGoalAttr && text === t('unlinked')) {
                        // remove existing special handler if any
                        if (el._unlinkedHandler) el.removeEventListener('click', el._unlinkedHandler);
                        var unlinkedHandler = function (e) {
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

            // 追加: 期間カード全体に対する全マップ一括表示機能（日付編集などとの競合回避）
            var cardContainers = weeklyListDiv.querySelectorAll('.weekly-goal-card-container');
            cardContainers.forEach(function (card) {
                card.removeEventListener('click', card._cardClickHandler);
                var handler = function (e) {
                    // 日付のダブルクリック編集（input含む）、削除ボタン、エクスポートボタン、個別のノードクリック時はキャンセル
                    if (e.target.closest('.weekly-goal-date-range') || e.target.tagName.toLowerCase() === 'input' || e.target.closest('.goal-delete-btn') || e.target.closest('.export-weekly-btn') || e.target.closest('.jmnode')) {
                        return; // イベント無視（既存の機能を妨害しない）
                    }

                    var nodesInCard = card.querySelectorAll('.jmnode');
                    if (!nodesInCard || nodesInCard.length === 0) return;

                    // mindmap の jmnode 要素から nodeid を探すヘルパ（カード用）
                    function findMindmapNodeIdByText(targetText) {
                        if (!targetText) return null;
                        try {
                            var targetJmNodes = document.getElementsByTagName('jmnode');
                            var normTarget = targetText.replace(/\s+/g, ' ').trim().toLowerCase();
                            for (var i = 0; i < targetJmNodes.length; i++) {
                                var n = targetJmNodes[i];
                                var nodeText = (n.textContent || n.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase();
                                if (!nodeText) continue;
                                if (nodeText === normTarget || nodeText.indexOf(normTarget) !== -1 || normTarget.indexOf(nodeText) !== -1) {
                                    return n.getAttribute('nodeid') || n.getAttribute('id') || null;
                                }
                            }
                        } catch (err) { }
                        return null;
                    }

                    // 1つずつ処理し、最初のノードはメイン表示、2つ目以降はShiftクリック相当の並列表示として扱う
                    nodesInCard.forEach(function (nodeEl, index) {
                        var text = (nodeEl.querySelector('span') ? nodeEl.querySelector('span').textContent.trim() : '');
                        var explicitNodeId = nodeEl.getAttribute('data-node-id') || '';
                        var nodeId = explicitNodeId || findMindmapNodeIdByText(text);

                        if (nodeId) {
                            var isShiftKey = (index > 0); // 1つ目はfalse（メイン置換）、2つ目以降はtrue（並列追加）

                            // 保存用（process map 側で参照できるように）
                            try {
                                if (nodeId) sessionStorage.setItem('processMap_targetNodeId', nodeId);
                                sessionStorage.setItem('processMap_targetText', text);
                            } catch (err) {
                                window.processMap_targetNodeId = nodeId;
                                window.processMap_targetText = text;
                            }

                            // jsMindの選択セット
                            try {
                                if (typeof _jm !== 'undefined' && _jm && typeof _jm.select_node === 'function' && nodeId) {
                                    _jm.select_node(nodeId);
                                }
                            } catch (err) { }

                            // 対応する jmnode 要素を探してアイコンクリックを発火（これが最も確実なパス）
                            try {
                                var jmElem = document.querySelector('jmnode[nodeid="' + nodeId + '"]') || document.querySelector('jmnode[id="' + nodeId + '"]');
                                if (jmElem) {
                                    var iconWrapper = jmElem.querySelector('.node-icon-wrapper');
                                    if (iconWrapper) {
                                        iconWrapper.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: isShiftKey }));
                                        return; // 成功したら次へ
                                    }
                                }
                            } catch (err) { }

                            // フォールバック: アイコンがクリックできなければ既存の関数を直叩き
                            try {
                                if (typeof showThinkingProcessMap === 'function') {
                                    showThinkingProcessMap(nodeId, isShiftKey);
                                }
                            } catch (err) { }
                        }
                    });
                };
                card._cardClickHandler = handler;
                card.addEventListener('click', handler);
            });

        } catch (e) {
            console.error('jmnode click bind error', e);
        }
        // --- マインドマップ上で開かれているノードに対応するゴールチップをオレンジ枠で強調 ---
        // テキストから jmnode DOM を探して nodeid を返すユーティリティ
        function mapTextToMindmapNodeId(targetText) {
            if (!targetText) return null;
            try {
                var jmnodes = document.getElementsByTagName('jmnode');
                var normTarget = targetText.replace(/\s+/g, ' ').trim().toLowerCase();
                for (var i = 0; i < jmnodes.length; i++) {
                    var node = jmnodes[i];
                    var nodeText = (node.textContent || node.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase();
                    if (!nodeText) continue;
                    if (nodeText === normTarget || nodeText.indexOf(normTarget) !== -1 || normTarget.indexOf(nodeText) !== -1) {
                        var nid = node.getAttribute('nodeid') || node.getAttribute('id') || null;
                        if (nid) return nid;
                    }
                }
            } catch (err) { console.warn('mapTextToMindmapNodeId failed', err); }
            return null;
        }

        function updateGoalChipHighlights() {
            try {
                // まず DOM 上で選択状態になっている jmnode があればそれを優先して採用する
                var active = null;
                try {
                    var selectedNode = document.querySelector('jmnode.selected') || document.querySelector('[nodeid].selected') || null;
                    if (selectedNode) {
                        active = selectedNode.getAttribute('nodeid') || selectedNode.getAttribute('id') || null;
                    }
                } catch (domSelErr) { /* ignore */ }
                // DOMから見つからなければ sessionStorage / window 側の値を参照する
                if (!active) {
                    try { active = sessionStorage.getItem('processMap_activeNodeId') || sessionStorage.getItem('processMap_targetNodeId') || null; } catch (e) { }
                    if (!active && typeof window.processMap_targetNodeId !== 'undefined') active = window.processMap_targetNodeId || active;
                }

                // 全チップをリセット
                var chips = weeklyListDiv.querySelectorAll('.jmnode');
                chips.forEach(function (chip) { chip.classList.remove('goal-chip-active'); });

                if (!active) return; // 強調する対象が無ければ終了

                // 各チップのテキストからノードIDを推定して比較 (負荷が高い場合はキャッシュ検討)
                chips.forEach(function (chip) {
                    try {
                        var span = chip.querySelector('span');
                        var txt = span ? span.textContent.trim() : '';
                        var explicitNid = chip.getAttribute('data-node-id') || '';
                        var nid = explicitNid || mapTextToMindmapNodeId(txt);
                        if (nid && nid === active) {
                            chip.classList.add('goal-chip-active');
                        }
                    } catch (e) { /* ignore per-chip */ }
                });
            } catch (e) { console.warn('updateGoalChipHighlights failed', e); }
        }
        // 公開して外部からも呼べるようにする
        try { window.updateGoalChipHighlights = updateGoalChipHighlights; } catch (e) { }

        // 同一タブ内でプロセスマップを開いた/選択した際に確実に反映するためのラッパー／クリック監視を追加
        try {
            // showThinkingProcessMap があればラップして呼び出し後に更新
            if (typeof window.showThinkingProcessMap === 'function') {
                var _orig_showThinkingProcessMap = window.showThinkingProcessMap;
                window.showThinkingProcessMap = function () {
                    try { return _orig_showThinkingProcessMap.apply(this, arguments); }
                    finally { try { updateGoalChipHighlights(); } catch (e) { } }
                };
            }
        } catch (e) { console.warn('wrap showThinkingProcessMap failed', e); }

        // node-icon-container のクリックでマップを開く場合に備え、クリック後に更新を試みる
        try {
            document.addEventListener('click', function (ev) {
                var ic = ev.target.closest && ev.target.closest('.node-icon-container');
                if (!ic) return;
                // 少しだけ待って sessionStorage/window 変数が設定されるのを待つ
                setTimeout(function () { try { updateGoalChipHighlights(); } catch (e) { } }, 120);
            }, true);
        } catch (e) { /* ignore */ }

        // レンダリング直後に一度実行
        try { updateGoalChipHighlights(); } catch (e) { }
        // 他のウィンドウやプロセスマップ側から storage を使って開閉情報を流す場合に反応
        window.addEventListener('storage', function (e) {
            if (!e) return; updateGoalChipHighlights();
        });
        // ポーリング: 同一タブ内で processMap 側が sessionStorage/window 変数を更新したときに確実に反映させる
        try {
            var _lastProcessMapTarget = null;
            function _pollProcessMapActive() {
                var v = null;
                try { v = sessionStorage.getItem('processMap_activeNodeId') || sessionStorage.getItem('processMap_targetNodeId') || null; } catch (e) { }
                if (!v && typeof window.processMap_targetNodeId !== 'undefined') v = window.processMap_targetNodeId || v;
                if (v !== _lastProcessMapTarget) {
                    _lastProcessMapTarget = v;
                    try { updateGoalChipHighlights(); } catch (e) { }
                }
            }
            // 400ms 間隔で軽量に監視（必要に応じて調整）
            var _processMapPollInterval = setInterval(_pollProcessMapActive, 400);
            // unload 時にクリア
            window.addEventListener('beforeunload', function () { try { clearInterval(_processMapPollInterval); } catch (e) { } });
        } catch (e) { console.warn('processMap poll setup failed', e); }
        // 表示済みのボタンラベルを現在の言語に合わせて更新（setLanguageが先に実行されている/されていない場合に備える）
        try {
            var currentLang = (document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja';
            var dict = (window.langDict && window.langDict[currentLang]) ? window.langDict[currentLang] : null;
            // 編集ボタン
            var editBtnsText = weeklyListDiv.querySelectorAll('[id^="editWeeklyGoalBtnText"]');
            editBtnsText.forEach(function (el) {
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
            exportBtnsText.forEach(function (el) {
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
            deleteBtnsText.forEach(function (el) {
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
        // 日付編集モーダルを開くヘルパ（編集ボタンを廃止し、ダブルクリック/キーボードで利用）
        function openWeeklyDateEditor(idx) {
            var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
            var goal = goals[idx];
            if (!goal) return;
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
            saveBtn.onclick = function () {
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
                    success: function (res) {
                        if (res.success) {
                            goals[idx].start = newStart;
                            goals[idx].end = newEnd;
                            localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));
                            document.body.removeChild(modal);
                            renderWeeklyGoals();
                        } else {
                            alert('DB更新失敗: ' + (res.error || '不明なエラー'));
                        }
                    },
                    error: function (xhr, status, error) {
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
            closeBtn.onclick = function () {
                document.body.removeChild(modal);
            };
            modalContent.appendChild(closeBtn);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        }
        // 追加: 日付レンジをダブルクリック／Enterで編集可能にする
        try {
            var dateRanges = weeklyListDiv.querySelectorAll('.weekly-goal-date-range');
            dateRanges.forEach(function (span) {
                try {
                    // キーボード操作を可能にする
                    span.setAttribute('tabindex', '0');
                    span.style.cursor = 'pointer';
                    span.setAttribute('title', (getCurrentLang() === 'ja') ? '日付を編集できます（ダブルクリック）' : 'Edit dates (double-click)');

                    var openEditForSpan = function () {
                        var idx = parseInt(span.getAttribute('data-idx'), 10);
                        if (!isNaN(idx)) openWeeklyDateEditor(idx);
                    };

                    span.addEventListener('dblclick', function (e) { openEditForSpan(); });
                    span.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditForSpan(); } });
                } catch (innerErr) { console.warn('bind dblclick to date-range failed', innerErr); }
            });
        } catch (e) { console.warn('setup date-range dblclick handlers failed', e); }
        // 追加: 日付レンジをダブルクリック／Enterで編集可能にする（editボタンの役割を補う）
        try {
            var dateRanges = weeklyListDiv.querySelectorAll('.weekly-goal-date-range');
            dateRanges.forEach(function (span) {
                try {
                    // キーボード操作を可能にする
                    span.setAttribute('tabindex', '0');
                    span.style.cursor = 'pointer';
                    span.setAttribute('title', (getCurrentLang() === 'ja') ? '日付を編集できます（ダブルクリック）' : 'Edit dates (double-click)');

                    var openEditForSpan = function () {
                        // 最近接の編集ボタンを探してクリックイベントを発火
                        var container = span.closest && span.closest('div');
                        var btn = null;
                        if (container) btn = container.querySelector && container.querySelector('.edit-weekly-date-btn');
                        if (!btn) {
                            // フォールバック: 同じ親階層をたどって探す
                            btn = span.parentNode && span.parentNode.querySelector && span.parentNode.querySelector('.edit-weekly-date-btn');
                        }
                        if (btn) {
                            try { btn.click(); } catch (e) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
                        }
                    };

                    span.addEventListener('dblclick', function (e) { openEditForSpan(); });
                    span.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditForSpan(); } });
                } catch (innerErr) { console.warn('bind dblclick to date-range failed', innerErr); }
            });
        } catch (e) { console.warn('setup date-range dblclick handlers failed', e); }
        // レポート出力は外部モジュールに委譲（journal_report.js）
        var exportBtns = weeklyListDiv.querySelectorAll('.export-weekly-btn');
        // ハンドラは `journal_report.js` の `window.initWeeklyReportHandlers` が設定します
        if (window.initWeeklyReportHandlers && typeof window.initWeeklyReportHandlers === 'function') {
            try { window.initWeeklyReportHandlers(window._goalListHelpers || {}); } catch (e) { console.warn('initWeeklyReportHandlers failed', e); }
        }
        // --- 最新カードの問いノードのアイコン枠線を強調 ---
        try { highlightLatestGoalIcons(); } catch (e) { console.warn('highlightLatestGoalIcons failed', e); }
    }

    /**
     * weeklyGoalsListの最新カード（goals[0]）に保存されている問いノードのアイコンの枠線色を変更する
     * 通常のアイコンは白い枠線だが、最新カードのノードはゴールドの枠線にする
     */
    function highlightLatestGoalIcons() {
        try {
            var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
            if (!goals.length) return;

            // まず全てのアイコンの枠線をデフォルト（白）にリセット
            var allIcons = document.querySelectorAll('.node-icon-wrapper');
            allIcons.forEach(function (icon) {
                icon.style.border = '2px solid white';
            });

            // 最新カード（先頭 = goals[0]）の問いノードIDを収集
            var latestGoal = goals[0];
            var latestNodeIds = [];
            if (latestGoal.contents && latestGoal.contents.length) {
                latestGoal.contents.forEach(function (c) {
                    var nid = (c && typeof c === 'object') ? c.node_id : '';
                    if (nid) latestNodeIds.push(nid);
                });
            }

            if (!latestNodeIds.length) return;

            // 該当ノードのアイコン枠線をゴールドに変更
            latestNodeIds.forEach(function (nodeId) {
                var jmElem = document.querySelector('jmnode[nodeid="' + nodeId + '"]');
                if (!jmElem) return;
                var iconWrapper = jmElem.querySelector('.node-icon-wrapper');
                if (iconWrapper) {
                    iconWrapper.style.setProperty('border', '2px solid #48bb78', 'important'); // リーフグリーン
                    iconWrapper.style.setProperty('box-shadow', '0 0 6px rgba(72, 187, 120, 0.5)', 'important');
                }
            });

            console.log('📍 最新カードの問いノードアイコンを強調:', latestNodeIds);
        } catch (e) {
            console.warn('highlightLatestGoalIcons error:', e);
        }
    }
    // グローバルに公開（addIconsToObjectNodes完了後にも呼び出せるように）
    window.highlightLatestGoalIcons = highlightLatestGoalIcons;
    // 関連ノード（contents）個別削除（グローバル定義）
    window.deleteGoalNode = function (goalIdx, contentIdx) {
        if (!window.confirm("この問いノードを目標から外しますか？")) {
            return;
        }
        var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
        if (goals[goalIdx] && goals[goalIdx].contents && goals[goalIdx].contents.length > contentIdx) {
            var deletedContent = goals[goalIdx].contents[contentIdx];
            // DB論理削除リクエスト
            $.ajax({
                url: 'php/delete_goal_node.php',
                type: 'POST',
                data: {
                    object_journal_id: goals[goalIdx].object_journal_id,
                    node_id: deletedContent.node_id || '',
                    content: deletedContent.content || deletedContent
                },
                success: function (res) {
                    console.log('delete_goal_node.php response:', res);
                },
                error: function (xhr, status, error) {
                    console.error('ノード削除通信エラー:', error);
                }
            });
            goals[goalIdx].contents.splice(contentIdx, 1);
            localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));
            window.renderWeeklyGoals();
        }
    };
    window.deleteWeeklyGoal = function (idx) {
        var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
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
                success: function (res) {
                    console.log('delete_object_goal.php response:', res);
                    if (!res.success) {
                        alert('DB削除失敗: ' + (res.error || '不明なエラー'));
                    }
                },
                error: function (xhr, status, error) {
                    console.error('AJAX通信エラー:', status, error, xhr);
                }
            });
        }
        goals.splice(idx, 1);
        localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));
        renderWeeklyGoals();
    };

    // 中目標
    if (addMediumBtn) {
        addMediumBtn.onclick = function () {
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
        goals.forEach(function (goal, idx) {
            html += '<div style="background:#f7f3fa;border:1px solid #6f42c1;border-radius:6px;padding:7px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">'
                + '<span>' + goal.text + '</span>'
                + '<button onclick="deleteMediumGoal(' + idx + ')" class="goal-delete-btn" title="削除">'
                + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><circle cx="8" cy="8" r="7" fill="#dc3545"/><path d="M5 8h6" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
                + '</button>'
                + '</div>';
        });
        mediumListDiv.innerHTML = html;
    }
    window.deleteMediumGoal = function (idx) {
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
        addLargeBtn.onclick = function () {
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
        goals.forEach(function (goal, idx) {
            html += '<div style="background:#f2f6fa;border:1px solid #1976d2;border-radius:6px;padding:7px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">'
                + '<span>' + goal.text + '</span>'
                + '<button onclick="deleteLargeGoal(' + idx + ')" style="background:#dc3545;color:white;border:none;border-radius:3px;padding:3px 8px;font-size:12px;cursor:pointer;">削除</button>'
                + '</div>';
        });
        largeListDiv.innerHTML = html;
    }
    window.deleteLargeGoal = function (idx) {
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
            var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
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
    window.updateAddWeeklyMenuLabel = updateAddWeeklyMenuLabel;

    // weeklyGoalsList が存在すれば変化を監視してラベル同期を行う
    if (weeklyListDiv) {
        try {
            var mo = new MutationObserver(function (mutations) {
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
    // expose minimal helpers for journal_report.js to reuse
    try {
        window._goalListHelpers = {
            t: t,
            getCurrentLang: getCurrentLang,
            fetchWeeklyGoalsFromDB: fetchWeeklyGoalsFromDB,
            fetchObjectNodeInfo: fetchObjectNodeInfo,
            renderWeeklyGoals: function () { if (typeof window.renderWeeklyGoals === 'function') window.renderWeeklyGoals(); }
        };
        if (window.initWeeklyReportHandlers && typeof window.initWeeklyReportHandlers === 'function') {
            try { window.initWeeklyReportHandlers(window._goalListHelpers); } catch (e) { console.warn('initWeeklyReportHandlers after init failed', e); }
        }
    } catch (e) { console.warn('expose goal helpers failed', e); }
    // render後にラベルを同期
    updateAddWeeklyMenuLabel();
    renderMediumGoals();
    renderLargeGoals();
});

window.addWeeklyGoal = function () {
    console.log('[goal_list] addWeeklyGoal called');
    try {
        if (typeof _jm === 'undefined' || !_jm) {
            console.warn('[goal_list] _jm is undefined');
        }
    } catch (e) {
        console.warn('[goal_list] _jm check failed', e);
    }
    // 選択中ノードIDを取得（堅牢化: id, nodeid 属性, data-nodeid, nodeId プロパティを順に試す）
    var selected_node_id = null;
    var sel = null;
    try {
        sel = (typeof _jm !== 'undefined' && _jm && typeof _jm.get_selected_node === 'function') ? _jm.get_selected_node() : null;
        if (sel) {
            // common case: sel.id
            if (sel.id) selected_node_id = sel.id;
            // fallback: DOM-like node may expose getAttribute
            try {
                if (!selected_node_id && typeof sel.getAttribute === 'function') {
                    selected_node_id = sel.getAttribute('nodeid') || sel.getAttribute('data-nodeid') || sel.getAttribute('data-node-id') || selected_node_id;
                }
            } catch (e) { }
            // fallback: property named nodeId
            if (!selected_node_id && (sel.nodeId || sel.nodeID || sel.node_id)) selected_node_id = sel.nodeId || sel.nodeID || sel.node_id;
        }
    } catch (err) {
        console.error('[goal_list] get_selected_node error', err);
    }
    // Normalize to string and provide verbose debug info
    try {
        if (selected_node_id && typeof selected_node_id !== 'string') selected_node_id = String(selected_node_id);
    } catch (e) { }
    console.log('[goal_list] selected_node candidate:', selected_node_id, ' (type:', typeof selected_node_id + ') sel:', sel);
    // Additional fallbacks: if sel itself is a primitive string, accept it
    try {
        if (!selected_node_id && sel && (typeof sel === 'string' || typeof sel === 'number')) selected_node_id = String(sel);
        // if sel has nested properties where id might live
        if (!selected_node_id && sel && typeof sel === 'object') {
            if (sel.data && (sel.data.id || sel.data.nodeid || sel.data.nodeId)) selected_node_id = sel.data.id || sel.data.nodeid || sel.data.nodeId;
            else if (sel.attributes && sel.attributes['nodeid']) selected_node_id = sel.attributes['nodeid'];
        }
    } catch (e) { console.warn('[goal_list] additional sel->id fallback failed', e); }
    console.log('[goal_list] final selected_node_id to send:', selected_node_id);
    if (!selected_node_id) {
        alert('ノードが選択されていません');
        return;
    }
    // 画面を即座に更新（localStorageに仮追加）
    var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
    if (goals.length > 0) {
        // 最新の小目標にノード内容を追加（先頭が最新）
        var latestGoal = goals[0];
        if (!latestGoal.contents) latestGoal.contents = [];
        // マインドマップからノード内容取得
        var selectedNode = sel || ((typeof _jm !== 'undefined' && _jm && typeof _jm.get_selected_node === 'function') ? _jm.get_selected_node() : null);
        var nodeContent = selectedNode && selectedNode.topic ? selectedNode.topic : '(内容なし)';
        console.log('[goal_list] adding nodeContent to latestGoal:', nodeContent);
        latestGoal.contents.push(nodeContent);
        localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(goals));
        try { renderWeeklyGoals(); } catch (e) { console.warn('[goal_list] renderWeeklyGoals error', e); }
    }
    // PHPへAJAXリクエスト送信
    console.log('[goal_list] sending AJAX to update_latest_goal_node.php with node_id=', selected_node_id);
    var postData = {
        node_id: selected_node_id,
        map_id: (typeof window.MAPID !== 'undefined') ? window.MAPID : ''
    };
    if (window.latest_inserted_journal_id) {
        postData.object_journal_id = window.latest_inserted_journal_id;
    }
    $.ajax({
        url: 'php/update_latest_goal_node.php',
        type: 'POST',
        data: postData,
        success: function (response) {
            console.log('[goal_list] 最新の小目標にnode_idを保存しました:', response);
            // DB反映後に再取得
            if (window._goalListHelpers && typeof window._goalListHelpers.fetchWeeklyGoalsFromDB === 'function') {
                try { window._goalListHelpers.fetchWeeklyGoalsFromDB(); } catch (e) { console.warn('[goal_list] fetchWeeklyGoalsFromDB failed', e); }
            }
        },
        error: function (xhr, status, error) {
            console.error('[goal_list] 保存に失敗しました:', error, status);
            alert('保存に失敗しました');
        }
    });
};

// グローバル: node-icon-container に対してホバー/フォーカスでカスタムツールチップを表示
(function () {
    function getCurrentLangSafe() {
        try { return (document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja'; } catch (e) { return 'ja'; }
    }
    function showGlobalTooltip(html, target) {
        try {
            var existing = document.getElementById('gl_custom_tooltip');
            if (existing) existing.parentNode.removeChild(existing);
            var tip = document.createElement('div');
            tip.id = 'gl_custom_tooltip';
            tip.className = 'srl-tooltip-card';
            tip.innerHTML = html;
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
        try { var ex = document.getElementById('gl_custom_tooltip'); if (ex) ex.parentNode.removeChild(ex); } catch (e) { }
    }

    var _tooltipCache = {};
    var _tooltipTimer = null;

    function buildTooltipHtml(res) {
        var counts = { "完了": 0, "開始": 0, "中断": 0, "計画": 0 };
        var latestHistory = null;

        if (res && Array.isArray(res.histories)) {
            var grp = {};
            res.histories.forEach(function (h) {
                var oid = h.object_node_id;
                if (!grp[oid]) grp[oid] = [];
                grp[oid].push(h);

                if (!latestHistory || new Date(h.appeared_at) > new Date(latestHistory.appeared_at)) {
                    latestHistory = h;
                }
            });

            if (res.data && Array.isArray(res.data)) {
                res.data.forEach(function (node) {
                    var hList = grp[node.object_node_id];
                    var status = "計画";
                    if (hList && hList.length) {
                        hList.sort(function (a, b) { return new Date(a.appeared_at) - new Date(b.appeared_at); });
                        hList.forEach(function (h) {
                            var act = parseInt(h.activity, 10);
                            if (act === 5) status = "開始";
                            else if (act === 6) status = "中断";
                            else if (act === 7) status = "完了";
                        });
                    }
                    counts[status]++;
                });
            }
        }

        var upper = '⚫ 完了: ' + counts["完了"] + ' &nbsp;|&nbsp; 🟠 開始: ' + counts["開始"] + ' &nbsp;|&nbsp; 🔴 中断: ' + counts["中断"] + ' &nbsp;|&nbsp; 🟢 計画: ' + counts["計画"];
        var lower = '';

        if (latestHistory) {
            var date = new Date(latestHistory.appeared_at);
            var month = date.getMonth() + 1;
            var day = date.getDate();
            var hours = date.getHours().toString().padStart(2, '0');
            var minutes = date.getMinutes().toString().padStart(2, '0');
            var timeStr = month + '/' + day + ' ' + hours + ':' + minutes;
            var actStr = "を操作";
            var act = parseInt(latestHistory.activity, 10);
            if (act === 1) actStr = "を追加";
            else if (act === 2) actStr = "を更新";
            else if (act === 5) actStr = "を開始";
            else if (act === 6) actStr = "を中断";
            else if (act === 7) actStr = "を完了";

            var content = latestHistory.content || "(名称未設定)";
            if (content.length > 15) content = content.substring(0, 15) + '...';

            lower = '🕒 最新の動き: 「' + content + '」' + actStr + ' (' + timeStr + ')';
        } else {
            lower = '🕒 最新の動き: まだ活動がありません';
        }

        return '<div style="font-size:12px;white-space:nowrap;margin-bottom:2px;">' + upper + '</div>' +
            '<hr class="srl-tooltip-divider" />' +
            '<div class="srl-tooltip-latest">' + lower + '</div>';
    }

    // マウスオーバー/アウト（delegation）
    document.addEventListener('mouseover', function (e) {
        var icon = e.target.closest && e.target.closest('.node-icon-container');
        if (icon) {
            var nodeElem = icon.closest && (icon.closest('jmnode') || icon.closest('[nodeid]') || icon.closest('[data-nodeid]') || icon.closest('[id]'));
            var nodeId = nodeElem ? (nodeElem.getAttribute('nodeid') || nodeElem.getAttribute('data-nodeid') || nodeElem.getAttribute('id')) : null;

            if (nodeId) {
                var loadingHtml = '<div style="text-align:center;color:#718096;font-size:12px;">読み込み中...</div>';
                showGlobalTooltip(loadingHtml, icon);

                clearTimeout(_tooltipTimer);
                _tooltipTimer = setTimeout(function () {
                    if (_tooltipCache[nodeId]) {
                        var existing = document.getElementById('gl_custom_tooltip');
                        if (existing) showGlobalTooltip(_tooltipCache[nodeId], icon);
                    } else {
                        $.ajax({
                            url: 'php/get_object_node_info.php',
                            type: 'GET',
                            dataType: 'json',
                            data: { node_id: nodeId },
                            success: function (res) {
                                var html = buildTooltipHtml(res);
                                _tooltipCache[nodeId] = html;
                                var existing = document.getElementById('gl_custom_tooltip');
                                if (existing) showGlobalTooltip(html, icon);
                            }
                        });
                    }
                }, 200);
            } else {
                var text = (getCurrentLangSafe() === 'ja') ? 'SRL整理マップがあります' : 'SRL Map available';
                showGlobalTooltip('<div style="font-size:12px;">' + text + '</div>', icon);
            }
        }
    });

    document.addEventListener('mouseout', function (e) {
        var icon = e.target.closest && e.target.closest('.node-icon-container');
        if (icon) {
            clearTimeout(_tooltipTimer);
            hideGlobalTooltip();
        }
    });

    // キーボードフォーカス対応
    document.addEventListener('focusin', function (e) {
        var icon = e.target.closest && e.target.closest('.node-icon-container');
        if (icon) {
            var nodeElem = icon.closest && (icon.closest('jmnode') || icon.closest('[nodeid]') || icon.closest('[data-nodeid]') || icon.closest('[id]'));
            var nodeId = nodeElem ? (nodeElem.getAttribute('nodeid') || nodeElem.getAttribute('data-nodeid') || nodeElem.getAttribute('id')) : null;

            if (nodeId) {
                var loadingHtml = '<div style="text-align:center;color:#718096;font-size:12px;">読み込み中...</div>';
                showGlobalTooltip(loadingHtml, icon);

                clearTimeout(_tooltipTimer);
                _tooltipTimer = setTimeout(function () {
                    if (_tooltipCache[nodeId]) {
                        var existing = document.getElementById('gl_custom_tooltip');
                        if (existing) showGlobalTooltip(_tooltipCache[nodeId], icon);
                    } else {
                        $.ajax({
                            url: 'php/get_object_node_info.php',
                            type: 'GET',
                            dataType: 'json',
                            data: { node_id: nodeId },
                            success: function (res) {
                                var html = buildTooltipHtml(res);
                                _tooltipCache[nodeId] = html;
                                var existing = document.getElementById('gl_custom_tooltip');
                                if (existing) showGlobalTooltip(html, icon);
                            }
                        });
                    }
                }, 200);
            } else {
                var text = (getCurrentLangSafe() === 'ja') ? 'SRL整理マップがあります' : 'SRL Map available';
                showGlobalTooltip('<div style="font-size:12px;">' + text + '</div>', icon);
            }
        }
    });

    document.addEventListener('focusout', function (e) {
        var icon = e.target.closest && e.target.closest('.node-icon-container');
        if (icon) {
            clearTimeout(_tooltipTimer);
            hideGlobalTooltip();
        }
    });

    // クリックで目標手段階層マップを開く
    document.addEventListener('click', function (e) {
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
                try { sessionStorage.setItem('processMap_targetNodeId', nodeId); } catch (e) { window.processMap_targetNodeId = nodeId; }
            } else if (nodeText) {
                try { sessionStorage.setItem('processMap_targetText', nodeText); } catch (e) { window.processMap_targetText = nodeText; }
            }
        } catch (e) { }
        // マップを開く
        try {
            if (typeof showThinkingProcessMap === 'function') {
                showThinkingProcessMap();
            } else {
                // フォールバック: 関数がなければナビゲータ表示を試みる
                if (typeof showNavigatorGreeting === 'function') showNavigatorGreeting();
            }
        } catch (err) {
            console.error('showThinkingProcessMap call failed', err);
        }
    });

    // 【追加】ホバー時に内省データを動的フェッチする処理（サイドバーのポップアップ用）
    document.addEventListener('mouseover', function (e) {
        var container = e.target.closest('.btn-reflect-container');
        if (!container) return;

        var popover = container.querySelector('.reflection-popover');
        if (!popover) return;

        var btn = container.querySelector('.btn-reflect');
        if (!btn) return;

        // 【追加】親要素のoverflowによる見切れを防ぐため、fixedで動的に配置
        var rect = btn.getBoundingClientRect();
        popover.style.position = 'fixed';
        popover.style.top = (rect.bottom + 8) + 'px';
        var popoverWidth = 280; // CSSで指定している幅
        var leftPos = rect.right - popoverWidth;
        // 画面外にはみ出さないよう調整
        if (leftPos < 10) leftPos = 10;
        popover.style.left = leftPos + 'px';
        popover.style.right = 'auto'; // CSSのright:0を上書き
        popover.style.zIndex = '999999';

        if (popover.dataset.loaded === 'true' || popover.dataset.loading === 'true') return;


        var goalIdx = btn.dataset.idx;
        var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
        var goal = goals[goalIdx];

        if (!goal || !goal.object_journal_id) {
            popover.innerHTML = '<div class="popover-status-empty">まだこの期間の振り返りが記述されていません。<br><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path></svg>ボタンをクリックして、内省を始めましょう！</div>';
            popover.dataset.loaded = 'true';
            return;
        }

        popover.dataset.loading = 'true';

        $.ajax({
            url: 'php/get_object_journal_reflections.php',
            type: 'GET',
            dataType: 'json',
            data: { object_journal_id: goal.object_journal_id },
            success: function (res) {
                if (res && res.success && res.latest_snapshot && res.latest_snapshot.reflections && res.latest_snapshot.reflections.length > 0) {
                    var ref = res.latest_snapshot.reflections[0];

                    var goodTxt = ref.evaluation_good ? ref.evaluation_good.trim() : '';
                    var goodReason = ref.attribution ? ref.attribution.trim() : '';

                    var badTxt = ref.evaluation_bad ? ref.evaluation_bad.trim() : '';
                    var badReason = ref.attribution_bad ? ref.attribution_bad.trim() : '';

                    var lessonTxt = '';
                    if (ref.lessons && ref.lessons.length > 0) {
                        lessonTxt = ref.lessons.map(function (l) { return l.lesson_learned; }).filter(Boolean).join('<br>');
                    }

                    if (goodTxt || goodReason || badTxt || badReason || lessonTxt) {
                        var html = '';

                        if (goodTxt || goodReason) {
                            html += '<div class="popover-row journal-popup-positive">😄 ' + (goodTxt || '（記載なし）') + '</div>';
                            if (goodReason) {
                                html += '<div class="popover-row journal-popup-positive-sub" style="padding-left: 20px; font-size: 0.9em; margin-top: -4px;">' + goodReason + '</div>';
                            }
                        }

                        if (badTxt || badReason) {
                            html += '<div class="popover-row journal-popup-negative">😢 ' + (badTxt || '（記載なし）') + '</div>';
                            if (badReason) {
                                html += '<div class="popover-row journal-popup-negative-sub" style="padding-left: 20px; font-size: 0.9em; margin-top: -4px;">' + badReason + '</div>';
                            }
                        }

                        if (lessonTxt) {
                            html += '<div class="popover-row journal-popup-action">➔ <strong>実践するとき！</strong><br>' + lessonTxt + '</div>';
                        }

                        popover.innerHTML = html;
                    } else {
                        popover.innerHTML = '<div class="popover-status-empty">まだこの期間の振り返りが記述されていません。<br><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path></svg>ボタンをクリックして、内省を始めましょう！</div>';
                    }
                } else {
                    popover.innerHTML = '<div class="popover-status-empty">まだこの期間の振り返りが記述されていません。<br><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path></svg>ボタンをクリックして、内省を始めましょう！</div>';
                }
                popover.dataset.loaded = 'true';
                popover.dataset.loading = 'false';
            },
            error: function () {
                popover.innerHTML = '<div class="popover-status-empty" style="color:red;">データの取得に失敗しました</div>';
                popover.dataset.loaded = 'true';
                popover.dataset.loading = 'false';
            }
        });
    }, true);

    // 【追加】ボタンクリック（モーダルを開く）時にキャッシュを破棄し、次回ホバーで最新化する
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.btn-reflect');
        if (btn) {
            var container = btn.closest('.btn-reflect-container');
            if (container) {
                var popover = container.querySelector('.reflection-popover');
                if (popover) {
                    popover.dataset.loaded = 'false'; // 再フェッチを強制
                }
            }
        }
    }, true);
})();
