<?php

session_start();
require("../php/connect_db.php");
require_once("php/sheet.php");

$mt_time_message = "";

// ログイン状態のチェック
if (!isset($_SESSION["USERID"])) {
  header("Location: ../logout.php");
  exit;
}

if (isset($_POST["logout"])) {
  header("Location: ../logout.php");
  exit;
}

//新規作成
if(isset($_POST["mapname"])){

	if($_POST["mapname"] != ""){

		createSheet();
    // createDocument();

	}else{

		echo "<script>alert('シート名を記入してください');</script>";

	}

}

//シート編集
if(isset($_POST['map'])){

	$_SESSION["MAPID"] = $_POST['map'];

	if(isset($_POST["edit"])){

		header("Location: index.php");

	}else{

		deleteSheet();
    deleteDocument();

	}

}

//ミーティングタイムの記録
if(isset($_POST["record"])){

  if(($_POST["date"] != "") && ($_POST["time"] != "") ){

    $mt_time = (date($_POST["date"]) ." " . date($_POST["time"]) );
    $id = rand();

    $sql = "INSERT INTO mt_timing (id, user_id, mt_time)
            VALUES ('".$id."', '".$_SESSION['USERID']."', '".$mt_time."')";

    $result = $mysqli->query($sql);
    $mt_time_message = ('ミーティングタイムを記録しました. <br>前回：' . $mt_time);

  }else{

    echo "<script>alert('ミーティングタイムを入力してください');</script>";

  }

}

  $userid = $_SESSION['USERID'];

  //ログイン中のユーザの一番最新のMTの時間を取得する
  $sql1 = "SELECT mt_time FROM mt_timing WHERE user_id = '$userid' ORDER BY mt_time DESC LIMIT 1" ;

  if($result = $mysqli->query($sql1)){
    while($row = mysqli_fetch_assoc($result)){
      $mt_time_message = ('前回のミーティングタイム：<br>' . $row['mt_time']);
      $_SESSION['mt_time_message'] = $row['mt_time'];
    }
  }

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
	<head>
		<meta charset="UTF-8">
		<title>自己内対話活性化支援システム</title>
		<link rel="stylesheet" type="text/css" href="../css/item.css">
		<link rel="stylesheet" type="text/css" href="../css/font.css">
		<link rel="stylesheet" type="text/css" href="../css/jquery.cleditor.css">
		<link rel="stylesheet" type="text/css" href="../css/ui.css">
		<link rel="stylesheet" type="text/css" href="../css/select_sheet.css">
    <link rel="stylesheet" href="../css/Semantic-UI/semantic.css">
		<script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
		<script type="text/javascript" src="js/jquery-ui.min.js"></script>
	</head>

	<body id="all">

		<!--サイドメニュー　start-->
    <div id="side_menu">
        <h3>Menu</h3>
        <p>
        <div align="center">
          ようこそ<?=htmlspecialchars($_SESSION["USERNAME"], ENT_QUOTES); ?>さん
        </div>
        </p>
        <form name="return" method="POST" align="center">
            <input class="button3" type="submit" name="logout" value="ログアウト">
        </form>

        <form method="POST">
        　<div align="center">
            <p>ミーティングタイムの記録</p>
            <p>前回のミーティングの開始時間を<br>入力してください</p>
            <p>日付：<input class="mt_timing" name="date" type="date"></p>
            <p>時間：<input class="mt_timing" name="time" type="time" step="300"></p>
            <p>秒数は00で固定です</p>
            <p><input type="submit" name="record" class="record" value="時間を記録する"></p>
            <?php
              echo($mt_time_message);
            ?>
          </div>
        </form>
        <!-- </form><br>
        <div align="center">アンケートに答える<br>
        		<a href="https://docs.google.com/forms/d/e/1FAIpQLScIuIprw8eZEyNHRNSONCnUK0ODHJblxx3Qdsjk4zW5thPjBg/viewform?usp=sf_link" align="center">アンケートページに移動する</a>
        </div>
         -->

    </div>
    <!--サイドメニュー　finish-->

    <!-- メインメニュー　start -->
    <div id="main_menu">
    <h3>思考表出マップ</h3>

       <div class="newmap">
  	     <form method="POST">
           <div>
	           <p><strong>思考表出マップ<br>新規作成</strong></p>
             <p><strong>マップ名を記入してください</strong></p>
    	       <p><input type="text" name="mapname" placeholder="マップ名"></p>
    	       <p><input class="button" type="submit" name="newmap" value="新規作成"></p>
           </div>
  	     </form>
       </div>

       <div class="select_sheet">
          <form method="POST">
  		        <div align="center">
  			          <strong>思考表出マップ リスト</strong>
  		        </div>
		          <div class="scr" align="left">
        			  <?php
                  showSheet();
                ?>
              </div>
    		      <div align="center">
        			  <input class="button1" type="submit" name="edit" value="編集する">
        			  <input class="button2" type="submit" name="delete" value="削除する">
              </div>
  	      </form>
        </div>
    </div>
    <!-- メインメニュー　finish -->

	</body>
</html>
