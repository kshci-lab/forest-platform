<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$updated_at = date("Y-m-d H:i:s");

	if($_POST["update"] == "content"){

		if($id != "root"){

			$sql = "UPDATE nodes SET content = '".$_POST['content']."', updated_at = '".$updated_at."' WHERE id = '".$_POST['id']."'";
			$result = $mysqli->query($sql);

		}else{
			$sql = "UPDATE nodes SET content = '".$_POST['content']."', updated_at = '".$updated_at."' WHERE type = 'root' AND sheet_id = ".$_SESSION['SHEETID'];
			$result = $mysqli->query($sql);
			if(!$result){
				echo "error";
			}

		}

	}else if($_POST["update"] == "parent"){
		$sql = "UPDATE nodes SET parent_id = '".$_POST['parent_id']."', concept_id = '".$_POST['concept_id']."', updated_at = '".$updated_at."' WHERE id = '".$_POST['id']."'";
		$result = $mysqli->query($sql);

	}else if($_POST["update"] == "delete"){
		$deleted = 1;

		$sql = "UPDATE nodes SET updated_at = '".$updated_at."', deleted = '".$deleted."' WHERE id = '".$_POST['id']."'";
		$result = $mysqli->query($sql);

	}else if($_POST["update"] == "sheet"){

		// $sql = "UPDATE sheets SET updated_at = '".$updated_at."' WHERE id = '".$_POST['id']."'";
		$sql = "UPDATE sheets SET updated_at = '".$updated_at."' WHERE id = '".$_SESSION['SHEETID']."'";
		$result = $mysqli->query($sql);

	}else if($_POST["update"] == "edit_reason"){

		$sql = "UPDATE edit_reason SET updated_at = '".$updated_at."', content = '".$_POST['content']."' WHERE node_id = '".$_POST['node_id']."'";
		$result = $mysqli->query($sql);

	}else if($_POST["update"] == "return"){

		$deleted = 0;

		$sql = "UPDATE nodes SET updated_at = '".$updated_at."', deleted = '".$deleted."' WHERE id = '".$_POST['id']."'";

		$i = 0;
		$updated_array = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$updated_array = $updated_array + array($i=>$row["id"]);

				$i += 1;

			}

		}

	}else if($_POST["update"] == "content_from_logic"){

		// jm.createNodeFromLogic関数で論理ネットワークからの内容を既存ノードに反映
		if(isset($_POST['id']) && isset($_POST['content'])){
			
			$node_id = $_POST['id'];
			$new_content = $_POST['content'];
			
			// 既存ノードのコンテンツを更新
			if($node_id != "root"){
				$sql = "UPDATE nodes SET content = '".$new_content."', updated_at = '".$updated_at."' WHERE id = '".$node_id."'";
			} else {
				$sql = "UPDATE nodes SET content = '".$new_content."', updated_at = '".$updated_at."' WHERE type = 'root' AND sheet_id = ".$_SESSION['SHEETID'];
			}
			
			$result = $mysqli->query($sql);
			
			if(!$result){
				echo "error: failed to update node content from logic";
			} else {
				echo "success: node content updated from logic network";
			}
		} else {
			echo "error: missing required parameters (id, content)";
		}

	}

?>
