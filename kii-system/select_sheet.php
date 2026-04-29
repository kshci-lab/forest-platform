<?php

session_start();
require("php/connect_db.php");
require_once("php/sheet.php");

$mt_time_message = "";

// ログイン状態のチェック
if (!isset($_SESSION["USERID"])) {
  header("Location: logout.php");
  exit;
}

if (isset($_POST["logout"])) {
  header("Location: logout.php");
  exit;
}


//登録済み論文選択
if(isset($_POST["paper"])){
    
  $_SESSION["PAPERID"] = $_POST["paper"];


	if(isset($_POST["select_paper"])){

		// header("Location: index.php");
    // $_SESSION["paper_content"] = $_POST["paper_content"]; //nishida

    // show_paper_preview();
    if(isset($_POST["sheetname"])){
      if($_POST["sheetname"] != "" ){
        createSheet_selectedPaper();
    
      }else{
    
        echo "<script>alert('シート名または登録済みの論文を選択してください');</script>";
    
      }
    }


	}else{

		deletePaper();

	}

}


//新規作成
if(isset($_POST["sheetname"])){

	// if($_POST["sheetname"] != "" & $_POST["paper_title"] != ""){
	// 	createSheet();

  // }else
  if($_POST["sheetname"] != "" && !empty($_SESSION["PAPERID"])){
    createSheet_selectedPaper();
  }
  else{
    echo "<script>alert('シート名または論文タイトルを記入してください');</script>";
  }

}



//シート編集
if(isset($_POST["sheet"])){

  $_SESSION["SHEETID"] = $_POST["sheet"];
  // get_paper_id();  
  // paper_idを選ばれたsheetidから求めてsessionに指定しないと, 他者のマップ選択する際に

	if(isset($_POST["edit"])){

		header("Location: index.php");

	}else{

		deleteSheet();

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
		<title>論文読解支援システム</title>
		<link rel="stylesheet" type="text/css" href="css/item.css">
		<link rel="stylesheet" type="text/css" href="css/font.css">
		<link rel="stylesheet" type="text/css" href="css/jquery.cleditor.css">
		<link rel="stylesheet" type="text/css" href="css/ui.css">
		<link rel="stylesheet" type="text/css" href="css/select_sheet.css">
    <link rel="stylesheet" href="css/Semantic-UI/semantic.css">

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
        <div align="center">
        論文のプレビュー
        </div>
        <div id="paper_area">
            <?php
            // show_paper_preview(); なんで？？
            ?>
        </div>

    </div>
    <!--サイドメニュー　finish-->

    <!-- メインメニュー　start -->
    <div id="main_menu">
    <h3>思考表出マップ</h3>

       <div class="newsheet">
  	     <form method="POST">
           <div>
	           <p><strong>思考表出マップ<br>新規作成</strong></p>
             <p><strong>マップ名を記入してください</strong></p>
    	       <p><input type="text" name="sheetname" placeholder="マップ名"></p>
             <!-- <strong><strong>論文を選択してください</strong></p> -->
             <!-- <p><input type="file" value="【テキストファイルを選択】" onclick="InputFile()" id="input_file"></p> -->
    	       <!-- <p><input type="text" name="paper_title" placeholder="論文のタイトル"></p> -->
             <!-- <strong><strong>または</strong></p> -->
             <div class="checkbox">
                <input type="checkbox" id="checkbox" class="checkbox" name="check" onclick="CheckClick_paper()">
                <label for="checkbox" data-on-label="On" data-off-label="Off"></label>
                <span class="checkbox_paper">【登録済み論文を選ぶ】</span>
              </div>
              <p>
                <span class="paper_title">選択した論文</span>
                 <?php echo isset($_SESSION["PAPERID"]) ? htmlspecialchars((string)$_SESSION["PAPERID"], ENT_QUOTES, "UTF-8") : ""; ?>
              </p>
              
    	       <!-- <p><input class="button2"  name="paper" value="登録済みの論文" onclick="CreateSheet()" id="create_sheet"></p> -->
    	       <p><input class="button" type="submit" name="newsheet" value="新規作成"  id="create_sheet"></p>
             <div>
              <p><strong>新しい論文をDBに登録</strong></p>
              <p>HTMLファイルを選択</p>
              <p><input type="file" value="【テキストファイルを選択】"  id="input_htmlfile"></p>
              <!-- <p><input type="text" id="paper_read_area"></p> -->
              <div id ="paper_read_area"></div>
              <p><input type="text" name="paper_title" placeholder="論文のタイトル"></p>
              <p><input class="button" type="button" name="newsheet" value="新規登録"  id="create_sheet"></p>
              
          </div>
           </div>
  	     </form>
       </div>
       <!-- マップメニュー -->
       <div class="select_sheet">
        <form method="POST">
  		      <div align="center">
  			        <strong>思考表出マップ　リスト</strong>
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
       <!-- 論文メニュー -->
       <div class="select_paper">
        <form method="POST">
  		      <div align="center">
  			        <strong>論文リスト</strong>
  		     </div>
		       <div class="scr" align="left">
        			<?php
                      showPapers();
              ?>
           </div>
    		     <div align="center">
        			<input class="button1" type="submit" name="select_paper" value="選択する">
        			<input class="button2" type="submit" name="delete" value="削除する">
           </div>
  	    </form>
       </div>
    </div>
    <!-- メインメニュー　finish -->
    <script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
		<script type="text/javascript" src="js/jquery-ui.min.js"></script>
    <script type="text/javascript" src="js/paper.js"></script>
    <script type="text/javascript" src="js/paper_load.js"></script>

 

	</body>
</html>
