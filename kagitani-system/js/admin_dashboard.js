/**
 * admin_dashboard.js
 * 研究データ分析ワークベンチ フロントエンド制御スクリプト
 */

(function () {
  'use strict';

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // 対象9名: 山内、島岡、中島、白木、江川、池島(池嶋)、川、田中、池田
  const TARGET_9_USER_IDS = [705669067, 1079778750, 1295772075, 540742316, 1047560894, 1359833175, 1762021915, 1059266691, 1836505621];

  // アプリケーション状態
  const state = {
    filter: {
      startDate: '2026-04-20',
      endDate: getTodayStr(),
      dateBasis: 'created_at',
      userIds: [...TARGET_9_USER_IDS],
      includeUnmatched: false
    },
    filterOptions: {
      users: [],
      minDate: '2025-01-01',
      maxDate: '2026-12-31'
    },
    currentTab: 'summary',
    listSubTab: 'lessons', // 'lessons' or 'nodes'
    lessonsData: [],
    nodesData: [],
    summaryData: null,
    aggregationData: null,
    aggConfig: {
      metric: 'lessons_total',
      rowAxis: 'month',
      colAxis: 'user',
      viewMode: 'pivot' // 'pivot', 'table', 'bar', 'line'
    },
    tablePagination: {
      lessons: { page: 1, perPage: 15, search: '', sortCol: 'created_at', sortAsc: false },
      nodes: { page: 1, perPage: 15, search: '', sortCol: 'created_at', sortAsc: false }
    }
  };

  // DOM要素キャッシュ
  const dom = {};

  // 指標定義マスタ
  const METRIC_DEFINITIONS = {
    lessons_total: {
      name: '教訓数 (合計)',
      desc: '思考整理マップおよびSRLジャーナルから導出された全教訓の総件数。',
      tables: 'object_lesson-learneds, object_journal_lesson-learneds',
      method: '内省ごとの最新の有効な教訓を1件として合算',
      dateTarget: '指定された基準日時 (作成日時 または 更新日時)',
      dedup: '手段側は内省ID（未設定ならノードID）、ジャーナル側は内省IDで統合',
      axes: '全体, 年/月/週/日別, 参加者別, 導出起点別',
      notes: '空白テキストの教訓は除外されます。'
    },
    lessons_map: {
      name: '教訓数 (マップ起因)',
      desc: '思考整理マップ上の手段ノードを振り返って得られた教訓の件数。',
      tables: 'object_lesson-learneds',
      method: '内省ID（未設定ならノードID）ごとに最新1件',
      dateTarget: '指定された基準日時 (作成日時 または 更新日時)',
      dedup: '内省ID（未設定ならノードID）',
      axes: '全体, 年/月/週/日別, 参加者別',
      notes: '手段ノードに紐づく教訓のみが集計対象です。'
    },
    lessons_journal: {
      name: '教訓数 (ジャーナル起因)',
      desc: 'SRLジャーナル（週次等の活動記録）の振り返りから得られた教訓の件数。',
      tables: 'object_journal_lesson-learneds',
      method: 'ジャーナル内省IDごとに最新1件',
      dateTarget: '指定された基準日時 (作成日時 または 更新日時)',
      dedup: 'ジャーナル内省ID',
      axes: '全体, 年/月/週/日別, 参加者別, ジャーナル別',
      notes: 'ジャーナル期間に紐づく教訓が集計対象です。'
    },
    nodes_total: {
      name: '手段ノード数',
      desc: '思考整理マップ上に作成された手段ノード (step, action) の総件数。',
      tables: 'object_nodes',
      method: 'COUNT(DISTINCT object_node_id)',
      dateTarget: '指定された基準日時 (作成日時 または 更新日時)',
      dedup: 'object_node_id',
      axes: '全体, 年/月/週/日別, 参加者別, 手段ステータス別',
      notes: '問いノード (topic-tag) は除外されます。'
    },
    nodes_completed: {
      name: '完了手段ノード数',
      desc: 'ステータスが completed (完了) と記録された手段ノードの件数。',
      tables: 'object_nodes (status = "completed")',
      method: 'COUNT(DISTINCT object_node_id)',
      dateTarget: '指定された基準日時 (作成日時 または 更新日時)',
      dedup: 'object_node_id',
      axes: '全体, 年/月/週/日別, 参加者別',
      notes: '期間内に完了したかどうかは更新日時基準で抽出可能です。'
    },
    journals_total: {
      name: 'ジャーナル数',
      desc: '作成・実施された自己調整学習 (SRL) ジャーナルの総件数。',
      tables: 'object_journals',
      method: 'COUNT(DISTINCT object_journal_id)',
      dateTarget: 'appeared_at (作成日時) または update_at (更新日時)',
      dedup: 'object_journal_id',
      axes: '全体, 年/月/週/日別, 参加者別',
      notes: '削除済みフラグ (delete = 1) のものは除外されます。'
    },
    reflections_total: {
      name: '内省記録数',
      desc: 'ジャーナルおよび手段ノードに対して入力された振り返り・内省の件数。',
      tables: 'object_journal_reflections, object_reflection_records',
      method: 'COUNT(DISTINCT 内省ID) の合算',
      dateTarget: '作成日時 (created_at)',
      dedup: '一意な内省レコードID',
      axes: '全体, 年/月/週/日別, 参加者別',
      notes: '良かった点・悪かった点などの具体的記述を含むレコード数です。'
    },
    lessons_updated: {
      name: '教訓更新件数',
      desc: '現在の教訓のうち、保存済みの版で本文の差異、または作成後の更新日時がある教訓の件数。',
      tables: 'object_lesson-learneds, object_journal_lesson-learneds',
      method: '同じ教訓の保存済み本文に差異、または updated_at > created_at があれば1件。更新回数は加算しない',
      dateTarget: '最新の教訓に対する共通の日付基準（作成日時または更新日時）',
      dedup: '教訓総数と同じ内省単位',
      axes: '全体, 年/月/週/日別, 参加者別',
      notes: '上書き前の本文が残らない保存では、内容変更と再保存を区別できず、更新日時を根拠とします。'
    }
  };

  const MEETING_METRICS = {
    meeting_audio_files_total: ['MT録音ファイル数', '音声ファイル数。資料共有数には加算せず、人物は未割当。共通期間のみ適用。'],
    meeting_audio_sessions_total: ['録音のあるMT数', '音声がある日付フォルダ数。同日の複数音声は1開催。共通期間のみ適用。'],
    audio_confirmed_lessons_total: ['音声対応確認済み教訓・資料数', '音声区間との対応を人が確認した当日の教訓・資料候補。複数区間でも同じ教訓候補は1件。L3の確認ではない。'],
    research_lesson_shares_assumed_total: ['研究MT冒頭の教訓共有（仮定）', '利用者が指定した日付・参加者だけを各1件として扱う。教訓本文の確認済み件数とは区別。'],
    recorded_discussions_total: ['個別議論数（録音記録あり）', '利用者が録音の存在を申告した日付・参加者の議論記録。録音自体は未取り込み。'],
    reframing_discussions_assumed_total: ['問い直し議論数（仮定）', '指定された録音あり議論を問い直しが起きた議論と仮定。音声解析による判定ではない。'],
    lesson_shares_with_assumptions_total: ['教訓共有数（確認済み＋仮定）', '確認済みの教訓共有と、指定された研究MT冒頭の教訓共有の仮定を合算。自動候補は含めない。'],
    supplemental_lessons_total: ['ファイルなし教訓共有件数', '利用者が共有を確認した補足記録。資料ファイル数には含めない。'],
    verified_lessons_total: ['教訓記載確認済み件数', '人が教訓ありと確認した資料と、利用者が確認したファイルなし共有。自動候補は含めない。'],
    lesson_candidates_total: ['教訓あり候補件数', '本文から教訓の具体的な記述を検出した、人による確認前の資料。'],
    lesson_review_total: ['教訓要確認・未解析件数', '文字が読めない、判定が曖昧、または未解析の資料。'],
    research_mt_total: ['研究MT実施件数', '日付フォルダIDごとに最後の拡張子を除く名前の完全一致で統合。修正版などの名前は別件。'],
    research_mt_days: ['研究MT開催日数', '0010-研究MT直下の有効な日付フォルダを各1件。'],
    general_mt_sessions: ['全体MT開催回数', '日付フォルダと利用者確認済みのファイルなし共有から開催を計上。同日の補足は既存の開催にまとめる。'],
    shared_lessons_total: ['全体MT資料共有件数', '全体MTの日付フォルダ直下の対象ファイルIDを各1件。拡張子違いも別件。']
  };
  Object.entries(MEETING_METRICS).forEach(([key, [name, method]]) => {
    METRIC_DEFINITIONS[key] = { name, desc: method, method,
      tables: 'SharePointまたはOneDrive同期先の一覧（本文は取得しない）',
      dateTarget: 'フォルダ名の先頭YYYY-MM-DD。作成・更新基準の切替には依存しない。',
      dedup: method, axes: '全体・年・月・週・日・参加者・MT種別',
      notes: '参加者はID/完全一致名の指定を優先し、ファイル名の苗字（漢字・英字）でも照合。複数人に一致すれば未判定。未判定は別表示。開催は個人に割り当てず、参加者指定時は対象者の資料がある開催を各1件。対象外は下位フォルダ・ショートカット・~$開始・末尾~・.tmp/.temp・.DS_Store・Thumbs.db・desktop.ini。'
    };
  });
  let meetingCsrf = '';
  let meetingCanSync = false;
  let meetingSyncing = false;

  // 初期化
  document.addEventListener('DOMContentLoaded', async () => {
    initDom();
    setupEventListeners();
    document.addEventListener('click',e=>{const b=e.target.closest('[data-curation-pick]');if(!b)return;e.stopPropagation();const collection=b.dataset.curationKind==='means'?state.nodesData:state.lessonsData;const r=collection.find(r=>(r.source_key||(r.origin_type+':'+r.lesson_id))===b.dataset.curationPick);if(r)window.ForestCuration.pick(r);},true);
    window.ForestQualitative?.connect({lessons:()=>state.lessonsData, filteredLessons:()=>{const q=state.tablePagination.lessons.search.toLowerCase();return state.lessonsData.filter(i=>!q||[i.lesson_learned,i.why_important,i.opportunity,i.user_name].some(v=>String(v||'').toLowerCase().includes(q)));},filter:()=>({curation_revision:window.ForestCuration?.metadata().revision,start_date:state.filter.startDate,end_date:state.filter.endDate,date_basis:state.filter.dateBasis,user_ids:state.filter.userIds})});
    document.getElementById('qaSelectSourceFiltered').addEventListener('click',()=>window.ForestQualitative.selectFiltered());
    document.getElementById('qaClearSource').addEventListener('click',()=>window.ForestQualitative.clearSource());
    document.getElementById('qaGoAnalysis').addEventListener('click',()=>document.querySelector('[data-subtab="qualitative"]').click());

    window.ForestCuration?.connect({query:buildFilterQuery,filter:()=>({curation_revision:window.ForestCuration?.metadata().revision,start_date:state.filter.startDate,end_date:state.filter.endDate,date_basis:state.filter.dateBasis,user_ids:state.filter.userIds}),refresh:refreshAll,csv:downloadCsv});
    setupRedesign();
    try{await window.ForestCuration?.ready();}catch(e){document.getElementById('curationBannerText').textContent=e.message;return;}
    loadFilterOptions();
    loadMeetingSyncStatus();
    setupLessonAnalysis();
    setupMeetingAudio();
  });

  function initDom() {
    dom.startDate = document.getElementById('filterStartDate');
    dom.endDate = document.getElementById('filterEndDate');
    dom.basisRadios = document.querySelectorAll('input[name="dateBasis"]');
    dom.userSearch = document.getElementById('userSearchInput');
    dom.userList = document.getElementById('userCheckboxList');
    dom.btnApply = document.getElementById('btnApplyFilter');
    dom.btnReset = document.getElementById('btnResetFilter');
    dom.presetBtns = document.querySelectorAll('.preset-btn');
    dom.conditionSummary = document.getElementById('conditionSummaryText');

    // タブ
    dom.tabBtns = document.querySelectorAll('.tab-btn');
    dom.tabContents = document.querySelectorAll('.tab-content');

    // 概要
    dom.kpiLessonsTotal = document.getElementById('kpiLessonsTotal');
    dom.kpiLessonsMap = document.getElementById('kpiLessonsMap');
    dom.kpiLessonsJournal = document.getElementById('kpiLessonsJournal');
    dom.kpiNodesTotal = document.getElementById('kpiNodesTotal');
    dom.kpiNodesCompleted = document.getElementById('kpiNodesCompleted');
    dom.kpiJournalsTotal = document.getElementById('kpiJournalsTotal');
    dom.kpiReflectionsTotal = document.getElementById('kpiReflectionsTotal');
    dom.kpiLessonsUpdated = document.getElementById('kpiLessonsUpdated');

    // データ一覧
    dom.listSubBtns = document.querySelectorAll('.list-subnav-btn');
    dom.tableLessonsWrap = document.getElementById('tableLessonsWrap');
    dom.tableNodesWrap = document.getElementById('tableNodesWrap');
    dom.searchLessons = document.getElementById('searchLessonsInput');
    dom.searchNodes = document.getElementById('searchNodesInput');
    dom.tableLessonsBody = document.getElementById('tableLessonsBody');
    dom.tableNodesBody = document.getElementById('tableNodesBody');
    dom.paginationLessons = document.getElementById('paginationLessons');
    dom.paginationNodes = document.getElementById('paginationNodes');

    // 集計
    dom.aggMetric = document.getElementById('aggMetricSelect');
    dom.aggRowAxis = document.getElementById('aggRowAxisSelect');
    dom.aggColAxis = document.getElementById('aggColAxisSelect');
    dom.aggViewBtns = document.querySelectorAll('.view-btn');
    dom.chartContainer = document.getElementById('chartContainer');
    dom.pivotContainer = document.getElementById('pivotContainer');
    dom.btnMetricInfo = document.getElementById('btnMetricInfo');

    // モーダル
    dom.modalOverlay = document.getElementById('modalOverlay');
    dom.modalTitle = document.getElementById('modalTitle');
    dom.modalBody = document.getElementById('modalBody');
    dom.modalClose = document.getElementById('modalClose');

    // 出力
    dom.btnExportLessons = document.getElementById('btnExportLessons');
    dom.btnExportNodes = document.getElementById('btnExportNodes');
    dom.btnExportAggregation = document.getElementById('btnExportAggregation');
    dom.btnExportMetadata = document.getElementById('btnExportMetadata');
  }

  function setupEventListeners() {
    document.getElementById('btnSyncMeetings').addEventListener('click', syncMeetings);
    document.getElementById('btnIncludeUnmatchedMeetings').addEventListener('click', () => {
      document.getElementById('filterIncludeUnmatched').checked = true;
      syncFilterFromInput();
      refreshAll();
    });
    document.getElementById('btnExportMeetingSources').addEventListener('click', exportMeetingSourcesCsv);
    document.querySelectorAll('[data-meeting-metric]').forEach(button => button.addEventListener('click', () => {
      dom.aggMetric.value = button.dataset.meetingMetric;
      state.aggConfig.metric = button.dataset.meetingMetric;
      switchTab('analysis');
      loadAggregation();
    }));
    // フィルタ操作
    dom.btnApply.addEventListener('click', () => {
      syncFilterFromInput();
      refreshAll();
    });

    dom.btnReset.addEventListener('click', resetFilter);

    dom.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyPreset(btn.dataset.preset);
      });
    });

    dom.userSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.user-item').forEach(item => {
        const txt = item.textContent.toLowerCase();
        item.style.display = txt.includes(q) ? 'flex' : 'none';
      });
    });

    const select9Users = () => {
      document.querySelectorAll('.user-checkbox').forEach(cb => {
        cb.checked = TARGET_9_USER_IDS.includes(parseInt(cb.value));
      });
    };

    document.getElementById('btnSelect9Users')?.addEventListener('click', () => {
      select9Users();
    });

    document.getElementById('btnSelectAllUsers').addEventListener('click', () => {
      document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = true);
    });

    document.getElementById('btnDeselectAllUsers').addEventListener('click', () => {
      document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
    });

    // タブ切替
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    // 一覧サブタブ切替
    dom.listSubBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.listSubBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.listSubTab = btn.dataset.subtab;
        document.getElementById('qaSourceToolbar').hidden=state.listSubTab!=='lessons';
        document.getElementById('qualitativePanel').hidden = state.listSubTab !== 'qualitative';
        if(state.listSubTab === 'qualitative') {dom.tableLessonsWrap.style.display='none';dom.tableNodesWrap.style.display='none';window.ForestQualitative?.show();return;}

        if (state.listSubTab === 'lessons') {
          dom.tableLessonsWrap.style.display = 'block';
          dom.tableNodesWrap.style.display = 'none';
          renderLessonsTable();
        } else {
          dom.tableLessonsWrap.style.display = 'none';
          dom.tableNodesWrap.style.display = 'block';
          renderNodesTable();
        }
      });
    });

    // 検索入力
    dom.searchLessons.addEventListener('input', (e) => {
      state.tablePagination.lessons.search = e.target.value;
      state.tablePagination.lessons.page = 1;
      renderLessonsTable();
    });

    dom.searchNodes.addEventListener('input', (e) => {
      state.tablePagination.nodes.search = e.target.value;
      state.tablePagination.nodes.page = 1;
      renderNodesTable();
    });

    // 集計コントロール
    dom.aggMetric.addEventListener('change', () => {
      state.aggConfig.metric = dom.aggMetric.value;
      loadAggregation();
    });
    dom.aggRowAxis.addEventListener('change', () => {
      state.aggConfig.rowAxis = dom.aggRowAxis.value;
      loadAggregation();
    });
    dom.aggColAxis.addEventListener('change', () => {
      state.aggConfig.colAxis = dom.aggColAxis.value;
      loadAggregation();
    });

    dom.aggViewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.aggViewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.aggConfig.viewMode = btn.dataset.view;
        renderAggregationView();
      });
    });

    // 指標定義モーダル
    dom.btnMetricInfo.addEventListener('click', showMetricInfoModal);

    // モーダルクローズ
    dom.modalClose.addEventListener('click', closeModal);
    dom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === dom.modalOverlay) closeModal();
    });

    // データ出力
    dom.btnExportLessons.addEventListener('click', exportLessonsCsv);
    dom.btnExportNodes.addEventListener('click', exportNodesCsv);
    dom.btnExportAggregation.addEventListener('click', exportAggregationCsv);
    dom.btnExportMetadata.addEventListener('click', exportMetadataJson);

    // KPIカードクリック連携
    document.querySelectorAll('.kpi-card').forEach(card => {
      card.addEventListener('click', () => {
        const target = card.dataset.target;
        if (target === 'lessons') {
          switchTab('data');
          document.querySelector('.list-subnav-btn[data-subtab="lessons"]').click();
        } else if (target === 'nodes') {
          switchTab('data');
          document.querySelector('.list-subnav-btn[data-subtab="nodes"]').click();
        }
      });
    });
  }

  // -------------------------------------------------------------
  // フィルタ処理
  // -------------------------------------------------------------
  function loadFilterOptions() {
    trackedFetch('php/admin_api.php?action=get_filter_options&'+(window.ForestCuration?.parameters()||''))
      .then(r => r.json())
      .then(res => {
        if (!res.success) throw new Error(res.error || '取得失敗');
        state.filterOptions = res;
        renderUserCheckboxes(res.users);
        if (redesignReady) restoreFilterUrl(res.users);
        updateConditionSummary();
        refreshAll();
      })
      .catch(err => {
        console.error('Filter options error:', err);
        alert('フィルタ初期データの取得に失敗しました: ' + err.message);
      });
  }

  function renderUserCheckboxes(users) {
    dom.userList.innerHTML = '';
    users.forEach(u => {
      const label = document.createElement('label');
      label.className = 'user-item';
      
      const badge = u.role === 'admin' ? '<span style="color:#ef4444;font-size:10px;">(管理者)</span>' : '';
      const totalActivities = (parseInt(u.lesson_count) || 0) + (parseInt(u.node_count) || 0);
      const actBadge = totalActivities > 0 ? `<span style="color:#2563eb;font-size:11px;">[活動:${totalActivities}]</span>` : '';

      const uid = parseInt(u.user_id);
      const isChecked = state.filter.userIds.includes(uid) ? 'checked' : '';

      label.innerHTML = `
        <input type="checkbox" class="user-checkbox" value="${u.user_id}" ${isChecked}>
        <span>${escapeHtml(u.name)} ${badge} ${actBadge}</span>
      `;
      dom.userList.appendChild(label);
    });
  }

  function syncFilterFromInput() {
    state.filter.startDate = dom.startDate.value;
    state.filter.endDate = dom.endDate.value;

    let basis = 'created_at';
    dom.basisRadios.forEach(r => {
      if (r.checked) basis = r.value;
    });
    state.filter.dateBasis = basis;

    const checked = [];
    document.querySelectorAll('.user-checkbox:checked').forEach(cb => {
      checked.push(parseInt(cb.value));
    });
    state.filter.userIds = checked;
    state.filter.includeUnmatched = document.getElementById('filterIncludeUnmatched').checked;

    updateConditionSummary();
    if (redesignReady) saveFilterUrl();
  }

  function applyPreset(preset) {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      dom.startDate.value = state.filterOptions.minDate || '2024-01-01';
      dom.endDate.value = state.filterOptions.maxDate || formatDate(today);
    } else if (preset === 'practice_to_today') {
      dom.startDate.value = '2026-04-20';
      dom.endDate.value = formatDate(today);
    } else if (preset === '2026_eval') {
      dom.startDate.value = '2026-04-20';
      dom.endDate.value = '2026-09-23';
    } else if (preset === 'this_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      dom.startDate.value = formatDate(first);
      dom.endDate.value = formatDate(last);
    } else if (preset === 'last_month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      dom.startDate.value = formatDate(first);
      dom.endDate.value = formatDate(last);
    }
    syncFilterFromInput();
    refreshAll();
  }

  function resetFilter() {
    const todayStr = getTodayStr();
    dom.startDate.value = '2026-04-20';
    dom.endDate.value = todayStr;
    dom.basisRadios[0].checked = true;
    document.getElementById('filterIncludeUnmatched').checked = false;
    document.querySelectorAll('.user-checkbox').forEach(cb => {
      cb.checked = TARGET_9_USER_IDS.includes(parseInt(cb.value));
    });
    dom.presetBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.preset-btn[data-preset="practice_to_today"]')?.classList.add('active');
    syncFilterFromInput();
    refreshAll();
  }

  function updateConditionSummary() {
    const userCount = state.filter.userIds.length;
    let userText = '全員 (全参加者)';
    if (userCount > 0) {
      if (userCount === 1) {
        const found = state.filterOptions.users.find(u => u.user_id == state.filter.userIds[0]);
        userText = `${found ? found.name : 'ユーザー'} (1名)`;
      } else {
        userText = `選択された ${userCount} 名`;
      }
    }
    const basisText = state.filter.dateBasis === 'updated_at' ? '更新日時基準' : '作成日時基準';
    const periodText = (state.filter.startDate || '最初') + ' 〜 ' + (state.filter.endDate || '最新');

    dom.conditionSummary.innerHTML = `
      <span class="condition-pill">期間: <strong>${escapeHtml(periodText)}</strong></span>
      <span class="condition-pill">対象: <strong>${escapeHtml(userText)}</strong></span>
      <span class="condition-pill">MT: 実施日基準${state.filter.includeUnmatched ? '・未判定を含む' : ''}</span>
      <span class="condition-pill">基準: <strong>${escapeHtml(basisText)}</strong></span>
    `;
  }

  function buildFilterQuery() {
    const params = new URLSearchParams();
    if (state.filter.startDate) params.append('start_date', state.filter.startDate);
    if (state.filter.endDate) params.append('end_date', state.filter.endDate);
    params.append('date_basis', state.filter.dateBasis);
    if (state.filter.userIds.length > 0) {
      params.append('user_ids', state.filter.userIds.join(','));
    }
    if (state.filter.includeUnmatched) params.append('include_unmatched', '1');
    const c=window.ForestCuration?.parameters();if(c)new URLSearchParams(c).forEach((v,k)=>params.set(k,v));
    return params.toString();
  }

  // -------------------------------------------------------------
  // データロードと描画リフレッシュ
  // -------------------------------------------------------------
  function refreshAll() {
    loadSummary();
    loadLessons();
    loadNodes();
    loadAggregation();
    if (document.getElementById('meetingLessonReviewPanel').open) loadLessonReviews();
    pollMeetingAudio();
  }

  function switchTab(tabId) {
    if (redesignReady) { tabScroll[state.currentTab] = window.scrollY; if (tabId === 'export') tabId = 'data'; }
    state.currentTab = tabId;
    dom.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    dom.tabContents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
    if (redesignReady) {
      dom.tabBtns.forEach(b => b.setAttribute('aria-current', b.dataset.tab === tabId ? 'page' : 'false'));
      const url = new URL(window.location.href); url.hash = tabId; if (window.location.hash !== url.hash && !restoringTab) window.history.pushState(null, '', url);
      window.scrollTo(0, tabScroll[tabId] || 0);
    }
  }

  // 1. サマリー
  function loadSummary() {
    trackedFetch('php/admin_api.php?action=get_summary&' + buildFilterQuery())
      .then(r => r.json())
      .then(res => {
        if (!res.success) throw new Error(res.error);
        state.summaryData = res.summary;
        renderSummary(res.summary);
      })
      .catch(err => console.error('Summary error:', err));
  }

  function renderSummary(s) {
    renderMeetingSummary(s.meetings);
    dom.kpiLessonsTotal.textContent = s.lessons_total.toLocaleString() + ' 件';
    dom.kpiLessonsMap.textContent = s.lessons_map.toLocaleString() + ' 件';
    dom.kpiLessonsJournal.textContent = s.lessons_journal.toLocaleString() + ' 件';
    dom.kpiNodesTotal.textContent = s.nodes_total.toLocaleString() + ' 件';
    dom.kpiNodesCompleted.textContent = s.nodes_completed.toLocaleString() + ' 件';
    dom.kpiJournalsTotal.textContent = s.journals_total.toLocaleString() + ' 件';
    dom.kpiReflectionsTotal.textContent = s.reflections_total.toLocaleString() + ' 件';
    dom.kpiLessonsUpdated.textContent = s.lessons_updated.toLocaleString() + ' 件';
    document.getElementById('kpiNodesWithReason').textContent = s.nodes_with_reason.toLocaleString() + ' 件';
    const metrics = {
      maps_total: '問いから作成したマップ数', lessons_total: '教訓総数', lessons_map: 'マップ教訓数', lessons_journal: 'ジャーナル教訓数',
      nodes_total: '手段総数', nodes_completed: '完了手段数', nodes_with_reason: '理由あり手段数',
      journals_total: 'ジャーナル数', reflections_total: '内省記録数', lessons_updated: '教訓更新数',
      mt_research_presentations: '研究MT資料件数', mt_research_sessions: '研究MT回数',
      mt_general_sessions: '全体MT回数', mt_shared_files: '全体MT資料共有数', mt_supplemental_lessons: 'ファイルなし教訓共有数',
      mt_verified_lessons: '教訓記載確認済み数', mt_lesson_candidates: '教訓あり候補数', mt_lesson_review: '教訓要確認・未解析数',
      mt_research_lesson_shares_assumed: '研究MT教訓共有数（仮定）', mt_recorded_discussions: '個別議論数（録音あり）',
      mt_reframing_discussions_assumed: '問い直し議論数（仮定）', mt_lesson_shares_with_assumptions: '教訓共有数（確認済み＋仮定）', mt_audio_confirmed_lessons: '音声対応確認済み教訓・資料数'
    };
    const keys = Object.keys(metrics);
    const format = value => value == null ? '—' : value.toLocaleString('ja-JP', { maximumFractionDigits: 4 });
    document.getElementById('kpiMapsMean').textContent = format(s.statistics.maps_total.mean) + ' 件 / 人';
    document.getElementById('kpiMapsTotal').textContent = format(s.maps_total);
    document.getElementById('kpiMapsVariance').textContent = format(s.statistics.maps_total.variance);
    document.querySelectorAll('[data-summary-stat]').forEach(el => {
      const stat = s.statistics[el.dataset.summaryStat];
      el.textContent = stat ? '1人あたり平均 ' + format(stat.mean) + ' ／ 分散 ' + format(stat.variance) : '—';
    });
    const cardMetrics = {"kpiLessonsTotal": ["lessons_total", "件"], "kpiNodesTotal": ["nodes_total", "件"], "kpiJournalsTotal": ["journals_total", "件"], "kpiReflectionsTotal": ["reflections_total", "件"], "kpiLessonsUpdated": ["lessons_updated", "件"]};
    const sharedAudioTotals = { kpiAudioFiles: 'meeting_audio_files_total', kpiAudioSessions: 'meeting_audio_sessions_total' };
    Object.entries(cardMetrics).forEach(([id, [key, unit]]) => {
      const stat = s.statistics[key];
      document.getElementById(id).textContent = stat?.mean == null ? '—' : format(stat.mean) + ' ' + unit + ' / 人';
      const total = key ? s[key] : s.meetings?.[sharedAudioTotals[id]];
      document.getElementById(id + 'Statistics').textContent = '合計 ' + format(total) + ' ' + unit + ' ／ 分散 ' + format(stat?.variance);
    });
    [['kpiLessonsMap','lessons_map'],['kpiLessonsJournal','lessons_journal'],['kpiNodesWithReason','nodes_with_reason'],['kpiNodesCompleted','nodes_completed']].forEach(([id,key]) => {
      const stat = s.statistics[key];
      document.getElementById(id).textContent = format(stat.mean) + ' 件 / 人（合計 ' + format(s[key]) + ' ／ 分散 ' + format(stat.variance) + '）';
    });
    const header = '<thead><tr><th>参加者 / 統計</th>' + keys.map(k => '<th>' + metrics[k] + '</th>').join('') + '</tr></thead>';
    const row = (label, values, uid) => '<tr><th>' + escapeHtml(label) + '</th>' + values.map((v,index) => '<td>' + (uid != null && !keys[index].startsWith('mt_') ? '<button type="button" class="comparison-value" data-evidence-metric="'+keys[index]+'" data-evidence-user="'+escapeHtml(String(uid))+'" aria-label="'+escapeHtml(label+'：'+metrics[keys[index]]+'の根拠を見る')+'">'+format(v)+'</button>' : format(v)) + '</td>').join('') + '</tr>';
    let body = row('合計', keys.map(k => s[k]));
    body += row('1人あたり平均（対象 ' + s.participant_count + ' 人）', keys.map(k => s.statistics[k].mean));
    body += row('分散（母分散）', keys.map(k => s.statistics[k].variance));
    body += s.per_user.map(u => row(u.user_name + ' (ID:' + u.user_id + ')', keys.map(k => u[k]), u.user_id)).join('');
    document.getElementById('summaryStatisticsTable').innerHTML = header + '<tbody>' + body + '</tbody>';
    applyComparisonColumns();

  }

  // 2. 教訓一覧
  function loadLessons() {
    trackedFetch('php/admin_api.php?action=get_lessons&' + buildFilterQuery())
      .then(r => r.json())
      .then(res => {
        if (!res.success) throw new Error(res.error);
        state.lessonsData = res.items;state.lessonsMeta=res;
        document.getElementById('badgeLessonsCount').textContent = res.total;
        renderLessonsTable();
      })
      .catch(err => console.error('Lessons error:', err));
  }

  function renderLessonsTable() {
    const conf = state.tablePagination.lessons;
    let items = state.lessonsData;

    // 検索フィルタ
    if (conf.search) {
      const q = conf.search.toLowerCase();
      items = items.filter(it => 
        (it.lesson_learned && it.lesson_learned.toLowerCase().includes(q)) ||
        (it.user_name && it.user_name.toLowerCase().includes(q)) ||
        (it.why_important && it.why_important.toLowerCase().includes(q)) ||
        (it.opportunity && it.opportunity.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const totalPages = Math.ceil(total / conf.perPage) || 1;
    if (conf.page > totalPages) conf.page = totalPages;

    const start = (conf.page - 1) * conf.perPage;
    const pageItems = items.slice(start, start + conf.perPage);

    dom.tableLessonsBody.innerHTML = '';
    if (pageItems.length === 0) {
      dom.tableLessonsBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#94a3b8;">該当する教訓データはありません</td></tr>';
    } else {
      pageItems.forEach((it, idx) => {
        const tr = document.createElement('tr');
        const originBadge = it.origin_type === 'map'
          ? '<span class="badge-tag badge-map">🗺️ マップ</span>'
          : '<span class="badge-tag badge-journal">📒 ジャーナル</span>';

        const updatedBadge = (Number(it.was_updated) === 1)
          ? '<span title="更新履歴あり" style="font-size:12px;margin-left:4px;">🕒</span>'
          : '';

        tr.innerHTML = `
          <td><input type="checkbox" data-qa-source="${escapeHtml(it.origin_type+':'+it.lesson_id)}" aria-label="この教訓を分析対象に選択"> ${start + idx + 1}<br><button type="button" class="qa-link" data-curation-pick="${escapeHtml(it.source_key || it.origin_type+':'+it.lesson_id)}">比較に追加</button></td>
          <td><strong>${escapeHtml(it.user_name)}</strong></td>
          <td>${originBadge}</td>
          <td style="min-width:240px;max-width:360px;white-space:pre-wrap;overflow-wrap:anywhere;" title="${escapeHtml(it.lesson_learned)}">
            ${escapeHtml(it.lesson_learned)} ${updatedBadge}
          </td>
          <td style="min-width:220px;max-width:340px;white-space:pre-wrap;overflow-wrap:anywhere;" title="${escapeHtml(it.why_important || '')}">
            ${escapeHtml(it.why_important || '-')}
          </td>
          <td style="min-width:220px;max-width:340px;white-space:pre-wrap;overflow-wrap:anywhere;" title="${escapeHtml(it.opportunity || '')}">
            ${escapeHtml(it.opportunity || '（記載なし）')}
          </td>
          <td style="font-size:12px;color:#64748b;white-space:nowrap;">${it.created_at.substring(0, 16)}</td>
          <td style="font-size:12px;color:#64748b;white-space:nowrap;">${it.updated_at.substring(0, 16)}</td>
        `;
        tr.addEventListener('click', event => {if(!event.target.closest('input,button,select,textarea'))showLessonDetailModal(it);});
        dom.tableLessonsBody.appendChild(tr);
      });
    }

    window.ForestQualitative?.syncSource();
    renderPagination(dom.paginationLessons, total, conf, (p) => {
      conf.page = p;
      renderLessonsTable();
    });
  }

  // 3. 手段ノード一覧
  function loadNodes() {
    trackedFetch('php/admin_api.php?action=get_nodes&' + buildFilterQuery())
      .then(r => r.json())
      .then(res => {
        if (!res.success) throw new Error(res.error);
        state.nodesData = res.items;state.nodesMeta=res;
        document.getElementById('badgeNodesCount').textContent = res.total;
        renderNodesTable();
      })
      .catch(err => console.error('Nodes error:', err));
  }

  function renderNodesTable() {
    const conf = state.tablePagination.nodes;
    let items = state.nodesData;

    if (conf.search) {
      const q = conf.search.toLowerCase();
      items = items.filter(it => 
        (it.content && it.content.toLowerCase().includes(q)) ||
        (it.user_name && it.user_name.toLowerCase().includes(q)) ||
        (it.question_content && it.question_content.toLowerCase().includes(q)) ||
        (it.reason_text && it.reason_text.toLowerCase().includes(q)) ||
        (it.status && it.status.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const totalPages = Math.ceil(total / conf.perPage) || 1;
    if (conf.page > totalPages) conf.page = totalPages;

    const start = (conf.page - 1) * conf.perPage;
    const pageItems = items.slice(start, start + conf.perPage);

    dom.tableNodesBody.innerHTML = '';
    if (pageItems.length === 0) {
      dom.tableNodesBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#94a3b8;">該当する手段ノードはありません</td></tr>';
    } else {
      pageItems.forEach((it, idx) => {
        const tr = document.createElement('tr');
        let statusBadge = '<span class="badge-tag badge-status-todo">未着手</span>';
        if (it.status === 'completed') statusBadge = '<span class="badge-tag badge-status-completed">✓ 完了</span>';
        else if (it.status === 'inProgress') statusBadge = '<span class="badge-tag badge-status-progress">▶ 進行中</span>';
        else if (it.status === 'paused') statusBadge = '<span class="badge-tag badge-status-paused">⏸ 一時中断</span>';

        tr.innerHTML = `
          <td>${start + idx + 1}<br><button type="button" class="qa-link" data-curation-kind="means" data-curation-pick="${escapeHtml(it.source_key || 'means/'+it.object_node_id)}">比較に追加</button></td>
          <td><strong>${escapeHtml(it.user_name)}</strong></td>
          <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(it.content)}">
            ${escapeHtml(it.content)}
          </td>
          <td style="min-width:240px;max-width:420px;white-space:pre-wrap;overflow-wrap:anywhere;">${escapeHtml(it.reason_text || '（記載なし）')}</td>
          <td><span style="display:inline-block;padding:2px 8px;border-radius:4px;background:#f1f5f9;font-weight:600;font-size:12px;">階層 ${it.depth}</span></td>
          <td>${statusBadge}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#64748b;" title="${escapeHtml(it.question_content)}">
            ${escapeHtml(it.question_content)}
          </td>
          <td style="font-size:12px;color:#64748b;white-space:nowrap;">${it.created_at.substring(0, 16)}</td>
        `;
        tr.addEventListener('click', () => showNodeDetailModal(it));
        dom.tableNodesBody.appendChild(tr);
      });
    }

    renderPagination(dom.paginationNodes, total, conf, (p) => {
      conf.page = p;
      renderNodesTable();
    });
  }

  function renderPagination(container, total, conf, onPageChange) {
    container.innerHTML = '';
    const totalPages = Math.ceil(total / conf.perPage) || 1;
    const start = total === 0 ? 0 : (conf.page - 1) * conf.perPage + 1;
    const end = Math.min(conf.page * conf.perPage, total);

    const info = document.createElement('div');
    info.textContent = `${total} 件中 ${start} - ${end} 件を表示`;
    container.appendChild(info);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'page-buttons';

    // 前へ
    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.textContent = '‹ 前へ';
    prev.disabled = (conf.page <= 1);
    prev.addEventListener('click', () => onPageChange(conf.page - 1));
    btnGroup.appendChild(prev);

    // ページ番号
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      const pBtn = document.createElement('button');
      pBtn.className = 'page-btn' + (i === conf.page ? ' active' : '');
      pBtn.textContent = i;
      pBtn.addEventListener('click', () => onPageChange(i));
      btnGroup.appendChild(pBtn);
    }
    if (totalPages > 5) {
      const dots = document.createElement('span');
      dots.style.padding = '4px';
      dots.textContent = '...';
      btnGroup.appendChild(dots);

      const lastBtn = document.createElement('button');
      lastBtn.className = 'page-btn' + (totalPages === conf.page ? ' active' : '');
      lastBtn.textContent = totalPages;
      lastBtn.addEventListener('click', () => onPageChange(totalPages));
      btnGroup.appendChild(lastBtn);
    }

    // 次へ
    const next = document.createElement('button');
    next.className = 'page-btn';
    next.textContent = '次へ ›';
    next.disabled = (conf.page >= totalPages);
    next.addEventListener('click', () => onPageChange(conf.page + 1));
    btnGroup.appendChild(next);

    container.appendChild(btnGroup);
  }

  // 4. 集計・分析
  function loadAggregation() {
    const params = new URLSearchParams(buildFilterQuery());
    params.append('metric', state.aggConfig.metric);
    params.append('row_axis', state.aggConfig.rowAxis);
    if (state.aggConfig.colAxis) params.append('col_axis', state.aggConfig.colAxis);

    trackedFetch('php/admin_api.php?action=get_aggregation&' + params.toString())
      .then(r => r.json())
      .then(res => {
        if (!res.success) throw new Error(res.error);
        state.aggregationData = res.aggregation;
        renderAggregationView();
      })
      .catch(err => console.error('Aggregation error:', err));
  }

  function renderAggregationView() {
    const agg = state.aggregationData;
    if (!agg) return;

    const isMeeting = Boolean(MEETING_METRICS[agg.metric]);
    document.getElementById('btnExportMeetingSources').style.display = isMeeting ? 'inline-block' : 'none';
    document.getElementById('meetingAggregationNote').textContent = isMeeting
      ? 'MTは実施日基準です。数値セルまたはグラフの点・棒から根拠資料を確認できます。参加者不明は未判定、開催は個人割当なしです。' : '';
    if (isMeeting && !agg.meeting_sync?.available) {
      dom.pivotContainer.style.display = 'block';
      dom.chartContainer.style.display = 'none';
      dom.pivotContainer.textContent = 'SharePointの正常な同期データがありません。概要タブで接続状態を確認してください。';
      return;
    }
    const mode = state.aggConfig.viewMode;
    if (mode === 'pivot' || mode === 'table') {
      dom.chartContainer.style.display = 'none';
      dom.pivotContainer.style.display = 'block';
      renderPivotTable(agg);
    } else {
      dom.pivotContainer.style.display = 'none';
      dom.chartContainer.style.display = 'block';
      renderChart(agg, mode);
    }
  }

  // クロス集計表の描画
  function renderPivotTable(agg) {
    const isSingleAxis = (agg.col_keys.length === 1 && agg.col_keys[0] === '__TOTAL__');
    let html = `
      <div style="margin-bottom:12px;font-size:13px;color:#64748b;display:flex;justify-content:space-between;align-items:center;">
        <div>指標: <strong>${escapeHtml(METRIC_DEFINITIONS[agg.metric]?.name || agg.metric)}</strong> | 対象データ総数: <strong>${agg.grand_total} 件</strong></div>
        <div style="font-size:12px;">💡 数値セルをクリックすると、その根拠レコード一覧へドリルダウンします</div>
      </div>
      <table class="data-table pivot-table" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th>${escapeHtml(getRowAxisLabel(agg.row_axis))}</th>
    `;

    if (isSingleAxis) {
      html += `<th style="text-align:right;">集計件数</th>`;
    } else {
      agg.col_keys.forEach(ck => {
        html += `<th style="text-align:right;">${escapeHtml(ck)}</th>`;
      });
      html += `<th style="text-align:right;background:#f1f5f9;">合計</th>`;
    }
    html += `</tr></thead><tbody>`;

    if (agg.matrix.length === 0) {
      html += `<tr><td colspan="${agg.col_keys.length + 2}" style="text-align:center;padding:24px;color:#94a3b8;">集計データはありません</td></tr>`;
    } else {
      agg.matrix.forEach(row => {
        html += `<tr><td><strong>${escapeHtml(row.row_key)}</strong></td>`;
        if (isSingleAxis) {
          const val = row.cells['__TOTAL__'] || 0;
          const cls = val === 0 ? 'clickable-cell cell-zero' : 'clickable-cell';
          html += `<td class="${cls}" data-row="${escapeHtml(row.row_key)}" data-col="__TOTAL__">${val}</td>`;
        } else {
          agg.col_keys.forEach(ck => {
            const val = row.cells[ck] || 0;
            const cls = val === 0 ? 'clickable-cell cell-zero' : 'clickable-cell';
            html += `<td class="${cls}" data-row="${escapeHtml(row.row_key)}" data-col="${escapeHtml(ck)}">${val}</td>`;
          });
          html += `<td style="text-align:right;font-weight:700;background:#fafbfc;">${row.row_total}</td>`;
        }
        html += `</tr>`;
      });

      // 合計行
      html += `<tr style="background:#f8fafc;font-weight:700;border-top:2px solid #cbd5e1;"><td>総合計</td>`;
      if (isSingleAxis) {
        html += `<td style="text-align:right;">${agg.grand_total}</td>`;
      } else {
        agg.col_keys.forEach(ck => {
          html += `<td style="text-align:right;">${agg.col_totals[ck] || 0}</td>`;
        });
        html += `<td style="text-align:right;background:#e2e8f0;">${agg.grand_total}</td>`;
      }
      html += `</tr>`;
    }

    html += `</tbody></table>`;
    dom.pivotContainer.innerHTML = html;

    // ドリルダウン イベント
    dom.pivotContainer.querySelectorAll('.clickable-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const rowKey = cell.dataset.row;
        const colKey = cell.dataset.col;
        const val = parseInt(cell.textContent);
        if (val === 0) return;
        drillDown(agg, rowKey, colKey);
      });
    });
  }

  // グラフ描画 (高解像度 SVG チャート)
  function renderChart(agg, type) {
    const rows = agg.matrix;
    if (rows.length === 0) {
      dom.chartContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">表示するデータがありません</div>';
      return;
    }

    const width = 860;
    const height = 360;
    const padding = { top: 40, right: 30, bottom: 60, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...rows.map(r => r.row_total), 5);
    const stepX = chartW / rows.length;

    let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;font-family:sans-serif;">`;

    // グリッド線
    for (let i = 0; i <= 5; i++) {
      const yVal = Math.round((maxVal / 5) * i);
      const yPos = padding.top + chartH - (chartH / 5) * i;
      svg += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#e2e8f0" stroke-dasharray="3,3" />
        <text x="${padding.left - 10}" y="${yPos + 4}" font-size="11" fill="#94a3b8" text-anchor="end">${yVal}</text>
      `;
    }

    if (type === 'bar') {
      // 棒グラフ
      rows.forEach((r, idx) => {
        const x = padding.left + idx * stepX + stepX * 0.2;
        const bWidth = stepX * 0.6;
        const bHeight = (r.row_total / maxVal) * chartH;
        const y = padding.top + chartH - bHeight;

        svg += `
          <rect data-row-index="${idx}" x="${x}" y="${y}" width="${bWidth}" height="${bHeight}" fill="#3b82f6" rx="4" style="transition:all 0.2s;cursor:pointer;">
            <title>${escapeHtml(r.row_key)}: ${r.row_total}件 (クリックでドリルダウン)</title>
          </rect>
          <text x="${x + bWidth / 2}" y="${y - 6}" font-size="12" font-weight="600" fill="#1e293b" text-anchor="middle">${r.row_total}</text>
          <text x="${x + bWidth / 2}" y="${height - padding.bottom + 18}" font-size="11" fill="#64748b" text-anchor="middle" transform="rotate(15, ${x + bWidth / 2}, ${height - padding.bottom + 18})">${escapeHtml(r.row_key)}</text>
        `;
      });
    } else if (type === 'line') {
      // 折れ線グラフ
      let points = [];
      rows.forEach((r, idx) => {
        const x = padding.left + idx * stepX + stepX * 0.5;
        const y = padding.top + chartH - (r.row_total / maxVal) * chartH;
        points.push(`${x},${y}`);
      });

      svg += `<polyline fill="none" stroke="#2563eb" stroke-width="3" points="${points.join(' ')}" />`;

      rows.forEach((r, idx) => {
        const x = padding.left + idx * stepX + stepX * 0.5;
        const y = padding.top + chartH - (r.row_total / maxVal) * chartH;
        svg += `
          <circle data-row-index="${idx}" cx="${x}" cy="${y}" r="5" fill="#ffffff" stroke="#2563eb" stroke-width="3" style="cursor:pointer;">
            <title>${escapeHtml(r.row_key)}: ${r.row_total}件</title>
          </circle>
          <text x="${x}" y="${y - 10}" font-size="11" font-weight="600" fill="#1e293b" text-anchor="middle">${r.row_total}</text>
          <text x="${x}" y="${height - padding.bottom + 18}" font-size="11" fill="#64748b" text-anchor="middle" transform="rotate(15, ${x}, ${height - padding.bottom + 18})">${escapeHtml(r.row_key)}</text>
        `;
      });
    }

    svg += `</svg>`;

    dom.chartContainer.innerHTML = `
      <div style="margin-bottom:12px;font-size:13px;color:#64748b;">
        <strong>${escapeHtml(METRIC_DEFINITIONS[agg.metric]?.name || agg.metric)}</strong> の推移 (${type === 'bar' ? '棒グラフ' : '折れ線グラフ'})
      </div>
      ${svg}
    `;
    dom.chartContainer.querySelectorAll('[data-row-index]').forEach(glyph => {
      if (!MEETING_METRICS[agg.metric]) return;
      glyph.setAttribute('tabindex', '0');
      glyph.setAttribute('role', 'button');
      const open = () => drillDown(agg, agg.matrix[Number(glyph.dataset.rowIndex)].row_key, null);
      glyph.addEventListener('click', open);
      glyph.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
  }

  // ドリルダウン処理
  function drillDown(agg, rowKey, colKey) {
    if (MEETING_METRICS[agg.metric]) {
      showMeetingSources(agg, rowKey, colKey);
      return;
    }
    const records = (agg.source_records || []).filter(r => (rowKey == null || r.row_key === rowKey) && (colKey == null || colKey === '__TOTAL__' || r.col_key === colKey));
    showExactSources(agg.metric, records,agg);
  }

  function getRowAxisLabel(axis) {
    const map = {
      year: '年',
      month: '年月',
      week: '週',
      day: '日付',
      user: '参加者',
      origin: '導出起点',
      status: '手段ステータス'
    };
    return map[axis] || '集計単位';
  }

  // -------------------------------------------------------------
  // 詳細モーダル表示
  // -------------------------------------------------------------
  function showLessonDetailModal(item) {
    dom.modalOverlay.classList.add('detail-drawer');
    focusBeforeDetail = document.activeElement;
    dom.modalTitle.textContent = `教訓詳細 (${item.origin_name})`;
    dom.modalBody.innerHTML = `
      <div class="detail-section">
        <div class="detail-label">参加者</div>
        <div><strong>${escapeHtml(item.user_name)}</strong> (ID: ${item.user_id})</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">教訓内容</div>
        <div class="detail-box" style="font-weight:600;font-size:14px;color:#1e293b;">${escapeHtml(item.lesson_learned)}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">教訓の理由・重要性</div>
        <div class="detail-box">${escapeHtml(item.why_important || '（記載なし）')}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">活用機会</div>
        <div class="detail-box">${escapeHtml(item.opportunity || '（記載なし）')}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">関連する研究上の問い / 導出元</div>
        <div>${escapeHtml(item.question_content || '（なし）')}</div>
      </div>
      <div class="detail-section" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
        <div class="detail-label" style="color:#166534;">🌟 内省: 良かった点 & その理由</div>
        <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(item.eval_good || '（記載なし）')}</div>
        <div style="font-size:13px;color:#475569;">理由: ${escapeHtml(item.eval_good_reason || '（記載なし）')}</div>
      </div>
      <div class="detail-section" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;">
        <div class="detail-label" style="color:#991b1b;">⚠️ 内省: 悪かった点 & その理由</div>
        <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(item.eval_bad || '（記載なし）')}</div>
        <div style="font-size:13px;color:#475569;">理由: ${escapeHtml(item.eval_bad_reason || '（記載なし）')}</div>
      </div>
      <div class="detail-section" style="display:flex;gap:24px;font-size:12px;color:#64748b;margin-top:16px;">
        <div>作成日時: ${item.created_at}</div>
        <div>更新日時: ${item.updated_at}</div>
      </div>
    `;
    dom.modalOverlay.classList.add('active');
  }

  function showNodeDetailModal(node) {
    dom.modalOverlay.classList.add('detail-drawer');
    focusBeforeDetail = document.activeElement;
    dom.modalTitle.textContent = `手段ノード詳細`;
    dom.modalBody.innerHTML = `
      <div class="detail-section">
        <div class="detail-label">参加者</div>
        <div><strong>${escapeHtml(node.user_name)}</strong> (ID: ${node.user_id})</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">手段内容</div>
        <div class="detail-box" style="font-weight:600;font-size:14px;color:#1e293b;">${escapeHtml(node.content)}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">階層の深さ & ステータス</div>
        <div>階層深さ: <strong>第 ${node.depth} 階層</strong> | ステータス: <strong>${escapeHtml(node.status || '未着手')}</strong></div>
      </div>
      <div class="detail-section">
        <div class="detail-label">関連する研究上の問い</div>
        <div class="detail-box">${escapeHtml(node.question_content)}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">理由（直接記入・つながり）</div><div class="detail-box" style="white-space:pre-wrap">${node.reason_entries?.length ? node.reason_entries.map(r=>'<p><strong>'+escapeHtml(r.source)+'</strong>：'+escapeHtml(r.text)+'</p>').join('') : escapeHtml(node.reason_text || node.purpose || '（記載なし）')}</div><div class="detail-label">目的 / 想定所要時間</div>
        <div>目的: ${escapeHtml(node.purpose || '（記載なし）')} | 想定時間: ${escapeHtml(node.estimated_time || '（記載なし）')}</div>
      </div>
      <div class="detail-section" style="display:flex;gap:24px;font-size:12px;color:#64748b;margin-top:16px;">
        <div>作成日時: ${node.created_at}</div>
        <div>更新日時: ${node.updated_at}</div>
      </div>
    `;
    dom.modalOverlay.classList.add('active');
  }

  function showMetricInfoModal() {
    dom.modalTitle.textContent = `集計指標の厳密な定義一覧`;
    let html = `<div style="display:flex;flex-direction:column;gap:16px;">`;
    Object.keys(METRIC_DEFINITIONS).forEach(k => {
      const m = METRIC_DEFINITIONS[k];
      html += `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;background:#fafbfc;">
          <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:4px;">${escapeHtml(m.name)} (ID: <code>${k}</code>)</div>
          <div style="font-size:13px;color:#475569;margin-bottom:8px;">${escapeHtml(m.desc)}</div>
          <div style="display:grid;grid-template-columns:120px 1fr;gap:6px;font-size:12px;">
            <div style="color:#64748b;font-weight:600;">対象テーブル:</div><div><code>${escapeHtml(m.tables)}</code></div>
            <div style="color:#64748b;font-weight:600;">集計方法:</div><div>${escapeHtml(m.method)}</div>
            <div style="color:#64748b;font-weight:600;">抽出基準日時:</div><div>${escapeHtml(m.dateTarget)}</div>
            <div style="color:#64748b;font-weight:600;">重複除外ルール:</div><div>${escapeHtml(m.dedup)}</div>
            <div style="color:#64748b;font-weight:600;">注意事項:</div><div style="color:#b91c1c;">${escapeHtml(m.notes)}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    dom.modalBody.innerHTML = html;
    dom.modalOverlay.classList.add('active');
  }

  function closeModal() {
    dom.modalOverlay.classList.remove('active');
    dom.modalOverlay.classList.remove('detail-drawer');
    focusBeforeDetail?.focus();
  }

  // -------------------------------------------------------------
  // CSV / メタデータ出力 (UTF-8 BOM付き)
  // -------------------------------------------------------------
  function downloadCsv(filename, rows) {
    if(window.ForestCuration && /^(lessons_dataset|means_nodes_dataset|aggregation_|exact_sources_|participant_comparison)/.test(filename)){
      const live=window.ForestCuration.metadata();
      const saved=filename.startsWith('lessons_dataset')?state.lessonsMeta:filename.startsWith('means_nodes_dataset')?state.nodesMeta:filename.startsWith('aggregation_')?state.aggregationData:filename.startsWith('exact_sources_')?exactSourceMetadata:state.summaryData;
      if(!saved||saved.curation_revision!==live.revision||saved.curation_mode!==live.mode){alert('現在の整理版・表示モードで再取得が完了してから出力してください。前回の値を新しい条件として出力しません。');return;}
      const stamp=new Date().toISOString(),filter=JSON.stringify(saved.filter||{});
      rows=rows.map((r,i)=>r.concat(i===0?['整理版','集計モード','適用条件','出力日時']:[saved.curation_revision,saved.curation_mode,filter,stamp]));
    }
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const csvContent = rows.map(r => r.map(field => {
      let str = String(field == null ? '' : field);if(/^[\s]*[=+@\-]/.test(str))str="'"+str;
      return '"' + str.replace(/"/g, '""') + '"';
    }).join(',')).join('\r\n');

    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportLessonsCsv() {
    const items = state.lessonsData;
    const header = ['論理キー','整理状態','代表キー','教訓ID', '参加者ID', '参加者名', '導出起点', '教訓内容', '教訓の理由・重要性', '活用機会', '関連する研究上の問い', '良かった点', 'その理由', '悪かった点', 'その理由', '作成日時', '更新日時'];
    const rows = [header];
    items.forEach(it => {
      rows.push([
        it.source_key,it.curation_state,it.curation_representative,it.lesson_id, it.user_id, it.user_name, it.origin_name,
        it.lesson_learned, it.why_important, it.opportunity, it.question_content,
        it.eval_good, it.eval_good_reason, it.eval_bad, it.eval_bad_reason,
        it.created_at, it.updated_at
      ]);
    });
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 19);
    downloadCsv(`lessons_dataset_${stamp}.csv`, rows);
  }

  function exportNodesCsv() {
    const items = state.nodesData;
    const header = ['論理キー','整理状態','代表キー','ノードID', '参加者ID', '参加者名', '手段内容', '階層の深さ', 'ステータス', '関連する研究上の問い', '目的', '理由（直接記入・つながり）', '想定時間', '作成日時', '更新日時'];
    const rows = [header];
    items.forEach(it => {
      rows.push([
        it.source_key,it.curation_state,it.curation_representative,it.object_node_id, it.user_id, it.user_name, it.content,
        it.depth, it.status, it.question_content, it.purpose, it.reason_text, it.estimated_time,
        it.created_at, it.updated_at
      ]);
    });
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 19);
    downloadCsv(`means_nodes_dataset_${stamp}.csv`, rows);
  }

  function exportAggregationCsv() {
    if (state.aggregationData?.meeting_sync && !state.aggregationData.meeting_sync.available) {
      alert('SharePointを正常に同期してから出力してください。');
      return;
    }
    const agg = state.aggregationData;
    if (!agg) return;
    const isSingle = (agg.col_keys.length === 1 && agg.col_keys[0] === '__TOTAL__');
    const header = [getRowAxisLabel(agg.row_axis)];
    if (isSingle) {
      header.push('集計件数');
    } else {
      agg.col_keys.forEach(k => header.push(k));
      header.push('行合計');
    }
    const rows = [header];
    agg.matrix.forEach(r => {
      const row = [r.row_key];
      if (isSingle) {
        row.push(r.cells['__TOTAL__'] || 0);
      } else {
        agg.col_keys.forEach(k => row.push(r.cells[k] || 0));
        row.push(r.row_total);
      }
      rows.push(row);
    });
    // 合計行
    const totalRow = ['総合計'];
    if (isSingle) {
      totalRow.push(agg.grand_total);
    } else {
      agg.col_keys.forEach(k => totalRow.push(agg.col_totals[k] || 0));
      totalRow.push(agg.grand_total);
    }
    rows.push(totalRow);

    const stamp = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 19);
    const output = MEETING_METRICS[agg.metric] ? rows.map(row => row.map(value => typeof value === 'string' && /^[\s]*[=+@\-]/.test(value) ? "'" + value : value)) : rows;
    downloadCsv(`aggregation_${agg.metric}_${stamp}.csv`, output);
  }

  function exportMetadataJson() {
    const metadata = {
      exported_at: new Date().toISOString(),
      curation:window.ForestCuration?.metadata(),
      target_period: {
        start: state.filter.startDate,
        end: state.filter.endDate,
        date_basis: state.filter.dateBasis
      },
      selected_users: state.filter.userIds.length > 0 ? state.filter.userIds : 'all',
      summary: state.summaryData,
      metric_definitions: METRIC_DEFINITIONS,
      system_version: 'Research Workbench 1.0.0 (MySQL schema 2026-09)'
    };
    const jsonStr = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_metadata_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function renderMeetingSummary(meetings) {
    if (!meetings) return;
    const format = (value, key) => value == null ? '—' : value.toLocaleString('ja-JP') + (key === 'research_mt_days' ? ' 日' : key === 'general_mt_sessions' ? ' 回' : key === 'research_mt_files' ? ' 個' : ' 件');
    const ids = { kpiResearchMtTotal: 'research_mt_total', kpiResearchMtDays: 'research_mt_days',
      kpiAudioFiles: 'meeting_audio_files_total', kpiAudioSessions: 'meeting_audio_sessions_total', kpiAudioConfirmedLessons: 'audio_confirmed_lessons_total',
      kpiHistoricalShares: 'research_lesson_shares_assumed_total', kpiRecordedDiscussions: 'recorded_discussions_total',
      kpiReframingDiscussions: 'reframing_discussions_assumed_total', kpiCombinedShares: 'lesson_shares_with_assumptions_total',
      kpiSupplementalLessons: 'supplemental_lessons_total', kpiVerifiedLessons: 'verified_lessons_total', kpiLessonCandidates: 'lesson_candidates_total', kpiLessonReview: 'lesson_review_total',
      kpiGeneralMtSessions: 'general_mt_sessions', kpiSharedLessonsTotal: 'shared_lessons_total', kpiResearchMtFiles: 'research_mt_files' };
    Object.entries(ids).forEach(([id, key]) => { document.getElementById(id).textContent = format(meetings[key], key); });
    if (meetings.analysis_status) renderAnalysisStatus(meetings.analysis_status);
    const excluded = meetings.excluded_unmatched || {};
    const hiddenResearch = excluded.research_mt || 0;
    const hiddenShared = excluded.shared_lessons || 0;
    const hasHidden = hiddenResearch + hiddenShared > 0;
    document.getElementById('btnIncludeUnmatchedMeetings').style.display = hasHidden ? 'inline-block' : 'none';
    document.getElementById('meetingUnmatchedStatus').textContent = !meetings.sync.available ? '' : hasHidden
      ? `参加者フィルタにより、期間内の未判定資料を除外しています：研究MT ${hiddenResearch} 件・資料共有 ${hiddenShared} 件。取得には成功しています。下のボタンで未判定も表示できます（選択した参加者の実績とは区別されます）。`
      : `現在の条件に含まれる未判定：研究MT ${meetings.research_mt_unmatched} 件・資料共有 ${meetings.shared_lessons_unmatched} 件。`;
    renderMeetingSyncStatus(meetings.sync);
  }

  function renderMeetingSyncStatus(sync) {
    const date = sync.last_success_at ? new Date(sync.last_success_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未同期';
    const inventory = sync.inventory;
    const local = sync.source_mode === 'onedrive';
    document.getElementById('btnSyncMeetings').textContent = local ? 'OneDriveフォルダを再集計' : 'SharePointを手動同期';
    document.getElementById('meetingSyncStatus').textContent =
      `${sync.message} ${local ? '最終ローカル読み取り' : '最終正常同期'}：${date}（日本時間）` +
      (inventory ? ` ／ 取得日付フォルダ ${inventory.folders}・対象ファイル ${inventory.files}・除外ファイル ${inventory.excluded_files}・対象外項目 ${inventory.ignored_items}` : '');
    meetingCanSync = sync.configured && sync.result !== 'configuration_error';
    document.getElementById('btnSyncMeetings').disabled = meetingSyncing || !meetingCanSync || !meetingCsrf;
    document.getElementById('btnAnalyzeMeetingLessons').disabled = ['queued','running'].includes(lastAnalysisState) || !meetingCanSync || !meetingCsrf;
    document.getElementById('btnProcessMeetingAudio').disabled = ['queued','scanning','loading_model','converting','transcribing','matching'].includes(lastAudioPhase) || !meetingCanSync || !meetingCsrf;
  }

  async function loadMeetingSyncStatus() {
    try {
      const response = await trackedFetch('php/admin_api.php?action=get_meeting_sync');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      meetingCsrf = result.csrf_token;
      renderMeetingSyncStatus(result.sync);
    } catch (error) {
      document.getElementById('meetingSyncStatus').textContent = '同期状態の取得に失敗しました。画面を再読み込みしてください。';
    }
  }

  async function syncMeetings() {
    const button = document.getElementById('btnSyncMeetings');
    meetingSyncing = true;
    button.disabled = true;
    document.getElementById('meetingSyncStatus').textContent = 'MT資料の一覧を読み取り中です…';
    try {
      const response = await trackedFetch('php/admin_api.php?action=sync_meetings', {
        method: 'POST', body: new URLSearchParams({ csrf_token: meetingCsrf })
      });
      const result = await response.json();
      if (result.sync) renderMeetingSyncStatus(result.sync);
      if (!result.success) {
        document.getElementById('meetingSyncStatus').textContent += ' ' + (result.error || '同期に失敗しました。');
      }
      refreshAll();
    } catch (error) {
      document.getElementById('meetingSyncStatus').textContent = '同期結果を確認できませんでした。前回の正常データを保持しています。';
      await loadMeetingSyncStatus();
    } finally {
      meetingSyncing = false;
      button.disabled = !meetingCanSync || !meetingCsrf;
    }
  }

  function meetingLink(url, label) {
    try {
      if (new URL(url).protocol === 'https:') return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    } catch (error) { /* Missing URLs are rendered as plain names. */ }
    return escapeHtml(label);
  }

  function historicalEvidenceHtml(record) {
    const item=record.historical;
    if(!item)return '';
    const discussion=item.record_type==='recorded_discussion';
    return `<div class="detail-box"><strong>${discussion ? '個別議論：録音あり（利用者申告）' : '研究MT冒頭の教訓共有：利用者指定の仮定'}</strong>
      <p>${escapeHtml(item.source_note || '')}</p>
      <p>${discussion ? '問い直しが起きたことは利用者指定の仮定です。録音自体は未取り込みで、音声解析は行っていません。' : '教訓本文は未取得のため、本文を確認した教訓件数には含めません。'}</p></div>`;
  }

  function supplementalEvidenceHtml(record) {
    const entries = record.supplemental ? [record.supplemental] : (record.supplements || []);
    return entries.map(item => `<div class="detail-box"><strong>${escapeHtml(item.participant_name || "")} ファイルなしの教訓共有（利用者確認済み）</strong>
      <p>${escapeHtml(item.lesson)}</p><p>大切な理由：${escapeHtml(item.why_important || '')}</p>
      <p>活用機会：${escapeHtml(item.opportunity || '')}</p>
      <a href="php/admin_api.php?action=preview_supplement_evidence&record_id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener noreferrer">根拠のスクリーンショットを表示</a></div>`).join('');
  }

  function showMeetingSources(agg, rowKey, colKey) {
    const records = agg.source_records.filter(record => (rowKey == null || record.row_key === rowKey) && (!colKey || colKey === '__TOTAL__' || record.col_key === colKey));
    dom.modalTitle.textContent = `${METRIC_DEFINITIONS[agg.metric].name}：${records.length} 件の根拠`;
    dom.modalBody.innerHTML = '<p>研究MTの複数形式は同じ1件の中にまとめて表示します。ファイルなしの共有は補足記録として区別します。</p>' + records.map(record => `
      <div class="detail-section">
        <strong>${escapeHtml(record.meeting_date)} ／ ${escapeHtml(record.name)}</strong>
        <p>${escapeHtml(record.user_name)}${record.participant_conflict ? '（対応表の矛盾あり）' : ''} ／ 元ファイル ${record.file_count} 個</p>
        <p>${meetingLink(record.folder.web_url, record.folder.name)}</p>
        ${supplementalEvidenceHtml(record)}
        ${historicalEvidenceHtml(record)}
        ${record.audio_evidence ? `<p>対応確認済みの教訓・資料：${escapeHtml(record.audio_evidence.lesson || record.name)}</p><a href="php/admin_api.php?action=stream_meeting_audio&recording_id=${encodeURIComponent(record.audio_evidence.recording_id)}#t=${record.audio_evidence.start},${record.audio_evidence.end}" target="_blank" rel="noopener noreferrer">根拠音声の該当区間を開く</a>` : ''}
        ${record.files[0]?.analysis ? `<p>教訓判定：${escapeHtml(record.files[0].analysis.verified ? (record.files[0].analysis.effective_status==='yes'?'あり（確認済み）':'なし（確認済み）') : analysisLabels[record.files[0].analysis.effective_status])}</p>${record.files[0].analysis.evidence.map(e=>`<blockquote>${escapeHtml(e.location)}：${escapeHtml(e.text)}</blockquote>`).join('')}` : ''}
        <ul>${record.files.map(file => `<li>${meetingLink(file.web_url, file.name)} <small>（ID: ${escapeHtml(file.id)}）</small>${file.local_path ? `<br><code style="overflow-wrap:anywhere;">${escapeHtml(file.local_path)}</code>` : ''}</li>`).join('')}</ul>
      </div>`).join('');
    dom.modalOverlay.classList.add('active');
  }

  function exportMeetingSourcesCsv() {
    const agg = state.aggregationData;
    if (!agg || !MEETING_METRICS[agg.metric] || !agg.meeting_sync?.available) {
      alert('SharePointのMT指標を選び、正常な同期結果があることを確認してください。');
      return;
    }
    const rows = [['指標', '集計単位ID', '実施日', '参加者', '参加者ID', '行', '列', '元ファイル数', 'ドライブID', '日付フォルダID', 'フォルダ名', 'ファイルID', 'ファイル名', '資料URL', 'フォルダURL', 'ローカルパス', '教訓判定', '人による確認済み', '判定理由', '根拠文章', '共有種別', '補足記録ID', '補足教訓', '補足理由', '補足機会', '根拠画像URL', '記録区分', '仮定の内容', '記録の出典', '音声ID', '音声開始秒', '音声終了秒', '音声対応教訓']];
    agg.source_records.forEach(record => {
      const files = record.files.length ? record.files : [null];
      files.forEach(file => rows.push([METRIC_DEFINITIONS[agg.metric].name, record.record_id, record.meeting_date,
        record.user_name, record.user_id, record.row_key, record.col_key, record.file_count,
        record.folder.drive_id, record.folder.id, record.folder.name, file?.id, file?.name, file?.web_url, record.folder.web_url, file?.local_path || record.folder.local_path || '', file?.analysis?.effective_status || (record.supplemental ? 'yes':''), (file?.analysis?.verified || record.supplemental) ? 'はい':'いいえ', file?.analysis?.reason || '', (file?.analysis?.evidence || []).map(e=>e.location+': '+e.text).join(' / '), record.historical ? (record.historical.record_type==='recorded_discussion' ? '録音あり議論（利用者申告）':'研究MT教訓共有（仮定）') : record.supplemental ? 'ファイルなし共有':'資料ファイル', record.supplemental?.id || '', record.supplemental?.lesson || '', record.supplemental?.why_important || '', record.supplemental?.opportunity || '', record.supplemental ? 'php/admin_api.php?action=preview_supplement_evidence&record_id='+encodeURIComponent(record.supplemental.id) : '', record.historical?.record_type || '', record.historical ? (record.historical.record_type==='recorded_discussion' ? '問い直しが起きた議論と仮定':'教訓を共有したと仮定') : '', record.historical?.source_note || '', record.audio_evidence?.recording_id || '', record.audio_evidence?.start ?? '', record.audio_evidence?.end ?? '', record.audio_evidence?.lesson || '']));
    });
    // One evidence row per file; aggregate by 集計単位ID to reproduce the metric.
    const safeRows = rows.map(row => row.map(value => typeof value === 'string' && /^[\s]*[=+@\-]/.test(value) ? "'" + value : value));
    downloadCsv(`meeting_sources_${agg.metric}_${new Date().toISOString().slice(0, 10)}.csv`, safeRows);
  }

  const busyRequests = new Map();
  const pendingControllers = new Map();
  let busyTimer = null;
  let requestError = '';
  const requestLabels = { get_filter_options:'参加者と期間を取得中', get_summary:'概要を集計中', get_lessons:'教訓一覧を取得中',
    get_nodes:'手段一覧を取得中', get_aggregation:'集計表・グラフを計算中', sync_meetings:'MT資料の一覧を読み取り中',
    get_meeting_audio:'音声一覧を確認中', start_meeting_audio:'音声処理を起動中', get_audio_transcript:'文字起こしを取得中', save_audio_review:'議論と教訓の対応を保存中',
    get_meeting_sync:'接続状態を確認中', start_meeting_analysis:'本文解析を起動中', get_meeting_reviews:'判定結果を取得中', save_meeting_review:'確認結果を保存中' };

  function renderBusy() {
    const box = document.getElementById('dashboardProcessing');
    const text = document.getElementById('dashboardProcessingText');
    const labels = [...busyRequests.values()].map(item => item.label + '（' + Math.floor((Date.now()-item.started)/1000) + '秒）');
    box.style.display = labels.length || requestError ? 'flex' : 'none';
    const headerHeight = document.querySelector('.dashboard-header')?.getBoundingClientRect?.().height;
    if (headerHeight) box.style.top = headerHeight + 'px';
    box.classList.toggle?.('has-error', !labels.length && Boolean(requestError));
    text.textContent = labels.length ? labels.join(' ／ ') + '。完了までは前回の表示値が残る場合があります。' : requestError;
    document.getElementById('dashboardRetry').style.display = !labels.length && requestError ? 'inline-block' : 'none';
    document.querySelector('main')?.setAttribute('aria-busy', labels.length ? 'true' : 'false');
    const aggBusy = busyRequests.has('get_aggregation');
    document.getElementById('btnExportAggregation').disabled = aggBusy;
    document.getElementById('btnExportMeetingSources').disabled = aggBusy;
    document.getElementById('btnExportLessons').disabled = busyRequests.has('get_lessons');
    document.getElementById('btnExportNodes').disabled = busyRequests.has('get_nodes');
  }

  async function trackedFetch(url, options = {}) {
    const action = new URL(url, 'http://local/').searchParams.get('action') || 'request';
    const quiet = action === 'get_meeting_analysis' || action === 'get_meeting_audio';
    const key = action === 'save_meeting_review' ? action + ':' + options.body?.get('file_key') : action;
    pendingControllers.get(key)?.abort();
    const controller = new AbortController();
    pendingControllers.set(key, controller);
    if (!quiet) {
      requestError = '';
      busyRequests.set(key, { label: requestLabels[action] || 'データを取得中', started: Date.now() });
      if (!busyTimer) busyTimer = setInterval(renderBusy, 1000);
      renderBusy();
    }
    try {
      const response = await globalThis.fetch(url, { ...options, signal: controller.signal });
      const data = await response.json();
      if (controller.signal.aborted) throw new DOMException('Superseded', 'AbortError');
      if (!response.ok || data.success === false) {
        if (!quiet) requestError = (requestLabels[action] || '処理') + '：' + (data.error || '取得に失敗しました。再実行してください。');
      }
      return { ok: response.ok, status: response.status, json: () => Promise.resolve(data) };
    } catch (error) {
      if (error.name !== 'AbortError' && !quiet) requestError = (requestLabels[action] || '処理') + 'に失敗しました。前回の結果を表示しています。再実行してください。';
      throw error;
    } finally {
      if (pendingControllers.get(key) === controller) {
        pendingControllers.delete(key); busyRequests.delete(key);
      }
      if (!busyRequests.size && busyTimer) { clearInterval(busyTimer); busyTimer = null; }
      if (!quiet) renderBusy();
    }
  }

  let analysisPoll = null;
  let lastAnalysisState = '';
  let analysisItems = [];
  let analysisPage = 0;
  const analysisLabels = { yes:'あり（自動候補）', no:'なし（自動判定）', review:'要確認', unprocessed:'未解析' };

  function renderAnalysisStatus(status) {
    const running = ['queued', 'running'].includes(status.state);
    document.getElementById('lessonAnalysisProgress').textContent =
      `${running ? '本文解析中' : status.state === 'complete' ? '本文解析完了' : '本文解析'}：${status.done || 0} / ${status.total || 0} 件` +
      (status.current_file ? ` ／ ${status.current_file}` : '') + ` ／ ${status.message || ''}`;
    const progress = document.getElementById('lessonAnalysisBar');
    progress.max = Math.max(status.total || 1, 1); progress.value = status.done || 0;
    progress.style.display = running ? 'block' : 'none';
    document.getElementById('btnAnalyzeMeetingLessons').disabled = running || !meetingCsrf || !meetingCanSync;
    if (['queued','running'].includes(lastAnalysisState) && status.state === 'complete') {
      refreshAll();
      if (document.getElementById('meetingLessonReviewPanel').open) loadLessonReviews();
    }
    lastAnalysisState = status.state;
    if (analysisPoll) clearTimeout(analysisPoll);
    analysisPoll = setTimeout(pollAnalysisStatus, running ? 1500 : 15000);
  }

  async function pollAnalysisStatus() {
    try {
      const result = await (await trackedFetch('php/admin_api.php?action=get_meeting_analysis')).json();
      if (!result.success) throw new Error(result.error);
      renderAnalysisStatus(result.analysis);
    } catch (error) {
      document.getElementById('lessonAnalysisProgress').textContent = '解析状態の取得に失敗しました。解析が止まったとは限りません。再確認します。';
      analysisPoll = setTimeout(pollAnalysisStatus, 5000);
    }
  }

  async function startLessonAnalysis() {
    document.getElementById('btnAnalyzeMeetingLessons').disabled = true;
    try {
      const result = await (await trackedFetch('php/admin_api.php?action=start_meeting_analysis', {
        method:'POST', body: new URLSearchParams({csrf_token:meetingCsrf})
      })).json();
      if (!result.success) throw new Error(result.error);
      renderAnalysisStatus(result.analysis);
    } catch (error) {
      document.getElementById('lessonAnalysisProgress').textContent = error.message;
      document.getElementById('btnAnalyzeMeetingLessons').disabled = false;
    }
  }

  async function loadLessonReviews() {
    try {
      const result = await (await trackedFetch('php/admin_api.php?action=get_meeting_reviews&'+buildFilterQuery())).json();
      if (!result.success) throw new Error(result.error);
      analysisItems = result.items; analysisPage = 0; renderLessonReviews();
    } catch (error) { document.getElementById('lessonReviewMessage').textContent = '判定一覧を取得できませんでした。再表示してください。'; }
  }

  function renderLessonReviews() {
    const filter = document.getElementById('lessonReviewFilter').value;
    const items = analysisItems.filter(record => {
      const a=record.files[0]?.analysis;
      return filter==='all' || (filter==='verified' ? a?.verified : filter===a?.effective_status);
    });
    const start=analysisPage*10;
    document.getElementById('lessonReviewMessage').textContent = `現在の共通フィルタに該当：${items.length} 件。自動候補は人による確認済み件数に含めません。`;
    document.getElementById('lessonReviewBody').innerHTML = items.slice(start,start+10).map(record => {
      const file=record.files[0], a=file.analysis;
      const index=analysisItems.indexOf(record);
      const label=a.verified ? (a.effective_status==='yes' ? 'あり（確認済み）' : 'なし（確認済み）') : analysisLabels[a.effective_status];
      return `<tr><td>${escapeHtml(record.meeting_date)}<br>${escapeHtml(record.user_name)}</td>
        <td>${meetingLink(file.web_url,file.name)}${/\.(pdf|png|jpe?g|gif|webp)$/i.test(file.name) ? `<br><a href="php/admin_api.php?action=preview_meeting_file&file_key=${encodeURIComponent(file.file_key)}" target="_blank" rel="noopener noreferrer">資料を開いて確認</a>` : ''}${file.local_path ? `<br><small style="overflow-wrap:anywhere">${escapeHtml(file.local_path)}</small>` : ''}</td>
        <td><strong>${escapeHtml(label)}</strong><p>${escapeHtml(a.reason)}</p>${a.evidence.map(e=>`<blockquote>${escapeHtml(e.location)}：${escapeHtml(e.text)}</blockquote>`).join('')}</td>
        <td>${['yes','no','clear'].map(decision=>`<button type="button" class="btn-secondary" data-review-index="${index}" data-decision="${decision}" ${!a.signature?'disabled':''}>${decision==='yes'?'教訓ありを確認':decision==='no'?'教訓なしを確認':'確認を取り消す'}</button>`).join('')}</td></tr>`;
    }).join('') || '<tr><td colspan="4">該当する資料はありません。</td></tr>';
    document.getElementById('lessonReviewPrev').disabled=analysisPage===0;
    document.getElementById('lessonReviewNext').disabled=start+10>=items.length;
  }

  async function saveLessonReview(button) {
    const record=analysisItems[Number(button.dataset.reviewIndex)];
    if (!record) return;
    const file=record.files[0];button.disabled=true;
    try {
      const result=await (await trackedFetch('php/admin_api.php?action=save_meeting_review',{
        method:'POST', body:new URLSearchParams({csrf_token:meetingCsrf,file_key:file.file_key,signature:file.analysis.signature,decision:button.dataset.decision})
      })).json();
      if (!result.success) throw new Error(result.error);
      await loadLessonReviews(); refreshAll();
    } catch(error) { document.getElementById('lessonReviewMessage').textContent=error.message; button.disabled=false; }
  }

  function setupLessonAnalysis() {
    document.getElementById('dashboardRetry').addEventListener('click',()=>{requestError='';refreshAll();});
    document.getElementById('btnAnalyzeMeetingLessons').addEventListener('click',startLessonAnalysis);
    document.getElementById('meetingLessonReviewPanel').addEventListener('toggle',event=>{if(event.target.open)loadLessonReviews();});
    document.getElementById('lessonReviewFilter').addEventListener('change',()=>{analysisPage=0;renderLessonReviews();});
    document.getElementById('lessonReviewPrev').addEventListener('click',()=>{analysisPage--;renderLessonReviews();});
    document.getElementById('lessonReviewNext').addEventListener('click',()=>{analysisPage++;renderLessonReviews();});
    document.getElementById('lessonReviewBody').addEventListener('click',event=>{const button=event.target.closest('[data-review-index]');if(button)saveLessonReview(button);});
    pollAnalysisStatus();
  }

  let audioPoll = null;
  let audioInventory = null;
  let currentAudio = null;
  let audioPage = 0;
  let lastAudioPhase = '';
  function audioTime(seconds) {
    if (seconds == null || !Number.isFinite(Number(seconds))) return '時刻不明';
    const s=Math.floor(Number(seconds));return String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  }
  function renderAudioStatus(state) {
    const labels={never:'未処理',queued:'起動待ち',scanning:'音声を取り込み中',loading_model:'音声認識モデルを読み込み中',converting:'音声を変換中',transcribing:'文字起こし中',matching:'教訓と照合中',complete:'処理完了',complete_with_errors:'一部処理に失敗',file_error:'音声の処理に失敗',failed:'処理中断',interrupted:'進捗停止',unconfigured:'未設定'};
    const running=['queued','scanning','loading_model','converting','transcribing','matching'].includes(state.state);
    document.getElementById('meetingAudioProgress').textContent = (labels[state.state] || state.state)+'：'+(state.message || '')+
      (state.current_file ? ' ／ '+state.current_file : '')+
      (state.duration ? ` ／ 処理済み音声 ${audioTime(state.processed_seconds)} / ${audioTime(state.duration)}` : '')+
      (state.total ? ` ／ ファイル ${state.done || 0}/${state.total}` : '');
    const bar=document.getElementById('meetingAudioProgressBar');bar.style.display=state.duration&&running?'block':'none';bar.max=state.duration||1;bar.value=state.processed_seconds||0;
    document.getElementById('btnProcessMeetingAudio').disabled=running || !meetingCsrf || !meetingCanSync;
    if(running && ['complete','complete_with_errors'].includes(lastAudioPhase))document.getElementById('meetingAudioMessage').textContent='再処理中です。前回の文字起こし・確認結果を表示する場合があります。';
    if(['complete','complete_with_errors'].includes(state.state)&&!['complete','complete_with_errors',''].includes(lastAudioPhase)) {
      if(currentAudio)loadAudioTranscript(currentAudio.recording.id);
    }
    lastAudioPhase=state.state;
  }
  async function pollMeetingAudio() {
    try {
      const result=await (await trackedFetch('php/admin_api.php?action=get_meeting_audio&'+buildFilterQuery())).json();
      if(!result.success)throw new Error(result.error);
      audioInventory=result.audio;renderAudioStatus(audioInventory.status);
      document.getElementById('meetingAudioSourceCount').textContent=`現在の期間内の音声ファイル：${audioInventory.source_files.length} 件。音声は資料共有数・教訓共有数に含めません。録音はMT全体のため、参加者指定で除外しません。`;
      const select=document.getElementById('meetingAudioSelect'),selected=select.value;
      select.innerHTML='<option value="">録音を選択してください</option>'+audioInventory.recordings.map(r=>`<option value="${escapeHtml(r.id)}">${escapeHtml(r.meeting_date)} ${r.kind==='general'?'全体MT':'研究MT'} ／ ${escapeHtml(r.name)} ／ ${escapeHtml(({complete:'文字起こし完了',processing:'処理中',failed:'失敗'})[r.state] || '未処理')}${r.source_present?'':'（元ファイルは現在の一覧にありません）'}</option>`).join('');
      if(audioInventory.recordings.some(r=>r.id===selected))select.value=selected;
      const running=['queued','scanning','loading_model','converting','transcribing','matching'].includes(audioInventory.status.state);
      if(audioPoll)clearTimeout(audioPoll);audioPoll=setTimeout(pollMeetingAudio,running?2000:15000);
    } catch(error) {
      if(error.name==='AbortError')return;
      document.getElementById('meetingAudioProgress').textContent='音声処理の状態を取得できません。処理が止まったとは限りません。再確認します。';
      audioPoll=setTimeout(pollMeetingAudio,5000);
    }
  }
  async function startMeetingAudio() {
    document.getElementById('btnProcessMeetingAudio').disabled=true;
    try {
      const result=await (await trackedFetch('php/admin_api.php?action=start_meeting_audio',{method:'POST',body:new URLSearchParams({csrf_token:meetingCsrf})})).json();
      if(!result.success)throw new Error(result.error);
      renderAudioStatus(result.audio);pollMeetingAudio();
    } catch(error) {document.getElementById('meetingAudioProgress').textContent=error.message;document.getElementById('btnProcessMeetingAudio').disabled=false;}
  }
  const audioDrafts=new Map();let audioSaving=false,audioLoadSequence=0;
  function audioDraftKey(index){return currentAudio.recording.id+':'+currentAudio.transcript.context_signature+':'+currentAudio.transcript.blocks[index].id;}
  function rememberAudioInputs(){if(!currentAudio)return;document.querySelectorAll('#meetingAudioBlocks [data-block-index]').forEach(section=>{const index=Number(section.dataset.blockIndex),start=section.querySelector('[data-audio-start]'),end=section.querySelector('[data-audio-end]'),lessons=section.querySelector('[data-audio-lessons]');if(!start||!end||!lessons)return;const block=currentAudio.transcript.blocks[index],review=block.review;const draft={start:start.value,end:end.value,ids:[...lessons.selectedOptions].map(o=>o.value)};const saved={start:String(review?.start??block.start),end:String(review?.end??block.end),ids:review?.decision==='confirmed'?review.lesson_ids:[]};if(JSON.stringify(draft)!==JSON.stringify(saved))audioDrafts.set(audioDraftKey(index),draft);else audioDrafts.delete(audioDraftKey(index));});}
  if(typeof window!=='undefined')window.addEventListener('beforeunload',e=>{rememberAudioInputs();if(audioSaving||audioDrafts.size){e.preventDefault();e.returnValue='';}});
  async function loadAudioTranscript(id) {
    rememberAudioInputs();const sequence=++audioLoadSequence;const previousId=currentAudio?.recording.id;
    if(!id){currentAudio=null;document.getElementById('meetingAudioDetail').style.display='none';const p=document.getElementById('meetingAudioPlayer');p.pause();p.style.display='none';return;}
    try {
      const result=await (await trackedFetch('php/admin_api.php?action=get_audio_transcript&recording_id='+encodeURIComponent(id))).json();
      if(!result.success)throw new Error(result.error);
      if(sequence!==audioLoadSequence)return;currentAudio=result.data;if(previousId!==id)audioPage=0;
      const player=document.getElementById('meetingAudioPlayer');
      if(player.dataset.recordingId!==id){player.src='php/admin_api.php?action=stream_meeting_audio&recording_id='+encodeURIComponent(id);player.dataset.recordingId=id;}
      player.style.display='block';document.getElementById('meetingAudioDetail').style.display='block';renderAudioTranscript();
    } catch(error) {document.getElementById('meetingAudioMessage').textContent=error.message;}
  }
  function renderAudioTranscript() {
    if(!currentAudio)return;
    const {recording,transcript}=currentAudio,lessons=recording.context.lessons;
    document.getElementById('meetingAudioMessage').textContent=`${recording.meeting_date} ${recording.kind==='general'?'全体MT':'研究MT'} ／ ${recording.name} ／ ${transcript.state==='complete'?'文字起こし完了':'文字起こし途中'}。当日の教訓・資料候補 ${lessons.length} 件。L3の判定基準は未設定のため、今回はL3を自動判定しません。`;
    document.getElementById('meetingAudioLessons').innerHTML=lessons.map(l=>`<details><summary>${escapeHtml(l.title)}</summary><p>${escapeHtml(l.text || '本文はまだ取得できていません。元資料を確認してください。')}</p></details>`).join('')||'当日の教訓候補がありません。資料の教訓解析後に再処理すると、文字起こしを再利用して照合できます。';
    const blocks=transcript.blocks || [];
    document.getElementById('meetingAudioBlocks').innerHTML=blocks.slice(audioPage*5,audioPage*5+5).map((block,i)=>{
      const index=audioPage*5+i,review=block.review,draft=audioDrafts.get(audioDraftKey(index));
      const selected=draft?.ids||(review?.decision==='confirmed'?review.lesson_ids:[]);
      const status=review ? (review.decision==='none'?'教訓との対応なしを確認済み':'教訓との対応を確認済み') : '対応未確認';
      return `<section class="audio-block" data-block-index="${index}"><h4>${audioTime(block.start)}〜${audioTime(block.end)} ／ ${escapeHtml(status)}${draft?' ／ 未保存の入力あり':''}</h4>
        <button type="button" class="btn-secondary" data-audio-play="${index}">この区間を再生</button><p class="audio-transcript-text">${escapeHtml(block.text)}</p>
        <p>対応候補：${(block.candidates || []).map(c=>{const l=lessons.find(l=>l.id===c.lesson_id);return escapeHtml(l?.title || c.lesson_id)+'（候補スコア '+c.score+'）';}).join(' ／ ') || '候補なし・手動で確認してください'}</p>
        <label>開始秒 <input type="number" min="0" step="0.1" data-audio-start value="${escapeHtml(draft?.start ?? review?.start ?? block.start)}"></label>
        <label>終了秒 <input type="number" min="0" step="0.1" data-audio-end value="${escapeHtml(draft?.end ?? review?.end ?? block.end)}"></label>
        <label>対応する教訓・資料（複数選択可）<select multiple data-audio-lessons size="4">${lessons.map(l=>`<option value="${escapeHtml(l.id)}" ${selected.includes(l.id)?'selected':''}>${escapeHtml(l.title)}</option>`).join('')}</select></label>
        <div>${['confirmed','none','clear'].map(d=>`<button type="button" class="btn-secondary" data-audio-save="${index}" data-audio-decision="${d}" ${transcript.state!=='complete'?'disabled':''}>${d==='confirmed'?'選択した教訓との対応を確認':d==='none'?'教訓との対応なし':'確認を取り消す'}</button>`).join('')}</div></section>`;
    }).join('') || (transcript.state==='complete'?'文字起こしに発言を検出できませんでした。':'処理済みの発言：'+escapeHtml((transcript.segments || []).map(s=>audioTime(s.start)+' '+s.text).join('\n')));
    document.getElementById('meetingAudioPrev').disabled=audioPage===0;document.getElementById('meetingAudioNext').disabled=(audioPage+1)*5>=blocks.length;
  }
  function playAudioBlock(index) {
    const block=currentAudio?.transcript.blocks[index];if(!block)return;
    const player=document.getElementById('meetingAudioPlayer');
    const start=block.review?.start ?? block.start,end=block.review?.end ?? block.end;
    const play=()=>{player.currentTime=start;player.dataset.stopAt=String(end);player.play().catch(()=>{document.getElementById('meetingAudioMessage').textContent='再生ボタンを押して音声を再生してください。';});};
    if(player.readyState>=1)play();else player.addEventListener('loadedmetadata',play,{once:true});
  }
  async function saveAudioLink(button) {
    if(audioSaving)return;rememberAudioInputs();const recordingId=currentAudio.recording.id,index=Number(button.dataset.audioSave),key=audioDraftKey(index);const sentDraft=JSON.stringify(audioDrafts.get(key));const section=button.closest('[data-block-index]'),block=currentAudio.transcript.blocks[Number(button.dataset.audioSave)];if(!block)return;
    const ids=[...section.querySelector('[data-audio-lessons]').selectedOptions].map(o=>o.value);
    audioSaving=true;section.querySelectorAll('button,input,select').forEach(e=>e.disabled=true);
    try {
      const body=new URLSearchParams({csrf_token:meetingCsrf,recording_id:recordingId,block_id:block.id,
        context_signature:currentAudio.transcript.context_signature,lesson_ids:JSON.stringify(ids),start:section.querySelector('[data-audio-start]').value,end:section.querySelector('[data-audio-end]').value,decision:button.dataset.audioDecision});
      const result=await (await trackedFetch('php/admin_api.php?action=save_audio_review',{method:'POST',body})).json();
      if(!result.success)throw new Error(result.error);if(JSON.stringify(audioDrafts.get(key))===sentDraft)audioDrafts.delete(key);if(currentAudio?.recording.id===recordingId){const result=await (await trackedFetch('php/admin_api.php?action=get_audio_transcript&recording_id='+encodeURIComponent(recordingId))).json();if(!result.success)throw Error(result.error);if(currentAudio?.recording.id===recordingId){currentAudio=result.data;renderAudioTranscript();}}
    } catch(error){document.getElementById('meetingAudioMessage').textContent=error.message;}finally{audioSaving=false;section.querySelectorAll('button,input,select').forEach(e=>e.disabled=false);}
  }
  function exportAudioTranscript() {
    if(!currentAudio)return;
    const t=currentAudio.transcript,lessons=currentAudio.recording.context.lessons;
    const rows=[['開催日','録音名','開始秒','終了秒','発言','対応状態','確認済みの対応先','自動候補','L3判定']];
    for(const b of t.blocks || [])rows.push([currentAudio.recording.meeting_date,currentAudio.recording.name,b.review?.start ?? b.start,b.review?.end ?? b.end,b.text,b.review?.decision || 'unconfirmed',(b.review?.lesson_ids || []).map(id=>lessons.find(l=>l.id===id)?.title || id).join(' / '),(b.candidates || []).map(c=>lessons.find(l=>l.id===c.lesson_id)?.title || c.lesson_id).join(' / '),'判定基準未設定']);
    downloadCsv('meeting_audio_'+currentAudio.recording.meeting_date+'.csv',rows.map(row=>row.map(v=>typeof v==='string'&&/^[\s]*[=+@\-]/.test(v)?"'"+v:v)));
  }
  function setupMeetingAudio() {
    for(const event of ['input','change'])document.getElementById('meetingAudioBlocks').addEventListener(event,()=>{rememberAudioInputs();document.getElementById('meetingAudioMessage').textContent=audioDrafts.size?'未保存の対応入力 '+audioDrafts.size+'区間。各区間の確認ボタンで保存してください。':'対応入力は保存内容と一致しています。';});
    document.getElementById('btnProcessMeetingAudio').addEventListener('click',startMeetingAudio);
    document.getElementById('meetingAudioSelect').addEventListener('change',e=>loadAudioTranscript(e.target.value));
    document.getElementById('meetingAudioBlocks').addEventListener('click',e=>{const play=e.target.closest('[data-audio-play]');if(play)playAudioBlock(Number(play.dataset.audioPlay));const save=e.target.closest('[data-audio-save]');if(save)saveAudioLink(save);});
    document.getElementById('meetingAudioPrev').addEventListener('click',()=>{rememberAudioInputs();audioPage--;renderAudioTranscript();});
    document.getElementById('meetingAudioNext').addEventListener('click',()=>{rememberAudioInputs();audioPage++;renderAudioTranscript();});
    document.getElementById('btnExportAudioTranscript').addEventListener('click',exportAudioTranscript);
    document.getElementById('meetingAudioPlayer').addEventListener('timeupdate',e=>{const p=e.target;if(p.dataset.stopAt && p.currentTime>=Number(p.dataset.stopAt)){p.pause();delete p.dataset.stopAt;}});
    pollMeetingAudio();
  }

  let redesignReady = false;
  let restoringTab = false;
  const tabScroll = {};
  let exactSources = [];
  let exactMetric = '';
  let focusBeforeDetail = null;
  const comparisonGroups = {
    basic: ['maps_total','lessons_total','nodes_total','journals_total','reflections_total','lessons_updated'],
    lessons: ['lessons_total','lessons_map','lessons_journal','lessons_updated','nodes_with_reason','nodes_completed','reflections_total'],
    research: ['mt_research_presentations','mt_research_sessions','mt_recorded_discussions','mt_reframing_discussions_assumed','mt_research_lesson_shares_assumed'],
    general: ['mt_general_sessions','mt_shared_files','mt_supplemental_lessons','mt_verified_lessons','mt_lesson_candidates','mt_lesson_review','mt_lesson_shares_with_assumptions'],
    audio: ['mt_audio_confirmed_lessons']
  };
  // Keep the order aligned with renderSummary's metric dictionary.
  const comparisonKeys = ['maps_total','lessons_total','lessons_map','lessons_journal','nodes_total','nodes_completed','nodes_with_reason','journals_total','reflections_total','lessons_updated','mt_research_presentations','mt_research_sessions','mt_general_sessions','mt_shared_files','mt_supplemental_lessons','mt_verified_lessons','mt_lesson_candidates','mt_lesson_review','mt_research_lesson_shares_assumed','mt_recorded_discussions','mt_reframing_discussions_assumed','mt_lesson_shares_with_assumptions','mt_audio_confirmed_lessons'];
  function applyComparisonColumns() {
    const group = document.getElementById('comparisonGroup')?.value || 'all';
    const allowed = comparisonGroups[group];
    document.querySelectorAll('#summaryStatisticsTable tr').forEach(row => Array.from(row.children).forEach((cell,index) => { cell.hidden = index > 0 && !!allowed && !allowed.includes(comparisonKeys[index-1]); }));
  }
  let exactSourceMetadata=null;
  function showExactSources(metric, records,metadata=null) {
    exactSourceMetadata=metadata;
    dom.modalOverlay.classList.add('detail-drawer');
    exactSources = records; exactMetric = metric; focusBeforeDetail = document.activeElement;
    dom.modalTitle.textContent = '集計の根拠：' + (METRIC_DEFINITIONS[metric]?.name || (metric==='maps_total' ? 'マップ作成数' : metric));
    dom.modalBody.innerHTML = '<p>現在の条件に一致する '+records.length+' 件です。平均は対象参加者（0件を含む）を分母に計算します。</p><button type="button" id="exportExactSources" class="btn-secondary">この根拠一覧をCSV出力</button><div class="exact-source-list">'+records.map(r => '<article><strong>'+escapeHtml(r.user_name || '不明')+'</strong><p style="white-space:pre-wrap">'+escapeHtml(r.lesson_learned || r.content || r.question_content || r.map_name || '記録ID：'+(r.ref_id || r.object_journal_id || r.node_id || ''))+'</p>'+(r.reason_text ? '<p>理由：'+escapeHtml(r.reason_text)+'</p>' : '')+'<small>'+escapeHtml(r.created_at || '')+' ／ '+escapeHtml(r.updated_at || '')+'</small></article>').join('')+'</div>';
    document.getElementById('exportExactSources').addEventListener('click', () => downloadCsv('exact_sources_'+exactMetric+'.csv', [['論理キー','参加者ID','参加者','記録ID','内容','理由','作成日時','更新日時'],...exactSources.map(r=>[r.source_key||'',r.user_id,r.user_name,r.lesson_id || r.id || r.object_node_id || r.ref_id || r.object_journal_id || r.node_id,r.lesson_learned || r.content || '',r.reason_text || '',r.created_at,r.updated_at])].map(row=>row.map(v=>typeof v==='string'&&/^[\s]*[=+@\-]/.test(v)?"'"+v:v))));
    dom.modalOverlay.classList.add('active');dom.modalClose.focus();
  }
  async function openMetricSources(metric, userId) {
    try {
      const params = new URLSearchParams(buildFilterQuery()); if(userId!=null)params.set('user_ids',String(userId));
      const response = await trackedFetch('php/admin_api.php?action=get_aggregation&'+params.toString()+'&metric='+encodeURIComponent(metric)+'&row_axis=all&col_axis=none');
      const result=await response.json();if(!result.success)throw new Error(result.error);
      if(MEETING_METRICS[metric])showMeetingSources(result.aggregation,null,null);else showExactSources(metric,result.aggregation.source_records || [],result.aggregation);
    } catch(error) { dom.modalTitle.textContent='根拠を取得できませんでした';dom.modalBody.textContent=error.message;dom.modalOverlay.classList.add('active'); }
  }
  function saveFilterUrl() {
    const url=new URL(window.location.href),params=new URLSearchParams(buildFilterQuery());
    for(const key of ['start_date','end_date','date_basis','user_ids','include_unmatched']){url.searchParams.delete(key);if(params.has(key))url.searchParams.set(key,params.get(key));}
    // Explicitly record all-participant selection, which otherwise has no user_ids parameter.
    if(!state.filter.userIds.length)url.searchParams.set('user_ids','all');
    window.history.replaceState(null,'',url);
  }
  function restoreFilterUrl(users) {
    const params=new URL(window.location.href).searchParams;
    if(!['start_date','end_date','date_basis','user_ids','include_unmatched'].some(key=>params.has(key)))return;
    for(const [key,input] of [['start_date',dom.startDate],['end_date',dom.endDate]]){const value=params.get(key);if(value===null)input.value='';else if(/^\d{4}-\d{2}-\d{2}$/.test(value))input.value=value;}
    dom.basisRadios.forEach(r=>{r.checked=r.value===(params.get('date_basis')==='updated_at'?'updated_at':'created_at');});
    if(params.has('user_ids')){const valid=new Set(users.map(u=>String(u.user_id)));const chosen=(params.get('user_ids')||'').split(',').filter(id=>valid.has(id));document.querySelectorAll('.user-checkbox').forEach(cb=>{cb.checked=params.get('user_ids')==='all'||chosen.includes(cb.value);});}
    document.getElementById('filterIncludeUnmatched').checked=params.get('include_unmatched')==='1';
    syncFilterFromInput();
  }
  function setupRedesign() {
    redesignReady = true;
    window.addEventListener('popstate',()=>{const tab=window.location.hash.slice(1)||'summary';if(['summary','analysis','data','review','operations'].includes(tab)){restoringTab=true;switchTab(tab);restoringTab=false;}});
    document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click',()=>switchTab(button.dataset.go)));
    document.getElementById('summaryStatisticsTable').addEventListener('click',event=>{const button=event.target.closest('[data-evidence-metric]');if(button)openMetricSources(button.dataset.evidenceMetric,button.dataset.evidenceUser);});
    document.getElementById('comparisonGroup').addEventListener('change',applyComparisonColumns);
    document.getElementById('btnExportComparison').addEventListener('click',()=> {
      const rows=Array.from(document.querySelectorAll('#summaryStatisticsTable tr')).map(row=>Array.from(row.children).filter(cell=>!cell.hidden).map(cell=>cell.textContent));
      downloadCsv('participant_comparison.csv',rows.map(row=>row.map(v=>/^[\s]*[=+@\-]/.test(v)?"'"+v:v)));
    });
    const mainMetrics=['maps_total','lessons_total','nodes_total','journals_total','reflections_total','lessons_updated'];
    document.querySelectorAll('#tab-summary > .kpi-grid > .kpi-card').forEach((card,index)=> {
      card.removeAttribute('data-target');const button=document.createElement('button');button.type='button';button.className='metric-source-button';button.textContent='根拠を見る →';button.addEventListener('click',()=>openMetricSources(mainMetrics[index]));card.appendChild(button);
    });
    document.addEventListener('keydown',event=> {
      if(!dom.modalOverlay.classList.contains('active'))return;
      if(event.key==='Escape')closeModal();
      if(event.key==='Tab') {
        const controls=Array.from(dom.modalOverlay.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')).filter(el=>!el.disabled&&el.offsetParent!==null);
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    });
    const tab=window.location.hash.slice(1);if(['summary','analysis','data','review','operations'].includes(tab))switchTab(tab);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function strIncludes(s, sub) {
    return s && s.indexOf(sub) !== -1;
  }

})();
