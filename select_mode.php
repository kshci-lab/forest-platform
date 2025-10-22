<?php

session_start();
require("php/connect_db.php");

$mt_time_message = "";

// ログイン状態のチェック
if (!isset($_SESSION["USERID"])) {
  echo 2;
  header("Location: logout.php");
  exit;
}

if (isset($_POST["logout"])) {
  header("Location: logout.php");
  exit;
}

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
	<head>
		<meta charset="UTF-8">
		<title>自己内対話活性化支援システム</title>
		<link rel="stylesheet" type="text/css" href="css/item.css">
		<link rel="stylesheet" type="text/css" href="css/font.css">
		<link rel="stylesheet" type="text/css" href="css/jquery.cleditor.css">
		<link rel="stylesheet" type="text/css" href="css/ui.css">
		<link rel="stylesheet" type="text/css" href="css/select_sheet.css">
    <link rel="stylesheet" href="css/Semantic-UI/semantic.css">
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
    </div>
    <!--サイドメニュー　finish-->

    <!-- メインメニュー　start -->
    <div id="main_menu">
    <h3>思考表出マップ</h3>
       <div class="select_sheet2">
          <form method="POST">
  		        <div align="center">
  			          <strong>思考表出マップ リスト</strong>
  		        </div>
		          <div class="scr" align="left">
                <form name="form1">
                  <input type="radio" name="selectmode" value=1 checked>自己内対話モード<br>
                  <input type="radio" name="selectmode" value=2>論文読解モード<br>
                  <input type="radio" name="selectmode" value=3>論文添削モード<br>
                  <input type="radio" name="selectmode" value=4>議論内省モード<br>
                </form>
              </div>
    		      <div align="center">
        			  <input type="button" id="selectmodebutton" value="選択する">
              </div>
  	      </form>
        </div>
    </div>
    <!-- メインメニュー　finish -->

	</body>
  <script type="text/javascript" src="js/select_mode.js"></script>
</html>


