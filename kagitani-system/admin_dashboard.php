<?php
/**
 * admin_dashboard.php
 * 研究データ分析ワークベンチ - 研究データダッシュボード
 */

session_start();
require_once __DIR__.'/php/dashboard_auth.php';
require_once(__DIR__ . "/php/connect_db.php");
require_once(__DIR__ . "/php/admin_workbench_lib.php");

// ログインチェック
if (!isset($_SESSION["USERID"])) {
    header("Location: ../login.php");
    exit;
}

// パスワード認証処理
$passwordError = "";
if (isset($_POST['dashboard_password'])) {
    if (forestDashboardVerifyPassword((string)$_POST['dashboard_password'])) {
        $_SESSION['DASHBOARD_AUTHENTICATED'] = true;
    } else {
        $passwordError = "パスワードが正しくありません。もう一度入力してください。";
    }
}

// 認証チェック
$isAuthenticated = (!empty($_SESSION['DASHBOARD_AUTHENTICATED']) && $_SESSION['DASHBOARD_AUTHENTICATED'] === true);

if (!$isAuthenticated) {
    ?>
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>パスワード認証 | 研究データダッシュボード</title>
      <link rel="stylesheet" href="css/admin_dashboard.css?v=<?= filemtime(__DIR__ . "/css/admin_dashboard.css") ?>">
      <style>
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f1f5f9;
          padding: 20px;
        }
        .auth-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 420px;
          padding: 32px;
          border: 1px solid #e2e8f0;
        }
        .auth-icon {
          width: 48px;
          height: 48px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .auth-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          text-align: center;
          margin-bottom: 8px;
        }
        .auth-desc {
          font-size: 13px;
          color: #64748b;
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .auth-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .auth-input {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .auth-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .auth-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 8px;
        }
        .auth-btn-submit {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 11px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .auth-btn-submit:hover {
          background: #1d4ed8;
        }
        .auth-back-link {
          text-align: center;
          font-size: 13px;
          margin-top: 16px;
        }
        .auth-back-link a {
          color: #64748b;
          text-decoration: none;
        }
        .auth-back-link a:hover {
          color: #0f172a;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 class="auth-title">研究データダッシュボード</h1>
          <p class="auth-desc">アクセスするにはダッシュボード用パスワードを入力してください。</p>

          <?php if (!empty($passwordError)): ?>
            <div class="auth-error">
              <?= htmlspecialchars($passwordError, ENT_QUOTES) ?>
            </div>
          <?php endif; ?>

          <form method="POST" class="auth-form">
            <div class="auth-input-group">
              <label for="dashboard_password" class="auth-label">パスワード</label>
              <input type="password" id="dashboard_password" name="dashboard_password" class="auth-input" placeholder="パスワードを入力" required autofocus>
            </div>
            <button type="submit" class="auth-btn-submit">認証して進む</button>
          </form>

          <div class="auth-back-link">
            <a href="../select_mode.php">‹ モード選択画面に戻る</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    <?php
    exit;
}

// PDO接続
$pdo_host = $db_host;
$pdo_port = '3306';
if (strpos($db_host, ':') !== false) {
    list($pdo_host, $pdo_port) = explode(':', $db_host, 2);
}
try {
    $dsn = "mysql:host={$pdo_host};port={$pdo_port};dbname={$db_dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+09:00'"
    ]);
} catch (Exception $e) {
    die("データベース接続に失敗しました: " . htmlspecialchars($e->getMessage()));
}

$currentUserId = $_SESSION['USERID'] ?? null;
$currentUserName = $_SESSION['USERNAME'] ?? '研究者';

?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>研究データダッシュボード | 自己調整学習支援システム</title>
  <link rel="stylesheet" href="css/admin_dashboard.css?v=<?= filemtime(__DIR__ . "/css/admin_dashboard.css") ?>">
</head>
<body>

  <!-- ヘッダー -->
  <header class="dashboard-header">
    <div class="header-left">
      <h1 class="header-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        研究データダッシュボード
      </h1>
      <span class="badge-admin">研究者・開発者向け</span>
    </div>
    <div class="header-right"><button type="button" class="btn-secondary" data-go="operations">処理状況</button>
      <div class="user-info">
        ログイン中: <span class="user-name"><?= htmlspecialchars($currentUserName, ENT_QUOTES) ?></span>
      </div>
      <a href="../select_mode.php" class="btn-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        モード選択に戻る
      </a>
      <a href="index.php" class="btn-secondary">
        マップに戻る
      </a>
    </div>
  </header>

  <!-- メインコンテナ -->
  <div id="dashboardProcessing" class="dashboard-processing" role="status" aria-live="polite" style="display:none;">
    <span class="processing-spinner" aria-hidden="true"></span><span id="dashboardProcessingText"></span><button type="button" id="dashboardRetry" class="btn-secondary" style="display:none;">再取得</button>
  </div>
  <main class="dashboard-container">

    <!-- 共通フィルタパネル -->
    <section class="filter-panel" aria-label="共通フィルタ">
      <div class="filter-header">
        <div class="filter-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          共通抽出フィルタ（期間・参加者）
        </div>
        <div>
          <button id="btnResetFilter" class="btn-secondary" style="font-size:12px;padding:4px 10px;">フィルタをリセット</button>
        </div>
      </div>

      <div class="filter-grid">
        <!-- 期間フィルタ -->
        <div class="filter-group">
          <div class="filter-group-title">
            <span>期間指定</span>
          </div>
          <div class="preset-buttons">
            <button type="button" class="preset-btn active" data-preset="practice_to_today">実践期間 (2026/04/20〜今日)</button>
            <button type="button" class="preset-btn" data-preset="2026_eval">2026年 評価対象期間 (4/20〜9/23)</button>
            <button type="button" class="preset-btn" data-preset="all">全期間</button>
            <button type="button" class="preset-btn" data-preset="this_month">今月</button>
            <button type="button" class="preset-btn" data-preset="last_month">先月</button>
          </div>
          <div class="date-inputs">
            <input type="date" id="filterStartDate" class="date-input" value="2026-04-20">
            <span>〜</span>
            <input type="date" id="filterEndDate" class="date-input" value="<?= date('Y-m-d') ?>">
          </div>
          <div class="basis-radios">
            <span style="font-size:12px;color:#64748b;font-weight:600;">抽出基準日時:</span>
            <label><input type="radio" name="dateBasis" value="created_at" checked> 作成日時 (新規導出/登録)</label>
            <label><input type="radio" name="dateBasis" value="updated_at"> 更新日時 (更新/編集)</label>
          </div>
        </div>

        <!-- 参加者フィルタ -->
        <div class="filter-group">
          <div class="filter-group-title">
            <span>参加者 (ユーザー) 指定</span>
            <div style="display:flex;gap:4px;">
              <button type="button" id="btnSelect9Users" class="btn-xs" style="background:#eff6ff;color:#2563eb;font-weight:600;">対象9名を選択</button>
              <button type="button" id="btnSelectAllUsers" class="btn-xs">全員選択</button>
              <button type="button" id="btnDeselectAllUsers" class="btn-xs">選択解除</button>
            </div>
          </div>
          <div class="participant-controls">
            <input type="text" id="userSearchInput" class="user-search-input" placeholder="参加者名で検索...">
          </div>
          <label style="font-size:12px;display:block;margin:8px 0;"><input type="checkbox" id="filterIncludeUnmatched"> MT資料の「未判定」も含める（参加者指定時）</label>
          <div id="userCheckboxList" class="user-checkbox-list">
            <!-- ユーザーリスト動的挿入 -->
          </div>
        </div>
      </div>

      <!-- 抽出条件バッジ & 適用ボタン -->
      <div class="filter-status-bar">
        <div id="conditionSummaryText" class="current-conditions">
          <!-- 条件バッジ動的挿入 -->
        </div>
        <button type="button" id="btnApplyFilter" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          条件を適用して分析
        </button>
      </div>
    </section>

    <!-- タブナビゲーション -->
    <nav class="tab-nav" aria-label="分析画面"><button type="button" class="tab-btn active" data-tab="summary" aria-controls="tab-summary">概要</button><button type="button" class="tab-btn " data-tab="analysis" aria-controls="tab-analysis">比較・集計</button><button type="button" class="tab-btn " data-tab="data" aria-controls="tab-data">データ</button><button type="button" class="tab-btn " data-tab="review" aria-controls="tab-review">MTの確認</button><button type="button" class="tab-btn " data-tab="operations" aria-controls="tab-operations">同期・処理</button></nav>

    <!-- Shared mode: every quantitative request is pinned to this revision. -->
    <div id="curationBanner" role="status"><span id="curationBannerText">整理情報を確認中…</span><button type="button" id="curationRefresh" class="btn-secondary">整理版を再取得</button><label>集計の表示 <select id="curationMode"><option value="curated">重複整理を反映</option><option value="raw">整理前の原記録</option></select></label><small> 教訓・手段の整理を反映します。MT・マップ・内省等の件数は変更しません。</small></div>

    <!-- 1. 概要タブ -->
    <div id="tab-summary" class="tab-content active"><div class="section-heading"><h2>活動の概要</h2><button type="button" class="btn-secondary" data-go="analysis">参加者別に比較 →</button></div>
      <p>マップ・教訓・手段・ジャーナル・内省・教訓更新のカードは、上段が1人あたり平均、下段が合計と母分散です。0件の対象参加者も含みます。MT関連は合計を表示します。</p>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header"><span class="kpi-title">1人あたりのマップ作成数</span></div>
          <div id="kpiMapsMean" class="kpi-value">-</div>
          <div class="kpi-subtext">合計 <span id="kpiMapsTotal">-</span> 件 ／ 分散 <span id="kpiMapsVariance">-</span></div>
          <div class="kpi-subtext">問いごとの整理マップを1件（重複・削除済みを除く）</div>
        </div>

        <div class="kpi-card" data-target="lessons">
          <div class="kpi-header">
            <span class="kpi-title">教訓数</span>
            <div aria-hidden="true" class="kpi-icon" style="background:#eff6ff;color:#2563eb;">💡</div>
          </div>
          <div id="kpiLessonsTotal" class="kpi-value" data-person-metric="lessons_total" data-unit="件">-</div><div class="kpi-subtext" id="kpiLessonsTotalStatistics">—</div>
          <div class="kpi-subtext">マップ起因: <span id="kpiLessonsMap">-</span> | ジャーナル: <span id="kpiLessonsJournal">-</span></div>
        </div>

        <div class="kpi-card" data-target="nodes">
          <div class="kpi-header">
            <span class="kpi-title">手段ノード数</span>
            <div aria-hidden="true" class="kpi-icon" style="background:#fef3c7;color:#d97706;">🎯</div>
          </div>
          <div id="kpiNodesTotal" class="kpi-value" data-person-metric="nodes_total" data-unit="件">-</div><div class="kpi-subtext" id="kpiNodesTotalStatistics">—</div>
          <div class="kpi-subtext">理由ありの手段: <strong id="kpiNodesWithReason">-</strong></div>
          <div class="kpi-subtext">完了状態の手段: <strong id="kpiNodesCompleted" style="color:#10b981;">-</strong></div>
        </div>

        <div class="kpi-card" data-target="lessons">
          <div class="kpi-header">
            <span class="kpi-title">実施ジャーナル数</span>
            <div aria-hidden="true" class="kpi-icon" style="background:#f0fdf4;color:#16a34a;">📒</div>
          </div>
          <div id="kpiJournalsTotal" class="kpi-value" data-person-metric="journals_total" data-unit="件">-</div><div class="kpi-subtext" id="kpiJournalsTotalStatistics">—</div>
          <div class="kpi-subtext">週次・活動振り返り実施数</div>
        </div>

        <div class="kpi-card" data-target="lessons">
          <div class="kpi-header">
            <span class="kpi-title">内省記録件数</span>
            <div aria-hidden="true" class="kpi-icon" style="background:#faf5ff;color:#9333ea;">📝</div>
          </div>
          <div id="kpiReflectionsTotal" class="kpi-value" data-person-metric="reflections_total" data-unit="件">-</div><div class="kpi-subtext" id="kpiReflectionsTotalStatistics">—</div>
          <div class="kpi-subtext">良かった点・悪かった点と理由</div>
        </div>

        <div class="kpi-card" data-target="lessons">
          <div class="kpi-header">
            <span class="kpi-title">教訓更新件数</span>
            <div aria-hidden="true" class="kpi-icon" style="background:#fdf2f8;color:#db2777;">🔄</div>
          </div>
          <div id="kpiLessonsUpdated" class="kpi-value" data-person-metric="lessons_updated" data-unit="件">-</div><div class="kpi-subtext" id="kpiLessonsUpdatedStatistics">—</div>
          <div class="kpi-subtext">更新履歴のある教訓（各教訓1件）</div>
        </div>
      </div>

      <section class="overview-mt"><div class="section-heading"><h2>研究MT・全体MT</h2><button type="button" class="btn-secondary" data-go="analysis">MTの全指標を比較 →</button></div><p class="scope-note">全体の合計です。参加者別の延べ回数とは区別します。</p><div class="kpi-grid">
          <button type="button" class="kpi-card" data-meeting-metric="research_mt_total"><span class="kpi-title">研究MT実施件数</span><div id="kpiResearchMtTotal" class="kpi-value">—</div><div class="kpi-subtext">拡張子違いを統合 ／ 元ファイル数 <span id="kpiResearchMtFiles">—</span></div></button>
          <button type="button" class="kpi-card" data-meeting-metric="research_mt_days"><span class="kpi-title">研究MT開催日数</span><div id="kpiResearchMtDays" class="kpi-value">—</div><div class="kpi-subtext">日付フォルダ数</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="general_mt_sessions"><span class="kpi-title">全体MT開催回数</span><div id="kpiGeneralMtSessions" class="kpi-value">—</div><div class="kpi-subtext">日付フォルダ・共有補足記録</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="shared_lessons_total"><span class="kpi-title">全体MT資料共有件数</span><div id="kpiSharedLessonsTotal" class="kpi-value">—</div><div class="kpi-subtext">音声・動画を除く資料1個につき1件</div></button>
        </div><div class="overview-actions"><button type="button" class="btn-secondary" data-go="review">資料・音声を確認する →</button><button type="button" class="btn-secondary" data-go="operations">同期・処理状況を見る →</button></div></section>

      

      <details class="definitions"><summary>この画面の使い方</summary><p class="scope-note">条件を適用し、概要で傾向を把握してから「比較・集計」へ進みます。教訓・手段は「データ」、資料判定と音声の対応は「MTの確認」、取得・解析の実行は「同期・処理」にあります。MTは実施日、音声一覧は参加者フィルタの対象外です。</p></details>
    </div>

    <!-- 2. データ一覧タブ -->
    <div id="tab-data" class="tab-content">
      <div class="list-subnav">
        <button class="list-subnav-btn active" data-subtab="lessons">
          教訓一覧 (<span id="badgeLessonsCount">0</span>)
        </button>
        <button class="list-subnav-btn" data-subtab="nodes">
          手段ノード一覧 (<span id="badgeNodesCount">0</span>)
        </button>
      <button type="button" class="list-subnav-btn" data-subtab="qualitative">質的分析</button></div>

      <div class="qa-toolbar" id="qaSourceToolbar"><button type="button" class="btn-secondary" id="qaSelectSourceFiltered">検索結果の教訓を選択</button><button type="button" class="btn-secondary" id="qaClearSource">分析用の選択を解除</button><button type="button" class="btn-primary" id="qaGoAnalysis">選択した教訓を質的分析へ →</button></div>
      <?php include __DIR__ . '/curation_panel.html'; ?>
      <?php include __DIR__ . '/qualitative_panel.html'; ?>
      <!-- 教訓一覧テーブル -->
      <div id="tableLessonsWrap">
        <div class="table-toolbar">
          <input type="text" id="searchLessonsInput" class="table-search-input" placeholder="教訓内容・理由・活用場面・参加者で絞り込み...">
          <div style="font-size:12px;color:#64748b;">※ 行をクリックすると，内省記録（良かった点・悪かった点とその理由）の詳細を確認できます</div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>参加者</th>
                <th>導出起点</th>
                <th>教訓の内容</th>
                <th>その理由</th>
                <th>いつ使えるか（状況・機会）</th>
                <th>作成日時</th>
                <th>更新日時</th>
              </tr>
            </thead>
            <tbody id="tableLessonsBody">
              <!-- 動的挿入 -->
            </tbody>
          </table>
        </div>
        <div id="paginationLessons" class="pagination-bar"></div>
      </div>

      <!-- 手段ノード一覧テーブル -->
      <div id="tableNodesWrap" style="display:none;">
        <div class="table-toolbar">
          <input type="text" id="searchNodesInput" class="table-search-input" placeholder="手段内容・理由・参加者・問いで絞り込み...">
          <div style="font-size:12px;color:#64748b;">※ 思考整理マップの階層構造から深さを自動算出しています</div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>参加者</th>
                <th>手段内容</th>
                <th>理由</th>
                <th>階層深さ</th>
                <th>ステータス</th>
                <th>関連する研究上の問い</th>
                <th>作成日時</th>
              </tr>
            </thead>
            <tbody id="tableNodesBody">
              <!-- 動的挿入 -->
            </tbody>
          </table>
        </div>
        <div id="paginationNodes" class="pagination-bar"></div>
      </div>
    <details id="tab-export" class="export-tools"><summary>データ出力・抽出条件の保存</summary>
      <div class="export-card-grid">
        <div class="export-card">
          <div>
            <div class="export-card-title">教訓一覧データセット (CSV)</div>
            <div class="export-card-desc">
              現在の抽出条件に合致するすべての教訓データ（教訓内容、理由・重要性、活用機会、導出起点、関連する問い、内省記録、作成日時・更新日時）を出力します．
            </div>
          </div>
          <button type="button" id="btnExportLessons" class="btn-primary">
            📥 教訓CSVをダウンロード (BOM付きUTF-8)
          </button>
        </div>

        <div class="export-card">
          <div>
            <div class="export-card-title">手段ノード一覧データセット (CSV)</div>
            <div class="export-card-desc">
              現在の抽出条件に合致するすべての手段ノードデータ（手段内容、階層の深さ、ステータス、関連する研究上の問い、目的、想定時間、作成日時）を出力します．
            </div>
          </div>
          <button type="button" id="btnExportNodes" class="btn-primary">
            📥 手段ノードCSVをダウンロード (BOM付きUTF-8)
          </button>
        </div>

        <div class="export-card">
          <div>
            <div class="export-card-title">集計表データセット (CSV)</div>
            <div class="export-card-desc">
              現在「集計・分析」タブで選択されている指標・軸による集計結果（クロス集計表の行・列・小計・総合計）をCSV形式で出力します．
            </div>
          </div>
          <button type="button" id="btnExportAggregation" class="btn-primary">
            📥 集計結果CSVをダウンロード (BOM付きUTF-8)
          </button>
        </div>

        <div class="export-card">
          <div>
            <div class="export-card-title">分析条件メタデータ (JSON)</div>
            <div class="export-card-desc">
              分析の再現可能性を担保するため，抽出対象期間，基準日時，対象参加者ID，指標の厳密な定義，抽出件数などのメタデータをJSON形式で保存します．
            </div>
          </div>
          <button type="button" id="btnExportMetadata" class="btn-secondary">
            📋 分析条件メタデータを保存
          </button>
        </div>
      </div>
    </details></div>

    <!-- 3. 集計・分析タブ -->
    <div id="tab-analysis" class="tab-content"><div class="section-heading"><h2>参加者別の比較</h2><button type="button" class="btn-secondary" id="btnExportComparison">表示中の比較表をCSV出力</button></div><label class="comparison-filter">表示する指標 <select id="comparisonGroup" class="form-select"><option value="basic">基本指標</option><option value="lessons">教訓・内省</option><option value="research">研究MT・議論</option><option value="general">全体MT・共有</option><option value="audio">音声対応</option><option value="all">全指標</option></select></label><div class="table-container" style="margin-bottom:24px;">
        <h3 style="padding:16px;">参加者別件数・平均・分散</h3>
        <details class="definitions"><summary>指標の定義・計算方法</summary><p class="scope-note">MT回数は、その人の資料・確認済みの共有補足記録・録音あり議論記録から数えます。既存の同日MTに録音記録があっても二重加算しません。仮定だけの教訓共有はMT回数の追加根拠にはしません。同じ回に複数資料があっても1回です。合計行は参加者別の延べ回数で、上の全体開催数とは異なる場合があります。参加者未判定の資料はこの表の合計・平均・分散には含めません。MT指標は実施日基準です。横にスクロールすると全指標を確認できます。</p>
        <p class="scope-note">マップ作成数は、削除されていない問いノード（topic-tag）がある整理マップを問いIDごとに1件として数えます。作成日基準では最初の問いノード作成日、更新日基準では最新の問いノード更新日で絞り込みます。理由あり手段数は、理由が記入された手段を重複なく数えます。平均・分散は対象参加者の件数（0件を含む）から算出します。分散は人数で割る母分散です。</p>
        <p class="scope-note">教訓は内省ごとの最新1件（手段側で内省IDがない場合はノードごとの最新1件）です。最新の教訓を選んだ後に期間を絞り込みます。教訓更新件数は、保存された本文に差異がある、または更新日時が作成日時より後の教訓を各1件とします。過去の本文が残らない上書き保存では、内容変更と再保存は区別できません。</p>
        </details><div style="overflow-x:auto;"><table class="data-table" id="summaryStatisticsTable"></table></div>
      </div><details class="all-mt-metrics"><summary>MTの全指標と内訳</summary>
        <div class="kpi-grid">
          <button type="button" class="kpi-card" data-meeting-metric="supplemental_lessons_total"><span class="kpi-title">ファイルなし教訓共有件数</span><div id="kpiSupplementalLessons" class="kpi-value">—</div><div class="kpi-subtext">利用者確認済みの共有補足記録</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="verified_lessons_total"><span class="kpi-title">教訓記載確認済み件数</span><div id="kpiVerifiedLessons" class="kpi-value">—</div><div class="kpi-subtext">教訓ありの確認済み資料・補足記録</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="lesson_candidates_total"><span class="kpi-title">教訓あり候補件数</span><div id="kpiLessonCandidates" class="kpi-value">—</div><div class="kpi-subtext">自動判定・人による確認前</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="lesson_review_total"><span class="kpi-title">教訓要確認・未解析件数</span><div id="kpiLessonReview" class="kpi-value">—</div><div class="kpi-subtext">画像・読取不可・判断が曖昧な資料を含む</div></button>
        </div>
        <div class="kpi-grid">
          <button type="button" class="kpi-card" data-meeting-metric="research_lesson_shares_assumed_total"><span class="kpi-title">研究MT冒頭の教訓共有（仮定）</span><div id="kpiHistoricalShares" class="kpi-value">—</div><div class="kpi-subtext">利用者指定の日付・参加者のみ</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="recorded_discussions_total"><span class="kpi-title">個別議論数（録音記録あり）</span><div id="kpiRecordedDiscussions" class="kpi-value">—</div><div class="kpi-subtext">録音ありとの利用者申告に基づく</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="reframing_discussions_assumed_total"><span class="kpi-title">問い直し議論数（仮定）</span><div id="kpiReframingDiscussions" class="kpi-value">—</div><div class="kpi-subtext">指定された録音あり議論を対象</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="lesson_shares_with_assumptions_total"><span class="kpi-title">教訓共有数（確認済み＋仮定）</span><div id="kpiCombinedShares" class="kpi-value">—</div><div class="kpi-subtext">確認済み記録と研究MTでの共有仮定を合算</div></button>
        </div>
        <p style="font-size:12px;">過去の研究MTの教訓共有・問い直しは利用者指定の仮定として明示します。教訓本文確認済みの件数や全体MTの開催数には加算しません。録音記録は個別議論の実施を示す利用者申告として扱い、録音そのものの取込・音声解析はしていません。</p>
        <div class="kpi-grid">
          <button type="button" class="kpi-card" data-meeting-metric="meeting_audio_files_total"><span class="kpi-title">MT録音ファイル数</span><div id="kpiAudioFiles" class="kpi-value">—</div><div class="kpi-subtext">資料共有数とは別集計</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="meeting_audio_sessions_total"><span class="kpi-title">録音のあるMT数</span><div id="kpiAudioSessions" class="kpi-value">—</div><div class="kpi-subtext">複数音声でも同じ開催は1回</div></button>
          <button type="button" class="kpi-card" data-meeting-metric="audio_confirmed_lessons_total"><span class="kpi-title">音声対応確認済み教訓・資料数</span><div id="kpiAudioConfirmedLessons" class="kpi-value">—</div><div class="kpi-subtext">教訓・資料候補との対応を人が確認</div></button>
        </div>
        
        </details><h2 class="section-title">期間別・クロス集計</h2>
      <div class="analysis-toolbar">
        <div class="form-field">
          <label class="form-label" for="aggMetricSelect">集計指標</label>
          <select id="aggMetricSelect" class="form-select">
            <option value="maps_total">問いから作成したマップ数</option><option value="lessons_total" selected>教訓数 (合計)</option>
            <option value="lessons_map">教訓数 (マップ起因)</option>
            <option value="lessons_journal">教訓数 (ジャーナル起因)</option>
            <option value="nodes_total">手段ノード数</option>
            <option value="nodes_with_reason">理由あり手段数</option><option value="nodes_completed">完了手段ノード数</option>
            <option value="journals_total">ジャーナル数</option>
            <option value="reflections_total">内省記録数</option>
            <option value="lessons_updated">教訓更新件数</option>
            <optgroup label="研究MT・全体MT（SharePoint / OneDrive）">
              <option value="research_mt_total">研究MT実施件数（拡張子違いを統合）</option>
              <option value="research_mt_days">研究MT開催日数（日付フォルダ数）</option>
              <option value="general_mt_sessions">全体MT開催回数（補足記録含む）</option>
              <option value="research_lesson_shares_assumed_total">研究MT冒頭の教訓共有（仮定）</option>
              <option value="recorded_discussions_total">個別議論数（録音記録あり）</option>
              <option value="reframing_discussions_assumed_total">問い直し議論数（仮定）</option>
              <option value="lesson_shares_with_assumptions_total">教訓共有数（確認済み＋仮定）</option>
              <option value="meeting_audio_files_total">MT録音ファイル数（期間のみ）</option>
              <option value="meeting_audio_sessions_total">録音のあるMT数（期間のみ）</option>
              <option value="audio_confirmed_lessons_total">音声対応確認済み教訓・資料数</option>
              <option value="supplemental_lessons_total">ファイルなし教訓共有件数</option>
              <option value="verified_lessons_total">教訓記載確認済み件数（人による確認）</option>
              <option value="lesson_candidates_total">教訓あり候補件数（自動判定）</option>
              <option value="lesson_review_total">教訓要確認・未解析件数</option>
              <option value="shared_lessons_total">全体MT資料共有件数（全体MTファイル数）</option>
            </optgroup>
          </select>
        </div>

        <div class="form-field">
          <label class="form-label" for="aggRowAxisSelect">集計単位 (行軸)</label>
          <select id="aggRowAxisSelect" class="form-select">
            <option value="month" selected>月別 (年月)</option>
            <option value="year">年別</option>
            <option value="week">週別</option>
            <option value="day">日別</option>
            <option value="user">参加者別</option>
            <option value="origin">導出起点別</option>
            <option value="status">手段ステータス別</option>
            <option value="all">全体 (単一合計)</option>
          </select>
        </div>

        <div class="form-field">
          <label class="form-label" for="aggColAxisSelect">クロス集計軸 (列軸 / 任意)</label>
          <select id="aggColAxisSelect" class="form-select">
            <option value="user" selected>参加者別 (2軸クロス表)</option>
            <option value="origin">導出起点別 (マップ/ジャーナル)</option>
            <option value="status">手段ステータス別</option>
            <option value="">なし (単軸集計)</option>
          </select>
        </div>

        <button type="button" id="btnMetricInfo" class="btn-secondary" style="margin-top:16px;">
          📖 指標定義を確認
        </button>

        <div class="view-mode-toggle">
          <button class="view-btn active" data-view="pivot">クロス集計表</button>
          <button class="view-btn" data-view="bar">棒グラフ</button>
          <button class="view-btn" data-view="line">折れ線グラフ</button>
        </div>
      </div>

      <p id="meetingAggregationNote" style="font-size:12px;"></p>
      <button type="button" id="btnExportMeetingSources" class="btn-secondary" style="display:none;margin-bottom:12px;">現在のMT集計の根拠資料をCSV出力</button>
      <!-- 表・グラフ表示領域 -->
      <div id="pivotContainer"></div>
      <div id="chartContainer" class="chart-container" style="display:none;"></div>
    </div>

    <!-- 4. データ出力タブ -->
    

<div id="tab-review" class="tab-content"><h2>MTの確認</h2><p class="scope-note">資料は実施日・参加者で絞り込みます。音声一覧は実施日のみを適用し、参加者フィルタは適用しません。</p><details id="meetingLessonReviewPanel">
          <summary>教訓の判定と確認（根拠文章を表示）</summary>
          <label>判定で絞り込み <select id="lessonReviewFilter"><option value="all">すべて</option><option value="yes">あり（候補・確認済み）</option><option value="no">なし</option><option value="review">要確認</option><option value="unprocessed">未解析</option><option value="verified">人による確認済み</option></select></label>
          <p id="lessonReviewMessage" role="status"></p>
          <div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>実施日・参加者</th><th>資料</th><th>判定・根拠</th><th>確認結果</th></tr></thead><tbody id="lessonReviewBody"></tbody></table></div>
          <button type="button" id="lessonReviewPrev" class="btn-secondary" disabled>前の10件</button><button type="button" id="lessonReviewNext" class="btn-secondary" disabled>次の10件</button>
        </details><section class="meeting-audio-panel" aria-label="MT音声と教訓の対応">
          <h3>音声と教訓・資料の対応</h3>
          <p id="meetingAudioSourceCount">音声一覧を確認中…</p>
          
          
          
          <p style="font-size:12px;">日付フォルダとMT種類で開催へ紐付け、Mac内で文字起こしします。音声ファイルは資料共有数に加算しません。音声区間は時間と間隔で便宜的に区切った候補で、1区間が1議論とは限りません。人物・教訓との対応候補は自動確定せず、音声を聞いて確認してください。L3の基準は未設定です。</p>
          <label>録音 <select id="meetingAudioSelect"><option value="">録音を選択してください</option></select></label>
          <audio id="meetingAudioPlayer" controls preload="metadata" style="display:none;width:100%;"></audio>
          <div id="meetingAudioDetail" style="display:none;">
            <p id="meetingAudioMessage" role="status"></p>
            <details><summary>当日の教訓・資料候補を確認</summary><div id="meetingAudioLessons"></div></details>
            <button type="button" id="btnExportAudioTranscript" class="btn-secondary">文字起こし・対応候補CSV</button>
            <div id="meetingAudioBlocks"></div>
            <button type="button" id="meetingAudioPrev" class="btn-secondary" disabled>前の5区間</button><button type="button" id="meetingAudioNext" class="btn-secondary" disabled>次の5区間</button>
          </div>
        </section></div><div id="tab-operations" class="tab-content"><h2>同期・処理</h2><p class="scope-note">実行対象は同期フォルダ全体です。上の分析期間・参加者では処理対象を限定しません。画面を移動しても処理は継続します。</p><p id="lessonAnalysisProgress" role="status" aria-live="polite">本文解析の状態を確認中…</p>
        <progress id="lessonAnalysisBar" value="0" max="1" style="display:none;width:100%;"></progress>
        <button type="button" id="btnAnalyzeMeetingLessons" class="btn-secondary" disabled>全体MT資料の本文を解析（変更分のみ）</button>
        <p style="font-size:12px;">資料共有数と教訓の記載有無は別の指標です。ファイルなし共有は補足記録として確認済み件数に含め、資料ファイル数には含めません。本文解析はこのMac内で行い、通常の画面取得では再解析しません。自動判定は誤りを含むため、根拠を確認してください。画像・動画は要確認として残します。</p>
        
        <p id="meetingSyncStatus" role="status" aria-live="polite">接続状態を確認中…</p>
        <button type="button" id="btnSyncMeetings" class="btn-secondary" disabled>SharePointを手動同期</button>
        <p style="font-size:12px;color:#475569;line-height:1.7;">MTはフォルダ名の実施日で期間を絞り込みます。参加者はファイル名の苗字（漢字・英字）で照合し、更新者は使用しません。同姓や複数人が一致した場合は未判定です。参加者指定時の開催数は、その人に対応する資料があるフォルダ数です。開催自体は個人に割り当てません。全資料を見る場合は参加者の選択を解除してください。<br>日付フォルダ直下の資料ファイルを対象とし、音声・動画は別管理です。下位フォルダ・ショートカットは対象外です。~$で始まる名前、末尾~、.tmp/.temp、.DS_Store、Thumbs.db、desktop.iniを除外します。未接続・未同期は0件ではなく「—」で表示します。</p>
        <p style="font-size:12px;color:#475569;">OneDrive方式ではMacの同期済み一覧を読み取ります。OneDriveアプリの同期完了は別途確認してください。一覧が変わったときは30秒以上後の再読み取りで同じ一覧なら反映します。ローカルIDはSharePointのファイルIDではありません。元URLが未設定の場合は根拠資料にFinderのパスを表示します。</p>
        <p id="meetingUnmatchedStatus" style="font-size:13px;" role="status"></p>
        <button type="button" id="btnIncludeUnmatchedMeetings" class="btn-secondary" style="display:none;">未判定のMT資料も含めて表示</button>
      <p id="meetingAudioProgress" role="status" aria-live="polite">処理状態を確認中…</p><progress id="meetingAudioProgressBar" max="1" value="0" style="display:none;width:100%;"></progress><button type="button" id="btnProcessMeetingAudio" class="btn-secondary" disabled>音声を取り込み・文字起こし（未処理分／中断分から）</button></div>  </main>

  <!-- 詳細モーダル -->
  <div id="modalOverlay" class="modal-overlay">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-header">
        <h3 id="modalTitle" class="modal-title">詳細情報</h3>
        <button id="modalClose" class="modal-close">&times;</button>
      </div>
      <div id="modalBody" class="modal-body">
        <!-- 動的挿入 -->
      </div>
    </div>
  </div>

  <link rel="stylesheet" href="css/qualitative_analysis.css?v=<?= filemtime(__DIR__ . "/css/qualitative_analysis.css") ?>">
  <link rel="stylesheet" href="css/research_curation.css?v=<?= filemtime(__DIR__ . "/css/research_curation.css") ?>">
  <script src="js/research_curation.js?v=<?= filemtime(__DIR__ . "/js/research_curation.js") ?>"></script>
  <script src="js/qualitative_analysis.js?v=<?= filemtime(__DIR__ . "/js/qualitative_analysis.js") ?>"></script>
  <script src="js/admin_dashboard.js?v=<?= filemtime(__DIR__ . "/js/admin_dashboard.js") ?>"></script>
</body>
</html>
