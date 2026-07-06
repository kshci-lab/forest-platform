<?php

require_once("connect_db.php");

$username = $_GET['username'];

$sql = "SELECT DISTINCT name FROM users WHERE name = '$username' ";

$names = array();

if($result = $mysqli->query($sql)){

  while($row = mysqli_fetch_assoc($result)){

    array_push($names, $row['name']);

  }
  echo count($names);
}

?>
