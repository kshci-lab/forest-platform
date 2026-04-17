//問いエリアの初期化とhozo.xmlの読み込み
function macro_xmlLoad(){

	$.ajax({

		url:'js/hozo_presentation.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:macro_parse_xml

	});

}


// hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
function macro_parse_xml(xml,status){
	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(macro_disp);
}


// HTML生成関数
function macro_disp(){

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

	console.log($audience_model);

	for(var i=0; i<$label.length; i++){
		for(var j=0; j<$concept_tag[i].childNodes.length; j++){//子ノード（法造でいう部分概念）をまわしている
			if(j % 2 == 1){//jが奇数（textを除く）
				if($concept_tag[i].id == $audience_model){
					if($concept_tag[i].childNodes[j].getElementsByTagName('SLOT').length != 0){
						console.log($concept_tag[i].childNodes[j].getElementsByTagName('SLOT'));
						var slot = $concept_tag[i].childNodes[j].getElementsByTagName('SLOT');
					}
				}
			}
		}
	}

	for(var k=0; k<slot.length; k++){
		console.log(slot[k]);
		console.log(slot[k].getAttribute('class_constraint'));//出力：教育的妥当性がわかるように話されているか
		var perspec = [];
		perspec.push(slot[k].getAttribute('class_constraint'));
	}

	var rational = [];

	for(var i=0; i<perspec.length; i++){
		for(var j=0; j<$isa.length; j++){
			if($isa[j].getAttribute('parent') == perspec[i]){
				rational.push($isa[j].getAttribute('child'));
			}
		}
	}
	console.log(rational);//出力：["育成支援するスキル，システムの出力情報の合理性が話されているか", "研究目的，実践目的の合理性が話されているか"]
	var t = 0;

	for(var i=0; i<rational.length; i++){
		for(var j=0; j<$label.length; j++){
			for(var k=0; k<$concept_tag[j].childNodes.length; k++){//子ノード（法造でいう部分概念）をまわしている
				if(k % 2 == 1){//kが奇数（textを除く）
					if($label[j].textContent == rational[i]){
						if($concept_tag[j].childNodes[k].getElementsByTagName('SLOT').length != 0){
							console.log($concept_tag[j].childNodes[k].getElementsByTagName('SLOT'));
							var slot3 = $concept_tag[j].childNodes[k].getElementsByTagName('SLOT');
							console.log(slot3);
							var parts = [];
							for(var m=0; m<slot3.length; m++){
								console.log(slot3[m]);
								console.log(slot3[m].getAttribute('class_constraint'));
								parts.push(slot3[m].getAttribute('class_constraint'));
								console.log(parts);
							}
							var inner_label = "<div>今回の発表では，"+slot[0].getAttribute('class_constraint')+"が重要視されますが，"+parts[0]+"と"+parts[1]+"の合理性は十分に説明されていますか？</div>"+"<br>";
							console.log(inner_label);
							var fshow = $("#macro_feedback_area");
							fshow.append(inner_label);
							console.log("ok");
							console.log(fshow);
							console.log(document.getElementById("macro_feedback_area"));
						}
					}
				}
			}
		}
	}


}














//
