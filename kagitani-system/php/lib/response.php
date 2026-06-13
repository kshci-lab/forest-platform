<?php
/**
 * JSONレスポンス共通出力クラス
 */
class Response {
    /**
     * 指定したデータをJSON形式で出力し、スクリプトを終了する
     */
    public static function json($data, $status = 200) {
        // 出力バッファをクリアして意図しない警告等の混入を防ぐ
        if (ob_get_length()) {
            ob_clean();
        }
        
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }

    /**
     * 成功レスポンスを出力する
     */
    public static function success($message = null, $data = []) {
        $res = ['success' => true];
        if ($message !== null) {
            $res['message'] = $message;
        }
        self::json(array_merge($res, $data));
    }

    /**
     * エラーレスポンスを出力する
     */
    public static function error($message, $code = 400, $data = []) {
        self::json(array_merge([
            'success' => false,
            'error' => $message
        ], $data), $code);
    }
}
?>
