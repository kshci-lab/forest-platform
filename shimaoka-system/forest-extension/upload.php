<?php
if ($_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
    die('アップロードに失敗しました');
}

$upload_dir = __DIR__ . '/uploads/';
if (!file_exists($upload_dir)) mkdir($upload_dir);

$pdf_path = $upload_dir . basename($_FILES['pdf_file']['name']);
move_uploaded_file($_FILES['pdf_file']['tmp_name'], $pdf_path);

// Pythonで解析
// Pythonで解析
$command = "python3 parse_pdf.py " . escapeshellarg($pdf_path) . " 2>&1";  // ← stderrも取得
$output = shell_exec($command);

// 出力を確認
if (!$output) {
    die("PDF解析に失敗しました。\n実行コマンド: $command");
}



// テキストを質問生成スクリプトに渡す
file_put_contents("tmp_text.txt", $output);
header("Location: generate_question.php");
?>
