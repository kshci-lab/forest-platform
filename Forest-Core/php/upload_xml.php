<?php
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_FILES["xmlFile"])) {
    $file = $_FILES["xmlFile"];

    // アップロードされたファイルがXML形式か確認
    $fileType = pathinfo($file["name"], PATHINFO_EXTENSION);
    if ($fileType !== "xml") {
        die("Only XML files are allowed.");
    }

    // アップロードディレクトリに保存
    $uploadDir = "/Applications/MAMP/htdocs/psdss-masakado-shimizu-otsuki/text/";
    $uploadPath = $uploadDir . basename($file["name"]);
    $File_name = $file["name"];
    if (move_uploaded_file($file["tmp_name"], $uploadPath)) {
        echo "$File_name";
    } else {
        echo "同じ名前のファイルが存在しています．";
    }
}
?>
