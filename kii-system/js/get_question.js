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

function get_question(){
    var element = document.getElementById("result");
    element.textContent = ""; // テキストを空にする


    $.ajax({

        url: "php/get_other_annotation.php",
        type: "POST",
        data: { val : "get_my_conceptid"},
        success: function(concept_id){
            
            if(concept_id =="[]"){
                console.log('fin');
                return;
            }
            conceptid_array = JSON.parse(concept_id);
            console.log(conceptid_array);
            
            
            $.ajax({

                url: "php/get_other_annotation.php",
                type: "POST",
                data: { val : "get_other_question",
                        array : conceptid_array,
                      },
                success: function(question){
                    console.log(question);
                    result = JSON.parse(question);
                    var questionArray = result;
                    console.log(result);
                    for (var i = 0; i < conceptid_array.length; i++){
                        for (var j = 0; j < questionArray.length; j++){
                            
                            if (questionArray[j]["concept_id"] == conceptid_array[i]["concept_id"]){
                                
                                questionArray.splice(j, 1);
                               
                            }
                        }
                    }
                    console.log(questionArray);
                    var arrayDisplay = document.getElementById("result");
                    

                    for (var i = 0; i < questionArray.length; i++) {
                        

                        var button = document.createElement("button"); // 新しいボタン要素を作成
                        
                        button.innerHTML = questionArray[i]["content"]; // ボタンのテキストを配列の要素に設定
                        button.setAttribute("data-map_id_other", questionArray[i]["map_id"]);
                        button.setAttribute("class", "b_que");
                        concept_id = questionArray[i]["concept_id"];
                        content = questionArray[i]["content"];
                        button.setAttribute("onclick", "add_node2('"+concept_id+"','"+content+" ');");
                        
                        
                        

                        arrayDisplay.appendChild(button); // ボタンを表示用の要素に追加                      
                    }
                    
                }
                
            });

        }
    })

}

async function add_node2(cid, content){

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
    // var toiId = document.getElementById(this.id);
    // console.log(toiId);
    var topic = content;

    //マップ上に問いノード追加
    //jsmind.jsのadd_node関数
    var node = _jm.add_node(parent_node, thisId, topic);

    //問い一覧から選択した問いの概念ID取得
    parent_concept_id = cid;
    

    //XMLデータを取得して問いを絞って提示
    choose_xmlLoad();

    //マップ上の問いノードに問い概念ID,type（問いか答えか）,親ノードIDを挿入
    var jmnode = document.getElementsByTagName("jmnode");

    for(var i=0; i<jmnode.length; i++){

        if(jmnode[i].getAttribute("nodeid") == thisId){

            jmnode[i].setAttribute("concept_id",parent_concept_id);
            jmnode[i].setAttribute("type","other_question");
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

    var element = document.querySelectorAll("[nodeid='"+thisId+"']");


    make_micro_strat(element[1]);

    try {
        var type_name1 = "other_question";
        // get_typeid の非同期処理が完了するまで待つ
        var node_type_id1 = await get_Typeid("", type_name1);
    } catch (error) {
        console.log("エラーが発生しました:", error);
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
                        type : node_type_id1['node_type_id'],
                        concept_id : jmnode[i].getAttribute("concept_id"),
                        x : jmnode[i].style.left,
                        y : jmnode[i].style.top,
                        content : jmnode[i].innerHTML,
                    },

            });


            //yoshioka登録　システムが用意した問いを追加したこと
            //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
            Record_activities(thisId,
                              parent_id,
                              "add",
                              "New Node",
                              jmnode[i].getAttribute("concept_id"),
                              "other_question",
                              jsMind.util.uuid.newid()
                             );

             Record_activities(thisId,
                                parent_id,
                                "edit",
                                jmnode[i].innerHTML,
                                jmnode[i].getAttribute("concept_id"),
                                "other_question",
                                jsMind.util.uuid.newid()
                               );

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

    try {
        var type_name2 = "predict";
        // get_typeid の非同期処理が完了するまで待つ
        var node_type_id2 = await get_Typeid("", type_name2);
    } catch (error) {
        console.log("エラーが発生しました:", error);
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
                        type : node_type_id2['node_type_id'],
                        concept_id : p_concept,
                        x : jmnode[j].style.left,
                        y : jmnode[j].style.top,
                        content : jmnode[j].innerHTML,
                    },

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
