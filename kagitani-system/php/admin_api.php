<?php
/**
 * admin_api.php
 * 研究データ分析ワークベンチ用 バックエンド API
 */

// エラー出力制御
error_reporting(0);
ini_set('display_errors', 0);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
date_default_timezone_set('Asia/Tokyo');

// データベース接続
require_once(__DIR__ . "/connect_db.php");
require_once(__DIR__ . "/admin_workbench_lib.php");

// PDO接続を確立
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
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB Connection failed: ' . $e->getMessage()]);
    exit;
}

$lib = new AdminWorkbenchLib($pdo);

// 認証チェック
$currentUserId = $_SESSION['USERID'] ?? null;
$isAuth = $lib->checkAdminAuth($currentUserId) || (!empty($_SESSION['DASHBOARD_AUTHENTICATED']) && $_SESSION['DASHBOARD_AUTHENTICATED'] === true);
if (!$isAuth) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => '管理者権限またはダッシュボード認証が必要です。(403 Forbidden)']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
// Pin every analytical response to one immutable curation revision.
try {
    if(in_array($action,['get_filter_options','get_summary','get_lessons','get_nodes','get_aggregation'],true)) {
        $curation=new ResearchCuration(ResearchCuration::path());
        $curationState=$curation->read(isset($_GET['curation_revision'])?(int)$_GET['curation_revision']:null);
        $raw=($_GET['curation_mode']??'')==='raw';$lib->setCuration($raw?array_merge($curationState,['include_excluded'=>true]):$curationState);
        header('X-Curation-Revision: '.$curationState['revision']);header('X-Curation-Mode: '.($raw?'raw':'curated'));
    }
} catch(Throwable $e){http_response_code(409);echo json_encode(['success'=>false,'error'=>'整理情報を取得できません。前回の結果を保持しています。再取得してください。']);exit;}


// 共通フィルタ パラメータ解析関数
function parseFilterParams() {
    $startDate = $_GET['start_date'] ?? $_POST['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? $_POST['end_date'] ?? null;
    $dateBasis = $_GET['date_basis'] ?? $_POST['date_basis'] ?? 'created_at';
    
    $userIdsRaw = $_GET['user_ids'] ?? $_POST['user_ids'] ?? null;
    $userIds = [];
    if (!empty($userIdsRaw)) {
        if (is_array($userIdsRaw)) {
            $userIds = array_map('intval', $userIdsRaw);
        } else {
            $parts = explode(',', $userIdsRaw);
            foreach ($parts as $p) {
                $p = trim($p);
                if ($p !== '') $userIds[] = intval($p);
            }
        }
    }

    if ($startDate && strlen($startDate) === 10) {
        $startDate .= " 00:00:00";
    }
    if ($endDate && strlen($endDate) === 10) {
        $endDate .= " 23:59:59";
    }

    return [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'date_basis' => ($dateBasis === 'updated_at') ? 'updated_at' : 'created_at',
        'user_ids' => $userIds,
        'include_unmatched' => ($_GET['include_unmatched'] ?? $_POST['include_unmatched'] ?? '0') === '1'
    ];
}

// Read requests must not serialize behind another tab's PHP session lock.
if (!in_array($action, ['get_meeting_sync','sync_meetings','start_meeting_analysis','save_meeting_review','start_meeting_audio','save_audio_review'], true)) session_write_close();

try {
    switch ($action) {
        case 'preview_supplement_evidence':
            $preview=SharePointMeetings::fromEnvironment()->supplementEvidence($_GET['record_id'] ?? '');
            header('Content-Type: image/png');header('X-Content-Type-Options: nosniff');
            header("Content-Security-Policy: sandbox; default-src 'none'");
            readfile($preview['path']);break;
        case 'preview_meeting_file':
            $preview=SharePointMeetings::fromEnvironment()->lessonPreview($_GET['file_key'] ?? '');
            header('Content-Type: '.$preview['mime']);
            header('X-Content-Type-Options: nosniff');
            header('Content-Disposition: inline; filename*=UTF-8\'\''.rawurlencode($preview['name']));
            header("Content-Security-Policy: sandbox; default-src 'none'");
            readfile($preview['path']);
            break;
        case 'get_meeting_audio':
            echo json_encode(['success'=>true,'audio'=>SharePointMeetings::fromEnvironment()->audioInventory(parseFilterParams())],JSON_UNESCAPED_UNICODE);break;
        case 'get_audio_transcript':
            echo json_encode(['success'=>true,'data'=>SharePointMeetings::fromEnvironment()->audioTranscript($_GET['recording_id'] ?? '')],JSON_UNESCAPED_UNICODE);break;
        case 'stream_meeting_audio':
            $asset=SharePointMeetings::fromEnvironment()->audioAsset($_GET['recording_id'] ?? '');
            streamMeetingAudio($asset);break;
        case 'get_meeting_analysis':
            echo json_encode(['success'=>true,'analysis'=>SharePointMeetings::fromEnvironment()->analysisStatus()], JSON_UNESCAPED_UNICODE);
            break;
        case 'get_meeting_reviews':
            $data=$lib->getAggregationData(parseFilterParams(),'shared_lessons_total','day','user');
            echo json_encode(['success'=>true,'items'=>$data['source_records']],JSON_UNESCAPED_UNICODE);
            break;
        case 'start_meeting_analysis':
        case 'save_meeting_review':
        case 'start_meeting_audio':
        case 'save_audio_review':
            if ($_SERVER['REQUEST_METHOD']!=='POST' || empty($_SESSION['MEETING_SYNC_CSRF']) || !is_string($_POST['csrf_token'] ?? null) ||
                !hash_equals($_SESSION['MEETING_SYNC_CSRF'],$_POST['csrf_token'])) {
                http_response_code(403);echo json_encode(['success'=>false,'error'=>'画面を再読み込みして操作してください。'],JSON_UNESCAPED_UNICODE);break;
            }
            session_write_close();
            $service=SharePointMeetings::fromEnvironment();
            if($action==='start_meeting_audio') {
                $users=$pdo->query('SELECT user_id,name FROM users ORDER BY user_id')->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success'=>true,'audio'=>$service->startAudioAnalysis($users)],JSON_UNESCAPED_UNICODE);
            } elseif($action==='save_audio_review') {
                $ids=json_decode($_POST['lesson_ids'] ?? '[]',true,512,JSON_THROW_ON_ERROR);
                if(!is_array($ids))throw new RuntimeException('教訓の指定が不正です。');
                $service->saveAudioReview($_POST['recording_id'] ?? '',$_POST['block_id'] ?? '',$_POST['context_signature'] ?? '',$ids,
                    $_POST['start'] ?? '',$_POST['end'] ?? '',$_POST['decision'] ?? '',$currentUserId);
                echo json_encode(['success'=>true],JSON_UNESCAPED_UNICODE);
            } elseif ($action==='start_meeting_analysis') {
                echo json_encode(['success'=>true,'analysis'=>$service->startAnalysis()],JSON_UNESCAPED_UNICODE);
            } else {
                $service->saveLessonReview($_POST['file_key'] ?? '',$_POST['signature'] ?? '',$_POST['decision'] ?? '',$currentUserId);
                echo json_encode(['success'=>true],JSON_UNESCAPED_UNICODE);
            }
            break;
        case 'get_meeting_sync':
            if (empty($_SESSION['MEETING_SYNC_CSRF'])) $_SESSION['MEETING_SYNC_CSRF'] = bin2hex(random_bytes(32));
            echo json_encode(['success' => true, 'sync' => SharePointMeetings::fromEnvironment()->status(),
                'csrf_token' => $_SESSION['MEETING_SYNC_CSRF']], JSON_UNESCAPED_UNICODE);
            break;

        case 'sync_meetings':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_SESSION['MEETING_SYNC_CSRF']) ||
                !hash_equals($_SESSION['MEETING_SYNC_CSRF'], $_POST['csrf_token'] ?? '')) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => '画面を再読み込みして同期してください。'], JSON_UNESCAPED_UNICODE);
                break;
            }
            set_time_limit(300);
            // Retain the existing dashboard access policy; release the session during remote I/O.
            session_write_close();
            $service = SharePointMeetings::fromEnvironment();
            try {
                $status = $service->sync();
                echo json_encode(['success' => true, 'sync' => $status], JSON_UNESCAPED_UNICODE);
            } catch (Throwable $syncError) {
                http_response_code(503);
                echo json_encode(['success' => false, 'error' => $syncError->getMessage(), 'sync' => $service->status()], JSON_UNESCAPED_UNICODE);
            }
            break;

        case 'get_filter_options':
            $data = $lib->getFilterOptions();
            echo json_encode(array_merge(['success' => true], $data), JSON_UNESCAPED_UNICODE);
            break;

        case 'get_summary':
            $filter = parseFilterParams();
            $summary = $lib->getSummary($filter);$summary['filter']=$filter;
            echo json_encode(['success' => true, 'summary' => $summary], JSON_UNESCAPED_UNICODE);
            break;

        case 'get_lessons':
            $filter = parseFilterParams();
            $lessons = $lib->getLessonsList($filter);
            echo json_encode(['success' => true, 'total' => count($lessons), 'items' => $lessons,'curation_revision'=>$curationState['revision'],'curation_mode'=>$raw?'raw':'curated','filter'=>$filter], JSON_UNESCAPED_UNICODE);
            break;

        case 'get_nodes':
            $filter = parseFilterParams();
            $nodes = $lib->getNodesList($filter);
            echo json_encode(['success' => true, 'total' => count($nodes), 'items' => $nodes,'curation_revision'=>$curationState['revision'],'curation_mode'=>$raw?'raw':'curated','filter'=>$filter], JSON_UNESCAPED_UNICODE);
            break;

        case 'get_aggregation':
            $filter = parseFilterParams();
            $metric = $_GET['metric'] ?? $_POST['metric'] ?? 'lessons_total';
            $rowAxis = $_GET['row_axis'] ?? $_POST['row_axis'] ?? 'month';
            $colAxis = $_GET['col_axis'] ?? $_POST['col_axis'] ?? '';
            $agg = $lib->getAggregationData($filter, $metric, $rowAxis, $colAxis);$agg['filter']=$filter;
            echo json_encode(['success' => true, 'aggregation' => $agg], JSON_UNESCAPED_UNICODE);
            break;

        default:
            echo json_encode(['success' => false, 'error' => '不明なアクション: ' . htmlspecialchars($action)]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}


// Single byte-range streaming enables seeking without loading the whole recording into PHP memory.
function streamMeetingAudio(array $asset) {
    $size=filesize($asset['path']);$start=0;$end=$size-1;
    header('Content-Type: '.$asset['mime']);header('Accept-Ranges: bytes');header('X-Content-Type-Options: nosniff');
    if(!empty($_SERVER['HTTP_RANGE'])) {
        if(!preg_match('/^bytes=(\d*)-(\d*)$/',$_SERVER['HTTP_RANGE'],$m)||($m[1]===''&&$m[2]==='')) {http_response_code(416);header('Content-Range: bytes */'.$size);return;}
        if($m[1]===''){$length=(int)$m[2];$start=max(0,$size-$length);}else{$start=(int)$m[1];if($m[2]!=='')$end=min($end,(int)$m[2]);}
        if($start>$end||$start>=$size){http_response_code(416);header('Content-Range: bytes */'.$size);return;}
        http_response_code(206);header('Content-Range: bytes '.$start.'-'.$end.'/'.$size);
    }
    header('Content-Length: '.($end-$start+1));if(($_SERVER['REQUEST_METHOD'] ?? 'GET')==='HEAD')return;
    $file=fopen($asset['path'],'rb');fseek($file,$start);$remaining=$end-$start+1;
    while($remaining>0&&!feof($file)&&!connection_aborted()){$chunk=fread($file,min(1048576,$remaining));if($chunk===false||$chunk==='')break;echo $chunk;$remaining-=strlen($chunk);flush();}
    fclose($file);
}
