<?php

session_start();
require("connect_db.php");

date_default_timezone_set('Asia/Tokyo');


// ユニークなファイル名をつける関数
// ファイル名は「（シート名）(_数字）.txt」になる
// function unique_filename($org_path) {
//   $info = pathinfo($org_path);
//   $path = $org_path;
//   $num = 0;
//   do {
//     $fp = @fopen($path, 'x'); // 'x'の指定により、元々$pathが存在する場合はエラーになる
//     if ($fp) break;
//     $num++;
//     $path = $info['dirname'] . "/" . $info['filename'] . "_" . $num;
//     if(isset($info['extension'])) $path .= "." . $info['extension'];
//   }
//   while ($num < 100);  // 過度に同名のファイルがある状況はエラーにしているが適宜調整のこと
//     if ($fp === FALSE)
//       die('ファイルが作成できません');
//   fclose($fp);  // このタイミングで $pathというファイルは存在したままだが
//   return $path; // アップロード処理で上書きしてしまう(いったん消してはいけない)
// }

$name = $_SESSION["mapname"]; // シート名
$timestamp = time();
$login_time = date("Y-m-d H:i:s", $timestamp);

$filename = "$name:$login_time";

// ２個上の階層にtxtファイルで出力
// error_log(var_export($html, true), 3, unique_filename("./../../$name.txt"));
// echo unique_filename("./$name.txt"); // ユニーク名を返す
echo("$filename.txt");

?>
