<?php
session_start();

require("connect_db.php");
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION["MAPID"]) || $_SESSION["MAPID"] === '') {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Map is not selected.'));
    exit;
}

$map_id = (int)$_SESSION["MAPID"];
$action = isset($_POST['action']) ? $_POST['action'] : 'save';

if ($action === 'get') {
    $stmt = $mysqli->prepare(
        "SELECT rq, e_1_strong, e_1_weak, e_2_strong, e_2_weak,
                e_3_strong, e_3_weak, summary
         FROM paper_summaries
         WHERE map_id = ?"
    );

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(array('success' => false, 'error' => $mysqli->error));
        exit;
    }

    $stmt->bind_param('i', $map_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $summary = $result->fetch_assoc();
    $stmt->close();

    echo json_encode(array('success' => true, 'summary' => $summary));
    exit;
}

$rq = isset($_POST['rq']) ? trim($_POST['rq']) : '';
$e_1_strong = isset($_POST['e1Strong']) ? trim($_POST['e1Strong']) : '';
$e_1_weak = isset($_POST['e1Weak']) ? trim($_POST['e1Weak']) : '';
$e_2_strong = isset($_POST['e2Strong']) ? trim($_POST['e2Strong']) : '';
$e_2_weak = isset($_POST['e2Weak']) ? trim($_POST['e2Weak']) : '';
$e_3_strong = isset($_POST['e3Strong']) ? trim($_POST['e3Strong']) : '';
$e_3_weak = isset($_POST['e3Weak']) ? trim($_POST['e3Weak']) : '';
$summary = isset($_POST['summary']) ? trim($_POST['summary']) : '';

$sql = "INSERT INTO paper_summaries
            (map_id, rq, e_1_strong, e_1_weak, e_2_strong, e_2_weak,
             e_3_strong, e_3_weak, summary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            rq = VALUES(rq),
            e_1_strong = VALUES(e_1_strong),
            e_1_weak = VALUES(e_1_weak),
            e_2_strong = VALUES(e_2_strong),
            e_2_weak = VALUES(e_2_weak),
            e_3_strong = VALUES(e_3_strong),
            e_3_weak = VALUES(e_3_weak),
            summary = VALUES(summary),
            updated_at = CURRENT_TIMESTAMP";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'error' => $mysqli->error));
    exit;
}

$stmt->bind_param(
    'issssssss',
    $map_id,
    $rq,
    $e_1_strong,
    $e_1_weak,
    $e_2_strong,
    $e_2_weak,
    $e_3_strong,
    $e_3_weak,
    $summary
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'error' => $stmt->error));
    $stmt->close();
    exit;
}

$stmt->close();
echo json_encode(array('success' => true));
