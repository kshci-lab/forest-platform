function choose_xmlLoad(){

	$("#testxml").html("");
	$("#intention").html("");
	$("#rationality").html("");
	$("#deep").html("");



	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:choose_parse_xml

	});

}



function choose_parse_xml(xml,status){

	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(choose_disp);

}

// HTML生成関数


function choose_disp(){

	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

	for(var i=0; i<$label.length; i++){

		var $id = $concept_tag[i].id;//inquiriesのid
		var $inquiry_content = $label[i].childNodes[0].nodeValue;//inquiriesのinquiry_content


		if($inquiry_content == "なぜそう考えるのですか？" || $inquiry_content == "目的は何ですか？" ){


			var $concept_id = $concept_tag[i].id; //yoshioka k -> i

			var testxml = document.getElementById("intention");

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

		}else if($inquiry_content == "なぜこれらは合理的であるといえるのですか？"){

			var $concept_id = $concept_tag[i].id; //yoshioka k->i

			var testxml = document.getElementById("rationality");

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

		//親概念のIDをもつタグを探索
		if($concept_tag[i].id == parent_concept_id){


			for(var j=0; j<$concept_tag[i].childNodes.length; j++){

				if(j % 2 == 1){

				//親概念がもつ属性を取得
				$slot = $concept_tag[i].childNodes[j].getElementsByTagName('SLOT');

					for(var k=0; k<$slot.length; k++){

						if($slot[k].getAttribute('role') == "サブ活動"　|| "サブ認知活動" || "サブメタ認知活動"){

							var $class_constraint = $slot[k].getAttribute('class_constraint');

							for(var l=0; l<$isa.length; l++){

								if($isa[l].getAttribute('parent') == $class_constraint){

									for(var m=0; m<$label.length; m++){

										if($label[m].childNodes[0].nodeValue == $class_constraint){

											var $concept_id = $concept_tag[m].id;

										}

									}

									var $inquiry_content = $isa[l].getAttribute('child');

									for(var m=0; m<$label.length; m++){

										if($label[m].childNodes[0].nodeValue == $inquiry_content){

											var $id = $concept_tag[m].id;
											// var $id = this.parentNode.className;

											if($concept_tag[m].getAttribute('instantiation') == 'true'){ //yoshioka

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

						//入力のクラス制約を出力にもつ概念の問いを提示
						if($slot[k].getAttribute('role') == "入力"){

							var $class_constraint = $slot[k].getAttribute('class_constraint');

							for(var l=0; l<$slot_tag.length; l++){

								if($slot_tag[l].getAttribute('class_constraint') == $class_constraint){

									if($slot_tag[l].getAttribute('role') == "出力"){

										for(var m=0; m<$isa.length; m++){

											var $output_concept = $slot_tag[l].parentNode.parentNode.getElementsByTagName('LABEL')[0].childNodes[0].nodeValue;
											// console.log($output_concept);
											var $concept_id = $slot_tag[l].parentNode.parentNode.id;
											
											if($isa[m].getAttribute('parent') == $output_concept){

												var $inquiry_content = $isa[m].getAttribute('child');

												for(var n=0; n<$label.length; n++){

													if($label[n].childNodes[0].nodeValue == $inquiry_content){

														var $id = $concept_tag[n].id;

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

						}


					}

				}

			}

		}

	}

}


if(node_type = ""){

}