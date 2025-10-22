<?php
// DB接続情報
$host = "localhost";
$dbname = "forest_platform"; // 既存DB
$user = "root";              // MAMPデフォルト
$pass = "root";
$charset = "utf8";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=$charset", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "DB接続成功！";
} catch (PDOException $e) {
    echo "DB接続失敗: " . $e->getMessage();
}
?>

