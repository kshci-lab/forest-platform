//問いエリアの初期化とhozo.xmlの読み込み
function micro_xmlLoad(){

	$("#testxml").html("");
	$("#intention").html("");
	$("#rationality").html("");

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:micro_parse_xml

	});

}


// hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
function micro_parse_xml(xml,status){
	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(micro_disp);
}


// HTML生成関数
function micro_disp(){

	//hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

	for(var pp=0; pp<micro_concept_id.length; pp++){
		console.log(micro_concept_id[0]);


		for(var i=0; i<$label.length; i++){//オントロジーの個数分回す

			var $id = $concept_tag[i].id;//inquiriesのid（コンセプトid）
			var $inquiry_content = $label[i].childNodes[0].nodeValue;//ラベル名


			//親概念のIDをもつタグを探索（親：言い換える，子：言い換えるとどうなりますか）
			if($concept_tag[i].id == micro_concept_id[pp]){//回ってきたコンセプトidが親のコンセプトidだった場合(チェックポイント)
				// console.log(parent_concept_id);
				console.log($concept_tag[i]);
				console.log($concept_tag[i].childNodes);
				for(var j=0; j<$concept_tag[i].childNodes.length; j++){//子ノード（法造でいう部分概念）をまわしている


					if(j % 2 == 1){//jが奇数（textを除く）

					//親概念がもつ属性を取得
					$slot = $concept_tag[i].childNodes[j].getElementsByTagName('SLOT');
					console.log($slot);

						for(var k=0; k<$slot.length; k++){

							//サブ活動関連
							if($slot[k].getAttribute('role') == "サブ活動"　|| "サブ認知活動" || "サブメタ認知活動"){

								var $class_constraint = $slot[k].getAttribute('class_constraint');//発見したサブ活動のラベル名（実践の目的を考える）

								for(var l=0; l<$isa.length; l++){

									if($isa[l].getAttribute('parent') == $class_constraint){//isa関係のparent属性ににラベルを発見

										for(var m=0; m<$label.length; m++){//labelオントロジーを全探索
											//console.log($label);
											if($label[m].childNodes[0].nodeValue == $class_constraint){

												var $concept_id = $concept_tag[m].id;//サブ活動（親）のidをゲット

											}

										}

										var $inquiry_content = $isa[l].getAttribute('child');

										for(var m=0; m<$label.length; m++){

											if($label[m].childNodes[0].nodeValue == $inquiry_content){

												var $id = $concept_tag[m].id;//サブ活動（子）のidをゲット

												if($concept_tag[m].getAttribute('instantiation') == 'true'){ //yoshioka(インスタンスがあるかどうか)

												$global_advice.push($inquiry_content);

											}


											}

										}

									}

								}

							}

							//入力のクラス制約を出力にもつ概念の問いを提示
							if($slot[k].getAttribute('role') == "入力"){

								var $class_constraint = $slot[k].getAttribute('class_constraint');

								for(var l=0; l<$slot_tag.length; l++){

									if($slot_tag[l].getAttribute('class_constraint') == $class_constraint){

										if($slot_tag[l].getAttribute('role') == "出力"){

											for(var m=0; m<$isa.length; m++){

												var $output_concept = $slot_tag[l].parentNode.parentNode.getElementsByTagName('LABEL')[0].childNodes[0].nodeValue;
												var $concept_id = $slot_tag[l].parentNode.parentNode.id;

												if($isa[m].getAttribute('parent') == $output_concept){

													var $inquiry_content = $isa[m].getAttribute('child');

													for(var n=0; n<$label.length; n++){

														if($label[n].childNodes[0].nodeValue == $inquiry_content){

															var $id = $concept_tag[n].id;
															$global_advice.push($inquiry_content);


														}

													}

												}

											}

										}

									}

								}

							}

							//出力のクラス制約を入力にもつ概念のインスタンスである問いを提示
							if($slot[k].getAttribute('role') == "出力"){

								var $class_constraint = $slot[k].getAttribute('class_constraint');

								for(var l=0; l<$slot_tag.length; l++){

									if($slot_tag[l].getAttribute('class_constraint') == $class_constraint){

										if($slot_tag[l].getAttribute('role') == "入力"){

											for(var m=0; m<$isa.length; m++){

												var $input_concept = $slot_tag[l].parentNode.parentNode.getElementsByTagName('LABEL')[0].childNodes[0].nodeValue;
												var $concept_id = $slot_tag[l].parentNode.parentNode.id;

												if($isa[m].getAttribute('parent') == $input_concept){

													var $inquiry_content = $isa[m].getAttribute('child');

													for(var n=0; n<$label.length; n++){

														if($label[n].childNodes[0].nodeValue == $inquiry_content){

															var $id = $concept_tag[n].id;
															$global_advice.push($inquiry_content);


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

			}

		}

	}
	console.log("終わり");
	console.log($global_advice);

	var $new_global_advice = Array.from(new Set($global_advice));
	console.log($new_global_advice);



	console.log($slide_topic);

	for(var i=0; i<$new_global_advice.length; i++){
		for(var j=0; j<$slide_topic.length; j++){
			if($new_global_advice[i] == $slide_topic[j]){
				$new_global_advice.splice(i,1);
				i--;
			}
		}
	}

	for(var i=0; i<$new_global_advice.length; i++){
		var area = $("#advice_frame");
		var micro_advice ="<div style='font-size:13px;'>・「"+$new_global_advice[i]+"」について説明する必要はないですか？\n\n</div>";
		// var test = "<a href='#' onclick='TestFunc();'>テスト</a>";
		area.append(micro_advice);
		area.append("<br>");
		// area.append(test);
	}





	console.log($new_global_advice);
	$global_advice = [];






}
