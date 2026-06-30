<?php
// データベースに接続
function connectDB_Test() {
    $dbname = 'forest_platform';
    if (!empty($_SERVER['REQUEST_URI'])) {
        if (strpos($_SERVER['REQUEST_URI'], '/software/jiko-chouseisan-kojilab') !== false) {
            $dbname = 'jiko-chouseisan-kojilab';
        } elseif (strpos($_SERVER['REQUEST_URI'], '/software/jiko-chouseisan') !== false) {
            $dbname = 'forest_platform';
        }
    }
    $param = 'mysql:dbname=' . $dbname . ';host=localhost';
    try {
        $pdo = new PDO($param, 'root', 'root');
        return $pdo;

    } catch (PDOException $e) {
        exit($e->getMessage());
    }
}

function test(){
    print("test");
}
?>