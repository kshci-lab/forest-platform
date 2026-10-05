//問いエリアの初期化とhozo.xmlの読み込み
function macrolevel_xmlLoad(){

	if($goal.length === 0 && $add_goal.length === 0 && $sub_goal.length === 0){
		window.alert("目標の設定を完了させてください");
	}else{

		const result = confirm('アンケート用紙1の回答をよろしくお願いします．以下のリンク先にアンケートファイルがあるので，ローカルに保存して回答してください．回答が終われば，システムからの助言(システム下部に表示)に沿って活動を進めてください．https://1drv.ms/u/s!Am39JzOgDfpjnGqx4EIvYb2M7aqb?e=XWO6qF');

		if(result) {
		  //はいを選んだときの処理
			Hide_fin_btn();//設計終了ボタンと主題編集ボタンを非表示
			// FinishAlert();
			Get_SlideRank();//スライドの順番をDB保存
			Get_ContentRank();//コンテンツの順番をDB保存
			Get_SlideTitle();//シナリオタイトルをDB保存
			Record_Timing("目標の助言提示");//[slide_content_activity]テーブルに目標設定の検討を促す助言が提示したタイミングを記録する

			$.ajax({
				url:'js/hozo.xml',
				type:'get',
				dataType:'xml',
				timeout:1000,
				success:macrolevel_parse_xml
			});
		} else {
		 //いいえを選んだときの処理
		}
	}
}


function Pair_concept(text, $slot_tag){//二次元配列を取得，[[複合目標，欲求]・・]
	const parent_array = [];
	console.log(text);
	for(i=0; i<text.length; i++){
		for(j=0; j<$slot_tag.length; j++){
			if($slot_tag[j].getAttribute("role") == "学習者が設定すべき目標" && $slot_tag[j].getAttribute("class_constraint") == text[i]){
				console.log(text[i], $slot_tag[j].parentElement.parentElement.firstElementChild.innerHTML);
				parent_array.push([text[i],$slot_tag[j].parentElement.parentElement.firstElementChild.innerHTML]);
			}
		}
	}
	console.log(parent_array);
	return parent_array;
}


// hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
function macrolevel_parse_xml(xml,status){
	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(macrolevel_disp);
}

var array_tmp = [];//学習者が選択すべきなのに，できていない聴衆の観点（のコンセプトIDとテキスト）を格納する変数

// HTML生成関数
function macrolevel_disp(){

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

	console.log(audience_name);//　聴衆モデルの名前 //発表の場を選択したときに取得
	console.log(e_attribute);//聴衆モデルの重視する目標
	console.log($goal);// 学習者が選択した目標(重視する)テキストの配列（オントロジーで定義済みのもの）

	let result = e_attribute.filter(itemA => $goal.indexOf(itemA) == -1);//引き算：　e_attribute - $goal
  console.log(result.length);

	if(result.length != 0){
		const cp_array = Pair_concept(result, $slot_tag);//[[複合目標，欲求]・・]のペアを取得（テキストデータ）
		console.log(cp_array);
		//親ノードのテキストも取得
		var concept;//目標
		var perspect;//欲求

		let area = $("#macro_feedback_area");
		const label = "<h2>目標設定の検討を促す助言</h2>";
		area.append(label);

		for(i=0; i<cp_array.length; i++){
			concept = cp_array[i][0];//目標
			perspect = cp_array[i][1];//欲求
			const label = "<div class='first_model' perspect='"+perspect+"' concept='"+concept+"'>"+
								"<p class='m_ad'><span class='ad_font'>・"+audience_name+"における聴衆は特に，<span style ='font-weight:bold;'>「"+perspect+"」</span>と考えます．"+
								"聴衆から理解を得るために，<span style ='font-weight:bold;'>「"+concept+"」</span>を目標として設定する必要はありませんか？</span></p>"+
								"<span><input class='f_ad' name='"+concept+"' type='radio' value='必要ある' onchange='Need_check(this);'>必要ある</span>"+
								"<span><input class='f_ad' name='"+concept+"' type='radio' value='必要ない' onchange='NotNeed_check(this);'>必要ない</span>"+
								"<br/>"+
								// "<span>主題に沿った内容であるか，プレゼンシナリオを見直してみましょう</span>"+
								"<textarea class='t_ad' placeholder='修正内容 OR 必要ない理由' style='width:600px; height:120px;'></textarea>"+
							"</div>"+
							"<br/>";
			area.append(label);
		}
		var done_btn = "<br/>"+
									 "<div id='done_btn'>"+
											"<input type='button' value='次へ' onclick='MoveSecond()'>"+
									 "</div>";
		area.append(done_btn);

	}else{
		MoveSecond();
	}

}
