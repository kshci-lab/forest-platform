//presentation

//---------------------- スライドを作成する---------------------------------------
var color_count=0;
var obj;
var target;
var thread_concept_id = [];

var preview_dom = "";
var preview_text = "";


var quills = {};
var toolbarOptions = [ //ツールバー
['bold', 'italic', 'underline'/*, 'strike'*/],          //スタイル設定
[{ 'size': ['small', false, 'large'] }],    //テキストサイズ
//[{ 'align': [] }],                                //位置
//['blockquote', 'code-block'],                     //コード挿入
//[{ 'header': 1 }, { 'header': 2 }],               //見出し設定
[{ 'list': 'ordered'}],                             //リスト表示
[{ 'script': 'sub'}, { 'script': 'super' }],        //インデックス
//[{ 'indent': '-1'}, { 'indent': '+1' }],          //インデント
//[{ 'direction': 'rtl' }],                         //文字方向
//[{ 'header': [1, 2, 3, 4, 5, 6, false] }],        //見出しサイズ
//[{ 'color': [] }, { 'background': [] }],          //テキストカラー
//[{ 'font': [] }],                                 //フォント
//['clean'],                                        //フォーマット除去
];


var quilloptions = {
  theme: 'snow',
  modules: {
    toolbar: toolbarOptions,
    keyboard: {
      handleEnter: {
        key: 13,
        handler: function(){
          return false; // Enterキーの動作を無効にする
        }
      },
      "header enter": {
        key: 13,
        handler: function(){
          return false; // Enterキーの動作を無効にする
        }
      },
    }
  }
};

let Embed = Quill.import('blots/embed');

class Breaker extends Embed {
    static tagName = 'br';
    static blotName = 'breaker';
}

Quill.register(Breaker);




//var soccer;
var micro_concept_id = [];//各スライドごとのコンセプトIDを取得して格納する変数
var $global_advice = [];
var $slide_topic = [];



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
    // マインドマップの選択状況をリセット
    var jmnode = document.getElementsByTagName("jmnode");
    // for(var i=0; i<jmnode.length; i++){
    //     jmnode[i].style.border = "0px solid #000";
    //     if(jmnode[i].getAttribute("type") == "answer"){//答えノードの時
    //       jmnode[i].style.backgroundColor = "#ffa500";
    //     }
    // }
    // jm.reset();
    //console.log(obj);
    //色の変更
    if(color_count>0){
      obj.style.backgroundColor = 'white';//灰色
      obj.style.border = "solid 0.7px black";
      obj.style.boxShadow = "";
    }
    target = this.id
    obj = document.getElementById(target);
    // obj.style.backgroundColor = '#a9a9a9';//水色（選択中）
    // $('#'+target).animate({shadow: '3 3 3px', top:3), 'fast'});
    obj.style.border = "outset 2.3px black";
    obj.style.boxShadow = "3px 3px 3px gray";
    color_count += 1;

    // //テキストエリアの初期化
    // document.getElementById('advice_frame').textContent = "";

    //コンセプトid取得+micro.js

    //console.log($('#'+target).data('node_id'));
    var arr = $('#'+target).data('node_id');//nodeidの配列
    //console.log(arr);
    //console.log(arr[0]);

    micro_concept_id = [];
    //console.log(micro_concept_id[0]);


    for(i=0; i<jmnode.length; i++){
      jmnode[i].style.border = "";
    }

    for(m=0; m<arr.length; m++){
      for(i=0; i<jmnode.length; i++){
        if(jmnode[i].getAttribute("nodeid") == arr[m]){//回ってきたidが選択中ノードの時
            console.log(jmnode[i]);
            micro_concept_id[m] = jmnode[i].getAttribute("concept_id");//コンセプトidを代入（答えノードは問いのコンセプトidを持つ）
            // jmnode[i].style.backgroundColor = "#ff69b4";
            jmnode[i].style.border = "3px solid #444444";
        }
        if(micro_concept_id[m] != undefined){//同じコンセプトIDがいくつか存在するから
          break;
        }
      }
      //console.log(micro_concept_id);

    }

});

//別のスライドをクリックした時には，ノードの選択を外す
$(document).on('click', '.thread', function(){
  // const thread = this;
  // var dom_all = document.getElementsByClassName("cspan");
  // for(var i=0; i<dom_all.length; i++){
  //   dom_all[i].style.border = "";
  // }

  const thread = this;
  var dom_all = document.getElementsByClassName("cspan");
  for(var i=0; i<dom_all.length; i++){
    //選択中のノードを確認
    if(dom_all[i].style.border == "2px solid gray"){
      var c_dom = dom_all[i];
    }
  }
  if(c_dom){
    const th_dom = c_dom.closest(".thread");
    console.log("選択中の子ノードがあるスライド："+th_dom.id);
    //console.log("クリックしたスライド："+thread.id);
    if(th_dom.id != thread.id){
      const dom_tmp = document.getElementsByClassName("cspan");
      for(var i=0; i<dom_tmp.length; i++){
        dom_tmp[i].style.border = "";
      }
    }
  }
});

$(document).on('click', '.cspan', function(){
  this.focus();
  var dom_all = document.getElementsByClassName("cspan");
  for(var i=0; i<dom_all.length; i++){
    dom_all[i].style.border = "";
  }

  var dom = this;
  dom.style.border = "2px solid gray";

  //shiftキーを押しながらじゃなかったら，答えノードはピンクに，問いノードはそのままで
  if(event.shiftKey == false){//シフトキーを押していない時

    for(i=0; i<dom_all.length; i++){
      //console.log(dom);
      //console.log(dom_all[i]);
      if(dom_all[i].getAttribute("type") == "answer"){//答えノードの時
        

        if(dom_all[i] == dom){//回ってきたidが選択中ノードの時

          dom_all[i].style.backgroundColor = "#ff69b4";
          
        }else {

          dom_all[i].style.backgroundColor = "#fff3cd";

        }
      }

    }
    
  }else {

    for(i=0; i<dom_all.length; i++){

      if(dom_all[i].getAttribute("type") == "answer"){

        if(dom_all[i] == dom){

          dom_all[i].style.backgroundColor = "#ff69b4";

        }
      }
    }
  }

  // if (dom.getAttribute("concept_id" = "1519483811401_n425")){
  //   $.ajax({

  //     url: "php/fujinaka_rationality.php",
  //     type: "POST",
  //     data: { 
  //       type : "id",
  //       id : difference_rationality[i].getAttribute("nodeid"),
  //       nodetype : "answer"
  //      },
  //     success: function(arr){
  //       if(arr == "[]"){
  //         console.log(arr);
  //       }else{
  //         console.log(arr);
  //         var parse = JSON.parse(arr);

  //         for (let i = 0; i < parse.length; i++) {
  //           for (let j = 0; j < dom_all.length; j++) {
  //             if (dom_all[j].getAttribute("node_id") == parse[i].nodeid){

  //               dom_all[i].style.backgroundColor = "#b13546";

  //             }
  //           }
  //         }

  //       }
  //     },
  //     error: function(){
  //       console.log("エラーです");
  //     }
  //   });
  // }



  recommend_xmlLoad();
  $('#mind_all').hide();
  $('#presen_all').show();
});

$(document).on('click', '.tspan', function(){
  this.focus();
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

// 章を新規作成する関数fujinaka新規
function MakeChapter(topic){

  console.log(topic)

  if(topic == null){
    topic = "章タイトル";
  }

  var uuid = getUniqueStr(); // Threadのidをランダム生成
  var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった

  const chapter_dom = document.getElementsByClassName("chapter");
  if (chapter_dom && chapter_dom.length > 0) {
    var chapter_rank = chapter_dom.length + 1;
    Insert_Chapter(uuid, chapter_rank);
  } else {
    Insert_Chapter(uuid, 1);
  }
  
  let label = "<div class='chapter' id='"+uuid+"' value='章' style='background-color:white; padding:10px;'>"+
                "<span class = 'tspan' tabindex='0'>"+topic+"</span>"+
                "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Update_Chapter_Title(this,"+quot_uuid+");' placeholder='章タイトル' onkeypress='Keypress(event.keyCode, this);'>"+topic+"</textarea>"+
                "<input class='simple_btn' type='button' value='×' onclick='Remove_Chapter("+quot_uuid+");Record_ChapterRank();Get_ContentRank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                "<br>"+
                "<div class='section_area'>"+
                "</div>"+
                "<br>"+
              "</div>";

  let area = $("#chapter_area");
  area.append(label);

  // 追加された chapter に Sortable 適用
  var newChapter = area.find('.chapter').last();
  new Sortable(newChapter.parent()[0], {
    handle: '.chapter', // ソートハンドルとなる要素を指定
    group: 'chapters', // グループ名を共有
    animation: 150,
    onEnd: function (evt) {
        var log = evt.from.children;
        console.log(log);
        Record_ChapterRank();
    }
  });
    // 追加された section_area に Sortable 適用
    var newSection_area = newChapter.find('.section_area').get(0);
    new Sortable(newSection_area, {
      handle: '.section', // ソートハンドルとなる要素を指定
      group: 'sections', // グループ名を共有
      animation: 150,
      onEnd: function (evt) {
        var log = evt.from.children;
        console.log(log);
        Record_sectionRank();
      }
    });
}

// 節を新規作成する関数fujinaka新規
function MakeSection(topic){

  console.log(topic)

  if(topic == null){
    topic = "節タイトル";
  }

  var uuid = getUniqueStr(); // Threadのidをランダム生成
  var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった

  const chapter_dom = document.querySelector("#chapter_area .chapter");
  if (chapter_dom) {
    const dataElement = document.getElementById(chapter_dom.id);
    const section_dom = dataElement.getElementsByClassName("section");

    if (section_dom && section_dom.length > 0) {
      var section_rank = section_dom.length + 1;
      Insert_section(uuid, chapter_dom.id, section_rank);
    } else {
      Insert_section(uuid, chapter_dom.id, 1);
    }
  } else {
    window.alert("章を追加してください");
    return;
  }
  
  let label = "<div class='section' id='"+uuid+"' value='節' style='background-color:white; padding:10px;'>"+
                "<span class = 'tspan' tabindex='0'>"+topic+"</span>"+
                "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Update_section_Title(this,"+quot_uuid+");' placeholder='節タイトル' onkeypress='Keypress(event.keyCode, this);'>"+topic+"</textarea>"+
                "<input class='simple_btn' type='button' value='×' onclick='Remove_section("+quot_uuid+", false);Record_sectionRank();Get_ContentRank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                "<br>"+
                "<div class='paragraph'>"+
                "</div>"+
                "<br>"+
              "</div>";

  let area = $('.section_area', "#" + chapter_dom.id + "");
  area.append(label);

  // 追加された section に Sortable 適用
  var newsection = area.find('.section').last();
  new Sortable(newsection.parent()[0], {
    handle: '.section', // ソートハンドルとなる要素を指定
    group: 'sections', // グループ名を共有
    animation: 150,
    onEnd: function (evt) {
        var log = evt.from.children;
        console.log(log);
        Record_sectionRank();
    }
  });

    // 追加された paragraph(threadのarea) に Sortable 適用
    var newParagraph_area = newsection.find('.paragraph').get(0);
    new Sortable(newParagraph_area, {
      handle: '.thread', // ソートハンドルとなる要素を指定
      group: 'paragraphs', // グループ名を共有
      animation: 150,
      onEnd: function (evt) {
        var log = evt.from.children;
        console.log(log);
        Record_paragraphRank();
      }
    });


 /*$('#chapter_area').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       setTimeout( () =>
       {
        Record_ChapterRank();
      }, 3000 ); 
   }
 });*/
}

// マインドマップ上のノードを選択した状態で右クリックすると文書に反映する関数
function SetPurposeonChapter(){

  let selected_node = CheckSelectedNode();
  if(selected_node == null || selected_node.topic == undefined){
   // (textareaのid名).value = "ノードを選択してください";
   return;
 }else{
   MakeChapter(selected_node.topic);
 }
}
function SetPurposeonSection(){

  let selected_node = CheckSelectedNode();
  if(selected_node == null || selected_node.topic == undefined){
   // (textareaのid名).value = "ノードを選択してください";
   return;
 }else{
   MakeSection(selected_node.topic);
 }
}

//　オリジナルのスレッドを作成する関数  fujinaka変更
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
  console.log(uuid);
  console.log(quot_uuid);

  const section_dom = document.querySelector(".section");
  if (section_dom) {
    const dataElement = document.getElementById(section_dom.id);
    const paragraph_dom = dataElement.getElementsByClassName("thread");

    if (paragraph_dom && paragraph_dom.length > 0) {
      var paragraph_rank = paragraph_dom.length + 1;
      Insert_paragraph(uuid, section_dom.id, paragraph_rank);
    } else {
      Insert_paragraph(uuid, section_dom.id, 1);
    }
  } else {
    window.alert("節を追加してください");
    return;
  }

  let label = "<div class='thread' id='"+uuid+"' value='パラグラフ' data-node_id='"+node_id+"' style='background-color:white; padding:10px; margin-top:10px; margin-bottom:10px; margin-right:10px; margin-left:5px;'>"+
                "<span class = 'tspan' tabindex='0'>"+topic+"</span>"+
                "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Update_paragraph_Title(this,"+quot_uuid+");'  placeholder='節タイトル' onkeypress='Keypress(event.keyCode, this);'>"+topic+"</textarea>"+
                "<input class='simple_btn' type='button' value='×' onclick='Removeparagraph("+quot_uuid+", false);Record_paragraphRank();Get_ContentRank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                "<br>"+
                "<div class='purpose'>"+
                  "<div id='"+setid+"' class='scenario_content'>"+
                    "<span node_id='"+id+"' concept_id='"+concept_id+"' class = 'cspan' name = '0' style = 'width:calc(100% - 25px)' tabindex='0'>"+statement+"</span>"+
                    "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+statement+"</textarea>"+
                    "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Get_ContentRank();' style='float:right;'>"+
                    "<div class='sub_purpose' style='display: none;'></div>"+
                  "</div>"+
                "</div>"+
                "<br>"+
                "<input id='btn_"+uuid+"' type='button' value='テキストを表示' onclick='Toggletext("+quot_uuid+");' style='width:100px; height:25px; font-size:10px; float:right;'>"+
                "<br>"+
                "<div id='container_"+uuid+"' style='display: none;'>"+
                  "<div id ='editor_"+uuid+"'></div>"+
                "</div>"+
              "</div>";

  let area = $('.paragraph', "#" + section_dom.id + "");
  area.append(label);

  // 追加された thread に Sortable 適用
  var newThread = area.find('.thread').last();
  new Sortable(newThread.parent()[0], {
    handle: '.thread', // ソートハンドルとなる要素を指定
    group: 'paragraphs', // グループ名を共有
    animation: 150,
    onEnd: function (evt) {
      var log = evt.from.children;
      console.log(log);
      Record_paragraphRank();
    }
  });

  var newPurposearea = newThread.find('.purpose').get(0);
  new Sortable(newPurposearea, {
    animation: 150,
    onEnd: function (evt) {
      var log = evt.from.children;
      console.log(log);
      Get_ContentRank();
    }
  });

  var conceptID = GetConceptId(id);
  var type = GetType(id);
  console.log(type);
  Record_content(setid, id, conceptID, statement, uuid, type);


  
 /*$('.paragraph').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       // console.log("OK");
       setTimeout( () =>
       {
        Record_paragraphRank();
      }, 3000 ); 
   }
 });

 $('.thread').draggable({
  connectToSortable: ".paragraph"
});

 $('.purpose').sortable({
   update: function(){
       var log = $(this).sortable("toArray");
       console.log(log);
       // console.log("OK!");
       Get_ContentRank();
   }
 });*/

  $('#'+uuid).data('node_id', node_id);
  console.log( $('#'+uuid).data('node_id') );

  var dom_tmp = document.getElementById("contents-"+setid);
  var dom_target = dom_tmp.previousElementSibling;
  if(type=="toi"){
    dom_target.style.backgroundColor = "#cce5ff";
    // dom_target.style.border = "0.3px solid #b8daff";
    dom_target.setAttribute("type","toi");
    console.log(dom_target.innerHTML);
  } else{
    dom_target.style.backgroundColor = "#fff3cd";
    // dom_target.style.border = "0.3px solid #ffeeba";
    dom_target.setAttribute("type","answer");
  }


  var quill = new Quill('#editor_'+uuid+'', { //Quillインスタンス
    modules: { toolbar: toolbarOptions },
    theme: 'snow'
  });

  // 対応するCSSを動的に追加する
  var style = document.createElement('style');
  style.textContent = '#editor_' + uuid + ' { min-height: 200px; }';
  document.head.appendChild(style);

  quills[uuid] = quill; // オブジェクトにQuillインスタンスを格納
        
  var newContent = "パラグラフの内容を書き込んでください";
  quill.root.innerHTML = newContent;
  
  
  quills[uuid].on('editor-change', function(eventName, ...args) {
    if (eventName === 'text-change') {
      // エディタのテキストが変更されたときの処理
    } else if (eventName === 'selection-change') {
      // 選択範囲が変更されたときの処理
      var hasFocus = args[0];
      if (hasFocus) {
        // エディタがフォーカスを持っているときの処理
        TextboxClick();
      } else {
        // エディタがフォーカスを持っていないときの処理
        Update_paragraph_Content(uuid, quills[uuid]);
      }
    }
  });
  

  Get_ContentRank();
  
  return uuid; // 作成したID（スレッドのID)を返す
}

function Toggletext(textid){
  
  var toggleContainer = $('#container_'+textid+'');
  toggleContainer.toggle();

  var buttonText = $('#btn_'+textid+'').val();
  $('#btn_'+textid+'').val(buttonText == 'テキストを表示' ? 'テキストを非表示' : 'テキストを表示');

}

// マインドマップ上のノードを選択した状態で右クリックすると文書に反映する関数
function SetPurpose(){

  let selected_node = CheckSelectedNode();
  if(selected_node == null || selected_node.topic == undefined){
   // (textareaのid名).value = "ノードを選択してください";
   return;
 }else{
   $slide_topic.push(selected_node.topic);
   CreateThread(selected_node.topic, selected_node.id);
 }
}

// ノードに紐づいていないスライドを新規作成する関数  fujinaka変更
function MakeSlide(){

    var node_id = [];
    var uuid = getUniqueStr(); // Threadのidをランダム生成
    var setid = getUniqueStr();
    var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった
    var quot_setid = "\"" + setid + "\"";
    console.log(uuid);
    console.log(quot_uuid);

    const section_dom = document.querySelector(".section");
    if (section_dom) {
      const dataElement = document.getElementById(section_dom.id);
      const paragraph_dom = dataElement.getElementsByClassName("thread");
  
      if (paragraph_dom && paragraph_dom.length > 0) {
        var paragraph_rank = paragraph_dom.length + 1;
        Insert_paragraph(uuid, section_dom.id, paragraph_rank);
      } else {
        Insert_paragraph(uuid, section_dom.id, 1);
      }
    } else {
      window.alert("節を追加してください");
      return;
    }
    
    let label = "<div class='thread' id='"+uuid+"' value='パラグラフ' data-node_id='"+node_id+"' style='background-color:white; padding:10px; margin-top:10px; margin-bottom:10px; margin-right:10px; margin-left:5px;'>"+
                  "<span class = 'tspan' tabindex='0'>パラグラフタイトル</span>"+
                  "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Update_paragraph_Title(this,"+quot_uuid+");' placeholder='パラグラフタイトル' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
                  "<input class='simple_btn' type='button' value='×' onclick='Removeparagraph("+quot_uuid+", false);Record_paragraphRank();Get_ContentRank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                  "<br>"+
                  "<div class='purpose'>"+
                  "</div>"+
                  "<br>"+
                  "<input id='btn_"+uuid+"' type='button' value='テキストを表示' onclick='Toggletext("+quot_uuid+");' style='width:100px; height:25px; font-size:10px; float:right;'>"+
                  "<br>"+
                  "<div id='container_"+uuid+"' style='display: none;'>"+
                    "<div id ='editor_"+uuid+"'></div>"+
                  "</div>"+
                "</div>";

    let area = $( ".paragraph", "#" + section_dom.id + "");
    area.append(label);

    // 追加された thread に Sortable 適用
    var newThread = area.find('.thread').last();
    new Sortable(newThread.parent()[0], {
      handle: '.thread', // ソートハンドルとなる要素を指定
      group: 'paragraphs', // グループ名を共有
      animation: 150,
      onEnd: function (evt) {
        var log = evt.from.children;
        console.log(log);
        Record_paragraphRank();
      }
    });

    var newPurposearea = newThread.find('.purpose').get(0);
    new Sortable(newPurposearea, {
      animation: 150,
      onEnd: function (evt) {
        var log = evt.from.children;
        console.log(log);
        Get_ContentRank();
      }
    });
  


   /*$('.paragraph').sortable({
     update: function(){
         var log = $(this).sortable("toArray");
         console.log(log);
         setTimeout( () =>
         {
          Record_paragraphRank();
        }, 3000 ); 
     }
   });

   $('.thread').draggable({
    connectToSortable: ".paragraph"
  });

   $('.purpose').sortable({
     update: function(){
         var log = $(this).sortable("toArray");
         console.log(log);
         Get_ContentRank();
     }
   });*/

  $('#'+uuid).data('node_id', node_id);

  var quill = new Quill('#editor_'+uuid+'', { //Quillインスタンス
    modules: { toolbar: toolbarOptions },
    theme: 'snow',
  });

  // 対応するCSSを動的に追加する
  var style = document.createElement('style');
  style.textContent = '#editor_' + uuid + ' { min-height: 200px; }';
  document.head.appendChild(style);

  quills[uuid] = quill; // オブジェクトにQuillインスタンスを格納
        
  var newContent = "パラグラフの内容を書き込んでください";
  quill.root.innerHTML = newContent;
  
  
  quills[uuid].on('editor-change', function(eventName, ...args) {
    if (eventName === 'text-change') {
      // エディタのテキストが変更されたときの処理
    } else if (eventName === 'selection-change') {
      // 選択範囲が変更されたときの処理
      var hasFocus = args[0];
      if (hasFocus) {
        // エディタがフォーカスを持っているときの処理
        TextboxClick();
      } else {
        // エディタがフォーカスを持っていないときの処理
        Update_paragraph_Content(uuid, quills[uuid]);
      }
    }
  });
  

  Get_ContentRank();

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
    if(arr.length == 0){
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
                  "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+selected_node.topic+"</textarea>"+
                  "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Get_ContentRank();'>"+
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
      $('#'+target).children('.purpose').append(label);
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
    dom_target.style.backgroundColor = "#cce5ff";
    // dom_target.style.border = "0.3px solid #b8daff";
    dom_target.setAttribute("type","toi");
  } else{
    dom_target.style.backgroundColor = "#fff3cd";
    // dom_target.style.border = "0.3px solid #ffeeba";
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

  Get_ContentRank();

  unconsidered_rationality_feedback(id, c_id);

}


//コンテンツの新規作成
// function NewContent_Append(data, tpp){
//     var setid = getUniqueStr();  //contentID
//     var quot_setid = "\"" + setid + "\"";
//
//     //内容テキストエリアにノード内容を挿入
//     let area = document.getElementById(data);
//     console.log(target);
//     console.log(data);
//     let label = "<div id='"+setid+"' class='scenario_content'>"+
//                   "<span class='cspan' name = '0' style = 'width:calc(100% - 25px)'>New Content</span>"+
//                   "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+")' placeholder='内容' style='width: 95%' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
//                   "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");'>"+
//                 "</div>";
//     $('#'+data).children('div').append(label);
//
//   // var concept_id = GetConceptId(id);  //conceptID
//   // console.log(setid);  //content_id
//   // console.log(id);  //node_id
//   // console.log(concept_id);  //concept_id
//   // console.log(content);  //content
//   // console.log(target);  //slideID
//
//   // Record_content(setid,  '','', '', data,'');
//
//   var dom = $('#'+setid).find('.cspan');
//   console.log(dom[0]);
//   var dom_target = dom[0];
//   var type = tpp.value;
//   if(type == "問い"){
//     dom_target.style.backgroundColor = "#cce5ff";
//     dom_target.style.border = "0.3px solid #b8daff";
//     dom_target.setAttribute("type","toi");
//     Record_content(setid,  '','', '', data,'toi');
//   } else{
//     dom_target.style.backgroundColor = "#fff3cd";
//     dom_target.style.border = "0.3px solid #ffeeba";
//     dom_target.setAttribute("type","answer");
//     Record_content(setid,  '','', '', data,'answer');
//   }
//
// }

//コンテンツの新規作成
function NewContent_Append(type){ //fujinaka追加
  var nodeid = getUniqueStr();  //nodeID fujinaka追加 labelにも追加　Recordにも追加
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
                "<span node_id='"+nodeid+"' class='cspan' name = '0' style = 'width:calc(100% - 25px)' tabindex='0'></span>"+
                "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'></textarea>"+
                "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Get_ContentRank();'>"+
              "</div>";

  const c_dom = document.getElementsByClassName("cspan");
  var check=0;
  for(var i=0; i<c_dom.length; i++){
    if(c_dom[i].style.border == "2px solid gray"){
      var setindent = c_dom[i].getAttribute("name");
      var settype = c_dom[i].getAttribute("type");
      var setconcept = c_dom[i].getAttribute("concept_id");
      const tg_dom = c_dom[i].parentNode.id;
      console.log(tg_dom);
      $('#'+tg_dom).after(label);
      check++;
    }
  }
  if(check==0){
    $('#'+data).children('.purpose').append(label);
  }

  //問いor答えノードの分別
  var dom = $('#'+setid).find('.cspan');
  console.log(dom[0]);
  var dom_target = dom[0];
  dom_target.style.border = "2px solid red";
  if(type == "問い"){
    dom_target.innerHTML = "新規問いノード";
    dom_target.style.backgroundColor = "#cce5ff";
    // dom_target.style.border = "0.3px solid #b8daff";
    dom_target.setAttribute("type","toi");
    Record_content(setid, nodeid, '', '', data,'toi');
  } else{
    dom_target.innerHTML = "新規答えノード";
    dom_target.style.backgroundColor = "#fff3cd";
    // dom_target.style.border = "0.3px solid #ffeeba";
    dom_target.setAttribute("type","answer");
    if(settype === "toi" && setconcept !== null || setconcept !== undefined) {
      dom_target.setAttribute("concept_id", setconcept);
    }
    Record_content(setid, nodeid, setconcept, '', data, 'answer');
    if (setconcept == "1519483811401_n426"){

      $.ajax({
        url: "php/fujinaka_rationality.php",
        type: "POST",
        data: { 
          type : "insert_answer",
          node_id : nodeid,
          parent_id : parent_id,
          nodetype : "answer"
        }});

    }

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
  SetIndent();

  Get_ContentRank();
}

//問いエリアからシナリオに埋め込む関数
function Toi_Append(){ //fujinaka追加
  console.log("OK");
  console.log(this.innerHTML);
  const content = this.innerHTML;
  console.log(content);
  console.log(this.getAttribute("concept_id"));
  const conceptid = this.getAttribute("concept_id");
  const thread_dom = document.getElementsByClassName("thread");
  for(var i=0; i<thread_dom.length; i++){
    if(thread_dom[i].style.border == "2.3px outset black"){
      console.log(thread_dom[i]);
      var area = thread_dom[i];
      var tid = thread_dom[i].id;
    }
  }

  var nodeid = getUniqueStr();  //nodeID fujinaka追加
  var setid = getUniqueStr();  //contentID
  var quot_setid = "\"" + setid + "\"";

  //内容テキストエリアにノード内容を挿入
  console.log(tid);
  console.log(area);
  let label = "<div id='"+setid+"' class='scenario_content'>"+
                "<span node_id='"+nodeid+"' class='cspan' name = '0' concept_id = '"+conceptid+"' style = 'width:calc(100% - 25px)' tabindex='0'>"+content+"</span>"+
                "<textarea id='contents-"+setid+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_setid+");' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+content+"</textarea>"+
                "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_setid+");Get_ContentRank();'>"+
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
    $('#'+tid).children('.purpose').append(label);
  }


  var dom = $('#'+setid).find('.cspan');
  console.log(dom[0]);
  var dom_target = dom[0];

  dom_target.style.backgroundColor = "#cce5ff";
  // dom_target.style.border = "0.3px solid #b8daff";
  dom_target.setAttribute("type","toi");
  Record_content(setid,  nodeid ,conceptid, content, tid,'toi');

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
  SetIndent();
  Get_ContentRank();

  var dom_all = document.getElementsByClassName("cspan");

  if(conceptid == "1519483811401_n426"){

    for(var j=0; j<dom_all.length; j++){

        if(dom_all[j].style.backgroundColor == "rgb(255, 105, 180)"){

          const node_id = dom_all[j].getAttribute("node_id");
          const concept_id = dom_all[j].getAttribute("concept_id");
          

          if(concept_id  !== null ||  concept_id  !== undefined){ //concept_idがあるならprepared_question
            $.ajax({
              url: "php/fujinaka_rationality.php",
              type: "POST",
              data: { 
                type : "insert",
                rationality_id : nodeid,
                node_id : node_id,
                concept_id : concept_id,
                nodetype : "toi"
              }});
          }else{
            $.ajax({
              url: "php/fujinaka_rationality.php",
              type: "POST",
              data: { 
                type : "insert",
                rationality_id : nodeid,
                node_id : node_id,
                concept_id : "original",
                nodetype : "toi"
              }});
          }
        }
      }
    }
}


// textareaの内容をテキストファイルを出力する
// 拡張子はtxt，中身はHTML形式で，クライアント側に保存
function OutputFile(){

    // var html = $('#document_area').html();
    var html = $('html').html();
    //
    // $.ajax({
    //   url: "php/create_html.php", // ファイル名をつける
    //   success:function(data){
        // ダウンロードリンクを作成
        var link = document.createElement( 'a' );
      	link.href = window.URL.createObjectURL( new Blob( [html] ) );
      	link.download = "interface.html"; // ファイル名
      	link.click();
    //   }
    // });
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



function Create_pptx(slideID){
  $.ajax({

      url: "plugins/phppresentation/create_pptx.php",
      type: "POST",
      // data: {id : slideID,},
      success: function () {
        console.log("登録成功：　" +slideID );
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
  const tmp_title = document.getElementById("scenario_title");
  console.log(tmp_title);
  const title = tmp_title.value;
  console.log(title);
  title_update(title);
}

function Get_SlideRank(){
  const slide_dom = document.getElementsByClassName("thread");
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

function Record_ChapterRank(){ //章順番保存
  var chapter_dom = document.getElementsByClassName("chapter");

  if (chapter_dom && chapter_dom.length > 0) {
    for(var i=0; i<chapter_dom.length; i++){

      Update_Chapter_Rank(chapter_dom[i].id, i+1);

    }     
  }
}

function Record_sectionRank(){ //節順番保存
  var chapter_dom = document.getElementsByClassName("chapter");
  
  if (chapter_dom && chapter_dom.length > 0) {
    for(var i=0; i<chapter_dom.length; i++){
      const dataElement = document.getElementById(chapter_dom[i].id);
      const section_dom = dataElement.getElementsByClassName("section");
      
      if (section_dom && section_dom.length > 0) {
        for(var j=0; j<section_dom.length; j++){

          Update_section_Rank(section_dom[j].id, chapter_dom[i].id, j+1);
    
        }     
      }
    }
  }
}

function Record_paragraphRank(){ //パラグラフ順番保存
  var section_dom = document.getElementsByClassName("section");

  
  if (section_dom && section_dom.length > 0) {
    for(var i=0; i<section_dom.length; i++){
      const dataElement = document.getElementById(section_dom[i].id);
      const paragraph_dom = dataElement.getElementsByClassName("thread");
      
      if (paragraph_dom && paragraph_dom.length > 0) {
        for(var j=0; j<paragraph_dom.length; j++){

          Update_paragraph_Rank(paragraph_dom[j].id, section_dom[i].id, j+1);
    
        }     
      }
    }
  }
}

function Record_ContentRank(){ //

}

function Get_ContentRank(){
  var slide_dom = document.getElementsByClassName("thread");
  var content_dom;
  console.log(slide_dom);


  // 2025-02-10 kawa content_rank.phpで処理
  // Update_content_rank().then(() => {
    //最新のコンテントの順番を保存する処理
    for(var i=0; i<slide_dom.length; i++){
      var slide_id = slide_dom[i].id;
      console.log(slide_id);
      var content_dom = $(slide_dom[i]).find('.scenario_content');
      console.log(content_dom);
      for(var j=0; j<content_dom.length; j++){
        var rank = j;
        console.log(rank);
        var content_id = content_dom[j].id;
        const content = content_dom[j].firstElementChild.innerHTML;
        const node_id = content_dom[j].firstElementChild.getAttribute('node_id');
        const type = content_dom[j].firstElementChild.getAttribute('type');
        const indent = content_dom[j].firstElementChild.getAttribute('name');
        const concept_id = content_dom[j].firstElementChild.getAttribute('concept_id');


        Record_content_rank(content_id, rank, slide_id, content, node_id, type, indent, concept_id);
      }
    }
  // });
}


$(function(){
    $('html').keydown(function(e){
        if(e.which==9 || (event.shiftKey && event.which == 9)){//e.which==37
          console.log(e.which);
          var span_dom = document.getElementsByClassName("cspan");
          var target_dom;
          for(var i=0; i<span_dom.length; i++){
            console.log(span_dom[i].style.border);
            if(span_dom[i].style.border == "2px solid gray"){
              target_dom = span_dom[i];
              break;
            }
          }
          var current = document.activeElement;
          console.log(current.className);
          console.log(current);
          console.log(target_dom);

          if(!(typeof target_dom === 'undefined') && current.className != 'text_border' && current.className != 'title_slide' && current.className != 'document_title_area' && current.className != 'jsmind-editor' && current.className != 'form-control' && current.className != 't_ad' && current.className != 't_ref'){
          // if(!(typeof target_dom === 'undefined')){
            var text_dom = target_dom.nextElementSibling;
            console.log(text_dom);
            console.log(e.which);

            if(event.shiftKey && event.which == 9){// Key[→]３９
              if(target_dom.style.width == "calc(100% - 85px)"){
                console.log(target_dom);
                target_dom.style.width = "calc(100% - 65px)";
                target_dom.style.marginLeft = "40px";
                target_dom.setAttribute('name', '2');
                text_dom.style.width = "calc(100% - 65px)";
                text_dom.style.marginLeft = "40px";
              } else if(target_dom.style.width == "calc(100% - 65px)"){
                target_dom.style.width = "calc(100% - 45px)";
                target_dom.style.marginLeft = "20px";
                target_dom.setAttribute('name', '1');
                text_dom.style.width = "calc(100% - 45px)";
                text_dom.style.marginLeft = "20px";
              } else if(target_dom.style.width == "calc(100% - 45px)"){
                target_dom.style.width = "calc(100% - 25px)";
                target_dom.style.marginLeft = "";
                target_dom.setAttribute('name', '0');
                text_dom.style.width = "calc(100% - 25px)";
                text_dom.style.marginLeft = "";
              }
             }
             else if(event.which == 9){// Key[←]37
               if(target_dom.style.width == "calc(100% - 25px)"){
                 console.log(target_dom);
                 target_dom.style.width = "calc(100% - 45px)";
                 target_dom.style.marginLeft = "20px";
                 target_dom.setAttribute('name', '1');
                 text_dom.style.width = "calc(100% - 45px)";
                 text_dom.style.marginLeft = "20px";
               } else if(target_dom.style.width == "calc(100% - 45px)"){
                 target_dom.style.width = "calc(100% - 65px)";
                 target_dom.style.marginLeft = "40px";
                 target_dom.setAttribute('name', '2');
                 text_dom.style.width = "calc(100% - 65px)";
                 text_dom.style.marginLeft = "40px";
               } else if(target_dom.style.width == "calc(100% - 65px)"){
                 target_dom.style.width = "calc(100% - 85px)";
                 target_dom.style.marginLeft = "60px";
                 target_dom.setAttribute('name', '3');
                 text_dom.style.width = "calc(100% - 85px)";
                 text_dom.style.marginLeft = "60px";
               }
             }
          }
        }
    });
});

function Hide_fin_btn(){
  $('#finish_btn').toggle('fast');
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
      console.log(data);
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

class Chapter{
  constructor(obj){

    const id = obj.id;
    const title= obj.title;
    const quot_id = "\"" + id + "\"";

    let label = "<div class='chapter' id='"+id+"' value='章' style='background-color:white; padding:10px;'>"+
                  "<span class = 'tspan' tabindex='0'>"+title+"</span>"+
                  "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Update_Chapter_Title(this,"+quot_id+");' placeholder='章タイトル' onkeypress='Keypress(event.keyCode, this);'>"+title+"</textarea>"+
                  "<input class='simple_btn' type='button' value='×' onclick='Remove_Chapter("+quot_id+");Record_ChapterRank();Get_ContentRank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                  "<br>"+
                  "<div class='section_area'>"+
                  "</div>"+
                  "<br>"+
                "</div>";
    
    let area = $("#chapter_area");
    area.append(label);

    /*$('#chapter_area').sortable({
      update: function(){
          var log = $(this).sortable("toArray");
          console.log(log);
          setTimeout( () =>
          {
           Record_ChapterRank();
         }, 3000 ); 
      }
    });*/
  }
}

class Section{
  constructor(obj){

    const id = obj.id;
    const chapter_id = obj.chapter_id;
    const title= obj.title;
    const quot_id = "\"" + id + "\"";

    console.log(id);

    let label = "<div class='section' id='"+id+"' value='節' style='background-color:white; padding:10px;'>"+
                  "<span class = 'tspan' tabindex='0'>"+title+"</span>"+
                  "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Update_section_Title(this,"+quot_id+");' placeholder='節タイトル' onkeypress='Keypress(event.keyCode, this);'>"+title+"</textarea>"+
                  "<input class='simple_btn' type='button' value='×' onclick='Remove_section("+quot_id+", false);Record_sectionRank();Get_ContentRank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                  "<br>"+
                  "<div class='paragraph'>"+
                  "</div>"+
                  "<br>"+
                "</div>";
    
    let area = $( ".section_area", "#" + chapter_id + "");
    area.append(label);

    /*$('#chapter_area').sortable({
      update: function(){
          var log = $(this).sortable("toArray");
          console.log(log);
          setTimeout( () =>
          {
           Record_ChapterRank();
         }, 3000 ); 
      }
    });*/
  }
}

class paragraph{
  constructor(obj){

    const node_id = [];
    const paragraph_id = obj.paragraph_id;
    const section_id = obj.section_id;
    const paragraph_title = obj.paragraph_title;
    let paragraph_content = obj.paragraph_content;
    const quot_paragraph_id = "\"" + paragraph_id + "\"";

    if(paragraph_content == null){
      paragraph_content = "パラグラフの内容を書き込んでください";
    }

    let label = "<div class='thread' id='"+paragraph_id+"' value='パラグラフ' data-node_id='"+node_id+"' style='background-color:white; padding:10px; margin-top:10px; margin-bottom:10px; margin-right:10px; margin-left:5px;'>"+
                  "<span class = 'tspan' tabindex='0'>"+paragraph_title+"</span>"+
                  "<textarea class='title_slide' class='statement' onFocus='TextboxClick()' onblur='Update_paragraph_Title(this,"+quot_paragraph_id+");' placeholder='パラグラフタイトル' onkeypress='Keypress(event.keyCode, this);'>"+paragraph_title+"</textarea>"+
                  "<input class='simple_btn' type='button' value='×' onclick='Removeparagraph("+quot_paragraph_id+", false);Record_paragraphRank();Get_ContentRank();' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                  "<br>"+
                  "<div class='purpose'>"+
                  "</div>"+
                  "<br>"+
                  "<input id='btn_"+paragraph_id+"' type='button' value='テキストを表示' onclick='Toggletext("+quot_paragraph_id+");' style='width:100px; height:25px; font-size:10px; float:right;'>"+
                  "<br>"+
                  "<div id='container_"+paragraph_id+"' style='display: none;'>"+
                    "<div id ='editor_"+paragraph_id+"'></div>"+
                  "</div>"+
                "</div>";

    let area = $( ".paragraph", "#" + section_id + "");
    area.append(label);

    /*$('.paragraph').sortable({
      update: function(){
          var log = $(this).sortable("toArray");
          console.log(log);
          setTimeout( () =>
          {
           Record_paragraphRank();
         }, 3000 ); 
      }
    });

    $('.thread').draggable({
      connectToSortable: ".paragraph"
    });

    $('.purpose').sortable({
      update: function(){
          var log = $(this).sortable("toArray");
          console.log(log);
          Get_ContentRank();
      }
    });*/

    var quill = new Quill('#editor_' + paragraph_id + '', quilloptions);

    var length = quill.getLength()
    var text = quill.getText(length - 2, 2)

    // Remove extraneous new lines
    if (text === '\n\n') {
      quill.deleteText(quill.getLength() - 2, 2)
    }
  
    // 対応するCSSを動的に追加する
    var style = document.createElement('style');
    style.textContent = '#editor_' + paragraph_id + ' { min-height: 200px; }';
    document.head.appendChild(style);
    
    quills[paragraph_id] = quill; // オブジェクトにQuillインスタンスを格納
      
    quill.root.innerHTML = paragraph_content;
      
    quills[paragraph_id].on('editor-change', function(eventName, ...args) {
      if (eventName === 'text-change') {
        // エディタのテキストが変更されたときの処理
      } else if (eventName === 'selection-change') {
        // 選択範囲が変更されたときの処理
        var hasFocus = args[0];
        if (hasFocus) {
          // エディタがフォーカスを持っているときの処理
          TextboxClick();
        } else {
          // エディタがフォーカスを持っていないときの処理
          Update_paragraph_Content(paragraph_id, quills[paragraph_id]);
        }
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
    console.log(arr);
    if(arr === undefined || arr.length === 0){
      arr = [];
      console.log("OK");
    }
    arr.push(node_id);
    console.log(arr);
    $('#'+slide_id).data('node_id', arr);

    var quot_contentid = "\"" + content_id + "\"";

    //内容テキストエリアにノード内容を挿入
    const quot_slide_id = "\"" + slide_id + "\"";
    let label = "<div id='"+content_id+"' class='scenario_content'>"+
                  "<span class = 'cspan' name = '"+indent+"' style = 'width:calc(100% - 25px)' type='"+type+"' tabindex='0'>"+content+"</span>"+
                  "<textarea id='contents-"+content_id+"' class='text_border' class='statement' onFocus='TextboxClick()' onblur='Edit_save(this,"+quot_contentid+");' placeholder='内容' style='width:calc(100% - 25px)' onkeypress='Keypress(event.keyCode, this);'>"+content+"</textarea>"+
                  "<input class='content_delete' type='button' value='×' onclick='RemoveAppendNode("+quot_contentid+");Get_ContentRank();'>"+
                "</div>";
    console.log(label);
    console.log($('#'+slide_id).children('div'));
    $('#'+slide_id).children('.purpose').append(label);


    $slide_topic.push(content);
    console.log($slide_topic);

    console.log("contents-"+content_id);
    var dom_tmp = document.getElementById("contents-"+content_id);
    console.log(dom_tmp);
    var dom_target = dom_tmp.previousElementSibling;
    console.log(dom_target);
    if(type=="toi"){
      dom_target.style.backgroundColor = "#cce5ff";
      // dom_target.style.border = "0.3px solid #b8daff";
      dom_target.setAttribute("type","toi");
    } else{
      dom_target.style.backgroundColor = "#fff3cd";
      // dom_target.style.border = "0.3px solid #ffeeba";
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

//チャプター(章)再現の関数
async function Rebuild_chapter(){

  await $.ajax({
	    url: "php/chapter_rebuild.php",
	    type: "POST",
	    success: function(arr){
        if(arr == "[]"){
          console.log(arr);
        }else{
          console.log(arr);
          var parse = JSON.parse(arr);

          parse.sort(function(a, b) {//並び替え
            return a.rank - b.rank;
          });

          console.log(parse); //並び替えた結果を表示
          
          for(var i=0; i<parse.length; i++){
            const newchapter = new Chapter({
              id: parse[i].id,
              title: parse[i].title,
            });
            delete newchapter;
            }
          }
        console.log("章OK");
	    },
      error:function(){
        console.log("章エラーです");
      }
	});
}

//セクション(節)再現の関数
async function Rebuild_section(){

  await $.ajax({
	    url: "php/section_rebuild.php",
	    type: "POST",
	    success: function(arr){
        if(arr == "[]"){
          console.log(arr);
        }else{
          console.log(arr);
          var parse = JSON.parse(arr);

          parse.sort(function (a, b) {//並び替え
            
            let compareChapter = a.chapter_id.localeCompare(b.chapter_id);
            
            if (compareChapter === 0) {
              return a.rank - b.rank;
            }

            return compareChapter;
        });


          console.log(parse); //並び替えた結果を表示
          
          for(var i=0; i<parse.length; i++){
            const newSection = new Section({
              id: parse[i].id,
              chapter_id: parse[i].chapter_id,
              title: parse[i].title,
            });
            delete newSection;
            }
          }
        console.log("節OK");
	    },
      error:function(){
        console.log("エラーです");
      }
	});
}

//パラグラフ再現の関数
async function Rebuild_paragraph(){

  await $.ajax({
	    url: "php/paragraph_rebuild.php",
	    type: "POST",
	    success: function(arr){
        if(arr == "[]"){
          console.log(arr);
        }else{
          console.log(arr);
          var parse = JSON.parse(arr);

          parse.sort(function (a, b) {//並び替え
            
            let comparesection = a.section_id.localeCompare(b.section_id);
            
            if (comparesection === 0) {
              return a.rank - b.rank;
            }

            return comparesection;
        });


          console.log(parse); //並び替えた結果を表示
          
          for(var i=0; i<parse.length; i++){
            const newslide = new paragraph({
              paragraph_id: parse[i].id,
              section_id: parse[i].section_id,
              paragraph_title: parse[i].title,
              paragraph_content: parse[i].content,
            });
            delete newslide;
            }
          }
        console.log("パラグラフOK");
	    },
      error:function(){
        console.log("エラーです");
      }
	});
}


//コンテンツ再現の関数
async function Rebuild_content(){
  await $.ajax({
	    url: "php/content_rebuild.php",
	    type: "POST",
	    success: function(arr){

        if(arr == "[]"){
          console.log(arr);
        }else{
          console.log(arr);
          var parse = JSON.parse(arr);
          console.log(parse);
          console.log(parse.length);
          for(var i=0; i<parse.length; i++){
            for(var j=0; j<parse.length; j++){
              console.log(String(i), parse[j].rank);
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
                  console.log(dom_target);
                  dom_target.setAttribute("node_id",node_id);
                }
                if(parse[j].concept_id != ""){
                  const content_id = parse[j].content_id;
                  const concept_id = parse[j].concept_id;
                  var dom_tmp = document.getElementById("contents-"+content_id);
                  var dom_target = dom_tmp.previousElementSibling;
                  console.log(dom_target);
                  dom_target.setAttribute("concept_id",concept_id);
                }
                delete newcontent;
                console.log("コンテント再現完了");
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

function Rebuild_title(){
  $.ajax({
	    url: "php/title_rebuild.php",
	    type: "POST",
	    success: function(title){

        console.log(title);
        var parse = JSON.parse(title);
        console.log(parse);
        console.log(parse[0].scenario_title);
        var scenario_title = parse[0].scenario_title;
        console.log(scenario_title);
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
    switch(indent){
      case "1":
        target_dom.style.width = "calc(100% - 45px)";
        target_dom.style.marginLeft = "20px";
        text_dom.style.width = "calc(100% - 45px)";
        text_dom.style.marginLeft = "20px";
        break;
      case "2":
        target_dom.style.width = "calc(100% - 65px)";
        target_dom.style.marginLeft = "40px";
        text_dom.style.width = "calc(100% - 65px)";
        text_dom.style.marginLeft = "40px";
        break;
      case "3":
        target_dom.style.width = "calc(100% - 85px)";
        target_dom.style.marginLeft = "60px";
        text_dom.style.width = "calc(100% - 85px)";
        text_dom.style.marginLeft = "60px";
        break;
    }
  }
}

function Unreflected_node(){ //fujinaka変更
  const jmnode = document.getElementsByTagName("jmnode");
  const cnode = document.getElementsByClassName("cspan");
  
  for(let i=0; i<cnodes.length; i++){
    // ノードのハイライト色をデフォルト色に変更
    if(cnode[i].getAttribute("type") === "toi"){
      cnode[i].style.backgroundColor = "#cce5ff";
    } else {
      cnode[i].style.backgroundColor = "#fff3cd";
    }
  }

  const jmnode_array = Array.prototype.slice.call(jmnode);

  for (let i = 0; i < cnode.length; i++) { 
    //シナリオ上で追加，編集したノードの背景色を変更
    const cno = cnode[i];
    if (jmnode_array.every(jmn => cno.getAttribute("node_id") !== jmn.getAttribute("nodeid"))) { 
      // シナリオにあってマップにないノード（シナリオ上で新規作成したノード）の場合
      cno.style.backgroundColor = "#f8d7da";
    } else { 
      // シナリオノードと対応するマップのノードのテキストが違う場合
      const correspondingJmn = jmnode_array.find(jmn => cno.getAttribute("node_id") === jmn.getAttribute("nodeid"));
      if(correspondingJmn.innerHTML !== cno.innerHTML) {
        cno.style.backgroundColor = "#f8d7ff";
      }
    }
  }

}

function Record_rank(){
  Get_SlideRank();
  Get_ContentRank();
  Get_SlideTitle();
}


function Create_preview(){ //プレビューを表示する関数

    //最新の論文html  
    var mix_dom = "";

    //最新の論文プレーンテキスト
    var mix_text = "";
    
    mix_text += document.getElementById("scenario_title").value
   
    var chapter_dom = document.getElementsByClassName("chapter");
      for (i=0;i<chapter_dom.length;i++){
      mix_text += chapter_dom[i].children[1].value
      
      var section_dom = chapter_dom[i].getElementsByClassName("section");
      for (j=0;j<section_dom.length;j++){
        mix_text += section_dom[j].children[1].value;
       
        var paragraph_dom = section_dom[j].getElementsByClassName("thread");
        for (k=0;k<paragraph_dom.length;k++){
          mix_text += paragraph_dom[k].children[1].value;
          mix_text += quills[paragraph_dom[k].id].root.textContent;
  
        }
      }
    }

  if(!(preview_dom)){ //初めての関数呼び出し

    preview_text = mix_text;

    mix_dom += "<div id='prev_scenario_title'>"+document.getElementById("scenario_title").value+"</div>";

    var chapter_dom = document.getElementsByClassName("chapter");
    for (i=0;i<chapter_dom.length;i++){
      mix_dom += "<div id='"+chapter_dom[i].id+"' class = 'prev_chapter'><p class = 'prev_chapter_title'>"+chapter_dom[i].children[1].value+"</p>";

      var section_dom = chapter_dom[i].getElementsByClassName("section");
      for (j=0;j<section_dom.length;j++){
        mix_dom += "<div id='"+section_dom[j].id+"' class = 'prev_section'><p class = 'prev_section_title'>"+section_dom[j].children[1].value+"</p>";
    
        var paragraph_dom = section_dom[j].getElementsByClassName("thread");
        for (k=0;k<paragraph_dom.length;k++){
          mix_dom += "<div id='"+paragraph_dom[k].id+"' class = 'prev_paragraph'><p class = 'prev_paragraph_title'>"+paragraph_dom[k].children[1].value+"</p>";
          mix_dom += quills[paragraph_dom[k].id].root.innerHTML+"</div>";

          console.log(quills[paragraph_dom[k].id].root.innerHTML);
          console.log(quills[paragraph_dom[k].id].root.innerHTML.length);
          console.log(quills[paragraph_dom[k].id].root.innerText);
          console.log(quills[paragraph_dom[k].id].root.innerText.length);
          
          

        }
        mix_dom+= "</div><br>"
      }
      mix_dom+= "</div><br><br>"
    }

    const new_span = document.createElement('span');
    new_span.setAttribute('id', 'rebuild');
    new_span.innerHTML = mix_dom;

    const area = $("#preview_area");
    area.append(new_span);

    add_span();

    console.log(document.getElementById("preview_area").innerHTML);

    //$.ajax() あとで

    return;

  } else if(!(preview_text)){ //各1回目の呼び出し

    preview_text = mix_text;

    const area = $("#preview_area");
    area.append(preview_dom); // bodyに追加

    console.log(document.getElementById("preview_area").innerHTML);

    return;

  }

  const new_html_span_list = preview_update(preview_text, mix_text, preview_dom);

  let span_count = 0;

  mix_dom += "<div id='prev_scenario_title'>";
  for (let i = 0; i < document.getElementById("scenario_title").value.length; i++) {

    mix_dom += new_html_span_list[span_count];
    span_count++;
    
  }
  mix_dom += "</div>";

  var chapter_dom = document.getElementsByClassName("chapter");
  for (let i = 0; i < chapter_dom.length; i++) {

    mix_dom += "<div id='"+chapter_dom[i].id+"' class = 'prev_chapter'><p class = 'prev_chapter_title'>";
    
    for (let ia = 0; ia < chapter_dom[i].children[1].value.length; ia++) {

      mix_dom += new_html_span_list[span_count];
      span_count++;
      
    }
    mix_dom += "</p>";


    var section_dom = chapter_dom[i].getElementsByClassName("section");
    for (let j = 0; j < section_dom.length; j++) {

      mix_dom += "<div id='"+section_dom[j].id+"' class = 'prev_section'><p class = 'prev_section_title'>";
      
      for (let ja = 0; ja < section_dom[j].children[1].value.length; ja++) {

        mix_dom += new_html_span_list[span_count];
        span_count++;
        
      }
      mix_dom += "</p>";
      

      var paragraph_dom = section_dom[j].getElementsByClassName("thread");
      for (let k = 0; k < paragraph_dom.length; k++) {

        mix_dom += "<div id='"+paragraph_dom[k].id+"' class = 'prev_paragraph'><p class = 'prev_paragraph_title'>";
        
        for (let ka = 0; ka < paragraph_dom[k].children[1].value.length; ka++) {

          mix_dom += new_html_span_list[span_count];
          span_count++;
          
        }
        mix_dom += "</p>";

        for (let kb = 0; kb < array.length; kb++) {
          const element = array[kb];
          
        }
        
      }
    }
    
  }

  
        mix_dom += quills[paragraph_dom[k].id].root.innerHTML+"</div>";


      mix_dom+= "</div><br>"
    
    mix_dom+= "</div><br><br>"
  

  
  
preview_text = mix_text;

  console.log(document.getElementById("preview_area").innerHTML);
}

const add_span = () => {
  // 再帰関数を定義して、各文字に対して<span>タグを付与する
  const recursive_leaf_apply = (target_dom) => {
    if (target_dom.contents().length === 0) {
      // もしこれ以上子要素がない＝SPANを追加したい対象の論文文字列である可能性がある場合
      if (target_dom.context.nodeName === '#text') {
        // 空のオブジェクトではなく，実際に文字列である場合，SPANでくくって，ID, class付与
        const tmp = [...target_dom.context.nodeValue].map(char => {
          var uniqueID = getUniqueStr();
          return "<span id = " + uniqueID + " class = 'paper_txt_obj'>" + char + "</span>";
        }).join('');
        target_dom.replaceWith(tmp); // DOMオブジェクトの置き換え
        return; // この条件にマッチしてるときは条件分岐移行の処理を殺す
      }
    }

    target_dom.contents().each((ind, elm) => {
      // もし，子要素にさらにDOMがある場合（＝さらに掘り下げたところに文字があるかも知れない場合），再帰して，子要素に対してSPAN付与の必要性チェック
      return recursive_leaf_apply($(elm));
    });

  }

  // 対象となるDOMの要素を選択する
  const before_spanned_text = $('#rebuild');

  recursive_leaf_apply(before_spanned_text);

}


/*　プレビュー更新関数
*  入力：
*     older_text: 変更前の論文プレーンテキスト
*     newer_text: 最新の論文プレーンテキスト
*     older_html: 変更前のタグづけされたテキストのHTML
*  出力(return)：
*     newer_html_span_list: 最新の一文字ずつ全てにIDなどのタグ付けがなされたHTMLが格納された配列
*/
const preview_update = (older_text, newer_text, older_html) => {

  // 新しいHTMLのspan要素を格納する配列
  let newer_html_span_list = []; 
  
  // 変更前のHTMLからspan要素を抽出する
  const older_html_span_list = $(older_html).find("span.paper_txt_object");

  // 変更前のHTML内のspan要素のカウンター
  let count = 0; 

  // 変更前後のテキストの差分を計算（ライブラリ：diff-match-patchを利用）
  const diff_lib = new diff_match_patch();
  const diff_object_list = diff_lib.diff_main(older_text, newer_text);

  console.log(diff_object_list); //差分

  // 差分の各変更に対して処理を行う
  diff_object_list.map(change => {
    switch(change[0]){ //change[0]:テキストの変更情報を格納
      case '-1': //テキストが削除された場合
          // カウンターを削除された文字の数だけ増加させる
          count += change[1].length;
          break;
      case '0':  //テキストに変更がない場合
          // 変更前のHTMLからspan要素を取得して新しいHTMLに追加する
          for (let i = 0; i < change[1].length; i++) {
              newer_html_span_list.push(older_html_span_list[count]);
              count++;
          }
          break;
      case '1': //テキストが新しく追加された場合
          // 追加された文字に<span>を付与して新しいHTMLに追加する
          for (let i = 0; i < change[1].length; i++) {
              const uniqueID = getUniqueStr();
              newer_html_span_list.push("<span id=" + uniqueID + ">" + change[1][i] + "</span>");
          }
          break;
    }
  });

  return newer_html_span_list;
} 
