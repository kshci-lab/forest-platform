<?php

session_start();

require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');
$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

function encode_non_bmp_chars_as_entities($value) {
	return preg_replace_callback('/[\x{10000}-\x{10FFFF}]/u', function ($matches) {
		$char = $matches[0];
		if (function_exists('mb_ord')) {
			$codepoint = mb_ord($char, 'UTF-8');
		} else {
			$u32 = mb_convert_encoding($char, 'UCS-4BE', 'UTF-8');
			$codepoint = unpack('N', $u32)[1];
		}

		return '&#x' . strtoupper(dechex($codepoint)) . ';';
	}, $value);
}

if (!isset($_POST["id"], $_POST["content"], $_POST["paper_title"])) {
	http_response_code(400);
	exit("required parameters are missing");
}

$id = (int)$_POST["id"];
$content = encode_non_bmp_chars_as_entities($_POST["content"]);
$paper_title = encode_non_bmp_chars_as_entities($_POST["paper_title"]);

$stmt = $mysqli->prepare("INSERT INTO papers (id, paper_content, created_at, paper_title) VALUES (?, ?, ?, ?)");
if ($stmt === false) {
	http_response_code(500);
	exit("prepare failed: " . $mysqli->error);
}

$stmt->bind_param("isss", $id, $content, $timestamp, $paper_title);

if ($stmt->execute() === false) {
	http_response_code(500);
	exit("execute failed: " . $stmt->error);
}

echo "ok";
$stmt->close();

?>
