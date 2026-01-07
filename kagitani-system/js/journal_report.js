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
                        try { console.log('journal_report: node_ids', nodeIds); if (Array.isArray(nodeIds)) nodeIds.forEach(function (n) { console.log('journal_report: node_id', n); }); } catch (e) { console.warn('journal_report: failed to log node_ids', e); }
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
                            modalContent.appendChild(title);

                            var periodHeading = document.createElement('h3');
                            periodHeading.className = 'jr-period-heading';
                            periodHeading.textContent = (startDate || '') + '~' + (endDate || '') + ((getCurrentLang() === 'ja') ? 'に行ったこと' : ' activities');
                            modalContent.appendChild(periodHeading);

                            // Add editable areas: split evaluation into success/failure, completion reason, and allow multiple lessons
                            var infoWrap = document.createElement('div');
                            infoWrap.className = 'jr-info-wrap';

                            // Add a button above the infoWrap to allow adding reflections
                            var addReflectionBtn = document.createElement('button');
                            addReflectionBtn.type = 'button';
                            addReflectionBtn.id = 'wr_btnAddReflection';
                            addReflectionBtn.className = 'jr-add-reflection-btn';
                            addReflectionBtn.textContent = (getCurrentLang() === 'ja') ? '内省追加' : 'Add Reflection';
                            addReflectionBtn.style.display = 'inline-block';
                            addReflectionBtn.style.margin = '8px 0';
                            // counter for clones (start at 1 because original is baseline)
                            var _jrInfoCloneIdx = 1;
                            function wireInfoWrapInteractions(wrap) {
                                try {
                                    // wire its add button to create additional lesson pairs scoped to this wrap
                                    var localAddBtn = wrap.querySelector('.jr-add-btn');
                                    var localContainer = wrap.querySelector('#wr_additionalLessonsContainer') || wrap.querySelector('.jr-additional-container');
                                    if (localAddBtn) {
                                        localAddBtn.addEventListener('click', function () {
                                            try {
                                                var fld = makeAdditionalLessonField('', '');
                                                if (localContainer) localContainer.appendChild(fld);
                                                var ta = fld.querySelector('textarea'); if (ta) ta.focus();
                                            } catch (e) { console.warn('local add lesson error', e); }
                                        });
                                    }
                                    // wire remove buttons for any existing additional items inside this wrap
                                    var removeBtns = wrap.querySelectorAll('.jr-remove-btn');
                                    removeBtns.forEach(function (btn) {
                                        // avoid binding twice
                                        if (btn.__bound) return; btn.__bound = true;
                                        btn.addEventListener('click', function () {
                                            try {
                                                if (!confirm((getCurrentLang() === 'ja') ? '本当に削除しますか？' : 'Remove this lesson?')) return;
                                                var wrapEl = btn.closest('.wr-additional-lesson-wrap');
                                                if (!wrapEl) return;
                                                var leId = wrapEl.dataset.objectLeId;
                                                if (leId) {
                                                    $.ajax({ url: 'php/delete_lesson.php', type: 'POST', dataType: 'json', data: { object_le_id: leId }, success: function (res) { if (res && res.success) wrapEl.remove(); else { alert((getCurrentLang() === 'ja') ? '教訓の削除に失敗しました' : 'Failed to delete lesson'); } }, error: function () { alert((getCurrentLang() === 'ja') ? '教訓の削除に失敗しました' : 'Failed to delete lesson'); } });
                                                } else {
                                                    wrapEl.remove();
                                                }
                                            } catch (e) { console.warn('remove additional lesson error', e); }
                                        });
                                    });
                                } catch (e) { console.warn('wireInfoWrapInteractions failed', e); }
                            }

                            // capture the weeklyGoals index for use when persisting new reflections
                            var _weeklyGoalIdx_for_clones = idx;
                            addReflectionBtn.addEventListener('click', function () {
                                try {
                                    // clone the infoWrap visually and insert before the download button
                                    if (!infoWrap) return;
                                    var clone = infoWrap.cloneNode(true);
                                    // rename any ids inside clone to avoid duplicate ids (append index)
                                    var cloneIdx = _jrInfoCloneIdx++;
                                    var elemsWithId = clone.querySelectorAll('[id]');
                                    elemsWithId.forEach(function (el) {
                                        var old = el.id;
                                        el.id = old + '_' + cloneIdx;
                                    });
                                    // set header text for clone to show ordinal
                                    var headerEl = clone.querySelector('.jr-info-header');
                                    if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja') ? ('内省 #' + (cloneIdx + 1)) : ('Reflection #' + (cloneIdx + 1));
                                    // clear any persisted ids on the clone so it becomes a fresh entry
                                    try {
                                        // remove any data attributes that would tie clone to existing DB rows
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
                                    // ensure additional container id for cloned wrap exists uniquely
                                    var addCont = clone.querySelector('#wr_additionalLessonsContainer');
                                    if (addCont) addCont.id = 'wr_additionalLessonsContainer_' + idx;
                                    // insert clone at the top of existing info cards (before the first .jr-info-wrap)
                                    var firstWrap = modalContent.querySelector('.jr-info-wrap');
                                    if (firstWrap) {
                                        modalContent.insertBefore(clone, firstWrap);
                                    } else if (typeof dlBtn !== 'undefined' && dlBtn.parentNode) {
                                        // fallback: insert before download button
                                        dlBtn.parentNode.insertBefore(clone, dlBtn);
                                    } else {
                                        modalContent.appendChild(clone);
                                    }
                                    // wire interactions in the clone
                                    wireInfoWrapInteractions(clone);
                                    // ensure cloned wrapper does not carry an object_journal_reflection id
                                    try { clone.dataset.objectJournalReflectionId = ''; } catch(e){}

                                    // Create a new reflection row on the server immediately and attach returned id to clone.
                                    try {
                                        // show temporary unsaved label while awaiting server
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
                                                        // persist into localStorage.weeklyGoals at position 0 for this weekly index
                                                        try {
                                                            var stored = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
                                                            if (!(stored && stored.length > _weeklyGoalIdx_for_clones && stored[_weeklyGoalIdx_for_clones])) stored[_weeklyGoalIdx_for_clones] = stored[_weeklyGoalIdx_for_clones] || {};
                                                            if (!Array.isArray(stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids)) stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids = [];
                                                            // insert at front
                                                            stored[_weeklyGoalIdx_for_clones].object_journal_reflection_ids.unshift(newId);
                                                            localStorage.setItem('weeklyGoals', JSON.stringify(stored));
                                                        } catch(e) { console.warn('failed to persist new reflection id on clone', e); }
                                                        // update header to show saved id
                                                        try { if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja' ? '内省' : 'Reflection') + ' — 保存済み (' + newId + ')'; } catch(e){}
                                                    } else {
                                                        console.warn('create reflection on add failed', resp);
                                                        try { if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja' ? '内省' : 'Reflection') + ' — 作成失敗'; } catch(e){}
                                                    }
                                                } catch(e) { console.warn('handle create resp failed', e); }
                                            },
                                            error: function(xhr, st, err) { console.warn('create reflection ajax failed', st, err); try { if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja' ? '内省' : 'Reflection') + ' — 作成失敗'; } catch(e){} }
                                        });
                                    } catch(e) { console.warn('create reflection on clone failed', e); }
                                } catch (e) { console.warn('wr add reflection button failed', e); }
                            });

                            // Info card header
                            var infoHeader = document.createElement('div');
                            infoHeader.className = 'jr-info-header';
                            infoHeader.textContent = (getCurrentLang() === 'ja') ? '内省' : 'Reflection';
                            infoHeader.style.fontWeight = '700';
                            infoHeader.style.marginBottom = '8px';

                            // Success / Failure side-by-side
                            var evalWrap = document.createElement('div');
                            evalWrap.className = 'jr-eval-wrap';

                            var successDiv = document.createElement('div');
                            successDiv.className = 'jr-success-div';
                            var successLabel = document.createElement('label');
                            successLabel.textContent = (getCurrentLang() === 'ja') ? 'うまくいった点はありますか？' : 'What went well?';
                            successLabel.className = 'jr-label';
                            var successTa = document.createElement('textarea');
                            successTa.id = 'wr_successPoints';
                            successTa.rows = 4;
                            successTa.className = 'jr-textarea wr-successPoints';
                            successDiv.appendChild(successLabel);
                            successDiv.appendChild(successTa);

                            var failureDiv = document.createElement('div');
                            failureDiv.className = 'jr-failure-div';
                            var failureLabel = document.createElement('label');
                            failureLabel.textContent = (getCurrentLang() === 'ja') ? 'うまくいかなかった点はありますか？' : 'What did not go well?';
                            failureLabel.className = 'jr-label';
                            var failureTa = document.createElement('textarea');
                            failureTa.id = 'wr_failurePoints';
                            failureTa.rows = 4;
                            failureTa.className = 'jr-textarea wr-failurePoints';
                            failureDiv.appendChild(failureLabel);
                            failureDiv.appendChild(failureTa);

                            evalWrap.appendChild(successDiv);
                            evalWrap.appendChild(failureDiv);
                            // insert header then evaluation block
                            infoWrap.appendChild(infoHeader);
                            infoWrap.appendChild(evalWrap);

                            // Completion reason
                            var completionDiv = document.createElement('div');
                            completionDiv.className = 'jr-completion-div';
                            var completionLabel = document.createElement('label');
                            completionLabel.textContent = (getCurrentLang() === 'ja') ? '原因帰属：そのような結果になった理由は何だと思いますか？' : 'Completion reason';
                            completionLabel.className = 'jr-label';
                            var completionTa = document.createElement('textarea');
                            completionTa.id = 'wr_completionReason';
                            completionTa.rows = 3;
                            completionTa.className = 'jr-textarea wr-completionReason';
                            completionDiv.appendChild(completionLabel);
                            completionDiv.appendChild(completionTa);
                            infoWrap.appendChild(completionDiv);

                            // Main lesson split into two areas (focus / when to apply) + additional lessons container
                            var lessonDiv = document.createElement('div');
                            lessonDiv.className = 'jr-lesson-div';
                            // Upper question: 今後の活動ではどのようなことを意識すればよいと思いますか？
                            var lessonLabelTop = document.createElement('label');
                            lessonLabelTop.textContent = (getCurrentLang() === 'ja') ? '今後の活動ではどのようなことを意識すればよいと思いますか？' : 'What should you pay attention to in future activities?';
                            lessonLabelTop.className = 'jr-label';
                            var lessonTaTop = document.createElement('textarea');
                            lessonTaTop.id = 'wr_lesson_focus';
                            lessonTaTop.rows = 3;
                            lessonTaTop.className = 'jr-textarea wr-lesson-focus';
                            lessonDiv.appendChild(lessonLabelTop);
                            lessonDiv.appendChild(lessonTaTop);

                            // Lower question: その教訓は次にどのような時に活かせそうですか？
                            var lessonLabelBottom = document.createElement('label');
                            lessonLabelBottom.textContent = (getCurrentLang() === 'ja') ? 'その教訓は次にどのような時に活かせそうですか？' : 'When could this lesson be applied next?';
                            lessonLabelBottom.className = 'jr-label';
                            var lessonTaBottom = document.createElement('textarea');
                            lessonTaBottom.id = 'wr_lesson_when';
                            lessonTaBottom.rows = 2;
                            lessonTaBottom.className = 'jr-textarea jr-textarea-small wr-lesson-when';
                            lessonDiv.appendChild(lessonLabelBottom);
                            lessonDiv.appendChild(lessonTaBottom);

                            var additionalContainer = document.createElement('div');
                            additionalContainer.id = 'wr_additionalLessonsContainer';
                            additionalContainer.className = 'jr-additional-container';
                            lessonDiv.appendChild(additionalContainer);

                            var addBtnWrap = document.createElement('div');
                            addBtnWrap.className = 'jr-add-btn-wrap';
                            var addBtn = document.createElement('button');
                            addBtn.type = 'button';
                            addBtn.id = 'wr_btnAddLessonInfo';
                            addBtn.textContent = (getCurrentLang() === 'ja') ? '複数の教訓を追加できます（＋ボタンで追加）。' : 'Add additional lessons (+)';
                            addBtn.className = 'jr-add-btn';
                            addBtnWrap.appendChild(addBtn);
                            lessonDiv.appendChild(addBtnWrap);

                            infoWrap.appendChild(lessonDiv);
                            // insert addReflectionBtn immediately before infoWrap so it appears above
                            modalContent.appendChild(addReflectionBtn);
                            modalContent.appendChild(infoWrap);

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
                                            // if reflections array present, render one card per reflection
                                            if (rres && rres.success && Array.isArray(rres.reflections) && rres.reflections.length) {
                                                var refls = rres.reflections;
                                                // populate first (existing) infoWrap then create clones for the rest
                                                for (var ri = 0; ri < refls.length; ri++) {
                                                    var rf = refls[ri];
                                                    if (ri === 0) {
                                                        populateWrapWithReflection(infoWrap, rf);
                                                    } else {
                                                        try {
                                                            var clone = infoWrap.cloneNode(true);
                                                            var cidx = _jrInfoCloneIdx++;
                                                            var elemsWithId = clone.querySelectorAll('[id]');
                                                            elemsWithId.forEach(function(el){ var old = el.id; el.id = old + '_' + cidx; });
                                                            var headerEl = clone.querySelector('.jr-info-header'); if (headerEl) headerEl.textContent = (getCurrentLang() === 'ja') ? ('内省 #' + (cidx+1)) : ('Reflection #' + (cidx+1));
                                                            var addCont = clone.querySelector('#wr_additionalLessonsContainer'); if (addCont) addCont.id = 'wr_additionalLessonsContainer_' + cidx;
                                                            // insert before existing first infoWrap to keep newest at top
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
                                                else if (rres && rres.debug) console.log('journal_report: reflection debug', rres.debug);
                                                if (rf) {
                                                    populateWrapWithReflection(infoWrap, rf);
                                                    _reflectionsRendered = true;
                                                }
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
                                    var cr = wrap.querySelector('.wr-completionReason'); if (cr) cr.value = rf.attribution || '';
                                    // lessons: rf.lessons expected array of {lesson_learned, opportunity, object_journal_lesson-learned_id}
                                    var focusEl = wrap.querySelector('.wr-lesson-focus'); var whenEl = wrap.querySelector('.wr-lesson-when');
                                    var container = wrap.querySelector('#wr_additionalLessonsContainer') || wrap.querySelector('.jr-additional-container');
                                    if (container) container.innerHTML = '';
                                    if (Array.isArray(rf.lessons) && rf.lessons.length) {
                                        var lf = rf.lessons;
                                        if (lf[0]) { if (focusEl) focusEl.value = lf[0].lesson_learned || ''; if (whenEl) whenEl.value = lf[0].opportunity || ''; }
                                        for (var lli = 1; lli < lf.length; lli++) {
                                            try {
                                                var l = lf[lli];
                                                var fld = makeAdditionalLessonField(l.lesson_learned || '', l.opportunity || '', l['object_journal_lesson-learned_id']);
                                                if (container) container.appendChild(fld);
                                            } catch(e) { console.warn('populate additional lesson failed', e); }
                                        }
                                    } else {
                                        // no lessons: clear main fields
                                        if (focusEl) focusEl.value = '';
                                        if (whenEl) whenEl.value = '';
                                    }
                                } catch(e) { console.warn('populateWrapWithReflection failed', e); }
                            }

                            // wire add button
                            try {
                                addBtn.addEventListener('click', function () {
                                    try {
                                        // add a pair: focus + when
                                        var fld = makeAdditionalLessonField('', '');
                                        additionalContainer.appendChild(fld);
                                        // focus first textarea
                                        var ta = fld.querySelector('textarea'); if (ta) ta.focus();
                                    } catch (e) { console.warn('wr add lesson error', e); }
                                });
                            } catch (e) { /* ignore */ }

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
                                                    if (document.getElementById('wr_completionReason')) document.getElementById('wr_completionReason').value = val_attr || '';

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
                                modalContent.appendChild(itemWrap);
                            });

                            var dlBtn = document.createElement('button');
                            dlBtn.textContent = (getCurrentLang() === 'ja') ? 'Wordダウンロード' : 'Download Word';
                            dlBtn.style.marginTop = '18px';
                            dlBtn.style.padding = '8px 24px';
                            dlBtn.style.background = theme.accent;
                            dlBtn.style.color = '#fff';
                            dlBtn.style.border = 'none';
                            dlBtn.style.borderRadius = '8px';
                            dlBtn.style.fontSize = '15px';
                            dlBtn.style.cursor = 'pointer';
                            dlBtn.style.boxShadow = '0 6px 14px rgba(2,48,89,0.12)';
                            dlBtn.onclick = function () {
                                // read editable fields (split evaluation + lessons)
                                var successPoints = (document.getElementById('wr_successPoints') ? document.getElementById('wr_successPoints').value : '').trim();
                                var failurePoints = (document.getElementById('wr_failurePoints') ? document.getElementById('wr_failurePoints').value : '').trim();
                                var cr = (document.getElementById('wr_completionReason') ? document.getElementById('wr_completionReason').value : '').trim();
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
                            modalContent.appendChild(dlBtn);

                            // hover effects for dlBtn
                            dlBtn.addEventListener('mouseenter', function () {
                                dlBtn.style.filter = 'brightness(0.94)';
                                dlBtn.style.boxShadow = '0 10px 24px rgba(2,48,89,0.14)';
                            });
                            dlBtn.addEventListener('mouseleave', function () {
                                dlBtn.style.filter = '';
                                dlBtn.style.boxShadow = '0 6px 14px rgba(2,48,89,0.12)';
                            });

                            // Ensure the textarea block (`infoWrap`) is placed directly above the buttons.
                            try {
                                if (infoWrap && infoWrap.parentNode) {
                                    // remove from current position and re-insert before dlBtn
                                    infoWrap.parentNode.removeChild(infoWrap);
                                }
                                // ensure addReflectionBtn is next to infoWrap: remove if present, then insert both
                                try {
                                    if (addReflectionBtn && addReflectionBtn.parentNode) addReflectionBtn.parentNode.removeChild(addReflectionBtn);
                                } catch (e) { }
                                // insert addReflectionBtn then infoWrap before dlBtn so button stays above infoWrap
                                if (addReflectionBtn) modalContent.insertBefore(addReflectionBtn, dlBtn);
                                modalContent.insertBefore(infoWrap, dlBtn);
                            } catch (e) { console.error('move infoWrap failed', e); }

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
                                    var focusEl = wrap.querySelector('.wr-lesson-focus');
                                    var whenEl = wrap.querySelector('.wr-lesson-when');

                                    var successPoints = spEl ? (spEl.value || '').trim() : '';
                                    var failurePoints = fbEl ? (fbEl.value || '').trim() : '';
                                    var completionReasonVal = crEl ? (crEl.value || '').trim() : '';
                                    var focus = focusEl ? (focusEl.value || '').trim() : '';
                                    var when = whenEl ? (whenEl.value || '').trim() : '';

                                    // Collect extras
                                    var extrasArr = [];
                                    try {
                                        var addWrappers2 = wrap.querySelectorAll('.wr-additional-lesson-wrap');
                                        if (addWrappers2 && addWrappers2.length) {
                                            addWrappers2.forEach(function (w) {
                                                try {
                                                    var f = w.querySelector('.wr-additional-lesson-focus');
                                                    var whenf = w.querySelector('.wr-additional-lesson-when');
                                                    var fv = (f && f.value) ? f.value.trim() : '';
                                                    var wv = (whenf && whenf.value) ? whenf.value.trim() : '';
                                                    var combined = fv;
                                                    if (wv) combined = combined ? (combined + '\n\n' + wv) : wv;
                                                    // For reflection structure, we keep object {lesson, opportunity}
                                                    // but for legacy update (below) that needs text, we use 'combined'.
                                                    // Actually let's just push object for reflection and string for legacy if needed.
                                                    if (fv || wv) extrasArr.push({ lesson: fv, opportunity: wv });
                                                } catch (e) { }
                                            });
                                        }
                                    } catch (e) { /* ignore */ }

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
                                            attribution: completionReasonVal,
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
                                        attribution: completionReasonVal,
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
