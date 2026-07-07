function highlight_rationality_xmlLoad(){

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:highlight_rationality_parse_xml

	});

}



function highlight_rationality_parse_xml(xml,status){

	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(highlight_rationality_disp);

}



// HTML生成関数
function highlight_rationality_disp(){

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');//コンセプトID - インスタンスも含む
	var $label = $(this).find('LABEL');//概念（例：実践のデザインを考える） - インスタンスも含む
	//var $parent = $(this).find('R_CONST').text();
	var $isa = $(this).find('ISA');//概念間の線 - インスタンスも含む
	var $slot_tag = $(this).find('SLOT');//partof,atributeof

	for(var i=0; i<$label.length; i++){//ラベルの個数分回す

		//親概念のIDをもつタグを探索
		if($concept_tag[i].id == parent_concept_id){//チェックポイント

			for(var j=0; j<$slot_tag.length; j++){//スロットの個数分回す

				//SLOTタグの中でclass_constraintとクリックしたノードがもつconcept_idの概念が一致するものを探す
				if($slot_tag[j].getAttribute('class_constraint') == $label[i].childNodes[0].nodeValue){//実践の手順を考える
					var $slots = $slot_tag[j].parentNode.getElementsByTagName('SLOT');//<SLOT>実践の手順を考える</SLOT><SLOT>実践の理想の結果を考える</SLOT>
					//console.log($slot_tag[j].parentNode);
					//console.log($slots);

					for(var k=0; k<$slots.length; k++){

						if($slots[k].getAttribute('class_constraint') != $label[i].childNodes[0].nodeValue){//相方の場合

							for(var l=0; l<$label.length; l++){

								if($label[l].childNodes[0].nodeValue == $slots[k].getAttribute('class_constraint')){//実践の理想の結果を考えるの概念（LABEL）にたどり着いたとき

									var $jmnode = document.getElementsByTagName("jmnode");

									for(var m=0; m<$jmnode.length; m++){

										if($jmnode[m].getAttribute('concept_id') == $label[l].parentNode.id){

											if($jmnode[m].getAttribute('type') == "answer"){

												rationality_mode = true;
												$jmnode[m].style.border = "5px solid #9fd94f";
												console.log($jmnode[m]);
												console.log($jmnode[m].innerHTML);

											}

										}

									}

								}

							}



						}

					}

				}
			}


			for(var j=0; j<$concept_tag[i].childNodes.length; j++){

				if(j % 2 == 1){

				//親概念がもつ属性を取得
				var $slot = $concept_tag[i].childNodes[j].getElementsByTagName('SLOT');

					for(var k=0; k<$slot.length; k++){


						//入力のクラス制約を出力にもつ概念の問いを提示
						if($slot[k].getAttribute('role') == "入力"){

							var $class_constraint = $slot[k].getAttribute('class_constraint');

							for(var l=0; l<$slot_tag.length; l++){

								if($slot_tag[l].getAttribute('class_constraint') == $class_constraint){

									if($slot_tag[l].getAttribute('role') == "出力"){

										var jmnode = document.getElementsByTagName("jmnode");

										for(var m=0; m<jmnode.length; m++){

											var $concept_id = $slot_tag[l].parentNode.parentNode.id;

											if(jmnode[m].getAttribute("nodeid") != "root"){

												if(jmnode[m].getAttribute("concept_id") == $concept_id){

													if(jmnode[m].getAttribute("type") == "answer"){

														rationality_mode = true;
														jmnode[m].style.border = "5px solid #9fd94f";
														console.log($jmnode[m]);

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

//関数実行
$(function(){

	check_rationality_xmlLoad();

});
