<?php
// fujinaka-system/php/log_event.php
session_start();
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

header('Content-Type: application/json'); // JSON 形式でレスポンスを返す
// セッションがなければ POST の user_id をフォールバックとして使用（なければ 'anonymous'）
$user_id = isset($_SESSION['USERID']) ? $_SESSION['USERID'] : (isset($_POST['user_id']) && trim($_POST['user_id']) !== '' ? trim($_POST['user_id']) : 'anonymous');
header('Content-Type: application/json; charset=utf-8');

try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
  }

  // 受け取り
  $category    = isset($_POST['category'])    ? trim($_POST['category'])    : '';
  $subcategory = isset($_POST['subcategory']) ? trim($_POST['subcategory']) : '';
  $content     = isset($_POST['content'])     ? trim($_POST['content'])     : '';

  // 必須: category, subcategory は必須にします。contentは空でも許容。
  if ($category === '' || $subcategory === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'category and subcategory are required']);
    exit;
  }

  // タイムスタンプ生成（ISO 8601、サーバのタイムゾーンに依存）
  $timestamp = date('c');

  // ログレコード
  $record = [
    'timestamp'  => $timestamp,
    'category'   => $category,
    'subcategory'=> $subcategory,
    'content'    => $content,
    'node_id'     => $node_id ?? null,
    'f_node_id'   => $f_node_id ?? null,
    'p_node_id'   => $p_node_id ?? null,
    'user_id'    => $user_id,
  ];
  $line = json_encode($record, JSON_UNESCAPED_UNICODE) . PHP_EOL;

  // 保存先
  $dir = __DIR__ . '/logs';
  $path = $dir . '/system.log';

  // ディレクトリ作成
  if (!is_dir($dir)) {
    if (!mkdir($dir, 0775, true) && !is_dir($dir)) {
      throw new Exception('Failed to create log directory');
    }
  }

  // 追記（排他制御）
  $fp = fopen($path, 'a');
  if (!$fp) {
    throw new Exception('Failed to open log file');
  }
  if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    throw new Exception('Failed to lock log file');
  }
  fwrite($fp, $line);
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);

  echo json_encode(['status' => 'success']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}