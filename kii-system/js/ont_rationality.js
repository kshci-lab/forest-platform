function check_rationality_xmlLoad(node_class){

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:check_rationality_parse_xml(node_class)
		// ここで引数どうやってもたせるのかわからない？？

	});

}



function check_rationality_parse_xml(xml,status,node_class){

	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(check_rationality_disp(node_class));

}



// HTML生成関数
function check_rationality_disp(node_class){

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	//var $parent = $(this).find('R_CONST').text();
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

	for(var i=0; i<$label.length; i++){

		//親概念のIDをもつタグを探索
		if($concept_tag[i].id == parent_concept_id){

			for(var j=0; j<$slot_tag.length; j++){

				//SLOTタグの中でclass_constraintとクリックしたノードがもつconcept_idの概念が一致するものを探す
				if($slot_tag[j].getAttribute('class_constraint') == $label[i].childNodes[0].nodeValue){

					var $slots = $slot_tag[j].parentNode.getElementsByTagName('SLOT');

					for(var k=0; k<$slots.length; k++){

						if($slots[k].getAttribute('class_constraint') != $label[i].childNodes[0].nodeValue){

							for(var l=0; l<$label.length; l++){

								if($label[l].childNodes[0].nodeValue == $slots[k].getAttribute('class_constraint')){

									var $jmnode = document.getElementsByTagName("jmnode");

									for(var m=0; m<$jmnode.length; m++){

										if($jmnode[m].getAttribute('concept_id') == $label[l].parentNode.id){

											if($jmnode[m].getAttribute('type') == "answer"){

												rationality_mode = true;
												$jmnode[m].style.border = "5px solid #9fd94f";

											}else if($jmnode[m].getAttribute('class') == node_class){
												rationality_mode = true;
												$jmnode[m].style.border = "5px solid #9fd94f";
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

						/*if($slot[k].getAttribute('role') == "サブ活動"　|| "サブ認知活動" || "サブメタ認知活動"){

							var $class_constraint = $slot[k].getAttribute('class_constraint');

							for(var l=0; l<$isa.length; l++){

								if($isa[l].getAttribute('parent') == $class_constraint){

									for(var m=0; m<$label.length; m++){

										if($label[m].childNodes[0].nodeValue == $class_constraint){

											$label[m].parentNode.id;

										}

									}

									var $inquiry_content = $isa[l].getAttribute('child');

									for(var m=0; m<$label.length; m++){

										if($label[m].childNodes[0].nodeValue == $inquiry_content){

											var $id = $concept_tag[m].id;
											console.log("sub");

											var testxml = document.getElementById("testxml");

											var ultag = document.createElement("ul");
											ultag.className = $concept_id;
											ultag.state = "hide";
											//ultag.setAttribute("switch",false);
											testxml.appendChild(ultag);

											var imgtag = document.createElement("img");
											imgtag.src = "image/list6.png";
											imgtag.style.width = 15;
											imgtag.style.height = 15;
											//imgtag.onclick = switching;
											ultag.appendChild(imgtag);

											var atag = document.createElement("a");
											atag.href = "#!";
											atag.id = $id;
											atag.onclick = add_node;
											atag.innerHTML = $inquiry_content;
											ultag.appendChild(atag);


										}

									}

								}

							}

						}*/

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

													}else if($jmnode[m].getAttribute('class') == node_class){
														rationality_mode = true;
														$jmnode[m].style.border = "5px solid #9fd94f";
													}

												}

											}

										}

									}

								}

							}

						}

						//出力のクラス制約を入力にもつ概念のインスタンスである問いを提示
						/*if($slot[k].getAttribute('role') == "出力"){

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
														console.log("out");

														var testxml = document.getElementById("testxml");

														var ultag = document.createElement("ul");
														ultag.className = $concept_id;
														ultag.state = "hide";
														//ultag.setAttribute("switch",false);
														testxml.appendChild(ultag);

														var imgtag = document.createElement("img");
														imgtag.src = "image/list6.png";
														imgtag.style.width = 15;
														imgtag.style.height = 15;
														//imgtag.onclick = switching;
														ultag.appendChild(imgtag);

														var atag = document.createElement("a");
														atag.href = "#!";
														atag.id = $id;
														atag.onclick = add_node;
														atag.innerHTML = $inquiry_content;
														ultag.appendChild(atag);


													}

												}

											}

										}

									}

								}

							}

						}*/


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
