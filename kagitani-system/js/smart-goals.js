/**
 * SMART目標設定システム
 * S (Specific): 具体的
 * M (Measurable): 測定可能
 * A (Achievable): 達成可能
 * R (Relevant): 関連性
 * T (Time-bound): 期限明確
 */

// グローバル変数
let currentSelectedNodeId = null;
let smartGoals = [];

// ドラッグ機能の変数
let isDragging = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

/**
 * ドラッグ機能を初期化
 */
function initializeDragFunctionality() {
    const dragElement = document.getElementById('smart_goal_form');
    const dragHandle = document.getElementById('smart_goal_header');
    
    if (dragHandle && dragElement) {
        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }
}

function dragStart(e) {
    const dragElement = document.getElementById('smart_goal_form');
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    if (e.target === document.getElementById('smart_goal_header')) {
        isDragging = true;
        dragElement.style.transition = 'none';
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        const dragElement = document.getElementById('smart_goal_form');
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        dragElement.style.left = (window.innerWidth / 2 + currentX) + 'px';
        dragElement.style.top = (window.innerHeight / 2 + currentY) + 'px';
        dragElement.style.transform = 'translate(-50%, -50%)';
    }
}

function dragEnd() {
    if (isDragging) {
        const dragElement = document.getElementById('smart_goal_form');
        isDragging = false;
        dragElement.style.transition = '';
    }
}

/**
 * フォームを画面中央に配置
 */
function centerSmartGoalForm() {
    const form = document.getElementById('smart_goal_form');
    if (form) {
        // ドラッグオフセットをリセット
        xOffset = 0;
        yOffset = 0;
        
        // 中央に配置
        form.style.left = '50%';
        form.style.top = '50%';
        form.style.transform = 'translate(-50%, -50%)';
    }
}

/**
 * SMART目標設定フォームを表示
 */
function showSmartGoalForm(nodeId) {
    console.log('showSmartGoalForm called with nodeId:', nodeId);
    
    const form = document.getElementById('smart_goal_form');
    if (!form) {
        console.error('SMART目標設定フォームが見つかりません');
        alert('SMART目標設定フォームが見つかりません。ページを再読み込みしてください。');
        return;
    }
    
    if (!nodeId) {
        console.error('ノードIDが指定されていません');
        alert('ノードIDが指定されていません。ノードを右クリックしてから再度お試しください。');
        return;
    }
    
    form.setAttribute('data-node-id', nodeId);
    currentSelectedNodeId = nodeId;
    
    console.log('フォームを表示しました。ノードID:', nodeId);
    
    // 既存の情報があれば自動入力
    loadExistingSmartGoal(nodeId);
    
    // フォームを画面中央に配置
    centerSmartGoalForm();
    
    // フォームを表示
    form.style.display = 'block';
    
    // ドラッグ機能を初期化（まだ初期化されていない場合）
    initializeDragFunctionality();
}

/**
 * 既存のSMART目標情報を読み込み
 */
function loadExistingSmartGoal(nodeId) {
    try {
        const smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        const existingGoal = smartGoals.find(goal => goal.nodeId === nodeId);
        
        if (existingGoal) {
            document.getElementById('smart_specific').value = existingGoal.specific || '';
            document.getElementById('smart_measurable').value = existingGoal.measurable || '';
            document.getElementById('smart_achievable').value = existingGoal.achievable || '';
            document.getElementById('smart_relevant').value = existingGoal.relevant || '';
            document.getElementById('smart_deadline').value = existingGoal.deadline || '';
            document.getElementById('smart_check_frequency').value = existingGoal.checkFrequency || '';
            document.getElementById('smart_success_criteria').value = existingGoal.successCriteria || '';
            document.getElementById('smart_monitoring_points').value = existingGoal.monitoringPoints || '';
            document.getElementById('smart_adjustment_criteria').value = existingGoal.adjustmentCriteria || '';
        }
    } catch (error) {
        console.error('既存のSMART目標情報の読み込みに失敗:', error);
    }
}

/**
 * SMART目標を保存
 */
function saveSmartGoal() {
    const form = document.getElementById('smart_goal_form');
    const nodeId = form.getAttribute('data-node-id');
    
    if (!nodeId) {
        alert('ノードが選択されていません。');
        return;
    }
    
    const smartGoal = {
        nodeId: nodeId,
        specific: document.getElementById('smart_specific').value.trim(),
        measurable: document.getElementById('smart_measurable').value.trim(),
        achievable: document.getElementById('smart_achievable').value,
        relevant: document.getElementById('smart_relevant').value.trim(),
        deadline: document.getElementById('smart_deadline').value,
        checkFrequency: document.getElementById('smart_check_frequency').value,
        // 振り返り項目を追加
        successCriteria: document.getElementById('smart_success_criteria').value.trim(),
        monitoringPoints: document.getElementById('smart_monitoring_points').value.trim(),
        adjustmentCriteria: document.getElementById('smart_adjustment_criteria').value.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: 0,
        status: 'active',
        reflections: [] // 振り返り履歴を保存する配列
    };
    
    // バリデーション
    if (!smartGoal.specific) {
        alert('具体的内容（Specific）は必須項目です。');
        return;
    }
    
    if (!smartGoal.measurable) {
        alert('測定指標（Measurable）は必須項目です。');
        return;
    }
    
    if (!smartGoal.deadline) {
        alert('期限（Time-bound）は必須項目です。');
        return;
    }
    
    // 期限が過去でないかチェック
    const deadline = new Date(smartGoal.deadline);
    const now = new Date();
    if (deadline <= now) {
        if (!confirm('設定された期限が過去または現在時刻です。このまま保存しますか？')) {
            return;
        }
    }
    
    // LocalStorageに保存
    try {
        saveSmartGoalToStorage(smartGoal);
        
        // ノードの表示を更新
        updateNodeWithSmartGoal(nodeId, smartGoal);
        
        // フォームを閉じる
        hideSmartGoalForm();
        
        // 一覧を更新
        refreshSmartGoals();
        
        // 成功メッセージ
        showSmartGoalStatus('SMART目標を保存しました ✓', '#28a745');
        
    } catch (error) {
        console.error('SMART目標の保存に失敗:', error);
        alert('SMART目標の保存に失敗しました。');
    }
}

/**
 * SMART目標をローカルストレージに保存
 */
function saveSmartGoalToStorage(smartGoal) {
    try {
        let smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        
        // 既存の目標を更新または新規追加
        const existingIndex = smartGoals.findIndex(goal => goal.nodeId === smartGoal.nodeId);
        if (existingIndex >= 0) {
            // 既存の進捗を保持
            smartGoal.progress = smartGoals[existingIndex].progress || 0;
            smartGoal.createdAt = smartGoals[existingIndex].createdAt;
            smartGoals[existingIndex] = smartGoal;
        } else {
            smartGoals.push(smartGoal);
        }
        
        localStorage.setItem('smartGoals', JSON.stringify(smartGoals));
        
    } catch (error) {
        throw new Error('ローカルストレージへの保存に失敗しました: ' + error.message);
    }
}

/**
 * ノードにSMART目標の視覚的な表示を追加
 */
function updateNodeWithSmartGoal(nodeId, smartGoal) {
    // この部分は既存のネットワークライブラリの実装に依存
    // 実装例：ノードの色を変更、アイコンを追加など
    try {
        // 思考過程ネットワークのノードを取得・更新
        if (typeof updateProcessNetworkNode === 'function') {
            updateProcessNetworkNode(nodeId, {
                hasSMARTGoal: true,
                goalDeadline: smartGoal.deadline,
                goalStatus: smartGoal.status
            });
        }
        
        console.log(`ノード ${nodeId} にSMART目標を設定しました`);
    } catch (error) {
        console.error('ノードの更新に失敗:', error);
    }
}

/**
 * SMART目標一覧を更新
 */
function refreshSmartGoals() {
    try {
        const smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        const listContainer = document.getElementById('smart_goals_list');
        const countElement = document.getElementById('smart_goals_count');
        const progressElement = document.getElementById('smart_goals_progress');
        
        if (!listContainer || !countElement || !progressElement) {
            console.error('SMART目標表示要素が見つかりません');
            return;
        }
        
        if (smartGoals.length === 0) {
            listContainer.innerHTML = `
                <div class="smart-goal-item" style="background: white; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px; margin-bottom: 8px; font-size: 11px;">
                    <div style="color: #6c757d; text-align: center; padding: 20px;">
                        SMART目標が設定されていません<br>
                        ノードを右クリックして「SMART目標設定」を選択してください
                    </div>
                </div>
            `;
            countElement.textContent = '0個の目標';
            progressElement.textContent = '進捗: 0%';
            return;
        }
        
        // 期限でソート（近い順）
        smartGoals.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        
        let html = '';
        let totalProgress = 0;
        let completedGoals = 0;
        
        smartGoals.forEach((goal, index) => {
            const deadline = new Date(goal.deadline);
            const now = new Date();
            const isOverdue = deadline < now;
            const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            
            let statusIcon = '📝';
            let statusColor = '#6c757d';
            let timeDisplay = '';
            
            if (isOverdue) {
                statusIcon = '⚠️';
                statusColor = '#dc3545';
                timeDisplay = '期限切れ';
            } else if (daysLeft === 0) {
                statusIcon = '🔥';
                statusColor = '#fd7e14';
                timeDisplay = '今日';
            } else if (daysLeft <= 3) {
                statusIcon = '⏰';
                statusColor = '#ffc107';
                timeDisplay = `${daysLeft}日後`;
            } else {
                timeDisplay = `${daysLeft}日後`;
            }
            
            if (goal.status === 'completed') {
                statusIcon = '✅';
                statusColor = '#28a745';
                completedGoals++;
            }
            
            const achievableLabels = {
                'easy': '簡単',
                'moderate': '適度',
                'challenging': '挑戦的',
                'stretch': 'ストレッチ'
            };
            
            const hasReflections = goal.reflections && goal.reflections.length > 0;
            
            html += `
                <div class="smart-goal-item" style="background: white; border: 1px solid ${statusColor}; border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 11px;">
                    <div style="font-weight: bold; color: ${statusColor}; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <span>${statusIcon} ${goal.specific.substring(0, 30)}${goal.specific.length > 30 ? '...' : ''}</span>
                        <span style="font-size: 10px; background: ${statusColor}; color: white; padding: 2px 6px; border-radius: 10px;">${timeDisplay}</span>
                    </div>
                    <div style="margin-bottom: 3px; color: #495057;"><strong>📊 測定:</strong> ${goal.measurable}</div>
                    <div style="margin-bottom: 3px; color: #495057;"><strong>⏰ 期限:</strong> ${deadline.toLocaleDateString('ja-JP')} ${deadline.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}</div>
                    <div style="margin-bottom: 3px; color: #495057;"><strong>✅ 難易度:</strong> ${achievableLabels[goal.achievable] || '未設定'}</div>
                    <div style="margin-bottom: 6px; color: #495057;"><strong>🎯 関連:</strong> ${goal.relevant || '未設定'}</div>
                    ${hasReflections ? `<div style="margin-bottom: 3px; color: #28a745;"><strong>🔍 振り返り:</strong> ${goal.reflections.length}回実施済み</div>` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; gap: 4px;">
                        <div style="display: flex; gap: 4px;">
                            <button onclick="editSmartGoal('${goal.nodeId}')" style="background: #007bff; color: white; border: none; border-radius: 2px; padding: 2px 6px; font-size: 9px; cursor: pointer;">編集</button>
                            <button onclick="startGoalReflection('${goal.nodeId}')" style="background: #ffc107; color: #212529; border: none; border-radius: 2px; padding: 2px 6px; font-size: 9px; cursor: pointer;">振返</button>
                            <button onclick="completeSmartGoal('${goal.nodeId}')" style="background: #28a745; color: white; border: none; border-radius: 2px; padding: 2px 6px; font-size: 9px; cursor: pointer;">完了</button>
                            <button onclick="deleteSmartGoal('${goal.nodeId}')" style="background: #dc3545; color: white; border: none; border-radius: 2px; padding: 2px 6px; font-size: 9px; cursor: pointer;">削除</button>
                        </div>
                        <div style="font-size: 9px; color: #6c757d;">
                            ${goal.checkFrequency ? `確認頻度: ${getFrequencyLabel(goal.checkFrequency)}` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            totalProgress += (goal.progress || 0);
        });
        
        listContainer.innerHTML = html;
        countElement.textContent = `${smartGoals.length}個の目標`;
        
        const avgProgress = smartGoals.length > 0 ? Math.round(totalProgress / smartGoals.length) : 0;
        const completionRate = smartGoals.length > 0 ? Math.round((completedGoals / smartGoals.length) * 100) : 0;
        progressElement.textContent = `完了率: ${completionRate}%`;
        
    } catch (error) {
        console.error('SMART目標一覧の更新に失敗:', error);
    }
}

/**
 * 頻度ラベルを取得
 */
function getFrequencyLabel(frequency) {
    const labels = {
        'daily': '毎日',
        'weekly': '週1回',
        'biweekly': '2週間に1回',
        'monthly': '月1回'
    };
    return labels[frequency] || frequency;
}

/**
 * SMART目標を編集
 */
function editSmartGoal(nodeId) {
    showSmartGoalForm(nodeId);
}

/**
 * SMART目標を完了
 */
function completeSmartGoal(nodeId) {
    try {
        let smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        const goalIndex = smartGoals.findIndex(goal => goal.nodeId === nodeId);
        
        if (goalIndex >= 0) {
            smartGoals[goalIndex].status = 'completed';
            smartGoals[goalIndex].progress = 100;
            smartGoals[goalIndex].completedAt = new Date().toISOString();
            
            localStorage.setItem('smartGoals', JSON.stringify(smartGoals));
            refreshSmartGoals();
            showSmartGoalStatus('SMART目標を完了しました ✓', '#28a745');
        }
    } catch (error) {
        console.error('SMART目標の完了処理に失敗:', error);
        alert('SMART目標の完了処理に失敗しました。');
    }
}

/**
 * SMART目標を削除
 */
function deleteSmartGoal(nodeId) {
    if (!confirm('このSMART目標を削除してもよろしいですか？')) {
        return;
    }
    
    try {
        let smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        smartGoals = smartGoals.filter(goal => goal.nodeId !== nodeId);
        
        localStorage.setItem('smartGoals', JSON.stringify(smartGoals));
        refreshSmartGoals();
        showSmartGoalStatus('SMART目標を削除しました', '#dc3545');
        
    } catch (error) {
        console.error('SMART目標の削除に失敗:', error);
        alert('SMART目標の削除に失敗しました。');
    }
}

/**
 * SMART目標フォームを隠す
 */
function hideSmartGoalForm() {
    const form = document.getElementById('smart_goal_form');
    if (form) {
        form.style.display = 'none';
        
        // フォームをクリア
        document.getElementById('smart_specific').value = '';
        document.getElementById('smart_measurable').value = '';
        document.getElementById('smart_achievable').value = '';
        document.getElementById('smart_relevant').value = '';
        document.getElementById('smart_deadline').value = '';
        document.getElementById('smart_check_frequency').value = '';
        document.getElementById('smart_success_criteria').value = '';
        document.getElementById('smart_monitoring_points').value = '';
        document.getElementById('smart_adjustment_criteria').value = '';
    }
    
    currentSelectedNodeId = null;
}

/**
 * ステータスメッセージを表示
 */
function showSmartGoalStatus(message, color) {
    // 既存のメモステータス表示機能を流用
    const statusElement = document.getElementById('memo-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = color;
        statusElement.style.opacity = '1';
        
        setTimeout(() => {
            statusElement.style.opacity = '0.8';
        }, 3000);
    }
}

/**
 * 選択中のノードIDを取得（他のスクリプトとの連携用）
 */
function getSelectedNodeId() {
    // 1. グローバル変数から選択されたノードIDを取得
    if (typeof window.selectedNodeId !== 'undefined' && window.selectedNodeId) {
        return window.selectedNodeId;
    }
    
    // 2. 思考過程ネットワークのインスタンスから取得
    if (typeof window.thinkingProcessNetwork !== 'undefined' && 
        window.thinkingProcessNetwork && 
        window.thinkingProcessNetwork.selectedNodeId) {
        return window.thinkingProcessNetwork.selectedNodeId;
    }
    
    // 3. オブジェクトネットワークから取得
    if (typeof window.objectNetwork !== 'undefined' && 
        window.objectNetwork && 
        window.objectNetwork.selectedNodeId) {
        return window.objectNetwork.selectedNodeId;
    }
    
    // 4. process_network変数から取得
    if (typeof process_network !== 'undefined' && process_network && process_network.selectedNodeId) {
        return process_network.selectedNodeId;
    }
    
    // 5. 他のグローバル変数を確認
    if (typeof selected_node_id !== 'undefined') {
        return selected_node_id;
    }
    
    // 6. 現在選択中のノードIDを返す（フォールバック）
    if (currentSelectedNodeId) {
        return currentSelectedNodeId;
    }
    
    // 7. 最後の手段として、右クリック時に設定されたノードIDを確認
    if (typeof window.contextMenuNodeId !== 'undefined' && window.contextMenuNodeId) {
        return window.contextMenuNodeId;
    }
    
    return null;
}

/**
 * ノードIDを設定する（右クリック時に呼び出される）
 */
function setContextMenuNodeId(nodeId) {
    window.contextMenuNodeId = nodeId;
    currentSelectedNodeId = nodeId;
}

/**
 * SMART目標設定のコンテキストメニューイベントハンドラ
 */
function handleSmartGoalMenuClick(event) {
    console.log('SMART目標設定がクリックされました');
    
    // まず、イベントから直接ノードIDを取得を試みる
    let selectedNodeId = null;
    
    // 1. イベントのtarget要素からノードIDを取得
    if (event && event.target) {
        const contextMenu = event.target.closest('#t_Process_conmenu');
        if (contextMenu && contextMenu.getAttribute('data-node-id')) {
            selectedNodeId = contextMenu.getAttribute('data-node-id');
        }
    }
    
    // 2. getSelectedNodeId関数から取得
    if (!selectedNodeId) {
        selectedNodeId = getSelectedNodeId();
    }
    
    // 3. 直接プロンプトでノードIDを入力してもらう（デバッグ用）
    if (!selectedNodeId) {
        selectedNodeId = prompt('デバッグ用: ノードIDを入力してください（例: node_1, node_2など）:');
    }
    
    console.log('取得されたノードID:', selectedNodeId);
    
    if (selectedNodeId) {
        showSmartGoalForm(selectedNodeId);
        // コンテキストメニューを閉じる
        const contextMenu = document.getElementById('t_Process_conmenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    } else {
        alert('ノードを選択してください。\n\nヒント:\n1. ノードを右クリックしてからメニューを選択してください\n2. ノードが正しく選択されているか確認してください');
    }
}

/**
 * SMART目標の期限チェック（定期実行用）
 */
function checkSmartGoalDeadlines() {
    try {
        const smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        const now = new Date();
        let overdueCount = 0;
        let todayCount = 0;
        
        smartGoals.forEach(goal => {
            if (goal.status !== 'completed') {
                const deadline = new Date(goal.deadline);
                const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                
                if (daysLeft < 0) {
                    overdueCount++;
                } else if (daysLeft === 0) {
                    todayCount++;
                }
            }
        });
        
        // 通知表示（必要に応じて）
        if (overdueCount > 0) {
            console.warn(`${overdueCount}個のSMART目標が期限切れです`);
        }
        if (todayCount > 0) {
            console.info(`${todayCount}個のSMART目標が今日締切です`);
        }
        
    } catch (error) {
        console.error('SMART目標の期限チェックに失敗:', error);
    }
}

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // 少し遅延させて既存のイベントハンドラが設定された後に実行
    setTimeout(function() {
        // SMART目標関連のイベントリスナーを設定
        const saveBtn = document.getElementById('smart_goal_save');
        const cancelBtn = document.getElementById('smart_goal_cancel');
        const smartMenuBtn = document.getElementById('process_conmenu_smart');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', saveSmartGoal);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', hideSmartGoalForm);
        }
        
        if (smartMenuBtn) {
            smartMenuBtn.addEventListener('click', function(event) {
                handleSmartGoalMenuClick(event);
            });
        } else {
            console.warn('SMART目標設定メニューボタンが見つかりません');
        }
        
        // SMART目標一覧を初期化
        refreshSmartGoals();
        
        // 定期的な期限チェック（1時間ごと）
        setInterval(checkSmartGoalDeadlines, 60 * 60 * 1000);
        
        // 初回チェック
        checkSmartGoalDeadlines();
        
        // 既存のコンテキストメニューイベントをオーバーライド
        overrideContextMenuEvents();
        
    }, 1500); // 遅延を少し増やす
});

/**
 * 既存のコンテキストメニューイベントをオーバーライド
 */
function overrideContextMenuEvents() {
    // 思考過程ネットワークのコンテキストメニュー表示時にノードIDを保存
    const networkContainer = document.getElementById('myProcessnetwork');
    if (networkContainer) {
        networkContainer.addEventListener('contextmenu', function(event) {
            // コンテキストメニューが表示される際に、クリックされた位置からノードを特定
            setTimeout(function() {
                // vis.jsネットワークのインスタンスから選択されたノードを取得
                try {
                    if (typeof network !== 'undefined' && network) {
                        const pointer = {
                            x: event.offsetX,
                            y: event.offsetY
                        };
                        const nodeId = network.getNodeAt(pointer);
                        if (nodeId) {
                            console.log('右クリックで選択されたノード:', nodeId);
                            setContextMenuNodeId(nodeId);
                        }
                    }
                } catch (e) {
                    console.log('ネットワークからノードIDを取得できませんでした:', e);
                }
            }, 100);
        });
    }
}

// ウィンドウクリック時にフォームを閉じる
document.addEventListener('click', function(event) {
    const form = document.getElementById('smart_goal_form');
    if (form && form.style.display === 'block' && !form.contains(event.target)) {
        // フォーム外をクリックした場合は閉じない（誤操作防止）
        // hideSmartGoalForm();
    }
});

// エスケープキーでフォームを閉じる
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideSmartGoalForm();
    }
});

// ページ読み込み時にドラッグ機能を初期化
document.addEventListener('DOMContentLoaded', function() {
    // 少し遅延を入れてフォームが確実に存在することを保証
    setTimeout(initializeDragFunctionality, 100);
});

// 振り返りリマインダーを表示
function showReflectionReminder() {
    try {
        const smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        
        if (smartGoals.length === 0) {
            alert('設定されているSMART目標がありません。');
            return;
        }
        
        // 振り返りが必要な目標を特定
        const now = new Date();
        const needsReflection = smartGoals.filter(goal => {
            const deadline = new Date(goal.deadline);
            const daysSinceDeadline = Math.floor((now - deadline) / (1000 * 60 * 60 * 24));
            
            // 期限を過ぎた目標、または期限が近い目標
            return daysSinceDeadline >= 0 || daysSinceDeadline >= -1;
        });
        
        const modal = document.getElementById('reflection_reminder_modal');
        const content = document.getElementById('reflection_content');
        
        let html = '<div style="margin-bottom: 16px;">';
        html += '<h4 style="color: #dc3545; margin-bottom: 12px;">⚠️ 振り返りのお時間です</h4>';
        html += '<p style="margin-bottom: 12px;">自己調整学習では、<strong>「手段の完了 ≠ 目標の達成」</strong>を意識することが重要です。</p>';
        html += '<div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 12px; margin-bottom: 16px;">';
        html += '<p style="margin: 0; font-weight: bold; color: #856404;">🔍 振り返りのポイント</p>';
        html += '<ul style="margin: 8px 0 0 20px; color: #856404;">';
        html += '<li><strong>結果と質を客観的に評価</strong>：「やった」ではなく「何が達成できたか」</li>';
        html += '<li><strong>実行中の違和感を確認</strong>：予想と異なった点、困難だった点</li>';
        html += '<li><strong>次への改善点を明確化</strong>：同じ間違いを繰り返さないために</li>';
        html += '</ul>';
        html += '</div>';
        
        if (needsReflection.length > 0) {
            html += '<h5 style="color: #dc3545; margin-bottom: 8px;">振り返りが必要な目標：</h5>';
            needsReflection.forEach(goal => {
                const deadline = new Date(goal.deadline);
                const isOverdue = deadline < now;
                html += `<div style="background: ${isOverdue ? '#ffebee' : '#e3f2fd'}; border: 1px solid ${isOverdue ? '#f44336' : '#2196f3'}; border-radius: 4px; padding: 8px; margin-bottom: 6px;">`;
                html += `<div style="font-weight: bold; color: ${isOverdue ? '#d32f2f' : '#1976d2'};">${goal.specific.substring(0, 40)}${goal.specific.length > 40 ? '...' : ''}</div>`;
                html += `<div style="font-size: 11px; color: #666; margin-top: 4px;">期限: ${deadline.toLocaleDateString('ja-JP')} ${isOverdue ? '（期限切れ）' : '（まもなく期限）'}</div>`;
                html += `<button onclick="startGoalReflection('${goal.nodeId}')" style="background: #ffc107; color: #212529; border: none; border-radius: 3px; padding: 4px 8px; font-size: 10px; margin-top: 4px; cursor: pointer;">振り返りを開始</button>`;
                html += '</div>';
            });
        } else {
            html += '<p style="color: #28a745;">現在振り返りが必要な目標はありません。定期的な確認を続けましょう！</p>';
        }
        
        html += '</div>';
        content.innerHTML = html;
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('振り返りリマインダーの表示エラー:', error);
        alert('振り返りリマインダーの表示に失敗しました。');
    }
}

// 振り返りリマインダーを閉じる
function closeReflectionReminder() {
    const modal = document.getElementById('reflection_reminder_modal');
    modal.style.display = 'none';
}

// 個別目標の振り返りを開始
function startGoalReflection(nodeId) {
    try {
        const smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        const goal = smartGoals.find(g => g.nodeId === nodeId);
        
        if (!goal) {
            alert('目標が見つかりません。');
            return;
        }
        
        // リマインダーモーダルを閉じる
        closeReflectionReminder();
        
        // 振り返りモーダルを表示
        const modal = document.getElementById('goal_reflection_modal');
        const titleElement = document.getElementById('goal_reflection_title');
        
        titleElement.innerHTML = `
            <div style="font-size: 14px; color: #007bff;">📝 ${goal.specific}</div>
            <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">測定指標: ${goal.measurable}</div>
            <div style="font-size: 12px; color: #6c757d;">期限: ${new Date(goal.deadline).toLocaleDateString('ja-JP')}</div>
        `;
        
        // フォームをクリア
        document.getElementById('reflection_actual_result').value = '';
        document.getElementById('reflection_issues').value = '';
        document.getElementById('reflection_improvements').value = '';
        document.getElementById('reflection_achievement_level').value = '';
        
        // 目標IDを保存
        modal.setAttribute('data-goal-id', nodeId);
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('振り返り開始エラー:', error);
        alert('振り返りの開始に失敗しました。');
    }
}

// 目標振り返りを保存
function saveGoalReflection() {
    try {
        const modal = document.getElementById('goal_reflection_modal');
        const goalId = modal.getAttribute('data-goal-id');
        
        const reflection = {
            actualResult: document.getElementById('reflection_actual_result').value,
            issues: document.getElementById('reflection_issues').value,
            improvements: document.getElementById('reflection_improvements').value,
            achievementLevel: document.getElementById('reflection_achievement_level').value,
            reflectionDate: new Date().toISOString()
        };
        
        // バリデーション
        if (!reflection.actualResult || !reflection.achievementLevel) {
            alert('実際の成果と達成度は必須項目です。');
            return;
        }
        
        // 目標に振り返りを追加
        let smartGoals = JSON.parse(localStorage.getItem('smartGoals') || '[]');
        const goalIndex = smartGoals.findIndex(g => g.nodeId === goalId);
        
        if (goalIndex >= 0) {
            if (!smartGoals[goalIndex].reflections) {
                smartGoals[goalIndex].reflections = [];
            }
            smartGoals[goalIndex].reflections.push(reflection);
            
            // 達成度に応じて進捗を更新
            const achievementMap = {
                'excellent': 100,
                'good': 85,
                'partial': 60,
                'insufficient': 30,
                'failed': 0
            };
            smartGoals[goalIndex].progress = achievementMap[reflection.achievementLevel] || 0;
            
            localStorage.setItem('smartGoals', JSON.stringify(smartGoals));
            
            closeGoalReflection();
            refreshSmartGoals();
            
            alert('振り返りを保存しました。自己調整学習の継続的な改善にご活用ください！');
        } else {
            alert('目標が見つかりません。');
        }
        
    } catch (error) {
        console.error('振り返り保存エラー:', error);
        alert('振り返りの保存に失敗しました。');
    }
}

// 目標振り返りを閉じる
function closeGoalReflection() {
    const modal = document.getElementById('goal_reflection_modal');
    modal.style.display = 'none';
}
