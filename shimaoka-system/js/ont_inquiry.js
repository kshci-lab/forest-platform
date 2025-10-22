// 初期設定（allボタンを押した時の関数定義）
//動的ではない
//いったんHTMLを空にする
$(function(){

	$("div#testxml").html("");

});

// XML読み込み
function c_xmlLoad(){

	// $("div#intention").html("");
	$("div#testxml").html("");

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:c_parse_xml

	});

}

// XMLデータを取得
function c_parse_xml(xml,status){

	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(c_disp);
}

// HTML生成関数
function c_disp(){

	//console.log(this);　
	//上と下のthisは法造のノード情報，親子関係を全て取得している．

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	// console.log($concept_tag);　//法造のデータのid
	var $label = $(this).find('LABEL');
	// console.log($label); //法造のクラス一つ一つのlabelが集まる．
	var $concept = $(this).find('SLOT').text();
	// console.log($concept);
	var $parent = $(this).find('R_CONST').text();
	// console.log($parent);

	for(var i=0; i<$concept_tag.length; i++){

		if($concept_tag[i].getAttribute('instantiation') == undefined){//概念
			//インスタンスがない　→ 問いが用意されてないという状態．もし今後インスタンスで何かを追加するなら注意

		}else{//問い を生成していく．

			var $id = $concept_tag[i].id;//inquiriesのid
			var $inquiry_content = $label[i].childNodes[0].nodeValue;//inquiriesのinquiry_content

			var $isa = $(this).find('ISA'); //is-a関係　だけ集める
			// console.log($isa);

			for(var j=0; j<$isa.length; j++){
				
				//子供と，あるlabelの内容が等しい時
				if($isa[j].getAttribute('child') == $label[i].childNodes[0].nodeValue){

					var $concept_content = $isa[j].getAttribute('parent');//inquiriesのconcept_content

					for(var k=0; k<$label.length; k++){
						//あるラベルの情報が親のラベル情報と等しい
						if($label[k].childNodes[0].nodeValue == $concept_content){

							if($inquiry_content == "なぜそう考えるのですか？" || $inquiry_content == "目的は何ですか？" ){

								var $concept_id = $concept_tag[k].id; //id決定
								var testxml = document.getElementById("intention");//問いの入れたい箇所　[理由・目的]

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
								atag.onclick = add_node;
								atag.innerHTML = $inquiry_content;
								ultag.appendChild(atag);

							}else if($inquiry_content == "なぜこれらは合理的であるといえるのですか？"){

								var $concept_id = $concept_tag[k].id;

								var testxml = document.getElementById("rationality");	//問いの入れたい箇所　[合理性]

								var ultag = document.createElement("ul");
								ultag.className = $concept_id;
								// ultag.state = "hide";
								//ultag.setAttribute("switch",false);
								testxml.appendChild(ultag);	//[合理性]の下に<ul>タグを追加する

								var imgtag = document.createElement("img");
								imgtag.src = "image/list6.png";
								imgtag.style.width = 15;
								imgtag.style.height = 15;
								//imgtag.onclick = switching;
								ultag.appendChild(imgtag);	//追加した<ul>タグの中に<img>を追加する

								var atag = document.createElement("a");
								atag.href = "#";
								atag.id = $id;
								atag.onclick = add_node;
								atag.innerHTML = $inquiry_content;
								ultag.appendChild(atag);	//追加した<ul>タグの中に<a>を追加する

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

								var atag = document.createElement("a");
								atag.href = "#";
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


function showGeneration(){
	//問い一覧箇所の表示
	$("div#testxml").html("");		//[情報の表出化]　を空白に
	$("div#intention").html("");	//[理由・目的]　を空白に
	$("div#rationality").html("");	//[合理性]　を空白に
	// console.log("showGeneration");
	c_xmlLoad();

}

// index.phpを読み込むたびに関数実行
$(function(){
	c_xmlLoad();
	// c_xmlLoadLogicIntention();
});
