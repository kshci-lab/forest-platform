<?php

$xml_data = simplexml_load_file('../js/hozo.xml'); //法造データ取り出し
$conID = $_POST['get_concept_id'];
$conLABEL =  $xml_data->xpath('W_CONCEPTS/CONCEPT[@id="'.$conID.'"]/LABEL/text()');

echo json_encode($conLABEL);
?>
