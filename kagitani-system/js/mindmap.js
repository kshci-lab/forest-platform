//
// jmnodeについて
//
//   var jmnode = document.getElementsByTagName("jmnode");
//   console.log(jmnode);
//
//   で出してもらえれば見えると思いますが，
//   このjmnodeというタグネームは，各ノード１つ１つにつきます．
//   なので，マインドマップを複数出した場合は
//   jmnodeの数が変わります．
//
//   過去のマインドマップを出した場合などで，
//   行いたい操作がなかなか上手くいかない場合は
//   一度彼奴等をご確認ください．
//
//   2019/01/15 松岡

var _jm = null; // jsmind_container
var _jm2 = null; // jsmind_container2
var _jm3 = null; // jsmind_container3
var mind = null; // jsmind_containerの中身

var thisId;
var parent_concept_id;

var $audience_model = 6;//聴衆モデル（教員）のコンセプトID
var $goal = [];//学習者が選択した聴衆の観点のテキストの配列
var $sub_goal = [];//学習者が選択した聴衆の観点（その他）のテキストの配列
var $add_goal = [];//学習者が自由記述で追加した聴衆の観点のテキスト

var BeforeSelectModeNumber = 0;

function open_empty(){

    var options = {
        container:'jsmind_container',
        // theme:'nephrite',
        editable:true
    }

    _jm = new jsMind(options);
    _jm.show();

}

open_empty();

// クリックしたノードのIDをとってくる関数
function get_selected_nodeid(){
    var selected_node = _jm.get_selected_node();
    if(!!selected_node){
        return selected_node.id;
    
    }else{
        return null;
        
    }
}

// 思考表出マップにノードを表示
// この関数が動くのはadd_node.js
// 引数の情報はadd_node.js内でノードを全検索している
// 引数strはcontentのこと＝ノードに記述してある内容のこと
function show_node(id,pid,str,cid,type,cname){

    var i;
    //add_nodeでデータを格納
    var node = _jm.add_node(pid,id,str);

    var jmnode = document.getElementsByTagName("jmnode");

    for(i=0; i<jmnode.length; i++){

        if(id == jmnode[i].getAttribute("nodeid")){

            jmnode[i].setAttribute("concept_id",cid);
            jmnode[i].setAttribute("type",type);
            jmnode[i].className = cname;
            jmnode[i].setAttribute("parent_id",pid);

        }

    }

}

// $(document).on('blur', '.text_border', function(){
//   var dom = this;
//   var value = this.value;
//   var dom_span = this.previousElementSibling;
//   $(dom).toggle(1);
//   $(dom_span).toggle(1);
//
//   // シナリオ上にある同じノードIDを持つコンテンツに変更内容を反映
//   const span_id = dom_span.getAttribute("node_id");
//   console.log(span_id);
//   if(span_id){//node_idを持つコンテンツであった場合
//     const cspan = document.getElementsByClassName("cspan");
//     for(i=0; i<cspan.length; i++){
//       if(cspan[i].getAttribute("node_id") == span_id){
//         cspan[i].innerHTML = value;
//         cspan[i].nextElementSibling.value = value;
//         console.log(cspan[i].parentNode.id);
//         Edit_save(cspan[i].nextElementSibling, cspan[i].parentNode.id)
//       }
//     }
//     //マインドマップ側のノードに変更内容を反映
//     const jm_dom = document.getElementsByTagName("jmnode");
//     for(i=0; i<jm_dom.length; i++){
//       if(jm_dom[i].getAttribute("nodeid") == span_id){
//         jm_dom[i].innerHTML = value;
//         _jm.resize();
//       }
//     }
//   }
//
// });


//node_type_idを取得する関数
async function get_Typeid(class_name, type_name) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: "php/get_Typeid.php",
      type: "POST",
      data: { class: class_name, type: type_name },
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
}

//問い一覧から問いを選択し，マップに追加
async function add_node(){

    //マップ上に新しく追加した問いノードの親ノード情報取得
    var parent_node = _jm.get_selected_node();

    //マップ上に新しく追加した問いノードの親ノードのID取得
    for(key in parent_node){
        if(key == "id"){

            parent_id = parent_node[key];

        }

    }

    //マップ上に新しく追加した問いノードのID生成
    thisId = jsMind.util.uuid.newid();
    var versionid = jsMind.util.uuid.newid(); //hatakeyama

    //マップ上に新しく追加した問いノードの内容取得
    var toiId = document.getElementById(this.id);
    var topic = toiId.innerHTML;

    //マップ上に問いノード追加
    //jsmind.jsのadd_node関数
    var node = _jm.add_node(parent_node, thisId, topic);

    //問い一覧から選択した問いの概念ID取得
    parent_concept_id = this.parentNode.className;

    //XMLデータを取得して問いを絞って提示
    choose_xmlLoad();

    //問いノードのnode_type_idを取得
    try {
      var type_name = "toi";
      // get_typeid の非同期処理が完了するまで待つ
      var node_type_id = await get_Typeid("", type_name);
    } catch (error) {
      console.log("エラーが発生しました:", error);
    }

    //マップ上の問いノードに問い概念ID,type（問いか答えか）,親ノードIDを挿入
    var jmnode = document.getElementsByTagName("jmnode");

    for(var i=0; i<jmnode.length; i++){

        if(jmnode[i].getAttribute("nodeid") == thisId){

            jmnode[i].setAttribute("concept_id",parent_concept_id);
            jmnode[i].setAttribute("type","toi");
            jmnode[i].setAttribute("parent_id",parent_id);

        }

    }

    //合理性を問う問いを選択した場合，合理性を考えるために選択したマップ上のノードをDBに格納
    //インタフェースに依存した方法で実現していて，ノードの背景がピンク色のものを取得してDBに格納している
    if(this.id == "1519483811401_n426"){

        for(var j=0; j<jmnode.length; j++){

            if(jmnode[j].style.backgroundColor == "rgb(255, 105, 180)"){

                $.ajax({

                    url: "php/insert_node.php",
                    type: "POST",
                    data: { insert : "rationality",
                            rationality_id : thisId,
                            node_id : jmnode[j].getAttribute("nodeid") }

                });

            }

        }

    }

    //DBに追加した問いのノード情報を格納
    for(var i=0; i<jmnode.length; i++){

        if(thisId == jmnode[i].getAttribute("nodeid")){

            $.ajax({

                url: "php/insert_node.php",
                type: "POST",
                data: { insert : "node",
                        id : thisId,
                        parent_id : parent_id,
                        type : node_type_id['node_type_id'],
                        concept_id : jmnode[i].getAttribute("concept_id"),
                        x : jmnode[i].style.left,
                        y : jmnode[i].style.top,
                        content : jmnode[i].innerHTML
                      },
                      success:function(result){
                        if(result){ console.log(result);}
                      },
                      error: function(error) {
                        console.log("エラー:", error);
                        reject(error);
                      }
            });

            // hatakeyama 用意された問いを追加
            // NodeInsert(
            //   versionid, 
            //   thisId, 
            //   parent_id, 
            //   jmnode[i].innerHTML, 
            //   "",
            //   "add_prepared_question"
            // );
            RecordRelation(2);   //relationテーブル
            //ここから大槻修正
            $("#reason").html("");
            //ここまで大槻修正
            check_edit_reason(thisId);
            $('#comment_balloon').hide();
            $('#comment_balloon').fadeIn(1000);



            //yoshioka登録　システムが用意した問いを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(thisId,
                              parent_id,
                              "add",
                              "New Node",
                              jmnode[i].getAttribute("concept_id"),
                              "prepared_question",
                              jsMind.util.uuid.newid()
                             );

             Record_activities(thisId,
                                parent_id,
                                "edit",
                                jmnode[i].innerHTML,
                                jmnode[i].getAttribute("concept_id"),
                                "prepared_question",
                                jsMind.util.uuid.newid()
                               );

        }

    }

    //マップ編集時間更新
    $.ajax({

        url: "php/update_node.php",
        type: "POST",
        data: { update : "map" }

    });

}

//問いノード追加ボタンで問いノードを追加する
async function add_Qnode(){

    var parent_node = _jm.get_selected_node();

    for(key in parent_node){

        if(key == "id"){

            var parent_id = parent_node[key];

        }

    }

    var nodeid = jsMind.util.uuid.newid();//idの生成
    var versionid = jsMind.util.uuid.newid(); //hatakeyama
    var topic = 'New Node';
    var node = _jm.add_node(parent_node, nodeid, topic);

    //問いノードのnode_type_idを取得
    try {
      var type_name = "toi";
      // get_typeid の非同期処理が完了するまで待つ
      var node_type_id = await get_Typeid("", type_name);
    } catch (error) {
      console.log("エラーが発生しました:", error);
    }

    var jmnode = document.getElementsByTagName("jmnode");

    for(var i=0; i<jmnode.length; i++){

        if(nodeid == jmnode[i].getAttribute("nodeid")){

            jmnode[i].setAttribute("concept_id","");
            jmnode[i].setAttribute("type","toi");
            jmnode[i].setAttribute("parent_id",parent_id);
            jmnode[i].className = "";

            $.ajax({
              url: "php/insert_node.php",
              type: "POST",
              data: { insert : "node",
                      id : nodeid,
                      parent_id : parent_id,
                      type : node_type_id['node_type_id'],
                      concept_id : jmnode[i].getAttribute("concept_id"),
                      x : jmnode[i].style.left,
                      y : jmnode[i].style.top,
                      content : jmnode[i].innerHTML
                    },
              success:function(result){
                if(result){ console.log(result);}
              },
              error: function(error) {
                console.log("エラー:", error);
                reject(error);
              }
            });

            // hatakeyama 「問いノード追加」ボタン
            // NodeInsert(
            //   versionid, 
            //   nodeid, 
            //   parent_id, 
            //   jmnode[i].innerHTML, 
            //   "",
            //   "add_new_node"
            // );
            RecordRelation(2);
            //ここから大槻修正
            $("#reason").html("");
            //ここまで大槻修正
            check_edit_reason(nodeid);
            $('#comment_balloon').hide();
            $('#comment_balloon').fadeIn(1000);        

            //yoshioka登録　追加ボタンより自作の問いを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(nodeid,
                              parent_id,
                              "add",
                              jmnode[i].innerHTML,
                              jmnode[i].getAttribute("concept_id"),
                              "question",
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

//問いノードのショートカット
$(window).keydown(function(e){

    if(event.shiftKey){
      //Qキー：81
      if(e.keyCode === 81){

        add_Qnode();

        return false;
      }

    }

});

//答えノード追加ボタンで答えノードを追加する
async function add_Anode(){

    var selected_node = _jm.get_selected_node();

    for(key in selected_node){

        if(key == "id"){

            var parent_id = selected_node[key];

        }

    }

    var nodeid = jsMind.util.uuid.newid();//idの生成
    var versionid = jsMind.util.uuid.newid(); //hatakeyama
    var topic = 'New Node';
    var node = _jm.add_node(selected_node, nodeid, topic);

    //ノードのnode_type_idを取得
    try {
      var type_name = "answer";
      // get_typeid の非同期処理が完了するまで待つ
      var node_type_id = await get_Typeid("", type_name);
    } catch (error) {
      console.log("エラーが発生しました:", error);
    }

    var jmnode = document.getElementsByTagName("jmnode");

    for(var i=0; i<jmnode.length; i++){

        if(parent_id == jmnode[i].getAttribute("nodeid")){

            var p_concept = jmnode[i].getAttribute("concept_id");

        }

    }

    for(var j=0; j<jmnode.length; j++){

        if(nodeid == jmnode[j].getAttribute("nodeid")){

            jmnode[j].setAttribute("concept_id",p_concept);
            jmnode[j].setAttribute("type","answer");
            jmnode[j].setAttribute("parent_id",parent_id);

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
                      content : jmnode[j].innerHTML
                    },
                    success:function(result){
                      if(result){ console.log(result);}
                    },
                    error: function(error) {
                      console.log("エラー:", error);
                      reject(error);
                    }
            });

            // hatakeyama 「答えノード追加」ボタン
            // NodeInsert(
            //   versionid, 
            //   nodeid, 
            //   parent_id, 
            //   jmnode[j].innerHTML, 
            //   "",
            //   "add_new_node"
            // );
            RecordRelation(2);   //relationテーブル
            //ここから大槻修正
            $("#reason").html("");
            //ここまで大槻修正
            check_edit_reason(nodeid);
            $('#comment_balloon').hide();
            $('#comment_balloon').fadeIn(1000);


            //yoshioka登録　追加ボタンより答えを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(nodeid,
                              parent_id,
                              "add",
                              jmnode[j].innerHTML,
                              p_concept,
                              "answer",
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

function add_Confirm(){
  var dom_all = document.getElementsByClassName("cspan");
  let span_count = 0;
  for(var i=0; i<dom_all.length; i++){
    if(dom_all[i].style.border == "2px solid gray"){
      var dom_target = dom_all[i];
      console.log(dom_target);
      span_count++;
      break;
    }
  }
  let selected_node = _jm.get_selected_node();
  console.log(selected_node);
  if(!(selected_node) && span_count == 0){
    window.alert('スライド側のノードとマインドマップ側のノードが選択されていません．');
  }else if(!(selected_node)){
    window.alert('マインドマップ側のノードが選択されていません．');
  }else if(span_count == 0){
    window.alert('スライド側のノードが選択されていません．');
  }else{
    if(!(dom_target.getAttribute("data-node_id"))){
      add_Pnode(dom_target);
    }else{
      window.alert('このノードは既にマインドマップにあるため，反映できません');
    }
  }
}



async function add_Pnode(dom_target){//マップへ反映ボタンでノードを追加する

  var p_content = dom_target.innerHTML;
  // console.log(dom_target);
  var p_type = dom_target.getAttribute("type");
  // console.log(p_type);
  var p_concept_id = dom_target.getAttribute("concept_id");
  var toi_type;
  if(p_concept_id === null){
    console.log("nullです");
    p_concept_id = "";
    toi_type = "s_question";
  }else{
    console.log("コンセプトIDあります");
    toi_type = "s_prepared_question";
  }

  //問いノードのnode_type_idを取得
  try {
    var type_name = p_type;
    // get_typeid の非同期処理が完了するまで待つ
    var node_type_id = await get_Typeid("", type_name);
  } catch (error) {
    console.log("エラーが発生しました:", error);
  }


  if(p_type == 'answer'){//答えの場合
          var selected_node = _jm.get_selected_node();

          for(key in selected_node){
              if(key == "id"){
                  var parent_id = selected_node[key];
              }
          }

          var nodeid = jsMind.util.uuid.newid();//idの生成
          var versionid = jsMind.util.uuid.newid(); //hatakeyama
          var topic = p_content;
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
                  jmnode[j].setAttribute("type","answer");
                  jmnode[j].setAttribute("parent_id",parent_id);

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
                            content : jmnode[j].innerHTML
                          },
                    success:function(result){
                      if(result){ console.log(result);}
                    },
                    error: function(error) {
                      console.log("エラー:", error);
                      reject(error);
                    }
                  });
                  //yoshioka登録　追加ボタンより答えを追加したこと
                  //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
                  Record_activities(nodeid,
                                    parent_id,
                                    "add",
                                    jmnode[j].innerHTML,
                                    p_concept,
                                    "s_answer",
                                    jsMind.util.uuid.newid()
                                   );
              }
          }
          $.ajax({
              url: "php/update_node.php",
              type: "POST",
              data: { update : "map" }
          });
          dom_target.setAttribute("node_id", nodeid);
          var thread_id = dom_target.parentNode.parentNode.parentNode.id;
          var arr = $('#'+thread_id).data('node_id');
          console.log(arr);
          arr.push(nodeid);
          console.log(arr);
          $('#'+thread_id).data('node_id', arr);

  }else if(p_type == 'toi'){//問いの場合
          var parent_node = _jm.get_selected_node();
          for(key in parent_node){
              if(key == "id"){
                  var parent_id = parent_node[key];
              }
          }
          var nodeid = jsMind.util.uuid.newid();//idの生成
          var versionid = jsMind.util.uuid.newid(); //hatakeyama
          var topic = p_content;
          var node = _jm.add_node(parent_node, nodeid, topic);
          var jmnode = document.getElementsByTagName("jmnode");



          for(var i=0; i<jmnode.length; i++){
              if(nodeid == jmnode[i].getAttribute("nodeid")){
                  jmnode[i].setAttribute("concept_id",p_concept_id);
                  jmnode[i].setAttribute("type","toi");
                  jmnode[i].setAttribute("parent_id",parent_id);
                  jmnode[i].className = "";
                  $.ajax({
                    url: "php/insert_node.php",
                    type: "POST",
                    data: { insert : "node",
                            id : nodeid,
                            parent_id : parent_id,
                            type : node_type_id['node_type_id'],
                            concept_id : p_concept_id,
                            x : jmnode[i].style.left,
                            y : jmnode[i].style.top,
                            content : jmnode[i].innerHTML
                          },
                    success:function(result){
                      if(result){ console.log(result);}
                    },
                    error: function(error) {
                      console.log("エラー:", error);
                      reject(error);
                    }
                  });
                  //yoshioka登録　追加ボタンより自作の問いを追加したこと
                  //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
                  Record_activities(nodeid,
                                    parent_id,
                                    "add",
                                    jmnode[i].innerHTML,
                                    jmnode[i].getAttribute("concept_id"),
                                    toi_type,
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
  dom_target.setAttribute("data-node_id", nodeid);
  Edit_save(dom_target, dom_target.id)
  var thread_id = dom_target.parentNode.parentNode.parentNode.id;
  var arr = $('#'+thread_id).data('data-node_id');
  arr.push(nodeid);
  $('#'+thread_id).data('data-node_id', arr);
  // Record_rank();
}

async function add_Label(node_type){

  if(node_type=="primary_label"){
    try {
        // get_typeid の非同期処理が完了するまで待つ
        var node_type_id = await get_Typeid(node_type, "pl_0");
      } catch (error) {
        console.log("エラーが発生しました:", error);
      }
  }else if(node_type=="issue_label"){
    try {
        // get_typeid の非同期処理が完了するまで待つ
        var node_type_id = await get_Typeid(node_type, "il_non_0");
      } catch (error) {
        console.log("エラーが発生しました:", error);
      }

  }else if(node_type=="consistency_label"){
    try {
        // get_typeid の非同期処理が完了するまで待つ
        var node_type_id = await get_Typeid(node_type, "cl_0");
      } catch (error) {
        console.log("エラーが発生しました:", error);
      }
  }else{
    try {
        // get_typeid の非同期処理が完了するまで待つ
        var node_type_id = await get_Typeid("", node_type);
      } catch (error) {
        console.log("エラーが発生しました:", error);
      }
  }

  var selected_node = _jm.get_selected_node();

  for(key in selected_node){

      if(key == "id"){

          var parent_id = selected_node[key];

      }

  }
  var topic = '<select name="change_labels" id="select_labels"><optgroup label="ラベル付与"><option value="node_labels">ラベル選択</option>          <option value="primary_label">主軸</option><optgroup label="----L主軸"><option value="pl_1">---L有用性</option><option value="pl_2">---L新規性</option> <option value="pl_3">---L信頼性</option><option value="pl_0">---Lその他</option>                   </optgroup>              <option value="issue_label">課題</option> <optgroup label="----L未検討"> <option value="il_non_1">---L語の妥当性</option><option value="il_non_2">---L証拠の十分性</option><option value="il_non_3">---L論理の整合性</option><option value="il_non_0">---Lその他</option><optgroup label="----L再検討"> <option value="il_re_1">---L語の妥当性</option><option value="il_re_2">---L証拠の十分性</option><option value="il_re_3">---L論理の整合性</option><option value="il_re_0">---Lその他</option></optgroup><option value="cl_0">整合性</option></select>';

  var nodeid = jsMind.util.uuid.newid();//idの生成
 
  var node = _jm.add_node(selected_node, nodeid, topic);

  var jmnode = document.getElementsByTagName("jmnode");

  for(var i=0; i<jmnode.length; i++){

      if(parent_id == jmnode[i].getAttribute("nodeid")){

          var concept = jmnode[i].getAttribute("concept_id");

      }

  }
  change_select_Nlabel("add", nodeid);

  for(var j=0; j<jmnode.length; j++){

      if(nodeid == jmnode[j].getAttribute("nodeid")){

          jmnode[j].setAttribute("concept_id",concept);
          jmnode[j].setAttribute("parent_id",parent_id);

          if(node_type=="primary_label"){
            jmnode[j].setAttribute("class", node_type);
            jmnode[j].setAttribute("type", "pl_0");
          }else if(node_type=="issue_label"){
            jmnode[j].setAttribute("class",node_type);
            jmnode[j].setAttribute("type","il_non_0");
          }else if(node_type=="consistency_label"){
            jmnode[j].setAttribute("class",node_type);
            jmnode[j].setAttribute("type", "cl_0");
          }else{
            jmnode[j].setAttribute("class","");
            jmnode[j].setAttribute("type",node_type);
          }

          console.log(node_type_id['node_type_id']);
          $.ajax({

              url: "php/insert_node.php",
              type: "POST",
              data: { insert : "node",
                      id : nodeid,
                      parent_id : parent_id,
                      type : node_type_id['node_type_id'],
                      concept_id : concept,
                      x : jmnode[j].style.left,
                      y : jmnode[j].style.top,
                      content : jmnode[j].innerHTML,
                  },
                  success:function(result){
                    if(result){ console.log(result);}
                  },
                  error: function(error) {
                    console.log("エラー:", error);
                  }

          });
      }
  }

  $.ajax({

      url: "php/update_node.php",
      type: "POST",
      data: { update : "map" }

  });

}

//ノード削除
function remove_node(){

    var selected_id = get_selected_nodeid();

    //yoshioka登録　システムが用意した問いを追加したこと
   //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
   Record_activities(selected_id,
                     Get_NodeInfo(selected_id, "parent_id"),
                     "delete",
                     "",
                     Get_NodeInfo(selected_id, "concept_id"), //concept_idを取得
                     Get_NodeInfo(selected_id, "type"), //ノードタイプを取得
                     jsMind.util.uuid.newid()
                    );



    _jm.remove_node(selected_id);

    //ノードを消した時にDBのdeletedをtrueに変更
    $.ajax({
        url: "php/update_node.php",
        type: "POST",
        data: { update : "delete",
                id : selected_id 
              },
              success:function(result){
                  if(result){ console.log(result);}
              },
    });

    //hatakeyama ノード削除
    // var versionid = jsMind.util.uuid.newid(); //hatakeyama
    // GetSelectedNodeVersion(selected_id).then(function (res) {
    //   const parse = JSON.parse(res)

    //   $.ajax({

    //     url: "php/version_update.php",
    //     type: "POST",
    //     data: { data : "delete",
    //             node_id : selected_id,
    //             parent_node_id : Get_NodeInfo(selected_id, "parent_id"),
    //             node_version_id_update : parse[0],   //最新version_id
    //             node_version_id_insert : versionid   //新しく追加するversion_id
    //           }
    //   });

    // });
    RecordRelation(2);   //relationテーブル
    $('#comment_balloon').hide();
    $('#comment_balloon').fadeIn(1000);
    

    $.ajax({
        url: "php/update_node.php",
        type: "POST",
        data: { update : "map" }
    });

}

var rationality_mode = false;

//合理性の問いをクリックした時に，マップ上のどのノード間の合理性を考えたのかをハイライトする
//yoshioka バグ？
function checkRationality(nodeid){

    $.ajax({

        url: "php/get_data.php",
        type: "POST",
        data: { val : "rationality",
                rationality_id : nodeid, },
        success: function(arr){

            var parse = JSON.parse(arr);

            var jmnode = document.getElementsByTagName("jmnode");

            for(i=0; i<parse.length; i++){

                for(j=0; j<jmnode.length; j++){

                    if(parse[i] == jmnode[j].getAttribute("nodeid")){
                      console.log("成功はしている？");
                      console.log(parse[i]);
                      console.log(jmnode[j]);

                        jmnode[j].style.backgroundColor = "#ff69b4";

                    }

                }

            }

        }

    });

}

//修正理由追加
function add_edit_reason(){

    var reason = document.getElementById("reason");

    $("#reason").html("");

    var textarea = document.createElement("textarea");
    textarea.id = "edit_reason_area";
    textarea.name = "textarea";
    textarea.focus();
    reason.appendChild(textarea);

    var button = document.createElement("button");
    button.className = "button4";
    button.innerHTML = "決定";
    button.onclick = send_reason;
    reason.appendChild(button);

}

//修正理由をDBに格納
function send_reason(){

    var jmnode = document.getElementsByTagName("jmnode");
    var textarea = document.getElementById("edit_reason_area");

    for(var i=0; i<jmnode.length; i++){

        if(jmnode[i].getAttribute("nodeid") == thisId){

            //DBに格納
            $.ajax({

                url: "php/insert_node.php",
                type: "POST",
                data: { insert : "edit_reason",
                        node_id : jmnode[i].getAttribute("nodeid"),
                        content : textarea.value }

            });

            //既にDBにあれば更新
            $.ajax({

                url: "php/update_node.php",
                type: "POST",
                data: { update : "edit_reason",
                        node_id : jmnode[i].getAttribute("nodeid"),
                        content : textarea.value }

            });

            //hatakeyama learnerにver更新理由を入れる
            GetSelectedNodeVersion(thisId).then(function (res) {
              const parse = JSON.parse(res)
                //DBに格納
                  $.ajax({
  
                      url: "php/version_update.php",
                      type: "POST",
                      data: { data : "edit_reason",
                              text : textarea.value,
                              node_version_id : parse[0]   //最新version_id
                            }
                  });
            });
        }
    }
    $("#reason").html("");
    $('#comment_balloon').fadeOut(1000); //理由書いたら吹きだしは消す　hatakeyama

}

//修正理由をDBに格納（マップ） hatakeyama
function send_map_reason(){

  var textarea = document.getElementById("edit_reason_area");
        
      //マップver更新理由をUPDATE
      GetMapVersion().then(function (res) {
        const parse = JSON.parse(res)
          //DBに格納
            $.ajax({

                url: "php/version_update.php",
                type: "POST",
                data: { data : "map_reason",
                        text : textarea.value,
                        map_version_id : parse[0]
                      }
            });
      });
      $('#comment_balloon').fadeOut(1000); //理由書いたら吹きだしは消す
}


//選択したノードが修正理由を記述したことがあるかチェックし、表示
//hatakeyama ノード単位からversion単位に変更
 function check_edit_reason(id){

     $("#reason").html("");
     
      //ノード修正理由があれば取得
      GetNodeReason(id).then(function (res) {
        const parse = JSON.parse(res);
        
        if(Object.keys(parse).length>1){

          var textarea = document.createElement("textarea");
          textarea.id = "edit_reason_area";
          textarea.name = "textarea";
          textarea.innerHTML = parse[0];
          reason.appendChild(textarea);

          var button = document.createElement("button");
          button.className = "button4";
          button.innerHTML = "ノードに追加";
          button.onclick = send_reason;
          reason.appendChild(button);

          var button = document.createElement("button");
          button.className = "button4";
          button.innerHTML = "マップに追加";
          button.onclick = send_map_reason;
          reason.appendChild(button);
        }
      
      });

    //hatakeyama 元のコード
    //  $.ajax({

    //      url: "php/get_data.php",
    //      type: "POST",
    //      data: { val : "edit_reason",
    //              id : id },
    //      success: function(arr){  //arrはnode_id_array（json）

    //          if(arr.length != 2){//2は[]←この2文字 修正理由が既にあれば

    //              var parse = JSON.parse(arr); //parseは編集理由
    //              var textarea = document.createElement("textarea");
    //              textarea.id = "edit_reason_area";
    //              textarea.name = "textarea";
    //              textarea.innerHTML = parse;
    //              reason.appendChild(textarea);

    //              var button = document.createElement("button");
    //              button.className = "button4";
    //              button.innerHTML = "決定";
    //              button.onclick = send_reason;
    //              reason.appendChild(button);

    //          }

    //      }

    //  });
 }

// 選択したノードが修正理由を記述したことがあるかチェック
// function check_edit_reason(id){

//     $("#reason").html("");

//     $.ajax({

//         url: "php/get_data.php",
//         type: "POST",
//         data: { val : "edit_reason",
//                 id : id },
//         success: function(arr){

//             if(arr.length != 2){//2は[]←この2文字

//                 var parse = JSON.parse(arr);

//                 var textarea = document.createElement("textarea");
//                 textarea.id = "textarea";
//                 textarea.name = "textarea";
//                 textarea.innerHTML = parse;
//                 reason.appendChild(textarea);

//                 var button = document.createElement("button");
//                 button.className = "button4";
//                 button.innerHTML = "決定";
//                 button.onclick = send_reason;
//                 reason.appendChild(button);

//             }

//         }

//     });
// }

//拡大・縮小
var zoomInButton = document.getElementById("zoom-in-button");
var zoomOutButton = document.getElementById("zoom-out-button");

function zoomIn() {
    if (_jm.view.zoomIn()) {
        zoomOutButton.disabled = false;
    } else {
        zoomInButton.disabled = true;
    };
};

function zoomOut() {
    if (_jm.view.zoomOut()) {
        zoomInButton.disabled = false;
    } else {
        zoomOutButton.disabled = true;
    };
};

//スクリーンショット機能
function screen_shot(){
    _jm.screenshot.shootDownload();
}

//DBとの接続確認
//とりあえず，ルートノードの情報を投げて，正しく返ってくるかで確認
function save_node(){

    $.ajax({

        url: "php/get_data.php",
        type: "POST",
        data: { val : "node_id",
                node_id : "root"
              },
        success: function(num){

            if(num == "save"){

                alert("正常にDBに接続できています！");

            }else{

                alert("DBに接続できませんでした×");

            }

        }

    });

}

//消したノードを元に戻す
//消した直後の動作だけ
function return_node(){

    $.ajax({

        url: "php/get_data.php",
        type: "POST",
        data: { val : "return",},
        success: function(pid){

            var parse = JSON.parse(pid);

            for(var i=0; i<parse.length; i++){

                $.ajax({

                    url: "php/update_node.php",
                    type: "POST",
                    data: { update : "return",
                            id : parse[i], },

                });

            }

        }

    });

    location.reload();

}


// ================================== matsuoka =======================================

// ------------------------- ブラウザの挙動など ----------------------------

function change_documentation_mode(){
  $('#document').show();
  $('#mind').hide();
}

function change_mindmap_mode(){
  $('#mind').show();
  $('#document').hide();
}

//画面半分にするチェックボックス hatakeyama
function CheckClickVersion(){
  // checkboxの状態を取得
  check = document.getElementById("checkbox_version");
  // checlboxがチェックされている時の処理
  if(check.checked == true){
    console.log("チェック");
    $('#jsmind_container').css('width','40vw');
    $('#mind').css('height','50%');
  }
  else{
    console.log("ノーチェック");
    $('#jsmind_container').show();
    // $('#jsmind_container').css('width','calc(100vw - 350px)');
    $('#jsmind_container').css('width','100%');
    $('#mind').css('height','90%');
  }
}

// 文書化モードを切り替えたときの動作
function CheckClick(){
  // checkboxの状態を取得
  check = document.getElementById("checkbox");
  // checkboxがチェックされている時の処理 → 資料作成モードへの変更
  if(check.checked == true){
    $('#jsmind_container').css('width','50%');//横幅を全体の40％で表示？
    $('#document').show(); //Menu下の目標設定箇所
    $('#mind').css('height','50%');　//問い一覧箇所
    // $('#mind').toggle('fast');
    // $('#document').toggle('fast');
    $('#document_area').css('width','50%');　//資料作成箇所
    $('#document_area').toggle('fast'); //資料作成箇所を表示
    $('#node_slide').toggle('fast');  //
    $('#presen_menu').toggle('fast'); //資料作成用のボタン
    // $('.changemode_button').toggle('fast');
    console.log($audience_model);
    // console.log($goal);
    // console.log($add_goal);
    // if($audience_model == 6){
    //   window.alert("まずは右上のエリアで，発表の場と主題を選択しましょう．また，お手数お掛けしますが画面収録よろしくお願いいたします．");
    // }
  }
  else{
    $('#jsmind_container').show();
    // $('#jsmind_container').css('width','calc(100vw - 350px)');
    $('#jsmind_container').css('width','100%');
    $('#mind').css('height','90%');
    $('#document').hide();
    // $('#mind').show();
    $('#document_area').toggle('fast');
    $('#node_slide').toggle('fast');
    $('#presen_menu').toggle('fast');
    // $('.changemode_button').toggle('fast');
    const frame_dom = document.getElementsByClassName("inquiry_area");
    frame_dom[0].style.border = "solid 5px #ccc";
    showGeneration();
    console.log("log20221008");
  }
}

//202211shimizu マップモードと文書化モードとViewモードの追加
function ModeChangeButtonClick() {
  const selindex = document.target_mode.Select1;
  const num = selindex.selectedIndex;
  var ModeLabel = ["自己内対話モード","資料構成作成モード","資料作成モード","議論内省マップモード"]

  console.log(num);
  console.log(ModeLabel);
  target = document.getElementById("output");

  if (num == 0 ){

    $('#jsmind_container').show();
    // $('#jsmind_container').css('width','calc(100vw - 350px)');
    $('#jsmind_container').css('width','100%');
    $('#mind').css('height','90%');
    $('#document').hide();
    // $('#mind').show();
    if(BeforeSelectModeNumber == 1){
      $('#document_area').toggle('fast');
      $('#node_slide').toggle('fast');
      $('#ImageAddContent').toggle('fast');
      $('#presen_menu').toggle('fast');
      // $('#node_slide').toggle('fast');  
    }else if(BeforeSelectModeNumber == 2){
      $('#document_area').toggle('fast');
      $('#node_slide').toggle('fast');
      $('#ImageAddContent').toggle('fast');
      $('#presen_menu').toggle('fast');
      $('#document_slide').toggle('fast');
      //ここから大槻変更
    }else if(BeforeSelectModeNumber == 3){
      $('#network_container').toggle('fast');
      document.getElementById('feedback_area').style.display = "none";
      document.getElementById('xml_upload_area').style.display = "none";
    }
    //ここまで大槻変更
   
    // $('.changemode_button').toggle('fast');
    const frame_dom = document.getElementsByClassName("inquiry_area");
    frame_dom[0].style.border = "solid 5px #ccc";
    showGeneration();
    BeforeSelectModeNumber = 0;

  }else if(num == 1){

    $('.content_delete').css('visibility', 'visible');
    $('.simple_btn').css('visibility', 'visible');
    $('.cspan').css('font-size', '15');
    $('.cspan').css('border', 'White');
    $('.cspan').css('margin-bottom', '5');
    $('.tspan').css('font-size', '20');
  
    $('.inquiry_area').css('height', '25vw');
    $('#jsmind_container').css('width','50%');//横幅を全体の40％で表示？
    $('#document').show(); //Menu下の目標設定箇所
    $('#mind').css('height','50%');　//問い一覧箇所


    $('#scenario_title').css('margin-left','15px');
    $('#scenario_title').css('width','100%');

    $('#scenario_title').css('border','Black');
    $('#document_area').css('width','(50%-3px)');　//資料作成箇所
    $('#document_area').css('height','100%');
    $('#document_area').css('overflow','scroll');
    // height:84vh;overflow: scroll;

    // $('#document_area').css('width','620px');
    console.log(BeforeSelectModeNumber);
    if(BeforeSelectModeNumber == 0){
      $('#document_area').toggle('fast'); //資料作成箇所を表示
      $('#node_slide').toggle('fast');  //
      $('#ImageAddContent').toggle('fast');
      $('#presen_menu').toggle('fast'); //資料作成用のボタン
    }else if(BeforeSelectModeNumber == 2){
      $('#document_slide').toggle('fast');
      //ここから大槻変更
    }else if(BeforeSelectModeNumber == 3){
      $('#document_area').toggle('fast'); //資料作成箇所を表示
      $('#node_slide').toggle('fast');  //
      $('#ImageAddContent').toggle('fast');
      $('#network_container').toggle('fast');
      document.getElementById('feedback_area').style.display = "none";
      document.getElementById('xml_upload_area').style.display = "none";
    }
    //ここまで大槻変更

    $('.thread').css('border', 'solid 0.7px #000000');
    
    $("select[name='Logic_options_contents']").css('font-size', '15');
    $("select[name='Logic_options_contents']").css('visibility', 'visible');
    $("select[name='Logic_options_contents']").css('height', '20px');

    $("select[name='Logic_options_title']").css('font-size', '15');
    $("select[name='Logic_options_title']").css('visibility', 'visible');
    $("select[name='Logic_options_title']").css('height', '20px');
    // $('.changemode_button').toggle('fast');

    $('.badge').css('visibility', 'visible');
    $('.badge').css('height', '20px');
    $('.badge').css('padding','0.125rem 0.3rem');
    BeforeSelectModeNumber = 1;
    // AddAOI_on_ImageArea();
    MoveAndExpensionImageArea();
  }else if(num == 2 ){
    var text2 = document.getElementsByClassName("cspan");
    // console.log(text2);
    for (var i = 0; i < text2.length; i++){
      // console.log(text2[i].nodeType);
    }
    // $('#document_area').css('width','49%');//資料作成箇所
    // $('#document_area').css('height','100%'); //統合前はauto
    
    $('.content_delete').css('visibility', 'hidden');
    $('.simple_btn').css('visibility', 'hidden');
    $('.thread').css('border','White');
    $('.thread').css('padding','0');
    $('.cspan').css('font-size', '20');
    $('.cspan').css('border', 'White');
    $('.cspan').css('margin-bottom', '0');
    $('.tspan').css('margin-bottom', '0');
    $('.tspan').css('font-size', '20');
    if(BeforeSelectModeNumber == 1){
      $('#document_slide').toggle('fast');
    }else if(BeforeSelectModeNumber == 0){
      $('#document_area').toggle('fast'); //資料作成箇所を表示
      $('#node_slide').toggle('fast');  //
      $('#ImageAddContent').toggle('fast');
      //ここから大槻変更
    }else if(BeforeSelectModeNumber == 3){
      $('#document_area').toggle('fast'); //資料作成箇所を表示
      $('#node_slide').toggle('fast');  //
      $('#ImageAddContent').toggle('fast');
      $('#network_container').toggle('fast');
      document.getElementById('feedback_area').style.display = "none";
      document.getElementById('xml_upload_area').style.display = "none";
    }
    //ここまで大槻変更

    // $('#scenario_title').css('font-size', '30');
    $('#scenario_title').css('border','White');
    $('#scenario_title').css('margin-left','0');
    $('#scenario_title').css('width','100%');
    //$('#jsmind_container').hide();//横幅を無くす
    $('#jsmind_container').css('width','30vw');//横幅を全体の20％で表示？

    $("select[name='Logic_options_contents']").css('font-size', '0.01');
    $("select[name='Logic_options_contents']").css('visibility', 'hidden');
    $("select[name='Logic_options_contents']").css('height', '1px');

    $("select[name='Logic_options_title']").css('font-size', '0.01');
    $("select[name='Logic_options_title']").css('visibility', 'hidden');
    $("select[name='Logic_options_title']").css('height', '2px');
    
    $('.badge').css('visibility', 'hidden');
    $('.badge').css('height', '1px');
    $('.badge').css('padding','0');

    BeforeSelectModeNumber = 2;
    MoveAndExpensionImageArea();
  }else if(num == 3){
    document.getElementById('feedback_area').style.display = "block";
    document.getElementById('xml_upload_area').style.display = "block";
    $('#network_container').toggle('fast');
    $('#network_container').css('display','flex');
    $('#jsmind_container').css('width','50%');
    $('#mind').css('height','90%');
    $('#document').hide();
    // $('#mind').show();
    if(BeforeSelectModeNumber == 1){
      $('#document_area').toggle('fast');
      $('#node_slide').toggle('fast');
      $('#ImageAddContent').toggle('fast');
      $('#presen_menu').toggle('fast');
      // $('#node_slide').toggle('fast');  
    }else if(BeforeSelectModeNumber == 2){
      $('#document_area').toggle('fast');
      $('#node_slide').toggle('fast');
      $('#ImageAddContent').toggle('fast');
      $('#presen_menu').toggle('fast');
      $('#document_slide').toggle('fast');
    }
    const frame_dom = document.getElementsByClassName("inquiry_area");
    frame_dom[0].style.border = "solid 5px #ccc";
    showGeneration();
    BeforeSelectModeNumber = 3;
  }
  jump_node("root");
}

function jump_node(nodeid) {
  // 対象となる要素を取得
  const area = document.getElementById("jsmind_container");
  let elements = area.querySelectorAll("jmnode[nodeid='"+nodeid+"']");
  
  // NodeList を forEach で反復して処理
  elements.forEach(element => {
    console.log(element);
    element.scrollIntoView({ block: "center", inline: "center"});
  });
}


function show_mindmap(){
  $('#jsmind_container').show();
  $('#document_area').css('width','calc(100% - 350px - 40%)');
}

function hide_mindmap(){
  $('#jsmind_container').hide();
  $('#document_area').css('width','calc(100% - 320px)');
}

//スライド（コンテンツ）のバツボタンに付与されてるもの
function RemoveThread(data){
  if(window.confirm('本当にこのスライドを削除しますか？')){
    // console.log(data);
    // console.log(document.getElementById(data));
    var slide_Node = document.getElementById(data).getElementsByClassName('scenario_content')
    for(var nodeCount =0; nodeCount<slide_Node.length; nodeCount++){
      console.log(slide_Node[nodeCount].id);
      var nodeID = slide_Node[nodeCount].id;
      // console.log(nodeID);
      Delete_Document_content(nodeID);
      Delete_document_relation_node(nodeID);

    }
    // console.log(target);
    // Delete_slide(data);
    //2022-12-16 shimizu
    Delete_Document(data);
    Delete_document_relation_slide(data);
    var node_array = $('#'+data).data('node_id');
    // console.log(node_array);

    var jmnode = document.getElementsByTagName("jmnode");
    var arr = $('#'+data).data('node_id');//nodeidの配列
    // console.log(arr);s
    // console.log(arr[0]);

    var delete_topic = [];

    for(m=0; m<arr.length; m++){
      for(i=0; i<jmnode.length; i++){
        if(jmnode[i].getAttribute("nodeid") == arr[m]){//回ってきたidが選択中ノードの時
            delete_topic[m] = jmnode[i].textContent;
            console.log(jmnode[i]);
            console.log(delete_topic[m]);
            break;
        }
      }
    }
    // console.log(delete_topic);
    // console.log($slide_topic);


    for(i=0; i<delete_topic.length; i++){
      for(j=0; j<$slide_topic.length; j++){
        if(delete_topic[i] == $slide_topic[j]){
          $slide_topic.splice(j,1);
          console.log(delete_topic[i]);
          break;
        }
      }
    }
    // console.log($slide_topic);

    $('#'+data).fadeOut('fast').queue(function() {
      $('#'+data).remove();
    });
    // Record_rank();
  }


  // Delete_slide(target);
  // var node_array = $('#'+data).data('node_id');
  // console.log(node_array);
  //
  // var jmnode = document.getElementsByTagName("jmnode");
  // var arr = $('#'+target).data('node_id');//nodeidの配列
  // console.log(arr);
  // console.log(arr[0]);
  //
  // var delete_topic = [];
  //
  // for(m=0; m<arr.length; m++){
  //   for(i=0; i<jmnode.length; i++){
  //     if(jmnode[i].getAttribute("nodeid") == arr[m]){//回ってきたidが選択中ノードの時
  //         delete_topic[m] = jmnode[i].textContent;
  //         console.log(jmnode[i]);
  //         console.log(delete_topic[m]);
  //         break;
  //     }
  //   }
  // }
  // console.log(delete_topic);
  // console.log($slide_topic);
  //
  //
  // for(i=0; i<delete_topic.length; i++){
  //   for(j=0; j<$slide_topic.length; j++){
  //     if(delete_topic[i] == $slide_topic[j]){
  //       $slide_topic.splice(j,1);
  //       console.log(delete_topic[i]);
  //       break;
  //     }
  //   }
  // }
  // console.log($slide_topic);
  //
  // $('#'+data).fadeOut('fast').queue(function() {
  //   $('#'+data).remove();
  // });
}

function RemoveStatement(data){
  $('#'+data).fadeOut('fast').queue(function() {
    $('#'+data).remove();
  });
}

function RemoveAppendNode(data){
  if(window.confirm('本当に削除しますか？')){
    console.log(data);//id
    console.log(document.getElementById(data));
    const tmp_dom = document.getElementById(data).firstElementChild;
    const tmp_id = tmp_dom.getAttribute("node_id");
    if(tmp_id){//node_idをもつコンテンツを削除した場合
      let id_slide = document.getElementById(data).parentNode.parentNode.id;
      let id_array = $("#"+id_slide).data('node_id');
      console.log(tmp_id);
      console.log(id_array);
      for(let i=0; i<id_array.length; i++){
        if(id_array[i] == tmp_id){
          id_array.splice(i,1);
        }
      }
      $("#"+id_slide).data('node_id', id_array);
    }
    $('#'+data).fadeOut('fast').queue(function() {
      $('#'+data).remove();
    });
    console.log(data);
    // Delete_content(data);
    //2022-12-16 shimizu
    Delete_Document_content(data);
    Delete_document_relation_node(data);
    // Record_rank();
  }
}


// 現在のマップを表示する
function ShowCurrentMap(){
  console.log("ShowCurrentMap");
  CopyCurrentMap();
  $('#jsmind_container3').show();
  //ここから大槻修正
  $('#jsmind_container3').css('width','calc(100vw - 350px - 30.5vw)');
  //ここまで大槻修正
  $('#jsmind_container2').css('width','calc(100vw - 350px - 30.5vw)');
}

// 現在のマップを隠す
function HideCurrentMap(){
  $('#jsmind_container3').hide();
  $('#jsmind_container2').css('width','calc(100vw - 350px)');
}

// ポップアップ処理
function OperateDescription() {
  alert("準備中");
    // $('.modal').modaal({
    //   type: 'ajax',	// コンテンツのタイプを指定
    // 	animation_speed: '500', 	// アニメーションのスピードをミリ秒単位で指定
    // 	background: '#fff',	// 背景の色を白に変更
    // 	overlay_opacity: '0.9',	// 背景のオーバーレイの透明度を変更
    // 	fullscreen: 'true',	// フルスクリーンモードにする
    // 	background_scroll: 'true',	// 背景をスクロールさせるか否か
    // 	loading_content: 'Now Loading, Please Wait.'	// 読み込み時のテキスト表示
    // });
}

// ----------------------  ライブラリ・細かな設定 --------------------------------

// オリジナルの右クリックメニュー
window.onload = function(){
  // var doc_area = document.getElementById('document_area');     //対象エリア

  var mm_menu = document.getElementById('mindmap_conmenu');  //独自コンテキストメニュー
  var mm_area = document.getElementById('jsmind_container');     //対象エリア
// 20221208 shimizu
  var dm_menu = document.getElementById('document_area_conmenu'); //関係性を確認するメニュー
  var dm_area = document.getElementById('document_area'); //対象エリア

  var dm_menu2 = document.getElementById('document_area_conmenu2'); //関係性を設定するメニュー
  var dm_menu3 = document.getElementById('document_area_conmenu3'); //関係性を設定するメニュー
  var dm_menu4 = document.getElementById('document_area_conmenu4'); //関係性を設定するメニュー
  var body = document.body;                       //bodyエリア

  // マインドマップ上で右クリック時に独自コンテキストメニューを表示する
  mm_area.addEventListener('contextmenu',function(e){
    mm_menu.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
    mm_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    mm_menu.classList.add('on');
  });

  // 文書化エリアで右クリック時に独自コンテキストメニューを表示する
  dm_area.addEventListener('contextmenu',function(e){
    //2022/12/23 shimizu
    var dom_all = document.getElementsByClassName("cspan");
    var NodeCheckCount = 0;
    var thread_all = document.getElementsByClassName("thread");
    var ThreadCheckCount = 0;

    for(var i=0; i<dom_all.length; i++){
      //選択中のノードを確認
      if(dom_all[i].style.border == "2px solid gray"){
       NodeCheckCount++;
      }
    }

    for(var i=0; i<thread_all.length; i++){
      //選択中のコンテントを確認
      if(thread_all[i].style.border == "5px outset black"){
        ThreadCheckCount++;
      }
    }

    if(NodeCheckCount == 2){
      var ClickNodeLabels = [];
      var dom_all = document.getElementsByClassName("cspan");
      for(var i=0; i<dom_all.length; i++){
        //選択中のノードを確認
        if(dom_all[i].style.border == "2px solid gray"){
          var c_dom_label = dom_all[i].innerHTML;
          ClickNodeLabels.push(c_dom_label);
        }
      }
      var selectContent1 = document.getElementById("SelectContent1_node");
      var selectContent2 = document.getElementById("SelectContent2_node");
      selectContent1.innerHTML = ClickNodeLabels[0];
      selectContent2.innerHTML = ClickNodeLabels[1];

      dm_menu3.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
      dm_menu3.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
      dm_menu3.classList.add('on');
      // dm_menu4.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
      // dm_menu4.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
      // dm_menu4.classList.add('on');
    }else if(ThreadCheckCount == 2){
      var ClickContentLabels = [];
      var thread_all = document.getElementsByClassName("thread");
      for(var i=0; i<thread_all.length; i++){
        //選択中のコンテントを確認
        if(thread_all[i].style.border == "5px outset black"){
          var c_thread_label = thread_all[i].firstElementChild.innerHTML;
          // var c_thread = thread_all[i].getElementsByClassName('tspan');
          // console.log(c_thread);
          // var c_thread_label = c_thread.innerHTML
          // console.log(c_thread_label);
          ClickContentLabels.push(c_thread_label);
        }
      }
      var selectContent1 = document.getElementById("SelectContent1");
      var selectContent2 = document.getElementById("SelectContent2");
      selectContent1.innerHTML = ClickContentLabels[0];
      selectContent2.innerHTML = ClickContentLabels[1];
      // console.log("内容変更");
      // dm_menu3.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
      // dm_menu3.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
      // dm_menu3.classList.add('on');

      dm_menu4.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
      dm_menu4.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
      dm_menu4.classList.add('on');
    }else if(NodeCheckCount ==1 || ThreadCheckCount == 1){
      dm_menu.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
      dm_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
      dm_menu.classList.add('on');
    }

    // console.log("右クリック");
    // dm_menu4.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
    // dm_menu4.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    // dm_menu4.classList.add('on');

  });

  // 左クリック時に独自コンテキストメニューを非表示にする
  body.addEventListener('click',function(){
  //   if(doc_menu.classList.contains('on')){
  //     doc_menu.classList.remove('on');
  //   }
    if(mm_menu.classList.contains('on')){
      mm_menu.classList.remove('on');
    }

    if(dm_menu.classList.contains('on')){
      dm_menu.classList.remove('on');
    }

   
  });

  Rebuild_title();

  // Rebuild().then(() => {

  //   Rebuild_content().then(() => {
  //     SetIndent();
  //   });

  // });

  // Rebuild_title_s();

  Rebuild_s().then(() => {

    Rebuild_content_s().then(() => {
      SetIndent();
    });

  });

}



// --------------------聴衆モデルの設定-----------------------
$(".aradio").on("click", function(){
  $('.aradio').prop('checked', false);  //  全部のチェックを外す
  $(this).prop('checked', true);  //  押したやつだけチェックつける
});

$(document).on("click", ".add", function() {
  let area = $("#input_pluralBox");
  let label = "<form onsubmit='return false;'>"+
                "<div id='input_plural'>"+
                  "<input type='text' class='form-control' placeholder='例：〇〇を示すこと' onfocus='TextboxClick()'>"+
                  "<input type='button' value='－' class='del pluralBtn'>"+
                "</div>"+
              "</form>";
  area.append(label);
});

$(document).on("click", ".del", function() {
    var target = $(this).parent();
    target.remove();
});

function FinalShow(){
  //一度表示していた目標を消す
  console.log($('.final_model'));
  $('.final_model').remove();
  //目標を表示
  for(var i=0; i<$goal.length; i++){
    let area = $("#set_final");
    let label = "<div class='final_model'>"+
                  "● "+
                  ""+$goal[i]+""+
                "</div>";
    area.append(label);
  }
  for(var i=0; i<$sub_goal.length; i++){
    let area = $("#set_final");
    let label = "<div class='final_model'>"+
                  "● "+
                  ""+$sub_goal[i]+""+
                "</div>";
    area.append(label);
  }
  for(var i=0; i<$add_goal.length; i++){
    let area = $("#set_final");
    let label = "<div class='final_model'>"+
                  "● "+
                  ""+$add_goal[i]+""+
                "</div>";
    area.append(label);
  }
}

// function ShowModel(){
//   $('#pre_set').toggle('fast');
//   $('#audi').toggle('fast');
// }

function SetAudience(){
  const audience = document.getElementsByClassName("aradio");
	for (let i=0; i<audience.length; i++){
		if(audience[i].checked){ //(audience[i].checked === true)と同じ
      $audience_model = audience[i].getAttribute("concept_id");
      console.log($audience_model);
		}
	}
  $('#set_audience').toggle(1);
  $('#set_model').toggle(1);
}

function SetModel(){
  const model = document.getElementsByClassName("model");//重視する目標（初期でチェックがついてるやつ）
  console.log(model);
	for (let i=0; i<model.length; i++){
		if(model[i].checked){ //(audience[i].checked === true)と同じ
      $goal.push(model[i].value);
      console.log($goal);
		}
	}
  const sub_model = document.getElementsByClassName("sub_model");//重視する観点とその他（初期でチェックがついていないやつ）
  console.log(sub_model);
	for (let i=0; i<sub_model.length; i++){
		if(sub_model[i].checked){ //(audience[i].checked === true)と同じ
      $sub_goal.push(sub_model[i].value);
      console.log($sub_goal);
		}
	}
  const control = document.getElementsByClassName("form-control");
  console.log(control);
	for (let i=0; i<control.length; i++){
		if(control[i].value != ""){
      $add_goal.push(control[i].value);
      console.log($add_goal);
		}
	}
  console.log($goal, $sub_goal, $add_goal);
  $('#set_model').toggle('fast');//目標設定エリアを非表示
  $('#set_final').toggle('fast');//目標表示エリアを表示
  $('#edit_model').toggle('fast');//編集に戻るボタンを表示するエリア表示
  FinalShow();
}

function Back_Select(){
  e_desire = [];
  e_attribute = [];
  $('#set_model').toggle(1);
  $('#set_audience').toggle(1);
}

function Edit_Model(){
  $goal = [];
  $sub_goal = [];
  $add_goal = [];
  $('#set_final').toggle('fast');
  $('#edit_model').toggle('fast');
  $('#set_model').toggle('fast');
}


var $first_advice_log = [];
var f_advice_log = [];

//目標設定エリアに追加表示，目標設定に関する助言のログを記録
function MoveSecond(){

  Record_Timing("プレゼンの助言提示");//[slide_content_activity]テーブルにプレゼンシナリオの検討を促す助言が提示したタイミングを記録する

  var check = document.getElementsByClassName("f_ad");
  var check_count = 0;
  for(var i=0; i<check.length; i++){
    if(check[i].checked){
      check_count++;
    }
  }
  console.log(check.length);
  console.log(check_count);

  if(check_count < check.length / 2){
    window.alert("必要ある OR 必要ない　のどちらかを選んでください");
  }else{
    let subject_area = $("#set_final");//右上の設定目標表示エリア
    for(var i=0; i<check.length; i++){
      if(check[i].checked && check[i].value=="必要ある"){
        $goal.push(check[i].parentNode.parentNode.getAttribute("concept"));
        console.log(check[i].parentNode.parentNode.getAttribute("concept"));
        $first_advice_log.push(["", check[i].value, ""]);
        let label = "<div class='final_model'>"+
                      "● "+
                      ""+check[i].parentNode.parentNode.getAttribute("concept")+""+
                    "</div>";
        subject_area.append(label);
      }else if(check[i].checked && check[i].value=="必要ない"){
        $first_advice_log.push(["", check[i].value, ""]);
      }
    }
    console.log($goal);
    console.log($first_advice_log);

    var first_model = document.getElementsByClassName("first_model");//助言全体（一つの助言）のDOM
    var m_ad = document.getElementsByClassName("m_ad");//助言文のDOM
    var t_ad = document.getElementsByClassName("t_ad");//助言に回答するテキストエリアのDOM

    for(var i=0; i<first_model.length; i++){
      console.log(t_ad[i]);
      $first_advice_log[i][0] = m_ad[i].innerText;
      $first_advice_log[i][2] = t_ad[i].value;
      f_advice_log.push(m_ad[i].innerHTML);//助言ログの内容取得
    }
    console.log($first_advice_log);

    second_xmlLoad();
  }


}

function MoveFinish(){
  var result = window.confirm('活動を終了しますか？');
  if(result == true){ // OKが押されたら

    Record_Timing("回答終了");//[slide_content_activity]テーブルに助言提示が終了したタイミングを記録する

    for(var i=0; i<$first_advice_log.length; i++){
      if($first_advice_log[i][1]=="必要ない"){
        if($first_advice_log[i][2] == ""){
          // mtfile += $first_advice_log[i][0]+"」という助言に対して，必要ないを選択しました．\n\n";
          random_num = Math.random().toString(32).substring(2);
          f_mtfile += "<span class='disc'><input type='checkbox' onchange='Highlight(this);'>議論</span><br/>"+
                      "<div class='first_model'>"+
                        ""+f_advice_log[i]+"<br>"+
                        "<span><input class='f_ad' name='"+random_num+"' type='radio' value='必要ある' onchange='Need_check(this);'>必要ある</span>"+
                        "<span><input class='f_ad' name='"+random_num+"' type='radio' value='必要ない' onchange='NotNeed_check(this);' checked>必要ない</span>"+
                        "<br/>"+
                        "<p>→ 必要のない理由をお書きください</p>"+
                        "<textarea class='t_ad' placeholder='修正内容 OR 必要ない理由' style='width:600px; height:120px;'></textarea>"+
                      "</div>"+
                      "<br/><br/>";
        }else{
          // mtfile += $first_advice_log[i][0]+"」という助言に対して,「"+$first_advice_log[i][2]+"」という理由で，必要ないを選択しました．\n\n";
          random_num = Math.random().toString(32).substring(2);
          f_mtfile += "<span class='disc'><input type='checkbox' onchange='Highlight(this);'>議論</span><br/>"+
                      "<div class='first_model'>"+
                        ""+f_advice_log[i]+"<br>"+
                        "<span><input class='f_ad' name='"+random_num+"' type='radio' value='必要ある' onchange='Need_check(this);'>必要ある</span>"+
                        "<span><input class='f_ad' name='"+random_num+"' type='radio' value='必要ない' onchange='NotNeed_check(this);' checked>必要ない</span>"+
                        "<br/>"+
                        "<p>→ 必要のない理由をお書きください</p>"+
                        "<textarea class='t_ad' placeholder='修正内容 OR 必要ない理由' style='width:600px; height:120px;'>"+$first_advice_log[i][2]+"</textarea>"+
                      "</div>"+
                      "<br/><br/>";
        }
      }
    }

    for(var i=0; i<$second_advice_log.length; i++){
      if($second_advice_log[i][1]=="見直さない"){
        if($second_advice_log[i][2] == ""){
          // mtfile += $second_advice_log[i][0]+"」という助言に対して，見直さないを選択しました．\n\n";
          random_num = Math.random().toString(32).substring(2);
          s_mtfile += "<span class='disc'><input type='checkbox' onchange='Highlight(this);'>議論</span><br/>"+
                      "<div class='first_model'>"+
                        ""+s_advice_log[i]+"<br>"+
                        "<span><input class='f_ad' name='"+random_num+"' type='radio' value='見直す' onchange='re_check(this);'>見直す</span>"+
                        "<span><input class='f_ad' name='"+random_num+"' type='radio' value='見直さない' onchange='Not_re_check(this);' checked>見直さない</span>"+
                        "<br/>"+
                        "<p>→ 見直さない理由をお書きください</p>"+
                        "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'>"+$second_advice_log[i][2]+"</textarea>"+
                      "</div>"+
                      "<br/><br/>";
        }else{
          // mtfile += $second_advice_log[i][0]+"」という助言に対して，「"+$second_advice_log[i][2]+"」という理由で，見直さないを選択しました．\n\n";
          random_num = Math.random().toString(32).substring(2);
          s_mtfile += "<span class='disc'><input type='checkbox' onchange='Highlight(this);'>議論</span><br/>"+
                      "<div class='first_model'>"+
                        ""+s_advice_log[i]+"<br>"+
                        "<span><input class='f_ad' name='"+random_num+"' type='radio' value='見直す' onchange='re_check(this);'>見直す</span>"+
                        "<span><input class='f_ad' name='"+random_num+"' type='radio' value='見直さない' onchange='Not_re_check(this);' checked>見直さない</span>"+
                        "<br/>"+
                        "<p>→ 見直さない理由をお書きください</p>"+
                        "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'>"+$second_advice_log[i][2]+"</textarea>"+
                      "</div>"+
                      "<br/><br/>";
        }
      }
    }

    var final_advice_dom = document.getElementById("macro_feedback_area");
    let dbid = getUniqueStr();
    console.log(final_advice_dom.innerText);
    var final_advice_tmp = final_advice_dom.innerText;
    var ref_values = document.getElementsByClassName("t_ref");
    for(var i=0; i<ref_values.length; i++){
      final_advice_tmp += "【回答文】"+ref_values[i].value;
    }

    $.ajax({
        url: "php/record_final_advice.php",
        type: "POST",
        data: {id : dbid,
               final_advice : final_advice_tmp,},
        success: function () {
          console.log("登録成功");
        },
        error: function () {
        console.log("登録失敗");},
    });

    for(var i=final_advice_dom.childNodes.length - 1; i>=0; i--){
      final_advice_dom.removeChild(final_advice_dom.childNodes[i]);
    }

    var area = $("#macro_feedback_area");
    var label = "<div class='finish_model'>"+
                  "<p class='f_ref nor_font'>プレゼンシナリオ作成お疲れ様でした．システムの利用は以上で終了です．"+
                  "<br>"+
                  "2つの出力ファイル（プレゼンシナリオ.txt, 助言ログ.html）を手元に保存した後，ブラウザを閉じてください．</p>"+
                  "<a href='https://1drv.ms/u/s!Am39JzOgDfpjnGqx4EIvYb2M7aqb?e=XWO6qF' target='_blank' class = 'nor_font'>最後にアンケート（アンケート用紙2）のご協力お願いいたします．</a>"+
                  "<p class='f_ref nor_font'>アンケートに答え終わりましたら，アンケート用紙1,2(.docx)と2つの出力ファイルを正門まで送っていただくようお願い致します．</p>"+
                  "<br/>"+
                "</div>"+
                "<br/>";
    area.append(label);
    //テキストファイルの出力
    OutputTxtFile();
    OutputScenario();
    // OutputFile();
  }
}

//「目標の再検討を促す助言」のログ
var f_mtfile = "<!DOCTYPE html><html><head><link type='text/css' rel='stylesheet' href='advice_log.css' />"+
               "</head><body><div id='reflection_area'>"+
               "<input type='button' value='リフレクション開始' onclick='Reflection(this);'></div><br/>"+
               "<h2>【目標設定の検討を促す助言】</h2><br/>";
var s_mtfile = "<h2>【プレゼンシナリオの検討を促す助言】</h2><br/>";//「プレゼンシナリオの再検討を促す助言」のログ
var random_num;

//議論の準備性を高める助言を提示する関数
function FinalReflection(){

  Record_Timing("リフレクション提示");//[slide_content_activity]テーブルにリフレクション課題が提示したタイミングを記録する

  var second_advice_dom = document.getElementById("macro_feedback_area");
  for(var i=second_advice_dom.childNodes.length - 1; i>=0; i--){
    second_advice_dom.removeChild(second_advice_dom.childNodes[i]);
  }

  var area = $("#macro_feedback_area");
  var f_count = 0;

  var label = "<h2>リフレクションフェーズ</h2>";
  area.append(label);

  for(var i=0; i<$first_advice_log.length; i++){
    if($first_advice_log[i][1]=="必要ある"){
      if($first_advice_log[i][2] == ""){
        var label = "<div class='final_model'>"+
                      "<p class='f_ref'><span class='ad_font'><span style ='font-weight:bold;'>"+$first_advice_log[i][0]+"</span>という助言に対して，必要あるを選択しました．"+
                      "この助言が出てきたときに，どのような気づきを得ましたか？</span></p>"+
                      "<textarea class='t_ref' placeholder='助言を通じて得た気づき' style='width:600px; height:120px;'></textarea>"+
                    "</div>"+
                    "<br/>";
        area.append(label);
        f_count++;
        random_num = Math.random().toString(32).substring(2);
        f_mtfile += "<span class='disc'><input type='checkbox' onchange='Highlight(this);'>議論</span><br/>"+
                    "<div class='first_model'>"+
                      ""+f_advice_log[i]+"<br>"+
                      "<span><input class='f_ad' name='"+random_num+"' type='radio' value='必要ある' onchange='Need_check(this);' checked>必要ある</span>"+
                      "<span><input class='f_ad' name='"+random_num+"' type='radio' value='必要ない' onchange='NotNeed_check(this);'>必要ない</span>"+
                      "<br/>"+
                      "<p>→ 目標に沿った内容であるか，プレゼンシナリオを見直してみましょう．<br>もしプレゼンシナリオを修正した場合は修正内容を記載してください</p>"+
                      "<textarea class='t_ad' placeholder='修正内容 OR 必要ない理由' style='width:600px; height:120px;'></textarea>"+
                    "</div>"+
                    "<br/><br/>";
      }else{
        var label = "<div class='final_model'>"+
                      "<p class='f_ref'><span class='ad_font'><span style ='font-weight:bold;'>"+$first_advice_log[i][0]+"</span>という助言に対して，必要あるを選択し,"+
                      "「"+$first_advice_log[i][2]+"」という修正を加えました．"+
                      "この助言が出てきたときに，どのような気づきを得ましたか？</span></p>"+
                      "<textarea class='t_ref' placeholder='助言を通じて得た気づき' style='width:600px; height:120px;'></textarea>"+
                    "</div>"+
                    "<br/>";
        area.append(label);
        f_count++;
        random_num = Math.random().toString(32).substring(2);
        f_mtfile += "<span class='disc'><input type='checkbox' onchange='Highlight(this);'>議論</span><br/>"+
                    "<div class='first_model'>"+
                      ""+f_advice_log[i]+"<br>"+
                      "<span><input class='f_ad' name='"+random_num+"' type='radio' value='必要ある' onchange='Need_check(this);' checked>必要ある</span>"+
                      "<span><input class='f_ad' name='"+random_num+"' type='radio' value='必要ない' onchange='NotNeed_check(this);'>必要ない</span>"+
                      "<br/>"+
                      "<p>→ 目標に沿った内容であるか，プレゼンシナリオを見直してみましょう．<br>もしプレゼンシナリオを修正した場合は修正内容を記載してください</p>"+
                      "<textarea class='t_ad' placeholder='修正内容 OR 必要ない理由' style='width:600px; height:120px;'>"+$first_advice_log[i][2]+"</textarea>"+
                    "</div>"+
                    "<br/><br/>";
      }
    }
  }

  for(var i=0; i<$second_advice_log.length; i++){
    if($second_advice_log[i][1]=="見直す"){
      if($second_advice_log[i][2] == ""){
        var label = "<div class='final_model'>"+
                      "<p class='f_ref'><span class='ad_font'><span style ='font-weight:bold;'>"+$second_advice_log[i][0]+"</span>という助言に対して，見直すを選択しました．"+
                      "この助言が出てきたときに，どのような気づきを得ましたか？</span></p>"+
                      "<textarea class='t_ref' placeholder='助言を通じて得た気づき' style='width:600px; height:120px;'></textarea>"+
                    "</div>"+
                    "<br/>";
        area.append(label);
        f_count++;
        random_num = Math.random().toString(32).substring(2);
        s_mtfile += "<span class='disc'><input type='checkbox' onchange='Highlight(this);'>議論</span><br/>"+
                    "<div class='first_model'>"+
                      ""+s_advice_log[i]+"<br>"+
                      "<span><input class='f_ad' name='"+random_num+"' type='radio' value='見直す' onchange='re_check(this);' checked>見直す</span>"+
                      "<span><input class='f_ad' name='"+random_num+"' type='radio' value='見直さない' onchange='Not_re_check(this);'>見直さない</span>"+
                      "<br/>"+
                      "<p>→ 助言をもとにプレゼンシナリオを見直してみましょう．プレゼンシナリオを修正した場合は修正内容を記載してください</p>"+
                      "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'>"+$second_advice_log[i][2]+"</textarea>"+
                    "</div>"+
                    "<br/><br/>";
      }else{
        var label = "<div class='final_model'>"+
                      "<p class='f_ref'><span class='ad_font'><span style ='font-weight:bold;'>"+$second_advice_log[i][0]+"</span>という助言に対して，見直すを選択し,"+
                      "「"+$second_advice_log[i][2]+"」という修正を加えました．"+
                      "この助言が出てきたときに，どのような気づきを得ましたか？</span></p>"+
                      "<textarea class='t_ref' placeholder='助言を通じて得た気づき' style='width:600px; height:120px;'></textarea>"+
                    "</div>"+
                    "<br/>";
        area.append(label);
        f_count++;
        random_num = Math.random().toString(32).substring(2);
        s_mtfile += "<span class='disc'><input type='checkbox' onchange='Highlight(this);'>議論</span><br/>"+
                    "<div class='first_model'>"+
                      ""+s_advice_log[i]+"<br>"+
                      "<span><input class='f_ad' name='"+random_num+"' type='radio' value='見直す' onchange='re_check(this);' checked>見直す</span>"+
                      "<span><input class='f_ad' name='"+random_num+"' type='radio' value='見直さない' onchange='Not_re_check(this);'>見直さない</span>"+
                      "<br/>"+
                      "<p>→ 助言をもとにプレゼンシナリオを見直してみましょう．プレゼンシナリオを修正した場合は修正内容を記載してください</p>"+
                      "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'>"+$second_advice_log[i][2]+"</textarea>"+
                    "</div>"+
                    "<br/><br/>";
      }
    }
  }

  var done_btn = "<br/>"+
                 "<div id='final_btn'>"+
                    "<input type='button' value='学習を終了する' onclick='MoveFinish();Get_SlideRank();Get_ContentRank();'>"+
                 "</div>";
  area.append(done_btn);

  if(f_count == 0){
    MoveFinish();
  }

}

var $second_advice_log = [];
var s_advice_log = [];

function MoveThird(){

  var check = document.getElementsByClassName("f_ad");
  var check_count = 0;
  for(var i=0; i<check.length; i++){
    if(check[i].checked){
      check_count++;
    }
  }
  console.log(check.length);
  console.log(check_count);

  if(check_count < check.length / 2){
    window.alert("見直す OR 見直さない　のどちらかを選んでください");
  }else{

    var rbtn = document.getElementsByClassName("f_ad");

    for(var i=0; i<rbtn.length; i++){
      // console.log(rbtn[i].name);
      // console.log(rbtn[i].value);
      // console.log(rbtn[i].checked);
      // console.log(rbtn[i].dataset.id);
      if(rbtn[i].checked && rbtn[i].value=="見直す"){
        $second_advice_log.push(["", rbtn[i].value, ""]);
      }else if(rbtn[i].checked && rbtn[i].value=="見直さない"){
        $second_advice_log.push(["", rbtn[i].value, ""]);
      }
    }

    console.log($second_advice_log);

    var first_model = document.getElementsByClassName("first_model");
    var m_ad = document.getElementsByClassName("m_ad");
    var t_ad = document.getElementsByClassName("t_ad");

    for(var i=0; i<first_model.length; i++){
      console.log(t_ad[i]);
      $second_advice_log[i][0] = m_ad[i].innerText;
      $second_advice_log[i][2] = t_ad[i].value;
      s_advice_log.push(m_ad[i].innerHTML);
    }
    console.log($second_advice_log);
    FinalReflection();
  }

}

// --------------------------------------------------------------


//--------------- 論理構成意図設定のための関数-----------
// <select>要素の参照を取得
var firstSelectElement = document.getElementById("first_logic");      //選択肢：主張・根拠・論拠
var secondSelectElement = document.getElementById("second_logic");   //選択肢：二つ目の分類選択タグ
var first_logicElement = document.getElementById("logic_intention1");
var second_logicElement = document.getElementById("logic_intention2");
var secondSelectTag = document.getElementById("second_choice");

var firstSelectElement_node = document.getElementById("first_logic_node");  
var secondSelectElement_node = document.getElementById("second_logic_node");   //選択肢：二つ目の分類選択タグ
var first_logicElement_node = document.getElementById("logic_intention1_node");
var second_logicElement_node = document.getElementById("logic_intention2_node");
var secondSelectTag_node = document.getElementById("second_choice_node");

// 選択肢が変更されたときに実行される関数
firstSelectElement.addEventListener("change", function() {
    // 選択された<option>の値を取得
    var selectedValue = firstSelectElement.value;
    console.log(selectedValue);
    // 選択された<option>の値に応じて処理を実行
    switch (selectedValue) {
        case "主張":
            doSomethingForOption1(first_logicElement);
            secondSelectTag.style.display = "block";
            var newOptions = [
              { value: "論拠", text: "論拠" },
              { value: "根拠", text: "根拠" }
            ];
            if(secondSelectElement.options.length > 0){
              deleteSelectOptions(secondSelectElement);
            }
            addOptions(newOptions, secondSelectElement);
            break;
        case "論拠":
            doSomethingForOption2(first_logicElement);
            secondSelectTag.style.display = "block";
            var newOptions = [
              { value: "主張", text: "主張" },
              { value: "根拠", text: "根拠" }
            ];
            if(secondSelectElement.options.length > 0){
              deleteSelectOptions(secondSelectElement);
            }
            addOptions(newOptions, secondSelectElement);
            break;
        case "根拠":
            doSomethingForOption3(first_logicElement);
            secondSelectTag.style.display = "block";
            var newOptions = [
              { value: "主張", text: "主張" },
              { value: "論拠", text: "論拠" }
            ];
            if(secondSelectElement.options.length > 0){
              deleteSelectOptions(secondSelectElement);
            }
            addOptions(newOptions, secondSelectElement);
            break;
        default:
            break;
    }
});

// 選択肢が変更されたときに実行される関数
firstSelectElement_node.addEventListener("change", function() {
  // 選択された<option>の値を取得
  var selectedValue = firstSelectElement_node.value;
  console.log(selectedValue);
  // 選択された<option>の値に応じて処理を実行
  switch (selectedValue) {
      case "主張":
          doSomethingForOption1(first_logicElement_node);
          secondSelectTag_node.style.display = "block";
          var newOptions = [
            { value: "論拠", text: "論拠" },
            { value: "根拠", text: "根拠" }
          ];
          if(secondSelectElement_node.options.length > 0){
            deleteSelectOptions(secondSelectElement_node);
          }
          addOptions(newOptions, secondSelectElement_node);
          break;
      case "論拠":
          doSomethingForOption2(first_logicElement_node);
          secondSelectTag_node.style.display = "block";
          var newOptions = [
            { value: "主張", text: "主張" },
            { value: "根拠", text: "根拠" }
          ];
          if(secondSelectElement_node.options.length > 0){
            deleteSelectOptions(secondSelectElement_node);
          }
          addOptions(newOptions, secondSelectElement_node);
          break;
      case "根拠":
          doSomethingForOption3(first_logicElement_node);
          secondSelectTag_node.style.display = "block";
          var newOptions = [
            { value: "主張", text: "主張" },
            { value: "論拠", text: "論拠" }
          ];
          if(secondSelectElement_node.options.length > 0){
            deleteSelectOptions(secondSelectElement_node);
          }
          addOptions(newOptions, secondSelectElement_node);
          break;
      default:
          break;
  }
});

// 各<option>に対応する処理の定義
function doSomethingForOption1(logicElement) {
  console.log("Option 1 selected! Perform action 1.");
  // ここにOption 1の処理を記述
  if(logicElement.options.length > 0){
    deleteSelectOptions(logicElement);
  }
  addClaimValue(logicElement);  
  logicElement.style.visibility = 'visible';
  
}

function doSomethingForOption2(logicElement) {
  console.log("Option 2 selected! Perform action 2.");
  // ここにOption 2の処理を記述
  console.log(logicElement);

  if(logicElement.options.length > 0){
    deleteSelectOptions(logicElement);
  }
  addWarrantValue(logicElement);
  logicElement.style.visibility = 'visible';
}

function doSomethingForOption3(logicElement) {
  console.log("Option 3 selected! Perform action 3.");
  // ここにOption 3の処理を記述
  // 複数の新しい<option>要素を一度に追加
  if(logicElement.options.length > 0){
    deleteSelectOptions(logicElement);
  }
  addDataValue(logicElement);
  logicElement.style.visibility = 'visible';
}

function addOptions(newOp, logicElement){
  // 新しい<option>要素を作成し、指定した<select>内に追加
  newOp.forEach(function(optionData) {
    var newOption = document.createElement("option");
    newOption.value = optionData.value;
    newOption.textContent = optionData.text;
    logicElement.appendChild(newOption);
  });
}

function addClaimValue(logicElement){
  console.log("主張の要素を追加");
  var newOptions = [
    { value: "1623730284000_n754", text: "主張" },
    { value: "1669114994472_n901", text: "提案" },
    { value: "1548588455000_n522", text: "疑問" }
  ];
  addOptions(newOptions, logicElement);
}

function addWarrantValue(logicElement){
  console.log("論拠の要素を追加");
  var newOptions = [
    { value: "1691808824861_n1104", text: "推測[自身]" },
    { value: "1691808824861_n1106", text: "推測[世の中]" },
    { value: "1691808824861_n1114", text: "仮説[自身]" },
    { value: "1691808824861_n1115", text: "仮説[世の中]" },
    { value: "1670930169649_n937", text: "判断" }
  ];
  addOptions(newOptions, logicElement);
  
}

function addDataValue(logicElement){
  console.log("根拠の要素を追加");
  var newOptions = [
    { value: "1691808824861_n1110", text: "事実[自身]" },  
    { value: "1691808824861_n1112", text: "事実[世の中]" } 
  ];
  addOptions(newOptions, logicElement);
}

function deleteSelectOptions(logicElement){
   // <select>要素内のすべての<option>要素を削除
   while(logicElement.lastChild)
   {
    logicElement.removeChild(logicElement.lastChild);
   }
   // $('logic_intention1').children().remove();
   console.log("削除完了");
}

secondSelectElement.addEventListener("change", function() {
  // 選択された<option>の値を取得
  var selectedValue = secondSelectElement.value;
  console.log(selectedValue);
  // 選択された<option>の値に応じて処理を実行
  switch (selectedValue) {
      case "主張":
          doSomethingForOption1(second_logicElement);
          break;
      case "論拠":
          doSomethingForOption2(second_logicElement);
          break;
      case "根拠":
          doSomethingForOption3(second_logicElement);
          break;
      default:
          break;
  }
});

secondSelectElement_node.addEventListener("change", function() {
  // 選択された<option>の値を取得
  var selectedValue = secondSelectElement_node.value;
  console.log(selectedValue);
  // 選択された<option>の値に応じて処理を実行
  switch (selectedValue) {
      case "主張":
          doSomethingForOption1(second_logicElement_node);
          break;
      case "論拠":
          doSomethingForOption2(second_logicElement_node);
          break;
      case "根拠":
          doSomethingForOption3(second_logicElement_node);
          break;
      default:
          break;
  }
});

// function CancelButton_Click4(){
//   var dm_menu4 = document.getElementById('document_area_conmenu4'); //関係性を設定するメニュー
//   if(dm_menu4.classList.contains('on')){
//     dm_menu4.classList.remove('on');
//   }
// }
// function CancelButton_Click3(){
//   var dm_menu3 = document.getElementById('document_area_conmenu3'); //関係性を設定するメニュー
//   if(dm_menu3.classList.contains('on')){
//     dm_menu3.classList.remove('on');
//   }
// }

function CancelButton_Click(type){
  var dm_menu = document.getElementById(type);
  if(dm_menu.classList.contains('on')){
    dm_menu.classList.remove('on');
  }
}


// -------------------------------------------------