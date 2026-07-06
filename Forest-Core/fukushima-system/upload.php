<?php

require("php/function.php");

$pdo = connectDB_Test();

if (!empty($_FILES['ImageFile']['name'])) {
    $uuid = uniqid();
    $content = file_get_contents($_FILES['ImageFile']['tmp_name']);
    $name = $_FILES['ImageFile']['name'];
    $type = $_FILES['ImageFile']['type'];
    $size = $_FILES['ImageFile']['size'];
    $createdAt = date('Y-m-d H:i:s');

    $sql = "INSERT INTO images(image_id, image_name, image_type, image_content, image_size, created_at)
            VALUES ('$uuid', :image_name, :image_type, :image_content, :image_size, :created_at)";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':image_name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':image_type', $type, PDO::PARAM_STR);
    $stmt->bindValue(':image_content', $content, PDO::PARAM_STR);
    $stmt->bindValue(':image_size', $size, PDO::PARAM_INT);
    $stmt->bindParam(':created_at', $createdAt);
    $stmt->execute();
  }

?>