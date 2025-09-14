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
    function renderWeeklyGoals() {
        var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
        if (!weeklyListDiv) return;
        if (goals.length === 0) {
            weeklyListDiv.innerHTML = '<div style="color:#888;text-align:center;padding:12px;">まだ小目標がありません</div>';
            return;
        }
        var html = '';
        goals.forEach(function(goal, idx) {
            var nodeHtml = '';
            var jmnodeStyle = 'display:inline-block;margin:4px 6px 4px 0;padding:10px;background-color:#bee2f9;color:#333;border-radius:12px;box-shadow:1px 1px 1px #666;font:12px/1.125 Verdana,Arial,Helvetica,sans-serif;border:1.5px solid #7ec3e6;';
            if (goal.contents && goal.contents.length) {
                nodeHtml = goal.contents.map(function(content) {
                    return '<div class="jmnode" style="' + jmnodeStyle + '">' +
                        '<span>' + content + '</span>' +
                        '</div>';
                }).join('');
            } else {
                nodeHtml = '<div class="jmnode" style="' + jmnodeStyle + 'color:#888;">未リンク</div>';
            }
            html += '<div style="background:#eafbe7;border:1.5px solid #28a745;border-radius:7px;padding:12px;margin-bottom:10px;display:flex;flex-direction:column;gap:6px;font-size:16px;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;">'
                + '<span>開始日: ' + (goal.start || goal.start_date) + '　終了日: ' + (goal.end || goal.finish_date) + '</span>'
                + '<div>'
                + '<button onclick="deleteWeeklyGoal(' + idx + ')" style="background:#dc3545;color:white;border:none;border-radius:4px;padding:5px 12px;font-size:14px;cursor:pointer;">削除</button>'
                + '</div>'
                + '</div>'
                + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;">' + nodeHtml + '</div>'
                + '</div>';
        });
        weeklyListDiv.innerHTML = html;
    }
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
                + '<button onclick="deleteMediumGoal(' + idx + ')" style="background:#dc3545;color:white;border:none;border-radius:3px;padding:3px 8px;font-size:12px;cursor:pointer;">削除</button>'
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
    // PHPへAJAXリクエスト送信
    $.ajax({
        url: 'php/update_latest_goal_node.php',
        type: 'POST',
        data: { node_id: selected_node_id },
        success: function(response) {
            console.log('最新の小目標にnode_idを保存しました:', response);
            alert('最新の小目標にノードIDを保存しました');
        },
        error: function(xhr, status, error) {
            console.error('保存に失敗しました:', error);
            alert('保存に失敗しました');
        }
    });
}
