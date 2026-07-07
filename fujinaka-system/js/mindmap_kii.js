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



function mouseoverNode(jmnodes=document.querySelectorAll('jmnode')){
    console.log(jmnodes);
    jmnodes.forEach(function(jmnode) {
        var s = parseInt(jmnode.getAttribute('start_char_id'));
        var e = parseInt(jmnode.getAttribute('end_char_id'));
        var highlighted = "highlighted";

        jmnode.addEventListener('mouseover', function() {// クラスを追加
            for(let count=0; count <= (e - s); count++){
                let char_id = s + count; 
                let char_id_txt = 'p_txt_'+char_id;  
                addHightlightHover(char_id_txt, highlighted); 
                console.log(count);
            }
            
        });

        jmnode.addEventListener('mouseout', function() {
            for(let count=0; count <= (e - s); count++){
                let char_id = s + count; 
                let char_id_txt = 'p_txt_'+char_id;  
                removeHightlightHover(char_id_txt, highlighted); 
            }
        });
        jmnode.addEventListener('mouseout', function() {
            
        });


        if (!isNaN(s)){
            if (jmnode)
            jmnode.attributes.style.nodeValue += "border: solid blue 5px";
        }
    });
}
//
function open_empty(){

    var options = {
        container:'jsmind_container',
        // theme:'nephrite',
        editable:true
    }

    _jm = new jsMind(options);
    _jm.show();

}

function open_empty2(){

    var options = {
        container:'jsmind_container2',
        // theme:'nephrite',
        editable:false
    }

    _jm2 = new jsMind(options);
    _jm2.show();

}
// function open_empty3(){

//     var options = {
//         container:'jsmind_container3',
//         // theme:'nephrite',
//         editable:true
//     }

//     _jm = new jsMind(options);
//     _jm.show();

// }

open_empty();
// open_empty3();


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
function show_node(id,pid,str,cid,type,cname, sid, eid){

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
            jmnode[i].setAttribute("start_char_id",sid);
            jmnode[i].setAttribute("end_char_id",eid);

        }

    }
    // set_countlimited();

}

function show_node2(id,pid,str,cid,type,cname, sid, eid, psid){

    var i;
    //add_nodeでデータを格納
    var node = _jm2.add_node(pid,id,str);

    var jmnode = document.getElementsByTagName("jmnode");

    for(i=0; i<jmnode.length; i++){

        if(id == jmnode[i].getAttribute("nodeid")){

            jmnode[i].setAttribute("concept_id",cid);
            jmnode[i].setAttribute("type",type);
            jmnode[i].className = cname;
            jmnode[i].setAttribute("parent_id",pid);
            jmnode[i].setAttribute("start_char_id",sid);
            jmnode[i].setAttribute("end_char_id",eid)
            jmnode[i].setAttribute("parent_map_id",psid);;

        }

    }

}




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
                              "toi",
                              jsMind.util.uuid.newid()
                             );

             Record_activities(thisId,
                                parent_id,
                                "edit",
                                jmnode[i].innerHTML,
                                jmnode[i].getAttribute("concept_id"),
                                "toi",
                                jsMind.util.uuid.newid()
                               );

        }

    }
    if (window.getSelection().anchorNode != null){
        if (window.getSelection().anchorNode.parentElement.getAttribute("char_id") != null){
            add_annotation("toi", thisId);
            mouseoverNode();
          }
      }
    

    
    // 以下予測ノード追加nishida
    

    // 以下，子ノードとして予測ノード追加 nishida
    var parent_id = thisId; //追加した問いノード
    var nodeid = jsMind.util.uuid.newid();//idの生成
    var topic = '＊あなたの解釈';
    var node = _jm.add_node(parent_id, nodeid, topic);

    var jmnode = document.getElementsByTagName("jmnode");
	var p_concept = parent_concept_id;


    for(var j=0; j<jmnode.length; j++){

        if(nodeid == jmnode[j].getAttribute("nodeid")){

            jmnode[j].setAttribute("concept_id",p_concept);
            jmnode[j].setAttribute("type","predict");
            jmnode[j].setAttribute("parent_id",parent_id);

            $.ajax({

                url: "php/insert_node.php",
                type: "POST",
                data: { insert : "node",
                        id : nodeid,
                        parent_id : parent_id,
                        type : "predict",
                        concept_id : p_concept,
                        x : jmnode[j].style.left,
                        y : jmnode[j].style.top,
                        content : jmnode[j].innerHTML,
                        class : "" },

            });

            //yoshioka登録　追加ボタンより答えを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(nodeid,
                              parent_id,
                              "add",
                              jmnode[j].innerHTML,
                              p_concept,
                              "predict",
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




//答えノード追加ボタンで答えノードを追加する
function add_Anode_parentid(parent_id){
    
   
    var parent_id = parent_id;
    var nodeid = jsMind.util.uuid.newid();//idの生成
    // console.log("node");
    // console.log(nodeid);
    var topic = '＊あなたの解釈';
    let obj ={};
    let array = [];
    obj.index = nodeid;
    obj.id = parent_id;
    array.push(obj);
    console.log(array);
    // nishida わからない
    var node = _jm.add_node(parent_id, nodeid, topic);
    console.log("node");
    console.log(node);

    var jmnode = document.getElementsByTagName("jmnode");

    for(var i=0; i<jmnode.length; i++){

        if(parent_id == jmnode[i].getAttribute("nodeid")){

            var p_concept = jmnode[i].getAttribute("concept_id");

        }

    }

    for(var j=0; j<jmnode.length; j++){

        if(nodeid == jmnode[j].getAttribute("nodeid")){

            console.log(p_concept);

            console.log("parent_id");
            console.log(parent_id);

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






//問いノード追加ボタンで問いノードを追加する
function add_Qnode(){

    var parent_node = _jm.get_selected_node();

    for(key in parent_node){

        if(key == "id"){

            var parent_id = parent_node[key];

        }

    }

    var nodeid = jsMind.util.uuid.newid();//idの生成
    var topic = 'New Node';
    var node = _jm.add_node(parent_node, nodeid, topic);
    console.log(jmnode)

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
                        class : "" 
                    },

            });

            //yoshioka登録　追加ボタンより自作の問いを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(nodeid,
                              parent_id,
                              "add",
                              jmnode[i].innerHTML,
                              jmnode[i].getAttribute("concept_id"),
                              "toi",
                              jsMind.util.uuid.newid()
                             );



        }

    }

    $.ajax({

        url: "php/update_node.php",
        type: "POST",
        data: { update : "map" }

    });
    if (window.getSelection().anchorNode != null){
        if (window.getSelection().anchorNode.parentElement.getAttribute("char_id") != null){
            mouseoverNode();
    }
      }

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



//答えノード追加ボタンで答えノードを追加する node_typeの例 "answer"
function add_Anode(node_class, node_type){

    var selected_node = _jm.get_selected_node();

    for(key in selected_node){

        if(key == "id"){

            var parent_id = selected_node[key];

        }

    }

    var nodeid = jsMind.util.uuid.newid();//idの生成
    var topic = 'New Node';
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
            jmnode[j].setAttribute("class",node_class);
            jmnode[j].setAttribute("type",node_type);
            jmnode[j].setAttribute("parent_id",parent_id);

            $.ajax({

                url: "php/insert_node.php",
                type: "POST",
                data: { insert : "node",
                        id : nodeid,
                        parent_id : parent_id,
                        type : node_type,
                        concept_id : p_concept,
                        x : jmnode[j].style.left,
                        y : jmnode[j].style.top,
                        content : jmnode[j].innerHTML,
                        class : node_class },

            });

            //yoshioka登録　追加ボタンより答えを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(nodeid,
                              parent_id,
                              "add",
                              jmnode[j].innerHTML,
                              p_concept,
                              node_type,
                              jsMind.util.uuid.newid()
                             );



        }

    }

    $.ajax({

        url: "php/update_node.php",
        type: "POST",
        data: { update : "map" }

    });
   
    if (window.getSelection().anchorNode != null){
        if (window.getSelection().anchorNode.parentElement.getAttribute("char_id") != null){
            mouseoverNode();
          }
      }
}

//答えノードのショートカット
// $(window).keydown(function(e){

//     if(event.shiftKey){

//       if(e.keyCode === 65){

//         add_Anode("","answer");

//         return false;
//       }

//     }

// });

//答えノード追加ボタンで答えノードを追加する
function add_Pnode(){

    var selected_node = _jm.get_selected_node();

    for(key in selected_node){

        if(key == "id"){

            var parent_id = selected_node[key];

        }

    }

    var nodeid = jsMind.util.uuid.newid();//idの生成
    var topic = '＊あなた';
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
            jmnode[j].setAttribute("type","predict");
            jmnode[j].setAttribute("parent_id",parent_id);

            $.ajax({

                url: "php/insert_node.php",
                type: "POST",
                data: { insert : "node",
                        id : nodeid,
                        parent_id : parent_id,
                        type : "predict",
                        concept_id : p_concept,
                        x : jmnode[j].style.left,
                        y : jmnode[j].style.top,
                        content : jmnode[j].innerHTML,
                        class : "" },

            });

            //yoshioka登録　追加ボタンより答えを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(nodeid,
                              parent_id,
                              "add",
                              jmnode[j].innerHTML,
                              p_concept,
                              "predict",
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

//答えノードのショートカット
$(window).keydown(function(e){

    if(event.shiftKey){

      if(e.keyCode === 80){

        add_Pnode();

        return false;
      }

    }

});





//批評ノードを自動追加する
function add_Cnode_parentid(parent_id,node_type){


    
    var parent_id = parent_id;
    var nodeid = jsMind.util.uuid.newid();//idの生成
    var topic = '<select name="change_criticism2" id="s_criticism_node2"><optgroup label="批評の観点（タグ）付与"><option value="criticism">批評の観点追加</option>          <option value="evaluation">価値判断</option><optgroup label="----L評価"><option value="e_1">---L有用性</option><option value="e_2">---L新規性</option> <option value="e_3">---L信頼性</option>                   </optgroup>              <option value="objection">意見</option> <optgroup label="----L意見"> <option value="o_1">---L反論</option><option value="o_2">---L改善策</option><option value="o_3">---L代替案</option></optgroup><option value="modification">問題点</option><optgroup label="----L問題点"><option value="m_1">---L語の妥当性</option><option value="m_2">---L証拠の十分生</option><option value="m_3">---L論理の整合性</option></optgroup></optgroup></select>'
    console.log(topic);
    var node = _jm.add_node(parent_id, nodeid, topic);

    var jmnode = document.getElementsByTagName("jmnode");

    for(var i=0; i<jmnode.length; i++){

        if(parent_id == jmnode[i].getAttribute("nodeid")){

            var p_concept = jmnode[i].getAttribute("concept_id");

        }

    }
    change_select_Cnode("add", nodeid);

    for(var j=0; j<jmnode.length; j++){

        if(nodeid == jmnode[j].getAttribute("nodeid")){

            jmnode[j].setAttribute("concept_id",p_concept);
            jmnode[j].setAttribute("class","criticism");
            jmnode[j].setAttribute("type",node_type);
            jmnode[j].setAttribute("parent_id",parent_id);

            $.ajax({

                url: "php/insert_node.php",
                type: "POST",
                data: { insert : "node",
                        id : nodeid,
                        parent_id : parent_id,
                        type : node_type,
                        concept_id : p_concept,
                        x : jmnode[j].style.left,
                        y : jmnode[j].style.top,
                        content : jmnode[j].innerHTML,
                        class : "criticism" },

            });

            //yoshioka登録　追加ボタンより答えを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(nodeid,
                              parent_id,
                              "add",
                              jmnode[j].innerHTML,
                              p_concept,
                              node_type,
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



//批評ノード追加ボタンで批評ノードを追加する
function add_Cnode(node_type){

    var selected_node = _jm.get_selected_node();

    for(key in selected_node){

        if(key == "id"){

            var parent_id = selected_node[key];

        }

    }
    topic = '<select name="change_criticism2" id="s_criticism_node2"><optgroup label="批評の観点（タグ）付与"><option value="criticism">批評の観点追加</option>          <option value="evaluation">価値判断</option><optgroup label="----L評価"><option value="e_1">---L有用性</option><option value="e_2">---L新規性</option> <option value="e_3">---L信頼性</option>                   </optgroup>              <option value="objection">意見</option> <optgroup label="----L意見"> <option value="o_1">---L反論</option><option value="o_2">---L改善策</option><option value="o_3">---L代替案</option></optgroup><option value="modification">問題点</option><optgroup label="----L問題点"><option value="m_1">---L語の妥当性</option><option value="m_2">---L証拠の十分生</option><option value="m_3">---L論理の整合性</option></optgroup></optgroup></select>'

    var nodeid = jsMind.util.uuid.newid();//idの生成
   
    var node = _jm.add_node(selected_node, nodeid, topic);

    var jmnode = document.getElementsByTagName("jmnode");

    for(var i=0; i<jmnode.length; i++){

        if(parent_id == jmnode[i].getAttribute("nodeid")){

            var p_concept = jmnode[i].getAttribute("concept_id");

        }

    }
    change_select_Cnode("add", nodeid);

    for(var j=0; j<jmnode.length; j++){

        if(nodeid == jmnode[j].getAttribute("nodeid")){

            jmnode[j].setAttribute("concept_id",p_concept);
            jmnode[j].setAttribute("class","criticism");
            jmnode[j].setAttribute("type",node_type);
            jmnode[j].setAttribute("parent_id",parent_id);

            $.ajax({

                url: "php/insert_node.php",
                type: "POST",
                data: { insert : "node",
                        id : nodeid,
                        parent_id : parent_id,
                        type : node_type,
                        concept_id : p_concept,
                        x : jmnode[j].style.left,
                        y : jmnode[j].style.top,
                        content : jmnode[j].innerHTML,
                        class : "criticism" },

            });

            //yoshioka登録　追加ボタンより答えを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(nodeid,
                              parent_id,
                              "add",
                              jmnode[j].innerHTML,
                              p_concept,
                              node_type,
                              jsMind.util.uuid.newid()
                             );



        }

    }

    $.ajax({

        url: "php/update_node.php",
        type: "POST",
        data: { update : "map" }

    });
    if (window.getSelection().anchorNode != null){
        if (window.getSelection().anchorNode.parentElement.getAttribute("char_id") != null){
            add_annotation("criticism", nodeid);
            mouseoverNode();
          }
      }

}


//批評ノードのショートカット
$(window).keydown(function(e){

    if(event.shiftKey){

      if(e.keyCode === 67){

        add_Cnode("criticism");

        return false;
      }

    }

});



//ノード削除
function remove_node(){

    var selected_id = get_selected_nodeid();
    console.log()

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
        data: { update : "map" }

    });

        //nishida
        // annotationリストから同じノードidを持つannotationの先頭のpaper_t_idを取得
        const filterdAnnotations = annotations.filter((annotation) => {
            return annotation.node_id == selected_id;
            // nishida　見つけれん勝った時用になにか必要あるかも　https://cpoint-lab.co.jp/article/202010/17597/
    
        });

        annotations = annotations.filter((annotation) => {
            return annotation.node_id != selected_id;
            // nishida　見つけれん勝った時用になにか必要あるかも　https://cpoint-lab.co.jp/article/202010/17597/
    
        });


        const removeAnnotationSentences = (remove_list) => {
            remove_list.forEach((obj, index) => {
                for(let count=0; count <= (obj.end_char_id - obj.start_char_id); count++){
                    let char_id = obj.start_char_id + count;
                    const object_elm = $("span[char_id='p_txt_"+char_id+"']");
                    if(object_elm !== null){
                        object_elm.removeAttr('type');
                    }
                }

                $.ajax({

                    url: "php/update_anno.php",
                    type: "POST",
                    data: { 
                        // update : "delete",
                            id : obj.id },
                });

            });
        };
        
        removeAnnotationSentences(filterdAnnotations);




        




}

var rationality_mode = false;


//合理性の問いをクリックした時に，マップ上のどのノード間の合理性を考えたのかをハイライトする
//yoshioka バグ？
function checkRationality(nodeid,color){
    // nodeid2 = Number(nodeid);
    // console.log(typeof(nodeid));
    // nodeidは選択したノードのid

    $.ajax({

        url: "php/get_relationally.php",
        type: "POST",
        data: { val : "rationality",
                rationality_id : nodeid, },
        success: function(arr){

            var parse = JSON.parse(arr);

            var jmnode = document.getElementsByTagName("jmnode");

            for(i=0; i<parse.length; i++){

                for(j=0; j<jmnode.length; j++){

                    if(parse[i] == jmnode[j].getAttribute("nodeid")){
                    //   console.log("成功はしている？");
                    //   console.log(parse[i]);
                    //   console.log(jmnode[j]);

                        jmnode[j].style.backgroundColor = color;
                        // "#9fd94f"
                        // "#ff69b4"

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
function check_edit_reason(id){

    $("#reason").html("");

    $.ajax({

        url: "php/get_data.php",
        type: "POST",
        data: { val : "edit_reason",
                id : id },
        success: function(arr){

            if(arr.length != 2){//2は[]←この2文字

                var parse = JSON.parse(arr);

                var textarea = document.createElement("textarea");
                textarea.id = "textarea";
                textarea.name = "textarea";
                textarea.innerHTML = parse;
                reason.appendChild(textarea);

                var button = document.createElement("button");
                button.className = "button4";
                button.innerHTML = "決定";
                button.onclick = send_reason;
                reason.appendChild(button);

            }

        }

    });

}



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

function zoomIn2() {
    if (_jm2.view.zoomIn()) {
        zoomOutButton.disabled = false;
    } else {
        zoomInButton.disabled = true;
    };
};

function zoomOut2() {
    if (_jm2.view.zoomOut()) {
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
//   $('#mind').hide();
}

function change_mindmap_mode(){
  $('#mind').show();
  $('#document').hide();
}

// 文書化モードを切り替えたときの動作
function CheckClick(){
  // checkboxの状態を取得
  check = document.getElementById("checkbox");
  // checlboxがチェックされている時の処理
  if(check.checked == true){
    $('#jsmind_area').css('width','60%');
    $('#jsmind_area').css('border-right','solid #F6D4D8 5px');
    $('#jsmind_area').css('box-sizing', 'border-box');
    // $('#mind').hide();
    // $('#mind').toggle('fast');
    $('#mind').css('display','flex');
    $('#document_area').css('width','40%');
    $('#document_area').css('position','relative');
    $('#document_area').toggle('fast');
    // $('.changemode_button').toggle('fast');
  }
  else{
    $('#jsmind_area').css('width','100%');
    $('#document').hide();
    $('#mind').show();
    $('#document_area').toggle('fast');
    // $('.changemode_button').toggle('fast');
  }
}
  
  // 西田
  function show_mindmap(){
      $('#jsmind_container').show();
      $('#document_area').css('width','calc(100% - 350px - 40%)');
    }
    
    function hide_mindmap(){
        $('#jsmind_container').hide();
        $('#document_area').css('width','calc(100% - 340px)');
    }
    
    function RemoveThread(data){
        $('#'+data).fadeOut('fast').queue(function() {
            $('#'+data).remove();
        });
    }
    
    function RemoveStatement(data){
        $('#'+data).fadeOut('fast').queue(function() {
            $('#'+data).remove();
        });
    }
    
    // -----------------------------------------他者とのマップ比較でのエリア表示ボタン-----------------------
    // 現在のマップを表示する
    function ShowCurrentMap(){

        CopyCurrentMap();
        addHightlightSentences2(annotations,"user_m");
        $('#jsmind_container3').show();
        // $('#jsmind_container2').css('width','calc(100vw - 350px - 30.5vw)');
        $('#jsmind_container2').css('width','35%');
    }
    // nishida
    // 現在のマップを隠す
    function HideCurrentMap(){
        $('#jsmind_container3').hide();
        $('#jsmind_container2').show();
        $('#jsmind_container2').css('width','calc(115vw - 350px - 30.5vw)');
        // $('#jsmind_container2').css('width','calc(100vw - 350px)');
    }
    function show_otherMap(){
        $('#jsmind_container2').css('width','calc(100vw)');
        
    }

    function show_paper(){
       
        
        $('#jsmind_container2').css('width','35%');
        $('#paper_area').show();
        Rebuild_paper2("paper_area",map_id_tmp);
    };

    function hide_paper(){
        $('#jsmind_container2').show();
        $('#paper_area').toggle('fast');
        $('#jsmind_container2').css('width','calc(115vw - 350px - 30.5vw)');
    };
    
    
// ------------------------------------------------------------------------------------------------


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
    Rebuild_paper("document_area");

 
  var doc_menu = document.getElementById('document_conmenu');  //独自コンテキストメニュー
  var doc_area = document.getElementById('document_area');     //対象エリア

  var mm_menu = document.getElementById('mindmap_conmenu');
  var mm_menu_other = document.getElementById('mindmap_conmenu');   //独自コンテキストメニュー
  var mm_menu2 = document.getElementById('mindmap_conmenu2');  //独自コンテキストメニュー
  var mm_area = document.getElementById('jsmind_container');  
  var mm_area2 = document.getElementById('jsmind_container2');   //対象エリア
  var body = document.body;                       //bodyエリア
  
  // 文書化エリアで右クリック時に独自コンテキストメニューを表示する
  doc_area.addEventListener('contextmenu',function(e){
    doc_menu.style.left = (e.pageX - document.body.scrollLeft - 10) + 'px';
    doc_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    doc_menu.classList.add('on');
  });

  doc_area.addEventListener('contextmenu',function(e){
    doc_menu.style.left = (e.pageX - document.body.scrollLeft - 10) + 'px';
    doc_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    doc_menu.classList.add('on');
  });

  doc_area.addEventListener("mouseup", function() {
    if (isTextSelected()) {
        show_other_mindmap_anno();
    }
  });

function isTextSelected() {
    const selection = window.getSelection();
    return selection.toString().length > 0;
}
  // マインドマップ上で右クリック時に独自コンテキストメニューを表示する
  mm_area.addEventListener('contextmenu',function(e){
    mm_menu.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
    mm_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    mm_menu.classList.add('on');

    if(mm_menu2.classList.contains('on')){
    mm_menu2.classList.remove('on');
    }
  });



  // 左クリック時に独自コンテキストメニューを非表示にする
  body.addEventListener('click',function(){
    if(doc_menu.classList.contains('on')){
      doc_menu.classList.remove('on');
    }
    if(mm_menu.classList.contains('on')){
      mm_menu.classList.remove('on');
    }

  });




  var pap_menu = document.getElementById('paper_conmenu');  //独自コンテキストメニュー
  var pap_area = document.getElementById('paper_area');     //対象エリア

  var mm_menu_s = document.getElementById('mindmap_conmenu_someone');  //他者のマインドマップメニュー
  var mm_menu_m = document.getElementById('mindmap_conmenu_my');  //独自コンテキストメニュー
  var mm_area_s = document.getElementById('jsmind_container2');     //対象エリア
  var mm_area_m = document.getElementById('jsmind_container3');     //対象エリア

  var oq_menu = document.getElementById('other_conmenu');
  var oq_area = document.getElementById('result'); 

  var body = document.body;    
  
   // 論文エリアで右クリック時に独自コンテキストメニューを表示する
   pap_area.addEventListener('contextmenu',function(e){
    pap_menu.style.left = (e.pageX - document.body.scrollLeft - 10) + 'px';
    pap_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    pap_menu.classList.add('on');
  });

  // 他者のマインドマップ上で右クリック時に独自コンテキストメニューを表示する
  mm_area_s.addEventListener('contextmenu',function(e){
    oq_menu.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
    oq_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    oq_menu.classList.add('on');
    console.log("click");

  });
  // 自分のマインドマップ上で右クリック時に独自コンテキストメニューを表示する

    // 左クリック時に独自コンテキストメニューを非表示にする
    body.addEventListener('click',function(){
        
        if(pap_menu.classList.contains('on')){
        pap_menu.classList.remove('on');
        }

        if(mm_menu_s.classList.contains('on')){
        mm_menu_s.classList.remove('on');
        }

        if(oq_menu.classList.contains('on')){
            oq_menu.classList.remove('on');
            }
      
  
    });





}

function show_area(area){
    $(area).css("display", "flex");
    $("#comment_button").css("display", "flex");
    
}

function toggleImage() {
    var sw = document.getElementById("floatingImage");
    if (sw.style.display === "none" || sw.style.display === "") {
        $("#floatingImage").css("display", "block");
    } else {
        $("#floatingImage").css("display", "none");
    }
}

function br_intoNode(text, count) {
    let result = '';
    for (let i = 0; i < text.length; i += count) {
        result += text.slice(i, i + count);
        if (i + count < text.length) {
            result += '<br>';
        }
        console.log(result);
        console.log(i, i+count);
    }
    return result;
}

function set_countlimited(){
    let jmNodes = document.querySelectorAll('jmnode');

    // 各 jmnode 要素の innerHTML に関数を適用
    jmNodes.forEach(function(node) {
        node.innerHTML = br_intoNode(node.innerHTML, 20); // 20は例として指定した区切りの数
    });
}
