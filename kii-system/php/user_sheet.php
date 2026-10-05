<?php

  session_start();

  require("connect_db.php");

  // オブジェクトをJSON形式へ変換する関数の定義（日本語をunicodeのままで整形して返す関数）
  function json_safe_encode($data){
    return json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  }

  $user = $_POST["user"];
  $user_id = $_SESSION["USERID"];
  $map_id = $_SESSION["MAPID"];
  // $user = filter_input(INPUT_POST, 'user');

  // // 下記の「3」はファイル出力する指定
  // error_log(var_export($last_user, true), 3, "./log.txt");
  $array = array();

  // JSONで渡すためのデータの定義
  // ユーザidとノードデータを格納する
  $data_arr = array('user'=>$user, 'array'=>[$array]);

  // JSON用の配列に格納
  $data_arr["user"] = $user;

  // 処理途中のデータを格納する配列
  // 説明は順を追ってコメントアウトしていってます
  $activity_array = array();
  $new_node_array = array();
  $new_node_array2 = array();

  // updated_atが$userより遅い場合，過去の編集を遡る
  // ノード編集履歴はactivitiesテーブルに管理しているので，そちらからデータを取得する
  // activitiesテーブルのmap_idと$map_idを照合
  // timestampが$userよりも小さいものを取得・最新のものに並び替え
  $sql = "SELECT * FROM activities
          WHERE map_id=$user 
          ORDER BY timestamp DESC ";

  if($result = $mysqli->query($sql)){

    while($row = mysqli_fetch_assoc($result)){
      // $activity_array：そのシートにおける全ての操作履歴を格納した変数
      array_push($activity_array, $row);
    }
  }

  // ノードidでまとめる（重複を無くす）
  $tmp = array(); // 入れ替え用の一時的に使う変数
  $array_result = array();
  foreach($activity_array as $key => $value ){
    // 配列に値が見つからなければ$tmpに格納
    if( !in_array( $value['node_id'], $tmp ) ) {
      $tmp[] = $value['node_id'];
      $array_result[] = $value; // 取得したノード情報全て
    }
  }

  // rootを配列の０番目として定義
  $new_node_array[0]["id"] = "root";
  $new_node_array[0]["isroot"] = true;
  $new_node_array[0]["topic"] = "★";

  // root以降の情報を格納する
  for($i=1; $i < count($array_result)+1; $i++){

    $new_node_array[$i]["id"] = $array_result[$i-1]["node_id"];
    $new_node_array[$i]["parentid"] = $array_result[$i-1]["parent_id"];
    $new_node_array[$i]["topic"] = $array_result[$i-1]["text"];
    $new_node_array[$i]["type"] = $array_result[$i-1]["type"];
    $new_node_array[$i]["concept_id"] = $array_result[$i-1]["concept_id"];
    $new_node_array[$i]["act"] = $array_result[$i-1]["act"];

  }

  // idかトピックが空，もしくはopen1とかいう変な奴の場合は除外
  // ` parentid= "" `はrootも除外してしまうためエラーになる
  for($x=0; $x<count($new_node_array); $x++){
    if($new_node_array[$x]["id"] == "" || $new_node_array[$x]["id"] == "open1" || $new_node_array[$x]["topic"] == "") {
    // if($new_node_array[$x]["id"] == "" || $new_node_array[$x]["id"] == "open1") {
      continue;
    }else{
      array_push($new_node_array2, $new_node_array[$x]);
    }
    // ノードid毎に対し，actが
    // ・add/edit/moveの場合：node_id, parent_id, textを取得して返す
    // ・deleteの場合：取得しない(deは昔のdeleteの意味のデータ)
    if($x>=1){ // root以降で
      if($new_node_array[$x]["act"] == "delete" || $new_node_array[$x]["act"] == "de"){
        continue;
      }
    }
  }
  // 下記の「3」はファイル出力する指定
  // error_log(var_export($new_node_array2, true), 3, "./log.txt");

  $data_arr['array'] = (array)$new_node_array2;
  echo json_safe_encode($data_arr, true);

?>
