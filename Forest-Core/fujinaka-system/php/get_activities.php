<?php

session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];
$map_id = $_SESSION["MAPID"];

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");

$start_date = $_POST["start_date"];
$finish_date = $_POST["finish_date"];
$start_time = $start_date .' ' .'00:00:00.000000';
$finish_time = $finish_date .' ' .'23:59:59.999999';


$reflection_item = array(); //リフレクション情報を格納する配列


$sql = "SELECT *  FROM activities
        WHERE user_id = '$user_id'
              AND map_id = '$map_id'";  //全ての活動記録を取得

$t =0;
$word;
$activities = array();

if($result = $mysqli->query($sql)){

    //抽出した値を$activitiesに格納する
    while($row = mysqli_fetch_assoc($result)){
      $activities[] = $activities + array(
        'timestamp'=> $row["timestamp"],
        'node_id' => $row["node_id"],
        'act' => $row["act"],
        'type' => $row["type"],
        'concept_id' => $row["concept_id"],
        'text' => $row["text"],
        'parent_id' => $row["parent_id"]);
    }

    //ユーザ専用のディレクトリが存在するか確認
    if(!file_exists($user_id)){ mkdir($user_id, 0777);}

    $log_directory = $user_id .'/activities_logs.pl';
    $fp = fopen($log_directory, 'w');
    flock($fp, LOCK_EX);
    ftruncate($fp,0);
    fseek($fp,0);


    for($t=0; $t<count($activities); $t++){
              $word = "operation_log(datetime('"
                      .$activities[$t]['timestamp']
                      ."'), ibss_log( '"
                      .$activities[$t]['node_id']
                      ."', '"
                      .$activities[$t]['act']
                      ."', '"
                      .$activities[$t]['type']
                      ."', '"
                      .$activities[$t]['concept_id']
                      ."', '"
                      .$activities[$t]['text']
                      ."', '"
                      .$activities[$t]['parent_id']
                      ."')). "
                      ."\n";
               fputs($fp,$word);
    }


    flock($fp, LOCK_UN);
    fclose($fp);


}


if($result == TRUE){error_log('$result成功', 0);
}else if($result == FALSE){error_log($result.'$result失敗'.$mysqli->error, 0);}


/*法造ファイルをProlog形式で取り出すphpを呼び出す*/
require("get_prolog_hozo.php");
/*リフレクション情報をProlog形式で取り出すphpを呼び出す*/
require("get_prolog_reflection.php");

//各種ログファイルと実行ファイルを結合
$filelist = array('hozo_data.pl', $log_directory, 'reflection_data.pl', 'get_activities.pl');
$data = "";
foreach ($filelist as $file) {
    $filedata = file_get_contents($file);
    $data .= $filedata;
}

file_put_contents("get_pattern.pl",$data);
$cmd =  "/usr/local/bin/swipl -f get_pattern.pl";
exec( $cmd,$opt2 );

 $opt= myArrayUnique($opt2); //重複処理

$e=0;
$u=0;
$items = array(); //返り値を格納する配列

for($e=0; $e<count($opt); $e++){

  $opt[$e] = str_replace('[', '', $opt[$e]);
  $opt[$e] = str_replace(']', '', $opt[$e]);
  $opt[$e] = str_replace("'", '', $opt[$e]);

  $items[] = explode (",", $opt[$e]);

  $wawawa= $items[$e][1];
  $period_counter = 0;


  //値の数だけ繰り返す，指定した期間内の要素があるものだけ取得する
  for($lll=0; $lll<count($items[$e]); $lll++){
    if($items[$e][$lll]>=$start_time and $items[$e][$lll]<=$finish_time){
      $period_counter = $period_counter +1;
    }
  }


  if($period_counter>=1){ //指定期間のリフレクション文の場合



    $temp1 = "SELECT template_text FROM reflection_template WHERE template_number = '$wawawa'"; //該当するテンプレート文を取得
    //%Sの文だけ繰り返して当てはめる．パターンは当てはめる順番に取得しておく
    $template_text_set = $mysqli->query($temp1);
    $template_text = mysqli_fetch_assoc($template_text_set);

    $s=0;
    $S_count= mb_substr_count($template_text['template_text'], "%S");


    for($s=0; $s<$S_count; $s++){ //%Sの回数だけ%Sを書き換える


              $item = $items[$e][$s+3];
                      $get_nodeText = "SELECT text FROM activities WHERE timestamp = '$item'";
                      $get_nodeText_sql = $mysqli->query($get_nodeText);
                      $get_nodeText_item = mysqli_fetch_assoc($get_nodeText_sql);
                      $template_text['template_text'] = preg_replace("/%S/", $get_nodeText_item['text'] , $template_text['template_text'], 1);
    }




    //対象のノード
    $target_item = array();
    //
    //対象ノードだけ集めたやつを合体した配列を一旦作成して，それをimplodeする
    for($atumeru=3;$atumeru<count($items[$e]) ;$atumeru++ ){
      //ターゲットがコンセプトなら追加しない
      if(strpos($items[$e][$atumeru],'_') === false){
      $target_item[] = $items[$e][$atumeru] .",";
      }
    }
    $targets_kari = implode($target_item);
    $targets = rtrim($targets_kari, ',');


$target_node_date;
$target_node_id;
$rationality_node_date;


    //あまりよろしくない実装であるが
    //７番目が対象のやつなので，依存です
    if($items[$e][1]=="template_9" or $items[$e][1]=="template_10"){

      $target_node_date=null;
      $target_node_id=null;
      $rationality_node_date=null;

    }else if($items[$e][1]=="template_7_1" or $items[$e][1]=="template_8_1" or $items[$e][1]=="template_7_2" or $items[$e][1]=="template_8_2") { //合理性はrationality_nodeも加える
      $target_node_date = $items[$e][7];
      $target_id = "SELECT node_id FROM activities WHERE timestamp = '$target_node_date' ";
      $TargetID = $mysqli->query($target_id);
      $Target_ID = mysqli_fetch_assoc($TargetID);
      $target_node_id = $Target_ID['node_id'];
      $rationality_node_date = $items[$e][5];

    }else{

    $target_node_date = $items[$e][7];
    $target_id = "SELECT node_id FROM activities WHERE timestamp = '$target_node_date' ";
    $TargetID = $mysqli->query($target_id);
    $Target_ID = mysqli_fetch_assoc($TargetID);
    $target_node_id = $Target_ID['node_id'];
    $rationality_node_date=null;
  }


    //テンプレート名，対象の情報，ユーザ，シートが同じものがあったら追加しない
    $check_sql = "SELECT * FROM reflections
                    WHERE template_number = '$wawawa'
                          AND target_nodes = '$targets'
                          AND user_id='$user_id'
                          AND map_id='$map_id'";
                          
    $result222 = $mysqli->query($check_sql);


    if(mysqli_num_rows($result222) <= 0){
              $reflection_item[] = array(
                'ref_text'=>$template_text['template_text'],
                'what'=>$targets,
                'template'=>$wawawa,
                'status'=>$items[$e][2],
                'target_node_date'=>$target_node_date,
                'target_node'=>$target_node_id,
                'rationality_node_date'=>$rationality_node_date
              );
    }

}



}

//ref_textが一致している情報があるか確認する関数
function myArrayUnique($array) {

  $num=0;
    $uniqueArray = [];
    foreach($array as $key => $value) {
        if (!in_array($value, $uniqueArray)) {
            $uniqueArray[$num] = $value;
            $num++;
        }
    }
    return $uniqueArray;
}


echo json_encode($reflection_item);

?>
