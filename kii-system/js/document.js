//
// matsuoka
//
//-------------------------- ドキュメントを作成する ------------------------

var metaname ="";　// メタ認知的知識

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



// 要素をクリックした時の動き
$(document).click(function(event){
  var target = $(event.target);// クリックした要素の取得
  // ①クリックした要素がメタ認知的知識を持つスレッドなら，記述の推奨を再表示
  // もしスレッドクラスを持っていたら
	if(target.parents(".thread").length){
    // とりあえず全部の親要素を格納
    let tmp = target.parents();
    // 親要素の数だけforを回す
    for(var i=0; i<target.parents().length; i++){
      // スレッドのどこをクリックしても，記述の推奨を表示したい
      // もしtmp[i]のクラスがthreadなら
      if(tmp[i].className == "thread"){
        let value = tmp[i].getAttribute('value');
        let id = tmp[i].getAttribute('id');

        metaname = value;
        check_action_disp(id);
      }
      // ②クリックしたスレッドがマインドマップのノードから作成されたものなら
      // そのノードを選択状態にする
      if(tmp[i].getAttribute("node_id") != null){ //node_id属性がnull以外なら
        var node_id = tmp[i].getAttribute("node_id");
        var jmnode = document.getElementsByTagName("jmnode");
        var count = null;
        for(var j=0; j<jmnode.length; j++){
          if(jmnode[j].getAttribute('nodeid') == node_id){
            // 現在のマップはコピーしたものと２つあるので，一致するノードは２つ存在する
            // 最初の方が思考整理支援システムタブでのノードなので，そっちを取得
            if(count == null){
              var count = j;
              jmnode[count].setAttribute('class', 'selected');
            }
          }
        }
      }
    }
	}
  // ①と②おわり

  // ③クリックした要素が資料の中の要素なら，
  // タブキーを押すことでインデントを下げることを可能にする
  if(target.parents(".contents").length){
  	$(target).keydown(function(e){
      // とりあえず全部の親要素を格納
      let tmp = target.parents();
      // 親要素の数だけforを回す
      for(var i=0; i<target.parents().length; i++){
        // もしtmp[i]のクラスがmessageなら
        if(tmp[i].className == "message"){
          var x = i; // 親要素の番号を取得
        }
      }
      var message = $(target.parents()[x]); // messageクラスのHTML要素
      var margin = parseInt($(message).css('margin-left')); // margin-leftの値をInt型で取得
      // shift + tabキーで左へずらす
      if(e.shiftKey){
        if (e.keyCode === 9) {
          e.preventDefault();
          margin = margin - 50;
          $(message).css('margin-left', margin);
    		}
      }
      // tabキーで右へずらす
      else if(e.keyCode === 9) {
        e.preventDefault();
        margin = margin + 50;
        $(message).css('margin-left', margin);
  		}
	  });
  }
});



// テキストエリアがクリックされたときに，ノードのフォーカスを外す
// これがないとテキスト入力時にマインドマップのショートカットキーが誤作動する
// 何を選択していたかの情報はlast_selected_nodeに保存しておく

var last_selected_node = null; //初期値はnull

function TextboxClick(){
  // ノードを選んでいなければ無視
  if(_jm.get_selected_node() == null){
    selected_node_area.value = "選択中のノードはありません";
    var doc_sup = $("#documentation_support_button");
    doc_sup.html("");
    return;
  }
  // ノードが選ばれているが，複数回テキストエリアをクリックした場合
  // 選択中のノードはfalseとなるので，ノード情報としてはlast_selected_nodeを参照するようにする
  if(_jm.mind.selected == false){
    selected_node_area.value = last_selected_node.topic;
  }
  else{ // ノードが選ばれた状態でテキストエリアをクリックした際
    let selected_node = _jm.get_selected_node();
    // 以前クリックしたものがない，もしくは以前と違っていた場合
    if(last_selected_node == null || last_selected_node.id != selected_node.id){
      // last_selected_nodeを更新
      last_selected_node = selected_node;
      $("#documentation_support_button").html(""); // すでにbuttonが出ている場合にbuttonを消す
    }
    selected_node_area.value = selected_node.topic;
    _jm.mind.selected = false; // 選択中のノードからフォーカスを外す
  }
  tag_list.selectedIndex = 0; // セレクトメニューのリセット
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



// オリジナルのノードを追加する関数
// 引数説明　data1:ノード内容，data2:ノードタイプ（問いor答え）
async function AddOriginalNode(data1, data2){

  let selected_node = CheckSelectedNode();
  if(selected_node == null || selected_node.topic == undefined){
    documentation_support_area.value = "親ノードが選択されていません";
    return;
  }

  var data3 = "";　//record_activitiesのための変数
  // 問いとしての入力
  if(data2 == "toi" || data2 == "question"){
    data3 = "question";
  }
  // 答えとしての入力
  if(data2 == "answer" || data2 == "ans"){
    data3 = "answer";
  }

  for(key in selected_node){
    if(key == "id"){
        var parent_id = selected_node[key];
    }
  }

  var nodeid = jsMind.util.uuid.newid();//idの生成
  var topic = data1; //ノード内容の内容
  var node = _jm.add_node(selected_node, nodeid, topic);
  var jmnode = document.getElementsByTagName("jmnode");

  for(var i=0; i<jmnode.length; i++){
    if(parent_id == jmnode[i].getAttribute("nodeid")){
      var p_concept = jmnode[i].getAttribute("concept_id");
    }
  }

  for(var j=0; j<jmnode.length; j++){
    if(nodeid == jmnode[j].getAttribute("nodeid")){

      jmnode[j].setAttribute("concept_id",p_concept);
      jmnode[j].setAttribute("type",data2);
      jmnode[j].setAttribute("parent_id",parent_id);

      try {
        var type_name = async function() {
          return new Promise((resolve, reject) => {
            $.ajax({
              url: "php/get_Typeid.php",
              type: "POST",
              data: { class: "", type: data2 },
              success: function(response) {
                const result = JSON.parse(response);
                resolve(result); 
              },
              error: function(error) {
                console.log("エラー:", error);
                reject(error);
              }
            });
          });
        };
        // get_typeid の非同期処理が完了するまで待つ
        var node_type_id = await get_Typeid("", type_name);
      } catch (error) {
        console.log("エラーが発生しました:", error);
      }

      $.ajax({
        url: "php/insert_node.php",
        type: "POST",
        data: { insert : "node",
                id : nodeid,
                parent_id : parent_id,
                type : node_type_id['node_type_id'],
                concept_id : p_concept,
                x : jmnode[j].style.left,
                y : jmnode[j].style.top,
                content : jmnode[j].innerHTML,
              },
      });

      Record_activities(nodeid,
                        parent_id,
                        "add",
                        jmnode[j].innerHTML,
                        p_concept,
                        data3,
                        jsMind.util.uuid.newid()
                       );

    }
  }
  $.ajax({
    url: "php/update_node.php",
    type: "POST",
    data: { update : "map" }
  });
}




// セレクトメニューからタグネームを選択する関数
// 新規作成は別挙動へ
function SelectTagname(name){
  // 現在選択されているノードのチェック
  CheckSelectedNode();

   // タグのセレクトメニューで新規作成が選ばれたら
  if(name.options[name.selectedIndex].value == "新規作成"){
   // オリジナルタグの作成メニューを表示
   const original_tag = document.getElementById("documentation_support_button");
   $("#documentation_support_button").html("");

   const p = document.createElement("p");
   const text = document.createTextNode("新規タグ作成");
   p.appendChild(text);
   original_tag.appendChild(p);

   // 入力のためのテキストボックス
   const textbox = document.createElement("input");
   textbox.setAttribute("type", "text");
   textbox.setAttribute("placeholder", "タグ名を入力してください");
   textbox.setAttribute("onFocus", TextboxClick());
   textbox.id = "textbox";
   textbox.name = "textbox";
   textbox.onfocus();
   original_tag.appendChild(textbox);

   // タグ名の送信ボタン
   const button = document.createElement("button");
   button.className = "button4";
   button.innerHTML = "決定";
   button.onclick = function(){

     let selected_node = CheckSelectedNode();
     var textbox = document.getElementById("textbox");
     var textvalue = textbox.value;
     var node_id = "";
     var node_topic = "";

     if(selected_node == null || undefined){
       node_id = "";
       node_topic = "";
     }else{
       node_id = selected_node.id;
       node_topic = selected_node.topic;
     }
       //DBに格納
     $.ajax({
       url: "php/create_original_tag.php",
       type: "POST",
       data: { tagname : textvalue,
               node_id   : node_id,
               node_topic : node_topic},

       success:function(){
         // console.log("成功");
         $("#documentation_support_button").html(""); // すでにbuttonが出ている場合にbuttonを消す
         metaname = textvalue; // check_metadataに受け渡すために変数に格納
         tag_list.selectedIndex = 1; // セレクトメニューの更新
         CreateThread(metaname, "");
       },
       error:function () { // ajaxの失敗
         console.log("登録失敗");
      }
     });
     documentation_support_area.value = "新規タグとして"+ textvalue + "を記述しました";
    }
   original_tag.appendChild(button);
   documentation_support_area.value = "作成するタグ名を入力してください";

   //タグ名一覧から選択した場合
  }else{
    $("#documentation_support_button").html(""); // すでにbuttonが出ている場合にbuttonを消す

    metaname = name.options[name.selectedIndex].value; // check_metadataに受け渡すために変数に格納
    tag_list.selectedIndex = 1; // セレクトメニューの更新

    check_action_disp();
  }
}


// 法造データで定義づけられている，記述の推奨を表示する
// 引数のid：既にスレッドが作成されている場合のスレッドID
function check_action_disp(id){

  HozoDataGet();

  documentation_support_area.value = metaname + "の内容を記述しました";

  // スロット数で全検索
  for(var i=0; i<$slot_tag.length; i++){
    // role＝出力の値にmetaname（メタ認知知識）を持つスロットを探索
    if($slot_tag[i].getAttribute('role') == "出力" && $slot_tag[i].getAttribute('class_constraint') == metaname){
      slot_id = $slot_tag[i].getAttribute('id'); // 見つけたスロットのidを変数に格納
      // idがslot_idのスロットを持つ概念を検索
      for(var j=0; j<$concept_tag_slot.length; j++){
        // 発見した概念が持つスロットを全検索
        for(var k=0; k<$concept_tag_slot[j].length; k++){
          if($concept_tag_slot[j][k].getAttribute('id') == slot_id && $concept_tag_slot[j][k].getAttribute('class_constraint') == metaname){
            for(var l=0; l<$concept_tag_slot[j].length; l++){
              //metaname以外のスロット（＝入力）を得る
              if($concept_tag_slot[j][l].getAttribute('class_constraint') != metaname){
                // input_name配列に格納
                input_name.push($concept_tag_slot[j][l].getAttribute('class_constraint'));
              }
            }
          }
        }
      }
    }
  }
  // console.log(input_name); // オントロジー上で定義した，選択したメタ認知式を記述する際に，明確にするべき入力情報


  let thread_id = id || ""; // すでにスレッドがある場合はそれを引き継ぐ

  if(thread_id == ""){// セレクトボックスから新しくスレッドを作成する場合
    thread_id = CreateThread(metaname, ""); // スレッドの作成
                                                // 親となるスレッドのIDを取得
  }

  documentation_support_area.value = "【" + metaname + "】" + "を記述した背景を記述しましょう";
  var doc_sup = $("#documentation_support_button");
  doc_sup.html("");

  // タグなしの記述エリアを追加する
  // どのスレッドにもこれはつける
  var first_ultag = document.createElement("ul"); // リスト要素の追加

  first_ultag.className = "metalist"; // listのクラス名
  first_ultag.state = "hide";
  first_ultag.setAttribute("thread_id",thread_id); // 各要素の親スレッドのID．探索に使用する
  first_ultag.setAttribute("value",""); // 各要素の値．探索に使用する
  first_ultag.setAttribute("switch",false);
  documentation_support_button.appendChild(first_ultag);

  // リストの各要素の先頭にある矢印マークの追加
  var imgtag = document.createElement("img");
  imgtag.src = "image/list6.png";
  imgtag.style.width = 15;
  imgtag.style.height = 15;
  first_ultag.appendChild(imgtag);

  // リンクの追加
  // Clickするとadd_meta_node関数が走る
  var atag = document.createElement("a");
  atag.href = "javascript:void(0);"; // ブラウザの再読み込みをなしにする
  atag.id = "";
  atag.onclick = AddStatement; //AddStatement()みたいな，（）をつけた引数を取る形に書くと挙動がバグるかも？
  atag.innerHTML = "新規作成";
  first_ultag.appendChild(atag);

  // 法造で記述すべき「入力」が定義されている場合
  for(var i=0; i<input_name.length; i++){
    var ultag = document.createElement("ul"); // リスト要素の追加

    ultag.className = "metalist"; // listのクラス名
    ultag.state = "hide";
    ultag.setAttribute("thread_id",thread_id); // 各要素の親スレッドのID．探索に使用する
    ultag.setAttribute("value",input_name[i]); // 各要素の値．探索に使用する
    ultag.setAttribute("switch",false);
    documentation_support_button.appendChild(ultag);

    // リストの各要素の先頭にある矢印マークの追加
    var imgtag = document.createElement("img");
    imgtag.src = "image/list6.png";
    imgtag.style.width = 15;
    imgtag.style.height = 15;
    ultag.appendChild(imgtag);

    // リンクの追加
    // Clickするとadd_meta_node関数が走る
    var atag = document.createElement("a");
    atag.href = "javascript:void(0);"; // ブラウザの再読み込みをなしにする
    atag.id = "";
    atag.onclick = AddStatement; //AddStatement()みたいな，（）をつけた引数を取る形に書くと挙動がバグるかも？
    atag.innerHTML = input_name[i] + "を記述する";
    ultag.appendChild(atag);
  }
  input_name = [];　// リスト要素のリセット
}



//　オリジナルのスレッドを作成する関数
// 引数説明　meta:メタ認知的知識　topic:記述内容 id:選択したノードID
function CreateThread(meta, topic, id){

  // メタ認知的知識を引数に持つ場合
  if(meta != null || ""){
    metaname = meta;
  }
  var statement = topic || "";  // テキストボックスに入れる文字列を格納する変数

  var node_id = null;
  // もしノードを選択して作られたスレッドなら
  if(id != null){
    var jmnode = document.getElementsByTagName("jmnode");
    for(var i=0; i<jmnode.length; i++){
      if(jmnode[i].getAttribute('nodeid') == id){
        var node_id = id;
      }
    }
  }

  var uuid = getUniqueStr(); // Threadのidをランダム生成
  var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった
  let selected_node = CheckSelectedNode(); // 現在選択されているノードのチェック
  let area = $("#document_area");

  let label = "<div class='thread' id='"+uuid+"' value='"+metaname+"' node_id='"+node_id+"' style='background-color:#FFCC00; padding:10px; margin-top:10px; margin-bottom:10px' >"+
                 "<div class='purpose' style='margin-bottom:10px;'>"+
                    "<label id='action_label' style='font-size:30px; font-weight:bold; vertical-align:top; height:auto;'>【"+metaname+"】</label>"+
                    "<textarea class='statement' autocomplete='off' onFocus='TextboxClick()' style='vertical-align:bottom; width:auto; height:auto; font-size:30px; padding-top:0px; padding-bottom:0px;'>"+statement+"</textarea>"+
                    "<input type='button' value='×' onclick='RemoveThread("+quot_uuid+");' style='width:30px; height:30px; font-size:50px; float:right;'>"+
                 "</div>"+
              "</div>";

  area.append(label);

  // テキストボックスの大きさを自動調節する設定
  // labelのstatementクラスが本関数内で定義されているので，ここで呼び出すしかない
  $(function(){
   $('.statement').autosize();
   $('.statement').css('height', '50px');
 });

 // ドラッグでの入れ替えをつける
 // ここではスレッド間の入れ替えを許可
 new Sortable(document_area, {
   group:'nested',
   animation:150,
   ghostClass: "sortable-ghost",
 });

 return uuid; // 作成したID（スレッドのID)を返す
}


// 各スレッドに要素を追加する関数
function AddStatement(){
  // リスト（表示されているボタン）のどれかがクリックされたら
  $('.metalist').on('click', function(){
    $('.metalist').off('click'); // イベントの重複登録を回避
    var value = this.getAttribute('value'); // クリックした要素の値
    var thread_id = this.getAttribute('thread_id'); // 探索のためにthread_idの値を取得
    var thread = $('#'+thread_id); // 親となるスレッドのIDを取得
    var uuid = getUniqueStr(); // 追加要素のIDを取得
    var quot_uuid = "\"" + uuid + "\"";

    // valueがある＝資料内の要素の場合
    if(value != ""){
    var message = "<div class='contents nested-sortable'>"+
                    "<div class='thread-contents' id='"+uuid+"' style='margin-bottom:10px; padding-left:50px;'>"+
                      "<div class='message'>"+
                          "<label>\t【"+value+"】</label>"+
                          "<textarea class='statement' autocomplete='off' onFocus='TextboxClick()' style='vertical-align:top; width:auto; height:auto; font-size:30px; padding-top:0px; padding-bottom:0px;'value=''></textarea>"+
                          "<input type='button' value='×' onclick='RemoveThread("+quot_uuid+");' style='vertical-align:top;'>"+
                      "</div>"+
                    "</div>"+
                  "</div>";
    }
    // valueがなし＝議論目的の場合
    if(value == ""){
      var message = "<div class='contents nested-sortable'>"+
                      "<div class='thread-contents' id='"+uuid+"' style='margin-bottom:10px; padding-left:50px;'>"+
                        "<div class='message'>"+
                            // "<label>\t【"+value+"】</label>"+
                            "<textarea class='statement' autocomplete='off' onFocus='TextboxClick()' style='vertical-align:top; width:auto; height:auto; font-size:30px; padding-top:0px; padding-bottom:0px; margin-left:100px;'></textarea>"+
                            "<input type='button' value='×' onclick='RemoveThread("+quot_uuid+");' style='vertical-align:top;'>"+
                        "</div>"+
                      "</div>"+
                    "</div>";
    }


    thread.append(message);

    $(function(){
     $('.statement').autosize();
    });

    // 資料要素内のメッセージでドラッグによる入れ替えを許可する
    var nestedSortables = [].slice.call(document.querySelectorAll('.nested-sortable'));
    for (var i = 0; i < nestedSortables.length; i++) {
    	new Sortable(nestedSortables[i], {
    		group: 'contents',
    		animation: 150,
        ghostClass: "sortable-ghost",
    	});
    }
  });
}

// 議論目的の追加関数
function AddMeetingPurpose(){

    var purpose = $('#document_title'); // 親となるスレッドのIDを取得
    var uuid = getUniqueStr(); // 追加要素のIDを取得
    var quot_uuid = "\"" + uuid + "\"";

    var next = "<div class='document_purpose' id='"+uuid+"'>"+
                   "<textarea class='statement' autocomplete='off' onFocus='TextboxClick()'autocomplete='off' style='width:400px; height:50px; font-size:20px; padding-top:0px; padding-bottom:0px; margin-left:30px;'></textarea>"+
                   "<input type='button' value='×' onclick=RemoveThread("+quot_uuid+")>"+
               "</div>";

    purpose.append(next);

    $(function(){
     $('.statement').autosize();
   });

}





// マインドマップ上のノードを選択した状態で右クリックすると文書に反映する関数
function SetPurpose(data){

  let selected_node = CheckSelectedNode();
  if(selected_node == null || selected_node.topic == undefined){
   documentation_support_area.value = "ノードを選択してください";
   tag_list.selectedIndex = 0; // セレクトメニューのリセット
   var doc_sup = $("#documentation_support_button");
   doc_sup.html("");
   return;

 }else{
   CreateThread(data, selected_node.topic, selected_node.id);
   documentation_support_area.value = selected_node.topic + "\nこのノード内容に対してどのような行為を行いますか？";
   tag_list.selectedIndex = 1; // セレクトメニューの更新
 }
}



// テキストエリア内の選択範囲の内容をノードとして追加する関数
function SelecttextToNode() {

  var selObj = window.getSelection(); // 選択範囲をselection型で取得
  var selectedText = selObj.toString(); // text型へ変換

  // 選択していない　もしくは　空白を含め１文字以下しか選択していない
  if(selectedText == "" || selectedText == null || selectedText.length <= 1){
    documentation_support_area.value = "マインドマップに反映する内容をドラッグで選択してください";
    return;
  }else{
    AddOriginalNode(selectedText, "answer");
  }
}


// オリジナルのタグを持つスレッドを作成する
function CreateOriginalThread(){

  let selected_node = CheckSelectedNode();
  if(selected_node == null || selected_node.topic == undefined){
   documentation_support_area.value = "ノードを選択してください";
   tag_list.selectedIndex = 0; // セレクトメニューのリセット
   var doc_sup = $("#documentation_support_button");
   doc_sup.html("");
   return;

  }else{
    documentation_support_area.value = "このノード内容の指針を記述しましょう";
    tag_list.selectedIndex = 1; // セレクトメニューの更新

    metaname = "";
    var uuid = getUniqueStr(); // Threadのidをランダム生成
    var quot_uuid = "\"" + uuid + "\"";
    let area = $("#document_area");
    var statement = selected_node.topic;  // テキストボックスに入れる文字列を格納する変数

    let label = "<div class='thread' id='"+uuid+"' value='"+metaname+"' "+
                "style='background-color:#FFCC00; padding:10px; margin-top:10px; margin-bottom:10px;' >"+
                   "<div class='purpose' style='margin-bottom:10px;'>"+
                      "<textarea class='statement' onFocus='TextboxClick()' style='width:100px; height:50px; font-size:20px; vertical-align:top; padding-top:0px; margin-left:20px;'></textarea>"+
                      "<textarea class='statement' autocomplete='off' onFocus='TextboxClick()'"+
                      "style='width:auto; height:50px; font-size:20px; padding-top:0px; padding-bottom:0px; margin-left:30px;'>"+
                      statement+
                      "</textarea>"+
                      "<input type='button' value='×' onclick='RemoveThread("+quot_uuid+");' style='width:30px; height:30px; font-size:50px; float:right;'>"+
                   "</div>"+
                "</div>";

    area.append(label);

    $(function(){
     $('.statement').autosize();
     $('.statement').css('height', '30px');
    });
  }
}

// テキストエリア(.statement)が更新されるたびに，value値として記述内容を保存
$(document).on("change", ".statement", function(){
  var str = "";
  str = $(this).val();
  $(this).attr('value', str);
});


// textareaの内容をテキストファイルを出力する
// 拡張子はtxt，中身はHTML形式で，クライアント側に保存
function OutputFile(){

  var result = window.confirm('現在の資料情報を出力しますか？');
  if(result == true){ // OKが押されたら
    var html = $('#document_area').html();

    $.ajax({
      url: "php/create_document.php", // ファイル名をつける
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
      // var textarea = span.getElementsByClassName("statement");
      // for(var i=0; i<textarea.length; i++){
      //   $(textarea[i]).val(textarea[i].getAttribute("value"));
      // }

      
      area.append(span); //bodyに追加






      // $(function(){
      //  $('.statement').autosize();
      // });

      // new Sortable(rebuild, {
      //   group:'nested',
      //   animation:150,
      //   ghostClass: "sortable-ghost",
      // });

  //     // Nested
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


// let i_btn = document.getElementById("input_file");

// i_btn.addEventListener("click", function(){

//   $("#rebuild").children().addBack().contents().each(function(){
       
//     if (this.nodeType == 3) {
//      var $this = $(this);
     
//         $this.replaceWith($this.text().replace(/(\S)/g, "<span class='paper_txt_obj' >$&</span>"));
     
//   }
  
//   });
//   let ptolength=$(".paper_txt_obj").length;
  
//   for(let i=0;i<ptolength;i++){
  
//   $(".paper_txt_obj").eq(i).attr({
//     id: 'p_txt_'+i
//   });
  
//   }
    
// });






// 以下，油谷さんに描いてもらった部分
// 現在は使ってないけど，参考にすることがあるかもなので置いておく

// 孫にすでに共有目的がある場合，クリックで追加できる関数
// 今は共有目的となっているが，これを使い回せば良い
// data1:タグ名　data2:ノード内容
// function AddSharePurpose(data1, data2){
//
//   var UserString = $('#document_area')[0].value;
//
//   // テキストエリアの文字列を１行ごとに確認し，最終行のタブの数＋１個のタブを補完
// 　let splittedDocumentArray = UserString.split("\n");
//   let filteredSplittedDocumentArray = splittedDocumentArray.filter(function(d){
//     if(d!=="") return d;
//   });
//   let last_line_string = filteredSplittedDocumentArray[filteredSplittedDocumentArray.length-1];
//   splitted_last_line_string = last_line_string.split("");
//   let tab_string = "";
//   for(i=0;i<splitted_last_line_string.length;i++){
//     // \tはタブのこと
//     if(splitted_last_line_string[i] === "\t") tab_string += "\t";
//   }
//
//   document_area.value = UserString + tab_string + "\t【"+ data1 +"】" + data2 + "\n";
//   return;
// }
