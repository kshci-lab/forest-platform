<?php
	/*index.phpでシート名を表示する*/
	function getMapname(){

		require "connect_db.php";

		$sql = "SELECT * FROM maps WHERE map_id = ".$_SESSION["MAPID"]."";

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				echo $row["name"];
				$_SESSION["mapname"] = $row["name"];


			}

		}

	}

	/*select_sheet.phpで既に作成済みのシートを表示する*/
	function showSheet(){

		require "connect_db.php";

		$id = $_SESSION['USERID'];

		$sql = "SELECT * FROM map_mode_link WHERE user_id = '$id' AND mode_id = 2 AND deleted = 0 ORDER BY updated_at DESC";

		if($result = $mysqli->query($sql)){
			while($row = mysqli_fetch_assoc($result)){
				echo"<p><label><input type='radio' name='map' value='".$row['map_id']."'>"  .$row['updated_at'].  "  "  .$row['name'].  "</label></p>";
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
				$_SESSION['paper_content'];
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


	/*select_sheet.phpから登録すみの論文を選択した際、シートを新規作成する*/
	function createSheet_selectedPaper(){
		
		// session_start();

		require "connect_db.php";
		date_default_timezone_set('Asia/Tokyo');

		$_SESSION["MAPID"] = rand();
		$created_at = date("Y-m-d H:i:s");
		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
		$deleted = 0;
		$paper_id = $_SESSION["PAPERID"];	
		$paper_content = $_SESSION["paper_content"]; //nishida
		$map_mode_link = rand();
		$map_version = rand();
		$mode_id = 2; //論文読解モード

	
		//if($name == ""){

			$sql1 = "INSERT INTO maps (map_id, user_id, name, paper_id, created_at, updated_at, deleted) 
				VALUES (".$_SESSION['MAPID'].", ".$_SESSION['USERID'].", '".$_POST['mapname']."', '".$paper_id."', '".$created_at."', '".$created_at."','".$deleted."')";			
			$sql2 = "INSERT INTO map_mode_links (id, map_id, mode_id) VALUES (".$map_mode_link.", ".$_SESSION['MAPID'].", ".$mode_id.")";

			$result1 = $mysqli->query($sql1);
			if (!$result1) {
		      print('Error - SQLSTATE1 map');
		      exit();
		    }

			$result2 = $mysqli->query($sql2);
			if (!$result2) {
				print('Error - SQLSTATE2 map mode link');
				exit();
			}

			$sql_mv = "INSERT INTO map_versions (map_version_id, map_id, name, appeared_at, disappeared_at) VALUES (".$map_version.", '".$_SESSION['MAPID']."', '".$_POST['mapname']."', '".$created_at."', NULL)";
			if (!$result = $mysqli->query($sql_mv)) {
				print('Error - SQLSTATE3 map version');
				exit();
			}

			header("Location: index.php");


	}



	function deleteSheet(){
		require "connect_db.php";

		$deleted = 0;
		$updated_at = date("Y-m-d H:i:s");
		echo $_SESSION['MAPID'];
		$sql = "UPDATE maps SET delete = 1 WHERE map_id = ".$_SESSION['MAPID']." ";
		$result = $mysqli->query($sql);
		if (!$result) {
		     print('Error - SQLSTATE map update');
		     exit();
		 }

		 $sql_mvd = "UPDATE map_versions SET disappeared_at = '".$updated_at."' WHERE map_id = ".$_SESSION['MAPID']." AND appeared_at = (select max(appeared_at) from (select appeared_at from map_versions) temp)";
		$result_mvd = $mysqli->query($sql_mvd);
		if (!$result_mvd) {
			print('Error - SQLSTATE map version');
			exit();
		}

		 header("Location: select_sheet.php");

	}


	function deletePaper(){
		require "connect_db.php";

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
	$paper_id = $_SESSION["PAPERID"];
	// $paper_id = 15161151;
	$sql = "SELECT * FROM map_mode_link WHERE paper_id = '$paper_id' AND mode_id = 2 ORDER BY updated_at DESC";
	$array = array();
	$result = $mysqli->query($sql);
	if($result == TRUE){
		echo" <option value='null'>ユーザを選択してください</option>";
		while($row = mysqli_fetch_assoc($result)){
			$map_id = $row['map_id'];
			$user_id = $row['user_id'] ;
			$user_sql = "SELECT name FROM users WHERE user_id = $user_id ";
			$result_user_name = $mysqli->query($user_sql);
			$data_user_name = mysqli_fetch_assoc($result_user_name);
			$user_name = $data_user_name['name'];

			// echo"<option name='user' value='".$row['user_id']."'>"  .$row['updated_at'].    "</option>";
			echo"<option name='user' value='".$row['user_id']."'>"  .$row['updated_at'].  "  "  .$user_name.  "</option>";
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
