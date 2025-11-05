//presentation

//---------------------- スライドを作成する---------------------------------------
var color_count=0;
var obj;
var target;
var thread_concept_id = [];
//var soccer;
var micro_concept_id = [];//各スライドごとのコンセプトIDを取得して格納する変数
var $global_advice = [];
var $slide_topic = [];
//2022-11-23 shimizu
var Base_ClassLabeltoConceptID = {}; //Base側のIDを引数にKey：クラスのラベル，Value:クラスのid（成果物）
var Action_ConceptIDtoClassLabel = {};//Action側のIDを引数にKey：クラスのID，Value:クラスの出力（成果物）
var Logic_ClassLabeltoConceptID = {}; //論理構成意図を出力時に使用，Key:クラスのラベル, Value：クラスのid
var Base_IndexNumberToClassLabel = {}; //Key:インデックス番号，Value：クラスのラベル
var Action_IndexNumberToClassLabel = {};//Key:インデックス番号，Value:クラスのラベル
var Output_LogicConceptToLogicRelation = {}; //Key：論理構成意図，Value：関係性（同じValueが二つずつある．前提ー合理性，提案ー合理性）
var OutputLabel_ClassConceptID = {}; //Key：関係性ラベル（合理性，妥当性），Value：クラスのid（1234〜_n12)
var ConceptID_ClassLabel = {};
var BadgeID_InstanceID = {};
//2022-12-14 論理関係を決定するために用意．
var Count_LogicRelationLabel = {};
var Count_LogicRelationNodes = {};
var Count_LogicRelationConceptID = {};

var SlideID_DCR_LINumber = {};
//2022-12-14 論理関係の数を設定


//2022-12-09 shimizu
var ClickNodeIDs = [];
var ClassConceptIDs = [];

var Select_LogicConcept = [];
var Select_LogicConceptNode = [];
// 文章IDのランダム生成関数
// 引数を指定してあげれば乱数の桁数が増えるらしい
function getUniqueStr(myStrong){
 var strong = 1000;
 if (myStrong) strong = myStrong;
 return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16);
 // 返り値がユニークID
}

// 法造のデータを探索するのに使用する変数群
// 他の関数でも使い回すのでここで定義
var $concept_tag = [];
var $label = [];
var $slot_tag = [];

var input_name = [];
var slot_id = "";

var $concept_tag_html = [];
var $concept_tag_slot = [];

// 法造のデータを取得
function HozoDataGet(){
	$.ajax({
		url:'./js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:3000, //ちょっと待つ
		success: function(xml){ // ajax成功なら返り値（xmlデータ）を渡す
      $(xml).find('W_CONCEPTS').each(function(){
          // 各要素を変数に格納
          // ここで，$concept_tagと$labelの数は一致する（概念には必ずラベルがついている）
        	$concept_tag = $(this).find('CONCEPT'); // 概念ごとのひとかたまりの情報
        	$label = $(this).find('LABEL'); // 「共有」「前提」などの文字情報
        	$slot_tag = $(this).find('SLOT'); //　スロット情報

          input_name = [];
          slot_id = "";

          $concept_tag_html = [];
          $concept_tag_slot = [];

          // 各コンセプトIDが持つスロットを格納する
          // 同じ[x]を用いることで，その概念が持つスロットを呼び出せるようにする
          for(var x=0; x<$concept_tag.length; x++){
            $concept_tag_html[x] = $concept_tag[x].innerHTML;
            $concept_tag_slot[x] = $($concept_tag_html[x]).find('SLOT');
          }
          // console.log($concept_tag_slot[242][1]); // ある特定のスロット情報
      })
    }
	});
}

// nodeIDを引数にしてconceptIDを取得する関数
function GetConceptId(nodeID){
  var node_obj = document.getElementsByTagName("jmnode");
  var conceptID = "default";

  for(let k=0; k<node_obj.length; k++){
    if(node_obj[k].getAttribute("nodeid") == nodeID){//回ってきたidが選択中ノードの時
      conceptID = node_obj[k].getAttribute("concept_id");//コンセプトid
      console.log(conceptID);
    }
    if(conceptID != "default"){//同じコンセプトIDがいくつか存在するから
      break;
    }
  }
  return conceptID;
}



$(document).on('click', '.thread', function(){
  if(event.shiftKey == false){
    //シフトキーを押していない時

    // マインドマップの選択状況をリセット
    var jmnode = document.getElementsByTagName("jmnode");
    var ThreadAll =document.getElementsByClassName("thread");
    for(var i=0; i<jmnode.length; i++){
        jmnode[i].style.border = "0px solid #000";
        if(jmnode[i].getAttribute("type") == "answer"){//答えノードの時
          jmnode[i].style.backgroundColor = "#ffa500";
        }
    }
    //jm.reset();
    // console.log(obj);
    //色の変更
    if(color_count>0){
      obj.style.backgroundColor = 'white';//灰色
      obj.style.border = "solid 0.7px black";
      obj.style.boxShadow = "";
    }
    for(var i=0;i<ThreadAll.length;i++){
      ThreadAll[i].style.backgroundColor ='white';
      ThreadAll[i].style.border = "solid 0.7px black";
      ThreadAll[i].style.boxShadow = ""
    }
    target = this.id
    // console.log(target);
    obj = document.getElementById(target);
    // console.log(obj);s
    // obj.style.backgroundColor = '#a9a9a9';//水色（選択中）
    // $('#'+target).animate({shadow: '3 3 3px', top:3), 'fast'});
    obj.style.border = "outset 5px black";
    obj.style.boxShadow = "5px 5px 5px gray";
    color_count += 1;

    // //テキストエリアの初期化
    // document.getElementById('advice_frame').textContent = "";

    //20230130 shimizu
    var doc_node_id;
    const c_scenario = document.getElementsByClassName("cspan");
    // console.log(c_scenario);
    for(var i=0; i<c_scenario.length; i++){
      // console.log(c_scenario[i].style.border);
      if(c_scenario[i].style.border == "2px solid gray"){
        doc_node_id = c_scenario[i].getAttribute("node_id");
        console.log(doc_node_id);
      }
    }

    // console.log($('#'+target).data('node_id'));
    var arr = $('#'+target).data('node_id');//nodeidの配列
    // console.log(arr);
    // console.log(arr[0]);
    micro_concept_id = [];
    // console.log(micro_concept_id[0]);

    for(i=0; i<jmnode.length; i++){
      jmnode[i].style.border = "";
    }

    for(m=0; m<arr.length; m++){
      for(i=0; i<jmnode.length; i++){
        // console.log(m);
        // console.log(arr[m]);
        if(jmnode[i].getAttribute("nodeid") == doc_node_id){//回ってきたidが選択中ノードの時
            // console.log(jmnode[i]);
            // console.log(jmnode[i].innerHTML);
            micro_concept_id[m] = jmnode[i].getAttribute("concept_id");//コンセプトidを代入（答えノードは問いのコンセプトidを持つ）
            jmnode[i].style.backgroundColor = "#ff69b4";
            jmnode[i].style.border = "3px solid #444444";
        }
        if(micro_concept_id[m] != undefined){//同じコンセプトIDがいくつか存在するから
          break;
        }
      }
      // console.log(micro_concept_id);

    }
  }else{
    // console.log("シフトキーを押している");

    // マインドマップの選択状況をリセット
    var jmnode = document.getElementsByTagName("jmnode");
    
    // console.log(obj);
    //色の変更
    // if(color_count>0){
    //   // obj.style.backgroundColor = 'white';//灰色
    //   // obj.style.border = "solid 0.7px black";
    //   // obj.style.boxShadow = "";
    // }
    target = this.id
    obj = document.getElementById(target);
    //obj.style.backgroundColor = '#a9a9a9';//水色（選択中）
    // $('#'+target).animate({shadow: '3 3 3px', top:3), 'fast'});
    obj.style.border = "outset 5px black";
    obj.style.boxShadow = "5px 5px 5px gray";
    color_count += 1;

    // //テキストエリアの初期化
    // document.getElementById('advice_frame').textContent = "";

    //コンセプトid取得+micro.js

    // console.log($('#'+target).data('node_id'));
    var arr = $('#'+target).data('node_id');//nodeidの配列
    // console.log(arr);
    // console.log(arr[0]);

    micro_concept_id = [];
    // console.log(micro_concept_id[0]);


    for(i=0; i<jmnode.length; i++){
      jmnode[i].style.border = "";
    }

    for(m=0; m<arr.length; m++){
      for(i=0; i<jmnode.length; i++){
        if(jmnode[i].getAttribute("nodeid") == arr[m]){//回ってきたidが選択中ノードの時
            // console.log(jmnode[i]);
            micro_concept_id[m] = jmnode[i].getAttribute("concept_id");//コンセプトidを代入（答えノードは問いのコンセプトidを持つ）
            // jmnode[i].style.backgroundColor = "#ff69b4";
            jmnode[i].style.border = "3px solid #444444";
        }
        if(micro_concept_id[m] != undefined){//同じコンセプトIDがいくつか存在するから
          break;
        }
      }
      // console.log(micro_concept_id);

    }
  }
    

});

//別のスライドをクリックした時には，ノードの選択を外す
$(document).on('click', '.thread', function(){
  const thread = this;
  var dom_all = document.getElementsByClassName("cspan");
  for(var i=0; i<dom_all.length; i++){
    //ノードの背景色を全体統一
    if(dom_all[i].getAttribute("type") == "toi"){
      // dom_all[i].style.backgroundColor = "#d3d3d3";
      dom_all[i].style.backgroundColor = "#ffffff";
    }else{
      // dom_all[i].style.backgroundColor = "#d3d3d3";
      dom_all[i].style.backgroundColor = "#ffffff";
    }
    //選択中のノードを確認
    if(dom_all[i].style.border == "2px solid gray"){
      var c_dom = dom_all[i];
    }
  }
  if(c_dom){
    const th_dom = c_dom.closest(".thread");
    console.log("選択中の子ノードがあるスライド："+th_dom.id);
    console.log("クリックしたスライド："+thread.id);
    if(th_dom.id != thread.id){
      const dom_tmp = document.getElementsByClassName("cspan");
      for(var i=0; i<dom_tmp.length; i++){
        dom_tmp[i].style.border = "";
      }
    }
  }

  var badge_all = document.getElementsByClassName("badge");
  for(var j=0;j<badge_all.length;j++){
    badge_all[j].style.border = "";
  }

});

$(document).on('click', '.cspan', function(){
  if(event.shiftKey){
    // console.log(`Shift + Click`);
    var dom_all = document.getElementsByClassName("cspan");
    for(var i=0; i<dom_all.length; i++){
      //選択中のノードを確認
      if(dom_all[i].style.border == "2px solid gray"){
        var c_dom = dom_all[i];
        console.log(c_dom);
        var c_dom_id = dom_all[i].getAttribute("id");
        console.log(c_dom_id);
        ClickNodeIDs.push(c_dom_id);
      }
    }
    var dom = this;
    console.log(dom);
    dom.style.border = "2px solid gray";
    var dom_id = this.getAttribute("id");
    console.log(dom_id);
    ClickNodeIDs.push(dom_id);
    // console.log(ClickNodeIDs);
    for(var l=0; l<ClickNodeIDs.length; l++){
      var textarea_id = "SelectBox-"+ClickNodeIDs[l]; 
      var LogicSelectBox = document.getElementById(textarea_id);
      var LogicSelected = LogicSelectBox.selectedIndex;
      console.log(LogicSelectBox);
      console.log(LogicSelected);//選択しているインデックス番号を取得
      console.log(Base_IndexNumberToClassLabel[LogicSelected]);
    }
      
    var badge_all = document.getElementsByClassName("badge");
    for(var j=0;j<badge_all.length;j++){
      badge_all[j].style.border = "";
    }


    recommend_xmlLoad();
    $('#mind_all').hide();
    $('#presen_all').show();
  }
  else{
    this.focus();
    var dom_all = document.getElementsByClassName("cspan");
    for(var i=0; i<dom_all.length; i++){
    dom_all[i].style.border = "";
    }
    
    var dom = this;
    console.log(dom);
    
    dom.style.border = "2px solid gray";
    dom.style.backgroundColor = "#d3d3d3"
    recommend_xmlLoad();
    $('#mind_all').hide();
    $('#presen_all').show();
  }
  
});

$(document).on('click', '.tspan', function(){
  this.focus();
});

$(document).on('click', '.badge', function(){
  this.focus();
  console.log("バッジクリック");
  var badge_all = document.getElementsByClassName("badge");
  for(var j=0;j<badge_all.length;j++){
    badge_all[j].style.border = "";
  }

  var dom = this;
  console.log(dom);
  dom.style.border = "5px solid gray";
  // dom.style.backgroundColor = "#d3d3d3"

});

$(document).on('dblclick', '.badge', async function(){
  this.focus();
  console.log("バッジ ダブルクリック");
  var badge_all = document.getElementsByClassName("badge");
  for(var j=0;j<badge_all.length;j++){
    badge_all[j].style.border = "";
  }

  var dom = this;
  console.log(dom);
  console.log(dom.className);
  dom.style.border = "5px solid gray";
  // dom.style.backgroundColor = "#d3d3d3"

  if(dom.className == "badge bg-red"){

    console.log("スライド間の関係性を確認");
    var Slide_all = document.getElementsByClassName('thread');
    await $.ajax({
      url: "php/get_LogicSlideRelation.php",
      type: "POST",
      success: function(arr){

        var RelationSlideID_1 = [];
        var RelationSlideID_2 = [];
        if(arr == "[]"){
          console.log("何もなし");
        }else{
          var parse = JSON.parse(arr);
          console.log(parse);
          for(var i=0; i<parse.length; i++){
            RelationSlideID_1.push(parse[i].thread1_id);
            RelationSlideID_2.push(parse[i].thread2_id);
          }
        }

        console.log(dom.id);
        var BadgeID_Array = dom.id.split(",");
        var BadgeID_SlideID = BadgeID_Array[1]; //ノードIDの部分
        console.log(BadgeID_SlideID);
        for(var r = 0; r<RelationSlideID_1.length; r++){
          console.log(RelationSlideID_1[r]);
          console.log(RelationSlideID_2[r]);

          if(RelationSlideID_1[r] == BadgeID_SlideID){
            var pairSlide2 = document.getElementById(RelationSlideID_2[r]);
            console.log(pairSlide2)
            // pairNode2.style.backgroundColor = "aquamarine";
            for(var i=0; i< Slide_all.length; i++){
              if(Slide_all[i].getAttribute("id") == RelationSlideID_2[r]){
                Slide_all[i].style.border = "4px solid red";
                // Slide_all[i].style.backgroundColor = "aquamarine";
              }
            }
          }else if(RelationSlideID_2[r] == BadgeID_SlideID){
            var pairSlide1 = document.getElementById(RelationSlideID_1[r]);
            console.log(pairSlide1);
            // pairNode1.style.backgroundColor = "aquamarine";
            for(var i=0; i< Slide_all.length; i++){
              if(Slide_all[i].getAttribute("id") == RelationSlideID_1[r]){
                Slide_all[i].style.border = "4px solid red";
                // Slide_all[i].style.backgroundColor = "aquamarine";
              }
            }
          }
        }
       
      },
      error:function(){
        console.log("エラーです");
      }
  });

  }else if(dom.className = "badge bg-blue"){

    console.log("ノード間の関係性を確認");
    var Node_all = document.getElementsByClassName('cspan');
    await $.ajax({
      url: "php/get_LogicRelation.php",
      type: "POST",
      success: function(arr){

        var RelationNodeID_1 = [];
        var RelationNodeID_2 = [];
        if(arr == "[]"){
          console.log("何もなし");
        }else{
          // console.log(arr);
          var parse = JSON.parse(arr);
          for(var i=0; i<parse.length; i++){
            RelationNodeID_1.push(parse[i].doc_con1_id);
            RelationNodeID_2.push(parse[i].doc_con2_id);
          }
        }

        console.log(dom.id);
        var BadgeID_Array = dom.id.split(",");
        var BadgeID_NodeID = BadgeID_Array[1]; //ノードIDの部分

        for(var r = 0; r<RelationNodeID_1.length; r++){
          // console.log(RelationNodeID_1[r]);
          // console.log(RelationNodeID_2[r]);

          if(RelationNodeID_1[r] == BadgeID_NodeID){
            var pairNode2 = document.getElementById(RelationNodeID_2[r]);
            console.log(pairNode2)
            // pairNode2.style.backgroundColor = "aquamarine";
            for(var i=0; i< Node_all.length; i++){
              if(Node_all[i].getAttribute("id") == RelationNodeID_2[r]){
                Node_all[i].style.border = "2px solid gray";
                Node_all[i].style.backgroundColor = "aquamarine";
              }
            }
          }else if(RelationNodeID_2[r] == BadgeID_NodeID){
            var pairNode1 = document.getElementById(RelationNodeID_1[r]);
            console.log(pairNode1);
            // pairNode1.style.backgroundColor = "aquamarine";
            for(var i=0; i< Node_all.length; i++){
              if(Node_all[i].getAttribute("id") == RelationNodeID_1[r]){
                Node_all[i].style.border = "2px solid gray";
                Node_all[i].style.backgroundColor = "aquamarine";
              }
            }
          }
        }
       
      },
      error:function(){
        console.log("エラーです");
      }
  });

  }
});

// $(document).on('click',function(e) {// ターゲット要素の外側をクリックした時の操作
//    if(!$(e.target).closest('.cspan').length) {
//      var dom_all = document.getElementsByClassName("cspan");
//      for(var i=0; i<dom_all.length; i++){
//        dom_all[i].style.border = "";
//      }
//    }
// });


$(document).on('dblclick', '.cspan', function(){
  var dom = this;
  var dom_text = dom.nextElementSibling;
  console.log(dom_text);
  $(dom).toggle(1);
  $(dom_text).toggle(1);
  dom_text.focus();//テキストエリアをフォーカスする
  dom_text.select();//テキストエリアを全選択する
});

$(document).on('dblclick', '.tspan', function(){
  var dom = this;
  var dom_text = dom.nextElementSibling;
  console.log(dom_text);
  $(dom).toggle(1);
  $(dom_text).toggle(1);
  dom_text.focus();//テキストエリアをフォーカスする
  dom_text.select();//テキストエリアを全選択する
});

$(document).on('blur', '.text_border', function(){
  var dom = this;
  var value = this.value;
  var dom_span = this.previousElementSibling;
  $(dom).toggle(1);
  $(dom_span).toggle(1);

  // シナリオ上にある同じノードIDを持つコンテンツに変更内容を反映
  // const span_id = dom_span.getAttribute("node_id");
  // console.log(span_id);
  // if(span_id){//node_idを持つコンテンツであった場合
  //   const cspan = document.getElementsByClassName("cspan");
  //   for(i=0; i<cspan.length; i++){
  //     if(cspan[i].getAttribute("node_id") == span_id){
  //       cspan[i].innerHTML = value;
  //       cspan[i].nextElementSibling.value = value;
  //       console.log(cspan[i].parentNode.id);
  //       Edit_save(cspan[i].nextElementSibling, cspan[i].parentNode.id)
  //     }
  //   }
    //マインドマップ側のノードに変更内容を反映
    // const jm_dom = document.getElementsByTagName("jmnode");
    // for(i=0; i<jm_dom.length; i++){
    //   if(jm_dom[i].getAttribute("nodeid") == span_id){
    //     jm_dom[i].innerHTML = value;
    //   }
    // }
  // }

});

$(document).on('blur', '.title_slide', function(){
  var dom = this;
  console.log(dom);
  var dom_span = dom.previousElementSibling;
  console.log(dom_span);
  $(dom).toggle(1);
  $(dom_span).toggle(1);
});


function Keypress(code, dmm){
	//エンターキー押下なら
	if(13 === code){
    var dom = dmm;
    console.log(dom);
    dom.blur();
    // var dom_span = dom.previousElementSibling;
    // console.log(dom_span);
    // $(dom).toggle(1);
    // $(dom_span).toggle(1);
	}
}

//マインドマップ側ノードのテキストエリアが閉じられた時
// $(document).on('blur', '.jsmind-editor', function(){
//   const node_content = this.value;
//   console.log(this.parentElement.getAttribute("nodeid"));
//   const linkid = this.parentElement.getAttribute("nodeid");
//   const content_dom = document.getElementsByClassName("cspan");
//   for(i=0; i<content_dom.length; i++){
//     console.log(content_dom[i].getAttribute("node_id"));
//     if(linkid == content_dom[i].getAttribute("node_id")){//シナリオノードの書き換え＋変更の保存
//       console.log(content_dom[i]);
//       console.log(content_dom[i].nextElementSibling.value);
//       content_dom[i].innerHTML = node_content;
//       content_dom[i].nextElementSibling.value = node_content;
//       const setid = content_dom[i].parentElement.id;
//       Edit_save(content_dom[i].nextElementSibling, setid);
//     }
//   }
// });;


function sleep(waitMsec) {
  var startMsec = new Date();

  // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
  while (new Date() - startMsec < waitMsec);
}



// テキストエリアがクリックされたときに，ノードのフォーカスを外す
// これがないとテキスト入力時にマインドマップのショートカットキーが誤作動する
// 何を選択していたかの情報はlast_selected_nodeに保存しておく

var last_selected_node = null; //初期値はnull

function TextboxClick(){
  // ノードを選んでいなければ無視
  if(_jm.get_selected_node() == null){
    // selected_node_area.value = "選択中のノードはありません";
    // var doc_sup = $("#documentation_support_button");
    // doc_sup.html("");
    return;
  }
  // ノードが選ばれているが，複数回テキストエリアをクリックした場合
  // 選択中のノードはfalseとなるので，ノード情報としてはlast_selected_nodeを参照するようにする
  if(_jm.mind.selected == false){
    // selected_node_area.value = last_selected_node.topic;
  }
  else{ // ノードが選ばれた状態でテキストエリアをクリックした際
    let selected_node = _jm.get_selected_node();
    // 以前クリックしたものがない，もしくは以前と違っていた場合
    if(last_selected_node == null || last_selected_node.id != selected_node.id){
      // last_selected_nodeを更新
      last_selected_node = selected_node;
    }
    _jm.mind.selected = false; // 選択中のノードからフォーカスを外す
  }
}

//type取得関数
function GetType(id){
  var jmnode = document.getElementsByTagName("jmnode");
  for(i=0; i<jmnode.length; i++){
    if(jmnode[i].getAttribute("nodeid") == id){//回ってきたidが選択中ノードの時
        console.log(jmnode[i]);
        var type = jmnode[i].getAttribute("type");//typeを代入
    }
    if(type != undefined){
      break;
    }
  }
  console.log(type);
  return type;
}




// 選択中のノード情報を取得する関数
// テキストエリアをクリックした際はfalseになるため，一時保存していた情報（last_selected_node)から情報を復元
function CheckSelectedNode(){
  let selected_node = null;
  if(_jm.get_selected_node() == false){
    selected_node = last_selected_node;
  }else{
    selected_node = _jm.get_selected_node();
  }
  return selected_node; // 選択中のノード情報を返す
}



//　オリジナルのスレッドを作成する関数
// 引数説明　meta:メタ認知的知識　topic:記述内容 id:選択したノードID
function CreateThread(topic, id){

  var statement = topic || "";  // テキストボックスに入れる文字列を格納する変数
  var k = 0;
  var node_id = [];
  let concept_id;
  // もしノードを選択して作られたスレッドなら
  if(id != null){
    var jmnode = document.getElementsByTagName("jmnode");
    for(var i=0; i<jmnode.length; i++){
      if(jmnode[i].getAttribute('nodeid') == id && k== 0){
        node_id.push(id);
        concept_id = jmnode[i].getAttribute('concept_id');
        console.log(node_id);
        console.log(node_id[0]);
        k += 1;
      }
    }
  }

  var uuid = getUniqueStr(); // Threadのidをランダム生成
  var setid = getUniqueStr();
  var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった
  var quot_setid = "\"" + setid + "\"";
  let selected_node = CheckSelectedNode(); // 現在選択されているノードのチェック
  let area = $("#document_area");
  console.log(uuid);
  console.log(quot_uuid);

  let label = "<div class='thread' id='"+uuid+"' value='スレッド' data-node_id='"+node_id+"' style='background-color:white; padding:10px; margin-top:5px; margin-bottom:5px; margin-right:5px; margin-left:5px;'>"+
                    "<span class = 'tspan' tabindex='0'>ページタイトル</span>"+
                    "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Edit_slide(this,"+quot_uuid+");Record_rank();'  placeholder='ページタイトル' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
                    "<input class='simple_btn' type='button' value='×' onclick='RemoveThread("+quot_uuid+");Record_rank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                    "<br>"+
                "<div class='purpose'>"+
                    "<div id='"+setid+"' class='scenario_content'>"+
                      "<span node_id='"+id+"' concept_id='"+concept_id+"' class = 'cspan' name = '0' style = 'width:calc(100% - 25px)' tabindex='0'>"+statement+"</span>"+
                      "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");Record_rank();' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+statement+"</textarea>"+
                      "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Record_rank();'>"+
                    "</div>"+
                 "</div>"+
              "</div>";

              // "<input class='simple_btn' type='button' value='問い' onclick='NewContent_Append("+quot_uuid+", this);' style='font-size:10px;'>"+
              // "<input class='simple_btn' type='button' value='答え' onclick='NewContent_Append("+quot_uuid+", this);' style='font-size:10px;'>"+

  area.append(label);

  Record_slide(uuid);

  var conceptID = GetConceptId(id);
  var type = GetType(id);
  console.log(type);
  Record_content(setid, id, conceptID, statement, uuid, type);

 $('#document_area').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       // console.log("OK");
       Record_rank();
   }
 });


 $('.purpose').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       // console.log("OK!");
       Record_rank();
   }
 });

$('#'+uuid).data('node_id', node_id);
console.log( $('#'+uuid).data('node_id') );

var dom_tmp = document.getElementById("contents-"+setid);
var dom_target = dom_tmp.previousElementSibling;
if(type=="toi"){
  // dom_target.style.backgroundColor = "#d3d3d3";
  dom_target.style.backgroundColor = "#ffffff";
  dom_target.style.border = "0.3px solid #b8daff";
  dom_target.setAttribute("type","toi");
  console.log(dom_target.innerHTML);
} else{
  // dom_target.style.backgroundColor = "#d3d3d3";
  dom_target.style.backgroundColor = "#ffffff";
  dom_target.style.border = "0.3px solid #ffeeba";
  dom_target.setAttribute("type","answer");
}
Record_rank();

 return uuid; // 作成したID（スレッドのID)を返す
}

// マインドマップ上のノードを選択した状態で右クリックすると文書に反映する関数
function SetPurpose(){

  let selected_node = CheckSelectedNode();
  console.log("selected_node : "+selected_node);
  if(selected_node == null || selected_node.topic == undefined){
   // (textareaのid名).value = "ノードを選択してください";
   return;
 }else{
   $slide_topic.push(selected_node.topic);
   CreateThread(selected_node.topic, selected_node.id);
 }
}


// ノードに紐づいていないスライドを新規作成する関数
function MakeSlide(){

    var node_id = [];
    var uuid = getUniqueStr(); // Threadのidをランダム生成
    var setid = getUniqueStr();
    var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった
    var quot_setid = "\"" + setid + "\"";
    let area = $("#document_area");
    console.log(uuid);
    console.log(quot_uuid);

    let label = "<div class='thread' id='"+uuid+"' value='スレッド' data-node_id='"+node_id+"' style='background-color:white; padding:10px; margin-top:5px; margin-bottom:5px; margin-right:18px; margin-left:35px;'>"+
                      "<span class = 'tspan' tabindex='0'>スライドタイトル</span>"+
                      "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Edit_slide(this,"+quot_uuid+");Record_rank();' placeholder='スライドタイトル' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
                      "<input class='simple_btn' type='button' value='×' onclick='RemoveThread("+quot_uuid+");Record_rank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                      "<br>"+
                  "<div class='purpose'>"+
                   "</div>"+
                "</div>";

    area.append(label);
    Record_slide(uuid);


   $('#document_area').sortable({
     update: function(){
         var log = $(this).sortable("toArray");
         console.log(log);
         Record_rank();
     }
   });


   $('.purpose').sortable({
     update: function(){
         var log = $(this).sortable("toArray");
         console.log(log);
         Record_rank();
     }
    });

  $('#'+uuid).data('node_id', node_id);

  Record_rank();
  return uuid; // 作成したID（スレッドのID)を返す
}

// ノードに紐づいていないページを新規作成する関数 shimizu
function MakeNewPage(){
  var node_id = [];
  var uuid = getUniqueStr(); // Threadのidをランダム生成
  var setid = getUniqueStr();
  var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった
  var quot_setid = "\"" + setid + "\"";
  let area = $("#document_area");
  console.log(uuid);
  console.log(quot_uuid);

  let label = "<div class='thread' id='"+uuid+"' value='スレッド' data-node_id='"+node_id+"' style='background-color:white; padding:5px; margin-top:5px; margin-bottom:5px; margin-right:5px; margin-left:5px;height:auto'>"+
                    "<span class = 'tspan' tabindex='0'>ページタイトル</span>"+
                    "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Edit_slide(this,"+quot_uuid+");Record_rank();' placeholder='ページタイトル' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
                    "<select id=SelectBox-"+uuid+" name='Logic_options_title'>"+"</select>"+
                    "<input class='simple_btn' type='button' value='×' onclick='RemoveThread("+quot_uuid+");Record_rank();' style='width:20px; height:20px; font-size:10px; float:right;'>"+
                    "<br>"+
                "<div class='purpose'>"+
                 "</div>"+
              "</div>";

  area.append(label);
  //2022-11-23 shimizu 中身を追加
  for(var LogicLabel in Base_ClassLabeltoConceptID){
    // console.log(LogicLabel);
    // console.log(Output_ConceptIDtoClassLabel[LogicLabel]);
    var Label = LogicLabel;
    if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
      $("select[name='Logic_options_title']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
    }
    // $("select[name='Logic_options_title']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
  }

  Record_slide(uuid);
  
 $('#document_area').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       Record_rank();
   }
 });

 $('.purpose').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       Record_rank();
   }
 });

  $('#'+uuid).data('node_id', node_id);

  Record_rank();
  return uuid; // 作成したID（スレッドのID)を返す
}

//  $('#document_area').sortable({
//    update: function(){
//        var log = $(this).sortable("toArray");
//        console.log(log);
//        Record_rank();
//    }
//  });


//  $('.purpose').sortable({
//    update: function(){
//        var log = $(this).sortable("toArray");
//        console.log(log);
//        Record_rank();
//    }
//   });

//   $('#'+uuid).data('node_id', node_id);

//   Record_rank();
//   return uuid; // 作成したID（スレッドのID)を返す
// }

function AddImage(){
  console.log("画像追加ボタン");

  var node_id = [];
  var uuid = getUniqueStr(); // Threadのidをランダム生成
  var setid = getUniqueStr();
  var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった
  var quot_setid = "\"" + setid + "\"";
  let area = $("#document_area");
  console.log(uuid);
  console.log(quot_uuid);

  let label = "<div class='thread' id='"+uuid+"' value='スレッド' data-node_id='"+node_id+"' style='background-color:white; padding:10px; margin-top:10px; margin-bottom:10px; margin-right:30px; margin-left:30px;'>"+
                    "<span class = 'tspan' tabindex='0'>ページタイトル</span>"+
                    "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Edit_slide(this,"+quot_uuid+");Record_rank();' placeholder='ページタイトル' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
                    "<input class='simple_btn' type='button' value='×' onclick='RemoveThread("+quot_uuid+");Record_rank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                "<div class='purpose'>"+
                 "</div>"+
              "</div>";

  area.append(label);
  Record_slide(uuid);


 $('#document_area').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       Record_rank();
   }
 });


 $('.purpose').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       Record_rank();
   }
 });

$('#'+uuid).data('node_id', node_id);

Record_rank();
return uuid; // 作成したID（スレッドのID)を返す
}

function NodeAppend(){
  let selected_node = CheckSelectedNode();
  var id = selected_node.id;  //nodeID
  var content = selected_node.topic;  //content
  let c_id;
  console.log(id);

  var jmnode = document.getElementsByTagName("jmnode");
  for(var i=0; i<jmnode.length; i++){
    // console.log(id, jmnode[i].getAttribute('nodeid'));
    if(jmnode[i].getAttribute('nodeid') == id && jmnode[i].getAttribute('concept_id')){
      c_id = jmnode[i].getAttribute('concept_id');
      console.log(jmnode[i]);
    }
  }



  if(selected_node == null || selected_node.topic == undefined){
   return;
  }else{
    var arr = $('#'+target).data('node_id');
    console.log(arr);
    if(arr.length === 0){
      console.log("OK");
      arr = [];
    }
    arr.push(id);
    console.log(arr);
    $('#'+target).data('node_id', arr);

    var setid = getUniqueStr();  //contentID
    var quot_setid = "\"" + setid + "\"";

    //内容テキストエリアにノード内容を挿入
    let area = document.getElementById("target")
    let label = "<div id='"+setid+"' class='scenario_content'>"+
                  "<span node_id='"+id+"' concept_id='"+c_id+"' class = 'cspan' name = '0' style = 'width:calc(100% - 25px)' tabindex='0'>"+selected_node.topic+"</span>"+
                  "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");Record_rank();' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+selected_node.topic+"</textarea>"+
                  "<select id=SelectBox-"+setid+" name='Logic_options_contents'>"+"</select>"+
                  "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Record_rank();'>"+
                "</div>";

    const c_dom = document.getElementsByClassName("cspan");
    var check=0;
    for(var i=0; i<c_dom.length; i++){
      if(c_dom[i].style.border == "2px solid gray"){
        var stindent = c_dom[i].getAttribute("name");
        var sttype = c_dom[i].getAttribute("type");
        const tg_dom = c_dom[i].parentNode.id;
        console.log(tg_dom);
        $('#'+tg_dom).after(label);
        check++;
      }
    }
    if(check==0){
      $('#'+target).children('div').append(label);
    }


    $slide_topic.push(selected_node.topic);
    console.log($slide_topic);
  }
  var concept_id = GetConceptId(id);  //conceptID

  // console.log(setid);  //content_id
  // console.log(id);  //node_id
  // console.log(concept_id);  //concept_id
  // console.log(content);  //content
  // console.log(target);  //slideID
  var type = GetType(id);
  Record_content(setid, id, concept_id, content, target, type);

  var dom_tmp = document.getElementById("contents-"+setid);
  var dom_target = dom_tmp.previousElementSibling;
  console.log(dom_target);
  if(type=="toi"){
    // dom_target.style.backgroundColor = "#d3d3d3";
    dom_target.style.backgroundColor = "#ffffff";
    dom_target.style.border = "0.3px solid #b8daff";
    dom_target.setAttribute("type","toi");
  } else{
    // dom_target.style.backgroundColor = "#d3d3d3";
    dom_target.style.backgroundColor = "#ffffff";
    dom_target.style.border = "0.3px solid #ffeeba";
    dom_target.setAttribute("type","answer");
  }

  //インデント情報の格納
  console.log(stindent);
  console.log(sttype);
  if(!(typeof stindent === 'undefined')){
    if(sttype == "toi"){
      if(!(Number(stindent) == 3)){
        const num = Number(stindent) + 1;
        dom_target.setAttribute("name",num);
      }else{
        dom_target.setAttribute("name",stindent);
      }
    }else{
      dom_target.setAttribute("name",stindent);
    }
  }
  SetIndent();
  Record_rank();

}

//　2022shimizu 資料にノードを追加する際に前提を付与
function NodeAppendLogic(){
  let selected_node = CheckSelectedNode();
  var id = selected_node.id;  //nodeID
  var content = selected_node.topic;  //content，書かれている内容
  let c_id;

  console.log("id : "+id);
  // console.log("content : "+content);

  var jmnode = document.getElementsByTagName("jmnode");//マインドマップ上のnodeの集まりを取得
  for(var i=0; i<jmnode.length; i++){
    // console.log(id, jmnode[i].getAttribute('nodeid'));
    // クリックしたnodeのidと，等しいとき
    if(jmnode[i].getAttribute('nodeid') == id && jmnode[i].getAttribute('concept_id')){
      //研究活動オントロジーのidを取得
      c_id = jmnode[i].getAttribute('concept_id');
      // console.log(jmnode[i]);
    }
  }

  if(selected_node == null || selected_node.topic == undefined){
   return;
  }else{
    //target?は何？ー
    var arr = $('#'+target).data('node_id');
    console.log("arr : "+arr);
    if(arr.length != 0){
      console.log("OK");
      arr = [];
    }
    arr.push(id);
    // console.log("arr : "+arr);
    $('#'+target).data('node_id', arr);

    //contentID→資料上のノードが，mindmapとは別に持つid
    var setid = getUniqueStr();  //contentID
    var quot_setid = "\"" + setid + "\"";

    //内容テキストエリアにノード内容を挿入
    //onFocus：選択したとき，onblur:選択を外したとき
    let area = document.getElementById("target")
    let label = "<div id='"+setid+"' class='scenario_content'>"+
                  "<span id='"+setid+"' node_id='"+id+"' concept_id='"+c_id+"' class = 'cspan' name = '0' style = 'width:calc(100% - 25px)' tabindex='0'>"+selected_node.topic+"</span>"+
                  "<textarea id='contents-"+setid+"' class='text_border' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");Record_rank();' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+selected_node.topic+"</textarea>"+
                  "<input id=DeleteButton-"+setid+" class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Record_rank();'>"+
                  "<select id=SelectBox-"+setid+" class='cp_ipselect cp_sl05' name='Logic_options_contents'>"+"</select>"+
                "</div>";

    const c_dom = document.getElementsByClassName("cspan");
    var check=0;
    // console.log("c_dom : "+c_dom.length); c_dom.length : cspanの個数
    for(var i=0; i<c_dom.length; i++){
      //選択しているノードが2px solid grayになっている
      if(c_dom[i].style.border == "2px solid gray"){
        var stindent = c_dom[i].getAttribute("name");//nameがインデントを表している
        var sttype = c_dom[i].getAttribute("type");//toiとanswerに分かれている(2022/10/13時点)
        const tg_dom = c_dom[i].parentNode.id;//資料上の親子id ＝ 資料の一つ上に表示してあるノード内容．
        // console.log("tg_dom : "+tg_dom);
        $('#'+tg_dom).after(label);
        check++;
      }
    }
    if(check==0){
      //推測　target:選択しているスライドのpurpose u i -sortable
      $('#'+target).children('div').append(label);
    }

    $slide_topic.push(selected_node.topic);
    // console.log("$slide_topic : "+$slide_topic);  // $slide_topic：順番はぐちゃぐちゃだが，資料上のノードtopic全て．上のコードはその資料上のtopicに選択していたnodeの内容を追加するもの．
    
  }
  var concept_id = GetConceptId(id);  //conceptID

  // console.log(setid);  //content_id
  // console.log(id);  //node_id
  // console.log("concept_id : "+concept_id);  //concept_id NewNodeみたいにないときはnull
  // console.log(content);  //content
  // console.log(target);  //slideID
  var type = GetType(id);
  Record_content(setid, id, concept_id, content, target, type);

  //ノードの中，<textarea>の取得
  var dom_tmp = document.getElementById("contents-"+setid);
  var dom_target = dom_tmp.previousElementSibling;
  // console.log(dom_target);
  if(type=="toi"){
    // dom_target.style.backgroundColor = "#d3d3d3";
    dom_target.style.backgroundColor = "#ffffff";
    dom_target.style.border = "0.3px solid #b8daff";
    dom_target.setAttribute("type","toi");
  } else{
    // dom_target.style.backgroundColor = "#d3d3d3";
    dom_target.style.backgroundColor = "#ffffff";
    dom_target.style.border = "0.3px solid #ffeeba";
    dom_target.setAttribute("type","answer");
  }

  //インデント情報の格納
  // console.log(stindent);//資料上の選択しているノードのインデント数，インデントがなければundefinedと返す
  // console.log(sttype);//資料上の選択しているノードのタイプ，インデントがないとundefinedと返ってくる
  if(!(typeof stindent === 'undefined')){
    if(sttype == "toi"){
      if(!(Number(stindent) == 3)){
        const num = Number(stindent) + 1;
        dom_target.setAttribute("name",num);
      }else{
        dom_target.setAttribute("name",stindent);
      }
    }else{
      dom_target.setAttribute("name",stindent);
    }
  }
  // //セレクトダウンメニューの中身追加
  for(var LogicLabel in Base_ClassLabeltoConceptID){
    // console.log(LogicLabel);
    // console.log(Output_ConceptIDtoClassLabel[LogicLabel]);
    var Label = LogicLabel;
    var LogicID = "SelectBox-"+setid;
    if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
      $("select[id="+LogicID+"]").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
    }
    // $("select[id="+LogicID+"]").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
  }

  SetIndent();
  Record_rank();

}

//20221207shimizu ノードを選択して資料の項目を追加
function ItemAddDocument(){
  console.log("項目追加");
  let selected_node = CheckSelectedNode();
  var id = selected_node.id;  //nodeID
  var content = selected_node.topic;  //content，書かれている内容
  let c_id;

  console.log("id : "+id);

  var jmnode = document.getElementsByTagName("jmnode");//マインドマップ上のnodeの集まりを取得
  for(var i=0; i<jmnode.length; i++){
    // console.log(id, jmnode[i].getAttribute('nodeid'));
    // クリックしたnodeのidと，等しいとき
    if(jmnode[i].getAttribute('nodeid') == id && jmnode[i].getAttribute('concept_id')){
      //研究活動オントロジーのidを取得
      c_id = jmnode[i].getAttribute('concept_id');
      // console.log(jmnode[i]);
    }
  }

  var node_id = id;
  var uuid = getUniqueStr(); // Threadのidをランダム生成
  var setid = getUniqueStr();
  var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった
  var quot_setid = "\"" + setid + "\"";
  let area = $("#document_area");
  console.log(uuid);
  console.log(quot_uuid);

  let label = "<div class='thread' id='"+uuid+"' value='スレッド' data-node_id='"+node_id+"' data-concept_id='"+c_id+"' style='background-color:white; padding:5px; margin-top:5px; margin-bottom:5px; margin-right:5px; margin-left:5px;height:auto'>"+
                    "<span class = 'tspan' tabindex='0'>"+content+"</span>"+
                    "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Edit_slide(this,"+quot_uuid+");Record_rank();' placeholder='ページタイトル' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
                    "<input id=DeleteButton-"+uuid+" class='simple_btn' type='button' value='×' onclick='RemoveThread("+quot_uuid+");Record_rank();' style='width:20px; height:20px; font-size:10px; float:right;'>"+
                    "<select id=SelectBox-"+uuid+"  class='cp_ipselect cp_sl04' name='Logic_options_title'>"+"</select>"+
                    "<br>"+
                "<div class='purpose'>"+
                 "</div>"+
              "</div>";

  area.append(label);
  // //2022-11-23 shimizu 中身を追加
  for(var LogicLabel in Base_ClassLabeltoConceptID){
    // console.log(LogicLabel);
    // console.log(Output_ConceptIDtoClassLabel[LogicLabel]);
    var Label = LogicLabel;
    var LogicID = "SelectBox-"+uuid;
    if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
      $("select[id="+LogicID+"]").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
    }
    // $("select[id="+LogicID+"]").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
  }

  Record_slide(uuid);
  
 $('#document_area').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       Record_rank();
      //  MoveImageArea();
      MoveAndExpensionImageArea(); 
   }
 });

 $('.purpose').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       Record_rank();
      //  MoveImageArea();
      MoveAndExpensionImageArea();
   }
 });

  $('#'+uuid).data('node_id', node_id);

  Record_rank();
  return uuid; // 作成したID（スレッドのID)を返す
}

//2022 shimizu ノード間の関係性として論理関係を決定
async function DecideNodeLogicRelation_Click(){
  console.log("ノード間の論理的関係性を決定");

  var SelectLogic = [];
  //それぞれのセレクトボックスの「選択している番号，value，中身のテキスト」を取得
  const select_logic1 = document.getElementById("logic_intention1_node")
  const num1 = select_logic1.selectedIndex;
  // const c_id1 = select_logic1.options[num1].value;
  const LogicText1 = select_logic1.options[num1].innerHTML;
  SelectLogic.push(LogicText1);

  const select_logic2 = document.getElementById("logic_intention2_node")
  const num2 = select_logic2.selectedIndex;
  // const c_id2 = select_logic2.options[num2].value;
  const LogicText2 = select_logic2.options[num2].innerHTML;
  SelectLogic.push(LogicText2);

  var LogicTextMerge = LogicText1 + ","+LogicText2;
  console.log(LogicTextMerge);
  
  const classification1 = document.getElementById("first_logic_node");
  const classification1_index = classification1.selectedIndex;
  const classification1_text = classification1.options[classification1_index].innerHTML;

  const classification2 = document.getElementById("second_logic_node");
  const classification2_index = classification2.selectedIndex;
  const classification2_text = classification2.options[classification2_index].innerHTML;

  var ClickDocIDs_Decide = [];
  var ClickDocLabels = [];
  var ClickDocNodeIDs =[];

  var u_id = getUniqueStr(); 
  var dom_all = document.getElementsByClassName("cspan");
  for(var i=0; i<dom_all.length; i++){
    //選択中のノードを確認
    if(dom_all[i].style.border == "2px solid gray"){
      var c_dom_id = dom_all[i].getAttribute("id");
      var c_node_id = dom_all[i].getAttribute("node_id")
      var c_dom_label = dom_all[i].innerHTML;
      //console.log(dom_all[i].getAttribute("node_id"));
      ClickDocIDs_Decide.push(c_dom_id);
      ClickDocLabels.push(c_dom_label);
      ClickDocNodeIDs.push(c_node_id);
    }
  }
 
  //ここの条件が関係性の規定
  // if(Output_LogicConceptToLogicRelation[LogicTextMerge] != null){

  // }else{
  //   alert("選択した「"+LogicText1+"("+ClickDocLabels[0]+")」と「"+LogicText2+"("+ClickDocLabels[1]+")」にはシステム内で関係性が定義されていません．");
  // }


  alert("「"+LogicText1+"("+ClickDocLabels[0]+")："+classification1_text+"」と「"+LogicText2+"("+ClickDocLabels[1]+")："+classification2_text+"」の繋がりを意識しましたね");
  var RelationLabel = Output_LogicConceptToLogicRelation[LogicTextMerge];
  var RelationConceptID = OutputLabel_ClassConceptID[RelationLabel]
  // console.log(ClickNodeIDs_Decide[0]);
  // console.log(ClickNodeIDs_Decide[1]);

  //決定した内容を追加していく．
  for(var l=0; l<ClickDocIDs_Decide.length; l++){

    var select_box_id = "SelectBox-"+ClickDocIDs_Decide[l];
    var select_button = document.getElementById(select_box_id);
    console.log(select_box_id);
    console.log(SelectLogic[l].substr(0,2));
    var createElement = document.createElement('span')
    createElement.id = u_id+","+ClickDocIDs_Decide[l];
    createElement.className = "badge bg-blue";
    createElement.textContent = SelectLogic[l];
    createElement.setAttribute('ontlogy_id', Logic_ClassLabeltoConceptID[SelectLogic[l]]);
    select_button.after(createElement);
    
    console.log("関係性設定完了");
  }
  Record_NodeLogicRelation(u_id,ClickDocNodeIDs[0],ClickDocIDs_Decide[0],SelectLogic[0],Logic_ClassLabeltoConceptID[SelectLogic[0]],ClickDocNodeIDs[1],ClickDocIDs_Decide[1],SelectLogic[1],Logic_ClassLabeltoConceptID[SelectLogic[1]]);

  //ノード非表示
  var dm_menu3 = document.getElementById('document_area_conmenu3'); //コンテキストメニュー
  dm_menu3.classList.remove('on');

}

//2022/12/23 shimizu スライド間の関係性として論理関係を決定
async function DecideSlideLogicRelation_Click(){
  console.log("ノード間の論理的関係性を決定");

  var SelectLogic = [];
  //それぞれのセレクトボックスの「選択している番号，value，中身のテキスト」を取得
  // const select_logic1 = document.getElementById("Logic_options_slide1")
  const select_logic1 = document.getElementById("logic_intention1");
  const num1 = select_logic1.selectedIndex;
  const c_id1 = select_logic1.options[num1].value;
  const LogicText1 = select_logic1.options[num1].innerHTML;
  SelectLogic.push(LogicText1);

  // const select_logic2 = document.getElementById("Logic_options_slide2")
  const select_logic2 = document.getElementById("logic_intention2");
  const num2 = select_logic2.selectedIndex;
  const c_id2 = select_logic2.options[num2].value;
  const LogicText2 = select_logic2.options[num2].innerHTML;
  SelectLogic.push(LogicText2);

  var LogicTextMerge = LogicText1 + ","+LogicText2;

  const classification1 = document.getElementById("first_logic");
  const classification1_index = classification1.selectedIndex;
  const classification1_text = classification1.options[classification1_index].innerHTML;

  const classification2 = document.getElementById("second_logic");
  const classification2_index = classification2.selectedIndex;
  const classification2_text = classification2.options[classification2_index].innerHTML;

  var ClickSlideIDs_Decide = [];
  var ClickSlideLabels = [];
  var ClickSlideNodeIDs = [];
  var u_id = getUniqueStr(); 
  var thread_all = document.getElementsByClassName("thread");

  for(var j = 0; j< thread_all.length; j++){
    //選択中のスレッドを確認
    if(thread_all[j].style.border == "5px outset black"){
      var c_dom_id = thread_all[j].getAttribute("id");
      var c_dom_label = thread_all[j].firstElementChild.innerHTML;
      var c_node_id = thread_all[j].getAttribute("data-node_id");
      
      ClickSlideIDs_Decide.push(c_dom_id);
      ClickSlideLabels.push(c_dom_label);
      ClickSlideNodeIDs.push(c_node_id);
    }
  }


  alert("「"+LogicText1+"("+ClickSlideLabels[0]+")："+classification1_text+"」と「"+LogicText2+"("+ClickSlideLabels[1]+")："+classification2_text+"」の繋がりを意識しましたね");
  
  console.log(ClickSlideIDs_Decide[0]);
  console.log(ClickSlideIDs_Decide[1]);

  //決定した内容を追加していく．
  for(var l=0; l<ClickSlideIDs_Decide.length; l++){  
    var select_box_id = "SelectBox-"+ClickSlideIDs_Decide[l];
    var select_box = document.getElementById(select_box_id);
    console.log(select_box_id);
    var createElement = document.createElement('span');
    createElement.id = u_id+","+ClickSlideIDs_Decide[l];
    createElement.className = "badge bg-red";
    createElement.textContent = SelectLogic[l]; 
    createElement.setAttribute('ontlogy_id', Logic_ClassLabeltoConceptID[SelectLogic[l]]);
    select_box.after(createElement);
    
    console.log("関係性設定完了");
  }
  Record_SlideLogicRelation(u_id,ClickSlideNodeIDs[0],ClickSlideIDs_Decide[0],SelectLogic[0],Logic_ClassLabeltoConceptID[SelectLogic[0]],ClickSlideNodeIDs[1],ClickSlideIDs_Decide[1],SelectLogic[1],Logic_ClassLabeltoConceptID[SelectLogic[1]]);

 
  // if(Output_LogicConceptToLogicRelation[LogicTextMerge] != null){

  // }else{
  //   alert("選択した「"+LogicText1+"("+ClickSlideLabels[0]+")」と「"+LogicText2+"("+ClickSlideLabels[1]+")」にはシステム内で関係性が定義されていません．");
  // }

  CancelButton_Click4();
}

//20221209 shimizu 論理関係を確認
async function LogicRelationChecker(){
  console.log("論理関係を確認");
  var dom_all = document.getElementsByClassName("cspan");
  var c_dom_id;
  var c_dom_label;
  for(var i=0; i<dom_all.length; i++){
    //選択中のノードを確認
    if(dom_all[i].style.border == "2px solid gray"){
      c_dom_id = dom_all[i].getAttribute("id");
      c_dom_label = dom_all[i].innerHTML;
    }
  }
  var RelationNode = [];
  var RelationLabel = {};
  await $.ajax({
    url: "php/get_LogicRelation.php",
    type: "POST",
    success: function(arr){
      if(arr == "[]"){
        // console.log(arr);
      }else{
        // console.log(arr);
        var parse = JSON.parse(arr);
        for(var i=0; i<parse.length; i++){
          if(parse[i].doc_con1_id == c_dom_id){
            console.log(parse[i].doc_con1_id);
            RelationNode.push(parse[i].doc_con2_id);
            // RelationLabel[parse[i].doc_con2_id] = parse[i].relation_label;
          }else if(parse[i].doc_con2_id == c_dom_id){
            console.log(parse[i].doc_con2_id);
            RelationNode.push(parse[i].doc_con1_id);
            // RelationLabel[parse[i].doc_con1_id] = parse[i].relation_label;
          }
        }
        
      }
      var RelationNodeLabel = [];

      if(RelationNode.length == 0){
        alert("選択した「"+c_dom_label+"」は現在関係性は規定されていません．")
      }else{
        var RelationText = "";
        for(var r = 0; r<RelationNode.length; r++){
          RelationText += "<p><b>「"+RelationNodeLabel[r]+"」</b>：<b>「"+RelationLabel[RelationNode[r]]+"」</b></p>";
        }

        // id属性で要素を取得
        var Now_LogicRelation = document.getElementById('now_logic_relation');
        // var list_element = document.getElementById("now_logic_relation");
        //list_element.remove();
        var TestText = "<p>選択したノード：「"+c_dom_label+"」</p>"+ RelationText;

        // 要素内の後尾に追加する場合
        Now_LogicRelation.innerHTML= TestText;
      }
  
    },
    error:function(){
      console.log("エラーです");
    }
});
}


//コンテンツの新規作成
function NewContent_Append(type){
  var setid = getUniqueStr();  //contentID
  var quot_setid = "\"" + setid + "\"";

  //選択中のthreadIDを取得
  const thread_dom = document.getElementsByClassName("thread");
  for(var i=0; i<thread_dom.length; i++){
    if(thread_dom[i].style.border == "2.3px outset black"){
      console.log(thread_dom[i]);
      // var area = thread_dom[i];
      var data = thread_dom[i].id;
    }
  }

  //内容テキストエリアにノード内容を挿入
  let area = document.getElementById(data);
  let label = "<div id='"+setid+"' class='scenario_content'>"+
                "<span class='cspan' name = '0' style = 'width:calc(100% - 25px)' tabindex='0'></span>"+
                "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");Record_rank();' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
                "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Record_rank();'>"+
                "<select id=SelectBox-"+setid+" class='cp_ipselect cp_sl05' name='Logic_options_contents'>"+"</select>"+
              "</div>";

  const c_dom = document.getElementsByClassName("cspan");
  var check=0;
  for(var i=0; i<c_dom.length; i++){
    if(c_dom[i].style.border == "2px solid gray"){
      var setindent = c_dom[i].getAttribute("name");
      var settype = c_dom[i].getAttribute("type");
      const tg_dom = c_dom[i].parentNode.id;
      console.log(tg_dom);
      $('#'+tg_dom).after(label);
      check++;
    }
  }
  if(check==0){
    $('#'+data).children('div').append(label);
  }

  //問いor答えノードの分別
  var dom = $('#'+setid).find('.cspan');
  console.log(dom[0]);
  var dom_target = dom[0];
  if(type == "問い"){
    dom_target.innerHTML = "新規問いノード";
    // dom_target.style.backgroundColor = "#d3d3d3";
    dom_target.style.backgroundColor = "#ffffff";
    dom_target.style.border = "1.5px solid gray";
    dom_target.setAttribute("type","toi");
    Record_content(setid,  '','', '', data,'toi');
  } else{
    dom_target.innerHTML = "新規答えノード";
    // dom_target.style.backgroundColor = "#d3d3d3";
    dom_target.style.backgroundColor = "#ffffff";
    dom_target.style.border = "1.5px solid gray";
    dom_target.setAttribute("type","answer");
    Record_content(setid,  '','', '', data,'answer');
  }

  //インデント情報の格納
  console.log(setindent);
  console.log(settype);
  if(!(typeof setindent === 'undefined')){
    if(settype == "toi"){
      if(!(Number(setindent) == 3)){
        const num = Number(setindent) + 1;
        dom_target.setAttribute("name",num);
      }else{
        dom_target.setAttribute("name",setindent);
      }
    }else{
      dom_target.setAttribute("name",setindent);
    }
  }
  for(var LogicLabel in Base_ClassLabeltoConceptID){
    //console.log(LogicLabel);
    //console.log(Base_ClassLabeltoConceptID[LogicLabel]);
    var Label = LogicLabel;
    var LogicID = "SelectBox-"+setid;
    if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
      $("select[id="+LogicID+"]").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
    }
    // $("select[name='Logic_options_contents']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
  }

  SetIndent();
  Record_rank();
}

//問いエリアからシナリオに埋め込む関数
function Toi_Append(){
  console.log("OK");
  console.log(this.innerHTML);
  const content = this.innerHTML;
  console.log(content);
  console.log(this.getAttribute("concept_id"));
  const conceptid = this.getAttribute("concept_id");
  const thread_dom = document.getElementsByClassName("thread");
  console.log(conceptid);
  console.log(thread_dom);
  for(var i=0; i<thread_dom.length; i++){
    console.log(thread_dom[i]);
    if(thread_dom[i].style.border == "5px outset black"){
      console.log(thread_dom[i]);
      var area = thread_dom[i];
      var tid = thread_dom[i].id;
    }
  }

  var setid = getUniqueStr();  //contentID
  var quot_setid = "\"" + setid + "\"";

  //内容テキストエリアにノード内容を挿入
  console.log(tid);
  console.log(area);
  let label = "<div id='"+setid+"' class='scenario_content'>"+
                "<span class='cspan' name = '0' concept_id = '"+conceptid+"' style = 'width:calc(100% - 25px)' tabindex='0'>"+content+"</span>"+
                "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");Record_rank();' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+content+"</textarea>"+
                "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Record_rank();'>"+
                "<select id=SelectBox-"+setid+" class='cp_ipselect cp_sl05' name='Logic_options_contents'>"+"</select>"+
              "</div>";

  const c_dom = document.getElementsByClassName("cspan");
  var check=0;
  for(var i=0; i<c_dom.length; i++){
    if(c_dom[i].style.border == "2px solid gray"){
      var set_indent = c_dom[i].getAttribute("name");
      var set_type = c_dom[i].getAttribute("type");
      const tg_dom = c_dom[i].parentNode.id;
      console.log(tg_dom);
      $('#'+tg_dom).after(label);
      check++;
    }
  }
  if(check==0){
    $('#'+tid).children('div').append(label);
  }


  var dom = $('#'+setid).find('.cspan');
  console.log(dom[0]);
  var dom_target = dom[0];

  // dom_target.style.backgroundColor = "#d3d3d3";
  dom_target.style.backgroundColor = "#ffffff";
  dom_target.style.border = "1.5px solid gray";
  dom_target.setAttribute("type","toi");
  Record_content(setid,  '',conceptid, content, tid,'toi');

  //インデント情報の格納
  console.log(set_indent);
  console.log(set_type);
  if(!(typeof set_indent === 'undefined')){
    if(set_type == "toi"){
      if(!(Number(set_indent) == 3)){
        const num = Number(set_indent) + 1;
        dom_target.setAttribute("name",num);
      }else{
        dom_target.setAttribute("name",set_indent);
      }
    }else{
      dom_target.setAttribute("name",set_indent);
    }
  }
  for(var LogicLabel in Base_ClassLabeltoConceptID){
    //console.log(LogicLabel);
    //console.log(Base_ClassLabeltoConceptID[LogicLabel]);
    var Label = LogicLabel;
    var LogicID = "SelectBox-"+setid;
    if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
      $("select[id="+LogicID+"]").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
    }
    // $("select[name='Logic_options_contents']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
  }

  SetIndent();
  Record_rank();
}


// textareaの内容をテキストファイルを出力する
// 拡張子はtxt，中身はHTML形式で，クライアント側に保存
function OutputFile(){

    // var html = $('#document_area').html();
    // // var html = $('html').html();
    // //
    // // $.ajax({
    // //   url: "php/create_html.php", // ファイル名をつける
    // //   success:function(data){
    //     // ダウンロードリンクを作成
    //     var link = document.createElement( 'a' );
    //   	link.href = window.URL.createObjectURL( new Blob( [html] ) );
    //   	link.download = "interface.html"; // ファイル名
    //   	link.click();
    // //   }
    // // });

  //2022-12-16 shimizu 松岡さんのコピー
  var result = window.confirm('現在の資料情報を出力しますか？');
  if(result == true){ // OKが押されたら
    var html = $('#document_area').html();

    $.ajax({
      url: "php/create_html.php", // ファイル名をつける
      success:function(data){
        // ダウンロードリンクを作成
        var link = document.createElement( 'a' );
      	link.href = window.URL.createObjectURL( new Blob( [html] ) );
      	link.download = data; // ファイル名
      	link.click();
      }
    });
  }
}

// textareaの内容をテキストファイルを出力する
function InputFile(){
  var obj1 = document.getElementById("input_file");

  obj1.addEventListener("change", function(evt){
    var file = evt.target.files;
    alert(file[0].name + "を取得しました。");

    //FileReaderの作成
    var reader = new FileReader();
    //テキスト形式で読み込む
    reader.readAsText(file[0]);

    //読込終了後の処理
    reader.onload = function(ev){
      //テキストエリアに表示する
      var area = document.getElementById("document_area");
      var str = reader.result;

      // php側で出力させていたときの記述
      // いらない文字を取り除く
      // str = str.slice(1); // １文字目「'」を削除
      // str = str.slice(0, -1); // 最後の文字「'」を削除

      $('#document_area').empty();

      var span = document.createElement('span'); // 改行はいやなのでspan
      // span.setAttribute('draggable', true);
      span.setAttribute('id', 'rebuild');
      span.innerHTML = str; //html要素に変換

      // statementクラスのvalue値を参照し，テキストエリアに復活させる記述
      var textarea = span.getElementsByClassName("statement");
      for(var i=0; i<textarea.length; i++){
        $(textarea[i]).val(textarea[i].getAttribute("value"));
      }

      area.append(span); //bodyに追加


      $(function(){
       $('.statement').autosize();
      });

      new Sortable(rebuild, {
        group:'nested',
        animation:150,
        ghostClass: "sortable-ghost",
      });

      // Nested
      var nestedSortables = [].slice.call(document.querySelectorAll('.nested-sortable'));
      for (var i = 0; i < nestedSortables.length; i++) {
      	new Sortable(nestedSortables[i], {
      		group: 'contents',
      		animation: 150,
          ghostClass: "sortable-ghost",
      	});
      }
    }
  },false);

}

// 2022shimizu
function OutputFileS(){
  //見た目を必ず整えてから出力する
  $('.content_delete').css('visibility', 'hidden');
  $('.simple_btn').css('visibility', 'hidden');
  $('.thread').css('border','White');
  $('.thread').css('padding','0');
  $('.thread').css('box-shadow','none');
  //$('.badge').css('visibility', 'hidden');
  $('.badge').css('padding','0');
  // $('.cspan').css('font-size', '20');
  $('.cspan').css('border', 'White');
  $('.tspan').css('margin-bottom', '0');
  $('#document_slide').toggle('fast');
  // $('#scenario_title').css('font-size', '20');
  $('#scenario_title').css('border','White');
  $('#scenario_title').css('margin-left','0');

  $('#scenario_title').css('width','calc(70vw - 350px)');
  
  $('#jsmind_container').css('width','30vw');//横幅を全体の20％で表示？
  $('#document_area').css('width','calc(70vw - 350px)');　//資料作成箇所
  $('#document_area').css('height','auto');
  $("select[name='Logic_options_contents']").css('font-size', '0.01');
  $("select[name='Logic_options_contents']").css('visibility', 'hidden');
  $("select[name='Logic_options_contents']").css('height', '1px');

  $("select[name='Logic_options_title']").css('font-size', '0.01');
  $("select[name='Logic_options_title']").css('visibility', 'hidden');
  $("select[name='Logic_options_title']").css('height', '2px');
  CreateDocumentXML();
  CreateMindmapNodeXML();

}

const addDOMDownloadFunctionToButton = (target_button_id, target_dom_id) => {
  const button = document.getElementById(target_button_id);
  const target_dom = document.getElementById(target_dom_id);
  // console.log(button);
  // console.log(target_dom);
  // console.log("確認");
  const japanStandardTime = new Date().toLocaleString({ timeZone: 'Asia/Tokyo' });
  button.addEventListener('click', () => {
  html2canvas(target_dom, {
    useCORS: true,
    windowHeight: document.getElementsByTagName('body')[0].scrollHeight,
    }).then(t_dom => {
    const base64 = t_dom.toDataURL('image/png');
    const download_link = document.createElement("a"); 
    download_link.href = base64;
    download_link.download =japanStandardTime+".png";
    // download_link.download = "shimizu-1.png";
    download_link.click();
    });
  });
}

//資料作成完了ボタンに画像作成を行う付与
$(function() {
  //もと
  addDOMDownloadFunctionToButton("finish_btn", "document_area");
  console.log("確認");

});

//2022-12-16 shimizu
const addDOMInputDocumentTOButton = (target_button_id, target_dom_id) => {
  const button = document.getElementById(target_button_id);
  const targetInput = document.getElementById(target_dom_id);
  button.addEventListener('click', () => {
    targetInput.click();
  });
}

$(function(){
  addDOMInputDocumentTOButton("input_btn", "input_file")
})

// 2022 shimizu 資料のマインドマップ上のノードをXMLファイルとして出力
async function CreateMindmapNodeXML(){
  console.log("マインドマップのノード情報取得");
  var xmlSource = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlSource += '<Information xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n';
  await $.ajax({
    url: "php/get_MindNode.php",
    type: "POST",
    success: function(arr){
      if(arr == "[]"){
        // console.log(arr);
      }else{
        // console.log(arr);
        var parse = JSON.parse(arr);
        // console.log(parse);
        for(var i=0; i<parse.length; i++){
          // デバッグ用
          // console.log(parse[i]);
          // console.log(parse[i].id);
          console.log("node_content : "+parse[i].content);
          // console.log(parse[i].concept_id);
          // console.log(parse[i].parent_id);
          console.log("node_type : "+parse[i].type)
          xmlSource += '<Node node_id="'+parse[i].id+'" ';
          xmlSource += 'node_label="'+parse[i].content+'" ';
          xmlSource += 'node_concept_id="'+parse[i].concept_id+'" ';
          xmlSource += 'node_parent_id="'+parse[i].parent_id+'" ';
          xmlSource += 'type="'+parse[i].type+'" />\n';
        }
      }
      xmlSource += '</Information>\n';

    },
    error:function(){
      console.log("エラーです");
    }
});

  const japanStandardTime = new Date().toLocaleString({ timeZone: 'Asia/Tokyo' });
  var xml = (new DOMParser()).parseFromString(xmlSource, 'text/xml');
  var download_a = document.createElement( 'a' );
  download_a.href = 'data:text/xml;charset=utf-8,'+encodeURIComponent((new XMLSerializer()).serializeToString(xml));
  var user_name = await getUserName();
  download_a.download = user_name+'_MindMapNodes_'+japanStandardTime+'.xml';
  // download_a.download = 'shimizu-1.xml';
  download_a.click();
  console.log("マインドマップのXMLファイル出力完了")
}

function Create_pptx(slideID){
  $.ajax({

      url: "plugins/phppresentation/create_pptx.php",
      type: "POST",
      // data: {id : slideID,},
      success: function () {
        console.log("登録成功：" +slideID );
      },
      error: function () {
      console.log("登録失敗");},

  });
}

function FinishAlert(){
	window.alert('ブラウザを閉じずに，「アンケート用紙1」にお答えください．回答し終えたら，下にスクロールして，システムからの助言を見てみましょう．');
  window.open('https://1drv.ms/u/s!Am39JzOgDfpjhhShlfb6a_vYMWZL?e=BreCAo', '_blank');
}

function Get_SlideTitle(){
  //タグとその中身を取得
  const tmp_title = document.getElementById("scenario_title");
  console.log(tmp_title);
  //属性のvalueを指定することで具体的な値にしている
  const title = tmp_title.value;
  // console.log(title);
  Update_scenario_title(title);
}

//2022-11-24 shimizu
function Get_DocumentTitle(){
  //タグとその中身を取得
  const tmp_title = document.getElementById("scenario_title");
  console.log(tmp_title);
  //属性のvalueを指定することで具体的な値にしている
  const title = tmp_title.value;
  console.log(title);
  Update_document_scenario_title(title);
}

function Get_SlideRank(){
  var slide_dom = document.getElementsByClassName("thread");
  var slide_id =[];

  Update_slide_rank().then(() => {
    for(var i=0; i<slide_dom.length; i++){
      slide_id.push(slide_dom[i].id);
      const title = slide_dom[i].firstChild.innerHTML;
      Record_slide_rank(slide_id[i], i, title);
    }
  });
  // window.alert('スライドの保存が完了しました');
}

//2022-11-24 shimizu
function Get_DocumentRank(){
  var slide_dom = document.getElementsByClassName("thread");
  var slide_id =[];
  var selected_id = [];

  Update_Document_rank().then(() => {
    for(var i=0; i<slide_dom.length; i++){
      slide_id.push(slide_dom[i].id);
      var document_selected = document.getElementById("SelectBox-"+slide_id[i]);
      var logic_option_slide;
      if(document_selected == undefined){
        console.log("セレクトなし");
        const title = "Image";
        var node_id = slide_dom[i].getAttribute("data-node_id");
        console.log(node_id);
        var concept_id = "notid";
        logic_option_slide = 0;
        Record_document_rank(slide_id[i], i, title,logic_option_slide,node_id,concept_id);
      }else{
        console.log("セレクトあり");
        if(document_selected.selectedIndex == null){
          // console.log("nullだった");
          logic_option_slide = 0;
        }else{
          // console.log("選択されてた");
          logic_option_slide = document_selected.selectedIndex;
        }
        console.log(logic_option_slide);
        //var logic_option = document_selected.selectedIndex;
        const title = slide_dom[i].firstChild.innerHTML;
        var node_id = slide_dom[i].getAttribute("data-node_id");
        var concept_id = slide_dom[i].getAttribute("data-concept_id");
        console.log(node_id);
        console.log(concept_id);
        Record_document_rank(slide_id[i], i, title,logic_option_slide,node_id,concept_id);
      }
    }
  });
  // window.alert('スライドの保存が完了しました');
}

function Get_ContentRank(){
  var slide_dom = document.getElementsByClassName("thread");
  var content_dom;
  // console.log(slide_dom);
  // console.log("KKKKKKKKKKKKKKKK");

  Update_content_rank().then(() => {
    //最新のコンテントの順番を保存する処理
    for(var i=0; i<slide_dom.length; i++){
      var slide_id = slide_dom[i].id;
      // console.log(slide_id);
      var content_dom = $(slide_dom[i]).find('.scenario_content');
      // console.log(content_dom);//これが欲しかった情報
      for(var j=0; j<content_dom.length; j++){
        var rank = j;
        var content_id = content_dom[j].id;
        const content = content_dom[j].firstElementChild.innerHTML;
        const node_id = content_dom[j].firstElementChild.getAttribute('node_id');
        const type = content_dom[j].firstElementChild.getAttribute('type');
        const indent = content_dom[j].firstElementChild.getAttribute('name');
        const concept_id = content_dom[j].firstElementChild.getAttribute('concept_id');

        Record_content_rank(content_id, rank, slide_id, content, node_id, type, indent, concept_id);
      }
    }
  });
}

//2022-11-24 shimizu
function Get_DocumentContentRank(){
  var slide_dom = document.getElementsByClassName("thread");
  var content_dom;

  Update_Document_content_rank().then(() => {
    //最新のコンテントの順番を保存する処理
    for(var i=0; i<slide_dom.length; i++){
      var slide_id = slide_dom[i].id;
      // console.log(slide_id);
      var content_dom = $(slide_dom[i]).find('.scenario_content');
      // console.log(content_dom);//これが欲しかった情報
      for(var j=0; j<content_dom.length; j++){
        console.log(j);
        var rank = j;
        var content_id = content_dom[j].id;
        var document_selected = document.getElementById("SelectBox-"+content_id);
        var logic_option_content;
        if(document_selected.selectedIndex == null){
          console.log("nullだった");
          logic_option_content = 0;
        }else{
          console.log("選択されてた");
          logic_option_content = document_selected.selectedIndex;
        }
        console.log(logic_option_content);
        
        const content = content_dom[j].firstElementChild.innerHTML;
        const node_id = content_dom[j].firstElementChild.getAttribute('node_id');
        const type = content_dom[j].firstElementChild.getAttribute('type');
        const indent = content_dom[j].firstElementChild.getAttribute('name');
        const concept_id = content_dom[j].firstElementChild.getAttribute('concept_id');
        Record_document_content_rank(content_id, rank, slide_id, content, node_id, type, indent, concept_id,logic_option_content);
      }
    }
  });
}

$(function(){
    $('html').keydown(function(e){
        // 主にタブキーでの処理
        if(e.which==9 || (event.shiftKey && event.which == 9)){//e.which==37
          //e.which == 9:Tab
          // console.log(e.which);
          var span_dom = document.getElementsByClassName("cspan");
          var target_dom;
          for(var i=0; i<span_dom.length; i++){
            // console.log(span_dom[i].style.border);
            if(span_dom[i].style.border == "2px solid gray"){
              target_dom = span_dom[i];
              break;
            }
          }
          var current = document.activeElement;
          // console.log(current.className);
          // console.log(current);
          //console.log(target_dom.id);

          if(!(typeof target_dom === 'undefined') && current.className != 'text_border' && current.className != 'title_slide' && current.className != 'document_title_area' && current.className != 'jsmind-editor' && current.className != 'form-control' && current.className != 't_ad' && current.className != 't_ref'){
          // if(!(typeof target_dom === 'undefined')){
            var text_dom = target_dom.nextElementSibling;
            var dom_SelectBox= document.getElementById("SelectBox-"+target_dom.id);
            // console.log(text_dom);
            // console.log(e.which);
            console.log(dom_SelectBox);

            if(event.shiftKey && event.which == 9){// Key[→]３９
              if(target_dom.style.width == "calc(100% - 85px)"){
                // console.log(target_dom);
                target_dom.style.width = "calc(100% - 65px)";
                target_dom.style.marginLeft = "40px";
                target_dom.setAttribute('name', '2');
                text_dom.style.width = "calc(100% - 65px)";
                text_dom.style.marginLeft = "40px";
                //2022-shimizu
                dom_SelectBox.style.marginLeft = "40px";
              } else if(target_dom.style.width == "calc(100% - 65px)"){
                target_dom.style.width = "calc(100% - 45px)";
                target_dom.style.marginLeft = "20px";
                target_dom.setAttribute('name', '1');
                text_dom.style.width = "calc(100% - 45px)";
                text_dom.style.marginLeft = "20px";
                //2022-shimizu
                dom_SelectBox.style.marginLeft = "20px";
              } else if(target_dom.style.width == "calc(100% - 45px)"){
                target_dom.style.width = "calc(100% - 25px)";
                target_dom.style.marginLeft = "";
                target_dom.setAttribute('name', '0');
                text_dom.style.width = "calc(100% - 25px)";
                text_dom.style.marginLeft = "";
                //2022-shimizu
                dom_SelectBox.style.marginLeft = "";
              }
             }
             else if(event.which == 9){// Key[←]37
               if(target_dom.style.width == "calc(100% - 25px)"){
                //  console.log(target_dom);
                 target_dom.style.width = "calc(100% - 45px)";
                 target_dom.style.marginLeft = "20px";
                 target_dom.setAttribute('name', '1');
                 text_dom.style.width = "calc(100% - 45px)";
                 text_dom.style.marginLeft = "20px";
                 //2022-shimizu
                dom_SelectBox.style.marginLeft = "20px";
               } else if(target_dom.style.width == "calc(100% - 45px)"){
                 target_dom.style.width = "calc(100% - 65px)";
                 target_dom.style.marginLeft = "40px";
                 target_dom.setAttribute('name', '2');
                 text_dom.style.width = "calc(100% - 65px)";
                 text_dom.style.marginLeft = "40px";
                 //2022-shimizu
                dom_SelectBox.style.marginLeft = "40px";
               } else if(target_dom.style.width == "calc(100% - 65px)"){
                 target_dom.style.width = "calc(100% - 85px)";
                 target_dom.style.marginLeft = "60px";
                 target_dom.setAttribute('name', '3');
                 text_dom.style.width = "calc(100% - 85px)";
                 text_dom.style.marginLeft = "60px";
                 //2022-shimizu
                dom_SelectBox.style.marginLeft = "60px";
               }
             }
          }
        }
        
    });
});

function Hide_fin_btn(){
  $('#finish_btn').toggle('fast');
  $('#input_file').toggle('fast');
  $('#edit_model').toggle('fast');
}

function Txt_show(id){
  console.log(id);
  if($('#'+id).is(':hidden')){
    $("#"+id).show();
  }
}

function Need_check(dom){

  var area = dom.parentNode.parentNode;
  var refer = area.lastElementChild.previousElementSibling;
  var ref = area.lastElementChild;

  if(refer.innerHTML == "→ 必要のない理由をお書きください"){
    refer.remove();
    console.log("必要ないを削除");
  }
  console.log(area);


  var spnode = document.createElement('p');
  spnode.innerHTML = "→ 目標に沿った内容であるか，プレゼンシナリオを見直してみましょう．<br>もしプレゼンシナリオを修正した場合は修正内容を記載してください";
  area.insertBefore(spnode, ref);

}

function NotNeed_check(dom){

  var area = dom.parentNode.parentNode;
  var refer = area.lastElementChild.previousElementSibling;
  var ref = area.lastElementChild;

  if(refer.innerHTML == "→ 目標に沿った内容であるか，プレゼンシナリオを見直してみましょう．<br>もしプレゼンシナリオを修正した場合は修正内容を記載してください"){
    refer.remove();
    console.log("修正を削除");
  }
  console.log(area);


  var spnode = document.createElement('p');
  spnode.innerHTML = "→ 必要のない理由をお書きください";
  area.insertBefore(spnode, ref);

}

function re_check(dom){

  var area = dom.parentNode.parentNode;
  var refer = area.lastElementChild.previousElementSibling;
  var ref = area.lastElementChild;
  console.log(refer);
  console.log(ref);

  if(refer.innerHTML == "→ 見直さない理由をお書きください"){
    refer.remove();
  }
  console.log(area);


  var spnode = document.createElement('p');
  spnode.innerHTML = "→ 助言をもとにプレゼンシナリオを見直してみましょう．プレゼンシナリオを修正した場合は修正内容を記載してください";
  area.insertBefore(spnode, ref);

}

function Not_re_check(dom){

  var area = dom.parentNode.parentNode;
  var refer = area.lastElementChild.previousElementSibling;
  var ref = area.lastElementChild;

  if(refer.innerHTML == "→ 助言をもとにプレゼンシナリオを見直してみましょう．プレゼンシナリオを修正した場合は修正内容を記載してください"){
    refer.remove();
  }
  console.log(area);


  var spnode = document.createElement('p');
  spnode.innerHTML = "→ 見直さない理由をお書きください";
  area.insertBefore(spnode, ref);

}


// 助言ログの出力関数
function OutputTxtFile(){

  var html = $('#macro_feedback_area').html();
  const dbid = getUniqueStr();
  // console.log(dbid, mtfile);
  var mtfile = f_mtfile + s_mtfile;
  mtfile += "<script type='text/javascript' src='advice_log.js'></script></body></html>";

  $.ajax({
    url: "php/create_document.php", // ファイル名をつける
    type: "POST",
    success:function(data){
      // ダウンロードリンクを作成
      var link = document.createElement( 'a' );
    	link.href = window.URL.createObjectURL( new Blob( [mtfile], {type : 'text/html'} ) );
    	link.download = data; // ファイル名
      // console.log(data);
    	link.click();
    }
  });
}
var scenario_file = "";

function OutputScenario(){
  var tmp = document.getElementsByClassName("document_title_area");
  var title = tmp[0].value;
  scenario_file += title+"\n\n\n";

  var scenario = document.getElementsByClassName("thread");
  for(var i=0; i<scenario.length; i++){
    scenario_file += "=====================================\n";
    var slide_title = scenario[i].firstElementChild.innerText;
    scenario_file += slide_title+"\n\n";
    var thread_id = scenario[i].id;
    var content = $('#'+thread_id).find('.cspan');
    for(var j=0; j<content.length; j++){
      var csp = content[j].innerText;
      var name = content[j].getAttribute('name');
      let txt_indent = "";
      if(name == 1){
        txt_indent = " ";
      }else if(name == 2){
        txt_indent = "  ";
      }else if(name == 3){
        txt_indent = "   ";
      }
      if(content[j].getAttribute("type") == "toi"){
        scenario_file += txt_indent+"*"+csp+"\n";
      }else{
        scenario_file += txt_indent+"･"+csp+"\n";
      }
    }
  }

  const dbid = getUniqueStr();
  $.ajax({
    url: "php/create_scenario.php", // ファイル名をつける
    type: "POST",
    success:function(data){
      // ダウンロードリンクを作成
      var link = document.createElement( 'a' );
    	link.href = window.URL.createObjectURL( new Blob( [scenario_file] ) );
    	link.download = data; // ファイル名
    	link.click();
    }
  });

}

class Slide{
  constructor(obj){
    let area = $("#document_area");
    const node_id = obj.node_id;
    const slide_id = obj.slide_id;
    const slide_title = obj.slide_title;
    const concept_id = obj.concept_id;
    const quot_slide_id = "\"" + slide_id + "\"";

    // console.log(slide_id);
    // console.log(slide_title);
    // console.log(quot_slide_id);
    let label = "<div class='thread' id='"+slide_id+"' value='スレッド' data-node_id='"+node_id+"' data-concept_id='"+concept_id+"' style='background-color:white; padding:5px; margin-top:5px; margin-bottom:5px; margin-right:5px; margin-left:5px;height:auto; '>"+
                      "<span class = 'tspan' tabindex='0'>"+slide_title+"</span>"+
                      "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Edit_slide(this,"+quot_slide_id+");Record_rank();' style='font-size: 30px;' placeholder='ページタイトル' onkeypress='Keypress(event.keyCode, this);'>"+slide_title+"</textarea>"+
                      "<input id=DeleteButton-"+slide_id+" class='simple_btn' type='button' value='×' onclick='RemoveThread("+quot_slide_id+");Record_rank();' style='width:20px; height:20px; font-size:10px; float:right;'>"+
                      "<br>"+
                      "<select id=SelectBox-"+slide_id+" class='cp_ipselect cp_sl04' name='Logic_options_title'>"+"</select>"+
                  "<div class='purpose'>"+
                   "</div>"+
                "</div>";
    area.append(label);

    $('#document_area').sortable({
      update: function(){
          var log = $(this).sortable("toArray");
          console.log(log);
          // MoveImageArea();
          MoveAndExpensionImageArea();
          Record_rank();
      }
    });

    $('.purpose').sortable({
      update: function(){
          var log = $(this).sortable("toArray");
          console.log(log);
          // MoveImageArea();
          MoveAndExpensionImageArea();
          Record_rank();
      }
    });
  }
}

class SlideImage{
  constructor(obj){
    let area = $("#document_area");
    console.log(obj)
    console.log(obj.node_id);
    const image_ID = obj.node_id;
    const slide_id = obj.slide_id;
    const concept_id = obj.concept_id;
    const quot_slide_id = "\"" + slide_id + "\"";
    var phpURL="get_imageData.php?imageID="+ image_ID;
    console.log(phpURL);
  
    
    let label = "<div class='thread' id='"+slide_id+"' value='スレッド' data-node_id='"+image_ID+"' data-concept_id='"+concept_id+"' style='background-color:white; padding:5px; margin-top:5px; margin-bottom:5px; margin-right:5px; margin-left:5px;height:auto'>"+
    "<img id='preview-"+slide_id+"' class=Image src='"+phpURL+"' alt='選択した画像' width='95%'>"+
    "<input id=DeleteButton-"+slide_id+" class='simple_btn' type='button' value='×' onclick='RemoveThread("+quot_slide_id+");Record_rank();' style='width:20px; height:20px; font-size:10px; float:right;'>"+
    "<br>"+
    "<div class='purpose'>"+
    "</div>"+
    "</div>";

    area.append(label);

    $('#document_area').sortable({
      update: function(){
          var log = $(this).sortable("toArray");
          console.log(log);
          // MoveImageArea();
          MoveAndExpensionImageArea();
          Record_rank();
      }
    });

    $('.purpose').sortable({
      update: function(){
          var log = $(this).sortable("toArray");
          console.log(log);
          // MoveImageArea();
          MoveAndExpensionImageArea();
          Record_rank();
      }
    });
  }
}



class Content{
  constructor(obj){

    const content_id = obj.content_id;
    const node_id = obj.node_id;
    const content = obj.content;
    const slide_id = obj.slide_id;
    const type = obj.type;
    const indent = obj.indent;

    var arr = $('#'+slide_id).data('node_id');
    // console.log(arr);
    if(arr === undefined || arr.length != 0){
      arr = [];
      // console.log("OK");
    }
    arr.push(node_id);
    // console.log(arr);
    $('#'+slide_id).data('node_id', arr);

    var quot_contentid = "\"" + content_id + "\"";

    //内容テキストエリアにノード内容を挿入
    const quot_slide_id = "\"" + slide_id + "\"";
    let area = document.getElementById(quot_slide_id);
    // console.log(area);
    // console.log(slide_id);
    // console.log(quot_slide_id);
    let label = "<div id='"+content_id+"' class='scenario_content'>"+
                  "<span id='"+content_id+"' class = 'cspan' name = '"+indent+"' style = 'width:calc(100% - 25px)' type='"+type+"' tabindex='0'>"+content+"</span>"+
                  "<textarea id='contents-"+content_id+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_contentid+");Record_rank();' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+content+"</textarea>"+
                  "<input id=DeleteButton-"+content_id+" class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_contentid+");Record_rank();'>"+
                  "<select id=SelectBox-"+content_id+" class='cp_ipselect cp_sl05' name='Logic_options_contents'>"+"</select>"+
                "</div>";
    // console.log(label);
    // console.log($('#'+slide_id).children('div'));
    $('#'+slide_id).children('div').append(label);


    $slide_topic.push(content);
    // console.log($slide_topic);

    // console.log("contents-"+content_id);
    var dom_tmp = document.getElementById("contents-"+content_id);
    // console.log(dom_tmp);
    var dom_target = dom_tmp.previousElementSibling;
    // console.log(dom_target);
    if(type=="toi"){
      // dom_target.style.backgroundColor = "#d3d3d3";
      dom_target.style.backgroundColor = "#ffffff";
      dom_target.style.border = "0.3px solid #b8daff";
      dom_target.setAttribute("type","toi");
    } else{
      // dom_target.style.backgroundColor = "#d3d3d3";
      dom_target.style.backgroundColor = "#ffffff";
      dom_target.style.border = "0.3px solid #ffeeba";
      dom_target.setAttribute("type","answer");
    }
    

  }

  // set_Nodeid(content_id, node_id){
  //   var dom_tmp = document.getElementById("contents-"+content_id);
  //   var dom_target = dom_tmp.previousElementSibling;
  //   console.log(dom_target);
  //   dom_target.setAttribute("id",node_id);
  // }

}

//スライド再現の関数
async function Rebuild(){

  await $.ajax({
	    url: "php/scenario_rebuild.php",
	    type: "POST",
	    success: function(arr){
        if(arr == "[]"){
          // console.log(arr);
        }else{
          // console.log(arr);
          var parse = JSON.parse(arr);
          // console.log(parse);//スライドの内容

          for(var i=0; i<parse.length; i++){
            for(var j=0; j<parse.length; j++){
              if(String(i) == parse[j].rank){
                // console.log(parse[j].rank);
                const newslide = new Slide({
              		slide_title: parse[j].title,
              		slide_id: parse[j].slide_id,
              	});  
                delete newslide;
                // console.log("スライド再現完了");
                break;
              }
            }
          }
        }
        console.log("スライドOK");

        //2022-11-23 shimizu 中身を追加
        for(var LogicLabel in Base_ClassLabeltoConceptID){
          // console.log(LogicLabel);
          // console.log(Output_ConceptIDtoClassLabel[LogicLabel]);
          var Label = LogicLabel;
          if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
            $("select[name='Logic_options_title']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
          }
          // $("select[name='Logic_options_title']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
        }
        //関数を追加
        let selectTitleLogic = document.querySelectorAll("[name='Logic_options_title']");
        selectTitleLogic.forEach(select => select.addEventListener('change', ChangeLogicSelectTitle))
        
        console.log("選択肢を追加");
        return 'スライドOK';
	    },
      error:function(){
        console.log("エラーです");
      }
	});
  
}

//スライド再現の関数
//2022-11-24 shimizu
async function Rebuild_s(){

  await $.ajax({
	    url: "php/document_rebuild.php",
	    type: "POST",
	    success: function(arr){
        if(arr == "[]"){
          // console.log(arr);
        }else{
          // console.log(arr);
          var parse = JSON.parse(arr);
          // console.log(parse);//スライドの内容
          // console.log(parse.length);
          
          for(var i=0; i<parse.length; i++){
            for(var j=0; j<parse.length; j++){
              // console.log(String(i));
              // console.log(parse[j].rank);
              if(String(i) == parse[j].rank){
                // console.log(parse[j]);
                if(parse[j].concept_id == "notid"){
                  const image = new SlideImage({
                    slide_title: parse[j].title,
                    slide_id: parse[j].slide_id,
                    node_id: parse[j].node_id,
                    concept_id: parse[j].concept_id
                  });  
                  delete image;
                  console.log("画像再現完了");
                  break;
                }
                else{
                  const newslide = new Slide({
                    slide_title: parse[j].title,
                    slide_id: parse[j].slide_id,
                    logic_option: parse[j].logic_option,
                    node_id: parse[j].node_id,
                    concept_id: parse[j].concept_id
                  });  
                  delete newslide;
                  console.log("スライド再現完了");
                  break;
                }
              }
            }
          }
        }
        // console.log("スライドOK");

        //2022-11-23 shimizu 中身を追加
        for(var LogicLabel in Base_ClassLabeltoConceptID){
          // console.log(LogicLabel);
          // console.log(Base_ClassLabeltoConceptID[LogicLabel]);
          var Label = LogicLabel;
          if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
            $("select[name='Logic_options_title']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
          }
        }

        //関数を追加
        let selectTitleLogic = document.querySelectorAll("[name='Logic_options_title']");
        selectTitleLogic.forEach(select => select.addEventListener('change', ChangeLogicSelectTitle));
        //選択ずみの値を設定
        if(parse.length !== undefined){
          for(var q=0; q<parse.length; q++){
            console.log(parse[q].slide_id);
            var selected_id = "SelectBox-"+parse[q].slide_id;
            console.log(selected_id);
            var objSelect = document.getElementById(selected_id);
            console.log(objSelect);
            console.log(parse[q].logic_option)
            
            if(objSelect){
              objSelect.options[parse[q].logic_option].selected = true;
            }
          }
        }
        
        // console.log("選択肢を追加");
        return 'スライドOK';
	    },
      error:function(){
        console.log("エラーです");
      }
	});

  await $.ajax({
    url: "php/get_LogicSlideRelation.php",
    type: "POST",
    success: function(arr){
      if(arr == "[]"){
        //console.log(arr);
      }else{
        //console.log(arr);
        var parse = JSON.parse(arr);
        console.log(parse);//スライド上に追加してあるのノードの内容
        console.log(parse.length);//スライド上に追加してあるのノードの個数
        
        for(var i=0; i<parse.length; i++){
 
          var select_box_id1 = "SelectBox-"+parse[i].thread1_id;
          var select_box_id2 = "SelectBox-"+parse[i].thread2_id;
          var select_box1 = document.getElementById(select_box_id1);
          var select_box2 = document.getElementById(select_box_id2);
          
          var createElement1 = document.createElement('span')
          createElement1.id = parse[i].id+","+parse[i].thread1_id;
          createElement1.className = "badge bg-red";
          createElement1.textContent = parse[i].thread1_label;
          createElement1.setAttribute('ontlogy_id',parse[i].ont1_id); 
          // delete_button1.after(createElement1);
          select_box1.after(createElement1);
 

          var createElement2 = document.createElement('span')
          createElement2.id = parse[i].id+","+parse[i].thread2_id;
          createElement2.className = "badge bg-red";
          createElement2.textContent = parse[i].thread2_label; 
          createElement2.setAttribute('ontlogy_id',parse[i].ont2_id);
          // delete_button2.after(createElement2);
          select_box2.after(createElement2);
          //                                       
              
        }
        console.log("関係性を追加");
      }
    },
    error:function(){
      console.log("エラーです");
    }
  });
  
}

//2022-12-13 shimizu 
async function CreateDocumentXML(){
  var LR_counter = 0;
  var count = 0;
  await $.ajax({
	    url: "php/get_LogicRelation.php",
	    type: "POST",
	    success: function(arr){
        if(arr == "[]"){
          // console.log(arr);
        }else{
          // console.log(arr);
          var parse = JSON.parse(arr);
          LR_counter += parse.length;

          for(var i=0; i<parse.length; i++){
            var RelationNodes = parse[i].id+","+parse[i].doc_con1_id +"."+ parse[i].id+","+parse[i].doc_con2_id;
            // console.log(RelationNodes) 
            Count_LogicRelationLabel[count] = parse[i].doc_con1_label+"を根拠として"+parse[i].doc_con2_label;
            console.log(Count_LogicRelationLabel[i]);
            Count_LogicRelationNodes[count] = RelationNodes;
            Count_LogicRelationConceptID[count] = OutputLabel_ClassConceptID[Count_LogicRelationLabel[i]];
            count++;
          }
          //デバッグ用；中身確認
          // for(var i=0; i<parse.length; i++){
          //   console.log(Count_LogicRelationLabel[i]);
          //   console.log(Count_LogicRelationNodes[i]);
          //   console.log(Count_LogicRelationConceptID[i]);
          // }
        }
        console.log("関係取得");
    
	    },
      error:function(){
        console.log("エラーです");
      }
	});

  await $.ajax({
    url: "php/get_SlideLogicRelation.php",
    type: "POST",
    success: function(arr){
      if(arr == "[]"){
        // console.log(arr);
      }else{
        // console.log(arr);
        var parse = JSON.parse(arr);
        LR_counter += parse.length;

        for(var i=0; i<parse.length; i++){
          var RelationNodes =parse[i].id+","+parse[i].thread1_id +"."+ parse[i].id+","+parse[i].thread2_id;
          // console.log(RelationNodes) 
          Count_LogicRelationLabel[count] = parse[i].thread1_label+"を根拠として"+parse[i].thread2_label;
          console.log(Count_LogicRelationLabel[i]);
          Count_LogicRelationNodes[count] = RelationNodes;
          Count_LogicRelationConceptID[count] = OutputLabel_ClassConceptID[Count_LogicRelationLabel[i]];
        }
      }
      console.log("関係取得");
  
    },
    error:function(){
      console.log("エラーです");
    }
});

  var SlideIDs = [];
  var SlideLogicIndex = {};
  await $.ajax({
    url: "php/get_SlideID.php",
    type: "POST",
    success: function(arr2){
      if(arr2 == "[]"){
        console.log(arr2);
      }else{
        // console.log(arr2);
        var parse2 = JSON.parse(arr2);
        console.log(parse2);//スライドの内容
        console.log(parse2.length);
        for(var i=0; i<parse2.length; i++){
          // console.log(parse2[i]);
          // console.log(parse2[i].slide_id);
          SlideIDs.push(parse2[i].slide_id);
          SlideLogicIndex[i] = parse2[i].logic_option;
        }
        //デバッグ用；中身確認
        // for(var i=0; i<parse.length; i++){
        //   console.log(Count_LogicRelationLabel[i]);
        //   console.log(Count_LogicRelationNodes[i]);
        //   console.log(Count_LogicRelationConceptID[i]);
        // }
      }
      console.log("スライド番号取得");
  
    },
    error:function(){
      console.log("エラーです");
    }
  });
  
  for(var SlideCount=0; SlideCount<SlideIDs.length; SlideCount++){
    await $.ajax({
      url: "php/get_LogicConcept.php",
      type: "POST",
      data: { slide_id : SlideIDs[SlideCount] },
      success: function(arr3){
        var slide_ID = SlideIDs[SlideCount];
        var DocContetRank_LogicIndexNumber = {};
        if(arr3 == "[]"){
          console.log(arr3);
        }else{
          // console.log(arr);
          var parse3 = JSON.parse(arr3);
          for(var i=0; i<parse3.length; i++){
            // console.log("順番："+parse3[i].rank);
            // console.log("インデックス番号："+parse3[i].logic_option);
            DocContetRank_LogicIndexNumber[parse3[i].rank] = parse3[i].logic_option;
          }
        }
        SlideID_DCR_LINumber[slide_ID] = DocContetRank_LogicIndexNumber;
        console.log("論理構成取得");
      },
      error:function(){
        console.log("エラーです");
      }
    });
  }

  var RCount = 0;
  Object.keys(Count_LogicRelationNodes).forEach(key => {
    	// console.log(key);
      RCount++;
  });
  // console.log(RCount);

  console.log("XMLを作成開始");

  //2022-12-13 関係性を取得
  var RelationCount = LR_counter;
  // console.log(RelationCount);
  // ファイルの出力処理
  var xmlSource = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlSource += '<Information xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n';
   // セマンティクス一つ一つの情報
  xmlSource += '<list>\n';
  // console.log(windowWidth);  //1290
  // console.log(windowHeight); //792

  //0.資料作成範囲の大きさ（横幅，縦幅）を取得する
  var DocumentAreaWidth = document.getElementById("document_area").clientWidth;
  var DocumentAreaHeight = document.getElementById("document_area").clientHeight;
  console.log(DocumentAreaWidth); //838
  console.log(DocumentAreaHeight);  //1296
  
  //1．資料タイトルの大きさ(横幅，縦幅）を取得する
  var SlideTitleWidth = document.getElementById("document_title").clientWidth;
  // console.log(SlideTitleWidth); //838
  var SlideTitleHeight = document.getElementById("document_title").clientHeight;
  // console.log(SlideTitleHeight); //52

  //2.資料上のノード情報を取得する
  var SlideTitle = document.getElementsByClassName("tspan");
  // console.log(SlideTitle);
  var slide_dom = document.getElementsByClassName("thread");
  // console.log(slide_dom);
  var content_dom;
  var SlideCount = slide_dom.length;

  //資料上のノード情報をAOIにするのに必要な情報を出力する
  var AOI_InstanceIDnumber = 1; //AoiのID用
  var AOI_LogicInstanceIDNumber = 1;
  var SlideTitleStartY;
  var ParentAoiID ;
  for(var i=0; i<slide_dom.length; i++){
    var content_dom = $(slide_dom[i]).find('.scenario_content');
    console.log(SlideTitle[i]);
    if(SlideTitle[i]){
      var ContentsTitleHeight = SlideTitle[i].clientHeight;
    }
    var slide_width = slide_dom[i].clientWidth;
    var slide_height = slide_dom[i].clientHeight;
  
    const style = window.getComputedStyle(slide_dom[i]);
    const slide_margin = style.getPropertyValue('margin');
    const slide_margin_int = parseInt(slide_margin); // 'px' を除いた数値に変換する
    var slide_id = slide_dom[i].id;
    var slide_node_id = slide_dom[i].getAttribute("data-node_id");
    var slide_concept_id = slide_dom[i].getAttribute("data-concept_id");
    var slide_label = slide_dom[i].firstElementChild.innerHTML;

    console.log("slide_width : "+slide_width);

    var research_Slide_label = ConceptID_ClassLabel[slide_concept_id];
    
    if(i == 0){
      SlideTitleStartY = SlideTitleHeight+slide_margin_int;
    }else{
      SlideTitleStartY += slide_dom[i-1].clientHeight+slide_margin_int+1; //この1は調整の1
    }
    var SlideLogicIndexNumber = SlideLogicIndex[i];
    console.log(SlideLogicIndexNumber);
    console.log(slide_dom[i].childElementCount)

    var SlideLogicConceptLabel =  Base_IndexNumberToClassLabel[SlideLogicIndexNumber];
    console.log(SlideLogicConceptLabel);
    var SlideLogicConceptID = Base_ClassLabeltoConceptID[SlideLogicConceptLabel];
    const AOIContentsID = 100+AOI_InstanceIDnumber;
    var AOICount = 1;
    const Parent_AoiID = 100 + AOICount;
    
    // //先にコンテンツ分のAOIを設定する
    xmlSource +=  '   <AOI>\n';
    xmlSource +=  '     <id>'+AOIContentsID+'</id>\n';
    xmlSource +=  '     <node_id>'+slide_node_id+'</node_id>\n';
    xmlSource +=  '     <sentence>'+slide_label+'</sentence>\n';
    xmlSource +=  '     <semantics>\n';
    xmlSource +=  '       <research_activity_concept>\n';
    xmlSource +=  '         <research_activity_concept_instance_id>'+(200+AOI_InstanceIDnumber)+'</research_activity_concept_instance_id>\n';
    xmlSource +=  '         <research_activity_concept_id>'+slide_concept_id+'</research_activity_concept_id>\n';//concept_id
    xmlSource +=  '         <research_activity_label>'+research_Slide_label+'</research_activity_label>\n';//ノードのラベル
    xmlSource +=  '       </research_activity_concept>\n';
    xmlSource +=  '       <logic_instances>\n';//論理構成は複数あることを想定
    //文章ごとにつける絶対関係の論理構成意図
    xmlSource +=  '         <logic_instance>\n';
    xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
    xmlSource +=  '           <logic_instance_ontlogy_id>'+SlideLogicConceptID+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
    xmlSource +=  '           <logic_instance_label>'+SlideLogicConceptLabel +'</logic_instance_label>\n'; //論理構成意図としてのラベル
    xmlSource +=  '         </logic_instance>\n';
                            //相対的につける論理構成意図
                            if(slide_dom[i].childElementCount >= 7){
                              var SlideBadgeCount = slide_dom[i].childElementCount - 6;
                              console.log(SlideBadgeCount);
                              for(var SBC = 0; SBC<SlideBadgeCount;SBC++){
                                AOI_LogicInstanceIDNumber++;
                                var Num = SBC + 5;

                                xmlSource +=  '         <logic_instance>\n';
                                xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
                                xmlSource +=  '           <logic_instance_ontlogy_id>'+slide_dom[i].children[Num].getAttribute("ontlogy_id")+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
                                xmlSource +=  '           <logic_instance_label>'+slide_dom[i].children[Num].innerHTML +'</logic_instance_label>\n'; //論理構成意図としてのラベル
                                xmlSource +=  '         </logic_instance>\n';

                                BadgeID_InstanceID[slide_dom[i].children[Num].id] = 300+AOI_LogicInstanceIDNumber;
                              }
                            }
    
    xmlSource +=  '       </logic_instances>\n';
    xmlSource +=  '     </semantics>\n';
    xmlSource +=  '     <X>'+(slide_margin_int/DocumentAreaWidth)*100+'</X>\n';
    xmlSource +=  '     <Y>'+(SlideTitleStartY/DocumentAreaHeight)*100+'</Y>\n';  //2023_0508 この1は調整の1
    xmlSource +=  '     <Wid>'+(slide_width/DocumentAreaWidth)*100+'</Wid>\n';
    xmlSource +=  '     <Hei>'+(slide_height/DocumentAreaHeight)*100+'</Hei>\n';
    xmlSource +=  '     <X_px>'+slide_margin_int+'</X_px>\n';
    xmlSource +=  '     <Y_px>'+SlideTitleStartY+'</Y_px>\n';
    xmlSource +=  '     <Wid_px>'+slide_width+'</Wid_px>\n';
    xmlSource +=  '     <Hgt_px>'+slide_height+'</Hgt_px>\n';
    xmlSource +=  '     <parent_id>'+0+'</parent_id>\n';
    xmlSource +=  '     <color_A>'+255+'</color_A>\n';
    xmlSource +=  '     <color_R>'+128+'</color_R>\n';
    xmlSource +=  '     <color_G>'+255+'</color_G>\n';
    xmlSource +=  '     <color_B>'+255+'</color_B>\n';
    xmlSource +=  '     <type>A</type>\n';
    xmlSource +=  '   </AOI>\n';

    AOI_InstanceIDnumber++;
    AOI_LogicInstanceIDNumber++

    var AOICOUNTER = 0;
    var NodeCounter = 0;
    var NODEsHeight = 0;
    var reserchLabel ;

    if(content_dom[0]){
      console.log("要素あり");
      var AreaStartPointY = (SlideTitleStartY+ContentsTitleHeight) - 2; //20230509 ノードより外側にあることの担保
      const AreaWidth = content_dom[0].firstElementChild.clientWidth;
      var NodeID_AoiID = {}; //Key：node_id，Value：コンテンツのAOIid
      //コンテンツ上のノードAOIを設定する
      console.log(content_dom.length);
      
      // for(var k=0; k<content_dom.length; k++){

      //   const content = content_dom[k].firstElementChild.innerHTML;
      //   const node_id = content_dom[k].firstElementChild.getAttribute('node_id');
      //   const indent = content_dom[k].firstElementChild.getAttribute('name');
      //   const concept_id = content_dom[k].firstElementChild.getAttribute('concept_id');
      //   const NodeHeight = content_dom[k].firstElementChild.clientHeight;
      //   var Temp_X = 0;
      //   var Temp_Xpx = 0;
        
      //   // console.log(content_dom[k]);
      //   // console.log(content_dom[k].childElementCount);
      //   // console.log(content_id);
      //   // console.log(node_id);
      //   console.log("NodeWidth+10 : "+(AreaWidth+10));
      //   // console.log("NodeHeight : "+NodeHeight);
        
      //   var LogicIndexNumber = SlideID_DCR_LINumber[slide_id][k];
      //   var LogicConceptLabel = Base_IndexNumberToClassLabel[LogicIndexNumber];   
      //   var LogicConceptID = Base_ClassLabeltoConceptID[LogicConceptLabel];

      //   console.log(k);

      //   //インデントしてない同士でがきたら値を初期化して次のループへ
      //   if(k > 0 && content_dom[k-1].firstElementChild.getAttribute('name') == indent && indent == 0){
      //     AreaStartPointY += NODEsHeight; //今回の分
      //     AOICOUNTER = 0;
      //     NodeCounter = 0;
      //     NODEsHeight = 0;
      //     badgeTrueNodeCount = 0;      
      //     NodeID_AoiID[content_dom[k-1].firstElementChild.getAttribute('node_id')] = Parent_AoiID;
      //     // console.log("この前もインデントが0なので，リセット："+content);
      //     AOICOUNTER++;
      //     NodeCounter++;
      //     NODEsHeight += (8+NodeHeight);
      //     if(content_dom[k].childElementCount >= 5){
      //       NODEsHeight += 3;//3はバッジの高さ 
      //     }
      //     reserchLabel = ConceptID_ClassLabel[concept_id];
      //     var contents_label = content_dom[k].firstElementChild.innerHTML;
      //     NodeID_AoiID[node_id] = 100+AOI_InstanceIDnumber;
      //     // console.log("改めて初回としてあつかう"+content);
      //     continue;
      //   }

      //   //最初の一つめのノード
      //   if(indent == 0 && AOICOUNTER == 0){
      //     AOICOUNTER++;
      //     NodeCounter++;
      //     NODEsHeight += (8+NodeHeight); 
      //     var contents_label = content_dom[k].firstElementChild.innerHTML;
      //     NodeID_AoiID[node_id]=100+AOI_InstanceIDnumber;
      //     //初回なのでAreaStartPointYは変わらない
      //     reserchLabel = ConceptID_ClassLabel[concept_id];
      //     console.log(content);
      //   }else if(indent == 0 && AOICOUNTER == 1){
      //     // NODEsHeight += 28+NodeHeight;
      //     Temp_Xpx = 8;
      //     Temp_X = 8/DocumentAreaWidth;
      //     // console.log("出力：今回のインデントが0で既に蓄積がある場合")
      //     // console.log("nodeCounter : "+NodeCounter);
      //     // console.log("AreaStartPointY : "+AreaStartPointY);
      //     // console.log("NODEsHeight : "+NODEsHeight)
      //     // console.log(reserchLabel);
      //     //資料の上のノードidが持つ必要な情報を取得する．
      //     //必要な情報[node_id,concept_id,(ver),x座標,y座標，横の長さ，縦の長さ，それぞれの割合．]
      //     xmlSource +=  '   <AOI>\n';
      //     xmlSource +=  '     <id>'+(100+AOI_InstanceIDnumber)+'</id>\n';
      //     xmlSource +=  '     <node_id>'+node_id+'</node_id>\n';
      //     xmlSource +=  '     <sentence>'+contents_label+'</sentence>\n';
      //     xmlSource +=  '     <semantics>\n';
      //     xmlSource +=  '       <research_activity_concept>\n';
      //     xmlSource +=  '         <research_activity_concept_instance_id>'+(200+AOI_InstanceIDnumber)+'</research_activity_concept_instance_id>\n';
      //     xmlSource +=  '         <research_activity_concept_id>'+concept_id+'</research_activity_concept_id>\n';//concept_id
      //     xmlSource +=  '         <research_activity_label>'+reserchLabel+'</research_activity_label>\n';//ノードのラベル
      //     xmlSource +=  '       </research_activity_concept>\n';
      //     xmlSource +=  '       <logic_instances>\n';//論理構成は複数あることを想定
      //     xmlSource +=  '         <logic_instance>\n';
      //     xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
      //     xmlSource +=  '           <logic_instance_ontlogy_id>'+LogicConceptID+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
      //     xmlSource +=  '           <logic_instance_label>'+LogicConceptLabel +'</logic_instance_label>\n'; //論理構成意図としてのラベル
      //     xmlSource +=  '         </logic_instance>\n';
      //                             //相対的に設定した論理構成意図
      //                             if(content_dom[k].childElementCount >= 5){
      //                               var NodeBadgeCount = content_dom[k].childElementCount - 4;
      //                               console.log(NodeBadgeCount);
      //                               for(var NBC = 0; NBC < NodeBadgeCount; NBC++){
      //                                 AOI_LogicInstanceIDNumber++
      //                                 var Num2 = NBC + 4;
      //                                 // console.log(content_dom[k].children[Num2]);
      //                                 // console.log(content_dom[k].children[Num2].innerHTML);
      //                                 xmlSource +=  '         <logic_instance>\n';
      //                                 xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
      //                                 xmlSource +=  '           <logic_instance_ontlogy_id>'+content_dom[k].children[Num2].getAttribute("ontlogy_id")+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
      //                                 xmlSource +=  '           <logic_instance_label>'+content_dom[k].children[Num2].innerHTML +'</logic_instance_label>\n'; //論理構成意図としてのラベル
      //                                 xmlSource +=  '         </logic_instance>\n';
      //                                 // console.log(content_dom[k].children[Num2].id);
      //                                 // console.log(300+AOI_LogicInstanceIDNumber);
      //                                 BadgeID_InstanceID[content_dom[k].children[Num2].id] = 300+AOI_LogicInstanceIDNumber;
      //                               }
      //                             }
      //     xmlSource +=  '       </logic_instances>\n';
      //     xmlSource +=  '     </semantics>\n';
      //     xmlSource +=  '     <X>'+Temp_X*100+'</X>\n';
      //     xmlSource +=  '     <Y>'+(AreaStartPointY/DocumentAreaHeight)*100+'</Y>\n';
      //     xmlSource +=  '     <Wid>'+((AreaWidth+10)/DocumentAreaWidth)*100+'</Wid>\n';
      //     xmlSource +=  '     <Hei>'+((NODEsHeight+2)/DocumentAreaHeight)*100+'</Hei>\n';//20230509 開始地点を2上にしているため追加で2をたしている
      //     xmlSource +=  '     <X_px>'+Temp_Xpx+'</X_px>\n';
      //     xmlSource +=  '     <Y_px>'+AreaStartPointY+'</Y_px>\n';
      //     xmlSource +=  '     <Wid_px>'+(AreaWidth+10)+'</Wid_px>\n';
      //     xmlSource +=  '     <Hgt_px>'+(NODEsHeight+2)+'</Hgt_px>\n';
      //     xmlSource +=  '     <parent_id>'+AOIContentsID+'</parent_id>\n';
      //     xmlSource +=  '     <color_A>'+255+'</color_A>\n';
      //     xmlSource +=  '     <color_R>'+128+'</color_R>\n';
      //     xmlSource +=  '     <color_G>'+255+'</color_G>\n';
      //     xmlSource +=  '     <color_B>'+255+'</color_B>\n';
      //     xmlSource +=  '     <type>B</type>\n';
      //     xmlSource +=  '   </AOI>\n';

      //     AOI_InstanceIDnumber++;
      //     AOI_LogicInstanceIDNumber++
        
      //     AreaStartPointY += NODEsHeight;
      //     NODEsHeight = 8+NodeHeight; //これまでの内容で出力しているので，今回の自分の高さを追加
      //     if(content_dom[k].childElementCount >= 5){
      //       NODEsHeight += 3;//3はバッジの高さ 
      //     }
      //     NodeCounter = 1; 
      //     if(k == content_dom.length -1){
      //       NodeID_AoiID[node_id] = Parent_AoiID;
      //     }else{
      //       NodeID_AoiID[node_id] = 100+AOI_InstanceIDnumber;
      //     }
      //     // console.log("次回からのAreaの始点"+AreaStartPointY);
      //     reserchLabel = ConceptID_ClassLabel[concept_id];
      //     var contents_label = content_dom[k].firstElementChild.innerHTML;

      //   }else if((k == content_dom.length-1 )&& indent != 0){
      //     // console.log(k);
      //     // console.log("最後かつ今回のインデントが0でないなら出力")
      //     if(content_dom[k].childElementCount >= 5){
      //       NODEsHeight += 3;//3はバッジの高さ 
      //     }
      //     NODEsHeight += 8+NodeHeight; 
      //     NodeCounter++;
      //     Temp_Xpx = 8; // 20230509 shimizu BはAの内側かつ，Cより外側にあることを保証するため
      //     Temp_X = 8/DocumentAreaWidth;
      //     NodeID_AoiID[node_id] = 100+AOI_InstanceIDnumber;
      //     // console.log("NodeCounter : "+NodeCounter);
      //     // console.log("AreaStartPointY : "+AreaStartPointY);
      //     // console.log("NODEsHeight : "+NODEsHeight)
      //     //資料の上のノードidが持つ必要な情報を取得する．
      //     //必要な情報[node_id,concept_id,(ver),x座標,y座標，横の長さ，縦の長さ，それぞれの割合．]
      //     xmlSource +=  '   <AOI>\n';
      //     xmlSource +=  '     <id>'+(100+AOI_InstanceIDnumber)+'</id>\n';
      //     xmlSource +=  '     <node_id>'+node_id+'</node_id>\n';
      //     xmlSource +=  '     <sentence>'+contents_label+'</sentence>\n';
      //     xmlSource +=  '     <semantics>\n';
      //     xmlSource +=  '       <research_activity_concept>\n';
      //     xmlSource +=  '         <research_activity_concept_instance_id>'+(200+AOI_InstanceIDnumber)+'</research_activity_concept_instance_id>\n';
      //     xmlSource +=  '         <research_activity_concept_id>'+concept_id+'</research_activity_concept_id>\n';//concept_id
      //     xmlSource +=  '         <research_activity_label>'+reserchLabel+'</research_activity_label>\n';//ノードのラベル
      //     xmlSource +=  '       </research_activity_concept>\n';
      //     xmlSource +=  '       <logic_instances>\n';//論理構成は複数あることを想定
      //     xmlSource +=  '         <logic_instance>\n';
      //     xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
      //     xmlSource +=  '           <logic_instance_ontlogy_id>'+LogicConceptID+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
      //     xmlSource +=  '           <logic_instance_label>'+LogicConceptLabel +'</logic_instance_label>\n'; //論理構成意図としてのラベル
      //     xmlSource +=  '         </logic_instance>\n';
      //                             //相対的に設定した論理構成意図
      //                             if(content_dom[k].childElementCount >= 5){
      //                               var NodeBadgeCount = content_dom[k].childElementCount - 4;
      //                               // console.log(NodeBadgeCount);
      //                               for(var NBC = 0; NBC < NodeBadgeCount; NBC++){
      //                                 AOI_LogicInstanceIDNumber++
      //                                 var Num2 = NBC + 4;
      //                                 // console.log(content_dom[k].children[Num2]);
      //                                 // console.log(content_dom[k].children[Num2].innerHTML);
      //                                 xmlSource +=  '         <logic_instance>\n';
      //                                 xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
      //                                 xmlSource +=  '           <logic_instance_ontlogy_id>'+content_dom[k].children[Num2].getAttribute("ontlogy_id")+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
      //                                 xmlSource +=  '           <logic_instance_label>'+content_dom[k].children[Num2].innerHTML +'</logic_instance_label>\n'; //論理構成意図としてのラベル
      //                                 xmlSource +=  '         </logic_instance>\n';
      //                                 // console.log(content_dom[k].children[Num2].id);
      //                                 // console.log(300+AOI_LogicInstanceIDNumber);
      //                                 BadgeID_InstanceID[content_dom[k].children[Num2].id] = 300+AOI_LogicInstanceIDNumber;
      //                               }
      //                             }
      //     xmlSource +=  '       </logic_instances>\n';
      //     xmlSource +=  '     </semantics>\n';
      //     xmlSource +=  '     <X>'+Temp_X*100+'</X>\n';
      //     xmlSource +=  '     <Y>'+(AreaStartPointY/DocumentAreaHeight)*100+'</Y>\n';
      //     xmlSource +=  '     <Wid>'+((AreaWidth+10)/DocumentAreaWidth)*100+'</Wid>\n';
      //     xmlSource +=  '     <Hei>'+((NODEsHeight+2)/DocumentAreaHeight)*100+'</Hei>\n';
      //     xmlSource +=  '     <X_px>'+Temp_Xpx+'</X_px>\n';
      //     xmlSource +=  '     <Y_px>'+AreaStartPointY+'</Y_px>\n';
      //     xmlSource +=  '     <Wid_px>'+(AreaWidth+10)+'</Wid_px>\n';
      //     xmlSource +=  '     <Hgt_px>'+(NODEsHeight+2)+'</Hgt_px>\n';
      //     xmlSource +=  '     <parent_id>'+AOIContentsID+'</parent_id>\n';
      //     xmlSource +=  '     <color_A>'+255+'</color_A>\n';
      //     xmlSource +=  '     <color_R>'+128+'</color_R>\n';
      //     xmlSource +=  '     <color_G>'+255+'</color_G>\n';
      //     xmlSource +=  '     <color_B>'+255+'</color_B>\n';
      //     xmlSource +=  '     <type>B</type>\n';
      //     xmlSource +=  '   </AOI>\n';

      //     AOI_InstanceIDnumber++;
      //     AOI_LogicInstanceIDNumber++
          
      //     AreaStartPointY += NODEsHeight; 
      //     NODEsHeight = 0;
      //     NodeCounter = 0;
      //     // console.log(AreaStartPointY);
      //     reserchLabel = ConceptID_ClassLabel[concept_id];
      //   }else if(indent != 0 && k != content_dom.length-1){
      //     // console.log("インデントなし，最後ではない"+content);
      //     NodeCounter++;
      //     if(content_dom[k].childElementCount >= 5){
      //       NODEsHeight += 3;//3はバッジの高さ 
      //     }
      //     NODEsHeight += 8+NodeHeight; 
      //     NodeID_AoiID[node_id] = 100+AOI_InstanceIDnumber;
      //   }
      // }

      //ノード単体のid
      
      var beforeNodeTagTlue = 0;
      var badgeCount = 0;
      var NodeHeightMarge = 0;
      for(var h=0; h<content_dom.length; h++){
        console.log(content_dom[h]);
        var selectElement = content_dom[h].querySelector('select');
        var selectElementHeight = selectElement.offsetHeight;
        
        // const content = content_dom[h].firstElementChild.innerHTML;
        const node_id = content_dom[h].firstElementChild.getAttribute('node_id');
        const indent = content_dom[h].firstElementChild.getAttribute('name');
        const concept_id = content_dom[h].firstElementChild.getAttribute('concept_id');
        const sentence_label =  content_dom[h].firstElementChild.innerHTML;
        const NodeWidth = content_dom[h].firstElementChild.clientWidth;
        var NodeHeight = content_dom[h].firstElementChild.clientHeight;
      
        var Temp_X = 0;
        var Temp_Xpx = 0;
        var resarch_Node_Label = ConceptID_ClassLabel[concept_id];


        // console.log(content_id);
        // console.log(node_id);
        console.log("NodeWidth :"+NodeWidth);
        console.log(NodeHeight);
        console.log(selectElementHeight);
        
        var LogicIndexNumber = SlideID_DCR_LINumber[slide_id][h];
        var LogicConceptLabel = Base_IndexNumberToClassLabel[LogicIndexNumber];   
        var LogicConceptID = Base_ClassLabeltoConceptID[LogicConceptLabel];
      

        //xml:Node用
        if(indent == 0){
          // console.log("tab0");
          // AreaCounter++;
          Temp_Xpx = 11;
          Temp_X = 11/DocumentAreaWidth;
        }else if(indent == 1){
          // console.log("tab1");
          Temp_Xpx =31;
          Temp_X = 31/DocumentAreaWidth;
          // NodeWidth = NodeWidth - 20;
        }else if(indent == 2){
          // console.log("tab2");
          Temp_Xpx = 51;
          Temp_X = 51/DocumentAreaWidth;
          // NodeWidth = NodeWidth - 40;
        }else{
          // console.log("tab3");
          Temp_Xpx = 71;
          Temp_X = 71/DocumentAreaWidth;
          // NodeWidth = NodeWidth - 60;
        }

        if(h >= 1 && content_dom[h-1].childElementCount >= 5){
          beforeNodeTagTlue = 3;
          badgeCount += 1;
        }
        console.log("NodeHeightMarge : "+NodeHeightMarge);
        var NodeStartPointY = (SlideTitleStartY+ContentsTitleHeight) + NodeHeightMarge + (beforeNodeTagTlue* badgeCount);
        // var NodeStartPointY = (SlideTitleStartY+ContentsTitleHeight) + (NodeHeight+3)*h + (beforeNodeTagTlue* badgeCount);  //この5はnodeのmargin-bottom分，3はノードごとのselectboxの大きさ

        if(node_id in NodeID_AoiID){
          console.log("node_idが連想配列にある")
          console.log(node_id);
          ParentAoiID = NodeID_AoiID[node_id];
          console.log(ParentAoiID);
        }else{
          console.log("node_idが連想配列にない");
          ParentAoiID = AOIContentsID;
        }

        console.log("h : "+h);
        console.log("NodeStartPointY : "+NodeStartPointY);
        //資料の上のノードidが持つ必要な情報を取得する．
        //必要な情報[node_id,concept_id,(ver),x座標,y座標，横の長さ，縦の長さ   ，それぞれの割合．]
        xmlSource +=  '   <AOI>\n';
        xmlSource +=  '     <id>'+(100+AOI_InstanceIDnumber)+'</id>\n';
        xmlSource +=  '     <node_id>'+node_id+'</node_id>\n';
        xmlSource +=  '     <sentence>'+sentence_label+'</sentence>\n';
        xmlSource +=  '     <semantics>\n';
        xmlSource +=  '       <research_activity_concept>\n';
        xmlSource +=  '         <research_activity_concept_instance_id>'+(200+AOI_InstanceIDnumber)+'</research_activity_concept_instance_id>\n';
        xmlSource +=  '         <research_activity_concept_id>'+concept_id+'</research_activity_concept_id>\n';//concept_id
        xmlSource +=  '         <research_activity_label>'+resarch_Node_Label+'</research_activity_label>\n';//ノードのラベル
        xmlSource +=  '       </research_activity_concept>\n';
        xmlSource +=  '       <logic_instances>\n';//論理構成は複数あることを想定
        xmlSource +=  '         <logic_instance>\n';
        xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
        xmlSource +=  '           <logic_instance_ontlogy_id>'+LogicConceptID+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
        xmlSource +=  '           <logic_instance_label>'+LogicConceptLabel +'</logic_instance_label>\n'; //論理構成意図としてのラベル
        xmlSource +=  '         </logic_instance>\n';
                                //相対的に設定した論理構成意図
                                if(content_dom[h].childElementCount >= 5){
                                  var NodeBadgeCount = content_dom[h].childElementCount - 4;
                                  // console.log(NodeBadgeCount);
                                  for(var NBC = 0; NBC < NodeBadgeCount; NBC++){
                                    AOI_LogicInstanceIDNumber++
                                    var Num2 = NBC + 4;
                                    // console.log(content_dom[h].children[Num2]);
                                    // console.log(content_dom[h].children[Num2].innerHTML);
                                    xmlSource +=  '         <logic_instance>\n';
                                    xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
                                    xmlSource +=  '           <logic_instance_ontlogy_id>'+content_dom[h].children[Num2].getAttribute("ontlogy_id")+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
                                    xmlSource +=  '           <logic_instance_label>'+content_dom[h].children[Num2].innerHTML +'</logic_instance_label>\n'; //論理構成意図としてのラベル
                                    xmlSource +=  '         </logic_instance>\n';
                                    // console.log(content_dom[h].children[Num2].id);
                                    // console.log(content_dom[h].children[Num2].clientHeight);
                                    NodeHeight += 3;
                                    
                                    // console.log(300+AOI_LogicInstanceIDNumber);
                                    BadgeID_InstanceID[content_dom[h].children[Num2].id] = 300+AOI_LogicInstanceIDNumber;
                                  }
                                }
        xmlSource +=  '       </logic_instances>\n';
        xmlSource +=  '     </semantics>\n';
        xmlSource +=  '     <X>'+Temp_X*100+'</X>\n';
        xmlSource +=  '     <Y>'+(NodeStartPointY/DocumentAreaHeight)*100+'</Y>\n';
        xmlSource +=  '     <Wid>'+(NodeWidth/DocumentAreaWidth)*100+'</Wid>\n';
        xmlSource +=  '     <Hei>'+((NodeHeight+selectElementHeight)/DocumentAreaHeight)*100+'</Hei>\n';
        xmlSource +=  '     <X_px>'+Temp_Xpx+'</X_px>\n';
        xmlSource +=  '     <Y_px>'+NodeStartPointY+'</Y_px>\n';
        xmlSource +=  '     <Wid_px>'+NodeWidth+'</Wid_px>\n';
        xmlSource +=  '     <Hgt_px>'+(NodeHeight+selectElementHeight)+'</Hgt_px>\n';
        xmlSource +=  '     <parent_id>'+ParentAoiID+'</parent_id>\n';
        xmlSource +=  '     <color_A>'+255+'</color_A>\n';
        xmlSource +=  '     <color_R>'+128+'</color_R>\n';
        xmlSource +=  '     <color_G>'+255+'</color_G>\n';
        xmlSource +=  '     <color_B>'+255+'</color_B>\n';
        xmlSource +=  '     <type>C</type>\n';
        xmlSource +=  '   </AOI>\n';

        AOI_InstanceIDnumber++;
        AOI_LogicInstanceIDNumber++
        NodeHeightMarge += NodeHeight+selectElementHeight; //selectElementHeight = selectboxの大きさ
      }
    }else{
      console.log("要素なし_画像の添付により必要になった");

      // 画像上の領域があれば設定する
      if(slide_dom[i].childElementCount >= 5){
        var AreaOnImageCount = slide_dom[i].getElementsByClassName("highlightedDecideRectangle");
        console.log(AreaOnImageCount);
        for(var AOI_C = 0; AOI_C < AreaOnImageCount.length; AOI_C++){
          console.log(AreaOnImageCount[AOI_C]);
          var RectangleArea = AreaOnImageCount[AOI_C].getBoundingClientRect();
          var rel_top = AreaOnImageCount[AOI_C].getAttribute("rel_top");
          var rel_left = AreaOnImageCount[AOI_C].getAttribute("rel_left");
          var rel_height = AreaOnImageCount[AOI_C].getAttribute("rel_height");
          var rel_width = AreaOnImageCount[AOI_C].getAttribute("rel_width");
          var Area_NodeID = AreaOnImageCount[AOI_C].getAttribute("node_id");
          var Area_concceptID = AreaOnImageCount[AOI_C].getAttribute("concept_id");
          var Area_TargetContentID = AreaOnImageCount[AOI_C].getAttribute("content_id");
          var research_Node_Label = ConceptID_ClassLabel[Area_concceptID];

          console.log(rel_top);
          console.log(rel_left);
          console.log(rel_height);
          console.log(rel_width);
          console.log(Area_NodeID);
          console.log(Area_TargetContentID);
          console.log(resarch_Node_Label);
          var targetContent = document.getElementById(Area_TargetContentID);
          console.log(targetContent);
          
          console.log(RectangleArea.width);
          console.log(RectangleArea.height);
          var TempLogicConceptID = "1691805171925_n1098";
          var TempLogicConceptLabel = "事実[自身]";

          var RatioWidth = (rel_width * RectangleArea.width) / DocumentAreaWidth;
          var RatioHeight = (rel_height * RectangleArea.height) / DocumentAreaHeight;
          console.log(RatioWidth);
          console.log(RatioHeight);
          //領域の設定 簡易版 20230919_23:54 夏期成果に間に合わせるよう
          xmlSource +=  '   <AOI>\n';
          xmlSource +=  '     <id>'+(100+AOI_InstanceIDnumber)+'</id>\n';
          xmlSource +=  '     <node_id>'+Area_NodeID+'</node_id>\n';
          xmlSource +=  '     <sentence>'+targetContent.firstElementChild.innerHTML+'</sentence>\n';
          xmlSource +=  '     <semantics>\n';
          xmlSource +=  '       <research_activity_concept>\n';
          xmlSource +=  '         <research_activity_concept_instance_id>'+(200+AOI_InstanceIDnumber)+'</research_activity_concept_instance_id>\n';
          xmlSource +=  '         <research_activity_concept_id>'+Area_concceptID+'</research_activity_concept_id>\n';//concept_id
          xmlSource +=  '         <research_activity_label>'+research_Node_Label+'</research_activity_label>\n';//ノードのラベル
          xmlSource +=  '       </research_activity_concept>\n';
          xmlSource +=  '       <logic_instances>\n';//論理構成は複数あることを想定
          xmlSource +=  '         <logic_instance>\n';
          xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
          xmlSource +=  '           <logic_instance_ontlogy_id>'+TempLogicConceptID+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
          xmlSource +=  '           <logic_instance_label>'+TempLogicConceptLabel+'</logic_instance_label>\n'; //論理構成意図としてのラベル
          xmlSource +=  '         </logic_instance>\n';
                                  // //相対的に設定した論理構成意図
                                  // if(content_dom[h].childElementCount >= 5){
                                  //   var NodeBadgeCount = content_dom[h].childElementCount - 4;
                                  //   // console.log(NodeBadgeCount);
                                  //   for(var NBC = 0; NBC < NodeBadgeCount; NBC++){
                                  //     AOI_LogicInstanceIDNumber++
                                  //     var Num2 = NBC + 4;
                                  //     // console.log(content_dom[h].children[Num2]);
                                  //     // console.log(content_dom[h].children[Num2].innerHTML);
                                  //     xmlSource +=  '         <logic_instance>\n';
                                  //     xmlSource +=  '           <logic_instance_id>'+(300+AOI_LogicInstanceIDNumber)+'</logic_instance_id>\n';
                                  //     xmlSource +=  '           <logic_instance_ontlogy_id>'+content_dom[h].children[Num2].getAttribute("ontlogy_id")+'</logic_instance_ontlogy_id>\n';//論理構成意図のオントロジーid
                                  //     xmlSource +=  '           <logic_instance_label>'+content_dom[h].children[Num2].innerHTML +'</logic_instance_label>\n'; //論理構成意図としてのラベル
                                  //     xmlSource +=  '         </logic_instance>\n';
                                  //     // console.log(content_dom[h].children[Num2].id);
                                  //     // console.log(content_dom[h].children[Num2].clientHeight);
                                  //     NodeHeight += 3;
                                      
                                  //     // console.log(300+AOI_LogicInstanceIDNumber);
                                  //     BadgeID_InstanceID[content_dom[h].children[Num2].id] = 300+AOI_LogicInstanceIDNumber;
                                  //   }
                                  // }
          xmlSource +=  '       </logic_instances>\n';
          xmlSource +=  '     </semantics>\n';
          xmlSource +=  '     <X>'+rel_left+'</X>\n';
          xmlSource +=  '     <Y>'+rel_top+'</Y>\n';
          xmlSource +=  '     <Wid>'+RatioWidth+'</Wid>\n';
          xmlSource +=  '     <Hei>'+RatioHeight+'</Hei>\n';
          xmlSource +=  '     <X_px>'+RectangleArea.left+'</X_px>\n';
          xmlSource +=  '     <Y_px>'+RectangleArea.top+'</Y_px>\n';
          xmlSource +=  '     <Wid_px>'+RectangleArea.width+'</Wid_px>\n';
          xmlSource +=  '     <Hgt_px>'+RectangleArea.height+'</Hgt_px>\n';
          xmlSource +=  '     <parent_id>'+ParentAoiID+'</parent_id>\n';
          xmlSource +=  '     <color_A>'+255+'</color_A>\n';
          xmlSource +=  '     <color_R>'+128+'</color_R>\n';
          xmlSource +=  '     <color_G>'+255+'</color_G>\n';
          xmlSource +=  '     <color_B>'+255+'</color_B>\n';
          xmlSource +=  '     <type>C</type>\n';
          xmlSource +=  '   </AOI>\n';

          AOI_InstanceIDnumber++;
          AOI_LogicInstanceIDNumber++;

        }
      }   
    }
  }

  //セマンティクス同士の関係性を追記．
  xmlSource += '</list>\n';

  xmlSource += '<relations>\n';
  xmlSource += '  <logic_relations>\n';

  for(var Lr = 0;Lr<RCount;Lr++){
    var PairNodeIDs =Count_LogicRelationNodes[Lr];
    // console.log(PairNodeIDs);
    var NodeIDs = PairNodeIDs.split('.');
    var NodeID1 = NodeIDs[0];
    var NodeID2 = NodeIDs[1]; 
    console.log(BadgeID_InstanceID[NodeID1]);
    console.log(BadgeID_InstanceID[NodeID2]);
    var RelationInstanceIds = BadgeID_InstanceID[NodeID1] +","+BadgeID_InstanceID[NodeID2];
    xmlSource += '    <logic_relation relation_label="'+Count_LogicRelationLabel[Lr]+'" ';
    xmlSource += 'relation_instance_ids="'+RelationInstanceIds+'" ';
    xmlSource += 'relation_ontology_id="'+Count_LogicRelationConceptID[Lr]+'" />\n';
  }
  
  xmlSource += '  </logic_relations>\n';
  xmlSource += '</relations>\n';
  xmlSource += '</Information>\n';

  const japanStandardTime = new Date().toLocaleString({ timeZone: 'Asia/Tokyo' });
  
  var xml = (new DOMParser()).parseFromString(xmlSource, 'text/xml');
  var download_a = document.createElement( 'a' );
  download_a.href = 'data:text/xml;charset=utf-8,'+encodeURIComponent((new XMLSerializer()).serializeToString(xml));
  // download_a.download = 'shimizu-'+japanStandardTime+'.xml';
  var user_name = await getUserName();
  console.log(user_name);
  download_a.download = user_name+"-1_"+japanStandardTime+".xml";
  download_a.click();
  console.log("XMLファイル出力完了")

}


//2022-11- shimizu セレクトボックスメニュー（コンテンツの内容）を決定した時に動く関数
function ChangeLogicSelectTitle(e){
  console.log(e.target.value);
  console.log(e.target.selectedIndex);

  //20230130shimizu 追記
  Record_rank();
  Edit_logic(e.target)
}

async function getUserName(){
  return new Promise((resolve, reject) => {
    $.ajax({
      url: "php/get_UserName.php",
      type: "POST",
      success: function (name) {
        resolve(name);
      },
      error: function (error) {
        reject(error);
      }
    });
  });
}

//2022-12-16 shimizu 論理関係の一覧確認
async function CheckNodeAllLogicRelation(){
  var dom_all = document.getElementsByClassName("cspan");
  await $.ajax({
    url: "php/get_LogicRelation.php",
    type: "POST",
    success: function(arr){
      var NowAllRelationLabel = [];
      var RelationNodeID_1 = [];
      var RelationNodeID_2 = [];
      if(arr == "[]"){
        console.log("何もなし");
      }else{
        // console.log(arr);
        var parse = JSON.parse(arr);
        for(var i=0; i<parse.length; i++){
          RelationNodeID_1.push(parse[i].doc_con1_id);
          RelationNodeID_2.push(parse[i].doc_con2_id);
        }
      }
      for(var r = 0; r<RelationNodeID_1.length; r++){
        console.log( RelationNodeID_1[r]);
        console.log( RelationNodeID_2[r]);
      }


      var RelationNodeLabel1 = [];
      var RelationNodeLabel2 = [];
      for(var i=0; i< dom_all.length; i++){
        for(var r = 0; r<RelationNodeID_1.length; r++){
          if(dom_all[i].getAttribute("id") == RelationNodeID_1[r]){
            dom_all[i].style.border = "2px solid gray";
            dom_all[i].style.backgroundColor = "aquamarine";
            RelationNodeLabel1[r] = dom_all[i].innerHTML;
          }else if(dom_all[i].getAttribute("id") == RelationNodeID_2[r]){
            dom_all[i].style.border = "2px solid gray";
            dom_all[i].style.backgroundColor = "aquamarine";
            RelationNodeLabel2[r] = dom_all[i].innerHTML;
          }
        }
      }
      
      var RelationText = "";
      for(var NARL = 0; NARL<NowAllRelationLabel.length; NARL++){
        console.log(NowAllRelationLabel[NARL]);
        RelationText += "<p>["+RelationNodeLabel1[NARL]+"]と["+RelationNodeLabel2[NARL]+"]</p>";
      }

      // id属性で要素を取得
      var Now_LogicRelation = document.getElementById('now_logic_relation');
      // var list_element = document.getElementById("now_logic_relation");
      //list_element.remove();
      var TestText = "<p>ノード：関係性</p>"+ RelationText;

      // 要素内の後尾に追加する場合
      Now_LogicRelation.innerHTML= TestText;
  
    },
    error:function(){
      console.log("エラーです");
    }
});

}

//2022-1209 shimizu 論理関係の解消
function DeleteLogicRelation(){
  console.log("論理関係の解消");
  var dom_all = document.getElementsByClassName("cspan");
  var c_dom_id = "0";
  for(var i=0; i<dom_all.length; i++){
    //選択中のノードを確認
    // if(dom_all[i].style.border == "2px solid gray"){
    //   c_dom_id = dom_all[i].id;
    // }
  }
  
  var badge_all = document.getElementsByClassName("badge");
  var c_badge_id = "0";
  console.log(badge_all.length);
  for(var j = 0; j<badge_all.length; j++){
    if(badge_all[j].style.border == "5px solid gray"){
      c_badge_id = badge_all[j].id;
    }
  }

  if(c_dom_id == "0" && c_badge_id == "0"){
    alert("現在何も選択していません．ノードもしくは付与した論理構成意図を一つ選択してください");
  }else if(c_dom_id != "0"){
    if(window.confirm('付与している関係性を全て削除しますか？')){
    
      console.log(c_dom_id);//id
      console.log(document.getElementById(c_dom_id));
      Delete_document_relation_node(c_dom_id);
      Delete_concepts(c_dom_id);
      // Record_rank();
    }
  }else if(c_badge_id != "0"){
    if(window.confirm('選択している論理構成意図とその関係性を削除しますか？')){
      var c_badge_ids =c_badge_id.split(","); 
      console.log(c_badge_ids[0]);//id
      console.log(c_badge_ids[1]);
      // console.log(document.getElementById(c_dom_id));
      Delete_document_relation_concept(c_badge_ids[0]);
      //20230130 追記
      Delete_slide_relation(c_badge_ids[0]);
      
      Delete_concept(c_badge_ids[0]);

      // Record_rank();

      var DeleteIds = [];
      for(var badgeCounter = 0; badgeCounter<badge_all.length; badgeCounter++){
        console.log(badgeCounter);
        console.log(badge_all[badgeCounter].id);
        var badge_ids = badge_all[badgeCounter].id.split(",");
        var selectContentBadge = document.getElementById(badge_all[badgeCounter].id);
        if(c_badge_ids[0] == badge_ids[0]){
          // var selectContentBadge = document.getElementById(badge_all[badgeCount].id);
          console.log(selectContentBadge);
          //selectContentBadge.remove();
        }
      }
      

    }
  }

  // if(window.confirm('本当に関係性を削除しますか？')){
    
  //   console.log(c_dom_id);//id
  //   console.log(document.getElementById(c_dom_id));
  //   Delete_document_relation_node(c_dom_id);
  //   // Record_rank();
  // }

}

//コンテンツ再現の関数
async function Rebuild_content(){
  await $.ajax({
	    url: "php/content_rebuild.php",
	    type: "POST",
	    success: function(arr){

        if(arr == "[]"){
          // console.log(arr);
        }else{
          // console.log(arr);
          var parse = JSON.parse(arr);
          // console.log(parse);//スライド上に追加してあるのノードの内容
          // console.log(parse.length);//スライド上に追加してあるのノードの個数
          for(var i=0; i<parse.length; i++){
            for(var j=0; j<parse.length; j++){
              // console.log(String(i), parse[j].rank);
              if(String(i) == parse[j].rank){
                const newcontent = new Content({
              		content_id: parse[j].content_id,
              		node_id: parse[j].node_id,
                  content: parse[j].content,
                  slide_id: parse[j].slide_id,
                  type: parse[j].type,
              	  indent: parse[j].indent});
                if(parse[j].node_id != ""){
                  const content_id = parse[j].content_id;
                  const node_id = parse[j].node_id;
                  var dom_tmp = document.getElementById("contents-"+content_id);
                  var dom_target = dom_tmp.previousElementSibling;
                  // console.log(dom_target);
                  dom_target.setAttribute("node_id",node_id);
                }
                if(parse[j].concept_id != ""){
                  const content_id = parse[j].content_id;
                  const concept_id = parse[j].concept_id;
                  var dom_tmp = document.getElementById("contents-"+content_id);
                  var dom_target = dom_tmp.previousElementSibling;
                  // console.log(dom_target);
                  dom_target.setAttribute("concept_id",concept_id);
                }
                
                delete newcontent;
                console.log("コンテント再現完了");
              }
            }
          }
          //2022-11-23 論理構成意図を選択するためのセレクトボックスの中身を追加
          for(var LogicLabel in Base_ClassLabeltoConceptID){
            // console.log(LogicLabel);
            // console.log(Output_ConceptIDtoClassLabel[LogicLabel]);
            var Label = LogicLabel;
            if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
              $("select[name='Logic_options_contents']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
            }
            // $("select[name='Logic_options_contents']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
          }
          let selectContentLogic = document.querySelectorAll("[name='Logic_options_contents']");
          selectContentLogic.forEach(select => select.addEventListener('change', ChangeLogicSelectContent))
          console.log("選択肢を追加");
        }
	    },
      error:function(){
        console.log("エラーです");
      }
	});
}

//2022-11-24 shimizu
async function Rebuild_content_s(){
  await $.ajax({
	    url: "php/document_content_rebuild.php",
	    type: "POST",
	    success: function(arr){

        if(arr == "[]"){
          // console.log(arr);
        }else{
          // console.log(arr);
          var parse = JSON.parse(arr);
          // console.log(parse);//スライド上に追加してあるのノードの内容
          // console.log(parse.length);//スライド上に追加してあるのノードの個数
          for(var i=0; i<parse.length; i++){
            for(var j=0; j<parse.length; j++){
              // console.log(String(i), parse[j].rank);
              if(String(i) == parse[j].rank){
                const newcontent = new Content({
              		content_id: parse[j].content_id,
              		node_id: parse[j].node_id,
                  content: parse[j].content,
                  slide_id: parse[j].slide_id,
                  type: parse[j].type,
              	  indent: parse[j].indent});
                if(parse[j].node_id != ""){
                  const content_id = parse[j].content_id;
                  const node_id = parse[j].node_id;
                  var dom_tmp = document.getElementById("contents-"+content_id);
                  var dom_target = dom_tmp.previousElementSibling;
                  // console.log(dom_target);
                  dom_target.setAttribute("node_id",node_id);
                }
                if(parse[j].concept_id != ""){
                  const content_id = parse[j].content_id;
                  const concept_id = parse[j].concept_id;
                  var dom_tmp = document.getElementById("contents-"+content_id);
                  var dom_target = dom_tmp.previousElementSibling;
                  // console.log(dom_target);
                  dom_target.setAttribute("concept_id",concept_id);
                }
                
                delete newcontent;
                console.log("コンテント再現完了");
              }
            }
          }
          //2022-11-23 論理構成意図を選択するためのセレクトボックスの中身を追加
          for(var LogicLabel in Base_ClassLabeltoConceptID){
            // console.log(LogicLabel);
            // console.log(Output_ConceptIDtoClassLabel[LogicLabel]);
            var Label = LogicLabel;
            if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
              $("select[name='Logic_options_contents']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
            }
            // $("select[name='Logic_options_contents']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
          }
          let selectContentLogic = document.querySelectorAll("[name='Logic_options_contents']");
          selectContentLogic.forEach(select => select.addEventListener('change', ChangeLogicSelectContent))
          //選択ずみの値を設定
          for(var q=0; q<parse.length; q++){
            // console.log(parse[q].slide_id);
            var selected_id = "SelectBox-"+parse[q].content_id;
            //console.log(selected_id);
            var objSelect = document.getElementById(selected_id);
            // console.log(parse[q].logic_option)
            objSelect.options[parse[q].logic_option].selected = true;
            
          }
          console.log("選択肢を追加");
        }
	    },
      error:function(){
        console.log("エラーです");
      }
	});

  //2022-12-21 付与した関係性があれば追加する
  await $.ajax({
    url: "php/get_LogicRelation.php",
    type: "POST",
    success: function(arr){
      if(arr == "[]"){
        //console.log(arr);
      }else{
        //console.log(arr);
        var parse = JSON.parse(arr);
        // console.log(parse);//スライド上に追加してあるのノードの内容
        // console.log(parse.length);//スライド上に追加してあるのノードの個数
        
        for(var i=0; i<parse.length; i++){
          // var delete_button_id1 = "DeleteButton-"+parse[i].doc_con1_id;
          // var delete_button_id2 = "DeleteButton-"+parse[i].doc_con2_id;
          // var delete_button1 = document.getElementById(delete_button_id1);
          // var delete_button2 = document.getElementById(delete_button_id2);
          var select_box_id1 = "SelectBox-"+parse[i].doc_con1_id;
          var select_box_id2 = "SelectBox-"+parse[i].doc_con2_id;
          var select_box1 = document.getElementById(select_box_id1);
          var select_box2 = document.getElementById(select_box_id2);
          
          var createElement1 = document.createElement('span')
          createElement1.id = parse[i].id+","+parse[i].doc_con1_id;
          createElement1.className = "badge bg-blue";
          createElement1.textContent = parse[i].doc_con1_label; 
          createElement1.setAttribute('ontlogy_id',parse[i].ont1_id);
          // delete_button1.after(createElement1);
          select_box1.after(createElement1);
          

          var createElement2 = document.createElement('span')
          createElement2.id = parse[i].id+","+parse[i].doc_con2_id;
          createElement2.className = "badge bg-blue";
          createElement2.textContent = parse[i].doc_con2_label; 
          createElement2.setAttribute('ontlogy_id',parse[i].ont2_id);
          // delete_button2.after(createElement2);
          select_box2.after(createElement2);
          //                                       
              
        }
        console.log("関係性を追加");
      }
    },
    error:function(){
      console.log("エラーです");
    }
});
}

function ChangeLogicSelectContent(e){
  //論理構成意図のセレクトボックスを選択したら呼び出される
  console.log(e.target);
  console.log(e.target.id);
  // SelectBoxー
  
  //20230130shimizu 追記
  Record_rank();
  Edit_logic(e.target)
}

function Edit_logic(obj){
  var selectBoxID = obj.id;
  var selectBoxValue = obj.value;
  console.log(selectBoxValue);
  // console.log(selectBoxID.substring(10,selectBoxID.length));
  var selectNodeID = selectBoxID.substring(10,selectBoxID.length);
  // console.log(selectNodeID);
  var Content = document.getElementById(selectNodeID);
  console.log(Content);

  $.ajax({

      url: "php/logic_edit.php",
      type: "POST",
      data: {id : selectNodeID,
            value : selectBoxValue,},
      success: function () {
        console.log("登録成功");
      },
      error: function () {
      console.log("登録失敗");},

  });

}

function Rebuild_title(){
  $.ajax({
	    url: "php/title_rebuild.php",
	    type: "POST",
	    success: function(title){
        console.log(title);
        var parse = JSON.parse(title);
        var scenario_title = parse[0].scenario_title;
        const title_value = document.getElementById("scenario_title");
        title_value.value = scenario_title;
	    },
      error:function(){
        console.log("エラーです");
      }
	});
}

//2022-11-24 shimizu
function Rebuild_title_s(){
  // console.log("t");
  $.ajax({
	    url: "php/document_title_rebuild.php",
	    type: "POST",
	    success: function(title){

        console.log(title);
        var parse = JSON.parse(title);
        console.log(parse);
        // console.log(parse[0].scenario_title);
        // var scenario_title = parse[0].scenario_title;
        // console.log(scenario_title);
        const title_value = document.getElementById("scenario_title");
        title_value.value = scenario_title;
	    },
      error:function(){
        console.log("エラーです");
      }
	});
}

function SetIndent(){

  const span_dom = document.getElementsByClassName("cspan");

  for(var i=0; i<span_dom.length; i++){
    const indent = span_dom[i].getAttribute("name");
    const target_dom = span_dom[i];
    const text_dom = span_dom[i].nextElementSibling;
    //2022/12/23 shimizu 
    const thread_dom = document.getElementById("SelectBox-"+target_dom.id)
    switch(indent){
      case "1":
        target_dom.style.width = "calc(100% - 45px)";
        target_dom.style.marginLeft = "20px";
        text_dom.style.width = "calc(100% - 45px)";
        text_dom.style.marginLeft = "20px";
        //2022/12/23 shimizu
        thread_dom.style.marginLeft = "20px";
        break;
      case "2":
        target_dom.style.width = "calc(100% - 65px)";
        target_dom.style.marginLeft = "40px";
        text_dom.style.width = "calc(100% - 65px)";
        text_dom.style.marginLeft = "40px";
         //2022/12/23 shimizu
         thread_dom.style.marginLeft = "40px";
        break;
      case "3":
        target_dom.style.width = "calc(100% - 85px)";
        target_dom.style.marginLeft = "60px";
        text_dom.style.width = "calc(100% - 85px)";
        text_dom.style.marginLeft = "60px";
         //2022/12/23 shimizu
         thread_dom.style.marginLeft = "60px";
        break;
    }
  }
}

function Unreflected_node(){
  const cnodes = document.getElementsByClassName("cspan");
  for(let i=0; i<cnodes.length; i++){
    if(cnodes[i].getAttribute("type") == "toi"){
      // cnodes[i].style.backgroundColor = "#d3d3d3";
      cnodes[i].style.backgroundColor = "#ffffff"
    }else{
      // cnodes[i].style.backgroundColor = "#d3d3d3";
      cnodes[i].style.backgroundColor = "#ffffff"
    }
  }
  let cnode_array = [];
  for(let i=0; i<cnodes.length; i++){
    if(!(cnodes[i].getAttribute("node_id"))){
      // console.log(cnodes[i]);
      cnodes[i].style.backgroundColor = "#f8d7da";
    }
  }
}

function Record_rank(){
  // Get_SlideRank();
  // Get_ContentRank();
  Get_SlideTitle();
  //2022-11-24 shimizu
  Get_DocumentRank();
  Get_DocumentContentRank();
  //Get_DocumentTitle();
}

//2022_shimizu
// window.addEventListener("DOMContentLoaded", () => {
//   // textareaタグを全て取得
//   const textareaEls = document.querySelectorAll("textarea");

//   textareaEls.forEach((textareaEl) => {
//     // デフォルト値としてスタイル属性を付与
//     textareaEl.setAttribute("style", `height: ${textareaEl.scrollHeight}px;`);
//     // inputイベントが発生するたびに関数呼び出し
//     textareaEl.addEventListener("input", setTextareaHeight);
//   });

//   // textareaの高さを計算して指定する関数
//   function setTextareaHeight() {
//     this.style.height = "auto";
//     this.style.height = `${this.scrollHeight}px`;
//   }
// });


//2022 shimizu 論理構成意図読み込みように新しく追加．内容はc_xmlLoadと同じなのでリファクタリング必要そう
// XML読み込み
function c_xmlLoadLogicIntention(){

	// $("div#intention").html("");
	$("div#testxml").html("");

	$.ajax({
		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:c_parse_xml_LogicIntention
	});
}
// XMLデータを取得
function c_parse_xml_LogicIntention(xml,status){
	if(status!='success')return;
	$(xml).find('W_CONCEPTS').each(LogicConstructIntentionRead);
  //2022-12-12 shimizu 修正必要
  //$(xml).find('R_CONCEPTS').each(LogicConceptRelationADD);
}

//2022 shimizu
//2023-01-24 shimizu 畠山さんの研究に則って変更
function LogicConstructIntentionRead(){
	//console.log(this);
	var RelativeLogicBaseArray_double = []; //論理構成意図の元：前提，仮説〜
  var RelativeLogicBaseArray_single = []
	var RelativeLogicActionArray = []; //論理構成意図の行動：仮説を立てる，推測する
  var RelativeLogicRelationArray = []; //論理構成意図の関係性，前提を根拠として仮説を立てる
  var RelativeLogicLabelArray = [];//関係しているもののラベルを集めたもの（後でKeyになる）
  //var RelativeLogicIDArray = [];//関係しているもののidを集めたもの（後でValueになる）
  var IndexNumber = 0;

  //2023-01-24 shimizu is-a関係からラベルを取得，そこから逆算できるから
  var $isa = $(this).find('ISA'); //is-a関係　だけ集める

  for(var parent=0; parent<$isa.length; parent++){
    //子供と，あるlabelの内容が等しい時
    var ParentNodeLabel = $isa[parent].getAttribute('parent');
    var ChildNodeLabel = $isa[parent].getAttribute('child');
	  if((ParentNodeLabel ==  "資料作成＿認知活動＿素活動" &&  ChildNodeLabel != "考える")){
      //console.log(ParentNodeLabel);
      //console.log(ChildNodeLabel);
      RelativeLogicActionArray.push(ChildNodeLabel);
      RelativeLogicLabelArray.push(ChildNodeLabel);
      
    }else if(ParentNodeLabel ==  "資料作成_認知活動_複合活動_相対的活動"){
      //console.log(ChildNodeLabel);
      RelativeLogicRelationArray.push(ChildNodeLabel);
      RelativeLogicLabelArray.push(ChildNodeLabel);
    }else if(ParentNodeLabel =="メタ認知的知識_相対的知識"){
      // console.log(ChildNodeLabel);
      RelativeLogicBaseArray_double.push(ChildNodeLabel);
      RelativeLogicLabelArray.push(ChildNodeLabel);
    }else if(ParentNodeLabel == "メタ認知的知識_単体的知識"){

      RelativeLogicBaseArray_single.push(ChildNodeLabel);
      RelativeLogicLabelArray.push(ChildNodeLabel);
    }
    
  }
	
	//各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT'); //法造のデータ 2022-11-22時点で465個

	//var InstanceCounter = 0;
	for(var i=0; i<$concept_tag.length; i++){
	
    //関係性の構成活動ー関係性の作成
    for(var RLRA = 0; RLRA<RelativeLogicRelationArray.length; RLRA++){
      if($concept_tag[i].childNodes[1].innerHTML == RelativeLogicRelationArray[RLRA]){
        var base = $concept_tag[i].childNodes[7].childNodes[1].getAttribute('class_constraint')
        var Action = $concept_tag[i].childNodes[7].childNodes[3].getAttribute('class_constraint');//slots
        var Base2Action = base + ","+Action;
        // console.log(Base2Action);
        Output_LogicConceptToLogicRelation[Base2Action] = RelativeLogicRelationArray[RLRA];
        OutputLabel_ClassConceptID[RelativeLogicRelationArray[RLRA]] = $concept_tag[i].id;
      }
    }

    for(var CountA=0; CountA<RelativeLogicActionArray.length; CountA++){
      if($concept_tag[i].childNodes[1].innerHTML == RelativeLogicActionArray[CountA]){
        var LogicID = $concept_tag[i].id;
        // console.log(LogicID);
        // console.log(RelativeLogicActionArray[Count]);
        Action_ConceptIDtoClassLabel[LogicID] = RelativeLogicActionArray[CountA];
        Action_IndexNumberToClassLabel[CountA] = RelativeLogicActionArray[CountA];
        Logic_ClassLabeltoConceptID[RelativeLogicActionArray[CountA]] = LogicID;
      }
    }
    var logicIndexCount = 0;  //単体論理構成意図の設定のために用意
    for(var CountB=0; CountB<RelativeLogicBaseArray_single.length; CountB++){

      if($concept_tag[i].childNodes[1].innerHTML == RelativeLogicBaseArray_single[CountB]){
        var LogicID = $concept_tag[i].id;
        Base_ClassLabeltoConceptID[RelativeLogicBaseArray_single[CountB]] = LogicID;
        // console.log(RelativeLogicBaseArray_single[CountB]);
        // console.log(CountB);
        Base_IndexNumberToClassLabel[CountB] = RelativeLogicBaseArray_single[CountB];
        Logic_ClassLabeltoConceptID[RelativeLogicBaseArray_single[CountB]] = LogicID;
      }
    }

    for(var CountC=0; CountC<RelativeLogicBaseArray_double.length; CountC++){
      if($concept_tag[i].childNodes[1].innerHTML == RelativeLogicBaseArray_double[CountC]){
        var LogicID = $concept_tag[i].id;
        Base_ClassLabeltoConceptID[RelativeLogicBaseArray_double[CountC]] = LogicID;
        // console.log(RelativeLogicBaseArray_double[CountC]);
        // console.log(CountC);
        Base_IndexNumberToClassLabel[CountC] = RelativeLogicBaseArray_double[CountC];
        Logic_ClassLabeltoConceptID[RelativeLogicBaseArray_double[CountC]] = LogicID;
      }
    }
    //console.log($concept_tag[i].id);
    //console.log($concept_tag[i].childNodes[1].innerHTML);
    ConceptID_ClassLabel[$concept_tag[i].id] = $concept_tag[i].childNodes[1].innerHTML;
	}

  // //デバッグ
  // for(var p=0; p< ClassConceptIDs.length; p++){
  //   console.log(ClassConceptIDs[p]);
  // }
	
	//for(var q=0;q<LogicSearchArray.length;q++){
		////デバッグ用．論理構成意図のクラス制約がちゃんと入っているかの確認．
		// console.log(LogicSearchArray[q]);
		// console.log(LogicOutputArray[q]);
		// for(var j=0; j<$concept_tag.length; j++){
		// 	if(LogicSearchArray[q]== $concept_tag[j].childNodes[1].innerHTML){
		// 		var ConceptIDtoClassLabel = []; //連想配列のValue用，オントロジーのクラスID＋ラベル
		// 		// console.log($concept_tag[j].childNodes[1].innerHTML); //デバッグ用
		// 		//ConceptIDtoClassLabel.push($concept_tag[j].id,LogicSearchArray[q])
    //     ConceptIDtoClassLabel.push($concept_tag[j].id);
		// 		Output_ConceptIDtoClassLabel[LogicOutputArray[q]] = ConceptIDtoClassLabel;
    //     Output_IndexNumberToClassLabel[IndexNumber] = LogicOutputArray[q];
    //     IndexNumber++;
		// 	}
		// }
	//}

  //デバッグ,連想配列の中身確認．
	// Object.keys(Action_ConceptIDtoClassLabel).forEach(key => {
	// 	console.log(key);
	// });
	// Object.values(Action_ConceptIDtoClassLabel).forEach(value => {
	// 	console.log(value);
	// });
	
	// Object.keys(OutputLabel_ClassConceptID).forEach(key => {
	// 	console.log(key);
	// });
	// Object.values(OutputLabel_ClassConceptID).forEach(value => {
	// 	console.log(value);
	// });

  // Object.keys(Logic_ClassLabeltoConceptID).forEach(key => {
	// 	console.log(key);
	// });
	// Object.values(Logic_ClassLabeltoConceptID).forEach(value => {
	// 	console.log(value);
	// });

	return Base_IndexNumberToClassLabel;
}

//2022-12-12 shimizu 論理構成意図の関係性追加
//2023-01-24 shimizu 相対的な論理構成意図の付与．畠山さんの研究に則って変更
function LogicConceptRelationADD(){
  //各要素を変数に格納
	var $concept_tag = $(this).find('CONCEPT'); //法造のデータ 2022-11-22時点で465個
  var counter = 0;

	//var InstanceCounter = 0;
	for(var i=0; i<$concept_tag.length; i++){
    // console.log($concept_tag[i].id);
    // console.log($concept_tag[i].childNodes[1].innerHTML); //クラスのlabel
    //2022-12-12　現在設定済みの4つの関係性をベタうちしているので修正が必須
    if($concept_tag[i].childNodes[1].innerHTML == "合理性" || $concept_tag[i].childNodes[1].innerHTML == "妥当性" || $concept_tag[i].childNodes[1].innerHTML == "推測関係" || $concept_tag[i].childNodes[1].innerHTML == "議論指針"){
      //クラスのpart-of要素1,2022-11-23時点では一つのクラスに二つの要素なのでここをベタうちしている．修正必須．
      // console.log($concept_tag[i].childNodes[7].childNodes[1].getAttribute('class_constraint'));	
      var logicConcept1 = $concept_tag[i].childNodes[7].childNodes[1].getAttribute('class_constraint');
      Output_LogicConceptToLogicRelation[logicConcept1] = $concept_tag[i].childNodes[1].innerHTML;
      
			//要素2
			// console.log($concept_tag[i].childNodes[7].childNodes[3].getAttribute('class_constraint'));
      var logicConcept2 =$concept_tag[i].childNodes[7].childNodes[3].getAttribute('class_constraint');
      Output_LogicConceptToLogicRelation[logicConcept2] = $concept_tag[i].childNodes[1].innerHTML;

      //2022-12-13 shimizu クラスと関係ツリーの順番を合わせるという力技．修正必須．
      OutputLabel_ClassConceptID[$concept_tag[i].childNodes[1].innerHTML] = ClassConceptIDs[counter];
      counter++;
    }
  }

  // Object.keys(OutputLabel_ClassConceptID).forEach(key => {
	// 	console.log(key);
	// });
	// Object.values(OutputLabel_ClassConceptID).forEach(value => {
	// 	console.log(value);
	// });

}



//---
// index.phpを読み込むたびに関数実行
$(function(){
	c_xmlLoadLogicIntention();
});