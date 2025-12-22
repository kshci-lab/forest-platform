<?php
session_start();
// 明示的にタイムゾーンを設定（サーバ既定がUTCの場合のズレ防止）
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set('Asia/Tokyo');
}
// require("connect_db.php");
// PDO接続（connect_db.phpはmysqliのみ）
$db_host = "localhost";
$db_user = "root";
$db_password = "root";
$db_dbname = "forest_platform";
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_dbname;charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}


// POSTで受け取る

$goal_type = $_POST['goal_type'] ?? '';
$label = $_POST['label'] ?? null;
$start_date = $_POST['start_date'] ?? '';
$finish_date = $_POST['finish_date'] ?? '';

// map_id を取得（優先: POST -> SESSION）
$map_id = null;
if (isset($_POST['map_id'])) {
    $map_id = $_POST['map_id'];
} elseif (isset($_SESSION['MAPID'])) {
    $map_id = $_SESSION['MAPID'];
}

if ($map_id === null || $map_id === '') {
    // map_id がないとテーブル定義上 INSERT に失敗するので早期エラー
    echo json_encode(['success' => false, 'error' => 'map_id が指定されていません']);
    exit;
}

$map_id = (int)$map_id;



$object_journal_id = uniqid('goal_', true);
$appeared_at = date('Y-m-d H:i:s');
$update_at = $appeared_at;
$delete = 0;


// テーブルにlabelカラムがある場合はlabelを使う。なければlabelを除外。
$hasLabel = false;
try {
    $result = $pdo->query("DESCRIBE object_journals");
    foreach ($result as $row) {
        if ($row['Field'] === 'label') {
            $hasLabel = true;
            break;
        }
    }
} catch (Exception $e) {}

$hasMapColumn = false;
try {
    $result = $pdo->query("DESCRIBE object_journals");
    foreach ($result as $row) {
        if ($row['Field'] === 'map_id') {
            $hasMapColumn = true;
            break;
        }
    }
} catch (Exception $e) {}

// map_id カラムがある前提で INSERT 文に map_id を含める
if ($hasLabel) {
    if ($hasMapColumn) {
        $sql = "INSERT INTO `object_journals`(`object_journal_id`, `map_id`, `goal_type`, `label`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_journal_id, :map_id, :goal_type, :label, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
    } else {
        $sql = "INSERT INTO `object_journals`(`object_journal_id`, `goal_type`, `label`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_journal_id, :goal_type, :label, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
    }
} else {
    if ($hasMapColumn) {
        $sql = "INSERT INTO `object_journals`(`object_journal_id`, `map_id`, `goal_type`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_journal_id, :map_id, :goal_type, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
    } else {
        $sql = "INSERT INTO `object_journals`(`object_journal_id`, `goal_type`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_journal_id, :goal_type, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
    }
}
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':object_journal_id', $object_journal_id, PDO::PARAM_STR);
$stmt->bindValue(':goal_type', $goal_type, PDO::PARAM_STR);
if ($hasLabel) {
    $stmt->bindValue(':label', $label, PDO::PARAM_STR);
}
if ($hasMapColumn) {
    $stmt->bindValue(':map_id', $map_id, PDO::PARAM_INT);
}
$stmt->bindValue(':start_date', $start_date, PDO::PARAM_STR);
$stmt->bindValue(':finish_date', $finish_date, PDO::PARAM_STR);
$stmt->bindValue(':appeared_at', $appeared_at, PDO::PARAM_STR);
$stmt->bindValue(':update_at', $update_at, PDO::PARAM_STR);
$stmt->bindValue(':delete', $delete, PDO::PARAM_INT);

try {
    $stmt->execute();
    echo json_encode(['success' => true, 'object_journal_id' => $object_journal_id]);
} catch (Exception $e) {
    file_put_contents('debug.txt', "SQL Error: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
