<?php
// session_start();

// /*ノード情報をDBに格納する際に使用*/
// require("connect_db.php");

// //タイムゾーンの設定
// date_default_timezone_set('Asia/Tokyo');
// $image_id = uniqid();
// $user_id = $_SESSION['USERID'];      //ユーザID
// $map_id = $_SESSION['MAPID'];    //シートID
// $slide_id = $_POST["slide_id"];             //スライドID
// $type = $_POST["type"];                 //ノードのタイプ
// $activity_id = uniqid();

// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

// // 画像を保存
// if (!empty($_FILES['image']['name'])) {
//     $name = $_FILES['image']['name'];
//     $type = $_FILES['image']['type'];
//     $content = file_get_contents($_FILES['image']['tmp_name']);
//     $size = $_FILES['image']['size'];

//     $sql = "INSERT INTO images(image_id, image_name, image_type, image_content, image_size, user_id, map_id, created_at,)
//             VALUES ('$image_id', :image_name, :image_type, :image_content, :image_size, '$user_id', '$map_id' , now())";
//     $stmt = $pdo->prepare($sql);
//     $stmt->bindValue(':image_name', $name, PDO::PARAM_STR);
//     $stmt->bindValue(':image_type', $type, PDO::PARAM_STR);
//     $stmt->bindValue(':image_content', $content, PDO::PARAM_STR);
//     $stmt->bindValue(':image_size', $size, PDO::PARAM_INT);
//     $stmt->execute();
// }
// //header('Location:index.php');
// exit();
?>
