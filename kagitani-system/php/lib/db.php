<?php
/**
 * データベース接続・操作共通クラス
 */
class Db {
    private static $mysqli = null;

    /**
     * データベース接続を取得（シングルトン）
     */
    public static function getConnection() {
        if (self::$mysqli === null) {
            // kagitani-system/php/connect_db.php を読み込む
            $connect_db_path = dirname(__DIR__) . '/connect_db.php';
            if (!file_exists($connect_db_path)) {
                throw new Exception("connect_db.php not found at " . $connect_db_path);
            }
            require_once($connect_db_path);
            
            global $mysqli;
            if (!$mysqli) {
                throw new Exception("Database connection variables failed to initialize in connect_db.php");
            }
            self::$mysqli = $mysqli;
        }
        return self::$mysqli;
    }

    /**
     * クエリを実行し、失敗時は例外をスローする
     */
    public static function query($sql) {
        $db = self::getConnection();
        $result = $db->query($sql);
        if (!$result) {
            throw new Exception("Database query failed: " . $db->error . " | SQL: " . $sql);
        }
        return $result;
    }

    /**
     * 文字列をSQL安全にエスケープする
     */
    public static function escape($str) {
        if ($str === null) return 'NULL';
        return self::getConnection()->real_escape_string($str);
    }

    /**
     * トランザクションを開始する
     */
    public static function beginTransaction() {
        self::getConnection()->begin_transaction();
    }

    /**
     * トランザクションをコミットする
     */
    public static function commit() {
        self::getConnection()->commit();
    }

    /**
     * トランザクションをロールバックする
     */
    public static function rollback() {
        self::getConnection()->rollback();
    }

    /**
     * 直前の挿入IDを取得
     */
    public static function getInsertId() {
        return self::getConnection()->insert_id;
    }

    /**
     * 直前の影響行数を取得
     */
    public static function getAffectedRows() {
        return self::getConnection()->affected_rows;
    }
    
    /**
     * 直前のエラーを取得
     */
    public static function getLastError() {
        return self::getConnection()->error;
    }
}
?>
