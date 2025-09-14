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
                var rows = [];
                if (res.success && res.data && res.data.length) {
                    res.data.forEach(function(row) {
                        rows.push({
                            object_node_id: row.object_node_id,
                            node_id: row.node_id,
                            content: row.content
                        });
                    });
                    var objectNodeIds = rows.map(function(row) { return row.object_node_id; });
                    console.log('取得object_node_id: ' + objectNodeIds.join(', '));
                } else {
                    rows.push({ object_node_id: '', node_id: nodeId, content: '' });
                }
                resolve(rows);
            },
            error: function() {
                resolve([{ object_node_id: '', node_id: nodeId, content: '' }]);
            }
        });
    });
}
// --- 目標管理エリア（小・中・大目標） ---
document.addEventListener('DOMContentLoaded', function() {
    // ページ表示時にDBから小目標を取得
    function fetchWeeklyGoalsFromDB() {
        $.ajax({
            url: 'php/get_latest_object_goal.php',
            type: 'GET',
            dataType: 'json',
            success: function(res) {
                console.log('get_latest_object_goal.php response:', res);
                if (res.success && Array.isArray(res.goals)) {
                    // object_goal_idごとにnode_idをまとめる
                    var goalMap = {};
                    res.goals.forEach(function(row) {
                        if (!goalMap[row.object_goal_id]) {
                            goalMap[row.object_goal_id] = {
                                start: row.start_date,
                                end: row.finish_date,
                                object_goal_id: row.object_goal_id,
                                contents: []
                            };
                        }
                        if (row.content) {
                            goalMap[row.object_goal_id].contents.push(row.content);
                        }
                    });
                    var goals = Object.values(goalMap);
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

    // 小目標
    if (addWeeklyBtn) {
        addWeeklyBtn.onclick = function() {
            var startDate = weeklyStartInput.value;
            var endDate = weeklyEndInput.value;
            if (!startDate || !endDate) {
                alert('開始日と終了日を入力してください');
                return;
            }
            // object_node_id, goal_type, labelは仮で設定（必要に応じて取得・編集）
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
                        goals.push({ start: startDate, end: endDate, createdAt: new Date().toISOString(), object_goal_id: res.object_goal_id });
                        localStorage.setItem('weeklyGoals', JSON.stringify(goals));
                        weeklyStartInput.value = '';
                        weeklyEndInput.value = '';
                        renderWeeklyGoals();
                    } else {
                        alert('DB登録失敗: ' + (res.error || '不明なエラー'));
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX通信エラー:', status, error, xhr);
                    alert('通信エラー');
                }
            });
        };
    }
    window.renderWeeklyGoals = function() {
        var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
        if (!weeklyListDiv) return;
        if (goals.length === 0) {
            weeklyListDiv.innerHTML = '<div style="color:#888;text-align:center;padding:12px;">まだ小目標がありません</div>';
            return;
        }
        var html = '';
        goals.forEach(function(goal, idx) {
            var jmnodeStyle = 'display:inline-block;margin:4px 6px 4px 0;padding:10px;background-color:#bee2f9;color:#333;border-radius:12px;box-shadow:1px 1px 1px #666;font:12px/1.125 Verdana,Arial,Helvetica,sans-serif;border:1.5px solid #7ec3e6;';
            var nodeHtml = '';
            if (goal.contents && goal.contents.length) {
                nodeHtml = goal.contents.map(function(content, cidx) {
                    return '<div class="jmnode" style="' + jmnodeStyle + '">' +
                        '<span>' + content + '</span>' +
                        '<button onclick="deleteGoalNode(' + idx + ',' + cidx + ')" class="goal-delete-btn" title="削除">' +
                        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><circle cx="8" cy="8" r="7" fill="#dc3545"/><path d="M5 8h6" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>' +
                        '</button>' +
                        '</div>';
                }).join('');
            } else {
                nodeHtml = '<div class="jmnode" style="' + jmnodeStyle + 'color:#888;">未リンク</div>';
            }
            var startDate = new Date(goal.start || goal.start_date);
            var endDate = new Date(goal.end || goal.finish_date);
            var startStr = (startDate.getMonth()+1) + '月' + startDate.getDate() + '日';
            var endStr = (endDate.getMonth()+1) + '月' + endDate.getDate() + '日';
            html += '<div style="background:#eafbe7;border:1.5px solid #28a745;border-radius:7px;padding:12px;margin-bottom:10px;display:flex;flex-direction:column;gap:6px;font-size:16px;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                + '<span>' + startStr + '〜' + endStr + '</span>'
                + '<button class="edit-weekly-date-btn" data-idx="' + idx + '" style="margin-left:8px;padding:4px 10px;background:#ffc107;color:#333;border:none;border-radius:5px;font-size:13px;cursor:pointer;">編集</button>'
                + '<div>'
                + '<button class="export-weekly-btn" data-idx="' + idx + '" style="margin-right:8px;padding:4px 10px;background:#007bff;color:#fff;border:none;border-radius:5px;font-size:13px;cursor:pointer;">レポート出力</button>'
                + '<button onclick="deleteWeeklyGoal(' + idx + ')" class="goal-delete-btn" title="削除">'
                + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><circle cx="8" cy="8" r="7" fill="#dc3545"/><path d="M5 8h6" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
                + '</button>'
                + '</div>'
                + '</div>'
                + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;">' + nodeHtml + '</div>'
                + '</div>';
        });
        weeklyListDiv.innerHTML = html;
        // 編集ボタンのイベントリスナー追加（innerHTML後に）
        var editBtns = weeklyListDiv.querySelectorAll('.edit-weekly-date-btn');
        editBtns.forEach(function(btn) {
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
                title.textContent = '日付編集';
                title.style.marginBottom = '16px';
                modalContent.appendChild(title);
                var startLabel = document.createElement('label');
                startLabel.textContent = '開始日:';
                startLabel.style.marginRight = '8px';
                var startInput = document.createElement('input');
                startInput.type = 'date';
                startInput.value = (goal.start || goal.start_date) ? (goal.start || goal.start_date) : '';
                startInput.style.marginBottom = '12px';
                var endLabel = document.createElement('label');
                endLabel.textContent = '終了日:';
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
                saveBtn.textContent = '保存';
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
                    var object_goal_id = goals[idx].object_goal_id;
                    // DB更新
                    $.ajax({
                        url: 'php/update_object_goal.php',
                        type: 'POST',
                        data: {
                            object_goal_id: object_goal_id,
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
        // レポート出力ボタンのイベントリスナー追加（innerHTML後に）
        var exportBtns = weeklyListDiv.querySelectorAll('.export-weekly-btn');
        exportBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
                var goal = goals[idx];
                if (!goal || !goal.object_goal_id) {
                    console.warn('object_goal_idが見つかりません');
                    return;
                }
                // 日付範囲取得
                var startDate = goal.start || goal.start_date;
                var endDate = goal.end || goal.finish_date;
                // 小目標の表示文字列リスト
                var goalContents = Array.isArray(goal.contents) ? goal.contents : [];
                // object_goal_idでnode_id一覧を取得
                $.ajax({
                    url: 'php/get_object_goal_nodes.php',
                    type: 'GET',
                    dataType: 'json',
                    data: { object_goal_id: goal.object_goal_id },
                    success: function(res) {
                        if (res.success && Array.isArray(res.node_ids)) {
                            var nodeIds = res.node_ids;
                            // node_idごとにcontentを取得（期間で絞り込み）
                            var promises = nodeIds.map(function(nodeId, i) {
                                return new Promise(function(resolve) {
                                    $.ajax({
                                        url: 'php/get_object_node_info.php',
                                        type: 'GET',
                                        dataType: 'json',
                                        data: {
                                            node_id: nodeId,
                                            start_date: startDate,
                                            end_date: endDate
                                        },
                                        success: function(objRes) {
                                            if (objRes.success && Array.isArray(objRes.data) && objRes.data.length) {
                                                var contents = objRes.data.map(function(row){ return row.content; });
                                                // 小目標の表示文字列（goal.contents）を使う
                                                var display = goalContents[i] || '';
                                                resolve({ display: display, content: contents });
                                            } else {
                                                var display = goalContents[i] || '';
                                                resolve({ display: display, content: [] });
                                            }
                                        },
                                        error: function(xhr, status, error) {
                                            var display = goalContents[i] || '';
                                            resolve({ display: display, content: [], error: error });
                                        }
                                    });
                                });
                            });
                            Promise.all(promises).then(function(results) {
                                // プレビュー用モーダル生成（小目標ごとに見出し＋箇条書き）
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
                                title.textContent = 'Wordプレビュー';
                                title.style.marginBottom = '16px';
                                modalContent.appendChild(title);

                                // 小目標ごとに見出し＋箇条書き
                                results.forEach(function(item){
                                    var heading = document.createElement('h4');
                                    heading.textContent = item.display || '';
                                    heading.style.margin = '18px 0 8px 0';
                                    heading.style.fontWeight = 'bold';
                                    modalContent.appendChild(heading);
                                    var ul = document.createElement('ul');
                                    ul.style.marginBottom = '12px';
                                    if (item.content && item.content.length) {
                                        item.content.forEach(function(content){
                                            var li = document.createElement('li');
                                            li.textContent = content;
                                            ul.appendChild(li);
                                        });
                                    } else {
                                        var li = document.createElement('li');
                                        li.textContent = '(該当データなし)';
                                        ul.appendChild(li);
                                    }
                                    modalContent.appendChild(ul);
                                });

                                // ダウンロードボタン
                                var dlBtn = document.createElement('button');
                                dlBtn.textContent = 'Wordダウンロード';
                                dlBtn.style.marginTop = '18px';
                                dlBtn.style.padding = '8px 24px';
                                dlBtn.style.background = '#007bff';
                                dlBtn.style.color = '#fff';
                                dlBtn.style.border = 'none';
                                dlBtn.style.borderRadius = '6px';
                                dlBtn.style.fontSize = '15px';
                                dlBtn.style.cursor = 'pointer';
                                dlBtn.onclick = function() {
                                    // Word (doc) ファイル用HTML生成（見出し＋箇条書き）
                                    var html = '<html><head><meta charset="utf-8"><title>Weekly Goal Report</title></head><body>';
                                    html += '<h2>Weekly Goal Report (' + startDate + ' ~ ' + endDate + ')</h2>';
                                    results.forEach(function(item) {
                                        html += '<h3>' + (item.display || '') + '</h3>';
                                        html += '<ul>';
                                        if (item.content && item.content.length) {
                                            item.content.forEach(function(content) {
                                                html += '<li>' + (content || '') + '</li>';
                                            });
                                        } else {
                                            html += '<li>(該当データなし)</li>';
                                        }
                                        html += '</ul>';
                                    });
                                    html += '</body></html>';
                                    var blob = new Blob([html], { type: 'application/msword' });
                                    var url = URL.createObjectURL(blob);
                                    var a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'weekly_goal_report_' + startDate + '-' + endDate + '.doc';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    document.body.removeChild(modal);
                                };
                                modalContent.appendChild(dlBtn);

                                // 閉じるボタン
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
                        } else {
                            console.warn('node_id一覧が見つかりません', res);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('object_goal_nodes取得通信エラー:', status, error, xhr);
                    }
                });
            });
        });
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
                object_goal_id: goals[goalIdx].object_goal_id,
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
        if (goal && goal.object_goal_id) {
            $.ajax({
                url: 'php/delete_object_goal.php',
                type: 'POST',
                data: { object_goal_id: goal.object_goal_id },
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

    // 初期化
    setupYearSelect();
    renderWeeklyGoals();
    renderMediumGoals();
    renderLargeGoals();
});

addWeeklyGoal = function() {
    // 選択中ノードIDを取得
    var selected_node_id = _jm.get_selected_node().id;
    if (!selected_node_id) {
        alert('ノードが選択されていません');
        return;
    }
    // 画面を即座に更新（localStorageに仮追加）
    var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
    if (goals.length > 0) {
        // 最新の小目標にノード内容を追加
        var latestGoal = goals[goals.length - 1];
        if (!latestGoal.contents) latestGoal.contents = [];
        // マインドマップからノード内容取得
        var selectedNode = _jm.get_selected_node();
        var nodeContent = selectedNode && selectedNode.topic ? selectedNode.topic : '(内容なし)';
        latestGoal.contents.push(nodeContent);
        localStorage.setItem('weeklyGoals', JSON.stringify(goals));
        renderWeeklyGoals();
    }
    // PHPへAJAXリクエスト送信
    $.ajax({
        url: 'php/update_latest_goal_node.php',
        type: 'POST',
        data: { node_id: selected_node_id },
        success: function(response) {
            console.log('最新の小目標にnode_idを保存しました:', response);
            alert('最新の小目標にノードIDを保存しました');
            // DB反映後に再取得
            if (typeof fetchWeeklyGoalsFromDB === 'function') {
                fetchWeeklyGoalsFromDB();
            }
        },
        error: function(xhr, status, error) {
            console.error('保存に失敗しました:', error);
            alert('保存に失敗しました');
        }
    });
}
