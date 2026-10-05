//ノードを選択した時の問い表示関数の定義

//問いエリアの初期化とhozo.xmlの読み込み
function audience_xmlLoad(){

	$("#testxml").html("");
	$("#intention").html("");
	$("#rationality").html("");

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:audience_parse_xml

	});

}


// hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
function audience_parse_xml(xml,status){
	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(audience_disp);
}

var audience_name;//学習者が選択した聴衆モデルの名前
var e_desire = [];//聴衆モデルの重視する欲求のテキスト配列
var e_attribute = [];//聴衆モデルの重視する目標のテキスト配列
console.log("test");
// HTML生成関数
function audience_disp(){

	//hozo.xmlファイルのタグを検索して変数に格納（全てのタグが配列で格納されている），thisはhozo.xmlのこと
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

  const audience = document.getElementsByClassName("aradio");
	for (let i=0; i<audience.length; i++){
		if(audience[i].checked){ //(audience[i].checked === true)と同じ
      audience_name = audience[i].getAttribute("opt");
      console.log(audience_name);
		}
	}
  $('#set_audience').toggle(1);//発表の場面設定エリアを非表示
  $('#set_model').toggle(1);//目標設定エリアを表示
	var s_desire = [];
  var attribute = [];
  var area = $("#set_perspective");//目標提示エリア
  var sub_area = $("#menu1");//サブ目標提示エリア（折り畳み式の部分）
  area.empty();
  sub_area.empty();

  for(i=0; i<$slot_tag.length; i++){
    const role = $slot_tag[i].getAttribute("role");
    // console.log($slot_tag[i].getAttribute("class_constraint"));
    if(audience_name == $slot_tag[i].getAttribute("class_constraint")){
      console.log($slot_tag[i]);
      //選択した聴衆モデルのコンセプトID
      $audience_model = $slot_tag[i].parentElement.parentElement.id;
      //聴衆モデルが持つ欲求の取得
      const slot_audience = $slot_tag[i].parentElement;//<SLOTS>タグの取得
      console.log(slot_audience);
      // const slot_length = slot_audience.childElementCount;
      console.log(slot_audience.childNodes);
      const slot_set = slot_audience.childNodes;//<SLOTS>に含まれる<SLOT>タグ群を取得
      console.log(slot_set.length);
			for(j=0; j<slot_set.length; j++){
        if(j % 2 == 1){
          if(slot_set[j].getAttribute("role") == "重視する欲求"){
						const desire = slot_set[j].getAttribute("class_constraint");
						console.log(desire);
						e_desire.push(desire);//重視する欲求のテキスト配列
          }else if(slot_set[j].getAttribute("role") == "欲求"){
						const desire = slot_set[j].getAttribute("class_constraint");
						console.log(desire);
						s_desire.push(desire);//欲求のテキスト配列
          }
        }
      }
    }
  }
	console.log(e_desire);
	console.log(s_desire);


	//重視する欲求に対応する目標を取得＋表示
	for(i=0; i<$slot_tag.length; i++){
		if($slot_tag[i].getAttribute("role") == "学習者が設定すべき目標"){
			for(j=0; j<e_desire.length; j++){
				if(e_desire[j] == $slot_tag[i].parentElement.parentElement.firstElementChild.innerHTML){
					const perspective = $slot_tag[i].getAttribute("class_constraint");
					console.log(perspective);
					const label = "<input type='checkbox' class='model' value='"+perspective+"' checked>"+
					              ""+perspective+"<br>";
					area.append(label);
					e_attribute.push(perspective);
				}
			}
		}
	}

	//欲求に対応する目標を取得＋表示
	for(i=0; i<$slot_tag.length; i++){
		if($slot_tag[i].getAttribute("role") == "学習者が設定すべき目標"){
			for(k=0; k<e_desire.length; k++){
				if(s_desire[k] == $slot_tag[i].parentElement.parentElement.firstElementChild.innerHTML){
					const perspective = $slot_tag[i].getAttribute("class_constraint");
					console.log(perspective);
					const label = "<input type='checkbox' class='sub_model' value='"+perspective+"'>"+
					              ""+perspective+""+
					              "<br>";
					area.append(label);
					attribute.push(perspective);
				}
			}
		}
	}



  //その他の目標を追加する
  var sub_goal = [];
  const all_attribute = e_attribute.concat(attribute);//聴衆モデルに関連する全ての目標
  console.log(all_attribute);
	//全ての（複合）目標
	for(i=0; i<$slot_tag.length; i++){
    const role = $slot_tag[i].getAttribute("role");
    if(role == "サブ目標" && $slot_tag[i].getAttribute("num") == "1"){
      sub_goal.push($slot_tag[i].parentNode.parentNode.firstElementChild.innerHTML);
    }
  }
  sub_goal = [...new Set(sub_goal)];//重複の削除
  console.log(sub_goal);
	//差分を取ることで，聴衆モデルに関連しない目標を取得
  let result = sub_goal.filter(itemA => all_attribute.indexOf(itemA) == -1);
  console.log(result);

  for(i=0; i<result.length; i++){
    const label = "<input type='checkbox' class='sub_model' value='"+result[i]+"'>"+
                  ""+result[i]+""+
                  "<br>";
    sub_area.append(label);
  }

}
