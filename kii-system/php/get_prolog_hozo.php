<?php

$fp = fopen('hozo_data.pl', 'w');
flock($fp, LOCK_EX);
ftruncate($fp,0);
fseek($fp,0);

IN_OUT($fp);
GET_ACTIVITY($fp);
Get_Rationality($fp);

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

//合理性の関係を取り出して記録
function Get_Rationality($fp){

  //ISAを見て合理性を考えるもの一覧を取得する
  $xml_data = simplexml_load_file('../js/hozo.xml');
  $rationality_list = $xml_data->xpath('W_CONCEPTS/ISA[@parent="合理性を考える"]/@child');

  //ラベルが一致するコンセプトをまず取得
  foreach($rationality_list as $rationality){
    if((string)$rationality=="なぜこれらは合理的であるといえるのですか？"){
      continue;
    }
    $concept_list = $xml_data->xpath('W_CONCEPTS/CONCEPT[LABEL/text()= "'.(string)$rationality.'"]');

    //コンセプトのSLOT中にある入力の項目を取り出す(2つになるはず)
    foreach($concept_list as $concept){
      $two_in_list = $concept->xpath('SLOTS/SLOT[@role="入力"]/@class_constraint');

      // var_dump($two_in_list);//ここは２つ入ってる
      // echo nl2br("\n");

      $re =0;
      $i=0;
      $rationality_id_sets = array();

      for($i=0;$i<1;$i++){
            for($re =0;$re<2;$re++){
              $rationality_id = $xml_data->xpath('W_CONCEPTS/CONCEPT[LABEL/text()= "'.(string)$two_in_list[$re].'" ]/@id');
              // var_dump($rationality_id);
              // echo nl2br("\n");
              // echo "nうぬぬ";
              // var_dump((string)$rationality_id[0]->id);
              // echo nl2br("\n");
              $rationality_id_sets[$i][$re] =  (string)$rationality_id[0]->id;
            }
          }

      // var_dump($rationality_id_sets);
      // echo nl2br("\n");

      $word = "rationality('" .(string)$rationality_id_sets[0][0] ."', '" .(string)$rationality_id_sets[0][1]."')." ."\n";
      fputs($fp,$word); //書き込み実行

      //2つのコンセプトidを調べる
      foreach($two_in_list as $two_in){
        $in_conceptID_list = $xml_data->xpath('W_CONCEPTS/CONCEPT[LABEL/text()= "'.(string)$two_in.'" ]/@id');

        // var_dump($in_conceptID_list);
        // echo nl2br("\n");

        foreach($in_conceptID_list as $in_conceptID){
          // var_dump($in_conceptID_list);
          // echo nl2br("\n");

          // $word = "rationality('" .(string)$in_conceptID[0] ."', '" .(string)$in_conceptID[1]."')." ."\n";
          // fputs($fp,$word); //書き込み実行
        }
        // var_dump($in_conceptID_list);
        // echo nl2br("\n");
      }
      // var_dump($in_conceptID_list);
      // echo nl2br("\n");
      //
      // echo nl2br("\n");
      // echo nl2br("\n");
      // echo nl2br("\n");
      // echo nl2br("\n");
    }
  }


}

?>
