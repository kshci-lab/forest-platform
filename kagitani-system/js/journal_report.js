// journal_report.js
// Handles export-weekly-btn click handlers and Word export preview/download.
(function () {
    // idempotent init
    window.initWeeklyReportHandlers = function (goalHelpers) {
        if (window._weeklyReportInited) return;
        window._weeklyReportInited = true;

        function getCurrentLang() {
            try { return (goalHelpers && typeof goalHelpers.getCurrentLang === 'function') ? goalHelpers.getCurrentLang() : ((document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja'); } catch (e) { return 'ja'; }
        }

        var weeklyListDiv = document.getElementById('weeklyGoalsList');
        if (!weeklyListDiv) return;

        // Ensure CSS for journal report modal is loaded (idempotent)
        try {
            if (!document.getElementById('jr-css')) {
                var jrLink = document.createElement('link');
                jrLink.id = 'jr-css';
                jrLink.rel = 'stylesheet';
                jrLink.href = './css/journal_report.css';
                document.head.appendChild(jrLink);
            }
        } catch (e) { console.warn('journal_report: failed to inject CSS', e); }
        // Delegate using event delegation to avoid re-binding on rerender.
        weeklyListDiv.addEventListener('click', function (e) {
            var btn = e.target.closest && e.target.closest('.export-weekly-btn');
            if (!btn) return;
            try {
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
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
                        // Debug: log node ids returned from server for tracing
                        try { console.log('IEEEえええええjournal_report: node_ids', nodeIds); if (Array.isArray(nodeIds)) nodeIds.forEach(function (n) { console.log('journal_report: node_id', n); }); } catch (e) { console.warn('journal_report: failed to log node_ids', e); }

                        // 追加処理: 取得した node_id を基に object_nodes テーブルから
                        // startDate 〜 endDate の期間に情報を持つ object_node_id を取得してログ出力する
                        try {
                            if (Array.isArray(nodeIds)) {
                                nodeIds.forEach(function(nid){
                                    try {
                                        $.ajax({
                                            url: 'php/get_object_node_info.php',
                                            type: 'GET',
                                            dataType: 'json',
                                            data: { node_id: nid, start_date: startDate, end_date: endDate, debug: 1 },
                                            success: function(objRes) {
                                                try {
                                                    console.log('journal_report: object_node_info for node_id', nid, '=> object_node_ids:', objRes.object_node_ids || []);
                                                    if (objRes.debug_rows) console.log('journal_report: debug_rows for node_id ' + nid, objRes.debug_rows);
                                                } catch (e) { console.warn('journal_report: logging object_node_info failed', e); }
                                            },
                                            error: function(xhr, st, err) { console.warn('journal_report: get_object_node_info error for node_id ' + nid, st, err, xhr && xhr.responseText); }
                                        });
                                    } catch(e){ console.warn('journal_report: ajax for object_node_info failed', e); }
                                });
                            }
                        } catch(e) { console.warn('journal_report: object_nodes debug fetch failed', e); }
                        var promises = nodeIds.map(function (nodeId, i) {
                            console.log('うおおおおおおおおjournal_report: fetching node info for', nodeId);

                            return new Promise(function (resolve) {
                                $.ajax({
                                    //ジャーナルの手段履歴を取得している
                                    url: 'php/get_object_node_info.php',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: { node_id: nodeId, start_date: startDate, end_date: endDate },
                                    success: function (objRes) {
                                        console.log('journal_report: get_object_node_info', { nodeId: nodeId, response: objRes });
                                        var contentArr = [];
                                        try {
                                            // Prefer histories (from object_nodes_histories) because they carry `activity`.
                                            var source = (objRes && Array.isArray(objRes.histories) && objRes.histories.length) ? objRes.histories : (objRes && Array.isArray(objRes.data) ? objRes.data : []);
                                            // mapping for activity -> prefix
                                            var mapJa = { 1: '手段設定: ', 2: 'ラベル変更: ', 3: '理由記述: ', 4: '完了時間記述: ', 5: '手段開始: ', 6: '手段中断: ', 7: '手段終了: ', 8: '内省記述: ' };
                                            var mapEn = { 1: 'Means set: ', 2: 'Label change: ', 3: 'Reason recorded: ', 4: 'Completion time recorded: ', 5: 'Means started: ', 6: 'Means interrupted: ', 7: 'Means finished: ', 8: 'Reflection recorded: ' };
                                            var isJa = (getCurrentLang() === 'ja');
                                            contentArr = source.map(function (r) {
                                                var txt = r.content || '';
                                                try {
                                                    var act = (typeof r.activity !== 'undefined') ? parseInt(r.activity, 10) : 0;
                                                    var prefix = '';
                                                    if (act && act > 0) {
                                                        prefix = isJa ? (mapJa[act] || '') : (mapEn[act] || '');
                                                    }
                                                    return prefix + txt;
                                                } catch (e) {
                                                    return txt;
                                                }
                                            });
                                        // Debug: log the raw response and the built content array for this node
                                        try { console.log('journal_report: get_object_node_info', { nodeId: nodeId, raw: objRes, contentArr: contentArr }); } catch (e) { /* ignore logging errors */ }
                                        } catch (e) { console.error('build contentArr error', e); }
                                        resolve({ display: goalContents[i] || '', content: contentArr, object_node_ids: objRes.object_node_ids || [], object_node_history_ids: objRes.object_node_history_ids || [], histories: objRes.histories || [], node_children: objRes.node_children || {}, node_parents: objRes.node_parents || {} });
                                    },
                                    error: function () {
                                        resolve({ display: goalContents[i] || '', content: [], object_node_ids: [], object_node_history_ids: [], histories: [] });
                                    }
                                });
                            });
                        });

                                border: '#e8f3f1',
                                                            Promise.all(promises).then(function(results){
                                                                try { console.log('journal_report: node fetch results', results); } catch(e){}
                            var modal = document.createElement('div');
                            modal.className = 'jr-modal-overlay';
                            modal.style.position = 'fixed';
                            modal.style.left = '0';
                            modal.style.top = '0';
                            modal.style.right = '0';
                            modal.style.bottom = '0';
                            modal.style.zIndex = '10000';
                            modal.style.overflow = 'auto';
                            modal.style.background = 'rgba(0,0,0,0.4)';
                            var modalContent = document.createElement('div');
                            modalContent.className = 'jr-modal-content';
                            // guard to avoid rendering reflections twice (two separate AJAX calls below)
                            var _reflectionsRendered = false;
                            var theme = (typeof window.theme !== 'undefined') ? window.theme : { border:'#e6eaf0', text:'#233043', muted:'#7a8698', accent:'#1363df', primary:'#2b7a78' };
                            modalContent.className = 'jr-modal-content';

                            var title = document.createElement('h3');
                            title.className = 'jr-title';
                            // title.textContent = (getCurrentLang() === 'ja') ? 'Wordプレビュー' : 'Word Preview';
                            
                            // Header wrapper with title and download link
                            var headerWrapper = document.createElement('div');
                            headerWrapper.className = 'jr-header-wrapper';
                            headerWrapper.style.display = 'flex';
                            headerWrapper.style.justifyContent = 'space-between';
                            headerWrapper.style.alignItems = 'center';
                            headerWrapper.style.marginBottom = '12px';
                            
                            // Download link (styled as a link button)
                            var dlLink = document.createElement('a');
                            dlLink.href = '#';
                            dlLink.className = 'jr-download-link';
                            dlLink.innerHTML = (getCurrentLang() === 'ja') ? '⬇ Wordダウンロード' : '⬇ Download Word';
                            dlLink.style.color = theme.accent;
                            dlLink.style.fontSize = '14px';
                            dlLink.style.fontWeight = '600';
                            dlLink.style.textDecoration = 'none';
                            dlLink.style.display = 'flex';
                            dlLink.style.alignItems = 'center';
                            dlLink.style.gap = '4px';
                            dlLink.style.cursor = 'pointer';
                            dlLink.style.transition = 'opacity 0.2s';
                            dlLink.onmouseover = function() { dlLink.style.opacity = '0.7'; };
                            dlLink.onmouseout = function() { dlLink.style.opacity = '1'; };
                            
                            headerWrapper.appendChild(title);
                            headerWrapper.appendChild(dlLink);
                            modalContent.appendChild(headerWrapper);

                            var periodHeading = document.createElement('h3');
                            periodHeading.className = 'jr-period-heading';
                            periodHeading.textContent = (startDate || '') + '~' + (endDate || '') + ((getCurrentLang() === 'ja') ? 'に行ったこと' : ' activities');
                            modalContent.appendChild(periodHeading);

                            // Tab container for multiple reflections
                            var tabContainer = document.createElement('div');
                            tabContainer.className = 'jr-tab-container';
                            modalContent.appendChild(tabContainer);

                            // Tab content container
                            var tabContentContainer = document.createElement('div');
                            tabContentContainer.className = 'jr-tab-content-container';
                            modalContent.appendChild(tabContentContainer);

                            // Tab management functions
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
                                
                                // Add delete button (not for first tab - Activity Process)
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
                                    } else {
                                        c.classList.remove('jr-tab-content-active');
                                    }
                                });
                                // Update tab labels to show (Active) on current tab
                                updateTabLabels();
                            }

                            function updateTabLabels() {
                                _tabs.forEach(function(tab, i) {
                                    var isActive = tab.classList.contains('jr-tab-active');
                                    var label;
                                    if (i === 0) {
                                        // First tab is "活動プロセス" / "Activity Process"
                                        label = (getCurrentLang() === 'ja') ? '活動プロセス' : 'Activity Process';
                                    } else {
                                        // 内省 tabs start from #1 (i=1 -> #1, i=2 -> #2, etc.)
                                        label = (getCurrentLang() === 'ja') ? ('内省 #' + i) : ('Reflection #' + i);
                                    }
                                    if (isActive) label += ' (Active)';
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
                                        } else {
                                            c.classList.remove('jr-lesson-tab-content-active');
                                        }
                                    });
                                    updateLessonLabelsLocal();
                                }
                                
                                function updateLessonLabelsLocal() {
                                    var tabs = getLessonTabs();
                                    tabs.forEach(function(tab, i) {
                                        var isActive = tab.classList.contains('jr-lesson-tab-active');
                                        var label = (getCurrentLang() === 'ja') ? ('教訓 #' + (i + 1)) : ('Lesson #' + (i + 1));
                                        if (isActive) label += ' (Active)';
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
                                                                var stored = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
                                                                if (!(stored && stored.length > _weeklyGoalIdx_for_clones && stored[_weeklyGoalIdx_for_clones])) stored[_weeklyGoalIdx_for_clones] = stored[_weeklyGoalIdx_for_clones] || {};
                                                                if (!Array.isArray(stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids)) stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids = [];
                                                                stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids.unshift(newId);
                                                                localStorage.setItem('weeklyGoals', JSON.stringify(stored));
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
                            // Card header with emoji
                            var successHeader = document.createElement('div');
                            successHeader.className = 'jr-card-header';
                            successHeader.textContent = (getCurrentLang() === 'ja') ? 'うまくいった点' : 'What went well';
                            successDiv.appendChild(successHeader);
                            var successLabel = document.createElement('label');
                            successLabel.textContent = (getCurrentLang() === 'ja') ? 'うまくいった点はありますか？' : 'What went well?';
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
                            // Card header with emoji
                            var failureHeader = document.createElement('div');
                            failureHeader.className = 'jr-card-header';
                            failureHeader.textContent = (getCurrentLang() === 'ja') ? 'うまくいかなかった点' : 'What did not go well';
                            failureDiv.appendChild(failureHeader);
                            var failureLabel = document.createElement('label');
                            failureLabel.textContent = (getCurrentLang() === 'ja') ? 'うまくいかなかった点はありますか？' : 'What did not go well?';
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
                                    if (isActive) label += ' (Active)';
                                    var labelSpan = tab.querySelector('.jr-lesson-tab-label');
                                    if (labelSpan) {
                                        labelSpan.textContent = label;
                                    }
                                });
                            }
                            
                            function createLessonTabContent(focusVal, whenVal, dbId) {
                                var content = document.createElement('div');
                                content.className = 'jr-lesson-tab-content';
                                content.dataset.lessonTabIndex = _lessonTabContents.length;
                                if (dbId) content.dataset.objectLeId = dbId;
                                
                                // Focus question
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
                            
                            function addNewLessonTab(focusVal, whenVal, dbId) {
                                var tabNum = _lessonTabs.length + 1;
                                var label = (getCurrentLang() === 'ja') ? ('教訓 #' + tabNum) : ('Lesson #' + tabNum);
                                createLessonTab(label, false);
                                createLessonTabContent(focusVal || '', whenVal || '', dbId);
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
                                addNewLessonTab('', '');
                            });
                            
                            // Create the first lesson tab
                            createLessonTab((getCurrentLang() === 'ja') ? '教訓 #1' : 'Lesson #1', true);
                            createLessonTabContent('', '');
                            _lessonTabIndex++;
                            activateLessonTab(0);

                            infoWrap.appendChild(lessonDiv);
                            
                            // Create the first tab (Activity Process) - NO reflection card here
                            var firstTab = createTab((getCurrentLang() === 'ja') ? '活動プロセス' : 'Activity Process', false, true);
                            var firstContent = createTabContent();
                            // Activity log (itemWrap) will be added later in the results.forEach loop
                            // Do NOT add infoWrap to first tab - it's only for reflection tabs
                            _tabIndex++;
                            activateTab(0);
                            updateTabLabels();

                            // Always fetch canonical reflection row independently so debug output appears
                            try {
                                console.log('journal_report: fetching canonical reflection for', objectJournalId);
                                $.ajax({
                                    url: './php/get_object_journal_reflections.php',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: { object_journal_id: objectJournalId, debug: 1 },
                                    success: function (rres) {
                                        console.log('journal_report: reflection (always) response', rres);
                                        if (_reflectionsRendered) { console.log('journal_report: reflections already rendered (first fetch) - skipping'); return; }
                                        if (rres && Array.isArray(rres.reflections)) console.log('journal_report: reflections array', rres.reflections);
                                        try {
                                            // if reflections array present, create one tab per reflection (NOT in first Activity Process tab)
                                            if (rres && rres.success && Array.isArray(rres.reflections) && rres.reflections.length) {
                                                var refls = rres.reflections;
                                                // Create a new tab for each reflection
                                                for (var ri = 0; ri < refls.length; ri++) {
                                                    var rf = refls[ri];
                                                    try {
                                                        var clone = infoWrap.cloneNode(true);
                                                        var cidx = _jrInfoCloneIdx++;
                                                        var elemsWithId = clone.querySelectorAll('[id]');
                                                        elemsWithId.forEach(function(el){ var old = el.id; el.id = old + '_' + cidx; });
                                                        var addCont = clone.querySelector('#wr_additionalLessonsContainer'); if (addCont) addCont.id = 'wr_additionalLessonsContainer_' + cidx;
                                                        
                                                        // Create new tab for this reflection
                                                        var tabNum = _tabs.length; // First reflection will be tab #1 (since Activity Process is tab 0)
                                                        var tabLabel = (getCurrentLang() === 'ja') ? ('内省 #' + tabNum) : ('Reflection #' + tabNum);
                                                        createTab(tabLabel, false, false);
                                                        var content = createTabContent();
                                                        content.appendChild(clone);
                                                        _tabIndex++;
                                                        
                                                        wireInfoWrapInteractions(clone);
                                                        populateWrapWithReflection(clone, rf);
                                                    } catch(e) { console.warn('clone populate failed', e); }
                                                }
                                                // Update tab labels and activate the last (newest) tab
                                                updateTabLabels();
                                                activateTab(_tabs.length - 1);
                                                _reflectionsRendered = true;
                                            } else {
                                                // No reflections found - create first reflection tab
                                                try {
                                                    var clone = infoWrap.cloneNode(true);
                                                    var cidx = _jrInfoCloneIdx++;
                                                    var elemsWithId = clone.querySelectorAll('[id]');
                                                    elemsWithId.forEach(function(el){ var old = el.id; el.id = old + '_' + cidx; });
                                                    
                                                    var tabLabel = (getCurrentLang() === 'ja') ? '内省 #1' : 'Reflection #1';
                                                    createTab(tabLabel, false, false);
                                                    var content = createTabContent();
                                                    content.appendChild(clone);
                                                    _tabIndex++;
                                                    
                                                    wireInfoWrapInteractions(clone);
                                                    updateTabLabels();
                                                    activateTab(1); // Activate first reflection tab
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
                                            var whenEl = firstTabContent.querySelector('.wr-lesson-when');
                                            if (focusEl) focusEl.value = lf[0].lesson_learned || '';
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
                                            var whenEl = firstTabContent.querySelector('.wr-lesson-when');
                                            if (focusEl) focusEl.value = '';
                                            if (whenEl) whenEl.value = '';
                                        }
                                    }
                                    
                                    // Re-wire lesson tabs after populating (to bind events to newly created tabs)
                                    wireLessonTabs(wrap);
                                    
                                    // Activate the first lesson tab
                                    var firstLessonTab = wrap.querySelector('.jr-lesson-tab');
                                    if (firstLessonTab) firstLessonTab.click();
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
                                                            console.log('get_object_journal_reflections response', rres);
                                                            if (_reflectionsRendered) { console.log('journal_report: reflections already rendered (second fetch) - skipping'); return; }
                                                            if (rres && Array.isArray(rres.reflections)) console.log('get_object_journal_reflections reflections', rres.reflections);
                                                                try {
                                                                    // if reflections array present, render cards similarly to above
                                                                    if (rres && rres.success && Array.isArray(rres.reflections) && rres.reflections.length) {
                                                                        var refls = rres.reflections;
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
                                itemWrap.style.padding = '12px 14px';
                                itemWrap.style.margin = '12px 0';
                                itemWrap.style.background = '#fff';
                                // limit each item box height to keep modal compact
                                itemWrap.style.maxHeight = '360px';
                                itemWrap.style.overflowY = 'auto';

                                var heading = document.createElement('h4');
                                heading.textContent = (getCurrentLang() === 'ja') ? ('思考した問いノード：' + (item.display || '')) : ('Question node: ' + (item.display || ''));
                                heading.style.margin = '0 0 8px 0';
                                heading.style.fontWeight = 'bold';
                                heading.style.fontSize = '16px';
                                itemWrap.appendChild(heading);

                                // Build a table: left column = appeared_at, right column = content (with activity prefix)
                                var tbl = document.createElement('table');
                                tbl.style.width = '100%';
                                tbl.style.borderCollapse = 'collapse';
                                tbl.style.fontSize = '14px';
                                var tbody = document.createElement('tbody');

                                function formatRow(timeText, labelText, detailText) {
                                    var tr = document.createElement('tr');
                                    var tdTime = document.createElement('td');
                                    tdTime.textContent = timeText || '';
                                    tdTime.style.width = '160px';
                                    tdTime.style.padding = '8px 10px';
                                    tdTime.style.verticalAlign = 'top';
                                    tdTime.style.borderBottom = '1px solid ' + theme.border;

                                    var tdLabel = document.createElement('td');
                                    tdLabel.textContent = labelText || '';
                                    tdLabel.style.width = '220px';
                                    tdLabel.style.padding = '8px 10px';
                                    tdLabel.style.verticalAlign = 'top';
                                    tdLabel.style.borderBottom = '1px solid ' + theme.border;

                                    var tdDetail = document.createElement('td');
                                    tdDetail.textContent = detailText || '';
                                    tdDetail.style.padding = '8px 10px';
                                    tdDetail.style.verticalAlign = 'top';
                                    tdDetail.style.borderBottom = '1px solid ' + theme.border;

                                    tr.appendChild(tdTime);
                                    tr.appendChild(tdLabel);
                                    tr.appendChild(tdDetail);
                                    return tr;
                                }

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

                                    // For each object_node_id group, create a table and within it group by content
                                    objOrder.forEach(function (oid) {
                                        var grp = objGroups[oid];
                                        // (No object_node_id caption — display only representative content heading)

                                        // Group this object's histories by content (preserve appearance order)
                                        var contentGroups = {};
                                        var contentOrder = [];
                                        grp.forEach(function (h) {
                                            var key = (h.content || '').toString();
                                            if (typeof contentGroups[key] === 'undefined') { contentGroups[key] = []; contentOrder.push(key); }
                                            contentGroups[key].push(h);
                                        });

                                        // Instead of creating a heading per distinct content, show only one representative content
                                        // per object_node_id (use the latest history's content), then list all histories for that object below.
                                        var repContent = '';
                                        if (grp && grp.length) {
                                            var last = grp[grp.length - 1];
                                            repContent = (last && typeof last.content !== 'undefined') ? last.content : (item.display || '');
                                        } else {
                                            repContent = (item.display || '');
                                        }
                                        var contentHeading = repContent && repContent.toString().trim() ? repContent.toString() : ((getCurrentLang() === 'ja') ? '(内容なし)' : '(no content)');
                                        var labelPrefix = (getCurrentLang() === 'ja') ? '計画した手段：' : 'Planned means: ';
                                        var level = levels[oid] || 0;
                                        // If has parent within groups, show a parent label above
                                        if (level > 0) {
                                            var parentsArr = item.node_parents && item.node_parents[oid] ? item.node_parents[oid] : [];
                                            var displayParent = null;
                                            for (var pi = 0; pi < parentsArr.length; pi++) {
                                                var p = parentsArr[pi];
                                                if (repByOid[p]) { displayParent = repByOid[p]; break; }
                                            }
                                            if (displayParent) {
                                                var pdiv = document.createElement('div');
                                                pdiv.textContent = (getCurrentLang() === 'ja' ? '親: ' : 'Parent: ') + displayParent;
                                                pdiv.style.fontSize = '12px';
                                                pdiv.style.color = '#666';
                                                pdiv.style.margin = '4px 0';
                                                pdiv.style.paddingLeft = (level * 14) + 'px';
                                                itemWrap.appendChild(pdiv);
                                            }
                                        }

                                        var ch = document.createElement('div');
                                        ch.style.display = 'flex';
                                        ch.style.alignItems = 'center';
                                        ch.style.justifyContent = 'space-between';
                                        ch.style.cursor = 'pointer';
                                        ch.style.margin = '6px 0 6px 0';
                                        ch.style.paddingLeft = (level * 14) + 'px';
                                        ch.style.transition = 'background 0.18s ease, box-shadow 0.18s ease, transform 0.08s ease';
                                        ch.style.borderRadius = '6px';

                                        var chText = document.createElement('div');
                                        chText.textContent = labelPrefix + contentHeading;
                                        chText.style.fontWeight = '600';
                                        chText.style.flex = '1';
                                        chText.style.color = theme.text;
                                        ch.appendChild(chText);

                                        var chIcon = document.createElement('div');
                                        chIcon.textContent = '\u25B6'; // triangle arrow ▶
                                        chIcon.style.marginLeft = '12px';
                                        chIcon.style.fontWeight = '700';
                                        chIcon.style.color = theme.muted;
                                        chIcon.style.transition = 'transform 0.25s ease, color 0.15s ease';
                                        chIcon.style.transform = 'rotate(0deg)';
                                        ch.appendChild(chIcon);

                                        // Hover and focus affordances to indicate clickability
                                        ch.addEventListener('mouseenter', function () {
                                            ch.style.background = 'rgba(43,122,120,0.06)';
                                            ch.style.boxShadow = '0 6px 14px rgba(35,48,67,0.06)';
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
                                        detailsDiv.style.overflow = 'hidden';
                                        detailsDiv.style.maxHeight = '0px';
                                        detailsDiv.style.opacity = '0';
                                        detailsDiv.style.transition = 'max-height 0.28s ease, opacity 0.18s ease';

                                        // iterate over all histories in grp (preserves chronological order)
                                        grp.forEach(function (h) {
                                            var timeText = h.appeared_at || '';
                                            var prefix = '';
                                            var detail = '';
                                            try {
                                                var act = (typeof h.activity !== 'undefined') ? parseInt(h.activity, 10) : 0;
                                                if (act && act > 0) prefix = (getCurrentLang() === 'ja') ? (mapJa[act] || '') : (mapEn[act] || '');
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
                                                } else {
                                                    detail = '';
                                                }
                                            } catch (e) { detail = ''; }

                                            var labelText = prefix || '';
                                            var detailText = detail || '';
                                            innerTbody.appendChild(formatRow(timeText, labelText, detailText));
                                        });

                                        innerTbl.appendChild(innerTbody);
                                        detailsDiv.appendChild(innerTbl);
                                        // header click toggles the details
                                        // toggle with smooth height animation and keyboard support
                                        var openDetails = function () {
                                            detailsDiv.style.display = 'block';
                                            // allow layout then set maxHeight to scrollHeight
                                            var sh = detailsDiv.scrollHeight || (innerTbl ? innerTbl.scrollHeight + 20 : 300);
                                            detailsDiv.style.maxHeight = sh + 'px';
                                            detailsDiv.style.opacity = '1';
                                            chIcon.style.transform = 'rotate(90deg)';
                                            chIcon.style.color = theme.primary;
                                        };
                                        var closeDetails = function () {
                                            detailsDiv.style.maxHeight = '0px';
                                            detailsDiv.style.opacity = '0';
                                            chIcon.style.transform = 'rotate(0deg)';
                                            chIcon.style.color = theme.muted;
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

                                        itemWrap.appendChild(ch);
                                        itemWrap.appendChild(detailsDiv);
                                    });
                                } else if (item.content && item.content.length) {
                                    // No histories; render each item.content as a heading with an empty row
                                    item.content.forEach(function (contentEntry) {
                                        var contentHeading = contentEntry && contentEntry.toString().trim() ? contentEntry.toString() : ((getCurrentLang() === 'ja') ? '(内容なし)' : '(no content)');
                                        var sh = document.createElement('div');
                                        sh.textContent = contentHeading;
                                        sh.style.fontWeight = '600';
                                        sh.style.margin = '8px 0 6px 0';
                                        itemWrap.appendChild(sh);
                                        var emTbl = document.createElement('table');
                                        var emTbody = document.createElement('tbody');
                                        emTbody.appendChild(formatRow('', '', ''));
                                        emTbl.appendChild(emTbody);
                                        itemWrap.appendChild(emTbl);
                                    });
                                } else {
                                    tbody.appendChild(formatRow('', '', (getCurrentLang() === 'ja') ? '(該当データなし)' : '(no data)'));
                                }

                                tbl.appendChild(tbody);
                                itemWrap.appendChild(tbl);
                                // Add to first tab (Activity Process) only
                                if (_tabContents.length > 0 && _tabContents[0]) {
                                    _tabContents[0].appendChild(itemWrap);
                                }
                            });

                            // Wire download link click event
                            dlLink.onclick = function (e) {
                                e.preventDefault();
                                // read editable fields (split evaluation + lessons)
                                var successPoints = (document.getElementById('wr_successPoints') ? document.getElementById('wr_successPoints').value : '').trim();
                                var failurePoints = (document.getElementById('wr_failurePoints') ? document.getElementById('wr_failurePoints').value : '').trim();
                                var cr = (document.getElementById('wr_attribution_good') ? document.getElementById('wr_attribution_good').value : '').trim();
                                var focus = (document.getElementById('wr_lesson_focus') ? document.getElementById('wr_lesson_focus').value : '').trim();
                                var when = (document.getElementById('wr_lesson_when') ? document.getElementById('wr_lesson_when').value : '').trim();
                                var mainLesson = focus;
                                if (when) mainLesson = mainLesson ? mainLesson + '\n\n' + when : when;
                                // gather extras
                                var extras = [];
                                try {
                                    var addWrappers = document.querySelectorAll('.wr-additional-lesson-wrap');
                                    if (addWrappers && addWrappers.length) {
                                        addWrappers.forEach(function (w) {
                                            try {
                                                var f = w.querySelector('.wr-additional-lesson-focus');
                                                var when = w.querySelector('.wr-additional-lesson-when');
                                                var fv = (f && f.value) ? f.value.trim() : '';
                                                var wv = (when && when.value) ? when.value.trim() : '';
                                                var combined = fv;
                                                if (wv) combined = combined ? (combined + '\n\n' + wv) : wv;
                                                if (combined) extras.push(combined);
                                            } catch (e) { }
                                        });
                                    }
                                } catch (e) { }
                                var combinedLessons = mainLesson || '';
                                if (extras.length) {
                                    if (combinedLessons) combinedLessons = combinedLessons + '\n\n' + extras.join('\n\n');
                                    else combinedLessons = extras.join('\n\n');
                                }

                                function escapeHtml(str) {
                                    if (!str && str !== 0) return '';
                                    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/\'/g, '&#39;');
                                }

                                function nl2br_escaped(s) {
                                    return escapeHtml(s).replace(/\r\n|\n|\r/g, '<br>');
                                }

                                var html = '<html><head><meta charset="utf-8"><title>Weekly Goal Report</title></head><body>';
                                html += '<h2>' + escapeHtml((getCurrentLang() === 'ja') ? ('週次レポート (' + (startDate || '') + ' ~ ' + (endDate || '') + ')') : ('Weekly Goal Report (' + (startDate || '') + ' ~ ' + (endDate || '') + ')')) + '</h2>';
                                // include evaluation split and lessons
                                if (successPoints) {
                                    html += '<h3>' + escapeHtml((getCurrentLang() === 'ja') ? 'うまくいった点' : 'What went well') + '</h3>';
                                    html += '<p>' + nl2br_escaped(successPoints) + '</p>';
                                }
                                if (failurePoints) {
                                    html += '<h3>' + escapeHtml((getCurrentLang() === 'ja') ? 'うまくいかなかった点' : 'What did not go well') + '</h3>';
                                    html += '<p>' + nl2br_escaped(failurePoints) + '</p>';
                                }
                                if (cr && cr.trim()) {
                                    html += '<h3>' + escapeHtml((getCurrentLang() === 'ja') ? '完了理由 (attribution)' : 'Completion reason') + '</h3>';
                                    html += '<p>' + nl2br_escaped(cr) + '</p>';
                                }
                                if (combinedLessons && combinedLessons.trim()) {
                                    html += '<h3>' + escapeHtml((getCurrentLang() === 'ja') ? '学び・教訓 (application)' : 'Challenges & Learnings') + '</h3>';
                                    html += '<p>' + nl2br_escaped(combinedLessons) + '</p>';
                                }

                                results.forEach(function (item) {
                                    html += '<h3>' + escapeHtml(item.display || '') + '</h3>';
                                    // group histories by their raw content and render each content as a heading
                                    var mapJa = { 1: '手段設定', 2: 'ラベル変更', 3: '理由記述', 4: '完了時間記述', 5: '手段開始', 6: '手段中断', 7: '手段終了', 8: '内省記述' };
                                    var mapEn = { 1: 'Means set', 2: 'Label change', 3: 'Reason recorded', 4: 'Completion time recorded', 5: 'Means started', 6: 'Means interrupted', 7: 'Means finished', 8: 'Reflection recorded' };

                                    if (item.histories && item.histories.length) {
                                        // Group histories by object_node_id then by content, and render each group as a heading + table
                                        var objGroups = {};
                                        item.histories.forEach(function (h) {
                                            var oid = h.object_node_id || '';
                                            if (typeof objGroups[oid] === 'undefined') { objGroups[oid] = []; }
                                            objGroups[oid].push(h);
                                        });

                                        // Determine object order: prefer server-provided ordered_object_node_ids
                                        var objOrder = [];
                                        if (item.ordered_object_node_ids && Array.isArray(item.ordered_object_node_ids) && item.ordered_object_node_ids.length) {
                                            objOrder = item.ordered_object_node_ids.filter(function (id) { return typeof objGroups[id] !== 'undefined'; });
                                            Object.keys(objGroups).forEach(function (k) { if (objOrder.indexOf(k) === -1) objOrder.push(k); });
                                        } else {
                                            Object.keys(objGroups).forEach(function (k) { objOrder.push(k); });
                                        }

                                        objOrder.forEach(function (oid) {
                                            // omit object_node_id caption in export
                                            // group by content
                                            var contentGroups = {};
                                            var contentOrder = [];
                                            objGroups[oid].forEach(function (h) {
                                                var key = (h.content || '').toString();
                                                if (typeof contentGroups[key] === 'undefined') { contentGroups[key] = []; contentOrder.push(key); }
                                                contentGroups[key].push(h);
                                            });

                                            // Show only one representative content per object_node_id (use latest history's content), then list all histories
                                            var repKey = '';
                                            if (objGroups[oid] && objGroups[oid].length) {
                                                var lastH = objGroups[oid][objGroups[oid].length - 1];
                                                repKey = (lastH && typeof lastH.content !== 'undefined') ? lastH.content : (item.display || '');
                                            } else {
                                                repKey = (item.display || '');
                                            }
                                            var contentHeading = repKey && repKey.toString().trim() ? repKey.toString() : ((getCurrentLang() === 'ja') ? '(内容なし)' : '(no content)');
                                            var labelPrefix = (getCurrentLang() === 'ja') ? '計画した手段：' : 'Planned means: ';

                                            // Build repByOid and levels for export (similar to modal)
                                            // repByOid
                                            var repByOidExport = {};
                                            Object.keys(objGroups).forEach(function (k) {
                                                var g = objGroups[k];
                                                var rep = '';
                                                if (g && g.length) {
                                                    var last = g[g.length - 1];
                                                    rep = (last && typeof last.content !== 'undefined') ? last.content : (item.display || '');
                                                } else {
                                                    rep = item.display || '';
                                                }
                                                repByOidExport[k] = rep;
                                            });

                                            var nodeParentsExp = item.node_parents || {};
                                            var nodeChildrenExp = item.node_children || {};
                                            var levelsExp = {};
                                            var rootsExp = [];
                                            Object.keys(objGroups).forEach(function (n) {
                                                var parents = nodeParentsExp[n] || [];
                                                var hasParent = false;
                                                for (var pi = 0; pi < parents.length; pi++) {
                                                    if (typeof objGroups[parents[pi]] !== 'undefined') { hasParent = true; break; }
                                                }
                                                if (!hasParent) { rootsExp.push(n); levelsExp[n] = 0; }
                                            });
                                            var qexp = rootsExp.slice();
                                            while (qexp.length) {
                                                var ccur = qexp.shift();
                                                var children = nodeChildrenExp[ccur] || [];
                                                children.forEach(function (ch) {
                                                    if (typeof objGroups[ch] === 'undefined') return;
                                                    var parentLevels = [];
                                                    var plist = nodeParentsExp[ch] || [];
                                                    for (var pidx = 0; pidx < plist.length; pidx++) { var pp = plist[pidx]; if (typeof levelsExp[pp] !== 'undefined') parentLevels.push(levelsExp[pp]); }
                                                    var newL = parentLevels.length ? (Math.min.apply(null, parentLevels) + 1) : (levelsExp[ccur] + 1);
                                                    if (typeof levelsExp[ch] === 'undefined' || newL < levelsExp[ch]) { levelsExp[ch] = newL; qexp.push(ch); }
                                                });
                                            }
                                            Object.keys(objGroups).forEach(function (n) { if (typeof levelsExp[n] === 'undefined') levelsExp[n] = 0; });

                                            var indent = levelsExp[oid] || 0;
                                            var indentHtml = new Array(indent + 1).join('&nbsp;&nbsp;&nbsp;&nbsp;');
                                            // parent label if exists
                                            if (indent > 0) {
                                                var parentsArr = item.node_parents && item.node_parents[oid] ? item.node_parents[oid] : [];
                                                var displayParent = null;
                                                for (var pi2 = 0; pi2 < parentsArr.length; pi2++) { var p2 = parentsArr[pi2]; if (repByOidExport[p2]) { displayParent = repByOidExport[p2]; break; } }
                                                if (displayParent) {
                                                    html += '<div style="color:#666;font-size:12px;margin-bottom:4px;">' + escapeHtml((getCurrentLang() === 'ja') ? '親: ' : 'Parent: ') + nl2br_escaped(displayParent) + '</div>';
                                                }
                                            }

                                            html += '<h5>' + indentHtml + nl2br_escaped(labelPrefix + contentHeading) + '</h5>';
                                            html += '<table style="width:100%;border-collapse:collapse"><tbody>';
                                            // iterate all histories under this object (objGroups[oid]) and render rows
                                            objGroups[oid].forEach(function (h) {
                                                var prefix = '';
                                                var detail = '';
                                                try {
                                                    var act = (typeof h.activity !== 'undefined') ? parseInt(h.activity, 10) : 0;
                                                    if (act && act > 0) prefix = (getCurrentLang() === 'ja') ? (mapJa[act] || '') : (mapEn[act] || '');
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
                                                    } else {
                                                        detail = '';
                                                    }
                                                } catch (e) { detail = ''; }
                                                var timeText = h.appeared_at || '';
                                                var midHtml = prefix || '';
                                                var detailHtml = detail || '';
                                                html += '<tr>' +
                                                    '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top;width:160px">' + nl2br_escaped(timeText) + '</td>' +
                                                    '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top;width:220px">' + nl2br_escaped(midHtml) + '</td>' +
                                                    '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top">' + nl2br_escaped(detailHtml) + '</td>' +
                                                    '</tr>';
                                            });
                                            html += '</tbody></table>';
                                        });
                                    } else if (item.content && item.content.length) {
                                        item.content.forEach(function (contentEntry) {
                                            var contentHeading = contentEntry && contentEntry.toString().trim() ? contentEntry.toString() : ((getCurrentLang() === 'ja') ? '(内容なし)' : '(no content)');
                                            html += '<h4>' + nl2br_escaped(contentHeading) + '</h4>';
                                            html += '<table style="width:100%"><tbody><tr><td>' + escapeHtml((getCurrentLang() === 'ja') ? '(該当データなし)' : '(no data)') + '</td></tr></tbody></table>';
                                        });
                                    } else {
                                        html += '<table style="width:100%"><tbody><tr><td>' + escapeHtml((getCurrentLang() === 'ja') ? '(該当データなし)' : '(no data)') + '</td></tr></tbody></table>';
                                    }
                                });
                                html += '</body></html>';
                                var blob = new Blob([html], { type: 'application/msword' });
                                var url = URL.createObjectURL(blob);
                                var a = document.createElement('a');
                                a.href = url;
                                a.download = 'weekly_goal_report_' + (startDate || '') + '-' + (endDate || '') + '.doc';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                document.body.removeChild(modal);
                            };

                            // Ensure the textarea block (`infoWrap`) is placed correctly.
                            // Note: infoWrap is now inside tabContentContainer, no need to move it.

                            // Helper to save a specific wrapper
                            function saveWrapper(wrap) {
                                try {
                                    var object_journal_id = objectJournalId || null;
                                    if (!object_journal_id) {
                                        alert((getCurrentLang() === 'ja') ? 'object_journal_id が見つかりません' : 'object_journal_id not found');
                                        return;
                                    }

                                    // Determine index of this wrapper
                                    var allWraps = Array.from(modal.querySelectorAll('.jr-info-wrap'));
                                    var wrapIdx = allWraps.indexOf(wrap);
                                    if (wrapIdx === -1) wrapIdx = 0; // fallback

                                    // Gather fields from this wrap using classes
                                    var spEl = wrap.querySelector('.wr-successPoints');
                                    var fbEl = wrap.querySelector('.wr-failurePoints');
                                    var crEl = wrap.querySelector('.wr-completionReason');
                                    var agEl = wrap.querySelector('.wr-attribution-good');
                                    var abEl = wrap.querySelector('.wr-attribution-bad');

                                    var successPoints = spEl ? (spEl.value || '').trim() : '';
                                    var failurePoints = fbEl ? (fbEl.value || '').trim() : '';
                                    var completionReasonVal = crEl ? (crEl.value || '').trim() : '';
                                    var attributionGoodVal = agEl ? (agEl.value || '').trim() : '';
                                    var attributionBadVal = abEl ? (abEl.value || '').trim() : '';

                                    // Collect lessons from lesson tabs
                                    var lessonsArr = [];
                                    try {
                                        var lessonTabContents = wrap.querySelectorAll('.jr-lesson-tab-content');
                                        if (lessonTabContents && lessonTabContents.length) {
                                            lessonTabContents.forEach(function (tc) {
                                                try {
                                                    var focusEl = tc.querySelector('.wr-lesson-focus');
                                                    var whenEl = tc.querySelector('.wr-lesson-when');
                                                    var fv = (focusEl && focusEl.value) ? focusEl.value.trim() : '';
                                                    var wv = (whenEl && whenEl.value) ? whenEl.value.trim() : '';
                                                    var dbId = tc.dataset.objectLeId || '';
                                                    if (fv || wv) lessonsArr.push({ lesson: fv, opportunity: wv, dbId: dbId });
                                                } catch (e) { }
                                            });
                                        }
                                    } catch (e) { /* ignore */ }
                                    
                                    // Extract first lesson for legacy fields
                                    var focus = lessonsArr.length > 0 ? (lessonsArr[0].lesson || '') : '';
                                    var when = lessonsArr.length > 0 ? (lessonsArr[0].opportunity || '') : '';
                                    var extrasArr = lessonsArr.slice(1);

                                    var promises = [];

                                    // 1. If this is the main wrapper (index 0), update object_goal fields (legacy)
                                    if (wrapIdx === 0) {
                                        // Reconstruct legacy "application" string
                                        var mainLesson = focus;
                                        if (when) mainLesson = mainLesson ? mainLesson + '\n\n' + when : when;
                                        // Legacy extra strings
                                        var extrasStrings = extrasArr.map(function (x) { return x.lesson + (x.opportunity ? '\n\n' + x.opportunity : ''); }).filter(Boolean);
                                        var combinedApplication = mainLesson || '';
                                        if (extrasStrings.length) {
                                            if (combinedApplication) combinedApplication = combinedApplication + '\n\n' + extrasStrings.join('\n\n');
                                            else combinedApplication = extrasStrings.join('\n\n');
                                        }

                                        var data = {
                                            object_journal_id: object_journal_id,
                                            evaluation_good: successPoints,
                                            evaluation_bad: failurePoints,
                                            // keep legacy keys
                                            success_points: successPoints,
                                            failure_points: failurePoints,
                                            // legacy attribution column now carries good-attribution value
                                            attribution: attributionGoodVal,
                                            // include explicit good/bad attribution so server can persist/append them
                                            attribution_good: attributionGoodVal,
                                            attribution_bad: attributionBadVal,
                                            start_date: startDate,
                                            finish_date: endDate,
                                            node_id: goal.node_id || '',
                                            appeared_at: goal.appeared_at || '',
                                            update_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                                            deleted: (typeof goal.deleted !== 'undefined') ? goal.deleted : 0
                                        };
                                        var ajaxUrl = './php/update_object_goal_fields.php';
                                        promises.push(new Promise(function (resolve, reject) {
                                            $.ajax({
                                                url: ajaxUrl, type: 'POST', data: data, dataType: 'json',
                                                success: function (res) {
                                                    if (res && res.success) {
                                                        try {
                                                            if (goalHelpers && typeof goalHelpers.fetchWeeklyGoalsFromDB === 'function') goalHelpers.fetchWeeklyGoalsFromDB();
                                                        } catch (e) { }
                                                        resolve(res);
                                                    } else {
                                                        reject(res);
                                                    }
                                                },
                                                error: function (xhr, st, err) { reject(err); }
                                            });
                                        }));
                                    }

                                    // 2. Insert/Update Reflection for this wrapper
                                    var mainLessonText = focus || '';
                                    if (when) mainLessonText = mainLessonText ? (mainLessonText + '\n\n' + when) : when;
                                    var reflectionText = mainLessonText;
                                    var extraStringsRef = extrasArr.map(function (x) { return x.lesson + (x.opportunity ? '\n\n' + x.opportunity : ''); });
                                    if (extraStringsRef.length) {
                                        reflectionText = reflectionText ? (reflectionText + '\n\n' + extraStringsRef.join('\n\n')) : extraStringsRef.join('\n\n');
                                    }

                                    var refPayload = {
                                        object_journal_id: object_journal_id,
                                        evaluation_good: successPoints,
                                        evaluation_bad: failurePoints,
                                        // ensure legacy `attribution` column contains the 'good' attribution
                                        attribution: attributionGoodVal,
                                        attribution_good: attributionGoodVal,
                                        attribution_bad: attributionBadVal,
                                        reflection_text: reflectionText,
                                        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                                        debug: 1
                                    };
                                    // structured lessons
                                    try {
                                        refPayload.lessons = JSON.stringify([].concat([{ lesson: focus, opportunity: when }].filter(function (x) { return x.lesson || x.opportunity; })).concat(extrasArr));
                                    } catch (e) { refPayload.lessons = '[]'; }

                                    // Existing ID?
                                    var stored = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
                                    var existingReflectionIds = [];
                                    if (stored && stored.length > idx && stored[idx] && Array.isArray(stored[idx].object_journal_reflection_ids)) {
                                        existingReflectionIds = stored[idx].object_journal_reflection_ids.slice();
                                    }
                                    // Prefer any reflection id attached to this wrapper via data- attribute (clone / prior save)
                                    try {
                                        var wrapRefId = wrap.dataset && wrap.dataset.objectJournalReflectionId ? wrap.dataset.objectJournalReflectionId : null;
                                        // If wrapRefId is a temp id (starts with 'temp-'), treat as no existing id (will INSERT)
                                        if (wrapRefId && typeof wrapRefId === 'string' && wrapRefId.indexOf('temp-') !== 0) {
                                            refPayload.object_journal_reflection_id = wrapRefId;
                                        } else if (existingReflectionIds[wrapIdx]) {
                                            refPayload.object_journal_reflection_id = existingReflectionIds[wrapIdx];
                                        }
                                    } catch (e) {
                                        if (existingReflectionIds[wrapIdx]) refPayload.object_journal_reflection_id = existingReflectionIds[wrapIdx];
                                    }

                                    promises.push(new Promise(function (resolve, reject) {
                                        $.ajax({
                                            url: './php/insert_object_journal_reflection.php', type: 'POST', data: refPayload, dataType: 'json',
                                            success: function (rres) {
                                                if (rres && rres.success && rres.object_journal_reflection_id) {
                                                    // Update stored ID and attach id to wrapper so future saves target the same row
                                                    try {
                                                        var s2 = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
                                                        if (!(s2 && s2.length > idx && s2[idx])) s2[idx] = s2[idx] || {};
                                                        if (!s2[idx].object_journal_reflection_ids) s2[idx].object_journal_reflection_ids = [];
                                                        // Ensure size
                                                        while (s2[idx].object_journal_reflection_ids.length <= wrapIdx) s2[idx].object_journal_reflection_ids.push(null);
                                                        s2[idx].object_journal_reflection_ids[wrapIdx] = rres.object_journal_reflection_id;
                                                        localStorage.setItem('weeklyGoals', JSON.stringify(s2));
                                                    } catch (e) { console.warn('persist id fail', e); }
                                                    try { if (wrap && wrap.dataset) wrap.dataset.objectJournalReflectionId = rres.object_journal_reflection_id; } catch (e) {}
                                                    resolve(rres);
                                                } else {
                                                    reject(rres);
                                                }
                                            },
                                            error: function (xhr, st, err) { reject(err); }
                                        });
                                    }));

                                    Promise.all(promises).then(function () {
                                        alert((getCurrentLang() === 'ja') ? '保存しました' : 'Saved');
                                    }).catch(function (e) {
                                        console.warn('save failed', e);
                                        alert((getCurrentLang() === 'ja') ? '保存に失敗しました' : 'Save failed');
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
                            saveBtnV.textContent = (getCurrentLang() === 'ja') ? '保存' : 'Save';
                            saveBtnV.style.display = 'inline-block';
                            saveBtnV.style.marginTop = '12px';
                            saveBtnV.style.padding = '6px 16px';
                            saveBtnV.style.background = theme.primary;
                            saveBtnV.style.color = '#fff';
                            saveBtnV.style.border = 'none';
                            saveBtnV.style.borderRadius = '6px';
                            saveBtnV.style.cursor = 'pointer';

                            infoWrap.appendChild(saveBtnV); // Append to the wrapper

                            // Bind the save button for this initial wrapper
                            saveBtnV.addEventListener('click', function () {
                                saveWrapper(infoWrap);
                            });
                            var closeBtn = document.createElement('button');
                            closeBtn.textContent = (getCurrentLang() === 'ja') ? '閉じる' : 'Close';
                            closeBtn.style.marginLeft = '8px';
                            closeBtn.style.padding = '8px 24px';
                            closeBtn.style.background = '#d0d6da';
                            closeBtn.style.color = '#233043';
                            closeBtn.style.border = 'none';
                            closeBtn.style.borderRadius = '8px';
                            closeBtn.style.fontSize = '15px';
                            closeBtn.style.cursor = 'pointer';
                            closeBtn.style.boxShadow = 'none';
                            closeBtn.onclick = function () { document.body.removeChild(modal); };
                            modalContent.appendChild(closeBtn);
                            closeBtn.addEventListener('mouseenter', function () {
                                closeBtn.style.filter = 'brightness(0.98)';
                                closeBtn.style.transform = 'translateY(-1px)';
                            });
                            closeBtn.addEventListener('mouseleave', function () {
                                closeBtn.style.filter = '';
                                closeBtn.style.transform = '';
                            });

                            modal.appendChild(modalContent);
                            document.body.appendChild(modal);
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
