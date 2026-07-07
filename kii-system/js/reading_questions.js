


// 法造のデータを取得
function HozoDataGet(){
	$.ajax({
		url:'./js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:3000, //ちょっと待つ
		success: function(xml){ // ajax成功なら返り値（xmlデータ）を渡す
      $(xml).find('W_CONCEPTS').each(function(){
          // 各要素を変数に格納
          // ここで，$concept_tagと$labelの数は一致する（概念には必ずラベルがついている）
        	$concept_tag = $(this).find('CONCEPT'); // 概念ごとのひとかたまりの情報
        	$label = $(this).find('LABEL'); // 「共有」「前提」などの文字情報
        	$slot_tag = $(this).find('SLOT'); //　スロット情報

          input_name = [];
          slot_id = "";

          $concept_tag_html = [];
          $concept_tag_slot = [];

          // 各コンセプトIDが持つスロットを格納する
          // 同じ[x]を用いることで，その概念が持つスロットを呼び出せるようにする
          for(var x=0; x<$concept_tag.length; x++){
            $concept_tag_html[x] = $concept_tag[x].innerHTML;
            $concept_tag_slot[x] = $($concept_tag_html[x]).find('SLOT');
          }
          // console.log($concept_tag_slot[242][1]); // ある特定のスロット情報
      })
    }
	});
}

// nodeIDを引数にしてconceptIDを取得する関数
function GetConceptId(nodeID){
    var node_obj = document.getElementsByTagName("jmnode");
    var conceptID = "default";
  
    for(let k=0; k<node_obj.length; k++){
      if(node_obj[k].getAttribute("nodeid") == nodeID){//回ってきたidが選択中ノードの時
        conceptID = node_obj[k].getAttribute("concept_id");//コンセプトid
        console.log(conceptID);
      }
      if(conceptID != "default"){//同じコンセプトIDがいくつか存在するから
        break;
      }
    }
    return conceptID;
  }


  
