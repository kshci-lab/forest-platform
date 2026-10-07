<?php

header('Content-Type: application/json; charset=UTF-8');
session_start();

require_once __DIR__ . '/connect_db.php';
require_once __DIR__ . '/ok_core_bridge.php';

if (!isset($_SESSION['USERID'])) {
    http_response_code(401);
    echo json_encode(array('status' => 'error', 'message' => 'not logged in', 'groups' => array()));
    exit;
}

$result = ok_core_get_user_groups($mysqli, (int)$_SESSION['USERID']);
echo json_encode($result);

?>
