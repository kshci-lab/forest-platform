<?php
// データベースに接続
function connectDB_Test() {
    $param = 'mysql:dbname=otsuki;host=localhost';
    // $param = 'mysql:dbname=shimizu;host=localhost';
    try {
        $pdo = new PDO($param, 'root', 'root');
        // $pdo = new PDO($param, 'root', 'kslabkslab');
        return $pdo;

    } catch (PDOException $e) {
        exit($e->getMessage());
    }
}

function test(){
    print("test");
}
?>