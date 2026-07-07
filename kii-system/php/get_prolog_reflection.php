<?php

// session_start();

require("connect_db.php");

$user_id = $_SESSION["USERID"];  //'26943';//
$map_id = $_SESSION["MAPID"];  //'520326090';//

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");

//テンプレート文を格納する配列
$reflection_item = array();

$sql = "SELECT *  FROM reflections WHERE user_id = '$user_id' AND map_id = '$map_id' ORDER BY 'timestamp' DESC";

//各変数
$t =0;
$word;
$activities = array();
$datetime = array();
$target_set = array();
$target_nodes_set = array();



if($result = $mysqli->query($sql)){

  //取り出したターゲットからIDをゲットしていくぜ！！
  //１．カンマで区切ってるやつを配列に入れる



    //抽出した値を$activitiesに格納する
    while($row = mysqli_fetch_assoc($result)){
      $activities[] = $activities + array(
        'timestamp'=> $row["timestamp"],
        'template_number'=> $row["template_number"],
        'activity' => $row["activity"],
        'later_activity' => $row["activity_later"],
        'target_node_date' => $row["target_node_date"],
        'target_node' => $row["target_node"],
        'rationality_node_date' => $row["rationality_node_date"],
        'reflection_text' => $row["reflection_text"],
        'reflection_reason' => $row["ref_reason"],
        'targets' => $row["target_nodes"]);

    }




    $fp = fopen('reflection_data.pl', 'w');
    flock($fp, LOCK_EX);
    ftruncate($fp,0);
    fseek($fp,0);



//日付のままでよくね？
    for($t=0; $t<count($activities); $t++){
    //

      //１．target_nodes
      $target_set = explode(',',$activities[$t]['targets']);
        $node_word =  "targets(['";
        for($g=0;$g<count($target_set);$g++){

          if($g==count($target_set)-1){

            $node_word .= $target_set[$g] ."'])" ;
          }else{
            $node_word .= $target_set[$g] ."', '";
          }
        }



        //これでいいはずだ
              $word = "operation_log(datetime('"
                      .$activities[$t]['timestamp']
                      ."'), reflection_log( '"
                      .$activities[$t]['template_number']
                      ."', '"
                      .$activities[$t]['activity']
                      ."', '"
                      .$activities[$t]['later_activity']
                      ."', '"
                      .$activities[$t]['target_node_date']
                      ."', '"
                      .$activities[$t]['target_node']
                      ."', '"
                      .$activities[$t]['rationality_node_date']
                      ."', '"
                      .$activities[$t]['reflection_text']
                      ."', '"
                      .$activities[$t]['reflection_reason']
                      ."',"
                      .$node_word
                      .")). "
                      ."\n";
               fputs($fp,$word);
    }


    flock($fp, LOCK_UN);
    fclose($fp);

}

?>
