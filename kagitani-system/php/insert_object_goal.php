<?php
session_start();
// エラー表示を抑制（JSONレスポンスを壊さないため）
error_reporting(0);
ini_set('display_errors', 0);

// 明示的にタイムゾーンを設定（サーバ既定がUTCの場合のズレ防止）
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set('Asia/Tokyo');
}

header('Content-Type: application/json; charset=UTF-8');

// connect_db.phpから変数を取得するためにインクルード
require("connect_db.php");

// PDO接続（connect_db.phpで定義された変数を使用）
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_dbname;charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}


// POSTで受け取る
$start_date = $_POST['start_date'] ?? '';
$finish_date = $_POST['finish_date'] ?? '';
$label = $_POST['label'] ?? '';  // labelを受け取る（未使用でもエラー防止）

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
        $sql = "INSERT INTO `object_journals`(`object_journal_id`, `map_id`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_journal_id, :map_id, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
    } else {
        $sql = "INSERT INTO `object_journals`(`object_journal_id`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_journal_id, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
    }
} else {
    if ($hasMapColumn) {
        $sql = "INSERT INTO `object_journals`(`object_journal_id`, `map_id`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_journal_id, :map_id, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
    } else {
        $sql = "INSERT INTO `object_journals`(`object_journal_id`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_journal_id, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
    }
}
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':object_journal_id', $object_journal_id, PDO::PARAM_STR);

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
