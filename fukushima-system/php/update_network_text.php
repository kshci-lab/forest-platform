<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
	$purpose = $_POST['purpose'];  //テキストの合体(union)，ネットワークに移動したとき(network_on)
	$network_text_id = $_POST['area_id'];   //(ネットワークに移動したor合体によって残るされる)エリアID
	$delete_network_text_id = $_POST['delete_id']; //合体によって削除されるエリアID
	$content = $_POST['content'];  //合体させる場合の合体後の発言内容

	// discussion_utterances を直接更新する方式に変更
	if($purpose === 'network_on'){
		// ネットワークに移動したときの処理（該当発話の network_on を 1 に）
		$stmt = $mysqli->prepare("UPDATE discussion_utterances SET network_on = 1 WHERE utterance_id = ?");
		if ($stmt) {
			$stmt->bind_param('i', $network_text_id); // 互換のため変数名は旧称だが、今は utterance_id
			$stmt->execute();
			$stmt->close();
		}
	}else if($purpose === 'union'){
		// 合体したときの処理（残す方の content を更新し、もう一方を削除）
		if ($content !== null && $content !== '') {
			$stmt1 = $mysqli->prepare("UPDATE discussion_utterances SET content = ? WHERE utterance_id = ?");
			if ($stmt1) {
				$stmt1->bind_param('si', $content, $network_text_id); // 残す方
				$stmt1->execute();
				$stmt1->close();
			}
		}
		if ($delete_network_text_id !== null && $delete_network_text_id !== '') {
			$stmt2 = $mysqli->prepare("DELETE FROM discussion_utterances WHERE utterance_id = ?");
			if ($stmt2) {
				$stmt2->bind_param('i', $delete_network_text_id);
				$stmt2->execute();
				$stmt2->close();
			}
		}
	}
?>
