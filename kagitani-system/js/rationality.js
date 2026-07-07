function micro_rationality_xmlLoad(){

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:micro_rationality_parse_xml

	});

}



function micro_rationality_parse_xml(xml,status){

	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(micro_rationality_disp);

}



// HTML生成関数
function micro_rationality_disp(){

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	//var $parent = $(this).find('R_CONST').text();
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

  for(var nn=0; nn<micro_concept_id.length; nn++){

  	for(var i=0; i<$label.length; i++){//オントロジーの個数分回す

  		//親概念のIDをもつタグを探索
  		if($concept_tag[i].id == micro_concept_id[nn]){

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
												document.getElementById('gouri').value += "・ "+ $jmnode[m].innerHTML +" \n";
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



  		}

  	}
  }

}

//関数実行
$(function(){

	micro_rationality_xmlLoad();

});
