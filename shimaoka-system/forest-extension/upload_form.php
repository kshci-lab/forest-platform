<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDFアップロード</title>
</head>
<body>
  <h2>PDFをアップロードして質問生成</h2>
  <form action="upload.php" method="POST" enctype="multipart/form-data">
    <input type="file" name="pdf_file" accept=".pdf" required>
    <button type="submit">アップロード</button>
  </form>
</body>
</html>
