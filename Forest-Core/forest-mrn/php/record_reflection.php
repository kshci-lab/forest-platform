<!-- reflection情報を記録するよ -->
<?php

  session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');


		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる
    // $id = $_POST["ref_id"];                      //ID
		$user_id =  $_SESSION['USERID'];          //ユーザID
    $map_id = $_SESSION['MAPID'];        //シートID
    // $ref_text = $_POST["ref_text"];          //リレクション文
		// $ref_activity = $_POST["ref_activity"];  //リフレクション活動
    // $late_activity = "0"; //$_POST["late_activity"];  //仮
    // $ref_targets = "asasdasda"; //$_POST["targets"];        //対象ノード情報の元


    $ref_item = $_POST['ref_item'];


      for($e=0;$e<count($ref_item);$e++){
        // print('target :'.$ref_item[$e]['targets'].'<br>');
        // print('id :'.$ref_item[$e]['ref_id'].'<br>');
        // print('ref_text :'.$ref_item[$e]['ref_text'].'<br>');
        // print('activity :'.$ref_item[$e]['ref_activity'].'<br>');

        $reflection_id = $ref_item[$e]['ref_id'];
        $reflection_text = $ref_item[$e]['ref_text'];
        if($ref_item[$e]['ref_activity'] == "undefined"){
          $ref_item[$e]['ref_activity'] = "";
        }
        $reflection_activity = $ref_item[$e]['ref_activity'];
        $reflection_target = $ref_item[$e]['targets'];
        $reflection_template = $ref_item[$e]['template'];
        if(isset($ref_item[$e]['late_activity']) === false){
          $late_activity = " ";
        }else{
          $late_activity = $ref_item[$e]['late_activity'];
        }



        $ref_reason = $ref_item[$e]['ref_reason'];
        $ref_target = $ref_item[$e]['target_node'];
        $ref_target_date = $ref_item[$e]['target_node_date'];
        $rationality_node_date = $ref_item[$e]['rationality_node_date'];

        $sql = "INSERT INTO reflections (id, timestamp, template_number, reflection_text, activity, activity_later, target_node_date, target_node, rationality_node_date, target_nodes, ref_reason,user_id, map_id)
        VALUES ('$reflection_id', '$timestamp', '$reflection_template','$reflection_text', '$reflection_activity','$late_activity','$ref_target_date','$ref_target','$rationality_node_date','$reflection_target', '$ref_reason','$user_id','$map_id')";



        $result = $mysqli->query($sql);

        //クエリ($sql)のエラー処理
        if($sql == TRUE){
        	error_log('$sql成功しています！'.$timestamp, 0);
        }else if($sql == FALSE){
        	error_log($sql.'$sql失敗です', 0);
        	// error_log('失敗しました。'.mysqli_error($link), 0);
        }else{
        	error_log('$sql不明なエラーです', 0);
        }

        //php($result)のエラー処理
        if($result == TRUE){
        	error_log('$result成功しています！'.$timestamp, 0);
        }else if($result == FALSE){
        	error_log($result.'$result失敗です'.$mysqli->error, 0);
        	// error_log('失敗しました。'.mysqli_error($link), 0);
        }else{
        	error_log('$result不明なエラーです', 0);
        }













      }


		// $sql = "INSERT INTO reflections (id, timestamp, reflection_text, activity, activity_later, target_nodes, user_id, map_id)
		// VALUES ('$id', '$timestamp', '$ref_text', '$ref_activity','$late_activity','$ref_targets','$user_id','$map_id')";
    //
    //
    //
		// $result = $mysqli->query($sql);
    //
    // //クエリ($sql)のエラー処理
    // if($sql == TRUE){
		// 	error_log('$sql成功しています！'.$timestamp, 0);
		// }else if($sql == FALSE){
		// 	error_log($sql.'$sql失敗です', 0);
		// 	// error_log('失敗しました。'.mysqli_error($link), 0);
		// }else{
		// 	error_log('$sql不明なエラーです', 0);
		// }
    //
    // //php($result)のエラー処理
    // if($result == TRUE){
		// 	error_log('$result成功しています！'.$timestamp, 0);
		// }else if($result == FALSE){
		// 	error_log($result.'$result失敗です'.$mysqli->error, 0);
		// 	// error_log('失敗しました。'.mysqli_error($link), 0);
		// }else{
		// 	error_log('$result不明なエラーです', 0);
		// }


?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>自己内対話活性化支援システム</title>
        <link type="text/css" rel="stylesheet" href="../css/jsmind.css" />
        <link rel="stylesheet" type="text/css" href="../css/item.css">
        <link rel="stylesheet" type="text/css" href="../css/font.css">
        <link rel="stylesheet" type="text/css" href="../css/jquery.cleditor.css">
        <link rel="stylesheet" type="text/css" href="../css/ui.css">
        <link rel="stylesheet" type="text/css" href="../css/style.css">
        <script type="text/javascript" src="../js/jquery-1.8.2.min.js"></script>
        <script type="text/javascript" src="../js/jquery-ui.min.js"></script>
        <script type="text/javascript" src="../js/jsmind.js"></script>
        <script type="text/javascript" src="../js/jsmind.draggable.js"></script>
        <script type="text/javascript" src="../js/add_node.js"></script>
        <script type="text/javascript" src="../js/get_thinking.js"></script>
        <script type="text/javascript" src="../js/jsmind.screenshot.js"></script>
        <script type="text/javascript" src="../js/change_tab.js"></script>
    </head>
    <body>
      <h1>リフレクションお疲れ様でした！</h1>
      <input value="戻る" class="ref_return_btn" onclick="history.back();" type="button"/>

    </body>
</html>
