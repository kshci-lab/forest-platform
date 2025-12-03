// weekly_report.js
// Handles export-weekly-btn click handlers and Word export preview/download.
(function(){
    // idempotent init
    window.initWeeklyReportHandlers = function(goalHelpers) {
        if (window._weeklyReportInited) return;
        window._weeklyReportInited = true;

        function getCurrentLang() {
            try { return (goalHelpers && typeof goalHelpers.getCurrentLang === 'function') ? goalHelpers.getCurrentLang() : ((document.getElementById('language-toggle') && document.getElementById('language-toggle').checked) ? 'en' : 'ja'); } catch(e){ return 'ja'; }
        }

        var weeklyListDiv = document.getElementById('weeklyGoalsList');
        if (!weeklyListDiv) return;

        // Delegate using event delegation to avoid re-binding on rerender.
        weeklyListDiv.addEventListener('click', function(e){
            var btn = e.target.closest && e.target.closest('.export-weekly-btn');
            if (!btn) return;
            try {
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                var goals = JSON.parse(localStorage.getItem('weeklyGoals') || '[]');
                var goal = goals[idx];
                if (!goal || !goal.object_goal_id) {
                    console.warn('weekly_report: object_goal_id が見つかりません');
                    return;
                }
                var startDate = goal.start || goal.start_date;
                var endDate = goal.end || goal.finish_date;
                var goalContents = Array.isArray(goal.contents) ? goal.contents : [];

                $.ajax({
                    url: 'php/get_object_goal_nodes.php',
                    type: 'GET',
                    dataType: 'json',
                    data: { object_goal_id: goal.object_goal_id },
                    success: function(res) {
                        if (!(res && res.success && Array.isArray(res.node_ids))) {
                            console.warn('weekly_report: node_ids が見つかりません', res);
                            return;
                        }
                        var nodeIds = res.node_ids;
                        var promises = nodeIds.map(function(nodeId, i){
                            return new Promise(function(resolve) {
                                $.ajax({
                                    url: 'php/get_object_node_info.php',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: { node_id: nodeId, start_date: startDate, end_date: endDate },
                                    success: function(objRes) {
                                        var contentArr = [];
                                        try {
                                            // Prefer histories (from object_nodes_histories) because they carry `activity`.
                                            var source = (objRes && Array.isArray(objRes.histories) && objRes.histories.length) ? objRes.histories : (objRes && Array.isArray(objRes.data) ? objRes.data : []);
                                            // mapping for activity -> prefix
                                            var mapJa = {1:'手段設定: ',2:'ラベル変更: ',3:'理由記述: ',4:'完了時間記述: ',5:'手段開始: ',6:'手段中断: ',7:'手段終了: ',8:'内省記述: '};
                                            var mapEn = {1:'Means set: ',2:'Label change: ',3:'Reason recorded: ',4:'Completion time recorded: ',5:'Means started: ',6:'Means interrupted: ',7:'Means finished: ',8:'Reflection recorded: '};
                                            var isJa = (getCurrentLang() === 'ja');
                                            contentArr = source.map(function(r){
                                                var txt = r.content || '';
                                                try {
                                                    var act = (typeof r.activity !== 'undefined') ? parseInt(r.activity, 10) : 0;
                                                    var prefix = '';
                                                    if (act && act > 0) {
                                                        prefix = isJa ? (mapJa[act] || '') : (mapEn[act] || '');
                                                    }
                                                    return prefix + txt;
                                                } catch(e) {
                                                    return txt;
                                                }
                                            });
                                        } catch(e) { console.error('build contentArr error', e); }
                                        resolve({ display: goalContents[i] || '', content: contentArr, object_node_ids: objRes.object_node_ids || [], object_node_history_ids: objRes.object_node_history_ids || [], histories: objRes.histories || [], node_children: objRes.node_children || {}, node_parents: objRes.node_parents || {} });
                                    },
                                    error: function() {
                                        resolve({ display: goalContents[i] || '', content: [], object_node_ids: [], object_node_history_ids: [], histories: [] });
                                    }
                                });
                            });
                        });

                        Promise.all(promises).then(function(results){
                            // build preview modal (copied structure from original goal_list.js)

                            // Theme palette for unified design
                            var theme = {
                                primary: '#2b7a78',   // teal-ish primary
                                accent: '#0056b3',    // deep blue for secondary actions
                                bg: '#ffffff',
                                border: '#e8f3f1',
                                text: '#233043',
                                muted: '#6b7785',
                                overlay: 'rgba(0,0,0,0.45)'
                            };

                            var modal = document.createElement('div');
                            modal.style.position = 'fixed';
                            modal.style.top = '0';
                            modal.style.left = '0';
                            modal.style.width = '100vw';
                            modal.style.height = '100vh';
                            modal.style.background = theme.overlay;
                            // add vertical padding to create visible space above/below the modal content
                            modal.style.padding = '24px 0';
                            modal.style.display = 'flex';
                            modal.style.alignItems = 'center';
                            modal.style.justifyContent = 'center';
                            modal.style.zIndex = '9999';

                            var modalContent = document.createElement('div');
                            modalContent.style.background = theme.bg;
                            modalContent.style.padding = '36px 28px';
                            modalContent.style.borderRadius = '12px';
                            modalContent.style.border = '1px solid ' + theme.border;
                            modalContent.style.boxShadow = '0 8px 30px rgba(35,48,67,0.12)';
                            // Make modal larger and more readable
                            modalContent.style.width = '95vw';
                            modalContent.style.maxWidth = '1100px';
                            modalContent.style.minWidth = '560px';
                            // Give slightly more vertical room but keep top/bottom gaps via modal padding
                            modalContent.style.maxHeight = '85vh';
                            modalContent.style.overflowY = 'auto';

                            var title = document.createElement('h3');
                            // title.textContent = (getCurrentLang() === 'ja') ? 'Wordプレビュー' : 'Word Preview';
                            title.style.marginBottom = '12px';
                            title.style.color = theme.primary;
                            title.style.fontSize = '20px';
                            title.style.fontWeight = '700';
                            modalContent.appendChild(title);

                            var periodHeading = document.createElement('h3');
                            periodHeading.style.margin = '0 0 12px 0';
                            periodHeading.style.fontSize = '15px';
                            periodHeading.style.fontWeight = '600';
                            periodHeading.style.color = theme.text;
                            periodHeading.textContent = (startDate || '') + '~' + (endDate || '') + ((getCurrentLang() === 'ja') ? 'に行ったこと' : ' activities');
                            modalContent.appendChild(periodHeading);

                            // Add editable areas for action_reason, completion_reason, challenges_learnings
                            var infoWrap = document.createElement('div');
                            infoWrap.style.display = 'grid';
                            infoWrap.style.gridTemplateColumns = '1fr';
                            infoWrap.style.gap = '6px';
                            infoWrap.style.marginBottom = '8px';

                            function makeLabeledTextarea(id, labelText, value) {
                                var wrap = document.createElement('div');
                                var label = document.createElement('label');
                                label.textContent = labelText;
                                label.style.display = 'block';
                                label.style.fontWeight = '600';
                                label.style.marginBottom = '6px';
                                label.style.fontSize = '13px';
                                label.style.color = theme.muted;
                                var ta = document.createElement('textarea');
                                ta.id = id;
                                ta.rows = 2;
                                ta.style.width = '100%';
                                ta.style.padding = '8px 10px';
                                ta.style.borderRadius = '8px';
                                ta.style.border = '1px solid ' + theme.border;
                                ta.style.fontSize = '13px';
                                ta.style.lineHeight = '1.4';
                                ta.style.resize = 'vertical';
                                ta.style.background = '#fbffff';
                                ta.style.color = theme.text;
                                ta.value = value || '';
                                wrap.appendChild(label);
                                wrap.appendChild(ta);
                                return wrap;
                            }

                            // Prefill from goal if available
                            var pre_action = (goal && goal.action_reason) ? goal.action_reason : '';
                            var pre_completion = (goal && goal.completion_reason) ? goal.completion_reason : '';
                            var pre_challenges = (goal && goal.challenges_learnings) ? goal.challenges_learnings : '';

                            infoWrap.appendChild(makeLabeledTextarea('wr_action_reason', (getCurrentLang() === 'ja') ? '内省' : 'Action reason', pre_action));
                            infoWrap.appendChild(makeLabeledTextarea('wr_completion_reason', (getCurrentLang() === 'ja') ? '完了理由' : 'Completion reason', pre_completion));
                            infoWrap.appendChild(makeLabeledTextarea('wr_challenges_learnings', (getCurrentLang() === 'ja') ? '学び・課題' : 'Challenges & Learnings', pre_challenges));

                            modalContent.appendChild(infoWrap);

                            // Fetch saved fields from DB and overwrite textareas if present
                            (function(){
                                var fetchUrl = './php/get_object_goal_fields.php';
                                $.ajax({
                                    url: fetchUrl,
                                    type: 'GET',
                                    dataType: 'json',
                                    data: { object_goal_id: goal.object_goal_id },
                                    success: function(fres) {
                                        if (fres && fres.success) {
                                            try {
                                                if (document.getElementById('wr_action_reason')) document.getElementById('wr_action_reason').value = fres.action_reason || '';
                                                if (document.getElementById('wr_completion_reason')) document.getElementById('wr_completion_reason').value = fres.completion_reason || '';
                                                if (document.getElementById('wr_challenges_learnings')) document.getElementById('wr_challenges_learnings').value = fres.challenges_learnings || '';
                                            } catch(e) { console.error('apply fetched fields error', e); }
                                        } else {
                                            console.warn('get_object_goal_fields: not found or error', fres);
                                        }
                                    },
                                    error: function(xhr, status, err) {
                                        console.error('get_object_goal_fields error', status, err, xhr && xhr.responseText);
                                    }
                                });
                            })();

                            results.forEach(function(item){
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
                                var mapJa = {1:'手段設定',2:'ラベル変更',3:'理由記述',4:'完了時間記述',5:'手段開始',6:'手段中断',7:'手段終了',8:'内省記述'};
                                var mapEn = {1:'Means set',2:'Label change',3:'Reason recorded',4:'Completion time recorded',5:'Means started',6:'Means interrupted',7:'Means finished',8:'Reflection recorded'};

                                if (rowsSource) {
                                    // First, group histories by object_node_id (preserve lists); ordering decided below
                                    var objGroups = {};
                                    rowsSource.forEach(function(h){
                                        var oid = h.object_node_id || '';
                                        if (typeof objGroups[oid] === 'undefined') { objGroups[oid] = []; }
                                        objGroups[oid].push(h);
                                    });

                                    // Determine object order: prefer server-provided ordered_object_node_ids when available
                                    var objOrder = [];
                                    if (item.ordered_object_node_ids && Array.isArray(item.ordered_object_node_ids) && item.ordered_object_node_ids.length) {
                                        objOrder = item.ordered_object_node_ids.filter(function(id){ return typeof objGroups[id] !== 'undefined'; });
                                        // append any groups not covered by ordered list (preserve their original first-seen order)
                                        Object.keys(objGroups).forEach(function(k){ if (objOrder.indexOf(k) === -1) objOrder.push(k); });
                                    } else {
                                        // fallback: preserve first-seen order from rowsSource
                                        Object.keys(objGroups).forEach(function(k){ objOrder.push(k); });
                                    }

                                    // Build representative content map for each object (used for parent labels)
                                    var repByOid = {};
                                    Object.keys(objGroups).forEach(function(k){
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
                                    Object.keys(objGroups).forEach(function(n){
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
                                        children.forEach(function(ch){
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
                                    Object.keys(objGroups).forEach(function(n){ if (typeof levels[n] === 'undefined') levels[n] = 0; });

                                    // For each object_node_id group, create a table and within it group by content
                                    objOrder.forEach(function(oid){
                                        var grp = objGroups[oid];
                                        // (No object_node_id caption — display only representative content heading)

                                        // Group this object's histories by content (preserve appearance order)
                                        var contentGroups = {};
                                        var contentOrder = [];
                                        grp.forEach(function(h){
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
                                            for (var pi=0; pi<parentsArr.length; pi++) {
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
                                        ch.addEventListener('mouseenter', function(){
                                            ch.style.background = 'rgba(43,122,120,0.06)';
                                            ch.style.boxShadow = '0 6px 14px rgba(35,48,67,0.06)';
                                            ch.style.transform = 'translateY(-1px)';
                                            chIcon.style.color = theme.primary;
                                        });
                                        ch.addEventListener('mouseleave', function(){
                                            ch.style.background = '';
                                            ch.style.boxShadow = '';
                                            ch.style.transform = '';
                                            chIcon.style.color = theme.muted;
                                        });
                                        ch.addEventListener('focus', function(){
                                            ch.style.outline = '3px solid rgba(43,122,120,0.12)';
                                            ch.style.outlineOffset = '3px';
                                        });
                                        ch.addEventListener('blur', function(){
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
                                        grp.forEach(function(h){
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
                                                    if (h.action_reason) parts.push(h.action_reason);
                                                    if (h.completion_reason) parts.push(h.completion_reason);
                                                    if (h.challenges_learnings) parts.push(h.challenges_learnings);
                                                    detail = parts.join(' / ');
                                                } else {
                                                    detail = '';
                                                }
                                            } catch(e) { detail = ''; }

                                            var labelText = prefix || '';
                                            var detailText = detail || '';
                                            innerTbody.appendChild(formatRow(timeText, labelText, detailText));
                                        });

                                        innerTbl.appendChild(innerTbody);
                                        detailsDiv.appendChild(innerTbl);
                                        // header click toggles the details
                                        // toggle with smooth height animation and keyboard support
                                        var openDetails = function(){
                                            detailsDiv.style.display = 'block';
                                            // allow layout then set maxHeight to scrollHeight
                                            var sh = detailsDiv.scrollHeight || (innerTbl ? innerTbl.scrollHeight + 20 : 300);
                                            detailsDiv.style.maxHeight = sh + 'px';
                                            detailsDiv.style.opacity = '1';
                                            chIcon.style.transform = 'rotate(90deg)';
                                            chIcon.style.color = theme.primary;
                                        };
                                        var closeDetails = function(){
                                            detailsDiv.style.maxHeight = '0px';
                                            detailsDiv.style.opacity = '0';
                                            chIcon.style.transform = 'rotate(0deg)';
                                            chIcon.style.color = theme.muted;
                                        };
                                        ch.addEventListener('click', function(){
                                            if (detailsDiv.style.display === 'none' || detailsDiv.style.maxHeight === '0px') {
                                                openDetails();
                                            } else {
                                                closeDetails();
                                            }
                                        });
                                        // after collapse transition, hide element to remove from tab order
                                        detailsDiv.addEventListener('transitionend', function(e){
                                            if (e.propertyName === 'max-height' && detailsDiv.style.maxHeight === '0px') {
                                                detailsDiv.style.display = 'none';
                                            }
                                        });
                                        // keyboard accessibility (Enter / Space)
                                        ch.setAttribute('role','button');
                                        ch.tabIndex = 0;
                                        ch.addEventListener('keydown', function(ev){
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
                                    item.content.forEach(function(contentEntry){
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
                                dlBtn.onclick = function() {
                                // read editable fields
                                var ar = document.getElementById('wr_action_reason') ? document.getElementById('wr_action_reason').value : '';
                                var cr = document.getElementById('wr_completion_reason') ? document.getElementById('wr_completion_reason').value : '';
                                var cl = document.getElementById('wr_challenges_learnings') ? document.getElementById('wr_challenges_learnings').value : '';

                                function escapeHtml(str) {
                                    if (!str && str !== 0) return '';
                                    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/\'/g, '&#39;');
                                }

                                function nl2br_escaped(s) {
                                    return escapeHtml(s).replace(/\r\n|\n|\r/g, '<br>');
                                }

                                var html = '<html><head><meta charset="utf-8"><title>Weekly Goal Report</title></head><body>';
                                html += '<h2>' + escapeHtml((getCurrentLang() === 'ja') ? ('週次レポート (' + (startDate||'') + ' ~ ' + (endDate||'') + ')') : ('Weekly Goal Report (' + (startDate||'') + ' ~ ' + (endDate||'') + ')')) + '</h2>';
                                // include the three notes if present
                                if (ar && ar.trim()) {
                                    html += '<h3>' + escapeHtml((getCurrentLang() === 'ja') ? '内省 (action_reason)' : 'Action reason') + '</h3>';
                                    html += '<p>' + nl2br_escaped(ar) + '</p>';
                                }
                                if (cr && cr.trim()) {
                                    html += '<h3>' + escapeHtml((getCurrentLang() === 'ja') ? '完了理由 (completion_reason)' : 'Completion reason') + '</h3>';
                                    html += '<p>' + nl2br_escaped(cr) + '</p>';
                                }
                                if (cl && cl.trim()) {
                                    html += '<h3>' + escapeHtml((getCurrentLang() === 'ja') ? '学び・課題 (challenges_learnings)' : 'Challenges & Learnings') + '</h3>';
                                    html += '<p>' + nl2br_escaped(cl) + '</p>';
                                }

                                results.forEach(function(item) {
                                    html += '<h3>' + escapeHtml(item.display || '') + '</h3>';
                                    // group histories by their raw content and render each content as a heading
                                    var mapJa = {1:'手段設定',2:'ラベル変更',3:'理由記述',4:'完了時間記述',5:'手段開始',6:'手段中断',7:'手段終了',8:'内省記述'};
                                    var mapEn = {1:'Means set',2:'Label change',3:'Reason recorded',4:'Completion time recorded',5:'Means started',6:'Means interrupted',7:'Means finished',8:'Reflection recorded'};

                                    if (item.histories && item.histories.length) {
                                        // Group histories by object_node_id then by content, and render each group as a heading + table
                                        var objGroups = {};
                                        item.histories.forEach(function(h){
                                            var oid = h.object_node_id || '';
                                            if (typeof objGroups[oid] === 'undefined') { objGroups[oid] = []; }
                                            objGroups[oid].push(h);
                                        });

                                        // Determine object order: prefer server-provided ordered_object_node_ids
                                        var objOrder = [];
                                        if (item.ordered_object_node_ids && Array.isArray(item.ordered_object_node_ids) && item.ordered_object_node_ids.length) {
                                            objOrder = item.ordered_object_node_ids.filter(function(id){ return typeof objGroups[id] !== 'undefined'; });
                                            Object.keys(objGroups).forEach(function(k){ if (objOrder.indexOf(k) === -1) objOrder.push(k); });
                                        } else {
                                            Object.keys(objGroups).forEach(function(k){ objOrder.push(k); });
                                        }

                                        objOrder.forEach(function(oid){
                                            // omit object_node_id caption in export
                                            // group by content
                                            var contentGroups = {};
                                            var contentOrder = [];
                                            objGroups[oid].forEach(function(h){
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
                                                Object.keys(objGroups).forEach(function(k){
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
                                                Object.keys(objGroups).forEach(function(n){
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
                                                    children.forEach(function(ch){
                                                        if (typeof objGroups[ch] === 'undefined') return;
                                                        var parentLevels = [];
                                                        var plist = nodeParentsExp[ch] || [];
                                                        for (var pidx = 0; pidx < plist.length; pidx++) { var pp = plist[pidx]; if (typeof levelsExp[pp] !== 'undefined') parentLevels.push(levelsExp[pp]); }
                                                        var newL = parentLevels.length ? (Math.min.apply(null, parentLevels) + 1) : (levelsExp[ccur] + 1);
                                                        if (typeof levelsExp[ch] === 'undefined' || newL < levelsExp[ch]) { levelsExp[ch] = newL; qexp.push(ch); }
                                                    });
                                                }
                                                Object.keys(objGroups).forEach(function(n){ if (typeof levelsExp[n] === 'undefined') levelsExp[n] = 0; });

                                                var indent = levelsExp[oid] || 0;
                                                var indentHtml = new Array(indent + 1).join('&nbsp;&nbsp;&nbsp;&nbsp;');
                                                // parent label if exists
                                                if (indent > 0) {
                                                    var parentsArr = item.node_parents && item.node_parents[oid] ? item.node_parents[oid] : [];
                                                    var displayParent = null;
                                                    for (var pi2=0; pi2<parentsArr.length; pi2++) { var p2 = parentsArr[pi2]; if (repByOidExport[p2]) { displayParent = repByOidExport[p2]; break; } }
                                                    if (displayParent) {
                                                        html += '<div style="color:#666;font-size:12px;margin-bottom:4px;">' + escapeHtml((getCurrentLang() === 'ja') ? '親: ' : 'Parent: ') + nl2br_escaped(displayParent) + '</div>';
                                                    }
                                                }

                                                html += '<h5>' + indentHtml + nl2br_escaped(labelPrefix + contentHeading) + '</h5>';
                                            html += '<table style="width:100%;border-collapse:collapse"><tbody>';
                                            // iterate all histories under this object (objGroups[oid]) and render rows
                                            objGroups[oid].forEach(function(h){
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
                                                        if (h.action_reason) parts.push(h.action_reason);
                                                        if (h.completion_reason) parts.push(h.completion_reason);
                                                        if (h.challenges_learnings) parts.push(h.challenges_learnings);
                                                        detail = parts.join(' / ');
                                                    } else {
                                                        detail = '';
                                                    }
                                                } catch(e) { detail = ''; }
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
                                        item.content.forEach(function(contentEntry) {
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
                                a.download = 'weekly_goal_report_' + (startDate||'') + '-' + (endDate||'') + '.doc';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                document.body.removeChild(modal);
                            };
                            modalContent.appendChild(dlBtn);

                            // hover effects for dlBtn
                            dlBtn.addEventListener('mouseenter', function(){
                                dlBtn.style.filter = 'brightness(0.94)';
                                dlBtn.style.boxShadow = '0 10px 24px rgba(2,48,89,0.14)';
                            });
                            dlBtn.addEventListener('mouseleave', function(){
                                dlBtn.style.filter = '';
                                dlBtn.style.boxShadow = '0 6px 14px rgba(2,48,89,0.12)';
                            });

                            // Ensure the textarea block (`infoWrap`) is placed directly above the buttons.
                            try {
                                if (infoWrap && infoWrap.parentNode) {
                                    // remove from current position and re-insert before dlBtn
                                    infoWrap.parentNode.removeChild(infoWrap);
                                }
                                // insert before dlBtn so it appears immediately above the buttons
                                modalContent.insertBefore(infoWrap, dlBtn);
                            } catch (e) { console.error('move infoWrap failed', e); }

                            // Save button (AJAX -> php endpoint)
                            var saveBtn = document.createElement('button');
                            saveBtn.textContent = (getCurrentLang() === 'ja') ? '保存' : 'Save';
                            saveBtn.style.marginLeft = '12px';
                            saveBtn.style.padding = '8px 20px';
                            saveBtn.style.background = theme.primary;
                            saveBtn.style.color = '#fff';
                            saveBtn.style.border = 'none';
                            saveBtn.style.borderRadius = '8px';
                            saveBtn.style.fontSize = '15px';
                            saveBtn.style.cursor = 'pointer';
                            saveBtn.style.boxShadow = '0 6px 14px rgba(43,122,120,0.12)';
                            saveBtn.onclick = function() {
                                try {
                                    var object_goal_id = (goal && goal.object_goal_id) ? goal.object_goal_id : null;
                                    if (!object_goal_id) {
                                        alert((getCurrentLang() === 'ja') ? 'object_goal_id が見つかりません' : 'object_goal_id not found');
                                        return;
                                    }
                                    var data = {
                                        object_goal_id: object_goal_id,
                                        action_reason: (document.getElementById('wr_action_reason') ? document.getElementById('wr_action_reason').value : ''),
                                        completion_reason: (document.getElementById('wr_completion_reason') ? document.getElementById('wr_completion_reason').value : ''),
                                        challenges_learnings: (document.getElementById('wr_challenges_learnings') ? document.getElementById('wr_challenges_learnings').value : ''),
                                        start_date: startDate,
                                        finish_date: endDate,
                                        // other fields are optional/left empty when not available
                                        goal_type: goal.goal_type || '',
                                        node_id: goal.node_id || '',
                                        label: goal.label || '',
                                        appeared_at: goal.appeared_at || '',
                                        update_at: new Date().toISOString().slice(0,19).replace('T',' '),
                                        deleted: (typeof goal.deleted !== 'undefined') ? goal.deleted : 0
                                    };
                                    // ensure correct relative path: use ./php/ to resolve from current directory
                                    var ajaxUrl = './php/update_object_goal_fields.php';
                                    console.log('Updating object_goal, POST to', ajaxUrl, 'payload=', data);
                                    $.ajax({
                                        url: ajaxUrl,
                                        type: 'POST',
                                        data: data,
                                        dataType: 'json',
                                        success: function(res) {
                                            if (res && res.success) {
                                                    try {
                                                        if (goalHelpers && typeof goalHelpers.fetchWeeklyGoalsFromDB === 'function') goalHelpers.fetchWeeklyGoalsFromDB();
                                                        else if (typeof fetchWeeklyGoalsFromDB === 'function') fetchWeeklyGoalsFromDB();
                                                    } catch(e){}
                                                    document.body.removeChild(modal);
                                                } else {
                                                alert((getCurrentLang() === 'ja') ? '保存に失敗しました' : 'Save failed');
                                                console.warn('save response', res);
                                                if (res && res.error) console.error('server error:', res.error);
                                            }
                                        },
                                        error: function(xhr, status, err) {
                                            var respText = xhr && xhr.responseText ? xhr.responseText : '';
                                            console.error('update_object_goal_fields error', status, err);
                                            console.error('responseText:', respText);
                                            try {
                                                // try to parse JSON error message
                                                var parsed = JSON.parse(respText);
                                                console.error('parsed error json', parsed);
                                            } catch(e){}
                                            alert((getCurrentLang() === 'ja') ? '通信エラーが発生しました' : 'Network error');
                                        }
                                    });
                                } catch (err) {
                                    console.error('saveBtn click error', err);
                                    alert((getCurrentLang() === 'ja') ? 'エラーが発生しました' : 'An error occurred');
                                }
                            };
                            modalContent.appendChild(saveBtn);
                            saveBtn.addEventListener('mouseenter', function(){
                                saveBtn.style.filter = 'brightness(0.98)';
                                saveBtn.style.boxShadow = '0 10px 24px rgba(43,122,120,0.16)';
                            });
                            saveBtn.addEventListener('mouseleave', function(){
                                saveBtn.style.filter = '';
                                saveBtn.style.boxShadow = '0 6px 14px rgba(43,122,120,0.12)';
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
                            closeBtn.onclick = function() { document.body.removeChild(modal); };
                            modalContent.appendChild(closeBtn);
                            closeBtn.addEventListener('mouseenter', function(){
                                closeBtn.style.filter = 'brightness(0.98)';
                                closeBtn.style.transform = 'translateY(-1px)';
                            });
                            closeBtn.addEventListener('mouseleave', function(){
                                closeBtn.style.filter = '';
                                closeBtn.style.transform = '';
                            });

                            modal.appendChild(modalContent);
                            document.body.appendChild(modal);
                        }).catch(function(err){ console.error('weekly_report: Promise.all error', err); });
                    },
                    error: function(xhr, status, error) { console.error('weekly_report: get_object_goal_nodes.php error', error); }
                });
            } catch (err) {
                console.error('weekly_report click handler error', err);
            }
        });
    };
})();
