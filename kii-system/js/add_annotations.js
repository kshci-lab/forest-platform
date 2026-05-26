// アノテーションする文章の文字データを格納するjson
let annotations=[]; //annotation_text_object
let obj={};

function Rebuild_paper(area_id){
    $.ajax({
        url: "php/paper_rebuild.php",
        type: "POST",
        success: function(paper){
        
            var area = document.getElementById(area_id);
            $('#'+ area_id ).empty();
            var span = document.createElement('span'); // 改行はいやなのでspan
            span.setAttribute('id', 'rebuild');
            span.innerHTML = paper; //html要素に変換   
            area.append(span); //document_areaに追加

            Rebuild_annotation(); //アノテーションも再現する
        },
        error:function(){
            console.log("エラーです");
        }
    });

}
  
//アノテーション再現の関数
const Rebuild_annotation = () => {
    fetch("php/annotation_rebuild.php").then(res => {
        return res.json();
    }).then(result_annotation_json => {
        addHightlightSentences(result_annotation_json);
        annotations = result_annotation_json;
        console.log(annotations);
    })
}



// -------------------------------ハイライト追加関数定義------------------------------------------

let addHightlightChar = (char_object_id, type) => {
    // ある文字にハイライトを反映する関数
    //const object_elm = document.getElementById(char_object_id)
    const object_elm = $("span[char_id='"+char_object_id+"']");

    if(object_elm !== null){
        object_elm.attr('type', type);
    }
};

let addHightlightHover = (char_object_id, type) => {
    // ある文字にハイライトを反映する関数
    //const object_elm = document.getElementById(char_object_id)
    const object_elm = $("span[char_id='"+char_object_id+"']");

    if(object_elm !== null){
        object_elm.addClass(type);
        console.log(object_elm);
    }
};

let removeHightlightHover = (char_object_id, type) => {
    // ある文字にハイライトを反映する関数
    //const object_elm = document.getElementById(char_object_id)
    const object_elm = $("span[char_id='"+char_object_id+"']");

    if(object_elm !== null){
        object_elm.removeClass(type);
        console.log(object_elm);
    }
};


    
// let addHightlightSentences = (text_object, hightlight_list) => {
let addHightlightSentences = (hightlight_list) => {
    // 文単位でハイライトする処理
    hightlight_list.forEach((obj, index) => {
        for(let count=0; count <= (obj.end_char_id - obj.start_char_id); count++){
            let char_id = obj.start_char_id + count;
            let char_id_txt = 'p_txt_'+char_id;
            let type = obj.type;
            // let type = "toi";
            // let dup = findCharDuplication(text_object, hightlight_list, char_id);
            // let paren = 0.5 * dup;
            // let paren = 0.5;
            addHightlightChar(char_id_txt, type);
        }
    });
};




const remove_annotation = () => {

      //右クリック時にクリックしたdocument_area上のp_txt_idを取得
      let selected_anno_p_id = window.getSelection().anchorNode.parentElement.getAttribute("char_id").substr(6);
      console.log(selected_anno_p_id);
      
      // annotation配列からselected_anno_p_idが当てはまるオブジェクトのリストを取得
      const filterdAnnotations = annotations.filter((annotation) => {
          return (annotation.start_char_id <= selected_anno_p_id && 
                  selected_anno_p_id <= annotation.end_char_id);
          // nishida　見つけれん勝った時用になにか必要あるかも　https://cpoint-lab.co.jp/article/202010/17597/
      });

      // 見つけたノードidから nishida 修正必要　一番最新のアノテーションを取得する
      if(filterdAnnotations.length>1){
          var target_anno_obj = filterdAnnotations.slice(-1)[0];
      }else{
          var target_anno_obj = filterdAnnotations[0];
      }
    //   console.log(target_anno_obj);
      var anno_id = target_anno_obj.id;
    // removeAnnotationSentences(target_anno_obj);
    annotations = annotations.filter((annotation) => {
        return annotation.id != anno_id;
    });
    console.log(annotations)



    //   削除実行
        for(let count=0; count <= (target_anno_obj.end_char_id - target_anno_obj.start_char_id); count++){
            let char_id = target_anno_obj.start_char_id + count;
            const object_elm = $("span[char_id='p_txt_"+char_id+"']");
            // console.log(object_elm);
            if(object_elm !== null){
                object_elm.removeAttr('type');
            }
        }
        
        $.ajax({

            url: "php/update_anno.php",
            type: "POST",
            data: { 
                // update : "delete",
                    id : anno_id },
    
        });
};


//ハイライトボタンでannotationを追加する
function add_annotation(type_fromNode, node_id){
    let selected_obj = window.getSelection().toString();
    console.log(selected_obj.length);

    // 論文の文字を先に選択してるか判定
    if(selected_obj.length != 0){
        
        console.log("anchorNode:", selected_obj);
        let start_t_id_str = window.getSelection().anchorNode.parentElement.getAttribute("char_id");
        let end_t_id_str = window.getSelection().focusNode.parentElement.getAttribute("char_id");
        console.log(start_t_id_str);
        console.log(end_t_id_str);
       
        let start_t_id = parseInt(start_t_id_str.match(/\d+/)[0], 10);
        let end_t_id = parseInt(end_t_id_str.match(/\d+/)[0], 10);
        var paper_content = window.getSelection().toString();
        console.log(start_t_id);
        console.log(end_t_id);

        let s = Number.isNaN(start_t_id);
        let e = Number.isNaN(end_t_id);
        console.log(s);
        console.log(e);

        

        // 論文の文字を先に選択してるか判定
        if(s != true && e != true && paper_content.length > 0) {
            
            // let annotation_id =parseInt(Date.now().toString());//idの生成　何回やってもintにしたらOut of range value for columnで怒られちゃった
            let annotation_id = Math.floor(Math.random() * 2147483647).toString();
            
            // 利用者が文字を後ろから選択したとき
            if(end_t_id < start_t_id){
                start_t_id=parseInt(window.getSelection().anchorNode.parentElement.getAttribute("char_id").substr(6), 10);
                end_t_id = parseInt(window.getSelection().focusNode.parentElement.getAttribute("char_id").substr(6), 10);
            }
            
    
    
            let annotationObj = {
                id: annotation_id,
                start_char_id: start_t_id,
                end_char_id: end_t_id,
                type: type_fromNode,
                node_id: node_id,
                content: paper_content
            };
            annotations.push(annotationObj);

            $("[nodeid='"+node_id+"']").attr("start_char_id", start_t_id);
            $("[nodeid='"+node_id+"']").attr("end_char_id", end_t_id);
                  
            console.log(annotations);
    
        //文単位でハイライト
        for(let count=0; count <= (annotationObj.end_char_id - annotationObj.start_char_id); count++){
            let char_id = annotationObj.start_char_id + count; 
            let char_id_txt = 'p_txt_'+char_id;  


            addHightlightChar(char_id_txt, type_fromNode); 
    
    
        }
    
    
        $.ajax({
    
            url: "php/insert_annotation.php",
            type: "POST",
            data: { 
                // insert : "annotation",
                    id :  annotation_id,
                    start_char_id : start_t_id,
                    end_char_id : end_t_id,
                    type : type_fromNode,
                    content : paper_content,
                    node_id : node_id,
                 },
                    success: function (response) {
                        console.log(response);
                        try {
                            const result = JSON.parse(response);
                            if (result.annotation_id) {
                                annotationObj.id = result.annotation_id;
                            }
                        } catch (e) {}
                      },
                      error: function () {
                      console.log("登録失敗");},
    
        });

        $.ajax({
    
            url: "php/update_node.php",
            type: "POST",
            data: { 
                // insert : "annotation",
                    update : "annotated",
                    id :  node_id,
                    start_char_id : start_t_id,
                    end_char_id : end_t_id,
                 },
                    success: function (sql) {
                        console.log(sql);
                      },
                      error: function () {
                      console.log("登録失敗");},
    
        });
    
        }else{
            alert('論文のテキストを先に選択してください または 選択した論文のテキストを正しくよみとれませんでした')
        }

    }else{
        alert('論文のテキストを先に選択してください')
    }

  
    };


// ノードを選択して新しくアノテーションを付与する
    function annotation_toNode(){
        
        var node_id = get_selected_nodeid();

            let this_node_type = GetType(node_id);            
            // なんかでnode_type取得            
            
            var jmnode = document.getElementsByTagName("jmnode");
            for(i=0; i<jmnode.length; i++){
                if(jmnode[i].getAttribute("nodeid") == node_id){//回ってきたidが選択中ノードの時
                    
                    let content = jmnode[i].innerHTML;

                    if(content =="＊筆者の主張"){
                        var topic = window.getSelection().toString();

                        // var node = _jm.update_node(node_id,topic);

                        // $.ajax({

                        //     url: "php/update_node.php",
                        //     type: "POST",
                        //     data: { update : "content",
                        //             id : node_id,
                        //             content : topic }

                        // });
                        // add_Cnode_parentid(node_id, "criticism");

                    }else if(content == "＊あなたの予測"){
                        var topic = window.getSelection().toString();

                        var node = _jm.update_node(node_id,topic);

                        $.ajax({

                            url: "php/update_node.php",
                            type: "POST",
                            data: { update : "content",
                                    id : node_id,
                                    content : topic }

                        });

                        add_Anode_parentid(node_id);

                    }
                    // console.log(jmnode[i]);

                }
                }
            
            add_annotation(this_node_type, node_id);







        };
        
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



// ---------------------------------------ノード追加---------------------------------------


//問いノード追加ボタンで問いノードを追加する
async function add_Qnode2(){

  var parent_node = _jm.get_selected_node();

  for(key in parent_node){

      if(key == "id"){

          var parent_id = parent_node[key];

      }

  }

  var nodeid = jsMind.util.uuid.newid();//idの生成
  if (window.getSelection().toString().length != 0){
    var topic = window.getSelection().toString();
  }else{
    var topic = "New Node";
  }
  
  var parent = document.getElementById("document_area");

  var node = _jm.add_node(parent_node, nodeid, topic);

//   var nodeid1 = new Date().getTime().toString();//idの生成
//   var x = document.querySelectorAll("topic span"); // p要素の中にいるspan要素を取得
  let myDiv = document.createElement('div'); // element creation
  var jmnode = document.getElementsByTagName("jmnode");

  for(var i=0; i<jmnode.length; i++){

      if(nodeid == jmnode[i].getAttribute("nodeid")){

          jmnode[i].setAttribute("concept_id","");
          jmnode[i].setAttribute("type","toi");
          jmnode[i].setAttribute("parent_id",parent_id);
          jmnode[i].className = "";

          var x = jmnode[i].style.left;
          var y = jmnode[i].style.top;

          try {
            var type_name = "toi";
            var class_name = "question";
            // get_typeid の非同期処理が完了するまで待つ
            var node_type_id = await get_Typeid(class_name, type_name);
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
                      concept_id : "",
                      x : x,
                      y : y,
                      content : topic,
                    },
                    success:function(result){
                    //   if(result){ console.log(result);}
                    },
                    error: function(error) {
                      console.log("エラー:", error);
                    }

          });
          console.log(jmnode[i].innerHTML);

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
    if(window.getSelection().toString().length != 0){
    add_annotation("toi", nodeid);
    mouseoverNode();
    }
    var parent_id = nodeid; //追加した問いノード
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

            var x = jmnode[j].style.left;
            var y = jmnode[j].style.top;

            try {
                var type_name = "predict";
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
                        x : x,
                        y : y,
                        content : topic,
                    },
                    success:function(result){
                      if(result){ console.log(result);}
                    },
                    error: function(error) {
                      console.log("エラー:", error);
                    }

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



};




//答えノード追加ボタンで答えノードを追加する
async function add_Anode2(node_type){

    try {
        var type_name = node_type;
        // get_typeid の非同期処理が完了するまで待つ
        var node_type_id = await get_Typeid("", type_name);
    } catch (error) {
        console.log("エラーが発生しました:", error);
    }

  var selected_node = _jm.get_selected_node();

  for(key in selected_node){

      if(key == "id"){

          var parent_id = selected_node[key];

      }

  }

  var nodeid = jsMind.util.uuid.newid();//idの生成

  var topic = window.getSelection().toString();;
  if (topic == ""){
    add_Anode(node_type, node_type);
    return;
  }

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
          jmnode[j].setAttribute("type",node_type);
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
                      content : jmnode[j].innerHTML,
                    },
              success: function(result) {
                  if(result){ console.log(result); }
                  if (typeof result === "string" && result.indexOf("error") !== -1) {
                      return;
                  }
                  add_annotation(node_type, nodeid);
                  mouseoverNode();
              },
              error: function(error) {
                  console.log("ノード登録失敗:", error);
              }

          });

          //yoshioka登録追加ボタンより答えを追加したこと
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








