<?php

//指定した日時を含むパターンを抽出する
session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];
$map_id = $_SESSION["MAPID"];

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");


//当日にする．とりあえず当日の0~24
$start_time = $today_date .' ' .'00:00:00.000000';
$finish_time = $today_date .' ' .'23:59:59.999999';

//テンプレート文を格納する配列
$reflection_item = array();



//全てのログ情報を抽出
$sql = "SELECT *  FROM activities
        WHERE user_id = '$user_id'
              AND map_id = '$map_id'
              ORDER BY 'timestamp' DESC";

              // $sql = "SELECT *  FROM activities
              //         WHERE timestamp BETWEEN '$start_time' AND '$finish_time'
              //               AND user_id = '$user_id'
              //               AND map_id = '$map_id'
              //               ORDER BY 'timestamp' DESC";

//各変数
$t =0;
$word;
$activities = array();
$datetime = array();

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

      //もしも指定期間内ならtrue，指定期間外ならfalseにする
      //順序性があるものは，一番最後のものが少なくともtrueであれば，
      //順序性がないものは，どれかにtrueがあればいい(もしくは，trueをカウントして0以上ならばOKみたいな)
      if($activities[$t]['timestamp'] >= $start_time && $activities[$t]['timestamp'] < $finish_time){
        //期間内の場合
        $word = "operation_log(datetime('"
                .$activities[$t]['timestamp']
                ."','"
                ."true"
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
      }else{
        //期間外の場合
        $word = "operation_log(datetime('"
                .$activities[$t]['timestamp']
                ."','"
                ."false"
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
              //
              //
              //
              // 
              // $word = "operation_log(datetime('"
              //         .$activities[$t]['timestamp']
              //         ."'), ibss_log( '"
              //         .$activities[$t]['node_id']
              //         ."', '"
              //         .$activities[$t]['act']
              //         ."', '"
              //         .$activities[$t]['type']
              //         ."', '"
              //         .$activities[$t]['concept_id']
              //         ."', '"
              //         .$activities[$t]['text']
              //         ."', '"
              //         .$activities[$t]['parent_id']
              //         ."')). "
              //         ."\n";
              //  fputs($fp,$word);
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

//ログファイルと実行ファイルを結合
$filelist = array('hozo_data.pl', $log_directory, 'get_activities.pl');
$data = "";
foreach ($filelist as $file) {
    $filedata = file_get_contents($file);
    $data .= $filedata;
}

file_put_contents("get_pattern.pl",$data);
$cmd =  "/usr/local/bin/swipl -f get_pattern.pl";
exec( $cmd,$opt );



//帰って来た値の数だけ繰り返す
$e=0;
$u=0;
$atai = array();
$qqqq = $opt;

for($e=0; $e<count($opt); $e++){

  $opt[$e] = str_replace('[', '', $opt[$e]);
  $opt[$e] = str_replace(']', '', $opt[$e]);
  $opt[$e] = str_replace("'", '', $opt[$e]);



  $atai[] = explode (",", $opt[$e]);


  for($u=0; $u<count($atai[$e]); $u++){


  }


//テンプレートの取得はfullとか使いながら


  $wawawa= $atai[$e][1];

  $temp1 = "SELECT template_text FROM reflection_template WHERE template_number = '$wawawa'"; //該当するテンプレート文を取得
  //%Sの文だけ繰り返して当てはめる．パターンは当てはめる順番に取得しておく
  $template_text_set = $mysqli->query($temp1);
  $wqwq = mysqli_fetch_assoc($template_text_set);

  $s=0;
  for($s=0; $s<mb_substr_count($wqwq['template_text'], "%S")+2; $s++){ //%Sの回数だけ%Sを書き換える

            $erer = $atai[$e][$s+3];

            if(strpos($erer,'_n') === false){

                    //'_n'が含まれていない場合,つまり時系列からノード文を取得する必要がある時
                    $qweqwe = "SELECT text FROM activities WHERE timestamp = '$erer'";
                    //もしもっと新しいのがあったら表示する？未実装
                    $Ntextt = $mysqli->query($qweqwe);
                    $weeee = mysqli_fetch_assoc($Ntextt);
                    $wqwq['template_text'] = preg_replace("/%S/", $weeee['text'] , $wqwq['template_text'], 1);

            }else if(strpos($erer,'_n') !== false){
                    //'_n'が含まれている時，つまり概念IDから概念名を検索して当てはめる時
                    $xml_data = simplexml_load_file('../js/hozo.xml'); //法造データ取り出し
                    $conLABEL =  $xml_data->xpath('W_CONCEPTS/CONCEPT[@id="'.$erer.'"]/LABEL/text()');
                    $wqwq['template_text'] = preg_replace("/%S/", $conLABEL[0] , $wqwq['template_text'], 1);

            }

          // $wqwq['template_text'] = preg_replace("/%S/", $weeee['text'] , $wqwq['template_text'], 1);


  }


  //対象のノード集めるやつ
  $target_item = array();
  //
  //対象ノードだけ集めたやつを合体した配列を一旦作成して，それをimplodeする
  for($atumeru=3;$atumeru<count($atai[$e]) ;$atumeru++ ){
    //ターゲットがコンセプトなら追加しない

    if(strpos($atai[$e][$atumeru],'_') === false){
    $target_item[] = $atai[$e][$atumeru] .",";
    }
  }

  //implodeする
  $targets_kari = implode($target_item);
  $targets = rtrim($targets_kari, ',');

  //テンプレート名，対象の情報，ユーザ，シートが同じものがあったら追加しない
  $check_sql = "SELECT * FROM reflections WHERE template_number = '$wawawa' AND target_nodes = '$targets' AND user_id='$user_id' AND map_id='$map_id'";
  $result222 = $mysqli->query($check_sql);
  if(mysqli_num_rows($result222) <= 0){
            $reflection_item[] = array(
              'ref_text'=>$wqwq['template_text'],
              'what'=>$targets,
              'template'=>$wawawa,
              'status'=>$atai[$e][2]
            );
            // var_dump($result222);
            // echo nl2br("\n");
            // echo nl2br("\n");
            // echo nl2br("\n");
            // error_log($result222.'ほなリフレクションしよか'.$mysqli->error, 0);
            // var_dump(mysqli_num_rows($result222));
            // echo nl2br("\n");
            // echo nl2br("\n");
            // echo nl2br("\n");
  }else{
            // error_log($result222.'もうリフレクションしたみたいやで'.$mysqli->error, 0);
            // error_log($result222.'$check_sql'.$mysqli->error, 0);
            // var_dump(mysqli_num_rows($result222));
            // echo nl2br("\n");
            // echo nl2br("\n");
            // echo nl2br("\n");

  }

  //ACTに指定した日時が含まれているか選択にするか…？




  //
  // $ref_count = mysqli_num_rows($check_sql);
  // if (!$ref_count) {
  //   $reflection_item[] = array(
  //         'ref_text'=>$wqwq['template_text'],
  //         'what'=>$targets,
  //         'template'=>$wawawa
  //       );z
  // }

  // $reflection_item[] = array(
  //       'ref_text'=>$wqwq['template_text'],
  //       'what'=>$targets,
  //       'template'=>$wawawa
  //     );

}




echo json_encode($reflection_item);

?>
