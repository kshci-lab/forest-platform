// journal_report.js
// Handles export-weekly-btn click handlers and Word export preview/download.
(function () {
    // Helper: generate user-specific localStorage key
    function getStorageKey(baseName) {
        var mapId = window.MAPID || 'default';
        return baseName + '_' + mapId;
    }

    // idempotent init
    window.initWeeklyReportHandlers = function (goalHelpers) {
        if (window._weeklyReportInited) return;
        window._weeklyReportInited = true;

        function getCurrentLang() {
            try { return (goalHelpers && typeof goalHelpers.getCurrentLang === 'function') ? goalHelpers.getCurrentLang() : ((document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja'); } catch (e) { return 'ja'; }
        }

        function translateModalContent(modalEl) {
            if (typeof window.translateText !== 'function') return;

            modalEl.querySelectorAll('.jr-trans-query').forEach(async function (el) {
                var orig = el.textContent.trim();
                if (orig) {
                    var trans = await window.translateText(orig, 'en');
                    el.textContent = trans;
                }
            });

            modalEl.querySelectorAll('.jr-trans-answer').forEach(async function (el) {
                var orig = el.textContent.trim();
                if (orig && orig !== 'New Node' && orig !== '未リンク') {
                    var trans = await window.translateText(orig, 'en');
                    el.textContent = trans;
                }
            });

            modalEl.querySelectorAll('.jr-trans-node').forEach(async function (el) {
                var orig = el.textContent.trim();
                if (orig && orig !== '(内容なし)' && orig !== '(no content)') {
                    var trans = await window.translateText(orig, 'en');
                    el.textContent = trans;
                }
            });

            modalEl.querySelectorAll('.jr-trans-purpose').forEach(async function (el) {
                var orig = el.textContent.trim();
                if (orig) {
                    var trans = await window.translateText(orig, 'en');
                    el.textContent = trans;
                }
            });

            modalEl.querySelectorAll('.jr-trans-fallback').forEach(async function (el) {
                var orig = el.textContent.trim();
                if (orig && orig !== '(内容なし)' && orig !== '(no content)') {
                    var trans = await window.translateText(orig, 'en');
                    el.textContent = trans;
                }
            });

            // 6. タイムライン詳細（ラベル変更や理由記述の中身）の翻訳
            modalEl.querySelectorAll('.jr-trans-detail').forEach(async function (el) {
                var orig = el.textContent.trim();
                if (orig && isNaN(orig) && orig !== 'New Node' && orig !== '未リンク') {
                    var trans = await window.translateText(orig, 'en');
                    el.textContent = trans;
                }
            });

            // 7. 過去の記録（History）プレビューの翻訳
            modalEl.querySelectorAll('.jr-trans-history').forEach(async function (el) {
                var orig = el.innerHTML.trim();
                if (orig && orig !== '-' && orig !== '教訓はありません。' && orig !== 'No lessons.') {
                    var trans = await window.translateText(orig, 'en');
                    el.innerHTML = trans;
                }
            });

            // 8. 入力フォーム（textarea）の値の翻訳とオリジナル値の退避
            modalEl.querySelectorAll('.jr-textarea').forEach(async function (ta) {
                var orig = ta.value.trim();
                if (orig && orig !== 'New Node' && orig !== '未リンク') {
                    if (!ta.dataset.originalValue) {
                        ta.dataset.originalValue = ta.value;
                    }
                    var trans = await window.translateText(ta.dataset.originalValue, 'en');
                    ta.value = trans;
                    ta.dataset.translatedValue = trans;
                    
                    ta.style.height = 'auto';
                    ta.style.height = ta.scrollHeight + 'px';
                }
                
                if (!ta.dataset.hasInputListener) {
                    ta.addEventListener('input', function() {
                        delete ta.dataset.originalValue;
                        delete ta.dataset.translatedValue;
                    });
                    ta.dataset.hasInputListener = 'true';
                }
            });
        }

        function formatRow(label, detail, time) {
            var tr = document.createElement('tr');

            var tdLabel = document.createElement('td');
            tdLabel.textContent = label || '';
            tdLabel.style.padding = '6px 8px';
            tdLabel.style.fontWeight = '600';

            var tdDetail = document.createElement('td');
            tdDetail.textContent = detail || '';
            tdDetail.style.padding = '6px 8px';

            var tdTime = document.createElement('td');
            tdTime.textContent = time || '';
            tdTime.style.padding = '6px 8px';
            tdTime.style.whiteSpace = 'nowrap';
            tdTime.style.color = '#888';

            tr.appendChild(tdLabel);
            tr.appendChild(tdDetail);
            tr.appendChild(tdTime);
            return tr;
        }

        var weeklyListDiv = document.getElementById('weeklyGoalsList');
        if (!weeklyListDiv) return;

        // Ensure CSS for journal report modal is loaded (idempotent)
        try {
            if (!document.getElementById('jr-css')) {
                var jrLink = document.createElement('link');
                jrLink.id = 'jr-css';
                jrLink.rel = 'stylesheet';
                jrLink.href = './css/journal_report.css?v=' + new Date().getTime();
                document.head.appendChild(jrLink);
            }
        } catch (e) { console.warn('journal_report: failed to inject CSS', e); }
        // Delegate using event delegation to avoid re-binding on rerender.
        weeklyListDiv.addEventListener('click', function (e) {
            var btn = e.target.closest && e.target.closest('.export-weekly-btn');
            if (!btn) return;
            try {
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                var goals = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
                var goal = goals[idx];
                // Debug: dump relevant variables to console to help trace missing object_journal_id
                try {
                } catch (dbgErr) { console.warn('journal_report debug log failed', dbgErr); }

                // Normalize journal id: accept several possible property names (object_journal_id, object_goal_id, etc.)
                var objectJournalId = null;
                try {
                    if (goal) {
                        objectJournalId = goal.object_journal_id || goal.object_goal_id || goal.object_goal || goal.objectJournalId || goal.objectGoalId || null;
                    }
                } catch (e) { objectJournalId = null; }

                if (!goal || !objectJournalId) {
                    console.warn('journal_report: object_journal_id が見つかりません');
                    return;
                }
                var startDate = goal.start || goal.start_date;
                var endDate = goal.end || goal.finish_date;
                var goalContents = Array.isArray(goal.contents) ? goal.contents : [];

                $.ajax({
                    //まずは該当の問いノードのnode_idを取得している
                    url: 'php/get_object_journal_nodes.php',
                    type: 'GET',
                    dataType: 'json',
                    data: { object_journal_id: objectJournalId },
                    success: function (res) {
                        if (!(res && res.success && Array.isArray(res.node_ids))) {
                            console.warn('journal_report: node_ids が見つかりません', res);
                            return;
                        }
                        var nodeIds = res.node_ids;
                        var promises = nodeIds.map(function (nodeId, i) {
                            return new Promise(function (resolve) {
                                $.ajax({
                                    //ジャーナルの手段履歴を取得している
                                    url: 'php/get_object_node_info.php',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: { node_id: nodeId, start_date: startDate, end_date: endDate },
                                    success: function (objRes) {
                                        var contentArr = [];
                                        try {
                                            // Prefer histories (from object_nodes_histories) because they carry `activity`.
                                            var source = (objRes && Array.isArray(objRes.histories) && objRes.histories.length) ? objRes.histories : (objRes && Array.isArray(objRes.data) ? objRes.data : []);
                                            // mapping for activity -> prefix
                                            contentArr = source.map(function (r) {
                                                return r.content || '';
                                            });
                                        } catch (e) { console.error('build contentArr error', e); }
                                        var dispText = '';
                                        if (goalContents && goalContents.length > 0) {
                                            var foundContent = goalContents.find(function(c) {
                                                return typeof c === 'object' && String(c.node_id) === String(nodeId);
                                            });
                                            if (foundContent) {
                                                dispText = foundContent.content || foundContent.node_id || '';
                                            } else {
                                                dispText = (goalContents[i] ? (typeof goalContents[i] === 'object' ? (goalContents[i].content || goalContents[i].node_id || '') : goalContents[i]) : '');
                                            }
                                        }
                                        resolve({ display: dispText, answer_content: objRes.answer_content || '', answer_histories: objRes.answer_histories || [], content: contentArr, object_node_ids: objRes.object_node_ids || [], object_node_history_ids: objRes.object_node_history_ids || [], histories: objRes.histories || [], node_children: objRes.node_children || {}, node_parents: objRes.node_parents || {} });
                                    },
                                    error: function (xhr, status, err) {
                                        console.error('journal_report: get_object_node_info error', {
                                            nodeId: nodeId,
                                            status: status,
                                            error: err,
                                            response: xhr && xhr.responseText
                                        });
                                        resolve({ display: goalContents[i] || '', content: [], object_node_ids: [], object_node_history_ids: [], histories: [] });
                                    }
                                });
                            });
                        });

                        Promise.all(promises).then(function(results){
                            var modal = document.createElement('div');
                            modal.className = 'jr-floating-window';
                            modal.style.position = 'fixed';
                            // Center it roughly, but leave space to see the background
                            modal.style.left = '5%';
                            modal.style.top = '5%';
                            modal.style.width = '90vw';
                            modal.style.height = '90vh';
                            modal.style.zIndex = '10000';
                            modal.style.background = '#fff';
                            modal.style.borderRadius = '12px';
                            modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
                            modal.style.display = 'flex';
                            modal.style.flexDirection = 'column';
                            modal.style.overflow = 'hidden';
                            modal.style.resize = 'both'; // Make it resizable!
                            modal.style.minWidth = '300px'; // Prevent collapsing too much
                            modal.style.minHeight = '200px';
                            var modalContent = document.createElement('div');
                            modalContent.className = 'jr-modal-content';
                            // guard to avoid rendering reflections twice (two separate AJAX calls below)
                            var _reflectionsRendered = false;
                            var theme = (typeof window.theme !== 'undefined') ? window.theme : { border:'#e6eaf0', text:'#233043', muted:'#7a8698', accent:'#1363df', primary:'#2b7a78' };
                            // override any modalContent fixed width/padding if set elsewhere, let it fill the floating window
                            modalContent.style.flex = '1';
                            modalContent.style.overflowY = 'hidden'; // Ensure it doesn't scroll globally, so columns can scroll independently
                            modalContent.style.display = 'flex';
                            modalContent.style.flexDirection = 'column';
                            modalContent.style.padding = '0'; // padding will be managed by header and layout
                            modalContent.style.margin = '0';
                            modalContent.style.width = '100%';
                            modalContent.style.height = '100%';
                            modalContent.style.borderRadius = '0';
                            modalContent.style.boxShadow = 'none';
                            modalContent.style.position = 'relative';

                            // (Removed headerWrapper as per user request)

                            // Initialize unsaved changes state
                            window.__jr_hasUnsavedChanges = false;

                            // Drag and Drop Logic
                            var isDragging = false;
                            var dragStartX, dragStartY, initialLeft, initialTop;
                            
                            modalContent.addEventListener('mousedown', function(e) {
                                // フォーム要素、ボタン、タブ、リンク等の上でドラッグを開始しない
                                if (e.target.closest && e.target.closest('button, input, textarea, select, a, .jr-col-divider, .srl-tab, .srl-lessons-subtab, [contenteditable]')) {
                                    return;
                                }
                                // テキスト選択などを考慮して、ドラッグ対象にならないクラス等を追加で除外する場合は適宜追加
                                
                                isDragging = true;
                                dragStartX = e.clientX;
                                dragStartY = e.clientY;
                                var rect = modal.getBoundingClientRect();
                                initialLeft = rect.left;
                                initialTop = rect.top;
                                document.body.style.userSelect = 'none';
                            });
                            
                            document.addEventListener('mousemove', function(e) {
                                if (!isDragging) return;
                                var dx = e.clientX - dragStartX;
                                var dy = e.clientY - dragStartY;
                                modal.style.left = (initialLeft + dx) + 'px';
                                modal.style.top = (initialTop + dy) + 'px';
                                modal.style.right = 'auto';
                                modal.style.bottom = 'auto';
                                modal.style.margin = '0'; // clear any margin that might interfere
                            });
                            
                            document.addEventListener('mouseup', function(e) {
                                if (isDragging) {
                                    isDragging = false;
                                    document.body.style.userSelect = '';
                                }
                            });

                            // (Removed periodHeading from here as per user request)
                            
                            // headerRightWrap is removed along with headerWrapper
                            
                            var historyBtn = document.createElement('button');
                            historyBtn.type = 'button';
                            historyBtn.className = 'jr-history-toggle';
                            historyBtn.textContent = (getCurrentLang() === 'ja') ? '過去の記録を見る' : 'View history';
                            historyBtn.setAttribute('aria-expanded', 'false');

                            var closeIconBtn = document.createElement('button');
                            closeIconBtn.innerHTML = '&times;';
                            closeIconBtn.style.position = 'absolute';
                            closeIconBtn.style.top = '12px';
                            closeIconBtn.style.right = '16px';
                            closeIconBtn.style.zIndex = '10000';
                            closeIconBtn.style.background = 'transparent';
                            closeIconBtn.style.border = 'none';
                            closeIconBtn.style.fontSize = '24px';
                            closeIconBtn.style.color = '#a0aec0';
                            closeIconBtn.style.cursor = 'pointer';
                            closeIconBtn.style.padding = '0 4px';
                            closeIconBtn.style.lineHeight = '1';
                            closeIconBtn.style.transition = 'color 0.2s ease';
                            closeIconBtn.addEventListener('mouseenter', function() { closeIconBtn.style.color = '#4a5568'; });
                            closeIconBtn.addEventListener('mouseleave', function() { closeIconBtn.style.color = '#a0aec0'; });
                            
                            closeIconBtn.addEventListener('click', function(e) {
                                e.stopPropagation(); // prevent dragging
                                if (window.__jr_hasUnsavedChanges) {
                                    if (!confirm((getCurrentLang() === 'ja') ? '変更が保存されていませんが、本当に閉じますか？' : 'You have unsaved changes. Are you sure you want to close?')) {
                                        return;
                                    }
                                }
                                document.body.removeChild(modal);
                            });
                            // Add buttons directly to modal
                            modal.appendChild(closeIconBtn);

                            // Two-column layout: Activity Process (left) + Reflections (right) + Divider
                            var twoColumnLayout = document.createElement('div');
                            twoColumnLayout.className = 'jr-two-column-layout';
                            twoColumnLayout.style.padding = '0 24px 24px 24px'; // padding for the body content
                            modalContent.appendChild(twoColumnLayout);

                            // Left column: Activity Process (always visible)
                            var leftColumn = document.createElement('div');
                            leftColumn.className = 'jr-left-column';
                            // Removed left column header
                            var activityContent = document.createElement('div');
                            activityContent.className = 'jr-activity-content';
                            
                            var startParts = startDate ? startDate.split('-').map(Number) : [];
                            var endParts = endDate ? endDate.split('-').map(Number) : [];
                            var dateStr = '';
                            if (startParts.length === 3 && endParts.length === 3) {
                                dateStr = startParts[0] + '/' + startParts[1] + '/' + startParts[2] + '〜' + endParts[1] + '/' + endParts[2];
                            } else {
                                dateStr = (startDate || '') + '〜' + (endDate || '');
                            }
                            var headingWrapper = document.createElement('div');
                            headingWrapper.style.display = 'flex';
                            headingWrapper.style.alignItems = 'center';
                            headingWrapper.style.margin = '0 0 16px 0';
                            headingWrapper.style.gap = '12px';

                            var periodHeading = document.createElement('h3');
                            periodHeading.className = 'jr-period-heading';
                            periodHeading.style.margin = '0'; // removed bottom margin, it's on the wrapper now
                            periodHeading.style.fontSize = '18px';
                            periodHeading.textContent = dateStr + ((getCurrentLang() === 'ja') ? 'に行ったこと' : ' activities');
                            
                            var printBtn = document.createElement('button');
                            printBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>';
                            printBtn.title = (getCurrentLang() === 'ja') ? 'PDFとして保存 / 印刷' : 'Save as PDF / Print';
                            printBtn.style.background = 'transparent';
                            printBtn.style.border = 'none';
                            printBtn.style.color = '#a0aec0';
                            printBtn.style.cursor = 'pointer';
                            printBtn.style.padding = '4px';
                            printBtn.style.lineHeight = '1';
                            printBtn.style.transition = 'color 0.2s ease, transform 0.1s ease';
                            printBtn.className = 'jr-no-print';
                            printBtn.addEventListener('mouseenter', function() { printBtn.style.color = '#4a5568'; });
                            printBtn.addEventListener('mouseleave', function() { printBtn.style.color = '#a0aec0'; });
                            printBtn.addEventListener('mousedown', function() { printBtn.style.transform = 'scale(0.95)'; });
                            printBtn.addEventListener('mouseup', function() { printBtn.style.transform = 'scale(1)'; });
                            
                            printBtn.addEventListener('click', function(e) {
                                e.stopPropagation();
                                document.body.classList.add('jr-printing');
                                
                                // 画面上で一瞬だけ完全に展開させて、正確な高さを取得する
                                document.body.classList.add('jr-measuring');
                                
                                // reflowを強制
                                 modalContent.querySelectorAll('textarea').forEach(function(ta) {
                                     ta.style.height = 'auto';
                                     ta.style.height = ta.scrollHeight + 'px';
                                 });
                                 var currentHeight = modalContent.offsetHeight;
                                
                                document.body.classList.remove('jr-measuring');
                                
                                // A4横の有効な高さ（ヘッダーやbodyの余白を考慮し、安全のため580px程度にする）
                                var targetHeight = 580;
                                var scaleRatio = 1;
                                
                                if (currentHeight > targetHeight) {
                                    scaleRatio = targetHeight / currentHeight;
                                    
                                    // zoomが使えるブラウザ（Chrome等）はレイアウト自体を縮小する
                                    if (typeof modalContent.style.zoom !== "undefined") {
                                        modalContent.style.zoom = scaleRatio;
                                    } else {
                                        modalContent.style.transform = 'scale(' + scaleRatio + ')';
                                        modalContent.style.transformOrigin = 'top center';
                                        modalContent.style.width = (100 / scaleRatio) + '%';
                                    }
                                }

                                var originalTitle = document.title;
                                var uid = window.USER_USERNAME || window.USERID || 'unknown';
                                var mapping = {
                                    'ikejima': '01',
                                    'kagitani': '02',
                                    'kawa': '03',
                                    'shimaoka': '04',
                                    'tanaka': '05',
                                    'ikeda': '06',
                                    'egawa': '07',
                                    'sakanaka': '08',
                                    'shiraki': '09',
                                    'nakajima': '10',
                                    'yamauchi': '11'
                                };
                                var numStr = mapping[uid] || '00';
                                var d = new Date();
                                var yyyy = d.getFullYear();
                                var mm = String(d.getMonth() + 1).padStart(2, '0');
                                var dd = String(d.getDate()).padStart(2, '0');
                                var dateStr = yyyy + '-' + mm + '-' + dd;
                                document.title = dateStr + '_' + numStr + '_' + uid + '_自己調整さん';

                                window.print();
                                
                                document.title = originalTitle;

                                setTimeout(function() {
                                    document.body.classList.remove('jr-printing');
                                    modalContent.style.zoom = '';
                                    modalContent.style.transform = '';
                                    modalContent.style.transformOrigin = '';
                                    modalContent.style.width = '100%';
                                }, 1000);
                            });

                            headingWrapper.appendChild(periodHeading);
                            headingWrapper.appendChild(printBtn);
                            
                            activityContent.appendChild(headingWrapper);
                            
                            leftColumn.appendChild(activityContent);
                            twoColumnLayout.appendChild(leftColumn);

                            // Divider (resize bar)
                            var divider = document.createElement('div');
                            divider.className = 'jr-col-divider';
                            twoColumnLayout.appendChild(divider);

                            // Right column: Reflections with tabs
                            var rightColumn = document.createElement('div');
                            rightColumn.className = 'jr-right-column';

                            // Removed right column header and moved historyBtn to headerWrapper

                            var reflectionCard = document.createElement('div');
                            reflectionCard.className = 'jr-reflection-card';

                            var reflectionBody = document.createElement('div');
                            reflectionBody.className = 'jr-reflection-body';

                            // Tab container for multiple reflections (in right column)
                            var tabContainer = document.createElement('div');
                            tabContainer.className = 'jr-tab-container';
                            tabContainer.appendChild(historyBtn);
                            reflectionBody.appendChild(tabContainer);

                            // Tab content container (in right column)
                            var tabContentContainer = document.createElement('div');
                            tabContentContainer.className = 'jr-tab-content-container jr-reflection-content';
                            reflectionBody.appendChild(tabContentContainer);

                            reflectionCard.appendChild(reflectionBody);

                            var historyPanel = document.createElement('div');
                            historyPanel.className = 'jr-history-panel';
                            historyPanel.setAttribute('aria-label', (getCurrentLang() === 'ja') ? '過去の記録' : 'History');

                            var historyHeader = document.createElement('div');
                            historyHeader.className = 'jr-history-header';
                            historyHeader.textContent = (getCurrentLang() === 'ja') ? '過去の記録' : 'History';
                            historyPanel.appendChild(historyHeader);

                            var historyList = document.createElement('div');
                            historyList.className = 'jr-history-list';
                            historyPanel.appendChild(historyList);

                            reflectionCard.appendChild(historyPanel);
                            rightColumn.appendChild(reflectionCard);
                            twoColumnLayout.appendChild(rightColumn);

                            function escapeHtml(str) {
                                if (!str && str !== 0) return '';
                                return String(str)
                                    .replace(/&/g, '&amp;')
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/"/g, '&quot;')
                                    .replace(/\'/g, '&#39;');
                            }

                            function formatJrDateTime(ts) {
                                if (!ts) return '';
                                var clean = String(ts).replace(/\.\d+$/, '');
                                var parts = clean.split(' ');
                                if (!parts.length) return clean;
                                var datePart = parts[0] || '';
                                var timePart = parts[1] || '';
                                var d = datePart.split('-');
                                var t = timePart.split(':');
                                if (d.length < 3) return clean;
                                var yyyy = d[0];
                                var mm = d[1] || '00';
                                var dd = d[2] || '00';
                                var hh = t[0] || '00';
                                var mi = t[1] || '00';
                                return yyyy + '/' + mm + '/' + dd + ' ' + hh + ':' + mi;
                            }

                            function computeDiff(oldStr, newStr) {
                                if (!oldStr && !newStr) return { changed: false, html: '' };
                                if (!oldStr) return { changed: true, html: '<span class="jr-diff-added">' + escapeHtml(newStr) + '</span>' };
                                if (!newStr) return { changed: true, html: '' };
                                if (oldStr === newStr) return { changed: false, html: escapeHtml(newStr) };

                                if (oldStr.length > 400 || newStr.length > 400) {
                                    return { changed: true, html: '<span class="jr-diff-added">' + escapeHtml(newStr) + '</span>' };
                                }

                                var matrix = [];
                                for (var i = 0; i <= oldStr.length; i++) matrix[i] = [0];
                                for (var j = 0; j <= newStr.length; j++) matrix[0][j] = 0;

                                for (var i = 1; i <= oldStr.length; i++) {
                                    for (var j = 1; j <= newStr.length; j++) {
                                        if (oldStr[i - 1] === newStr[j - 1]) {
                                            matrix[i][j] = matrix[i - 1][j - 1] + 1;
                                        } else {
                                            matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
                                        }
                                    }
                                }

                                var actions = [];
                                var i = oldStr.length, j = newStr.length;
                                while (i > 0 && j > 0) {
                                    if (oldStr[i - 1] === newStr[j - 1]) {
                                        actions.push({ type: 'equal', val: oldStr[i - 1] });
                                        i--; j--;
                                    } else if (matrix[i - 1][j] >= matrix[i][j - 1]) {
                                        actions.push({ type: 'removed', val: oldStr[i - 1] });
                                        i--;
                                    } else {
                                        actions.push({ type: 'added', val: newStr[j - 1] });
                                        j--;
                                    }
                                }
                                while (j > 0) { actions.push({ type: 'added', val: newStr[j - 1] }); j--; }
                                while (i > 0) { actions.push({ type: 'removed', val: oldStr[i - 1] }); i--; }
                                
                                actions.reverse();
                                var html = '';
                                var currentType = null;
                                var currentStr = '';
                                
                                function flush() {
                                    if (!currentStr) return;
                                    if (currentType === 'added') html += '<span class="jr-diff-added">' + escapeHtml(currentStr) + '</span>';
                                    else if (currentType === 'equal') html += escapeHtml(currentStr);
                                    currentStr = '';
                                }

                                actions.forEach(function(a) {
                                    if (a.type === 'removed') return;
                                    if (a.type !== currentType) { flush(); currentType = a.type; }
                                    currentStr += a.val;
                                });
                                flush();

                                return { changed: true, html: html };
                            }

                            function renderHistory(listEl, snapshots) {
                                if (!listEl) return;
                                var items = Array.isArray(snapshots) ? snapshots.slice() : [];
                                if (!items.length) {
                                    listEl.innerHTML = '<div class="jr-history-empty">過去の記録はありません。</div>';
                                    return;
                                }

                                var html = items.map(function (snap, sIdx) {
                                    var snapDate = formatJrDateTime(snap.update_at || snap.created_at || '');
                                    var reflections = Array.isArray(snap.reflections) ? snap.reflections : [];
                                    if (!reflections.length) return '';
                                    var oldSnap = items[sIdx + 1];
                                    var oldReflections = (oldSnap && Array.isArray(oldSnap.reflections)) ? oldSnap.reflections : [];

                                    var cards = reflections.map(function (rec, rIdx) {
                                        var oldRec = oldReflections[rIdx] || {};

                                        var goodDiff = computeDiff(oldRec.evaluation_good || '', rec.evaluation_good || '');
                                        var goodReasonDiff = computeDiff(oldRec.attribution || '', rec.attribution || '');
                                        var badDiff = computeDiff(oldRec.evaluation_bad || '', rec.evaluation_bad || '');
                                        var badReasonDiff = computeDiff(oldRec.attribution_bad || '', rec.attribution_bad || '');

                                        var oldLessons = Array.isArray(oldRec.lessons) ? oldRec.lessons : [];
                                        var lessons = Array.isArray(rec.lessons) ? rec.lessons : [];
                                        
                                        var lessonsHtml = '';
                                        var lessonsChanged = false;
                                        if (lessons.length) {
                                            lessonsHtml = lessons.map(function (l, lIdx) {
                                                var oldL = oldLessons[lIdx] || {};
                                                var textDiff = computeDiff(oldL.lesson_learned || oldL.lesson || '', l.lesson_learned || l.lesson || '');
                                                var whyDiff = computeDiff(oldL.why_important || '', l.why_important || '');
                                                var oppDiff = computeDiff(oldL.opportunity || '', l.opportunity || '');
                                                
                                                var changed = textDiff.changed || whyDiff.changed || oppDiff.changed;
                                                if (changed) lessonsChanged = true;
                                                var cls = changed ? 'jr-history-lesson-item jr-history-changed' : 'jr-history-lesson-item jr-history-unchanged';
                                                
                                                return '<div class="' + cls + '">'
                                                    + '<div class="jr-history-lesson-text jr-trans-history">' + (textDiff.html || '-') + '</div>'
                                                    + (l.why_important ? '<div class="jr-history-lesson-why jr-trans-history">' + whyDiff.html + '</div>' : '')
                                                    + (l.opportunity ? '<div class="jr-history-lesson-opportunity jr-trans-history">' + oppDiff.html + '</div>' : '')
                                                    + '</div>';
                                            }).join('');
                                        } else {
                                            lessonsHtml = '<div class="jr-history-empty">教訓はありません。</div>';
                                        }

                                        var goodChanged = goodDiff.changed || goodReasonDiff.changed;
                                        var goodCls = goodChanged ? 'jr-history-section jr-history-changed' : 'jr-history-section jr-history-unchanged';
                                        
                                        var badChanged = badDiff.changed || badReasonDiff.changed;
                                        var badCls = badChanged ? 'jr-history-section jr-history-changed' : 'jr-history-section jr-history-unchanged';

                                        var lessonsCls = lessonsChanged ? 'jr-history-section jr-history-changed' : 'jr-history-section jr-history-unchanged';
                                        if (oldLessons.length > lessons.length) lessonsCls = 'jr-history-section jr-history-changed';

                                        var title = (getCurrentLang() === 'ja') ? ('内省 #' + (rIdx + 1)) : ('Reflection #' + (rIdx + 1));
                                        var lessonTitle = (getCurrentLang() === 'ja') ? '教訓' : 'Lesson';
                                        var goodTitle = (getCurrentLang() === 'ja') ? 'うまくいった点' : 'What went well?';
                                        var goodReasonTitle = (getCurrentLang() === 'ja') ? '理由' : 'Why do you think so?';
                                        var badTitle = (getCurrentLang() === 'ja') ? 'うまくいかなかった点' : 'What did not go well?';
                                        var badReasonTitle = (getCurrentLang() === 'ja') ? '理由' : 'Why do you think so?';

                                        return '<details class="jr-history-card" ' + ((sIdx === 0 && rIdx === 0) ? 'open' : '') + '>'
                                            + '<summary class="jr-history-summary">' + title + '</summary>'
                                            + '<div class="jr-history-body">'
                                            + '<div class="' + lessonsCls + '">'
                                            + '<div class="jr-history-section-title"><span class="jr-history-icon">💡</span>' + lessonTitle + '</div>'
                                            + '<div class="jr-history-lesson-list">' + lessonsHtml + '</div>'
                                            + '</div>'
                                            + '<div class="' + goodCls + '">'
                                            + '<div class="jr-history-section-title good"><span class="jr-history-icon">😊</span>' + goodTitle + '</div>'
                                            + '<div class="jr-history-section-content jr-trans-history">' + (goodDiff.html || '-') + '</div>'
                                            + '<div class="jr-history-section-title good"><span class="jr-history-icon">✅</span>' + goodReasonTitle + '</div>'
                                            + '<div class="jr-history-section-content jr-trans-history">' + (goodReasonDiff.html || '-') + '</div>'
                                            + '</div>'
                                            + '<div class="' + badCls + '">'
                                            + '<div class="jr-history-section-title bad"><span class="jr-history-icon">😔</span>' + badTitle + '</div>'
                                            + '<div class="jr-history-section-content jr-trans-history">' + (badDiff.html || '-') + '</div>'
                                            + '<div class="jr-history-section-title bad"><span class="jr-history-icon">🧭</span>' + badReasonTitle + '</div>'
                                            + '<div class="jr-history-section-content jr-trans-history">' + (badReasonDiff.html || '-') + '</div>'
                                            + '</div>'
                                            + '</div>'
                                            + '</details>';
                                    }).join('');

                                    return '<div class="jr-history-item">'
                                        + '<div class="jr-history-snapshot-title">' + (snapDate || '日時不明') + '</div>'
                                        + cards
                                        + '</div>';
                                }).join('');

                                listEl.innerHTML = html;
                            }

                            function loadJournalHistory() {
                                if (!historyList) return;
                                historyList.innerHTML = '<div class="jr-history-empty">読み込み中...</div>';
                                $.ajax({
                                    url: 'php/get_object_journal_reflections.php',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: { object_journal_id: objectJournalId },
                                    success: function (res) {
                                        if (!res || !res.success) {
                                            historyList.innerHTML = '<div class="jr-history-empty">読み込みに失敗しました。</div>';
                                            return;
                                        }
                                        var snapshots = [];
                                        if (Array.isArray(res.snapshots)) {
                                            snapshots = res.snapshots;
                                        } else if (Array.isArray(res.reflections)) {
                                            snapshots = [{ reflections: res.reflections }];
                                        }
                                        renderHistory(historyList, snapshots);
                                        if (getCurrentLang() === "en") { translateModalContent(historyList); }
                                    },
                                    error: function () {
                                        historyList.innerHTML = '<div class="jr-history-empty">読み込みに失敗しました。</div>';
                                    }
                                });
                            }

                            historyBtn.addEventListener('click', function () {
                                var isOpen = historyPanel.classList.contains('jr-history-open');
                                if (isOpen) {
                                    historyPanel.classList.remove('jr-history-open');
                                    historyBtn.textContent = (getCurrentLang() === 'ja') ? '過去の記録を見る' : 'View history';
                                    historyBtn.setAttribute('aria-expanded', 'false');
                                    tabContainer.appendChild(historyBtn);
                                    return;
                                }
                                historyPanel.classList.add('jr-history-open');
                                historyBtn.textContent = (getCurrentLang() === 'ja') ? '過去の記録を閉じる' : 'Hide history';
                                historyBtn.setAttribute('aria-expanded', 'true');
                                historyHeader.appendChild(historyBtn);
                                loadJournalHistory();
                            });

                            // Resize logic for divider
                            (function() {
                                var dragging = false;
                                var startX = 0;
                                var startLeftWidth = 0;
                                divider.addEventListener('mousedown', function(e) {
                                    dragging = true;
                                    startX = e.clientX;
                                    startLeftWidth = leftColumn.getBoundingClientRect().width;
                                    document.body.style.cursor = 'col-resize';
                                    document.body.style.userSelect = 'none';
                                });
                                document.addEventListener('mousemove', function(e) {
                                    if (!dragging) return;
                                    var dx = e.clientX - startX;
                                    var parentWidth = twoColumnLayout.getBoundingClientRect().width;
                                    var newLeft = Math.max(180, Math.min(parentWidth - 220, startLeftWidth + dx));
                                    var leftPercent = (newLeft / parentWidth) * 100;
                                    var rightPercent = 100 - leftPercent;
                                    leftColumn.style.flex = '0 0 ' + leftPercent + '%';
                                    leftColumn.style.maxWidth = leftPercent + '%';
                                    rightColumn.style.flex = '0 0 ' + rightPercent + '%';
                                    rightColumn.style.maxWidth = rightPercent + '%';
                                });
                                document.addEventListener('mouseup', function() {
                                    if (dragging) {
                                        dragging = false;
                                        document.body.style.cursor = '';
                                        document.body.style.userSelect = '';
                                    }
                                });
                            })();

                            // Tab management functions (for reflections only, no Activity Process tab)
                            var _tabIndex = 0;
                            var _tabs = [];
                            var _tabContents = [];

                            function createTab(label, isNew, isFirstTab) {
                                var tab = document.createElement('div');
                                tab.className = 'jr-tab';
                                tab.dataset.tabIndex = _tabIndex;
                                
                                var tabLabel = document.createElement('span');
                                tabLabel.className = 'jr-tab-label';
                                tabLabel.textContent = label;
                                tab.appendChild(tabLabel);
                                
                                // Add delete button (allow delete for all tabs except when only one left)
                                if (!isFirstTab) {
                                    var deleteBtn = document.createElement('button');
                                    deleteBtn.type = 'button';
                                    deleteBtn.className = 'jr-tab-delete';
                                    deleteBtn.textContent = '×';
                                    deleteBtn.title = (getCurrentLang() === 'ja') ? '削除' : 'Delete';
                                    deleteBtn.addEventListener('click', function(e) {
                                        e.stopPropagation(); // Prevent tab activation
                                        deleteTabByElement(tab);
                                    });
                                    tab.appendChild(deleteBtn);
                                }
                                
                                tab.addEventListener('click', function() {
                                    activateTab(parseInt(tab.dataset.tabIndex));
                                });
                                
                                // Insert before the "+" button
                                var addTabBtn = tabContainer.querySelector('.jr-tab-add');
                                if (addTabBtn) {
                                    tabContainer.insertBefore(tab, addTabBtn);
                                } else {
                                    tabContainer.appendChild(tab);
                                }
                                
                                _tabs.push(tab);
                                return tab;
                            }
                            
                            function deleteTabByElement(tabEl) {
                                try {
                                    // Don't allow deleting the last reflection tab
                                    if (_tabs.length <= 1) {
                                        alert((getCurrentLang() === 'ja') ? '最後のタブは削除できません' : 'Cannot delete the last tab');
                                        return;
                                    }
                                    if (!confirm((getCurrentLang() === 'ja') ? 'この内省を削除しますか？' : 'Delete this reflection?')) return;
                                    
                                    var arrIndex = _tabs.indexOf(tabEl);
                                    if (arrIndex <= 0) return; // Don't delete first tab (Activity Process)
                                    
                                    var tabContent = _tabContents[arrIndex];
                                    var wrap = tabContent ? tabContent.querySelector('.jr-info-wrap') : null;
                                    var reflectionId = wrap ? wrap.dataset.objectJournalReflectionId : null;
                                    
                                    function removeTabAndContent() {
                                        var removedTab = _tabs.splice(arrIndex, 1)[0];
                                        var removedContent = _tabContents.splice(arrIndex, 1)[0];
                                        
                                        if (removedTab) removedTab.remove();
                                        if (removedContent) {
                                            removedContent.style.transition = 'opacity 0.3s';
                                            removedContent.style.opacity = '0';
                                            setTimeout(function() { removedContent.remove(); }, 300);
                                        }
                                        
                                        _tabs.forEach(function(t, i) { t.dataset.tabIndex = i; });
                                        _tabContents.forEach(function(c, i) { c.dataset.tabIndex = i; });
                                        
                                        updateTabLabels();
                                        if (_tabs.length > 0) {
                                            var newActiveIdx = Math.min(arrIndex, _tabs.length - 1);
                                            activateTab(newActiveIdx);
                                        }
                                    }
                                    
                                    if (reflectionId) {
                                        $.ajax({
                                            url: 'php/delete_object_journal_reflection.php',
                                            type: 'POST',
                                            dataType: 'json',
                                            data: { object_journal_reflection_id: reflectionId },
                                            success: function(res) {
                                                if (res && res.success) {
                                                    removeTabAndContent();
                                                } else {
                                                    alert((getCurrentLang() === 'ja') ? '削除に失敗しました' : 'Failed to delete');
                                                }
                                            },
                                            error: function() {
                                                alert((getCurrentLang() === 'ja') ? '削除に失敗しました' : 'Failed to delete');
                                            }
                                        });
                                    } else {
                                        removeTabAndContent();
                                    }
                                } catch(e) { console.warn('deleteTabByElement error', e); }
                            }

                            function activateTab(index) {
                                _tabs.forEach(function(t, i) {
                                    if (i === index) {
                                        t.classList.add('jr-tab-active');
                                    } else {
                                        t.classList.remove('jr-tab-active');
                                    }
                                });
                                _tabContents.forEach(function(c, i) {
                                    if (i === index) {
                                        c.classList.add('jr-tab-content-active');
                                        setTimeout(function() {
                                            c.querySelectorAll('textarea').forEach(function(ta) {
                                                ta.style.height = 'auto';
                                                ta.style.height = ta.scrollHeight + 'px';
                                            });
                                        }, 10);
                                    } else {
                                        c.classList.remove('jr-tab-content-active');
                                    }
                                });
                                // Update tab labels
                                updateTabLabels();
                            }

                            function updateTabLabels() {
                                _tabs.forEach(function(tab, i) {
                                    var label;
                                    // All tabs are reflection tabs now (no Activity Process tab)
                                    // i=0 -> 内省 #1, i=1 -> 内省 #2, etc.
                                    label = (getCurrentLang() === 'ja') ? ('内省 #' + (i + 1)) : ('Reflection #' + (i + 1));
                                    // Update the label span, not the whole tab (to preserve delete button)
                                    var labelSpan = tab.querySelector('.jr-tab-label');
                                    if (labelSpan) {
                                        labelSpan.textContent = label;
                                    } else {
                                        tab.textContent = label;
                                    }
                                });
                            }

                            function createTabContent() {
                                var content = document.createElement('div');
                                content.className = 'jr-tab-content';
                                content.dataset.tabIndex = _tabIndex;
                                tabContentContainer.appendChild(content);
                                _tabContents.push(content);
                                return content;
                            }

                            // Add "+" button for new reflections
                            var addTabBtn = document.createElement('button');
                            addTabBtn.type = 'button';
                            addTabBtn.className = 'jr-tab-add';
                            addTabBtn.textContent = '+';
                            addTabBtn.title = (getCurrentLang() === 'ja') ? '内省を追加' : 'Add Reflection';
                            tabContainer.appendChild(addTabBtn);

                            // Add editable areas: split evaluation into success/failure, completion reason, and allow multiple lessons
                            var infoWrap = document.createElement('div');
                            infoWrap.className = 'jr-info-wrap';

                            // counter for clones (start at 1 because original is baseline)
                            var _jrInfoCloneIdx = 1;
                            function wireInfoWrapInteractions(wrap) {
                                try {
                                    // Wire lesson tabs within this wrap
                                    wireLessonTabs(wrap);
                                } catch (e) { console.warn('wireInfoWrapInteractions failed', e); }
                            }
                            
                            // Function to wire lesson tab functionality for a wrap
                            function wireLessonTabs(wrap) {
                                var lessonTabContainer = wrap.querySelector('.jr-lesson-tab-container');
                                var lessonTabContentContainer = wrap.querySelector('.jr-lesson-tab-content-container');
                                if (!lessonTabContainer || !lessonTabContentContainer) return;
                                
                                var addLessonBtn = lessonTabContainer.querySelector('.jr-lesson-tab-add');
                                
                                // Functions that query DOM each time (to handle dynamic tab additions)
                                function getLessonTabs() {
                                    return Array.from(lessonTabContainer.querySelectorAll('.jr-lesson-tab'));
                                }
                                function getLessonTabContents() {
                                    return Array.from(lessonTabContentContainer.querySelectorAll('.jr-lesson-tab-content'));
                                }
                                
                                function activateLessonTabLocal(index) {
                                    var tabs = getLessonTabs();
                                    var contents = getLessonTabContents();
                                    tabs.forEach(function(t, i) {
                                        if (i === index) {
                                            t.classList.add('jr-lesson-tab-active');
                                        } else {
                                            t.classList.remove('jr-lesson-tab-active');
                                        }
                                    });
                                    contents.forEach(function(c, i) {
                                        if (i === index) {
                                            c.classList.add('jr-lesson-tab-content-active');
                                            setTimeout(function() {
                                                c.querySelectorAll('textarea').forEach(function(ta) {
                                                    ta.style.height = 'auto';
                                                    ta.style.height = ta.scrollHeight + 'px';
                                                });
                                            }, 10);
                                        } else {
                                            c.classList.remove('jr-lesson-tab-content-active');
                                        }
                                    });
                                    updateLessonLabelsLocal();
                                }
                                
                                function updateLessonLabelsLocal() {
                                    var tabs = getLessonTabs();
                                    tabs.forEach(function(tab, i) {
                                        var label = (getCurrentLang() === 'ja') ? ('教訓 #' + (i + 1)) : ('Lesson #' + (i + 1));
                                        var labelSpan = tab.querySelector('.jr-lesson-tab-label');
                                        if (labelSpan) labelSpan.textContent = label;
                                    });
                                }
                                
                                function createLessonTabLocal(isFirst) {
                                    var currentTabs = getLessonTabs();
                                    var tab = document.createElement('div');
                                    tab.className = 'jr-lesson-tab';
                                    tab.dataset.lessonTabIndex = currentTabs.length;
                                    
                                    var tabLabel = document.createElement('span');
                                    tabLabel.className = 'jr-lesson-tab-label';
                                    tabLabel.textContent = (getCurrentLang() === 'ja') ? ('教訓 #' + (currentTabs.length + 1)) : ('Lesson #' + (currentTabs.length + 1));
                                    tab.appendChild(tabLabel);
                                    
                                    if (!isFirst) {
                                        var deleteBtn = document.createElement('button');
                                        deleteBtn.type = 'button';
                                        deleteBtn.className = 'jr-lesson-tab-delete';
                                        deleteBtn.textContent = '×';
                                        deleteBtn.addEventListener('click', function(e) {
                                            e.stopPropagation();
                                            deleteLessonTabLocal(tab);
                                        });
                                        tab.appendChild(deleteBtn);
                                    }
                                    
                                    tab.addEventListener('click', function() {
                                        var tabs = getLessonTabs();
                                        var idx = tabs.indexOf(tab);
                                        if (idx >= 0) activateLessonTabLocal(idx);
                                    });
                                    
                                    lessonTabContainer.insertBefore(tab, addLessonBtn);
                                    return tab;
                                }
                                
                                function createLessonContentLocal(focusVal, whenVal, dbId) {
                                    var currentContents = getLessonTabContents();
                                    var content = document.createElement('div');
                                    content.className = 'jr-lesson-tab-content';
                                    content.dataset.lessonTabIndex = currentContents.length;
                                    if (dbId) content.dataset.objectLeId = dbId;
                                    
                                    var labelTop = document.createElement('label');
                                    labelTop.textContent = (getCurrentLang() === 'ja') ? '今後の活動ではどのようなことを意識すればよいと思いますか？' : 'What should you pay attention to in future activities?';
                                    labelTop.className = 'jr-label';
                                    var taTop = document.createElement('textarea');
                                    taTop.rows = 2;
                                    taTop.placeholder = (getCurrentLang() === 'ja') ? '具体的な行動計画、改善点、新しいアプローチなどを記入してください。' : 'Describe specific action plans, improvements, or new approaches.';
                                    taTop.className = 'jr-textarea wr-lesson-focus';
                                    if (focusVal) taTop.value = focusVal;
                                    content.appendChild(labelTop);
                                    content.appendChild(taTop);
                                    
                                    var labelWhy = document.createElement('label');
                                    labelWhy.textContent = (getCurrentLang() === 'ja') ? 'なぜその教訓が大切だと考えますか？' : 'Why do you think this lesson is important?';
                                    labelWhy.className = 'jr-label';
                                    var taWhy = document.createElement('textarea');
                                    taWhy.rows = 2;
                                    taWhy.placeholder = (getCurrentLang() === 'ja') ? 'なぜこれを教訓として記述しようとしたのか，大切だと感じたのかを考えてみましょう' : 'Think about why you decided to document this as a lesson and why you felt it was important.';
                                    taWhy.className = 'jr-textarea wr-lesson-why';
                                    // if whyVal is needed, add to arguments of createLessonContentLocal. For now it's not passed, so leave empty.
                                    content.appendChild(labelWhy);
                                    content.appendChild(taWhy);
                                    
                                    var labelBottom = document.createElement('label');
                                    labelBottom.textContent = (getCurrentLang() === 'ja') ? 'その教訓は次にどのような時に活かせそうですか？' : 'When could this lesson be applied next?';
                                    labelBottom.className = 'jr-label';
                                    var taBottom = document.createElement('textarea');
                                    taBottom.rows = 1;
                                    taBottom.placeholder = (getCurrentLang() === 'ja') ? '類似の状況、将来のプロジェクト、日常生活での応用などを考えましょう。' : 'Think of similar situations, future projects, or daily life applications.';
                                    taBottom.className = 'jr-textarea jr-textarea-small wr-lesson-when';
                                    if (whenVal) taBottom.value = whenVal;
                                    content.appendChild(labelBottom);
                                    content.appendChild(taBottom);
                                    
                                    lessonTabContentContainer.appendChild(content);
                                    return content;
                                }
                                
                                function deleteLessonTabLocal(tabEl) {
                                    var lessonTabs = getLessonTabs();
                                    var lessonTabContents = getLessonTabContents();
                                    if (lessonTabs.length <= 1) {
                                        alert((getCurrentLang() === 'ja') ? '最後の教訓は削除できません' : 'Cannot delete the last lesson');
                                        return;
                                    }
                                    if (!confirm((getCurrentLang() === 'ja') ? 'この教訓を削除しますか？' : 'Delete this lesson?')) return;
                                    
                                    var arrIndex = lessonTabs.indexOf(tabEl);
                                    if (arrIndex < 0) return;
                                    
                                    var tabContent = lessonTabContents[arrIndex];
                                    var leId = tabContent ? tabContent.dataset.objectLeId : null;
                                    
                                    function removeLocal() {
                                        tabEl.remove();
                                        if (tabContent) tabContent.remove();
                                        
                                        // Re-index remaining tabs and contents
                                        var remainingTabs = getLessonTabs();
                                        var remainingContents = getLessonTabContents();
                                        remainingTabs.forEach(function(t, i) { t.dataset.lessonTabIndex = i; });
                                        remainingContents.forEach(function(c, i) { c.dataset.lessonTabIndex = i; });
                                        
                                        updateLessonLabelsLocal();
                                        if (remainingTabs.length > 0) {
                                            activateLessonTabLocal(Math.min(arrIndex, remainingTabs.length - 1));
                                        }
                                    }
                                    
                                    if (leId) {
                                        $.ajax({
                                            url: 'php/delete_lesson.php', type: 'POST', dataType: 'json',
                                            data: { object_le_id: leId },
                                            success: function(res) { if (res && res.success) removeLocal(); else alert((getCurrentLang() === 'ja') ? '削除に失敗しました' : 'Failed to delete'); },
                                            error: function() { alert((getCurrentLang() === 'ja') ? '削除に失敗しました' : 'Failed to delete'); }
                                        });
                                    } else {
                                        removeLocal();
                                    }
                                }
                                
                                // Wire existing tabs - use dynamic index lookup
                                var existingTabs = getLessonTabs();
                                existingTabs.forEach(function(tab) {
                                    if (tab.__bound) return;
                                    tab.__bound = true;
                                    
                                    tab.addEventListener('click', function(e) {
                                        // Dynamically find the index at click time
                                        var tabs = getLessonTabs();
                                        var currentIndex = tabs.indexOf(tab);
                                        if (currentIndex >= 0) {
                                            activateLessonTabLocal(currentIndex);
                                        }
                                    });
                                    
                                    var deleteBtn = tab.querySelector('.jr-lesson-tab-delete');
                                    if (deleteBtn && !deleteBtn.__bound) {
                                        deleteBtn.__bound = true;
                                        deleteBtn.addEventListener('click', function(e) {
                                            e.stopPropagation();
                                            deleteLessonTabLocal(tab);
                                        });
                                    }
                                });
                                
                                // Wire add button
                                if (addLessonBtn && !addLessonBtn.__bound) {
                                    addLessonBtn.__bound = true;
                                    addLessonBtn.addEventListener('click', function() {
                                        createLessonTabLocal(false);
                                        createLessonContentLocal('', '');
                                        updateLessonLabelsLocal();
                                        var tabs = getLessonTabs();
                                        activateLessonTabLocal(tabs.length - 1);
                                    });
                                }
                                
                                // Activate first tab if none active
                                var currentTabs = getLessonTabs();
                                if (currentTabs.length > 0 && !lessonTabContainer.querySelector('.jr-lesson-tab-active')) {
                                    activateLessonTabLocal(0);
                                }
                            }

                            // capture the weeklyGoals index for use when persisting new reflections
                            var _weeklyGoalIdx_for_clones = idx;
                            
                            // Function to add a new reflection tab
                            function addNewReflectionTab(existingData) {
                                try {
                                    // clone the infoWrap visually
                                    if (!infoWrap) return;
                                    var clone = infoWrap.cloneNode(true);
                                    // rename any ids inside clone to avoid duplicate ids (append index)
                                    var cloneIdx = _jrInfoCloneIdx++;
                                    var elemsWithId = clone.querySelectorAll('[id]');
                                    elemsWithId.forEach(function (el) {
                                        var old = el.id;
                                        el.id = old + '_' + cloneIdx;
                                    });
                                    // clear any persisted ids on the clone so it becomes a fresh entry
                                    if (!existingData) {
                                        try {
                                            var dataKeys = ['objectLeId','objectJournalReflectionId','objectJournalReflectionId'];
                                            dataKeys.forEach(function(k){
                                                var els = clone.querySelectorAll('[data-'+k.replace(/([A-Z])/g,'-$1').toLowerCase()+']');
                                                els.forEach(function(el){ el.removeAttribute('data-'+k.replace(/([A-Z])/g,'-$1').toLowerCase()); });
                                            });
                                        } catch(e){}
                                        // clear values inside clone so cloned fields aren't identical
                                        try {
                                            var inputs = clone.querySelectorAll('textarea, input');
                                            inputs.forEach(function(inp){ if (inp.tagName.toLowerCase() === 'textarea' || inp.type === 'text' || inp.type === 'search') inp.value = ''; if (inp.type === 'checkbox' || inp.type === 'radio') inp.checked = false; });
                                        } catch(e){}
                                    }
                                    // ensure additional container id for cloned wrap exists uniquely
                                    var addCont = clone.querySelector('#wr_additionalLessonsContainer');
                                    if (addCont) addCont.id = 'wr_additionalLessonsContainer_' + cloneIdx;

                                    // Create new tab
                                    var tabNum = _tabs.length + 1;
                                    var tabLabel = (getCurrentLang() === 'ja') ? ('内省 #' + tabNum) : ('Reflection #' + tabNum);
                                    var tab = createTab(tabLabel, true, false);

                                    // Create tab content and add clone to it
                                    var content = createTabContent();
                                    clone.classList.add('jr-animate-in');
                                    content.appendChild(clone);
                                    
                                    // Remove animation class after animation completes
                                    setTimeout(function() {
                                        try { clone.classList.remove('jr-animate-in'); } catch(e){}
                                    }, 500);
                                    
                                    // wire interactions in the clone
                                    wireInfoWrapInteractions(clone);
                                    
                                    // Update all tab labels and activate new tab
                                    updateTabLabels();
                                    activateTab(_tabs.length - 1);
                                    
                                    _tabIndex++;

                                    // ensure cloned wrapper does not carry an object_journal_reflection id
                                    if (!existingData) {
                                        try { clone.dataset.objectJournalReflectionId = ''; } catch(e){}
                                        
                                        // Create a new reflection row on the server immediately
                                        var headerEl = clone.querySelector('.jr-info-header');
                                        try {
                                            try { if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja' ? '内省' : 'Reflection') + ' — 作成中...'; } catch(e){}
                                            var createPayload = {
                                                object_journal_id: objectJournalId,
                                                force_insert: 1,
                                                reflection_text: '',
                                                lessons: JSON.stringify([]),
                                                debug: 1
                                            };
                                            $.ajax({
                                                url: './php/insert_object_journal_reflection.php',
                                                type: 'POST',
                                                dataType: 'json',
                                                data: createPayload,
                                                success: function(resp) {
                                                    try {
                                                        if (resp && resp.success && resp.object_journal_reflection_id) {
                                                            var newId = resp.object_journal_reflection_id;
                                                            try { clone.dataset.objectJournalReflectionId = newId; } catch(e){}
                                                            try {
                                                                var stored = JSON.parse(localStorage.getItem(getStorageKey('weeklyGoals')) || '[]');
                                                                if (!(stored && stored.length > _weeklyGoalIdx_for_clones && stored[_weeklyGoalIdx_for_clones])) stored[_weeklyGoalIdx_for_clones] = stored[_weeklyGoalIdx_for_clones] || {};
                                                                if (!Array.isArray(stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids)) stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids = [];
                                                                stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids.unshift(newId);
                                                                localStorage.setItem(getStorageKey('weeklyGoals'), JSON.stringify(stored));
                                                            } catch(e) { console.warn('failed to persist new reflection id on clone', e); }
                                                            try { if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja' ? '内省' : 'Reflection'); } catch(e){}
                                                        } else {
                                                            console.warn('create reflection on add failed', resp);
                                                            try { if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja' ? '内省' : 'Reflection') + ' — 作成失敗'; } catch(e){}
                                                        }
                                                    } catch(e) { console.warn('handle create resp failed', e); }
                                                },
                                                error: function(xhr, st, err) { console.warn('create reflection ajax failed', st, err); try { if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja' ? '内省' : 'Reflection') + ' — 作成失敗'; } catch(e){} }
                                            });
                                        } catch(e) { console.warn('create reflection on clone failed', e); }
                                    }
                                    
                                    return clone;
                                } catch (e) { console.warn('addNewReflectionTab failed', e); return null; }
                            }
                            
                            // Wire the "+" tab button
                            addTabBtn.addEventListener('click', function () {
                                addNewReflectionTab(null);
                            });

                            // Info card header
                            var infoHeaderWrap = document.createElement('div');
                     
                            var infoHeader = document.createElement('div');
                            infoHeader.className = 'jr-info-header';
                            infoHeader.style.fontWeight = '700';
                            infoHeaderWrap.appendChild(infoHeader);

                            // Success / Failure side-by-side with attribution inside each card
                            var evalWrap = document.createElement('div');
                            evalWrap.className = 'jr-eval-wrap';

                            // SUCCESS card (includes good attribution inside)
                            var successDiv = document.createElement('div');
                            successDiv.className = 'jr-success-div';
                            var successLabel = document.createElement('label');
                            successLabel.textContent = (getCurrentLang() === 'ja') ? '😊 うまくいった点はありますか？' : '😊 What went well?';
                            successLabel.className = 'jr-label';
                            var successTa = document.createElement('textarea');
                            successTa.id = 'wr_successPoints';
                            successTa.rows = 2;
                            successTa.placeholder = (getCurrentLang() === 'ja') ? '成功した行動、良い結果、達成できたことなどを具体的に記入してください。' : 'Describe specific actions, good results, or achievements.';
                            successTa.className = 'jr-textarea wr-successPoints';
                            successDiv.appendChild(successLabel);
                            successDiv.appendChild(successTa);
                            // Good attribution nested inside success card
                            var agLabel = document.createElement('label');
                            agLabel.textContent = (getCurrentLang() === 'ja') ? 'なぜそうなったと思いますか？' : 'Why do you think so?';
                            agLabel.className = 'jr-label jr-label-attr-good';
                            var agTa = document.createElement('textarea');
                            agTa.id = 'wr_attribution_good';
                            agTa.rows = 1;
                            agTa.placeholder = (getCurrentLang() === 'ja') ? '要因、努力、環境、協力者など、成功の理由を深く掘り下げてみましょう。' : 'Dig deeper into factors like effort, environment, and collaborators.';
                            agTa.className = 'jr-textarea wr-attribution-good';
                            successDiv.appendChild(agLabel);
                            successDiv.appendChild(agTa);

                            // FAILURE card (includes bad attribution inside)
                            var failureDiv = document.createElement('div');
                            failureDiv.className = 'jr-failure-div';
                            var failureLabel = document.createElement('label');
                            failureLabel.textContent = (getCurrentLang() === 'ja') ? '😔 うまくいかなかった点はありますか？' : '😔 What did not go well?';
                            failureLabel.className = 'jr-label';
                            var failureTa = document.createElement('textarea');
                            failureTa.id = 'wr_failurePoints';
                            failureTa.rows = 2;
                            failureTa.placeholder = (getCurrentLang() === 'ja') ? '課題、失敗、期待通りにいかなかったことなどを具体的に記入してください。' : 'Describe challenges, failures, or things that did not go as expected.';
                            failureTa.className = 'jr-textarea wr-failurePoints';
                            failureDiv.appendChild(failureLabel);
                            failureDiv.appendChild(failureTa);
                            // Bad attribution nested inside failure card
                            var abLabel = document.createElement('label');
                            abLabel.textContent = (getCurrentLang() === 'ja') ? 'なぜそうなったと思いますか？' : 'Why do you think so?';
                            abLabel.className = 'jr-label jr-label-attr-bad';
                            var abTa = document.createElement('textarea');
                            abTa.id = 'wr_attribution_bad';
                            abTa.rows = 1;
                            abTa.placeholder = (getCurrentLang() === 'ja') ? '原因、不足していたもの、予期せぬ障害など、失敗の理由を分析しましょう。' : 'Analyze causes, what was lacking, or unexpected obstacles.';
                            abTa.className = 'jr-textarea wr-attribution-bad';
                            failureDiv.appendChild(abLabel);
                            failureDiv.appendChild(abTa);

                            evalWrap.appendChild(successDiv);
                            evalWrap.appendChild(failureDiv);
                            // insert header wrapper then evaluation block
                            infoWrap.appendChild(infoHeaderWrap);
                            infoWrap.appendChild(evalWrap);

                            // Lesson section with tabs
                            var lessonDiv = document.createElement('div');
                            lessonDiv.className = 'jr-lesson-div';
                            
                            // Lesson tab container
                            var lessonTabContainer = document.createElement('div');
                            lessonTabContainer.className = 'jr-lesson-tab-container';
                            lessonDiv.appendChild(lessonTabContainer);
                            
                            // Lesson tab content container
                            var lessonTabContentContainer = document.createElement('div');
                            lessonTabContentContainer.className = 'jr-lesson-tab-content-container';
                            lessonDiv.appendChild(lessonTabContentContainer);
                            
                            // Add "+" button for new lessons
                            var addLessonTabBtn = document.createElement('button');
                            addLessonTabBtn.type = 'button';
                            addLessonTabBtn.className = 'jr-lesson-tab-add';
                            addLessonTabBtn.textContent = '+';
                            addLessonTabBtn.title = (getCurrentLang() === 'ja') ? '教訓を追加' : 'Add Lesson';
                            lessonTabContainer.appendChild(addLessonTabBtn);
                            
                            // Lesson tab management (scoped to this infoWrap)
                            var _lessonTabs = [];
                            var _lessonTabContents = [];
                            var _lessonTabIndex = 0;
                            
                            function createLessonTab(label, isFirst) {
                                var tab = document.createElement('div');
                                tab.className = 'jr-lesson-tab';
                                tab.dataset.lessonTabIndex = _lessonTabs.length;
                                
                                var tabLabel = document.createElement('span');
                                tabLabel.className = 'jr-lesson-tab-label';
                                tabLabel.textContent = label;
                                tab.appendChild(tabLabel);
                                
                                // Add delete button (not for first lesson)
                                if (!isFirst) {
                                    var deleteBtn = document.createElement('button');
                                    deleteBtn.type = 'button';
                                    deleteBtn.className = 'jr-lesson-tab-delete';
                                    deleteBtn.textContent = '×';
                                    deleteBtn.title = (getCurrentLang() === 'ja') ? '削除' : 'Delete';
                                    deleteBtn.addEventListener('click', function(e) {
                                        e.stopPropagation();
                                        deleteLessonTab(tab);
                                    });
                                    tab.appendChild(deleteBtn);
                                }
                                
                                tab.addEventListener('click', function() {
                                    activateLessonTab(parseInt(tab.dataset.lessonTabIndex));
                                });
                                
                                // Insert before the "+" button
                                lessonTabContainer.insertBefore(tab, addLessonTabBtn);
                                _lessonTabs.push(tab);
                                return tab;
                            }
                            
                            function activateLessonTab(index) {
                                _lessonTabs.forEach(function(t, i) {
                                    if (i === index) {
                                        t.classList.add('jr-lesson-tab-active');
                                    } else {
                                        t.classList.remove('jr-lesson-tab-active');
                                    }
                                });
                                _lessonTabContents.forEach(function(c, i) {
                                    if (i === index) {
                                        c.classList.add('jr-lesson-tab-content-active');
                                    } else {
                                        c.classList.remove('jr-lesson-tab-content-active');
                                    }
                                });
                                updateLessonTabLabels();
                            }
                            
                            function updateLessonTabLabels() {
                                _lessonTabs.forEach(function(tab, i) {
                                    var isActive = tab.classList.contains('jr-lesson-tab-active');
                                    var label = (getCurrentLang() === 'ja') ? ('教訓 #' + (i + 1)) : ('Lesson #' + (i + 1));
                                    var labelSpan = tab.querySelector('.jr-lesson-tab-label');
                                    if (labelSpan) {
                                        labelSpan.textContent = label;
                                    }
                                });
                            }
                            
                            function createLessonTabContent(focusVal, whyVal, whenVal, dbId) {
                                var content = document.createElement('div');
                                content.className = 'jr-lesson-tab-content';
                                content.dataset.lessonTabIndex = _lessonTabContents.length;
                                if (dbId) content.dataset.objectLeId = dbId;
                                
                                // Focus question
                                var labelTop = document.createElement('label');
                                labelTop.textContent = (getCurrentLang() === 'ja') ? '今後の活動でどのようなことを意識したいですか？' : 'What should you pay attention to in future activities?';
                                labelTop.className = 'jr-label';
                                var taTop = document.createElement('textarea');
                                taTop.rows = 2;
                                taTop.placeholder = (getCurrentLang() === 'ja') ? '具体的な行動計画、改善点、新しいアプローチなどを記入してください。' : 'Describe specific action plans, improvements, or new approaches.';
                                taTop.className = 'jr-textarea wr-lesson-focus';
                                if (focusVal) taTop.value = focusVal;
                                content.appendChild(labelTop);
                                content.appendChild(taTop);
                                
                                // Why question
                                var labelWhy = document.createElement('label');
                                labelWhy.textContent = (getCurrentLang() === 'ja') ? 'なぜその教訓が大切だと考えますか？' : 'Why do you think this lesson is important?';
                                labelWhy.className = 'jr-label';
                                var taWhy = document.createElement('textarea');
                                taWhy.rows = 2;
                                taWhy.placeholder = (getCurrentLang() === 'ja') ? 'なぜこれを教訓として記述しようとしたのか，大切だと感じたのかを考えてみましょう' : 'Think about why you decided to document this as a lesson and why you felt it was important.';
                                taWhy.className = 'jr-textarea wr-lesson-why';
                                if (whyVal) taWhy.value = whyVal;
                                content.appendChild(labelWhy);
                                content.appendChild(taWhy);
                                
                                // When question
                                var labelBottom = document.createElement('label');
                                labelBottom.textContent = (getCurrentLang() === 'ja') ? 'その教訓は次にどのような時に活かせそうですか？' : 'When could this lesson be applied next?';
                                labelBottom.className = 'jr-label';
                                var taBottom = document.createElement('textarea');
                                taBottom.rows = 1;
                                taBottom.placeholder = (getCurrentLang() === 'ja') ? '類似の状況、将来のプロジェクト、日常生活での応用などを考えましょう。' : 'Think of similar situations, future projects, or daily life applications.';
                                taBottom.className = 'jr-textarea jr-textarea-small wr-lesson-when';
                                if (whenVal) taBottom.value = whenVal;
                                content.appendChild(labelBottom);
                                content.appendChild(taBottom);
                                
                                lessonTabContentContainer.appendChild(content);
                                _lessonTabContents.push(content);
                                return content;
                            }
                            
                            function addNewLessonTab(focusVal, whyVal, whenVal, dbId) {
                                var tabNum = _lessonTabs.length + 1;
                                var label = (getCurrentLang() === 'ja') ? ('教訓 #' + tabNum) : ('Lesson #' + tabNum);
                                createLessonTab(label, false);
                                createLessonTabContent(focusVal || '', whyVal || '', whenVal || '', dbId);
                                _lessonTabIndex++;
                                updateLessonTabLabels();
                                activateLessonTab(_lessonTabs.length - 1);
                            }
                            
                            function deleteLessonTab(tabEl) {
                                try {
                                    if (_lessonTabs.length <= 1) {
                                        alert((getCurrentLang() === 'ja') ? '最後の教訓は削除できません' : 'Cannot delete the last lesson');
                                        return;
                                    }
                                    if (!confirm((getCurrentLang() === 'ja') ? 'この教訓を削除しますか？' : 'Delete this lesson?')) return;
                                    
                                    var arrIndex = _lessonTabs.indexOf(tabEl);
                                    if (arrIndex < 0) return;
                                    
                                    var tabContent = _lessonTabContents[arrIndex];
                                    var leId = tabContent ? tabContent.dataset.objectLeId : null;
                                    
                                    function removeTabAndContent() {
                                        var removedTab = _lessonTabs.splice(arrIndex, 1)[0];
                                        var removedContent = _lessonTabContents.splice(arrIndex, 1)[0];
                                        
                                        if (removedTab) removedTab.remove();
                                        if (removedContent) {
                                            removedContent.style.transition = 'opacity 0.2s';
                                            removedContent.style.opacity = '0';
                                            setTimeout(function() { removedContent.remove(); }, 200);
                                        }
                                        
                                        _lessonTabs.forEach(function(t, i) { t.dataset.lessonTabIndex = i; });
                                        _lessonTabContents.forEach(function(c, i) { c.dataset.lessonTabIndex = i; });
                                        
                                        updateLessonTabLabels();
                                        if (_lessonTabs.length > 0) {
                                            var newActiveIdx = Math.min(arrIndex, _lessonTabs.length - 1);
                                            activateLessonTab(newActiveIdx);
                                        }
                                    }
                                    
                                    if (leId) {
                                        $.ajax({
                                            url: 'php/delete_lesson.php',
                                            type: 'POST',
                                            dataType: 'json',
                                            data: { object_le_id: leId },
                                            success: function(res) {
                                                if (res && res.success) {
                                                    removeTabAndContent();
                                                } else {
                                                    alert((getCurrentLang() === 'ja') ? '削除に失敗しました' : 'Failed to delete');
                                                }
                                            },
                                            error: function() {
                                                alert((getCurrentLang() === 'ja') ? '削除に失敗しました' : 'Failed to delete');
                                            }
                                        });
                                    } else {
                                        removeTabAndContent();
                                    }
                                } catch(e) { console.warn('deleteLessonTab error', e); }
                            }
                            
                            // Wire the "+" lesson tab button
                            addLessonTabBtn.addEventListener('click', function() {
                                addNewLessonTab('', '', '');
                            });
                            
                            // Create the first lesson tab
                            createLessonTab((getCurrentLang() === 'ja') ? '教訓 #1' : 'Lesson #1', true);
                            createLessonTabContent('', '');
                            _lessonTabIndex++;
                            activateLessonTab(0);

                            infoWrap.appendChild(lessonDiv);
                            
                            // Activity Process is now in left column (always visible)
                            // No need to create a separate tab for it
                            // itemWrap will be added to activityContent in the results.forEach loop

                            // Always fetch canonical reflection row independently so debug output appears
                            try {
                                $.ajax({
                                    url: './php/get_object_journal_reflections.php',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: { object_journal_id: objectJournalId, debug: 1 },
                                    success: function (rres) {
                                        if (_reflectionsRendered) { return; }
                                        try {
                                            var latest = null;
                                            if (rres && rres.latest_snapshot && Array.isArray(rres.latest_snapshot.reflections)) {
                                                latest = rres.latest_snapshot.reflections;
                                            } else if (rres && Array.isArray(rres.reflections)) {
                                                latest = rres.reflections;
                                            }
                                            // if reflections array present, create one tab per reflection
                                            if (rres && rres.success && Array.isArray(latest) && latest.length) {
                                                var refls = latest;
                                                // Create a new tab for each reflection
                                                for (var ri = 0; ri < refls.length; ri++) {
                                                    var rf = refls[ri];
                                                    try {
                                                        var clone = infoWrap.cloneNode(true);
                                                        var cidx = _jrInfoCloneIdx++;
                                                        var elemsWithId = clone.querySelectorAll('[id]');
                                                        elemsWithId.forEach(function(el){ var old = el.id; el.id = old + '_' + cidx; });
                                                        var addCont = clone.querySelector('#wr_additionalLessonsContainer'); if (addCont) addCont.id = 'wr_additionalLessonsContainer_' + cidx;
                                                        
                                                        // Create new tab for this reflection (i=0 -> tab #1)
                                                        var tabNum = _tabs.length + 1;
                                                        var tabLabel = (getCurrentLang() === 'ja') ? ('内省 #' + tabNum) : ('Reflection #' + tabNum);
                                                        createTab(tabLabel, false, ri === 0); // first reflection tab cannot be deleted
                                                        var content = createTabContent();
                                                        content.appendChild(clone);
                                                        _tabIndex++;
                                                        
                                                        wireInfoWrapInteractions(clone);
                                                        populateWrapWithReflection(clone, rf);
                                                    } catch(e) { console.warn('clone populate failed', e); }
                                                }
                                                // Update tab labels and activate the first reflection tab
                                                updateTabLabels();
                                                activateTab(0);
                                                _reflectionsRendered = true;
                                            } else {
                                                // No reflections found - create first reflection tab
                                                try {
                                                    var clone = infoWrap.cloneNode(true);
                                                    var cidx = _jrInfoCloneIdx++;
                                                    var elemsWithId = clone.querySelectorAll('[id]');
                                                    elemsWithId.forEach(function(el){ var old = el.id; el.id = old + '_' + cidx; });
                                                    
                                                    var tabLabel = (getCurrentLang() === 'ja') ? '内省 #1' : 'Reflection #1';
                                                    createTab(tabLabel, false, true); // first reflection tab cannot be deleted
                                                    var content = createTabContent();
                                                    content.appendChild(clone);
                                                    _tabIndex++;
                                                    
                                                    wireInfoWrapInteractions(clone);
                                                    updateTabLabels();
                                                    activateTab(0); // Activate first reflection tab
                                                } catch(e) { console.warn('create first reflection tab failed', e); }
                                                _reflectionsRendered = true;
                                            }
                                        } catch (e) { console.warn('apply canonical reflection failed', e); }
                                    },
                                    error: function (xhr, st, err) { console.warn('journal_report: reflection fetch (always) error', st, err, xhr && xhr.responseText); }
                                });
                            } catch (e) { console.warn('journal_report: always reflection fetch failed', e); }

                            // helper to create additional lesson field
                            // Create an additional lesson pair: focus + when
                            function makeAdditionalLessonField(textFocus, textWhen, dbId) {
                                var wrap = document.createElement('div');
                                wrap.className = 'wr-additional-lesson-wrap jr-additional-item';
                                wrap.style.marginTop = '8px';
                                if (dbId) wrap.dataset.objectLeId = dbId;

                                // Focus label + textarea
                                var labelF = document.createElement('label');
                                labelF.textContent = (getCurrentLang() === 'ja') ? '追加の教訓（何に注目）' : 'Additional lesson (focus)';
                                labelF.style.display = 'block';
                                var taF = document.createElement('textarea');
                                taF.className = 'wr-additional-lesson-focus jr-textarea';
                                taF.rows = 3;
                                if (textFocus) taF.value = textFocus;

                                // When label + textarea
                                var labelW = document.createElement('label');
                                labelW.textContent = (getCurrentLang() === 'ja') ? '追加の教訓（いつ活かすか）' : 'Additional lesson (when)';
                                labelW.style.display = 'block';
                                var taW = document.createElement('textarea');
                                taW.className = 'wr-additional-lesson-when jr-textarea jr-textarea-small';
                                taW.rows = 2;
                                if (textWhen) taW.value = textWhen;

                                var removeBtn = document.createElement('button');
                                removeBtn.type = 'button';
                                removeBtn.textContent = (getCurrentLang() === 'ja') ? '削除' : 'Remove';
                                removeBtn.className = 'jr-remove-btn';
                                removeBtn.addEventListener('click', function () {
                                    try {
                                        if (!confirm((getCurrentLang() === 'ja') ? '本当に削除しますか？' : 'Remove this lesson?')) return;
                                        var leId = wrap.dataset.objectLeId;
                                        if (leId) {
                                            // call server delete endpoint if persisted
                                            $.ajax({ url: 'php/delete_lesson.php', type: 'POST', dataType: 'json', data: { object_le_id: leId }, success: function (res) { if (res && res.success) wrap.remove(); else { alert((getCurrentLang() === 'ja') ? '教訓の削除に失敗しました' : 'Failed to delete lesson'); } }, error: function () { alert((getCurrentLang() === 'ja') ? '教訓の削除に失敗しました' : 'Failed to delete lesson'); } });
                                        } else {
                                            wrap.remove();
                                        }
                                    } catch (e) { console.warn('remove additional lesson error', e); }
                                });

                                wrap.appendChild(labelF);
                                wrap.appendChild(taF);
                                wrap.appendChild(labelW);
                                wrap.appendChild(taW);
                                wrap.appendChild(removeBtn);
                                return wrap;
                            }

                            // Populate a jr-info-wrap with a reflection object
                            function populateWrapWithReflection(wrap, rf) {
                                try {
                                    if (!wrap || !rf) return;
                                    // attach reflection id
                                    try { if (rf.object_journal_reflection_id) wrap.dataset.objectJournalReflectionId = rf.object_journal_reflection_id; } catch(e){}
                                    // set evaluation and attribution
                                    var sp = wrap.querySelector('.wr-successPoints'); if (sp) sp.value = rf.evaluation_good || '';
                                    var fb = wrap.querySelector('.wr-failurePoints'); if (fb) fb.value = rf.evaluation_bad || '';
                                    var ag = wrap.querySelector('.wr-attribution-good'); if (ag) ag.value = (typeof rf.attribution !== 'undefined' && rf.attribution !== null && String(rf.attribution).trim() !== '') ? rf.attribution : (rf.attribution_good || '');
                                    var ab = wrap.querySelector('.wr-attribution-bad'); if (ab) ab.value = rf.attribution_bad || '';
                                    var cr = wrap.querySelector('.wr-completionReason'); if (cr) cr.value = rf.attribution || '';
                                    
                                    // lessons: rf.lessons expected array of {lesson_learned, opportunity, object_journal_lesson-learned_id}
                                    // Populate lesson tabs instead of the old container system
                                    var lessonTabContentContainer = wrap.querySelector('.jr-lesson-tab-content-container');
                                    var lessonTabContainer = wrap.querySelector('.jr-lesson-tab-container');
                                    
                                    if (lessonTabContentContainer && lessonTabContainer && Array.isArray(rf.lessons) && rf.lessons.length) {
                                        var lf = rf.lessons;
                                        // First lesson goes into the first tab content
                                        var firstTabContent = lessonTabContentContainer.querySelector('.jr-lesson-tab-content');
                                        if (firstTabContent && lf[0]) {
                                            var focusEl = firstTabContent.querySelector('.wr-lesson-focus');
                                            var whyEl = firstTabContent.querySelector('.wr-lesson-why');
                                            var whenEl = firstTabContent.querySelector('.wr-lesson-when');
                                            if (focusEl) focusEl.value = lf[0].lesson_learned || '';
                                            if (whyEl) whyEl.value = lf[0].why_important || '';
                                            if (whenEl) whenEl.value = lf[0].opportunity || '';
                                            if (lf[0]['object_journal_lesson-learned_id']) firstTabContent.dataset.objectLeId = lf[0]['object_journal_lesson-learned_id'];
                                        }
                                        
                                        // Additional lessons: need to create new tabs
                                        // Note: We need access to the addNewLessonTab function, which is scoped.
                                        // For cloned wraps, we'll create tabs directly here.
                                        for (var lli = 1; lli < lf.length; lli++) {
                                            try {
                                                var l = lf[lli];
                                                // Create tab
                                                var addBtn = lessonTabContainer.querySelector('.jr-lesson-tab-add');
                                                var tab = document.createElement('div');
                                                tab.className = 'jr-lesson-tab';
                                                tab.dataset.lessonTabIndex = lessonTabContainer.querySelectorAll('.jr-lesson-tab').length;
                                                
                                                var tabLabel = document.createElement('span');
                                                tabLabel.className = 'jr-lesson-tab-label';
                                                tabLabel.textContent = (getCurrentLang() === 'ja') ? ('教訓 #' + (lli + 1)) : ('Lesson #' + (lli + 1));
                                                tab.appendChild(tabLabel);
                                                
                                                var deleteBtn = document.createElement('button');
                                                deleteBtn.type = 'button';
                                                deleteBtn.className = 'jr-lesson-tab-delete';
                                                deleteBtn.textContent = '×';
                                                tab.appendChild(deleteBtn);
                                                
                                                lessonTabContainer.insertBefore(tab, addBtn);
                                                
                                                // Create tab content
                                                var content = document.createElement('div');
                                                content.className = 'jr-lesson-tab-content';
                                                content.dataset.lessonTabIndex = lli;
                                                if (l['object_journal_lesson-learned_id']) content.dataset.objectLeId = l['object_journal_lesson-learned_id'];
                                                
                                                var labelTop = document.createElement('label');
                                                labelTop.textContent = (getCurrentLang() === 'ja') ? '今後の活動ではどのようなことを意識すればよいと思いますか？' : 'What should you pay attention to in future activities?';
                                                labelTop.className = 'jr-label';
                                                var taTop = document.createElement('textarea');
                                                taTop.rows = 2;
                                                taTop.className = 'jr-textarea wr-lesson-focus';
                                                taTop.value = l.lesson_learned || '';
                                                content.appendChild(labelTop);
                                                content.appendChild(taTop);
                                                
                                                var labelWhy = document.createElement('label');
                                                labelWhy.textContent = (getCurrentLang() === 'ja') ? 'なぜその教訓が大切だと考えますか？' : 'Why do you think this lesson is important?';
                                                labelWhy.className = 'jr-label';
                                                var taWhy = document.createElement('textarea');
                                                taWhy.rows = 2;
                                                taWhy.className = 'jr-textarea wr-lesson-why';
                                                taWhy.value = l.why_important || '';
                                                content.appendChild(labelWhy);
                                                content.appendChild(taWhy);
                                                
                                                var labelBottom = document.createElement('label');
                                                labelBottom.textContent = (getCurrentLang() === 'ja') ? 'その教訓は次にどのような時に活かせそうですか？' : 'When could this lesson be applied next?';
                                                labelBottom.className = 'jr-label';
                                                var taBottom = document.createElement('textarea');
                                                taBottom.rows = 1;
                                                taBottom.className = 'jr-textarea jr-textarea-small wr-lesson-when';
                                                taBottom.value = l.opportunity || '';
                                                content.appendChild(labelBottom);
                                                content.appendChild(taBottom);
                                                
                                                lessonTabContentContainer.appendChild(content);
                                            } catch(e) { console.warn('populate additional lesson tab failed', e); }
                                        }
                                    } else if (lessonTabContentContainer) {
                                        // no lessons: clear first tab fields
                                        var firstTabContent = lessonTabContentContainer.querySelector('.jr-lesson-tab-content');
                                        if (firstTabContent) {
                                            var focusEl = firstTabContent.querySelector('.wr-lesson-focus');
                                            var whyEl = firstTabContent.querySelector('.wr-lesson-why');
                                            var whenEl = firstTabContent.querySelector('.wr-lesson-when');
                                            if (focusEl) focusEl.value = '';
                                            if (whyEl) whyEl.value = '';
                                            if (whenEl) whenEl.value = '';
                                        }
                                    }
                                    
                                    // Re-wire lesson tabs after populating (to bind events to newly created tabs)
                                    wireLessonTabs(wrap);
                                    
                                    // Activate the first lesson tab
                                    var firstLessonTab = wrap.querySelector('.jr-lesson-tab');
                                    if (firstLessonTab) firstLessonTab.click();
                                    if (getCurrentLang() === "en") { translateModalContent(wrap); }
                                } catch(e) { console.warn('populateWrapWithReflection failed', e); }
                            }

                            // Fetch saved fields from DB and overwrite textareas if present
                            (function () {
                                var fetchUrl = './php/get_object_goal_fields.php';
                                $.ajax({
                                    url: fetchUrl,
                                    type: 'GET',
                                    dataType: 'json',
                                    data: { object_journal_id: objectJournalId },
                                    success: function (fres) {
                                        if (fres && fres.success) {
                                            try {
                                                // Prefill split evaluation fields if server provides them (prefer reflection rows)
                                                try {
                                                    // The server may return reflection fields at top-level, or nested under `reflection` / `object_journal_reflection`.
                                                    var refl = null;
                                                    if (fres.reflection && typeof fres.reflection === 'object') refl = fres.reflection;
                                                    else if (fres.object_journal_reflection && typeof fres.object_journal_reflection === 'object') refl = fres.object_journal_reflection;
                                                    else refl = fres; // fallback to top-level

                                                    var val_good = (typeof refl.evaluation_good !== 'undefined' && refl.evaluation_good !== null) ? refl.evaluation_good : (typeof fres.evaluation_good !== 'undefined' ? fres.evaluation_good : fres.success_points || '');
                                                    var val_bad = (typeof refl.evaluation_bad !== 'undefined' && refl.evaluation_bad !== null) ? refl.evaluation_bad : (typeof fres.evaluation_bad !== 'undefined' ? fres.evaluation_bad : fres.failure_points || '');
                                                    var val_attr = (typeof refl.attribution !== 'undefined' && refl.attribution !== null) ? refl.attribution : (typeof fres.attribution !== 'undefined' ? fres.attribution : fres.completion_reason || '');

                                                    if (document.getElementById('wr_successPoints')) document.getElementById('wr_successPoints').value = val_good || '';
                                                    if (document.getElementById('wr_failurePoints')) document.getElementById('wr_failurePoints').value = val_bad || '';
                                                    // legacy 'completionReason' now maps to attribution_good
                                                    if (document.getElementById('wr_attribution_good')) document.getElementById('wr_attribution_good').value = val_attr || '';

                                                    // keep lesson fields reset here; they'll be populated below from fres.additional_lessons / items / lessons
                                                    if (document.getElementById('wr_lesson_focus')) document.getElementById('wr_lesson_focus').value = '';
                                                    if (document.getElementById('wr_lesson_when')) document.getElementById('wr_lesson_when').value = '';
                                                } catch (prefillErr) { console.warn('journal_report: prefill eval fields error', prefillErr); }

                                                // If server provided additional lessons array or items, prefer showing them in the main textarea
                                                try {
                                                    var container = document.getElementById('wr_additionalLessonsContainer');
                                                    var lessonsArr = [];
                                                    if (Array.isArray(fres.additional_lessons) && fres.additional_lessons.length) {
                                                        // Each item expected to be { object_le_id, lesson_learned }
                                                        lessonsArr = fres.additional_lessons.map(function (it) { return (it && it.lesson_learned) ? it.lesson_learned : (typeof it === 'string' ? it : ''); }).filter(Boolean);
                                                    } else if (Array.isArray(fres.items) && fres.items.length) {
                                                        lessonsArr = fres.items.map(function (it) { return (it.lesson_learned || it.application || it.text || ''); }).filter(Boolean);
                                                    } else if (Array.isArray(fres.lessons) && fres.lessons.length) {
                                                        lessonsArr = fres.lessons.map(function (it) { return (typeof it === 'string') ? it : (it.lesson_learned || it.application || it.text || ''); }).filter(Boolean);
                                                    }

                                                    if (lessonsArr && lessonsArr.length) {
                                                        // If we have at least two lessons, map first -> focus, second -> when, rest -> additional fields
                                                        if (lessonsArr.length >= 2) {
                                                            if (document.getElementById('wr_lesson_focus')) document.getElementById('wr_lesson_focus').value = lessonsArr[0];
                                                            if (document.getElementById('wr_lesson_when')) document.getElementById('wr_lesson_when').value = lessonsArr[1];
                                                            if (container) container.innerHTML = '';
                                                            for (var ai = 2; ai < lessonsArr.length; ai++) {
                                                                try { var fld = makeAdditionalLessonField(lessonsArr[ai], ''); container.appendChild(fld); } catch (e) { console.warn('append extra lesson', e); }
                                                            }
                                                        } else {
                                                            // single lesson — put into 'focus' field
                                                            if (document.getElementById('wr_lesson_focus')) document.getElementById('wr_lesson_focus').value = lessonsArr[0];
                                                            if (container) container.innerHTML = '';
                                                        }
                                                    } else {
                                                        // fallback: populate additionalContainer from any available extras (legacy behavior)
                                                        if (container) {
                                                            container.innerHTML = '';
                                                            var extras = [];
                                                            if (Array.isArray(fres.additional_lessons) && fres.additional_lessons.length) extras = fres.additional_lessons;
                                                            else if (Array.isArray(fres.items) && fres.items.length) extras = fres.items.map(function (it) { return (it.lesson_learned || it.application || it.text || ''); });
                                                            else if (Array.isArray(fres.lessons) && fres.lessons.length) extras = fres.lessons;
                                                            if (extras && extras.length) {
                                                                extras.forEach(function (x, i) {
                                                                    try {
                                                                        var text = (typeof x === 'string') ? x : (x.lesson_learned || x.application || x.text || '');
                                                                        var dbId = (x && x.object_le_id) ? x.object_le_id : null;
                                                                        var fld = makeAdditionalLessonField(text, '', dbId);
                                                                        container.appendChild(fld);
                                                                    } catch (e) { console.warn('populate extra lesson failed', e); }
                                                                });
                                                            }
                                                        }
                                                    }
                                                } catch (e) { console.warn('populate additional lessons error', e); }

                                                // Additionally, fetch the canonical reflection row (evaluation/attribution)
                                                try {
                                                    $.ajax({
                                                        url: './php/get_object_journal_reflections.php',
                                                        type: 'GET',
                                                        dataType: 'json',
                                                        data: { object_journal_id: objectJournalId, debug: 1 },
                                                        success: function (rres) {
                                                            if (_reflectionsRendered) { return; }
                                                                try {
                                                                    var latest = null;
                                                                    if (rres && rres.latest_snapshot && Array.isArray(rres.latest_snapshot.reflections)) {
                                                                        latest = rres.latest_snapshot.reflections;
                                                                    } else if (rres && Array.isArray(rres.reflections)) {
                                                                        latest = rres.reflections;
                                                                    }
                                                                    // if reflections array present, render cards similarly to above
                                                                    if (rres && rres.success && Array.isArray(latest) && latest.length) {
                                                                        var refls = latest;
                                                                        for (var ri = 0; ri < refls.length; ri++) {
                                                                            var rf = refls[ri];
                                                                            if (ri === 0) populateWrapWithReflection(infoWrap, rf);
                                                                            else {
                                                                                try {
                                                                                    var clone = infoWrap.cloneNode(true);
                                                                                    var cidx = _jrInfoCloneIdx++;
                                                                                    var elemsWithId = clone.querySelectorAll('[id]');
                                                                                    elemsWithId.forEach(function(el){ var old = el.id; el.id = old + '_' + cidx; });
                                                                                    var headerEl = clone.querySelector('.jr-info-header'); if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja') ? ('内省 #' + (cidx+1)) : ('Reflection #' + (cidx+1));
                                                                                    var addCont = clone.querySelector('#wr_additionalLessonsContainer'); if (addCont) addCont.id = 'wr_additionalLessonsContainer_' + cidx;
                                                                                    var firstWrap = modalContent.querySelector('.jr-info-wrap');
                                                                                    if (firstWrap) modalContent.insertBefore(clone, firstWrap);
                                                                                    else modalContent.appendChild(clone);
                                                                                    wireInfoWrapInteractions(clone);
                                                                                    populateWrapWithReflection(clone, rf);
                                                                                } catch(e) { console.warn('clone populate failed', e); }
                                                                            }
                                                                        }
                                                                        _reflectionsRendered = true;
                                                                    } else {
                                                                        var rf = null;
                                                                        if (rres && rres.success && rres.reflection) rf = rres.reflection;
                                                                        if (rf) { populateWrapWithReflection(infoWrap, rf); _reflectionsRendered = true; }
                                                                    }
                                                                } catch (e) { console.warn('apply reflection prefill failed', e); }
                                                                // Resize all textareas after population
                                                                setTimeout(function() {
                                                                    modalContent.querySelectorAll('textarea').forEach(function(ta) {
                                                                        ta.style.height = 'auto';
                                                                        ta.style.height = ta.scrollHeight + 'px';
                                                                    });
                                                                }, 100);
                                                        },
                                                        error: function () { /* ignore reflection fetch errors silently */ }
                                                    });
                                                } catch (e) { console.warn('fetch reflection failed', e); }
                                            } catch (e) { console.error('apply fetched fields error', e); }
                                        } else {
                                            console.warn('get_object_goal_fields: not found or error', fres);
                                        }
                                    },
                                    error: function (xhr, status, err) {
                                        console.error('get_object_goal_fields error', status, err, xhr && xhr.responseText);
                                    }
                                });
                            })();

                            results.forEach(function (item) {
                                // Wrap heading + list in a bordered, scrollable box
                                var itemWrap = document.createElement('div');
                                itemWrap.style.border = '1px solid ' + theme.border;
                                itemWrap.style.borderRadius = '8px';
                                itemWrap.style.margin = '16px 0';
                                itemWrap.style.background = '#fff';
                                itemWrap.style.overflow = 'hidden';
                                itemWrap.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';

                                // タイトル (Question Header)
                                var heading = document.createElement('div');
                                heading.style.padding = '12px 14px';
                                heading.style.background = '#f8fafc'; // slightly lighter gray
                                heading.style.borderBottom = '1px solid ' + theme.border;
                                heading.style.borderLeft = '4px solid ' + theme.primary; // アクセントカラーの太い左線
                                
                                // ラベルバッジ (案1)
                                var labelBadge = document.createElement('div');
                                labelBadge.textContent = (getCurrentLang() === 'ja') ? '📍 目掛けた問い' : '📍 Targeted Inquiry';
                                labelBadge.style.fontSize = '11px';
                                labelBadge.style.fontWeight = 'bold';
                                labelBadge.style.color = theme.primary;
                                labelBadge.style.marginBottom = '6px';
                                labelBadge.style.letterSpacing = '0.5px';
                                
                                // 問いテキスト (案2: Q.を強調)
                                var qText = document.createElement('div');
                                qText.style.fontWeight = 'bold';
                                qText.style.fontSize = '14px';
                                qText.style.color = '#0f172a';
                                qText.style.lineHeight = '1.4';
                                qText.innerHTML = '<span style="color:' + theme.primary + '; font-size: 16px; margin-right: 4px; font-weight: 900;">Q.</span><span class="jr-trans-query">' + escapeHtml(item.display || '') + '</span>';

                                heading.appendChild(labelBadge);
                                heading.appendChild(qText);
                                itemWrap.appendChild(heading);

                                if (item.answer_content || (item.answer_histories && item.answer_histories.length > 0)) {
                                    var answerWrap = document.createElement('div');
                                    answerWrap.style.padding = '8px 12px';
                                    answerWrap.style.background = '#f8fafc';
                                    answerWrap.style.borderBottom = '1px solid ' + theme.border;
                                    
                                    // 「現状の答え」ラベルを追加
                                    var answerLabel = document.createElement('div');
                                    var hasUpdate = (item.answer_histories && item.answer_histories.length > 1);
                                    if (getCurrentLang() === 'ja') {
                                        answerLabel.textContent = hasUpdate ? '💡 現状の答え（更新あり）' : '💡 現状の答え';
                                    } else {
                                        answerLabel.textContent = hasUpdate ? '💡 Current Answer (Updated)' : '💡 Current Answer';
                                    }
                                    answerLabel.style.fontSize = '11px';
                                    answerLabel.style.fontWeight = 'bold';
                                    answerLabel.style.color = '#d97706'; // Slightly darker orange/yellow
                                    answerLabel.style.marginBottom = '6px';
                                    answerLabel.style.letterSpacing = '0.5px';
                                    answerWrap.appendChild(answerLabel);
                                    
                                    // 期間中の変更があれば履歴を表示、なければ現在のコンテンツを表示
                                    if (item.answer_histories && item.answer_histories.length > 0) {
                                        item.answer_histories.forEach(function(hist, idx) {
                                            var histRow = document.createElement('div');
                                            histRow.style.fontSize = '13px';
                                            histRow.style.color = '#334155';
                                            histRow.style.display = 'flex';
                                            histRow.style.alignItems = 'flex-start';
                                            histRow.style.marginTop = '2px';
                                            
                                            // ユーザーの要望により時間情報を削除
                                            // var timeSpan = document.createElement('span');
                                            // timeSpan.textContent = '[' + (hist.appeared_at ? hist.appeared_at.substring(5, 16) : '') + '] ';
                                            // timeSpan.style.color = '#94a3b8';
                                            // timeSpan.style.marginRight = '6px';
                                            // timeSpan.style.fontSize = '11px';
                                            // timeSpan.style.whiteSpace = 'nowrap';
                                            
                                            var contentSpan = document.createElement('span');
                                            contentSpan.className = 'jr-trans-answer';
                                            contentSpan.textContent = hist.content;
                                            
                                            if (idx > 0) {
                                                // 変更後であることを示すアイコン
                                                var arrowSpan = document.createElement('span');
                                                arrowSpan.textContent = '↳ ';
                                                arrowSpan.style.color = '#cbd5e1';
                                                arrowSpan.style.marginRight = '4px';
                                                histRow.appendChild(arrowSpan);
                                            }
                                            
                                            // histRow.appendChild(timeSpan);
                                            histRow.appendChild(contentSpan);
                                            answerWrap.appendChild(histRow);
                                        });
                                    } else if (item.answer_content) {
                                        var answerDiv = document.createElement('div');
                                        answerDiv.className = 'jr-trans-answer';
                                        answerDiv.textContent = item.answer_content;
                                        answerDiv.style.fontSize = '13px';
                                        answerDiv.style.color = '#334155';
                                        answerWrap.appendChild(answerDiv);
                                    }
                                    
                                    itemWrap.appendChild(answerWrap);
                                }

                                // コンテンツエリア (Means body)
                                var bodyWrap = document.createElement('div');
                                bodyWrap.style.padding = '10px 12px'; // 14px 16px -> 10px 12px
                                // ユーザーの要望により、すべて表示されるよう自動高さに（maxHeight/overflowを削除）
                                
                                // 「活動プロセス」ラベルを追加
                                var processLabel = document.createElement('div');
                                processLabel.textContent = (getCurrentLang() === 'ja') ? '🏃‍♂️ 問いに対する活動プロセス' : '🏃‍♂️ Activity Process for Inquiry';
                                processLabel.style.fontSize = '11px';
                                processLabel.style.fontWeight = 'bold';
                                processLabel.style.color = '#3b82f6'; // blue color
                                processLabel.style.marginBottom = '8px';
                                processLabel.style.letterSpacing = '0.5px';
                                bodyWrap.appendChild(processLabel);
                                
                                itemWrap.appendChild(bodyWrap);

                                // タイムライン本体
                                var timeline = document.createElement('div');
                                timeline.style.display = 'flex';
                                timeline.style.flexDirection = 'column';
                                timeline.style.gap = '0px';
                                timeline.style.margin = '8px 0 0 0';

                                // historiesがあればタイムライン表示
                                var rowsSource = (item.histories && item.histories.length) ? item.histories : null;
                                var mapJa = { 1: '手段設定', 2: 'ラベル変更', 3: '理由記述', 4: '完了時間記述', 5: '手段開始', 6: '手段中断', 7: '手段終了', 8: '内省記述' };
                                var mapIcon = { 1: '⚙️', 2: '🏷️', 3: '📝', 4: '⏰', 5: '▶️', 6: '⏸️', 7: '⏹️', 8: '💬' };
                                // 最新状態タイムラインは表示しない

                                // Prefer histories (which include appeared_at and activity). If none, fall back to item.content strings.
                                // We will group histories by their raw `content` value and render each content as a heading,
                                // then list the group's history rows (timestamps + activity label) beneath it.
                                var rowsSource = (item.histories && item.histories.length) ? item.histories : null;
                                var mapJa = { 1: '手段設定', 2: 'ラベル変更', 3: '理由記述', 4: '完了時間記述', 5: '手段開始', 6: '手段中断', 7: '手段終了', 8: '内省記述' };
                                var mapEn = { 1: 'Means set', 2: 'Label change', 3: 'Reason recorded', 4: 'Completion time recorded', 5: 'Means started', 6: 'Means interrupted', 7: 'Means finished', 8: 'Reflection recorded' };

                                if (rowsSource) {
                                    // First, group histories by object_node_id (preserve lists); ordering decided below
                                    var objGroups = {};
                                    rowsSource.forEach(function (h) {
                                        var oid = h.object_node_id || '';
                                        if (typeof objGroups[oid] === 'undefined') { objGroups[oid] = []; }
                                        objGroups[oid].push(h);
                                    });

                                    // Determine object order: prefer server-provided ordered_object_node_ids when available
                                    var objOrder = [];
                                    if (item.ordered_object_node_ids && Array.isArray(item.ordered_object_node_ids) && item.ordered_object_node_ids.length) {
                                        objOrder = item.ordered_object_node_ids.filter(function (id) { return typeof objGroups[id] !== 'undefined'; });
                                        // append any groups not covered by ordered list (preserve their original first-seen order)
                                        Object.keys(objGroups).forEach(function (k) { if (objOrder.indexOf(k) === -1) objOrder.push(k); });
                                    } else {
                                        // fallback: preserve first-seen order from rowsSource
                                        Object.keys(objGroups).forEach(function (k) { objOrder.push(k); });
                                    }

                                    // Build representative content map for each object (used for parent labels)
                                    var repByOid = {};
                                    Object.keys(objGroups).forEach(function (k) {
                                        var g = objGroups[k];
                                        var rep = '';
                                        if (g && g.length) {
                                            var last = g[g.length - 1];
                                            rep = (last && typeof last.content !== 'undefined') ? last.content : (item.display || '');
                                        } else {
                                            rep = item.display || '';
                                        }
                                        repByOid[k] = rep;
                                    });

                                    // Compute level (depth) per object using node_parents/node_children returned from server
                                    var nodeParents = item.node_parents || {};
                                    var nodeChildren = item.node_children || {};
                                    var levels = {};
                                    // roots: nodes that have no parent within the current groups
                                    var roots = [];
                                    Object.keys(objGroups).forEach(function (n) {
                                        var parents = nodeParents[n] || [];
                                        var hasParent = false;
                                        for (var pi = 0; pi < parents.length; pi++) {
                                            if (typeof objGroups[parents[pi]] !== 'undefined') { hasParent = true; break; }
                                        }
                                        if (!hasParent) {
                                            roots.push(n);
                                            levels[n] = 0;
                                        }
                                    });

                                    // BFS to assign levels; siblings (same parent) will get same level
                                    var q = roots.slice();
                                    while (q.length) {
                                        var cur = q.shift();
                                        var children = nodeChildren[cur] || [];
                                        // sort children by repByOid's order if available, otherwise keep natural order
                                        children.forEach(function (ch) {
                                            if (typeof objGroups[ch] === 'undefined') return;
                                            var parentLevels = [];
                                            var plist = nodeParents[ch] || [];
                                            for (var pidx = 0; pidx < plist.length; pidx++) {
                                                var pp = plist[pidx];
                                                if (typeof levels[pp] !== 'undefined') parentLevels.push(levels[pp]);
                                            }
                                            var newL = parentLevels.length ? (Math.min.apply(null, parentLevels) + 1) : (levels[cur] + 1);
                                            if (typeof levels[ch] === 'undefined' || newL < levels[ch]) {
                                                levels[ch] = newL;
                                                q.push(ch);
                                            }
                                        });
                                    }

                                    // Fill any unanalyzed nodes with level 0
                                    Object.keys(objGroups).forEach(function (n) { if (typeof levels[n] === 'undefined') levels[n] = 0; });

                                    // Tree hierarchy restructuring
                                    var treeNodes = {};
                                    var rootsList = [];
                                    
                                    objOrder.forEach(function(oid) {
                                        treeNodes[oid] = { oid: oid, children: [] };
                                    });

                                    // Build hierarchy mapping based on item.node_parents
                                    objOrder.forEach(function(oid) {
                                        var parentsArr = item.node_parents && item.node_parents[oid] ? item.node_parents[oid] : [];
                                        var parentFound = false;
                                        for (var pi = 0; pi < parentsArr.length; pi++) {
                                            var p = parentsArr[pi];
                                            if (treeNodes[p]) {
                                                treeNodes[p].children.push(treeNodes[oid]);
                                                parentFound = true;
                                                break;
                                            }
                                        }
                                        if (!parentFound) {
                                            rootsList.push(treeNodes[oid]);
                                        }
                                    });

                                    function renderTreeNode(node, container, isLastChild, isRoot, depth) {
                                        if (typeof depth === 'undefined') depth = 0;
                                        var oid = node.oid;
                                        var grp = objGroups[oid];

                                        var repContent = '';
                                        if (grp && grp.length) {
                                            var last = grp[grp.length - 1];
                                            repContent = (last && typeof last.content !== 'undefined') ? last.content : (item.display || '');
                                        } else {
                                            repContent = (item.display || '');
                                        }
                                        var contentHeading = repContent && repContent.toString().trim() ? repContent.toString() : ((getCurrentLang() === 'ja') ? '(内容なし)' : '(no content)');

                                        var nodeWrap = document.createElement('div');
                                        nodeWrap.className = 'method-item';
                                        if (depth === 0) nodeWrap.classList.add('is-parent');
                                        else if (depth === 1) nodeWrap.classList.add('is-child');
                                        else nodeWrap.classList.add('is-grandchild');
                                        nodeWrap.style.position = 'relative';
                                        nodeWrap.style.marginLeft = (depth * 24) + 'px';

                                        if (!isRoot) {
                                            var branchLine = document.createElement('div');
                                            branchLine.className = 'jr-tree-line';
                                            // Extend line upwards
                                            // Depending on sibling spacing, the height might need adjustment, but CSS handles it
                                            nodeWrap.appendChild(branchLine);
                                            
                                            // If last child, we mask the continuous vertical line that comes from the parent container
                                            if (isLastChild) {
                                                var mask = document.createElement('div');
                                                mask.style.position = 'absolute';
                                                mask.style.left = '-16px';
                                                mask.style.top = '24px'; /* exactly below the border-bottom */
                                                mask.style.bottom = '-50px'; /* extend to hide parent line below this item */
                                                mask.style.width = '4px';
                                                mask.style.backgroundColor = '#fff';
                                                mask.style.zIndex = '1';
                                                nodeWrap.appendChild(mask);
                                            }
                                        }

                                        var nodeContentWrap = document.createElement('div'); // to hold content and details
                                        
                                        var ch = document.createElement('div');
                                        ch.className = 'method-content';
                                        ch.style.display = 'flex';
                                        ch.style.alignItems = 'flex-start';
                                        ch.style.justifyContent = 'space-between';
                                        ch.style.cursor = 'pointer';
                                        ch.style.padding = '8px 12px'; // 12px 14px -> 8px 12px
                                        ch.style.background = '#ffffff';
                                        ch.style.border = '1px solid #e2e8f0';
                                        ch.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                        ch.style.marginBottom = '6px'; // 8px -> 6px
                                        ch.style.transition = 'background 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease';
                                        ch.style.borderRadius = '8px';

                                        var chTextWrap = document.createElement('div');
                                        chTextWrap.style.display = 'flex';
                                        chTextWrap.style.flexDirection = 'column'; // Stack vertically
                                        chTextWrap.style.flex = '1';
                                        chTextWrap.style.lineHeight = '1.5';

                                        // Extract purpose from the history (find the most recent non-empty purpose)
                                        var purposeText = '';
                                        if (grp && grp.length) {
                                            for (var i = grp.length - 1; i >= 0; i--) {
                                                if (grp[i] && grp[i].purpose && grp[i].purpose.trim() !== '') {
                                                    purposeText = grp[i].purpose.trim();
                                                    break;
                                                }
                                            }
                                        }
                                        if (purposeText) {
                                            var chPurpose = document.createElement('div');
                                            chPurpose.className = 'jr-trans-purpose';
                                            chPurpose.textContent = purposeText; // No "理由：" prefix
                                            chPurpose.style.fontSize = '11px'; // 12px -> 11px
                                            chPurpose.style.color = '#64748b';
                                            chPurpose.style.marginBottom = '4px'; // 6px -> 4px
                                            chPurpose.style.paddingLeft = '8px'; 
                                            chPurpose.style.borderLeft = '3px solid #cbd5e1';
                                            chPurpose.style.marginLeft = '4px';
                                            chTextWrap.appendChild(chPurpose);
                                        }

                                        var chMainRow = document.createElement('div');
                                        chMainRow.style.display = 'flex';
                                        chMainRow.style.alignItems = 'flex-start';
                                        chMainRow.style.width = '100%';

                                        var chText = document.createElement('div');
                                        chText.className = 'jr-trans-node';
                                        chText.textContent = contentHeading; // Removed bullet dot for cleaner card look
                                        chText.style.fontWeight = '600';
                                        chText.style.fontSize = '13px'; // Add font size constraint
                                        chText.style.color = '#1e293b';
                                        chText.style.flex = '1'; // ensure text takes available space
                                        chMainRow.appendChild(chText);

                                        // ステータス判定
                                        var currentStatus = (getCurrentLang() === 'ja') ? "計画" : "Plan";
                                        var statusClass = "jr-status-plan";
                                        if (grp && grp.length) {
                                            grp.forEach(function(h) {
                                                var act = parseInt(h.activity, 10);
                                                if (act === 5) { currentStatus = (getCurrentLang() === 'ja') ? "開始" : "Start"; statusClass = "jr-status-start"; }
                                                else if (act === 6) { currentStatus = (getCurrentLang() === 'ja') ? "中断" : "Pause"; statusClass = "jr-status-pause"; }
                                                else if (act === 7) { currentStatus = (getCurrentLang() === 'ja') ? "完了" : "Done"; statusClass = "jr-status-done"; }
                                            });
                                        }

                                        var statusChip = document.createElement('span');
                                        statusChip.className = "jr-status-chip " + statusClass;
                                        statusChip.textContent = currentStatus;
                                        statusChip.style.marginTop = '2px'; // align with text top line
                                        chMainRow.appendChild(statusChip);

                                        chTextWrap.appendChild(chMainRow);
                                        ch.appendChild(chTextWrap);

                                        var chIcon = document.createElement('div');
                                        chIcon.textContent = '▼';
                                        chIcon.style.marginLeft = '8px';
                                        chIcon.style.marginTop = '2px';
                                        chIcon.style.fontSize = '12px';
                                        chIcon.style.fontWeight = 'bold';
                                        chIcon.style.whiteSpace = 'nowrap';
                                        chIcon.style.color = '#64748b';
                                        chIcon.style.transition = 'color 0.15s ease';
                                        ch.appendChild(chIcon);

                                        // Hover and focus affordances to indicate clickability
                                        ch.addEventListener('mouseenter', function () {
                                            ch.style.background = '#f8fafc'; // very light gray
                                            ch.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                            ch.style.transform = 'translateY(-1px)';
                                            chIcon.style.color = theme.primary;
                                        });
                                        ch.addEventListener('mouseleave', function () {
                                            ch.style.background = '';
                                            ch.style.boxShadow = '';
                                            ch.style.transform = '';
                                            chIcon.style.color = theme.muted;
                                        });
                                        ch.addEventListener('focus', function () {
                                            ch.style.outline = '3px solid rgba(43,122,120,0.12)';
                                            ch.style.outlineOffset = '3px';
                                        });
                                        ch.addEventListener('blur', function () {
                                            ch.style.outline = '';
                                            ch.style.outlineOffset = '';
                                        });

                                        // small table for this object (all histories under this object_node_id)
                                        var innerTbl = document.createElement('table');
                                        innerTbl.style.width = '100%';
                                        innerTbl.style.borderCollapse = 'collapse';
                                        var innerTbody = document.createElement('tbody');

                                        // details container (collapsible) with smooth slide
                                        var detailsDiv = document.createElement('div');
                                        detailsDiv.style.display = 'none';
                                        detailsDiv.style.marginTop = '8px';
                                        detailsDiv.style.paddingLeft = '24px'; // A: 活動プロセス全体のインデントを追加
                                        detailsDiv.style.overflow = 'hidden';
                                        detailsDiv.style.maxHeight = '0px';
                                        detailsDiv.style.opacity = '0';
                                        detailsDiv.style.transition = 'max-height 0.28s ease, opacity 0.18s ease';

                                        // historiesを詳細展開でリスト表示
                                        if (grp && grp.length) {
                                            var timelineWrap = document.createElement('div');
                                            timelineWrap.className = 'jr-timeline-list';
                                            
                                            var lastDateStr = '';
                                            grp.forEach(function(h, idx) {
                                                var act = (typeof h.activity !== 'undefined') ? parseInt(h.activity, 10) : 0;
                                                var label = (getCurrentLang() === 'ja') ? (mapJa[act] || '') : (mapEn[act] || '');
                                                
                                                var detail = '';
                                                if (act === 1 || act === 2) {
                                                    detail = h.content || '';
                                                } else if (act === 3) {
                                                    detail = h.purpose || '';
                                                } else if (act === 4) {
                                                    detail = h.estimated_time || '';
                                                } else if (act === 8) {
                                                    var parts = [];
                                                    if (h.evaluation_good) parts.push(h.evaluation_good);
                                                    if (h.evaluation_bad) parts.push(h.evaluation_bad);
                                                    if (h.attribution) parts.push(h.attribution);
                                                    if (h.application) parts.push(h.application);
                                                    detail = parts.join(' / ');
                                                }
                                                var row = document.createElement('div');
                                                row.className = 'jr-timeline-row' + (idx === grp.length-1 ? ' last' : '');
                                                
                                                // アイコン＋縦線
                                                var iconWrap = document.createElement('div');
                                                iconWrap.className = 'jr-timeline-icon-wrap';
                                                var iconDiv = document.createElement('div');
                                                iconDiv.className = 'jr-timeline-dot'; // C: ミニマルなドットアイコンへ変更
                                                iconWrap.appendChild(iconDiv);
                                                row.appendChild(iconWrap);
                                                
                                                // ラベル・内容 (C: 横並び配置)
                                                var textDiv = document.createElement('div');
                                                textDiv.className = 'jr-timeline-text';
                                                
                                                var labelDiv = document.createElement('div');
                                                labelDiv.className = 'jr-timeline-label';
                                                labelDiv.textContent = label;
                                                textDiv.appendChild(labelDiv);
                                                
                                                if (detail) {
                                                    var detailDiv = document.createElement('div');
                                                    detailDiv.className = 'jr-timeline-detail jr-trans-detail';
                                                    detailDiv.textContent = detail; // 「内容：」という固定プレフィックスを削除しスマートに
                                                    textDiv.appendChild(detailDiv);
                                                }
                                                row.appendChild(textDiv);
                                                
                                                // 日時 (D: タイムスタンプの配置と日付省略) -> ユーザー要望により時間情報を非表示化
                                                // var timeDiv = document.createElement('div');
                                                // timeDiv.className = 'jr-timeline-time';
                                                
                                                // var timeStr = h.appeared_at || '';
                                                // if (timeStr.length >= 16) {
                                                //     var datePart = timeStr.substring(0, 10); // YYYY-MM-DD
                                                //     var timePart = timeStr.substring(11, 16); // HH:MM
                                                //     if (datePart === lastDateStr) {
                                                //         timeStr = timePart; // 同じ日の場合は時刻のみ
                                                //     } else {
                                                //         var md = datePart.substring(5).replace('-', '/'); // MM/DD
                                                //         timeStr = md + ' ' + timePart; // 違う日は日付付き
                                                //         lastDateStr = datePart;
                                                //     }
                                                // }
                                                // timeDiv.textContent = timeStr;
                                                // row.appendChild(timeDiv);
                                                
                                                timelineWrap.appendChild(row);
                                            });
                                            detailsDiv.appendChild(timelineWrap);
                                        }
                                        // header click toggles the details
                                        // toggle with smooth height animation and keyboard support
                                        var openDetails = function () {
                                            detailsDiv.style.display = 'block';
                                            // allow layout then set maxHeight to scrollHeight
                                            var sh = detailsDiv.scrollHeight || (innerTbl ? innerTbl.scrollHeight + 20 : 300);
                                            detailsDiv.style.maxHeight = sh + 'px';
                                            detailsDiv.style.opacity = '1';
                                            chIcon.textContent = '▲';
                                            chIcon.style.color = '#3b82f6'; // Change color when open
                                        };
                                        var closeDetails = function () {
                                            detailsDiv.style.maxHeight = '0px';
                                            detailsDiv.style.opacity = '0';
                                            chIcon.textContent = '▼';
                                            chIcon.style.color = '#64748b';
                                        };
                                        ch.addEventListener('click', function () {
                                            if (detailsDiv.style.display === 'none' || detailsDiv.style.maxHeight === '0px') {
                                                openDetails();
                                            } else {
                                                closeDetails();
                                            }
                                        });
                                        // after collapse transition, hide element to remove from tab order
                                        detailsDiv.addEventListener('transitionend', function (e) {
                                            if (e.propertyName === 'max-height' && detailsDiv.style.maxHeight === '0px') {
                                                detailsDiv.style.display = 'none';
                                            }
                                        });
                                        // keyboard accessibility (Enter / Space)
                                        ch.setAttribute('role', 'button');
                                        ch.tabIndex = 0;
                                        ch.addEventListener('keydown', function (ev) {
                                            if (ev.key === 'Enter' || ev.key === ' ') {
                                                ev.preventDefault();
                                                ch.click();
                                            }
                                        });

                                        nodeContentWrap.appendChild(ch);
                                        nodeContentWrap.appendChild(detailsDiv);
nodeWrap.appendChild(nodeContentWrap);
                                        
                                        // Render children inside an indented container with continuous left border
                                        if (node.children.length > 0) {
                                            var toggleBtn = document.createElement('div');
                                            toggleBtn.textContent = '▼';
                                            toggleBtn.style.fontSize = '12px'; // icon only, slightly bigger
                                            toggleBtn.style.color = '#64748b';
                                            toggleBtn.style.cursor = 'pointer';
                                            toggleBtn.style.marginLeft = '4px';
                                            toggleBtn.style.marginBottom = '4px'; // 6px -> 4px
                                            toggleBtn.style.display = 'inline-block';
                                            toggleBtn.style.fontWeight = 'bold';

                                            var childrenWrap = document.createElement('div');
                                            childrenWrap.className = 'method-children';
                                            childrenWrap.style.paddingLeft = '20px';
                                            childrenWrap.style.borderLeft = '2px solid #94a3b8'; // bolder blue-gray
                                            childrenWrap.style.marginLeft = '6px'; // align with the dot

                                            toggleBtn.addEventListener('click', function(e) {
                                                if (childrenWrap.style.display === 'none') {
                                                    childrenWrap.style.display = 'block';
                                                    toggleBtn.textContent = '▼';
                                                } else {
                                                    childrenWrap.style.display = 'none';
                                                    toggleBtn.textContent = '▶';
                                                }
                                            });
                                            
                                            nodeWrap.appendChild(toggleBtn);

                                            node.children.forEach(function(childNode, idx) {
                                                renderTreeNode(childNode, childrenWrap, idx === node.children.length - 1, false, depth + 1);
                                            });
                                            nodeWrap.appendChild(childrenWrap);
                                        }
                                        
                                        container.appendChild(nodeWrap);
                                    }

                                    // Render all roots
                                    rootsList.forEach(function(rootNode) {
                                        renderTreeNode(rootNode, bodyWrap, false, true, 0);
                                    });
                                } else if (item.content && item.content.length) {
                                    // No histories; render each item.content as a simple list, no large blocks
                                    var fallbackWrap = document.createElement('div');
                                    fallbackWrap.style.paddingLeft = '14px';
                                    fallbackWrap.style.color = '#4a5568';
                                    item.content.forEach(function (contentEntry) {
                                        var contentHeading = contentEntry && contentEntry.toString().trim() ? contentEntry.toString() : ((getCurrentLang() === 'ja') ? '(内容なし)' : '(no content)');
                                        var sh = document.createElement('div');
                                        sh.innerHTML = '・ <span class="jr-trans-fallback">' + escapeHtml(contentHeading) + '</span>';
                                        sh.style.margin = '4px 0';
                                        fallbackWrap.appendChild(sh);
                                    });
                                    bodyWrap.appendChild(fallbackWrap);
                                } else {
                                    // historiesもcontentもない場合でも、問いノード自体は表示し、活動がない旨を伝える
                                    var emptyMsg = document.createElement('div');
                                    emptyMsg.textContent = (getCurrentLang() === "ja") ? "この期間に記録された活動プロセスはありません。" : "No activity processes recorded during this period.";
                                    emptyMsg.style.color = '#718096';
                                    emptyMsg.style.fontSize = '14px';
                                    emptyMsg.style.padding = '8px 14px';
                                    emptyMsg.style.fontStyle = 'italic';
                                    bodyWrap.appendChild(emptyMsg);
                                }
                                // Add to left column (Activity Process) - always visible
                                activityContent.appendChild(itemWrap);
                            });


                            // Ensure the textarea block (`infoWrap`) is placed correctly.
                            // Note: infoWrap is now inside tabContentContainer, no need to move it.

                            // Helper to save a specific wrapper
                            function saveWrapper(wrap) {
                                    function getValOrOriginal(el) {
                                        if (!el) return "";
                                        var v = (el.value || "").trim();
                                        if (el.dataset.originalValue && v === el.dataset.translatedValue) {
                                            return el.dataset.originalValue.trim();
                                        }
                                        return v;
                                    }
                                try {
                                    var object_journal_id = objectJournalId || null;
                                    if (!object_journal_id) {
                                        alert((getCurrentLang() === 'ja') ? 'object_journal_id が見つかりません' : 'object_journal_id not found');
                                        return;
                                    }

                                    var allWraps = Array.from(modal.querySelectorAll('.jr-info-wrap'));
                                    var reflectionsPayload = allWraps.map(function (w) {
                                        var spEl = w.querySelector('.wr-successPoints');
                                        var fbEl = w.querySelector('.wr-failurePoints');
                                        var agEl = w.querySelector('.wr-attribution-good');
                                        var abEl = w.querySelector('.wr-attribution-bad');

                                        var successPoints = getValOrOriginal(spEl);
                                        var failurePoints = getValOrOriginal(fbEl);
                                        var attributionGoodVal = getValOrOriginal(agEl);
                                        var attributionBadVal = getValOrOriginal(abEl);

                                        var lessonsArr = [];
                                        try {
                                            var lessonTabContents = w.querySelectorAll('.jr-lesson-tab-content');
                                            if (lessonTabContents && lessonTabContents.length) {
                                                lessonTabContents.forEach(function (tc) {
                                                    try {
                                                        var focusEl = tc.querySelector('.wr-lesson-focus');
                                                        var whyEl = tc.querySelector('.wr-lesson-why');
                                                        var whenEl = tc.querySelector('.wr-lesson-when');
                                                        var fv = getValOrOriginal(focusEl);
                                                        var whyV = getValOrOriginal(whyEl);
                                                        var wv = getValOrOriginal(whenEl);
                                                        if (fv || whyV || wv) lessonsArr.push({ lesson: fv, why_important: whyV, opportunity: wv });
                                                    } catch (e) { }
                                                });
                                            }
                                        } catch (e) { /* ignore */ }

                                        var focus = lessonsArr.length > 0 ? (lessonsArr[0].lesson || '') : '';
                                        var when = lessonsArr.length > 0 ? (lessonsArr[0].opportunity || '') : '';
                                        var extrasArr = lessonsArr.slice(1);

                                        var mainLessonText = focus || '';
                                        if (when) mainLessonText = mainLessonText ? (mainLessonText + '\n\n' + when) : when;
                                        var reflectionText = mainLessonText;
                                        var extraStringsRef = extrasArr.map(function (x) { return x.lesson + (x.opportunity ? '\n\n' + x.opportunity : ''); });
                                        if (extraStringsRef.length) {
                                            reflectionText = reflectionText ? (reflectionText + '\n\n' + extraStringsRef.join('\n\n')) : extraStringsRef.join('\n\n');
                                        }

                                        return {
                                            evaluation_good: successPoints,
                                            evaluation_bad: failurePoints,
                                            attribution: attributionGoodVal,
                                            attribution_good: attributionGoodVal,
                                            attribution_bad: attributionBadVal,
                                            reflection_text: reflectionText,
                                            lessons: lessonsArr
                                        };
                                    });

                                    $.ajax({
                                        url: './php/insert_object_journal_history_snapshot.php',
                                        type: 'POST',
                                        dataType: 'json',
                                        data: {
                                            object_journal_id: object_journal_id,
                                            reflections_json: JSON.stringify(reflectionsPayload),
                                            map_id: (typeof window.MAPID !== 'undefined') ? window.MAPID : ''
                                        },
                                        success: function (res) {
                                            if (res && res.success) {
                                                window.__jr_hasUnsavedChanges = false;
                                                var sbs = modal.querySelectorAll('.jr-save-btn');
                                                sbs.forEach(function(sb) {
                                                    sb.textContent = (getCurrentLang() === 'ja') ? '保存済み' : 'Saved';
                                                    sb.style.background = '#edf2f7';
                                                    sb.style.color = '#a0aec0';
                                                    sb.disabled = true;
                                                });
                                            } else {
                                                console.warn('snapshot save failed', res);
                                                alert((getCurrentLang() === 'ja') ? '保存に失敗しました' : 'Save failed');
                                            }
                                        },
                                        error: function (xhr, st, err) {
                                            console.warn('snapshot save error', st, err, xhr && xhr.responseText);
                                            alert((getCurrentLang() === 'ja') ? '保存に失敗しました' : 'Save failed');
                                        }
                                    });
                                } catch (e) {
                                    console.error('saveWrapper error', e);
                                    alert('Error');
                                }
                            }

                            // Modify wireInfoWrapInteractions to include save button
                            var _origWire = wireInfoWrapInteractions;
                            wireInfoWrapInteractions = function (wrap) {
                                _origWire(wrap);
                                var sb = wrap.querySelector('.jr-save-btn');
                                if (sb) {
                                    sb.addEventListener('click', function () {
                                        saveWrapper(wrap);
                                    });
                                }
                            };

                            // Re-wire the original infoWrap (since we redefined the function after creating it, or we should just call it)
                            // But wait, `wireInfoWrapInteractions` was defined at line 152. I can just update the definition there if I used replace, but here I am replacing the block at the bottom
                            // Actually, I should probably update the definition of `wireInfoWrapInteractions` in place or redefine it and call it.
                            // The easiest is to just add the save button creation to the DOM construction and then call the wiring.

                            // Let's create the save button and append it to `lessonDiv` or `infoWrap`.
                            // User asked for "in jr-info-wrap".

                            var saveBtnV = document.createElement('button');
                            saveBtnV.type = 'button';
                            saveBtnV.className = 'jr-save-btn';
                            saveBtnV.textContent = (getCurrentLang() === 'ja') ? '保存済み' : 'Saved';
                            saveBtnV.style.display = 'block';
                            saveBtnV.style.marginTop = '24px';
                            saveBtnV.style.width = '100%'; // Full width to align with inputs beautifully
                            saveBtnV.style.padding = '12px 16px';
                            saveBtnV.style.background = '#edf2f7'; // Initial State A: disabled gray
                            saveBtnV.style.color = '#a0aec0';
                            saveBtnV.style.border = 'none';
                            saveBtnV.style.borderRadius = '8px';
                            saveBtnV.style.fontWeight = 'bold';
                            saveBtnV.style.fontSize = '14px';
                            saveBtnV.style.cursor = 'pointer';
                            saveBtnV.style.transition = 'background 0.2s ease, color 0.2s ease';
                            saveBtnV.disabled = true;

                            infoWrap.appendChild(saveBtnV); // Append to the wrapper

                            // Global input listener to switch save button to State B
                            modalContent.addEventListener('input', function(e) {
                                if (e.target.tagName.toLowerCase() === 'textarea') {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }
                                if (e.target.tagName.toLowerCase() === 'textarea' || e.target.tagName.toLowerCase() === 'input') {
                                    window.__jr_hasUnsavedChanges = true;
                                    var currentWrap = e.target.closest('.jr-info-wrap');
                                    var sb = currentWrap ? currentWrap.querySelector('.jr-save-btn') : modalContent.querySelector('.jr-save-btn');
                                    if (sb && sb.disabled) {
                                        sb.textContent = (getCurrentLang() === 'ja') ? '変更を保存する' : 'Save Changes';
                                        sb.style.background = '#2c7a7b';
                                        sb.style.color = '#ffffff';
                                        sb.disabled = false;
                                    }
                                }
                            });

                            // Bind the save button for this initial wrapper
                            saveBtnV.addEventListener('click', function () {
                                saveWrapper(infoWrap);
                            });

                            // Remove old closeBtn here completely

                            modal.appendChild(modalContent);
                            document.body.appendChild(modal);
                            if (getCurrentLang() === "en") { translateModalContent(modal); }
                        }).catch(function (err) { console.error('journal_report: Promise.all error', err); });
                    },
                    error: function (xhr, status, error) { console.error('journal_report: get_object_journal_nodes.php error', error); }
                });
            } catch (err) {
                console.error('journal_report click handler error', err);
            }
        });
    };
})();
