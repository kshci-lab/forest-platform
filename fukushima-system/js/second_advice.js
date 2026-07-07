//問いエリアの初期化とhozo.xmlの読み込み
function second_xmlLoad(){

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:second_parse_xml

	});

}


// hozo.xmlのパースが成功した場合に，<W_CONCEPTS>のそれぞれに指定関数を適用
function second_parse_xml(xml,status){
	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(second_disp);
}

var final_perspec = [];//「聴衆モデルに定義されている聴衆の観点」のうち，学習者が設定している聴衆の観点（1度目の助言提示を終えたタイミング）
let first_advice_dom;//1回目の助言のDOM
var $scenario_concept_id = [];//プレゼンシナリオに含まれているコンセプトIDの集合
var checktoadvice3;

// HTML生成関数
async function second_disp(){

  first_advice_dom = document.getElementById("macro_feedback_area");
  for(var i=first_advice_dom.childNodes.length - 1; i>=0; i--){//1回目の助言の表示を消去
    first_advice_dom.removeChild(first_advice_dom.childNodes[i]);
  }

	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT');
	var $label = $(this).find('LABEL');
	var $isa = $(this).find('ISA');
	var $slot_tag = $(this).find('SLOT');

	console.log($audience_model);//　聴衆モデル（教員）のconceptID //発表の場を選択したときに取得
	console.log(audience_name);//学習者が選択した聴衆モデルの名前
	console.log($goal);// 学習者が選択した聴衆の観点（オントロジーで定義済みのもの）
  console.log($scenario_concept_id);//プレゼンシナリオに含まれているコンセプトIDの集合

  let area = $("#macro_feedback_area");//助言提示エリア
  var cspan_dom = document.getElementsByClassName("cspan");
  var $scenario_concept = [];
  for(var i=0; i<cspan_dom.length; i++){//プレゼンシナリオに含まれるコンテンツのコンセプトIDを取得（重複あり）
    var cspan_nid = cspan_dom[i].getAttribute("node_id");
    // console.log(cspan_nid);
		var cspan_cid = cspan_dom[i].getAttribute("concept_id");
    if(cspan_cid != ""){
      $scenario_concept.push(cspan_cid);
    }
  }
  // console.log($scenario_concept);
  $scenario_concept_id = [...new Set($scenario_concept)];//重複の削除
  // console.log($scenario_concept_id);

  // for(var i=0; i<$goal.length; i++){
  //   for(var j=0; j<perspec.length; j++){
  //     if($goal[i][1]==perspec[j][1]){
  //       break;
  //     }
  //   }
  //   if(j!=perspec.length){
  //     final_perspec.push($goal[i]);
  //   }
  // }
  // console.log(final_perspec);







  var s_count = 0;

  label = "<h2>プレゼンシナリオの検討を促す助言</h2>";
  area.append(label);


	function Get_inquiry(string){//〇〇を考える（文字列）から〇〇はどのようなものですか？（文字列）を取得する関数
		for(var i=0; i<$isa.length; i++){
			if($isa[i].getAttribute("parent") == string){
				var tmp_inq = $isa[i].getAttribute("child");
			}
			for(var j=0; j<$label.length; j++){
				if($label[j].innerHTML == tmp_inq && $concept_tag[j].getAttribute("instantiation") == "true"){
					var inq = tmp_inq;
				}
			}
		}
		return inq;
	}

	function FromName_toCid(name){// 名前（〇〇を考える）からそのコンセプトIDを取得する
		for(var i=0; i<$concept_tag.length; i++){
			if($label[i].innerHTML == name){
				// console.log($concept_tag[i].id);
				return $concept_tag[i].id;
			}
		}
	}

	function FromOutput_toCid(string){//成果物からその認知活動のコンセプトIDを取得
		for(var i=0; i<$slot_tag.length; i++){
			if($slot_tag[i].getAttribute("class_constraint")==string && $slot_tag[i].getAttribute("role")=="出力"){
				// console.log($slot_tag[i].closest("CONCEPT"));
				var concept_dom = $slot_tag[i].closest("CONCEPT");
				return concept_dom.id;
			}
		}
	}

	function CheckToAvice(cid){
		for(var i=0; i<$scenario_concept_id.length; i++){//あるノードがプレゼンシナリオに含まれているかのチェック
      if($scenario_concept_id[i] == cid){
        // console.log($scenario_concept_id[i]);
				// console.log(cid);
				return true;
      }
    }
		return false;
	}

	//特定のノードの下につく特定のノード（学習者の抱える困難性は？ー具体例はどのようなものですか？）がプレゼンシナリオに含まれているかのチェック
	function CheckToAdvice2(cid, out_cid){//cid:具体例を考えるのコンセプトID，　out_cid:学習者の抱える困難性を考えるのCID
		var jmnode = document.getElementsByTagName("jmnode");
    var parent_id = [];
    var orig_id = [];
    var target_id = [];
    for(var i=0; i<jmnode.length; i++){
      if(jmnode[i].getAttribute("concept_id") == cid && jmnode[i].getAttribute("type") == "toi"){
        parent_id.push(jmnode[i].getAttribute("parent_id"));
        orig_id.push(jmnode[i].getAttribute("nodeid"));
      }
    }
    // console.log(parent_id);
    // console.log(orig_id);

    for(var i=0; i<jmnode.length; i++){
      for(var j=0; j<parent_id.length; j++){
        if(jmnode[i].getAttribute("nodeid") == parent_id[j] && jmnode[i].getAttribute("concept_id")==out_cid){
          // console.log(jmnode[i]);
					target_id.push(orig_id[j]);
        }
      }
    }
    // console.log(target_id);

    var cdom = document.getElementsByClassName("cspan");
    for(var i=0; i<cdom.length; i++){
      for(var j=0; j<target_id.length; j++){
        if(cdom[i].getAttribute("node_id") == target_id[j]){
          return true;//プレゼンシナリオにある場合
        }
      }
    }
		return false;
	}

	// シナリオ上で親子関係が存在するかの確認
	function CheckToAdvice2_2(cid, out_cid){//cid:具体例を考えるのコンセプトID，　out_cid:学習者の抱える困難性を考えるのCID
		// console.log(cid, out_cid);
		var cdom = document.getElementsByClassName("cspan");
		for(m=0; m<cdom.length; m++){
			const nid = cdom[m].getAttribute("node_id");

			// const concept_id = GetConceptId(nid);
			const concept_id = cdom[m].getAttribute("concept_id");
			// console.log(cdom[m]);
			// console.log(concept_id, out_cid);
			if(concept_id == out_cid){
				// console.log(cdom[m].parentNode.parentNode.parentNode);
				const thread_tmp = cdom[m].parentNode.parentNode.parentNode.getElementsByClassName("cspan");
				var toi_array = [];
				for(j=0; j<thread_tmp.length; j++){
					if(thread_tmp[j].getAttribute("type") == "toi"){
						toi_array.push(thread_tmp[j]);
					}
				}
				for(k=0; k<toi_array.length; k++){//本当はインデント情報も確認する必要あり
					if(k<(toi_array.length-1)){
						const t_nid = toi_array[k].getAttribute("node_id");
						// const t_concept = GetConceptId(t_nid);
						const t_concept = toi_array[k].getAttribute("concept_id");
						// console.log(toi_array[k+1]);
						const m_nid = toi_array[k+1].getAttribute("node_id");
						// console.log(m_nid);
						// const m_concept = GetConceptId(m_nid);
						const m_concept = toi_array[k+1].getAttribute("concept_id");
						// console.log(t_concept, out_cid);
						// console.log(m_concept);
						// console.log(cid);
						if(t_concept == out_cid && m_concept == cid){
							return true;
						}
					}
				}
			}
		}
		return false;
	}


	async function CheckToAdvice3(cid1, cid2){
		await $.ajax({
		    url: "php/rationality_check.php",
		    type: "POST",
		    success: function(arr){//DBに格納している合理性ノードの情報を全て取得

	        if(arr == "[]"){
	          // console.log(arr);
						checktoadvice3 = false;
						return false;
	        }else{
	          // console.log(arr);
	          var parse = JSON.parse(arr);//「合理性ノードのnodeid」と「合理性ノードの要素ノードの片割れのnodeid」のでセット
	          console.log(parse);

						var all_array = [];
						var ratio_array = [];
						var jmnode = document.getElementsByTagName("jmnode");

						for(let i=0; i<parse.length; i++){
						  for(var j=0; j<jmnode.length; j++){
								// console.log(jmnode[j].getAttribute('nodeid'));
								if(parse[i].node_id == jmnode[j].getAttribute('nodeid')){
									all_array.push(parse[i]);
									ratio_array.push(parse[i].rationality_id);
								}
						  }
						}
						console.log(all_array, all_array.length);
						ratio_array = [...new Set(ratio_array)];
						console.log(ratio_array);



						let tmp_array = [];
						let final_array = [];
						for(let i=0; i<ratio_array.length; i++){
							for(let j=0; j<all_array.length; j++){
								if(ratio_array[i] == all_array[j].rationality_id){
									tmp_array.push([all_array[j].rationality_id, all_array[j].node_id]);
								}
							}
							final_array.push(tmp_array);
							tmp_array = [];
						}
						// console.log(final_array);

						let fp_array = [];
						for(let i=0; i<final_array.length; i++){
							if(!(final_array[i].length<2)){
								fp_array.push(final_array[i]);
							}
						}
						// console.log(fp_array);

						let main_nodeid;
						for(let i=0; i<fp_array.length; i++){
								const element1 = GetConceptId(fp_array[i][0][1]);
								const element2 = GetConceptId(fp_array[i][1][1]);
								// console.log(fp_array[i][0][1], fp_array[i][1][1]);
								// console.log(element1, element2);
								// console.log(cid1, cid2);
								if((element1 == cid1 && element2 == cid2) || (element1 == cid2 && element2 == cid1)){
									main_nodeid = fp_array[i][0][0];
									// console.log(main_nodeid);
									break
								}
						}

						if(main_nodeid){
							const cpdom = document.getElementsByClassName("cspan");
							for(let i=0; i<cpdom.length; i++){
								if(cpdom[i].getAttribute("node_id") == main_nodeid){
									// console.log();
									checktoadvice3 = true;
									console.log(checktoadvice3);
									return true;
								}
							}
						}

						checktoadvice3 = false;
						console.log(checktoadvice3);
						return false;
					}
		    },
	      error:function(){
	        console.log("エラーです");
	      }
		});
	}

	function CidtoAns(cid){//コンセプトIDからアンサーノードの中身を取得
		var c_dom = document.getElementsByClassName("cspan");
		// console.log(cid);
	  for(var i=0; i<c_dom.length; i++){//プレゼンシナリオの検索
	    // console.log(c_dom[i].getAttribute("node_id"));
			// console.log(c_dom[i].getAttribute("type"));
			var tmp = c_dom[i].getAttribute("node_id");
			// var domcid = GetConceptId(tmp);
			var domcid = c_dom[i].getAttribute("concept_id");
			// console.log(domcid);
			var dom_type = c_dom[i].getAttribute("type");
			if(domcid == cid && dom_type == "answer"){
				var answer = c_dom[i].innerHTML;
				// console.log(answer);
				return answer;
			}
	  }
		var jmnode = document.getElementsByTagName("jmnode");
		for(var i=0; i<jmnode.length; i++){
			jm_cid = jmnode[i].getAttribute("concept_id");
			var jm_type = jmnode[i].getAttribute("type");
			if(jm_cid == cid && jm_type == "answer"){
				var answer = jmnode[i].innerHTML;
				// console.log(answer);
				return answer;
			}
		}
		var fin = "未記述";
		return fin;
	}


	var second_goal = [];
	// console.log($goal);
	//サブ目標を取得
	for(i=0; i<$goal.length; i++){//　取得→[[研究の骨子について納得を得ること，　"学習者の抱える困難性の具体例を通じて，着目した問題に共感を得ること"]・・・]
		for(j=0; j<$label.length; j++){
			if($goal[i] == $label[j].innerHTML){
				// console.log($label[j].parentNode);
				const slot = $label[j].parentNode.getElementsByTagName("SLOT");
				for(k=0; k<slot.length; k++){
					// console.log(slot[k].getAttribute("class_constraint"));
					second_goal.push([$goal[i], slot[k].getAttribute("class_constraint")]);
				}
			}
		}
	}
	// console.log(second_goal);
	var second_element = [];// [[複合目標，　サブ目標，　パターン(0,1,2), 認知活動，　部分概念（入力）]・・]

	//サブ目標ごとにテンプレパターンを調べる（second_elementを取得）
	for(i=0; i<second_goal.length; i++){
		for(j=0; j<$label.length; j++){
			if(second_goal[i][1] == $label[j].innerHTML){//サブ目標のDOM取得
				// console.log($label[j].parentNode);
				// console.log($label[j].parentNode.getElementsByTagName("SLOT"));
				const tmp = $label[j].parentNode.getElementsByTagName("SLOT");
				for(k=0; k<tmp.length; k++){//サブ目標の部分概念を取得
					// console.log(tmp[k].getAttribute("role"));
					if(tmp[k].getAttribute("role") == "認知活動" || tmp[k].getAttribute("role") == "メタ認知活動"){
						var tmp_array = [];
						// console.log(tmp[k].getAttribute("class_constraint"));
						// console.log(tmp[k].getElementsByTagName("SLOT").length);
						const leng = tmp[k].getElementsByTagName("SLOT");
						tmp_array.push(second_goal[i][0], second_goal[i][1], leng.length, tmp[k].getAttribute("class_constraint"));
						// console.log(tmp_array);
						for(l=0; l<leng.length; l++){
							// console.log(leng[l].getAttribute("class_constraint"));
							tmp_array.push(leng[l].getAttribute("class_constraint"));
						}
						second_element.push(tmp_array);
					}
				}
			}
		}
	}
	// console.log(second_element);

	for(i=0; i<second_element.length; i++){
		if(second_element[i][2] == 0){//パターン０（認知活動一つの時）の場合
			const name = second_element[i][3];
			const cid = FromName_toCid(name);
			const tf_check = CheckToAvice(cid);
			// console.log(tf_check);
			if(!(tf_check)){
				var inquiry = Get_inquiry(second_element[i][3]);
				const random = Math.random().toString(32).substring(2);
				label = "<div class='first_model'>"+
	                "<p class='m_ad'><span class='ad_font'>・「"+second_element[i][0]+"」という目標を達成するためには，<span style ='font-weight:bold;'>「"+second_element[i][1]+"」</span>が必要ですが，"+
	                "<span style ='font-weight:bold;'>「"+inquiry+"」</span>といったことがあなたのプレゼンシナリオには含まれていないかもしれません．これについて見直してみてはいかがでしょうか？</span></p>"+
	                "<span><input class='f_ad' type='radio' name='"+random+"' value='見直す' onchange='re_check(this)'>見直す</span>"+
	                "<span><input class='f_ad' type='radio' name='"+random+"' value='見直さない' onchange='Not_re_check(this)'>見直さない</span>"+
	                "<br/>"+
	                "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'></textarea>"+
	              "</div>"+
	              "<br/>";
	      area.append(label);
				s_count++;
			}
		}else if(second_element[i][2] == 1){//パターン1（成果物を入力に持つ認知活動の時）の場合
			// console.log(second_element[i]);
			const cid = FromName_toCid(second_element[i][3]);
			const out_cid = FromOutput_toCid(second_element[i][4]);
			// console.log(cid, out_cid);
			const tf_check = CheckToAdvice2(cid, out_cid);
			if(!(tf_check)){
				const tf = CheckToAdvice2_2(cid, out_cid);//シナリオ上で連鎖しているかのチェック
				// console.log(tf);
				if(!(tf)){
					// console.log("確認");
					// console.log(second_element[i]);
					var inquiry = Get_inquiry(second_element[i][3]);
					const random = Math.random().toString(32).substring(2);
					const tmp = FromOutput_toCid(second_element[i][4]);
					const node_content = CidtoAns(tmp);
					label = "<div class='first_model'>"+
		                "<p class='m_ad'><span class='ad_font'>・「"+second_element[i][0]+"」という目標を達成するためには，<span style ='font-weight:bold;'>「"+second_element[i][1]+"」</span>が必要ですが，"+
		                "<span style ='font-weight:bold;'>"+second_element[i][4]+"("+node_content+")</span>に関して<span style ='font-weight:bold;'>「"+inquiry+"」</span>といったことがあなたのプレゼンシナリオには含まれていないかもしれません．これについて見直してみてはいかがでしょうか？</span></p>"+
		                "<span><input class='f_ad' type='radio' name='"+random+"' value='見直す' onchange='re_check(this)'>見直す</span>"+
		                "<span><input class='f_ad' type='radio' name='"+random+"' value='見直さない' onchange='Not_re_check(this)'>見直さない</span>"+
		                "<br/>"+
		                "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'></textarea>"+
		              "</div>"+
		              "<br/>";
		      area.append(label);
					s_count++;
				}
			}
		}else if(second_element[i][2] == 2){
			// console.log("patern2", second_element[i]);
			const first_id = FromName_toCid(second_element[i][4]);
			const second_id = FromName_toCid(second_element[i][5]);
	    // const tf = await CheckToAdvice3(first_id, second_id);//合理性のチェック
			// const tf = await CheckToAdvice3(first_id, second_id);//合理性のチェック
			await CheckToAdvice3(first_id, second_id).then(() => {
	      // console.log(checktoadvice3);
				if(!checktoadvice3){
					console.log("シナリオに含まれていなかった場合");
					var inquiry1 = Get_inquiry(second_element[i][4]);
					var inquiry2 = Get_inquiry(second_element[i][5]);
					const random = Math.random().toString(32).substring(2);
					const tmp1 = FromName_toCid(second_element[i][4]);
					const node_content1 = CidtoAns(tmp1);
					const tmp2 = FromName_toCid(second_element[i][5]);
					const node_content2 = CidtoAns(tmp2);
					label = "<div class='first_model'>"+
		                "<p class='m_ad'><span class='ad_font'>・「"+second_element[i][0]+"」という目標を達成するためには，<span style ='font-weight:bold;'>「"+second_element[i][1]+"」</span>が必要ですが，"+
		                "<span style ='font-weight:bold;'>「"+inquiry1+"("+node_content1+")」</span>と<span style ='font-weight:bold;'>「"+inquiry2+"("+node_content2+")」</span>に関して<span style ='font-weight:bold;'>「なぜこれらは合理的であるといえるのですか？」</span>といったことがあなたのプレゼンシナリオには含まれていないかもしれません．これについて見直してみてはいかがでしょうか？</span></p>"+
		                "<span><input class='f_ad' type='radio' name='"+random+"' value='見直す' onchange='re_check(this)'>見直す</span>"+
		                "<span><input class='f_ad' type='radio' name='"+random+"' value='見直さない' onchange='Not_re_check(this)'>見直さない</span>"+
		                "<br/>"+
		                "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'></textarea>"+
		              "</div>"+
		              "<br/>";
		      area.append(label);
					s_count++;
				}
	    });
		}
	}





  var done_btn = "<br/>"+
                 "<div id='second_done_btn'>"+
                    "<input type='button' value='リフレクション活動へ' onclick='MoveThird()'>"+
                 "</div>";
  area.append(done_btn);


  if(s_count == 0){
    MoveThird();
  }

}
