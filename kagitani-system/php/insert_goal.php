<?php
require_once('../../php/connect_db.php');

$map_id = $_SESSION['MAPID']; 

$start_date = $_POST['start_date'] ?? date('Y-m-d');
$finish_date = $_POST['finish_date'] ?? date('Y-m-d');
$appeared_at = $_POST['appeared_at'] ?? date('Y-m-d H:i:s');
$update_at = date('Y-m-d H:i:s');
$delete = 0;

$sql = "INSERT INTO object_journals (MAPID, start_date, finish_date, appeared_at, update_at, delete)
        VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $mysqli->prepare($sql);
$stmt->bind_param('isssss', $map_id, $start_date, $finish_date, $appeared_at, $update_at, $delete);
if ($stmt->execute()) {
    echo 'OK';
} else {
    echo 'NG';
}
$stmt->close();
$mysqli->close();
?>
