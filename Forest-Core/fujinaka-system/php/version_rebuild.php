<?php

	session_start();

	require("connect_db.php");

	$id = $_POST["version_id"];

	if ($_POST["val"] == "area"){

		$sql = "SELECT version_id, user_name, paper_title, paper_content, created_at FROM versions ORDER BY created_at DESC";

		$data = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$data[] = array(
					'id' => $row["version_id"],
					'user' => $row["user_name"],
					'title'=> $row["paper_title"],
					'content' => $row["paper_content"],
					'time' => $row["created_at"]
				);
			}
		}

		echo json_encode($data);

	} else if($_POST["val"] == "map"){

		//map復元

		$sql = "SELECT * FROM version_nodes WHERE version_id = '$id' ORDER BY created_at asc";

		$mdata = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$mdata[] = array(
					'id' => $row["node_id"],
					'concept_id'=> $row["concept_id"],
					'content' => $row["content"],
					'type' => $row["type"],
					'parent_id' => $row["parent_id"]				
				);
			}
		}

		echo json_encode($mdata);

	} else if($_POST["val"] == "chapter"){

		//chapter復元

		$sql = "SELECT chapter_id, title, rank FROM version_chapter WHERE version_id='$id'";
		$cdata = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$cdata[] = array(
					'id' => $row["chapter_id"],
					'title'=> $row["title"],
					'rank' => $row["rank"],
				);
			}
		}

		echo json_encode($cdata);

	} else if($_POST["val"] == "section"){

		//section復元

		$sql = "SELECT section_id, chapter_id, title, rank FROM version_section WHERE version_id='$id'";
		
		$sdata = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$sdata[] = array(
					'id' => $row["section_id"],
					'chapter_id' => $row["chapter_id"],
					'title'=> $row["title"],
					'rank' => $row["rank"],
				);
			}
		}

		echo json_encode($sdata);		

	} else if($_POST["val"] == "paragraph"){

		//paragraph復元

		$sql = "SELECT paragraph_id, section_id, title, rank, content FROM version_paragraph WHERE version_id='$id'";

		$pdata = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$pdata[] = array(
				'id'=> $row["paragraph_id"],
				'section_id' => $row["section_id"],
				'title' => $row["title"],
				'rank'=> $row["rank"],
				'content' => $row["content"]);
			}
		}

		echo json_encode($pdata);

	} else if($_POST["val"] == "content"){

		$sql = "SELECT content_id, node_id, concept_id, rank, content, paragraph_id, type, indent FROM version_content_rank WHERE version_id='$id'";

		$condata = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$condata[] = array(
				'content_id'=> $row["content_id"],
				'node_id'=> $row["node_id"],
				'concept_id'=> $row["concept_id"],
				'rank' => $row["rank"],
				'content' => $row["content"],
				'paragraph_id'=> $row["paragraph_id"],
				'type'=> $row["type"],
				'indent'=> $row["indent"]);
			}
		}

		echo json_encode($condata);

	} else if($_POST["val"] == "feedback"){

	$sql = "SELECT node_id, content, feedback_status FROM version_feedback WHERE version_id='$id'";

		$feedbacks = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$feedbacks[] = array(
				'node_id'=> $row["node_id"],
				'content' => $row["content"],
				'feedback_status'=> $row["feedback_status"]);
			}
		}

		echo json_encode($feedbacks);	

	} else if($_POST["val"] == "my_comment"){
		
		$user_id = $_SESSION['USERID'];

		$sql = "SELECT comment_id, content FROM comment WHERE version_id='$id' AND user_id='$user_id' AND comment_status != 0 ORDER BY created_at asc";

		$mycomments = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$mycomments[] = array(
				'id'=> $row["comment_id"],
				'content' => $row["content"]);
			}
		}

		echo json_encode($mycomments);

	} else if($_POST["val"] == "others_comment"){

		$user_id = $_SESSION['USERID'];

		$sql = "SELECT comment_id, user_name, content FROM comment WHERE version_id='$id' AND user_id!='$user_id' AND comment_status != 0 ORDER BY created_at asc";

		$otcomments = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){
				$otcomments[] = array(
				'id'=> $row["comment_id"],
				'user_name'=> $row["user_name"],
				'content' => $row["content"]);
			}
		}

		echo json_encode($otcomments);

	} else if($_POST["val"] == "annotation"){

		$sql = "SELECT id, start_char_id, end_char_id, type, content, comment_id  FROM paper_annotations 
        WHERE deleted=0 and version_id='$id' 
        ORDER BY 'created_at' DESC";

		$annos = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$annos[] = array(
				'id'=> $row["id"],
				'start_char_id'=> (int)$row["start_char_id"],
				'end_char_id'=> (int)$row["end_char_id"],
				'type' => $row["type"],
				'comment_id' => $row["comment_id"],
				'content' => $row["content"]);
			}
		}

		echo json_encode($annos);

	}  else if($_POST["val"] == "infuence"){

		$node_id = $_POST["node_id"];

		$sql = "SELECT content  FROM version_content_rank
        WHERE nodeid = '$node_id' and version_id='$id'";

		$n_content = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$n_content[] = array(
				'content' => $row["content"]);
			}
		}

		echo json_encode($n_content);
	}


?>
