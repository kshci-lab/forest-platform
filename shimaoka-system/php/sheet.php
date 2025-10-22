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

		$sql = "SELECT * FROM map_mode_link WHERE user_id = '$id' AND mode_id = 1 AND deleted = 0 ORDER BY updated_at DESC";

		if($result = $mysqli->query($sql)){
			while($row = mysqli_fetch_assoc($result)){
				echo"<p><label><input type='radio' name='map' value='".$row['map_id']."'>"  .$row['updated_at'].  "  "  .$row['name'].  "</label></p>";
			}

		}

	}

	/*select_sheet.phpからシートを新規作成する*/
	function createSheet(){

		require "connect_db.php";
		date_default_timezone_set('Asia/Tokyo');

		$_SESSION["MAPID"] = rand(); //ここでセッションが定義されているらしい
		$map_version = rand();	
		$map_mode_link = rand();
		$document_id = rand();
		$scenario_id = rand();
		$created_at = date("Y-m-d H:i:s");
		$deleted = 0;
		$mode_id = 1; //自己内対話モード

		//if($name == ""){

			$sql1 = "INSERT INTO maps (map_id, user_id, name, created_at, updated_at, deleted) 
				VALUES (".$_SESSION['MAPID'].", ".$_SESSION['USERID'].", '".$_POST['mapname']."', '".$created_at."', '".$created_at."', '".$deleted."')";			
			$sql2 = "INSERT INTO map_mode_links (id, map_id, mode_id) VALUES (".$map_mode_link.", ".$_SESSION['MAPID'].", ".$mode_id.")";
			
			if (!$result = $mysqli->query($sql1)) {
		      print('Error - SQLSTATE1'. mysqli_error($mysqli));
		      exit();
		    }
			if (!$result = $mysqli->query($sql2)) {
				print('Error - SQLSTATE2'. mysqli_error($mysqli));
				exit();
			}

			// //hatakeyama mapsにINSERTする.
			// $sql_m = "INSERT INTO maps (map_id, name, created_at, deleted_at, user_id) VALUES (".$_SESSION['MAPID'].", '".$_POST['mapname']."', '".$created_at."', NULL, ".$_SESSION['USERID'].")";
			// if (!$result = $mysqli->query($sql_m)) {
		    //   print('Error - SQLSTATE'. mysqli_error($link));
		    //   exit();
		    // }
			 
			$sql_mv = "INSERT INTO map_versions (map_version_id, map_id, name, appeared_at, disappeared_at) VALUES (".$map_version.", '".$_SESSION['MAPID']."', '".$_POST['mapname']."', '".$created_at."', NULL)";
			if (!$result = $mysqli->query($sql_mv)) {
				print('Error - SQLSTATE3'. mysqli_error($mysqli));
				exit();
			}

			$sql3 = "INSERT INTO document_titles (document_id, map_id, title, created_at, updated_at, deleted) VALUES (".$document_id.", ".$_SESSION['MAPID'].", NULL, '".$created_at."', '".$created_at."', 0)";
			
			if (!$result = $mysqli->query($sql3)) {
		      print('Error - SQLSTATE4'. mysqli_error($mysqli));
		      exit();
		    }

			$sql4 = "INSERT INTO scenario_titles (scenario_id, map_id, title, created_at, updated_at, deleted) VALUES (".$scenario_id.", ".$_SESSION['MAPID'].", NULL, '".$created_at."', '".$created_at."', 0)";
			
			if (!$result = $mysqli->query($sql4)) {
		      echo 'Error - SQLSTATE5'. mysqli_error($mysqli);
		      exit();
		    }

			header("Location: index.php");

		/*}else{

			echo "<script>alert('既に存在するシート名');</script>";
			header("Location: select_sheet.php");

		}*/

	}

	/*select_sheet.phpからシートを新規作成する*/
	//2022-11-24 shimizu
	//2024-10-07 使用なし
	function createDocument(){

		require "connect_db.php";
		date_default_timezone_set('Asia/Tokyo');

		$_SESSION["MAPID"] = rand();
		$map_version = rand();
		$created_at = date("Y-m-d H:i:s");
		$deleted = 0;

		$sql = "INSERT INTO documents (id, user_id, created_at, name, updated_at, deleted) VALUES (".$_SESSION['MAPID'].", ".$_SESSION['USERID'].", '".$created_at."', '".$_POST['mapname']."', '".$created_at."','".$deleted."')";
		if (!$result = $mysqli->query($sql)) {
			print('Error - SQLSTATE'. mysqli_error($link));
			exit();
		}
		
		// //hatakeyama mapsにINSERTする.
		// $sql_m = "INSERT INTO maps (map_id, name, created_at, deleted_at, user_id) VALUES (".$_SESSION['MAPID'].", '".$_POST['mapname']."', '".$created_at."', NULL, ".$_SESSION['USERID'].")";
		// if (!$result = $mysqli->query($sql_m)) {
		//   print('Error - SQLSTATE'. mysqli_error($link));
		//   exit();
		// }

		
		$sql_mv = "INSERT INTO map_versions (map_version_id, map_id, name, appeared_at, disappeared_at) VALUES (".$map_version.", '".$_SESSION['MAPID']."', '".$_POST['mapname']."', '".$created_at."', NULL)";
		if (!$result = $mysqli->query($sql_mv)) {
		  print('Error - SQLSTATE'. mysqli_error($link));
		  exit();
		}


		header("Location: index.php");

	}

	function deleteSheet(){
		require "connect_db.php";

		$deleted = 0;
		$updated_at = date("Y-m-d H:i:s");
		echo $_SESSION['MAPID'];

		//mapsのdeletedを1(削除されたもの)に
		$sql = "UPDATE maps SET deleted = 1 WHERE map_id = '".$_SESSION['MAPID']."' ";
		$result = $mysqli->query($sql);
		if (!$result) {
		     print('Error - SQLSTATE');
		     exit();
		 }

		//map_versionのdisappraedに入力
		$sql_mvd = "UPDATE map_versions SET disappeared_at = '".$updated_at."' WHERE map_id = ".$_SESSION['MAPID']." AND appeared_at = (select max(appeared_at) from (select appeared_at from map_versions) temp)";
		$result_mvd = $mysqli->query($sql_mvd);
		if (!$result_mvd) {
			print('Error - SQLSTATE');
			exit();
		}

		header("Location: select_sheet.php");

	}

	//2022-11-24 shimizu
	function deleteDocument(){
		require "connect_db.php";

		$deleted = 0;
		$updated_at = date("Y-m-d H:i:s");
		echo $_SESSION['MAPID'];
		$sql = "DELETE FROM documents WHERE id = ".$_SESSION['MAPID'];
		$result = $mysqli->query($sql);
		if (!$result) {
		     print('Error - SQLSTATE');
		     exit();
		 }
		 header("Location: select_sheet.php");

	}

// ==================================== matsuoka ==================================

	// index.phpで，ユーザのMT時間一覧を表示する
	function get_mttiming(){

		require "connect_db.php";

		$id = $_SESSION['USERID'];
	  $sql = " SELECT mt_time FROM mt_timing WHERE user_id = '$id' ORDER BY mt_time DESC";

		$array = array();

	  if($result = $mysqli->query($sql)) {
			// echo" <option value='null'>選択してください</option>";
	    while($row = mysqli_fetch_assoc($result)){
	     	echo" <option value='".$row['mt_time']."'>"  .$row['mt_time']. "</option>" ;
				array_push($array, $row['mt_time']); // あとで取り出せるように配列化
	    }
		}
		$_SESSION['last_mttime'] = $array[0]; // 前回のMTタイムをSESSIONで取り出せるように
	}

?>
