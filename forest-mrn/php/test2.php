<?php
session_start();
/*DBに接続*/
require("connect_db.php");

$fp = fopen('hozo_data.pl', 'w');
flock($fp, LOCK_EX);
ftruncate($fp,0);
fseek($fp,0);

IN_OUT($fp);
GET_ACTIVITY($fp);

flock($fp, LOCK_UN);
fclose($fp);





function GET_ACTIVITY($fp){
  $get_activities = array("サブ活動", "サブ認知活動", "サブメタ認知活動");
  $xml_data = simplexml_load_file('../js/hozo.xml');


  foreach($get_activities as $get_activity){
    $concept_list = $xml_data->xpath('W_CONCEPTS/CONCEPT[SLOTS/SLOT/@role="'.$get_activity.'"]');

    foreach($concept_list as $concept){
      $conceptID = $concept->xpath('@id');
      $in_name_list = $concept->xpath('SLOTS/SLOT[@role="'.$get_activity.'"]/@class_constraint');
      foreach($in_name_list as $in_name){
        $in_conceptID_list = $xml_data->xpath('W_CONCEPTS/CONCEPT[LABEL/text()= "'.(string)$in_name.'" ]/@id');
        foreach($in_conceptID_list as $in_conceptID){
          $word = "class_activity('" .(string)$conceptID[0]->id ."', '" .(string)$in_conceptID ."')." ."\n";
          fputs($fp,$word); //書き込み実行
        }
      }
    }
  }


}



//入出力を取り出して記録する概念
function IN_OUT($fp){
  $get_item_set = array("入力", "出力");
  foreach($get_item_set as $get_item){

    //$concept_itemが入力なら出力，出力なら入力を代入
    if($get_item == "入力"){
      $out_item = "出力";
      $word_item = "in";
    }elseif ($get_item == "出力") {
      $out_item = "入力";
      $word_item = "out";
    }

    $xml_data = simplexml_load_file('../js/hozo.xml');
    $concept_list = $xml_data->xpath('W_CONCEPTS/CONCEPT[SLOTS/SLOT/@role="'.$get_item.'"]');
    foreach($concept_list as $concept){
          $conceptID = $concept->xpath('@id');
          $in_name_list = $concept->xpath('SLOTS/SLOT[@role="'.$get_item.'"]/@class_constraint');

      foreach($in_name_list as $in_name){

        $in_slotID_list = $xml_data->xpath('W_CONCEPTS/CONCEPT/SLOTS/SLOT[@role="'.$out_item.'" and @class_constraint= "'.(string)$in_name.'" ]/@id');

        foreach($in_slotID_list as $in_slotID){

          $in_conceptID_list = $xml_data->xpath('W_CONCEPTS/CONCEPT[SLOTS/SLOT/@id= "'.(string)$in_slotID.'" ]/@id');
          foreach($in_conceptID_list as $in_conceptID){

            $word = "class_" .$word_item ."('" .(string)$conceptID[0]->id ."', '" .(string)$in_conceptID ."')." ."\n";
            fputs($fp,$word); //書き込み実行
          }
        }
      }
    }
  }

}

?>
