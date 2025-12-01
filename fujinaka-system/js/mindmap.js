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



function open_empty(){

    var options = {
        container:'jsmind_container',
        // theme:'nephrite',
        editable:true
    }

    _jm = new jsMind(options);
    _jm.show();

}

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


//問い一覧から問いを選択し，マップに追加
function add_node(){

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

    //fujinaka 上のやつに+コンセプトid+delete判定できるように新datebase設置（fujinaka_rationality）phpの方も変えてます
    if(this.id == "1519483811401_n426"){

      for(var j=0; j<jmnode.length; j++){

          if(jmnode[j].style.backgroundColor == "rgb(255, 105, 180)"){

            const concept_id = jmnode[j].getAttribute("concept_id");

            if(concept_id  !== null ||  concept_id  !== undefined){ //concept_idがあるならprepared_question
              $.ajax({
                url: "php/fujinaka_rationality.php",
                type: "POST",
                data: { 
                  type : "insert",
                  rationality_id : thisId,
                  node_id : jmnode[j].getAttribute("nodeid"),
                  concept_id : jmnode[j].getAttribute("concept_id"),
                  nodetype : "toi"
                }});
            }else{
              $.ajax({
                url: "php/fujinaka_rationality.php",
                type: "POST",
                data: { 
                  type : "insert",
                  rationality_id : thisId,
                  node_id : jmnode[j].getAttribute("nodeid"),
                  concept_id : "original",
                  nodetype : "toi"
                }});
            }
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
                        type : "toi",
                        concept_id : jmnode[i].getAttribute("concept_id"),
                        x : jmnode[i].style.left,
                        y : jmnode[i].style.top,
                        content : jmnode[i].innerHTML,
                        class : "" }, //以前，クラスリストを用いて合理性を考えるべきノードを呈示していたが，今は必要ない

            });


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
        data: { update : "sheet" }

    });

}

//問いノード追加ボタンで問いノードを追加する
function add_Qnode(){

    var parent_node = _jm.get_selected_node();

    var parent_id = parent_node.id;

    var nodeid = jsMind.util.uuid.newid();//idの生成
    var topic = 'New Node';
    var node = _jm.add_node(parent_node, nodeid, topic);

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
                        type : "toi",
                        concept_id : "",
                        x : jmnode[i].style.left,
                        y : jmnode[i].style.top,
                        content : jmnode[i].innerHTML,
                        class : "" },

            });

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
        data: { update : "sheet" }

    });

}

//問いノードのショートカット
$(window).keydown(function(e){

    if(event.shiftKey){

      if(e.keyCode === 81){

        add_Qnode();

        return false;
      }

    }

});

//答えノード追加ボタンで答えノードを追加する
function add_Anode(){

    var parent_node = _jm.get_selected_node();

    var parent_id = parent_node.id;

    var nodeid = jsMind.util.uuid.newid();//idの生成
    var topic = 'New Node';
    var node = _jm.add_node(parent_node, nodeid, topic);

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
                        type : "answer",
                        concept_id : p_concept,
                        x : jmnode[j].style.left,
                        y : jmnode[j].style.top,
                        content : jmnode[j].innerHTML,
                        class : "" },

            });

            if(p_concept== "1519483811401_n426"){

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
        data: { update : "sheet" }

    });

}

function add_Confirm(){ //fujinaka変更
  const jmnode = document.getElementsByTagName("jmnode");
  const cnode = document.getElementsByClassName("cspan");

  let span_count = 0;
  for(var i=0; i<cnode.length; i++){
    if(cnode[i].style.border == "2px solid gray"){
      var selected_cno = cnode[i];
      span_count++;
      break;
    }
  }

  let selected_node = _jm.get_selected_node();

  const jmnode_array = Array.prototype.slice.call(jmnode);

  if(span_count == 0){
    window.alert('論文シナリオのノードが選択されていません．');
    return;
  } else if(jmnode_array.every(jmn => selected_cno.getAttribute("node_id") !== jmn.getAttribute("nodeid"))) {
    // シナリオにあってマップにないノード（シナリオ上で新規作成したノード）が選択されている場合
    if (!(selected_node)){
      // マップのノードが選択されていない場合
      window.alert('マップのノードが選択されていません．');
      return;
    } else {
      add_Pnode(selected_cno);
      return;
    }
  } else {
    const correspondingJmn = jmnode_array.find(jmn => selected_cno.getAttribute("node_id") === jmn.getAttribute("nodeid"));
    if(correspondingJmn.innerHTML !== cno.innerHTML) {
      // 対応するマップのノードとのテキストが違うシナリオノードが選択されている場合
      reflect_Pnode(selected_cno); 
    }
  }

}



function add_Pnode(dom_target){ //fujinaka変更
  //シナリオにあってマップにないノード（シナリオ上で新規作成したノード）を追加する
  if(window.confirm('本当に反映しますか？')){
    var p_content = dom_target.innerHTML;

    var p_nodeid = dom_target.getAttribute("node_id");

    var p_type = dom_target.getAttribute("type");

    var p_concept = dom_target.getAttribute("concept_id");

    var parent_node = _jm.get_selected_node();

    var parent_id = parent_node.id;

    if(!(p_concept)){

    toi_type = "s_question";

    if(p_type == 'answer'){//答えの場合
      
      var node = _jm.add_node(parent_node, p_nodeid, p_content);
      var jmnode = document.getElementsByTagName("jmnode");

      for(var i=0; i<jmnode.length; i++){

        if(parent_id == jmnode[i].getAttribute("nodeid")){

            var parent_concept = jmnode[i].getAttribute("concept_id");

        }

    }

      for(var j=0; j<jmnode.length; j++){
        if(p_nodeid == jmnode[j].getAttribute("nodeid")){
          jmnode[j].setAttribute("concept_id",parent_concept);
          jmnode[j].setAttribute("type","answer");
          jmnode[j].setAttribute("parent_id",parent_id);
          $.ajax({
              url: "php/insert_node.php",
              type: "POST",
              data: { insert : "node",
                      id : p_nodeid,
                      parent_id : parent_id,
                      type : "answer",
                      concept_id : parent_concept,
                      x : jmnode[j].style.left,
                      y : jmnode[j].style.top,
                      content : jmnode[j].innerHTML,
                      class : "" },
                  });
          //yoshioka登録　追加ボタンより答えを追加したこと
          //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
          Record_activities(p_nodeid,
                            parent_id,
                            "add",
                            jmnode[j].innerHTML,
                            parent_concept,
                            "s_answer",
                            jsMind.util.uuid.newid()
                            );
        }
      }

      $.ajax({
          url: "php/update_node.php",
          type: "POST",
          data: { update : "sheet" }
      });

    }else if(p_type == 'toi'){//問いの場合

      var node = _jm.add_node(parent_node, p_nodeid, p_content);
      var jmnode = document.getElementsByTagName("jmnode");

      for(var i=0; i<jmnode.length; i++){
          if(p_nodeid == jmnode[i].getAttribute("nodeid")){
              jmnode[i].setAttribute("type","toi");
              jmnode[i].setAttribute("parent_id",parent_id);
              jmnode[i].className = "";

              $.ajax({
                  url: "php/insert_node.php",
                  type: "POST",
                  data: { insert : "node",
                          id : p_nodeid,
                          parent_id : parent_id,
                          type : "toi",
                          concept_id : "",
                          x : jmnode[i].style.left,
                          y : jmnode[i].style.top,
                          content : jmnode[i].innerHTML,
                          class : "" },
              });

              //yoshioka登録　追加ボタンより自作の問いを追加したこと
              //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
              Record_activities(nodeid,
                                parent_id,
                                "add",
                                jmnode[i].innerHTML,
                                "",
                                toi_type,
                                jsMind.util.uuid.newid()
                                );
        }
      }
      $.ajax({
          url: "php/update_node.php",
          type: "POST",
          data: { update : "sheet" }
      });
    }
    } else {

    toi_type = "s_prepared_question";

    if(p_type == 'answer'){//答えの場合
      
      var node = _jm.add_node(parent_node, p_nodeid, p_content);
      var jmnode = document.getElementsByTagName("jmnode");

      for(var j=0; j<jmnode.length; j++){
        if(nodeid == jmnode[j].getAttribute("nodeid")){
          jmnode[j].setAttribute("concept_id",p_concept);
          jmnode[j].setAttribute("type","answer");
          jmnode[j].setAttribute("parent_id",parent_id);
          $.ajax({
              url: "php/insert_node.php",
              type: "POST",
              data: { insert : "node",
                      id : p_nodeid,
                      parent_id : parent_id,
                      type : "answer",
                      concept_id : p_concept,
                      x : jmnode[j].style.left,
                      y : jmnode[j].style.top,
                      content : jmnode[j].innerHTML,
                      class : "" },
                  });
          //yoshioka登録　追加ボタンより答えを追加したこと
          //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
          Record_activities(p_nodeid,
                            parent_id,
                            "add",
                            jmnode[j].innerHTML,
                            p_concept,
                            "s_answer",
                            jsMind.util.uuid.newid()
                            );
        }
      }

    }else if(p_type == 'toi'){//問いの場合

      var node = _jm.add_node(parent_node, p_nodeid, p_content);
      var jmnode = document.getElementsByTagName("jmnode");

      for(var i=0; i<jmnode.length; i++){
          if(nodeid == jmnode[i].getAttribute("nodeid")){
              jmnode[j].setAttribute("concept_id",p_concept);
              jmnode[i].setAttribute("type","toi");
              jmnode[i].setAttribute("parent_id",parent_id);
              jmnode[i].className = "";

              $.ajax({
                  url: "php/insert_node.php",
                  type: "POST",
                  data: { insert : "node",
                          id : p_nodeid,
                          parent_id : parent_id,
                          type : "toi",
                          concept_id : p_concept,
                          x : jmnode[i].style.left,
                          y : jmnode[i].style.top,
                          content : jmnode[i].innerHTML,
                          class : "" },
              });

              //yoshioka登録　追加ボタンより自作の問いを追加したこと
              //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
              Record_activities(p_nodeid,
                                parent_id,
                                "add",
                                jmnode[i].innerHTML,
                                p_concept,
                                toi_type,
                                jsMind.util.uuid.newid()
                                );
        }
      }

      $.ajax({
          url: "php/update_node.php",
          type: "POST",
          data: { update : "sheet" }
      });

    }
    }

    dom_target.setAttribute("node_id", nodeid);
    var thread_id = dom_target.parentNode.parentNode.parentNode.id;
    var arr = $('#'+thread_id).data('node_id');
    console.log(arr);
    arr.push(nodeid);
    console.log(arr);
    $('#'+thread_id).data('node_id', arr);
  }
}

function reflect_Pnode(dom_target){ //fujinaka追加
  //マップへ反映ボタンでノードを更新する
  if(window.confirm('本当に反映しますか？')){
    var jmnode = document.getElementsByTagName("jmnode");
    var p_content = dom_target.innerHTML;
    var p_nodeid = dom_target.getAttribute("node_id");
    for(i=0; i<jmnode.length; i++){
      if(jmnode[i].getAttribute("nodeid") == p_nodeid){//回ってきたidが選択中ノードの時
        _jm.update_node(p_nodeid, p_content);
      }
    }
  }
}





//答えノードのショートカット
$(window).keydown(function(e){

    if(event.shiftKey){

      if(e.keyCode === 65){

        add_Anode();

        return false;
      }

    }

});

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
                id : selected_id },

    });

    $.ajax({

        url: "php/update_node.php",
        type: "POST",
        data: { update : "sheet" }

    });

    //fujinaka追加 fujinaka_rationality　データ削除
    const jmnode = document.getElementsByTagName("jmnode"); // FORESTにあるノード
    const jmnode_object = Array.prototype.slice.call(jmnode);
    const del_node = jmnode_object.filter(jmn => {
      jmn.getAttribute("node_id") === selected_id;
    });
    console.log(del_node);
    if(del_node.getAttribute("concept_id") === "1519483811401_n426"){ //合理性ノード
      $.ajax({
        url: "php/fujinaka_rationality.php",
        type: "POST",
        data: { 
          type : "delete",
          rationality_id : selected_id
        }});
    }else{
      $.ajax({
        url: "php/fujinaka_rationality.php",
        type: "POST",
        data: { 
          type : "delete",
          node_id : selected_id
        }});
      }


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

                    if(parse[i].node_id == jmnode[j].getAttribute("nodeid")){
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

        }

    }

    $("#reason").html("");

}

//選択したノードが修正理由を記述したことがあるかチェック
// function check_edit_reason(id){
//
//     $("#reason").html("");
//
//     $.ajax({
//
//         url: "php/get_data.php",
//         type: "POST",
//         data: { val : "edit_reason",
//                 id : id },
//         success: function(arr){
//
//             if(arr.length != 2){//2は[]←この2文字
//
//                 var parse = JSON.parse(arr);
//
//                 var textarea = document.createElement("textarea");
//                 textarea.id = "textarea";
//                 textarea.name = "textarea";
//                 textarea.innerHTML = parse;
//                 reason.appendChild(textarea);
//
//                 var button = document.createElement("button");
//                 button.className = "button4";
//                 button.innerHTML = "決定";
//                 button.onclick = send_reason;
//                 reason.appendChild(button);
//
//             }
//
//         }
//
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

var modetype = 0

//fujinaka追加
function ModeChangeButtonClick() {
  const selindex = document.target_mode.Select1;

  if (modetype == selindex.selectedIndex) return;

  modetype = selindex.selectedIndex;

  console.log(modetype);

  if (modetype == 0){

    $('#jsmind_nav').show('fast');
    $('#version_area').hide('fast');

    $('#mind').show('fast');
    $('#comment').hide('fast');
    $('#add_tensaku').hide('fast');

    $('#elab_jsmind_container').hide('fast');
    $('#elab_document_area').hide('fast');
    $('#elab_preview_area').hide('fast');

    _jm = null; // jsmind_container
    mind = null;
    document.getElementById("elab_jsmind_container").innerHTML = "";
    document.getElementById("elab_document_area").innerHTML = "";
    document.getElementById("elab_preview_area").innerHTML = "";
    document.getElementById("tensaku_area").innerHTML = "";
    document.getElementById("feedback_area").innerHTML = "";

    open_empty();

    getData();

    Rebuild_comment();

    // イベントハンドラーの再開
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



  }else if(modetype == 1){

    $('#jsmind_nav').hide('fast');
    $('#version_area').show('fast');

    $('#mind').hide('fast');
    $('#comment').show('fast');
    $('#add_tensaku').show('fast');

    $('#jsmind_container').hide('fast');
    $('#document_area').hide('fast');
    $('#preview_area').hide('fast');
    

    _jm = null; // jsmind_container
    mind = null;
    
    document.getElementById("jsmind_container").innerHTML = "";
    document.getElementById("tensaku_area").innerHTML = "";
    document.getElementById("feedback_area").innerHTML = "";

    $(document).off('dblclick', '.cspan');
    $(document).off('dblclick', '.tspan');

  }

  CheckClick();

}

// 文書化モードを切り替えたときの動作
function CheckClick(){
  // checkboxの状態を取得
  logic_check = document.getElementById("logicbox");
  check = document.getElementById("scenariobox");
  pre_check = document.getElementById("previewbox");
  if (modetype == 0 ) {
    if(logic_check.checked == false && check.checked == false && pre_check.checked == false){ 
      $('#jsmind_container').css('width','70%');
      $('#map_menu').css('width','70%');
      $('#side_menu').css('width','29%');

      $('#jsmind_container').show('fast');
      $('#map_menu').show('fast');
      $('#side_menu').show('fast');
      $('#logic_area').hide('fast');
      $('#logic_menu').hide('fast');
      $('#document_area').hide('fast');
      $('#presen_menu').hide('fast');
      $('#preview_area').hide('fast');
    }
    //　三角ロジックボタンだけオン（マップと三角ロジックを表示）
    else if(logic_check.checked == true && check.checked == false && pre_check.checked == false){ 
      $('#jsmind_container').css('width','50vw');
      $('#map_menu').css('width','50vw');
      $('#logic_area').css('width','49vw');
      $('#logic_menu').css('width','49vw');

      $('#jsmind_container').show('fast');
      $('#map_menu').show('fast');
      $('#side_menu').hide('fast');
      $('#logic_area').show('fast');
      $('#logic_menu').show('fast');
      $('#document_area').hide('fast');
      $('#presen_menu').hide('fast');
      $('#preview_area').hide('fast');
    }
    // 論文シナリオだけオン（マップとシナリオを表示）
    else if(logic_check.checked == false && check.checked == true && pre_check.checked == false){ 
      $('#jsmind_container').css('width','50vw');
      $('#map_menu').css('width','50vw');
      $('#document_area').css('width','49vw');
      $('#presen_menu').css('width','49vw');

      $('#jsmind_container').show('fast');
      $('#map_menu').show('fast');
      $('#side_menu').hide('fast');
      $('#logic_area').hide('fast');
      $('#logic_menu').hide('fast');
      $('#document_area').show('fast');
      $('#presen_menu').show('fast');
      $('#preview_area').hide('fast');
      $('#preview_btn').show('fast');
    }
    //　三角ロジックボタンとシナリオボタンがオン（マップと三角ロジックとシナリオを表示）
    else if(logic_check.checked == true && check.checked == true && pre_check.checked == false){ 
      $('#jsmind_container').css('width','33.3333vw');
      $('#map_menu').css('width','33.3333vw');
      $('#logic_area').css('width','33.3333vw');
      $('#logic_menu').css('width','33.3333vw');
      $('#document_area').css('width','33.3333vw');
      $('#presen_menu').css('width','33.3333vw');

      $('#jsmind_container').show('fast');
      $('#map_menu').show('fast');
      $('#side_menu').hide('fast');
      $('#logic_area').show('fast');
      $('#logic_menu').show('fast');
      $('#document_area').show('fast');
      $('#presen_menu').show('fast');
      $('#preview_area').hide('fast');
      $('#preview_btn').show('fast');

      //　シナリオボタンとプレビューボタンがオン（シナリオとプレビューを表示）
    }
    else if (logic_check.checked == false &&check.checked == true && pre_check.checked == true){ 
      $('#document_area').css('width','45vw');
      $('#preview_area').css('width','calc(55vw - 350px)');

      $('#jsmind_container').hide('fast');
      $('#map_menu').hide('fast');
      $('#side_menu').hide('fast');
      $('#logic_area').hide('fast');
      $('#logic_menu').hide('fast');
      $('#document_area').show('fast');
      $('#presen_menu').show('fast');
      $('#preview_area').show('fast');

      Create_preview()

      //　マップ表示ボタンと三角ロジックボタンとシナリオボタンとプレビューボタンがオン（マップとシナリオとプレビューを表示）
    }
    else if (check.checked == true && pre_check.checked == true && map_check.checked == true){ // previewboxがチェックされている時の処理
      $('#jsmind_container').css('width', '25vw');
      $('#document_area').css('width', '27vw');
      $('#preview_area').css('width', 'calc(43vw - 350px)');

      $('#jsmind_container').show('fast');
      $('#document_area').show('fast');
      $('#preview_area').show('fast');

      $('#map_menu').show('fast');
      $('#presen_menu').show('fast');
      $('#preview_menu').show('fast');

      $('#preview_btn').show('fast');
      $('#plusmap_btn').show('fast');
      $('#finish1_btn').show('fast');
      

      Create_preview();

      const frame_dom = document.getElementsByClassName("inquiry_area");
      frame_dom[0].style.border = "solid 5px #ccc";
      showGeneration();

    }else{
      $('#jsmind_container').css('width','calc(100vw - 350px)');
      $('#map_menu').css('width','calc(100vw - 350px)');

      $('#jsmind_container').show('fast');
      $('#logic_area').hide('fast');
      $('#logic_menu').hide('fast');
      $('#document_area').hide('fast');
      $('#preview_area').hide('fast');

      $('#map_menu').show('fast');
      $('#presen_menu').hide('fast');
      $('#preview_menu').hide('fast');

      $('#preview_btn').hide('fast');
      $('#plusmap_btn').hide('fast');
      $('#finish1_btn').hide('fast');

  
      const frame_dom = document.getElementsByClassName("inquiry_area");
      frame_dom[0].style.border = "solid 5px #ccc";
      showGeneration();
    }
  } else if (modetype == 1){
    if(check.checked == true && pre_check.checked == false){ // checkboxがチェックされている時の処理
      $('#elab_jsmind_container').css('width','40vw');
      $('#elab_document_area').css('width','calc(60vw - 350px)');

      $('#elab_jsmind_container').show('fast');
      $('#elab_document_area').show('fast');
      $('#elab_preview_area').hide('fast');

      $('#preview_btn').show('fast');
      $('#plusmap_btn').hide('fast');

    }else if (check.checked == true && pre_check.checked == true && map_check.checked == false){ // previewboxがチェックされている時の処理
      $('#elab_document_area').css('width','45vw');
      $('#elab_preview_area').css('width','calc(55vw - 350px)');

      $('#elab_jsmind_container').hide('fast');
      $('#elab_document_area').show('fast');
      $('#elab_preview_area').show('fast');

      $('#preview_btn').show('fast');
      $('#plusmap_btn').show('fast');

    }else if (check.checked == true && pre_check.checked == true && map_check.checked == true){ // previewboxがチェックされている時の処理
      $('#elab_jsmind_container').css('width', '25vw');
      $('#elab_document_area').css('width', '27vw');
      $('#elab_preview_area').css('width', 'calc(43vw - 350px)');

      $('#elab_jsmind_container').show('fast');
      $('#elab_document_area').show('fast');
      $('#elab_preview_area').show('fast');

      $('#preview_btn').show('fast');
      $('#plusmap_btn').show('fast');

    }else{
      $('#elab_jsmind_container').css('width','calc(100vw - 350px)');

      $('#elab_jsmind_container').show('fast');
      $('#elab_document_area').hide('fast');
      $('#elab_preview_area').hide('fast');

      $('#preview_btn').hide('fast');
      $('#plusmap_btn').hide('fast');

    }    
  }
}

function show_mindmap(){
  $('#jsmind_container').show();
  $('#document_area').css('width','calc(100% - 350px - 40%)');
}

function hide_mindmap(){
  $('#jsmind_container').hide();
  $('#document_area').css('width','calc(100% - 340px)');
}

function Removeparagraph(data, b){
  if(b || window.confirm('本当にこの節を削除しますか？')){
    console.log(data);
    console.log(document.getElementById(data));
    console.log(target);
    Delete_paragraph(data);
    var node_array = $('#'+data).data('node_id');
    console.log(node_array);

    var jmnode = document.getElementsByTagName("jmnode");
    var arr = $('#'+data).data('node_id');//nodeidの配列
    console.log(arr);
    console.log(arr[0]);

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
    console.log(delete_topic);
    console.log($slide_topic);


    for(i=0; i<delete_topic.length; i++){
      for(j=0; j<$slide_topic.length; j++){
        if(delete_topic[i] == $slide_topic[j]){
          $slide_topic.splice(j,1);
          console.log(delete_topic[i]);
          break;
        }
      }
    }
    console.log($slide_topic);

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
    } else if(tmp_dom.getAttribute("concept_id") === "1519483811401_n426"){ //合理性ノード
      $.ajax({
        url: "php/fujinaka_rationality.php",
        type: "POST",
        data: { 
          type : "delete",
          rationality_id : tmp_dom.parentElement.id
        }
      });
    } else {
      $.ajax({
        url: "php/fujinaka_rationality.php",
        type: "POST",
        data: { 
          type : "delete",
          node_id : tmp_dom.parentElement.id
          }
      });
    }
    
    $('#'+data).fadeOut('fast').queue(function() {
      $('#'+data).remove();
    });
    console.log(typeof(data));
    Delete_content(data);
    
    // Record_rank();
  }
}

function Remove_Chapter(data){ //章削除fujinaka
  if(window.confirm('本当にこの章を削除しますか？')){
    console.log(data);
    console.log(document.getElementById(data));
    console.log(target);
    Delete_Chapter(data);
    
    const dataElement = document.getElementById(data);
    const section_dom = dataElement.getElementsByClassName("section");
    
    if (section_dom && section_dom.length > 0) {
      for(i=0; i<section_dom.length; i++){
        Remove_section(section_dom[i].id, true);
      }
    }

    $('#'+data).fadeOut('fast').queue(function() {
      $('#'+data).remove();
    });
  }
}

function Remove_section(data, b){ //節削除fujinaka
  if(b || window.confirm('本当にこの節を削除しますか？')){
    console.log(data);
    console.log(document.getElementById(data));
    console.log(target);
    Delete_section(data);
    
    const dataElement = document.getElementById(data);
    const paragraph_dom = dataElement.getElementsByClassName("thread");
    
    if (paragraph_dom && paragraph_dom.length > 0) {
      for(i=0; i<paragraph_dom.length; i++){
        Removeparagraph(paragraph_dom[i].id, true);
      }
    }

    $('#'+data).fadeOut('fast').queue(function() {
      $('#'+data).remove();
    });
  }
}




// 現在のマップを表示する
function ShowCurrentMap(){
  // CopyCurrentMap();
  $('#jsmind_container3').show();
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

  var prev_menu = document.getElementById('preview_conmenu');  //プレビューコンテキストメニュー
  var prev_area = document.getElementById('elab_preview_area');     //対象エリア

  // var elab_mm_menu = document.getElementById('elab_map_conmenu');  //コンテキストメニュー
	// var elab_mm_area = document.getElementById('elab_jsmind_container');     //対象エリア
  
	// var elab_chap_menu = document.getElementById('elab_chapter_conmenu');   //コンテキストメニュー
	// var elab_chap_area = document.querySelectorAll('.chapter.elab');   //対象エリア
  
	// var elab_sec_menu = document.getElementById('elab_section_conmenu');   //コンテキストメニュー
	// var elab_sec_area = document.querySelectorAll('.section.elab');    //対象エリア
  
	// var elab_para_menu = document.getElementById('elab_paragraph_conmenu'); //コンテキストメニュー
	// var elab_para_area = document.querySelectorAll('.paragraph.elab'); //対象エリア
  
	// var elab_con_menu = document.getElementById('elab_con_conmenu'); //コンテキストメニュー
	// var elab_con_area = document.querySelectorAll('.cspan.elab'); //対象エリア

  var body = document.body;                       //bodyエリア

  // マインドマップ上で右クリック時に独自コンテキストメニューを表示する
  mm_area.addEventListener('contextmenu',function(e){
    mm_menu.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
    mm_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    mm_menu.classList.add('on');
  });

  // プレビューエリア上で右クリック時に独自コンテキストメニューを表示する
  prev_area.addEventListener('contextmenu',function(e){
    prev_menu.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
    prev_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    prev_menu.classList.add('on');
  });

  // // 推敲時にマップ上で右クリック時に独自コンテキストメニューを表示する
  // elab_mm_area.addEventListener('contextmenu',function(e){
  //   elab_mm_menu.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
  //   elab_mm_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
  //   elab_mm_menu.classList.add('on');
  // });

  // // 推敲時に章の上で右クリック時に独自コンテキストメニューを表示する
  // // NodeListを配列に変換
  // var elab_chap_area_array = Array.from(elab_chap_area);
  // elab_chap_area_array.forEach(function(area) {
  //   area.addEventListener('contextmenu', function(e) {
  //     e.preventDefault(); // デフォルトの右クリックメニューを無効化

  //     // メニューの位置を設定
  //     elab_chap_menu.style.left = (e.pageX + 10) + 'px';
  //     elab_chap_menu.style.top = (e.pageY + 10) + 'px';

  //     // メニューを表示する
  //     elab_chap_menu.classList.add('on');

  //     // 右クリックされたエリアのIDなどの情報を取得する
  //     select_area_id = area.id;
  //     console.log(select_area_id);
  //   });
  // });

  // // 推敲時に節の上で右クリック時に独自コンテキストメニューを表示する
  // var elab_sec_area_array = Array.from(elab_sec_area);
  // elab_sec_area_array.forEach(function(area) {
  //   area.addEventListener('contextmenu', function(e) {
  //     e.preventDefault(); // デフォルトの右クリックメニューを無効化

  //     // メニューの位置を設定
  //     elab_sec_menu.style.left = (e.pageX + 10) + 'px';
  //     elab_sec_menu.style.top = (e.pageY + 10) + 'px';

  //     // メニューを表示する
  //     sec_chap_menu.classList.add('on');

  //     // 右クリックされたエリアのIDなどの情報を取得する
  //     select_area_id = area.id;
  //     console.log(select_area_id);
  //   });
  // });

  // // 推敲時にパラグラフの上で右クリック時に独自コンテキストメニューを表示する
  // var elab_para_area_array = Array.from(elab_para_area);
  // elab_para_area_array.forEach(function(area) {
  //   area.addEventListener('contextmenu', function(e) {
  //     e.preventDefault(); // デフォルトの右クリックメニューを無効化

  //     // メニューの位置を設定
  //     elab_para_menu.style.left = (e.pageX + 10) + 'px';
  //     elab_para_menu.style.top = (e.pageY + 10) + 'px';

  //     // メニューを表示する
  //     elab_para_menu.classList.add('on');

  //     // 右クリックされたエリアのIDなどの情報を取得する
  //     select_area_id = area.id;
  //     console.log(select_area_id);
  //   });
  // });

  // // 推敲時にパラグラフのノード上で右クリック時に独自コンテキストメニューを表示する
  // var elab_con_area_array = Array.from(elab_con_area);
  // elab_con_area_array.forEach(function(area) {
  //   area.addEventListener('contextmenu', function(e) {
  //     e.preventDefault(); // デフォルトの右クリックメニューを無効化

  //     // メニューの位置を設定
  //     elab_con_menu.style.left = (e.pageX + 10) + 'px';
  //     elab_con_menu.style.top = (e.pageY + 10) + 'px';

  //     // メニューを表示する
  //     elab_con_menu.classList.add('on');

  //     // 右クリックされたエリアのIDなどの情報を取得する
  //     select_area_id = area.id;
  //     console.log(select_area_id);
  //   });
  // });
  

  // 左クリック時に独自コンテキストメニューを非表示にする
  body.addEventListener('click',function(){
  //   if(doc_menu.classList.contains('on')){
  //     doc_menu.classList.remove('on');
  //   }
    if(mm_menu.classList.contains('on')){
      mm_menu.classList.remove('on');
    }
    if(prev_menu.classList.contains('on')){
      prev_menu.classList.remove('on');
    }
    // if(elab_mm_menu.classList.contains('on')){
    //   elab_mm_menu.classList.remove('on');
    // }
    // if(elab_chap_menu.classList.contains('on')){
    //   elab_chap_menu.classList.remove('on');
    // }    
    // if(elab_sec_menu.classList.contains('on')){
    //   elab_sec_menu.classList.remove('on');
    // }
    // if(elab_para_menu.classList.contains('on')){
    //   elab_para.classList.remove('on');
    // }
    // if(elab_con_menu.classList.contains('on')){
    //   elab_con.classList.remove('on');
    // }
  });

  Rebuild_title();

  Rebuild_chapter().then(() => {
    Rebuild_section().then(() => {
      Rebuild_paragraph().then(() => {
        Rebuild_content().then(() => {

          SetIndent();

          // Sortable.js
          new Sortable(document.querySelector('#chapter_area'), {
            handle: '.chapter', // ソートハンドルとなる要素を指定
            group: 'chapters', // グループ名を共有
            animation: 150,
            onEnd: function (evt) {
              var log = evt.from.children;
              console.log(log);
              Record_ChapterRank();
            }
          });
          document.querySelectorAll('.section_area').forEach(function(section) {
            new Sortable(section, {
              handle: '.section', // ソートハンドルとなる要素を指定
              group: 'sections', // グループ名を共有
              animation: 150,
              onEnd: function (evt) {
                var log = evt.from.children;
                console.log(log);
                Record_sectionRank();
              }
            });
          });
          document.querySelectorAll('.paragraph').forEach(function(paragraph) {
            new Sortable(paragraph, {
              handle: '.thread', // ソートハンドルとなる要素を指定
              group: 'paragraphs', // グループ名を共有
              animation: 150,
              onEnd: function (evt) {
                var log = evt.from.children;
                console.log(log);
                Record_paragraphRank();
              }
            });
          });
          document.querySelectorAll('.purpose').forEach(function(purpose) {
            new Sortable(purpose, {
              animation: 150,
              onEnd: function (evt) {
                var log = evt.from.children;
                console.log(log);
                Get_ContentRank();
              }
            });
          });
          console.log("ソート初期化");

          Rebuild_comment();
        });
      });
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
                    "</div>"+
                    "<br/>";
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
                        "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'></textarea>"+
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
                      "<textarea class='t_ad' placeholder='修正内容 OR 見直さない理由' style='width:600px; height:120px;'></textarea>"+
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
async function unconsidered_rationality_feedback(nodeid, node_c_id){ //マップで検討していない合理性の検討を促す助言

  const jmnode = document.getElementsByTagName("jmnode"); // FORESTにあるノード
  const jmnode_object = Array.prototype.slice.call(jmnode);

  const reflect_node = jmnode_object.filter(jmn => jmn.getAttribute("nodeid") === nodeid);

  console.log(reflect_node);

  var node_text = reflect_node[0].innerHTML;

  console.log(node_text);

  var considered_rationality_concept = "";
  
  // await $.ajax({

  //   url: "php/fujinaka_rationality.php",
  //   type: "POST",
  //   data: { 
  //     type : "concept",
  //     id : nodeid,
  //    },
  //     success: function(arr){
  //       if(arr == "[]"){
  //         console.log(arr);

  //       }else{
  //         console.log(arr);
  //         considered_rationality_concept = JSON.parse(arr);
  //         console.log(considered_rationality_concept);

  //       }
	//     },
  //     error:function(){
  //       console.log("エラーです");
  //     }
  // });   
  
  $.ajax({
    url: 'js/hozo.xml',
    type: 'get',
    dataType: 'xml',
    timeout: 1000,
    success: function(xml) {

      var feedback1 = [];

      $(xml).find('W_CONCEPTS').each(function(){
        //hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
        var $concept_tag = $(this).find('CONCEPT');
        var $label = $(this).find('LABEL');
        var $slot_tag = $(this).find('SLOT');
    
        for(var i=0; i<$label.length; i++){//オントロジーの個数分回す    
      
          //親概念のIDをもつタグを探索（親：言い換える，子：言い換えるとどうなりますか）
          if($concept_tag[i].id == node_c_id){//回ってきたコンセプトidが親のコンセプトidだった場合(チェックポイント)

            console.log($concept_tag[i].childNodes);

            for(var j=0; j<$concept_tag[i].childNodes.length; j++){
      
              if(j % 2 == 1){//jが奇数（textを除く）
      
                //親概念がもつ属性を取得
                $slot = $concept_tag[i].childNodes[j].getElementsByTagName('SLOT');

                for(var k = 0; k < $slot.length; k++){
                  if($slot[k].getAttribute('role') == "出力"){
                    var $reflect_concept = $slot[k].getAttribute('class_constraint');
                    console.log($reflect_concept);
                  }
                }
      
                for(var k=0; k<$slot.length; k++){
      
                  //サブ活動関連
                  if($slot[k].getAttribute('role') == "サブ活動" || "サブ認知活動" || "サブメタ認知活動"){
      
                    var $class_constraint = $slot[k].getAttribute('class_constraint');//発見したサブ活動のラベル名（実践の目的を考える）
      
                    for(var l=0; l<$label.length; l++){
      
                      if($label[l].nodeValue == $class_constraint){
    
                        var $inquiry_c_id = $concept_tag[l].id;//サブ活動（子）のidをゲット

                        if (!!(considered_rationality_concept)){
                          var isAlreadyProcessed = false;
                          for (let o = 0; o < considered_rationality_concept.length; o++) {
                            console.log(considered_rationality_concept[o].concept_id);
                              if ($inquiry_c_id == considered_rationality_concept[o].concept_id) {
                                  isAlreadyProcessed = true;
                                  break;
                              }
                          }
                          if (isAlreadyProcessed) {
                            console.log("out");
                            continue; // 次のループに進む
                          }
                        }

                        var $inquiry_constraint = $slot[l].getAttribute('class_constraint');

                        console.log($inquiry_constraint);

                        var feedback_id = getUniqueStr();
                        var quot_feedback_id = "\"" + feedback_id + "\"";

                        if($inquiry_constraint != "Any"){
                          var feedback_text1 = "<div id = "+ feedback_id +" class='feedback'>「<span id = " + nodeid + ">" + $reflect_concept + "</span>：『" + node_text + "』」を述べる際には,「" + $inquiry_constraint + "」との整合性を示す必要はないですか?<br><button onclick='Save_feedback(" + quot_feedback_id + ", 0)'>考える</button><button onclick='Save_feedback(" + quot_feedback_id + ", 1)'>考えない</button></div>";
                          feedback1.push(feedback_text1);
                        }

                      }
                    }
                  }
      
                  //入力のクラス制約を出力にもつ概念の問いを提示
                  if($slot[k].getAttribute('role') == "入力"){
      
                    var $class_constraint = $slot[k].getAttribute('class_constraint');
      
                    for(var l=0; l<$slot_tag.length; l++){
      
                      if($slot_tag[l].getAttribute('class_constraint') == $class_constraint){
      
                        if($slot_tag[l].getAttribute('role') == "出力"){

                          var $inquiry_c_id = $slot_tag[l].parentNode.parentNode.getAttribute("id");
                          console.log($inquiry_c_id);

                          if (!!(considered_rationality_concept)){
                            var isAlreadyProcessed = false;
                            for (let o = 0; o < considered_rationality_concept.length; o++) {
                                if ($inquiry_c_id == considered_rationality_concept[o].concept_id) {
                                    isAlreadyProcessed = true;
                                    break;
                                }
                            }
                            if (isAlreadyProcessed) {
                              console.log("out");
                              continue; // 次のループに進む
                            }
                          }

                          var $inquiry_slots = $slot_tag[l].parentNode;

                          
                          for (var m = 0; m<$inquiry_slots.children.length; m++){

                            if ($inquiry_slots.children[m].getAttribute('role') == "出力"){

                              var $inquiry_constraint = $inquiry_slots.children[m].getAttribute('class_constraint');
      
                              console.log($inquiry_constraint);

                              var feedback_id = getUniqueStr();
                              var quot_feedback_id = "\"" + feedback_id + "\"";

                              if($inquiry_constraint != "Any"){
                                var feedback_text2 = "<div id = "+ feedback_id +" class='feedback' >「<span id = " + nodeid + ">" + $reflect_concept + "</span>：『" + node_text + "』」を述べる際には,「" + $inquiry_constraint + "」との整合性を示す必要はないですか?<br><button onclick='Save_feedback(" + quot_feedback_id + ", 0)'>考える</button><button onclick='Save_feedback(" + quot_feedback_id + ", 1)'>考えない</button></div>";
                                feedback1.push(feedback_text2);
                              }
                                 
                            }
                          }

                        }
                      }
                    }

                  }
      
                  //出力のクラス制約を入力にもつ概念のインスタンスである問いを提示
                  if($slot[k].getAttribute('role') == "出力"){
      
                    var $class_constraint = $slot[k].getAttribute('class_constraint');
      
                    for(var l=0; l<$slot_tag.length; l++){
      
                      if($slot_tag[l].getAttribute('class_constraint') == $class_constraint){
      
                        if($slot_tag[l].getAttribute('role') == "入力"){

                          var $inquiry_c_id = $slot_tag[l].parentNode.parentNode.getAttribute("id");
                          console.log($inquiry_c_id);

                          if (!!(considered_rationality_concept)){
                            var isAlreadyProcessed = false;
                            for (let o = 0; o < considered_rationality_concept.length; o++) {
                                if ($inquiry_c_id == considered_rationality_concept[o].concept_id) {
                                    isAlreadyProcessed = true;
                                    break;
                                }
                            }
                            if (isAlreadyProcessed) {
                              console.log("out");
                              continue; // 次のループに進む
                            }
                          }

                          var $inquiry_slots = $slot_tag[l].parentNode;

                          
                          for (var m = 0; m<$inquiry_slots.children.length; m++){

                            if ($inquiry_slots.children[m].getAttribute('role') == "出力"){

                              var $inquiry_constraint = $inquiry_slots.children[m].getAttribute('class_constraint');
      
                              console.log($inquiry_constraint);

                              var feedback_id = getUniqueStr();
                              var quot_feedback_id = "\"" + feedback_id + "\"";

                              if($inquiry_constraint != "Any"){
                                var feedback_text3 = "<div id = "+ feedback_id +" class='feedback' >「<span id = " + nodeid + ">" + $reflect_concept + "</span>：『" + node_text + "』」を述べる際には,「" + $inquiry_constraint + "」との整合性を示す必要はないですか?<br><button onclick='Save_feedback(" + quot_feedback_id + ", 0)'>考える</button><button onclick='Save_feedback(" + quot_feedback_id + ", 1)'>考えない</button></div>";
                                feedback1.push(feedback_text3);
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
      });

      console.log(feedback1);

      $("#feedback_area").append(feedback1);

    },
    error: function(){
      console.log("エラーです");
    }
  });

}


async function unreflected_rationality_feedback(){ //シナリオに反映していない合理性の反映を促す助言
  const jmnode = document.getElementsByTagName("jmnode"); // FORESTにあるノード
  const jmnode_object = Array.prototype.slice.call(jmnode);
  const scenode = document.getElementsByClassName("cspan"); // シナリオにあるノード
  const scenode_object = Array.prototype.slice.call(scenode);

  var used_id = [];

  await $.ajax({

		url: "php/fujinaka_rationality.php",
		type: "POST",
		data: { 
			type : "get_nodeid",
		},
		success: function(arr){
			if(arr == "[]"){
				console.log(arr);
			}else{
				console.log(arr);
				var parse = JSON.parse(arr);
	
				console.log(parse);
				
				for(var i=0; i<parse.length; i++){
					used_id.push(parse[i].id);				
				}
			}

		},
		error: function(){
			console.log("ajaxエラー");
		}

	});
  
  const difference_rationality = jmnode_object.filter(jmn => {
    if(jmn.getAttribute("type") !== "answer" ||  // 答えノードであり(問いの部分はシナリオには必ずしも必須ではないのではないかと考えてフィルタ)，かつ
      jmn.getAttribute("concept_id") !== "1519483811401_n426") return false; // 合理性ノードではないものは無視
    // シナリオの中に入っているかどうかをチェック
    const isInScenario = scenode_object.some(sce => {
      return jmn.getAttribute("nodeid") === sce.getAttribute("node_id");
    });

    // シナリオの中に入っている場合はfalseを返す
    if(isInScenario) return false;

    // used_id配列に含まれていないjmnode_object要素のみを選択
    return !used_id.includes(jmn.getAttribute("nodeid"));
  });

  console.log(difference_rationality);

  var feedback2 =[];

  for (let i = 0; i < difference_rationality.length; i++) {

    let dif_node = difference_rationality[i];

    await $.ajax({

      url: "php/fujinaka_rationality.php",
      type: "POST",
      data: { 
        type : "id",
        id : difference_rationality[i].getAttribute("nodeid"),
        nodetype : "answer"
       },
      success: function(arr){
        if(arr == "[]"){
          console.log(arr);
        }else{
          console.log(arr);
          var parse = JSON.parse(arr);

          console.log(parse);

          const rationality_parent_node = jmnode_object.filter(jmn => {
            // parseの各要素のidプロパティとノードのnodeid属性を比較し、一致するものをフィルタリング
            return parse.some(item => item.id === jmn.getAttribute("nodeid"));
          });

          const parent_concept_id = rationality_parent_node.map(pare => pare.getAttribute("concept_id"));

          console.log(rationality_parent_node);

          console.log(parent_concept_id);

          var feedback_id = getUniqueStr();
          var quot_feedback_id = "\"" + feedback_id + "\"";

          var feedback_text4 = "<div id = "+ feedback_id +" class='feedback'>";

           $.ajax({
            url: 'js/hozo.xml',
            type: 'get',
            dataType: 'xml',
            timeout: 1000,
            success: function(xml) {

              $(xml).find('W_CONCEPTS').each(function(){
                var $concept_tag = $(this).find('CONCEPT');
                var $label = $(this).find('LABEL');

                for(var pp = 0; pp < parent_concept_id.length; pp++){
                  for(var i = 0; i < $label.length; i++){

                    if($concept_tag[i].id == parent_concept_id[pp]){

                      $slot = $concept_tag[i].getElementsByTagName('SLOT');
                      for(var j = 0; j < $slot.length; j++){
                        if($slot[j].getAttribute('role') == "出力"){

                          var $parent_concept = $slot[j].getAttribute('class_constraint');
                          console.log(rationality_parent_node[pp].id , rationality_parent_node[pp].innerHTML);
                          feedback_text4 += "「<span id = " + rationality_parent_node[pp].id + ">" + $parent_concept + "</span>：『" + rationality_parent_node[pp].innerHTML + "』」";
                          console.log(feedback_text4);
                        }
                      }
                    }
                  }
                }

                console.log(difference_rationality[i]);

                feedback_text4 += "が整合していると考える理由：『<span id = " + dif_node.id + ">" + dif_node.innerHTML + "</span>』をシナリオに反映する必要はないですか?<br><button onclick='Save_feedback(" + quot_feedback_id + ", 0)'>考える</button><button onclick='Save_feedback(" + quot_feedback_id + ", 1)'>考えない</button></div>";

                console.log(feedback_text4);
                $("#feedback_area").append(feedback_text4);
                feedback2.push(feedback_text4);

              });
            },
            error: function(){
              console.log("エラーです");
            }
          });
        }
	    },
      error:function(){
        console.log("エラーです");
      }
  });
  }

  console.log(feedback2);

  $("#feedback_area").append(feedback2);

}

async function influence_feedback(v_id, n_id){

  var other_id = [];
  var other_content = [];

  var csnode = document.getElementsByTagName("cspan"); 
  const csnode_object = Array.prototype.slice.call(csnode);

  await $.ajax({

		url: "php/fujinaka_rationality.php",
		type: "POST",
		data: { 
			type : "other_id",
      node_id : n_id
		},
		success: function(arr){

			var parse = JSON.parse(arr);
			console.log(parse);

      other_id = parse;

		},
		error: function(){
		console.log("ajaxエラー");

		}

	});

  for (let i = 0; i < other_id.length; i++) {

    await $.ajax({

      url: "php/version_rebuild.php",
      type: "POST",
      data: { 
        val : "influence",
        version_id : v_id,
        node_id : other_id[i].node_id
      },
      success: function(arr){
  
        var parse = JSON.parse(arr);
        console.log(parse);

        other_content = parse;
  
      },
      error: function(){
      console.log("ajaxエラー");
  
      }
  
    });
  }

  const filtered_cspans = csnode_object.filter(cs => cs.getAttribute("node_id") == other_id.nodeid && cs.textContent == other_content.content);


  for (let i = 0; i < filtered_cspans.length; i++) {
    var feedback_id = getUniqueStr();
    var quot_feedback_id = "\"" + feedback_id + "\"";
    var feedback_text5 = "<div id = "+feedback_id+" class='feedback'>修正に伴い：『<span id = " + filtered_cspans[i].getAttribute("node_id") + ">" + filtered_cspans[i].innerHTML + "</span>』と齟齬が生じていないか考える必要はないですか?<br><button onclick='Save_feedback(" + quot_feedback_id + ", 0)'>考える</button><button onclick='Save_feedback(" + quot_feedback_id + ", 1)'>考えない</button></div>";
    $("#feedback_area").append(feedback_text5);
  }

}

function Save_feedback(feedbackId, answer){

  var feedback_dom = document.getElementById(feedbackId);

  var divText = feedback_dom.textContent;

  var divText = divText.replace(/(考える考えない)/, '');

  console.log(divText);

  var spanElements = feedback_dom.querySelectorAll('span');

  if (spanElements.length == 1) {
    var spanId = spanElements[0].id;
    var spanText = spanElements[0].textContent.trim();

    $.ajax({

      url: "php/feedback_insert.php",
      type: "POST",
      data: {
        feedback_id : feedbackId,
        node_id : spanId,
        node_concept : spanText,
        content : divText,
        feedback_status : answer
      },
      success: function () {
        console.log("フィードバック回答保存成功：　" +feedbackId );
      },
      error: function () {
      console.log("フィードバック回答保存失敗");},
    });

  } else if(spanElements.length > 1){

    for (let i = 0; i < spanElements.length; i++) {
      var spanId = spanElements[i].id;
      var spanText = spanElements[i].textContent.trim();

      if (i == spanElements.length - 1){
        
        $.ajax({

          url: "php/feedback_insert.php",
          type: "POST",
          data: {
            feedback_id : feedbackId,
            node_id : spanId,
            node_concept : spanText,
            content : "考えた合理性",
            feedback_status : answer
          },
          success: function () {
            console.log("フィードバック回答保存成功：　" +feedbackId );
          },
          error: function () {
          console.log("フィードバック回答保存失敗");},
        });

      } else{
            
        $.ajax({

          url: "php/feedback_insert.php",
          type: "POST",
          data: {
            feedback_id : feedbackId,
            node_id : spanId,
            node_concept : spanText,
            content : divText,
            feedback_status : answer
          },
          success: function () {
            console.log("フィードバック回答保存成功：　" +feedbackId );
          },
          error: function () {
          console.log("フィードバック回答保存失敗");},
        });

      }
    }

  } else {
    console.log("span要素が見つかりませんでした。");
  }

  $(feedback_dom).fadeOut('fast').queue(function() {
    $(feedback_dom).remove();
  });

}

//----