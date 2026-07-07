<?php
session_start();

$errorMessage = "";
if (!empty($_SESSION['SSO_ERROR'])) {
  $errorMessage = $_SESSION['SSO_ERROR'];
  unset($_SESSION['SSO_ERROR']);
}

if ($errorMessage === 'SSO dependencies are not installed. Run composer install in the project root.'
    && file_exists(__DIR__ . '/vendor/autoload.php')) {
  $errorMessage = "";
}

if ($errorMessage === "") {
  header("Location: auth/login.php");
  exit;
}
?>
<!doctype html>
<html>
  <head>
  <meta charset="UTF-8">
  <title>自己内対話活性化支援システム</title>
  <link rel="stylesheet" type="text/css" href="css/login.css">
  </head>
  <body>

  <div class="form-wrapper">
  <h1>Login</h1>
  <div><?php echo htmlspecialchars($errorMessage, ENT_QUOTES); ?></div>
  <div class="button-panel">
    <input type="button" class="button" value="Retry HCIMLab SSO Login" onClick="location.href='auth/login.php'">
  </div>
</div>
</html>
