<?php
// Simple XML upload handler returning JSON.
header('Content-Type: application/json; charset=utf-8');

$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'uploads';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

if (!isset($_FILES['xmlFile']) || $_FILES['xmlFile']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded or upload error.']);
    exit;
}

$file = $_FILES['xmlFile'];
$originalName = basename($file['name']);
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if ($ext !== 'xml') {
    echo json_encode(['success' => false, 'error' => 'Only .xml files are allowed.']);
    exit;
}

$base = preg_replace('/[^A-Za-z0-9_\-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
$targetName = $base . '_' . uniqid() . '.xml';
$targetPath = realpath($uploadDir) . DIRECTORY_SEPARATOR . $targetName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file.']);
    exit;
}

echo json_encode(['success' => true, 'filename' => $targetName, 'original' => $originalName]);
exit;
?>
