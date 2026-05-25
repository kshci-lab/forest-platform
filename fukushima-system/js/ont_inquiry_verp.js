// 初期設定（allボタンを押した時の関数定義）
//動的ではない
//いったんHTMLを空にする
// $(function(){
//
// 	$("div#testxml").html("");
//
// });

// XML読み込み
function p_xmlLoad(){

	// $("div#intention").html("");
	$("div#testxml").html("");

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:p_parse_xml

	});

}

// XMLデータを取得
function p_parse_xml(xml,status){

	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(p_disp);

}

// HTML生成関数
function p_disp(){

	//console.log(this);

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $concept = $(this).find('SLOT').text();
	var $parent = $(this).find('R_CONST').text();

	for(var i=0; i<$concept_tag.length; i++){

		if($concept_tag[i].getAttribute('instantiation') == undefined){//概念

		}else{//問い

			var $id = $concept_tag[i].id;//inquiriesのid
			var $inquiry_content = $label[i].childNodes[0].nodeValue;//inquiriesのinquiry_content

			var $isa = $(this).find('ISA'); //is-a関係

			for(var j=0; j<$isa.length; j++){

				if($isa[j].getAttribute('child') == $label[i].childNodes[0].nodeValue){

					var $concept_content = $isa[j].getAttribute('parent');//inquiriesのconcept_content

					for(var k=0; k<$label.length; k++){

						if($label[k].childNodes[0].nodeValue == $concept_content){

							if($inquiry_content == "なぜそう考えるのですか？" || $inquiry_content == "目的は何ですか？" ){

								var $concept_id = $concept_tag[k].id;

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
								atag.href = "#";
								atag.id = $id;
								atag.setAttribute("concept_id", $concept_id);
								atag.onclick = Toi_Append;
								atag.innerHTML = $inquiry_content;
								ultag.appendChild(atag);

							}else if($inquiry_content == "なぜこれらは合理的であるといえるのですか？"){

								var $concept_id = $concept_tag[k].id;

								var testxml = document.getElementById("rationality");

								var ultag = document.createElement("ul");
								ultag.className = $concept_id;
								// ultag.state = "hide";
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


							}else{

								var $concept_id = $concept_tag[k].id;

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

function P_showGeneration(){

	$("div#testxml").html("");
	$("div#intention").html("");
	$("div#rationality").html("");
	console.log("P_showGeneration");
	p_xmlLoad();

}
