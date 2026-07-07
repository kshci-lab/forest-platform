//ノードを選択した時の問い表示関数の定義

//問いエリアの初期化とhozo.xmlの読み込み
function recommend_xmlLoad(){

	$("#testxml").html("");
	$("#intention").html("");
	$("#rationality").html("");

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:recommend_parse_xml

	});

}


// hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
function recommend_parse_xml(xml,status){
	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(recommend_disp);
}

// HTML生成関数
function recommend_disp(){
  const frame_dom = document.getElementsByClassName("inquiry_area");
  frame_dom[0].style.border = "solid 5px #9BF9CC";

	//hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

  var conceptid;
  const c_scenario = document.getElementsByClassName("cspan");
  console.log(c_scenario);
  for(var i=0; i<c_scenario.length; i++){
    console.log(c_scenario[i].style.border);
    if(c_scenario[i].style.border == "2px solid gray"){
      conceptid = c_scenario[i].getAttribute("concept_id");
      console.log(conceptid);
			// if(conceptid == "" || conceptid == undefined || conceptid == null){
			// 	console.log("aa");
			// 	return 0;
			// }
			
      // if(checked_id != ""){
      //   conceptid = GetConceptId(checked_id);
      //   console.log(conceptid);
      // }else{
      //   return 0;
      // }
    }
  }
	console.log(conceptid);

	for(var i=0; i<$label.length; i++){//オントロジーの個数分回す

		var $id = $concept_tag[i].id;//inquiriesのid（コンセプトid）
		var $inquiry_content = $label[i].childNodes[0].nodeValue;//ラベル名
		//確認
		//if(i == 1){
				//console.log($concept_tag);
				//console.log($label[1]);
		//}

		//理由，目的，合理性の問いを問答無用で表示するコード
		if($inquiry_content == "なぜそう考えるのですか？" || $inquiry_content == "目的は何ですか？" ){


			var $concept_id = $concept_tag[i].id; //yoshioka k -> i/コンセプトid

			var testxml = document.getElementById("intention");
			//console.log(document.getElementById("intention"));

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
			atag.href = "#";
			atag.id = $id;
			atag.setAttribute("concept_id", $concept_id);
			atag.onclick = Toi_Append;
			atag.innerHTML = $inquiry_content;
			ultag.appendChild(atag);

		}
    else if($inquiry_content == "なぜこれらは合理的であるといえるのですか？"){

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
			atag.href = "#";
			atag.id = $id;
			atag.setAttribute("concept_id", $concept_id);
			atag.onclick = Toi_Append;
			atag.innerHTML = $inquiry_content;
			ultag.appendChild(atag);


		}

		//親概念のIDをもつタグを探索（親：言い換える，子：言い換えるとどうなりますか）
		if($concept_tag[i].id == conceptid){//回ってきたコンセプトidが親のコンセプトidだった場合(チェックポイント)
			// console.log(parent_concept_id);
			// console.log($concept_tag[i]);
			// console.log($concept_tag[i].childNodes);
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

											var $concept_id = $concept_tag[m].id;//サブ活動（親）のidをゲット

										}

									}

									var $inquiry_content = $isa[l].getAttribute('child');
									// for(i=0; i<$isa.length; i++){
									//
									// }

									for(var m=0; m<$label.length; m++){

										if($label[m].childNodes[0].nodeValue == $inquiry_content){

											var $id = $concept_tag[m].id;//サブ活動（子）のidをゲット

											if($concept_tag[m].getAttribute('instantiation') == 'true'){ //yoshioka(インスタンスがあるかどうか)

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

											for(let l=0; l<$isa.length; l++){
												if($isa[l].getAttribute("child") == $inquiry_content){
													const content = $isa[l].getAttribute("parent");
													for(let m=0; m<$label.length; m++){
														if($label[m].innerHTML==content){
															$concept_id = $concept_tag[m].id;
														}
													}
												}
											}

											var atag = document.createElement("a");
											atag.href = "#";
											atag.id = $id;
											atag.setAttribute("concept_id", $concept_id);
											atag.onclick = Toi_Append;
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

														for(let l=0; l<$isa.length; l++){
															if($isa[l].getAttribute("child") == $inquiry_content){
																const content = $isa[l].getAttribute("parent");
																for(let m=0; m<$label.length; m++){
																	if($label[m].innerHTML==content){
																		$concept_id = $concept_tag[m].id;
																	}
																}
															}
														}

														var atag = document.createElement("a");
														atag.href = "#";
														atag.id = $id;
														atag.setAttribute("concept_id", $concept_id);
														atag.onclick = Toi_Append;
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
											// console.log($slot_tag[l].parentNode.parentNode);
											// console.log($slot_tag[l].parentNode.parentNode.getElementsByTagName('LABEL')[0]);
											// console.log($slot_tag[l].parentNode.parentNode.getElementsByTagName('LABEL')[0].childNodes[0]);
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

														for(let l=0; l<$isa.length; l++){
															if($isa[l].getAttribute("child") == $inquiry_content){
																const content = $isa[l].getAttribute("parent");
																for(let m=0; m<$label.length; m++){
																	if($label[m].innerHTML==content){
																		$concept_id = $concept_tag[m].id;
																	}
																}
															}
														}

														var atag = document.createElement("a");
														atag.href = "#";
														atag.id = $id;
														atag.setAttribute("concept_id", $concept_id);
														atag.onclick = Toi_Append;
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
