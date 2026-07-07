
var conIDs = [];

//hozo.xmlの読み込み
function choose_trigger_xmlLoad(){
	conIDs = [];
    return new Promise((resolve, reject) => { // Promiseを返す
        $.ajax({
            url: 'js/hozo.xml',
            type: 'get',
            dataType: 'xml',
            timeout: 1000,
            success: function(xml) {
                choose_trigger_parse_xml(xml);
                resolve(conIDs); // XMLのパース後にconIDsを解決
            },
            error: function() {
                reject("Error loading XML"); // エラーハンドリング
            }
        });
    });
}


// hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
function choose_trigger_parse_xml(xml){
	$(xml).find('W_CONCEPTS').each(choose_trigger_candi);
}

// HTML生成関数
function choose_trigger_candi(){

	//hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');
	
	//表示しているprocessmapのconcept_id
    node_concept_id = document.getElementById("conceptdisplay").getAttribute("conceptid");

	for(var i=0; i<$label.length; i++){//オントロジーの個数分回す

		var $id = $concept_tag[i].id;//inquiriesのid（コンセプトid）
		var $inquiry_content = $label[i].childNodes[0].nodeValue;//ラベル名

		//親概念のIDをもつタグを探索（親：言い換える，子：言い換えるとどうなりますか）
		if($concept_tag[i].id == node_concept_id){//回ってきたコンセプトidが親のコンセプトidだった場合(チェックポイント)
			
			for(var j=0; j<$concept_tag[i].childNodes.length; j++){

				if(j % 2 == 1){//jが奇数（textを除く）

				//親概念がもつ属性を取得
				$slot = $concept_tag[i].childNodes[j].getElementsByTagName('SLOT');

					for(var k=0; k<$slot.length; k++){

						//サブ活動関連
						if($slot[k].getAttribute('role') == "サブ活動"　|| "サブ認知活動" || "サブメタ認知活動"){

							var $class_constraint = $slot[k].getAttribute('class_constraint');//発見したサブ活動のラベル名（実践の目的を考える）
							
							for(var l=0; l<$isa.length; l++){

								if($isa[l].getAttribute('parent') == $class_constraint){//isa関係のparent属性ににラベルを発見

									for(var m=0; m<$label.length; m++){//labelオントロジーを全探索
										//console.log($label);
										if($label[m].childNodes[0].nodeValue == $class_constraint){

											var $concept_id = $concept_tag[m].id;//サブ活動（親）のconcept_idをゲット
											let alreadyExists = conIDs.includes($concept_id);
											if (!alreadyExists) {
												conIDs.push($concept_id); // ここに$concept_idを追加
											}
										}

									}

								}

							}

						}

						//入力のクラス制約を出力にもつ概念のconcept_id
						if($slot[k].getAttribute('role') == "入力"){

							var $class_constraint = $slot[k].getAttribute('class_constraint');

							for(var l=0; l<$slot_tag.length; l++){

								if($slot_tag[l].getAttribute('class_constraint') == $class_constraint){

									if($slot_tag[l].getAttribute('role') == "出力"){

										for(var m=0; m<$isa.length; m++){

											var $output_concept = $slot_tag[l].parentNode.parentNode.getElementsByTagName('LABEL')[0].childNodes[0].nodeValue;
											var $concept_id = $slot_tag[l].parentNode.parentNode.id;
											let alreadyExists = conIDs.includes($concept_id);
											if (!alreadyExists) {
												conIDs.push($concept_id); // ここに$concept_idを追加
											}

										}

									}

								}

							}

						}

						//出力のクラス制約を入力にもつ概念のconcept_id
						if($slot[k].getAttribute('role') == "出力"){

							var $class_constraint = $slot[k].getAttribute('class_constraint');

							for(var l=0; l<$slot_tag.length; l++){

								if($slot_tag[l].getAttribute('class_constraint') == $class_constraint){

									if($slot_tag[l].getAttribute('role') == "入力"){

										for(var m=0; m<$isa.length; m++){

											var $input_concept = $slot_tag[l].parentNode.parentNode.getElementsByTagName('LABEL')[0].childNodes[0].nodeValue;
											var $concept_id = $slot_tag[l].parentNode.parentNode.id;
											let alreadyExists = conIDs.includes($concept_id);
											if (!alreadyExists) {
												conIDs.push($concept_id); // ここに$concept_idを追加
											}

										}

									}

								}

							}

						}


					}

				}

			}

		}

	}

	return conIDs;

}
