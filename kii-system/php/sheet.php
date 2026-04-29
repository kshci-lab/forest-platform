<?php
	/*index.phpでシート名を表示する*/
	function getSheetname(){

		require "connect_db.php";

		if (!isset($_SESSION["SHEETID"]) || !is_numeric($_SESSION["SHEETID"])) {
			return;
		}

		$sql = "SELECT * FROM sheets WHERE id = ".$_SESSION["SHEETID"];

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				echo $row["name"];
				$_SESSION["SHEETNAME"] = $row["name"];


			}

		}

	}

	/*select_sheet.phpで既に作成済みのシートを表示する*/
	function showSheet(){

		require "connect_db.php";

		$id = $_SESSION['USERID'];
		$sql = "SELECT * FROM sheets WHERE user_id = '$id' ORDER BY updated_at DESC";
		if($result = $mysqli->query($sql)){
			while($row = mysqli_fetch_assoc($result)){
				echo"<p><label><input type='radio' name='sheet' value='".$row['id']."'>"  .$row['updated_at'].  "  "  .$row['name'].  "</label></p>";
			}

		}

	}


		/*select_sheet.phpで既に登録済みの論文を表示する*/
		function showPapers(){

			require "connect_db.php";

			$sql = "SELECT * FROM papers  ORDER BY created_at DESC";
			if($result = $mysqli->query($sql)){
				while($row = mysqli_fetch_assoc($result)){
					echo"<p><label><input type='radio' name='paper' value='".$row['id']."'>"  .$row['created_at'].  "  "  .$row['paper_title'].  "</label></p>";
				}
	
			}
	
		}


	// function show_paper_preview(){
	// 	require "connect_db.php";

	// 	$paper_content= $_SESSION["paper_content"];

	// 	$sql = "SELECT paper_content FROM papers WHERE id=$paper_id"; /* and user_id=${user_id} */

	// 	$result = $mysqli->query($sql);
	// 	$data = mysqli_fetch_assoc($result);

	// 	echo $data['paper_content'];

	// }　　なんで？
		
	function createSheet_Paper(){

	}
	/*select_sheet.phpからシートを新規作成する*/
	function createSheet(){
		
		session_start();

		require "connect_db.php";
		date_default_timezone_set('Asia/Tokyo');

		$_SESSION["SHEETID"] = rand();
		$created_at = date("Y-m-d H:i:s");
		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
		$deleted = 0;
		$paper_id = rand();
		
		// $paper_content = "asdgan"; //nishida
		$paper_content = $_SESSION["paper_content"]; //nishida
  
		$sql2 = "INSERT INTO papers (id,paper_content,created_at,paper_title)
		VALUES ('$paper_id','$paper_content','$timestamp', '".$_POST['paper_title']."')";
	
	
	
		$result2 = $mysqli->query($sql2);
		//クエリ($sql)のエラー処理
		if($sql2 == TRUE){
			echo "true";
			echo "$paper_id";
			// error_log('$paper_sql成功しています！'.$, 0);
		}else if($sql2 == FALSE){
			// error_log($sql.'$paper_sql失敗です', 0);
			error_log('失敗しました。'.mysqli_error($link), 0);
		}else{
			// error_log('paper_$sql不明なエラーです', 0);
		}
	
	//php($result)のエラー処理
	if($result2 == TRUE){
			echo "true";
			error_log('$result成功しています！'.$timestamp, 0);
		}else if($result2 == FALSE){
	  echo "false";
			error_log($result2.'$result失敗です'.$mysqli->error, "3", "error_log.txt");
			// error_log('失敗しました。'.mysqli_error($link), 0);
		}else{
			error_log('$result不明なエラーです', 0);
		}
	
		//if($name == ""){

			$sql = "INSERT INTO sheets (id, user_id, created_at, name, updated_at, deleted, paper_id) 
			VALUES (".$_SESSION['SHEETID'].", ".$_SESSION['USERID'].", '".$created_at."', '".$_POST['sheetname']."', '".$created_at."','".$deleted."','$paper_id')";
			if (!$result = $mysqli->query($sql)) {
		      print('Error - SQLSTATE'. mysqli_error($link));
		      exit();
		    }

			header("Location: index.php");

	

			
		/*}else{

			echo "<script>alert('既に存在するシート名');</script>";
			header("Location: select_sheet.php");

		}*/

	}


	/*select_sheet.phpから登録すみの論文を選択した際、シートを新規作成する*/
	function createSheet_selectedPaper(){
		
		session_start();

		require "connect_db.php";
		date_default_timezone_set('Asia/Tokyo');

		$_SESSION["SHEETID"] = rand();
		$created_at = date("Y-m-d H:i:s");
		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
		$deleted = 0;
		$paper_id = $_SESSION["PAPERID"];	
		$paper_content = $_SESSION["paper_content"]; //nishida

	
		//if($name == ""){

			$sql = "INSERT INTO sheets (id, user_id, created_at, name, updated_at, deleted, paper_id) 
			VALUES (".$_SESSION['SHEETID'].", ".$_SESSION['USERID'].", '".$created_at."', '".$_POST['sheetname']."', '".$created_at."','".$deleted."','$paper_id')";
			if (!$result = $mysqli->query($sql)) {
		      print('Error - SQLSTATE'. mysqli_error($link));
		      exit();
		    }

			header("Location: index.php");


	}



	function deleteSheet(){
		require "connect_db.php";

		$deleted = 0;
		$updated_at = date("Y-m-d H:i:s");
		echo $_SESSION['SHEETID'];
		$sql = "DELETE FROM sheets WHERE id = ".$_SESSION['SHEETID'];
		$result = $mysqli->query($sql);
		if (!$result) {
		     print('Error - SQLSTATE');
		     exit();
		 }
		 header("Location: select_sheet.php");

	}


	function deletePaper(){
		require "connect_db.php";

		$deleted = 0;
		$updated_at = date("Y-m-d H:i:s");
		echo $_SESSION['PAPERID'];
		$sql = "DELETE FROM papers WHERE id = ".$_SESSION['PAPERID'];
		$result = $mysqli->query($sql);
		if (!$result) {
		     print('Error - SQLSTATE');
		     exit();
		 }
		//  header("Location: select_sheet.php");

	}

// ==================================== matsuoka ==================================

// index.phpで，ユーザのMT時間一覧を表示する
function get_mttiming(){

	require "connect_db.php";

	$id = $_SESSION['USERID'];
  $sql = " SELECT mt_time FROM mt_timing WHERE user_id = '$id' ORDER BY mt_time DESC";

	$array = array();

  if($result = $mysqli->query($sql)) {
		echo" <option value='null'>選択してください</option>";
	while($row = mysqli_fetch_assoc($result)){
		 echo" <option value='".$row['mt_time']."'>"  .$row['mt_time']. "</option>" ;
			array_push($array, $row['mt_time']); // あとで取り出せるように配列化
	}
	}
	$_SESSION['last_mttime'] = $array[0]; // 前回のMTタイムをSESSIONで取り出せるように
}


/*select_sheet.phpで既に作成済みのシートを表示する*/
function show_user(){

	require "connect_db.php";
	// nishida 実験用後で直す
	// $paper_id = $_SESSION["PAPERID"];
	$paper_id = 15161151;
	$sql = "SELECT * FROM sheets WHERE paper_id = '$paper_id' ORDER BY updated_at DESC";
	$array = array();
	$result = $mysqli->query($sql);
	if($result == TRUE){
		echo" <option value='null'>ユーザを選択してください</option>";
		while($row = mysqli_fetch_assoc($result)){
			$sheet_id = $row['id'];
			$user_id = $row['user_id'] ;
			$user_sql = "SELECT name FROM users WHERE id = $user_id ";
			$result_user_name = $mysqli->query($user_sql);
			$data_user_name = mysqli_fetch_assoc($result_user_name);
			$user_name = $data_user_name['name'];

			// echo"<option name='user' value='".$row['user_id']."'>"  .$row['updated_at'].    "</option>";
			echo"<option name='user' value='".$row['id']."'>"  .$row['updated_at'].  "  "  .$user_name.  "</option>";
			// echo"<option name='user' value='".$row['id']."+","+.$user_name.'>"  .$row['updated_at'].  "  "  .$user_name.  "</option>";  // https://qiita.com/Jun01t/items/dc3f5be9a399bbe336d9
			array_push($array, $user_name); // あとで取り出せるように配列化

		}
// post[user] edit 
	}else if($result == FALSE){
		  echo "false";
				error_log($result.'$result失敗です'.$mysqli->error, "3", "error_log.txt");
				// error_log('失敗しました。'.mysqli_error($link), 0);
			}else{
				error_log('$result不明なエラーです', 0);
			}

}


?>
