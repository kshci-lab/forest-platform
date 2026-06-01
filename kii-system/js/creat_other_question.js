var parent_map_id = null
var text = null;

function get_other_nodeid(){
    var element = document.getElementById("result");
    element.textContent = ""; // テキストを空にする

    //nodeid取得
    nodeid = get_selected_nodeid();
    console.log(nodeid);
    

    
    $.ajax({

        url: "php/get_other_annotation.php",
        type: "POST",
        data: { val : "get_conceptid",
                id : nodeid
              },
        success: function(conceptid){
            
            if(conceptid =="[]"){
                console.log('fin');
                return;
            }
            conceptid = conceptid.substring(2, 20);
            
            
            $.ajax({

                url: "php/get_other_annotation.php",
                type: "POST",
                data: { val : "get_question",
                        id : conceptid
                      },
                success: function(question){
                    result = JSON.parse(question);
                    var Array = result;
                    console.log(Array);
                    var arrayDisplay = document.getElementById("result");
                    var oq_menu = document.getElementById('other_conmenu');
                    temp = "answer_button0";

                    

                    for (var i = 0; i < Array.length; i++) {
                        

                        var button = document.createElement("button"); // 新しいボタン要素を作成
                        if (i == 0){
                            button.setAttribute("id", "selected");
                        }
                        else{
                            button.setAttribute("id", "answer_button"+i);
                        }
                        button.innerHTML = Array[i]["content"]; // ボタンのテキストを配列の要素に設定
                        button.setAttribute("data-map_id", Array[i]["map_id"]);


                        button.addEventListener("contextmenu", function(e) {
                            console.log(temp);
                            var sss = document.getElementById("selected");
                            if (sss.id == "selected"){
                                var sss = document.getElementById("selected");
                                sss.id = temp;
                            }

                            console.log("ok");
                            oq_menu.style.left = (e.pageX - document.body.scrollLeft - 10) + 'px';
                            oq_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
                            oq_menu.classList.add('on');

                            temp = e.target.id;
                            e.target.id = "selected";

                        });
                        

                        arrayDisplay.appendChild(button); // ボタンを表示用の要素に追加                      
                    }
                    
                    

                }
                
                

            });

        }
    })

}





async function add_Anode_from_other(node_class, node_type){

    var selected_node = _jm.get_selected_node();
    console.log(selected_node)

    for(key in selected_node){

        if(key == "id"){

            var parent_id = selected_node[key];

        }

    }

    var nodeid = jsMind.util.uuid.newid();//idの生成

    var topic = document.getElementsByClassName(" selected")[1].innerHTML;
    console.log(document.getElementsByClassName(" selected")[1]);
    var node = _jm.add_node(selected_node, nodeid, topic);
    console.log(node);

    var jmnode = document.getElementsByTagName("jmnode");
    console.log(jmnode);

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
            // if (document.getElementsByClassName(" selected")[1].getAttribute("parent_map_id")== ""){
            //     jmnode[j].setAttribute("parent_map_id",parent_map_id);
            //     console.log("オリジナル");
            // }else{
            //     jmnode[j].setAttribute("parent_map_id",document.getElementsByClassName(" selected")[1].getAttribute("parent_map_id"));
            //     console.log("オリジナルじゃない");
            // }

            try {
                var type_name = async function() {
                  return new Promise((resolve, reject) => {
                    $.ajax({
                      url: "php/get_Typeid.php",
                      type: "POST",
                      data: { class: node_class, type: node_type },
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
                        class : node_class,
                        parent_map_id : parent_map_id},

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
    var element = document.querySelectorAll("[nodeid='"+nodeid+"']");


    make_micro_strat(element[1]);

}

function show_selected_sheet(onoff){

    if (onoff == "on"){
        $('#jsmind_container').css('height','calc(50% - 42.5px)');
        $('#jsmind_container2').css('height','calc(50% - 42.5px)');
        $('#jsmind_container2').css('display','flex');
        $('#jsmind_container2_menu').css('display','block');
    }
    else{
        reset_annotation();

        $('#jsmind_container').css('height','100%');
        $('#jsmind_container2').css('height','100%');
        $('#jsmind_container2').css('display','none');
        $('#jsmind_container2_menu').css('display','none');
        $('#mindmap_tab').empty().append('<span id="all_annotation"></span>');
    }
}

function reset_annotation() {
    var elements = document.querySelectorAll('.user_s');

    elements.forEach(function(element) {
        element.classList.remove("user_s");
    });
}

function show_other_mindmap(button=null, map_id, parent_id=null){
    reset_annotation();

    cid = $("#concept_content").attr("concept_id");
    parent_map_id = map_id;
    if(map_id == "null"){
      return;
    }
  else{
    var button = document.getElementById("all_annotation");
    button.setAttribute("onClick", "show_other_mindmap(this, "+map_id+")");
    
    getData2(map_id);
    

    // $.ajax({
      
    //   url: "php/user_sheet.php",
    //   type: "POST",
    //   data: { 
    //     // val : "user",
    //     user : map_id,
    //   },
    //   success: function(data){
    //     var obj = JSON.parse(data); // JSON型をパース
    //     console.log(obj);
    //     if(obj['user'] == ""){
    //       // alert("ユーザの取得に失敗しました．");
    //     }else{
    //         show_selected_sheet("on");
    //         // console.log("取得日時", obj['time']);

    //         // 配列に変換
    //         var node_array = new Array();
    //         node_array = obj['array'];
    //         console.log(node_array);

    //         // 表示する関数に受け渡す
    //         OpenPastSheet(node_array);
    //     }
    //   },
    //   error : function(msg, status){
    //     alert('通信ができない状態です。');
    //   }
    // })
    console.log("Parent_id: "+parent_id);

    if (parent_id != null){
        Rebuild_paper3("paper_area",map_id, parent_id); 
    }
    else{
        Rebuild_paper2("paper_area",map_id);
  }
}

}



function show_other_mindmap_all(){

    //nodeid取得
    nodeid = get_selected_nodeid();
    conceptid = document.querySelector("jmnode[nodeid='"+nodeid+"']").getAttribute("concept_id");
    console.log(nodeid);

    $.ajax({

        url: "php/get_other_annotation.php",
        type: "POST",
        data: { val : "get_question",
                id : conceptid
                },
        success: function(question){
            console.log(question);
            result = JSON.parse(question);
            var Array = result;
            console.log(Array);
            create_mindmapbutton(Array, "node", conceptid);
        }
    });
}

function test(){
    console.log("ok");
}

function hightlight(char){
    if (char == "konkyo"){
        char.setAttribute("judge", "on");
    }
}

function confirmAndExecute(mode) {
    // アラートを表示し、"はい"がクリックされたらchange_othermode関数を実行
    if (confirm("移行しますか？")) {
        change_othermode(mode);
    }
}



function change_othermode(mode) {

    if (mode == "other"){
        var otherElements = document.getElementsByClassName(mode);
        // 取得した要素に対して処理を行う
        for (var i = 0; i < otherElements.length; i++) {
            otherElements[i].style.display = 'block';
        }
        var otherElements2 = document.getElementById('change2');
        otherElements2.style.display = 'none';
    }

    if (mode == "ref"){
        var data = document.getElementById("reftext").innerHTML;
        console.log(data);
        update_summary(data);
        show_selected_sheet('off');
        document.getElementById("crit").style.display ="none";
        document.getElementById("mind").style.display ="flex"
        var otherElements1 = document.getElementsByClassName('other');
        // 取得した要素に対して処理を行う
        for (var i = 0; i < otherElements1.length; i++) {
            otherElements1[i].style.display = 'none';
        }
        
        var otherElements = document.getElementsByClassName(mode);
        // 取得した要素に対して処理を行う
        for (var i = 0; i < otherElements.length; i++) {
            otherElements[i].style.display = 'block';
        }
        var otherElements2 = document.getElementById('change3');
        otherElements2.style.display = 'none';

        var clickableAreas = document.getElementsByClassName("other_answer");

        // 各要素に対してクリックイベントリスナーを設定
        //     for (var i = 0; i < clickableAreas.length; i++) {
            // clickableAreas[i].addEventListener('click', function(event) {
            //     node_info = event.target;
            //     var clickedType = event.target.getAttribute('type');
            //     console.log(clickedType);

            //     if (clickedType === 'other_answer') {
            //         // クリックされた要素のnodeidを取得
            //         var nodeid = event.target.getAttribute('nodeid');
            //         $.ajax({
            //             url: "php/get_data.php",
            //             type: "POST",
            //             data: {
            //                 val: "get_other_answer",
            //                 id: nodeid
            //             },
            //             success: function(response) {
            //                 result = JSON.parse(response)
            //                 console.log(result);
            //                 text = "この問いを思いつくためにはどのようなことを考えながら読めば良いでしょうか"
            //                 // text = "あなたは<br><br><div id='ref_area' class='border-radius' >"+result[0]["content"]+"</div><br><br>という解釈を参考にしました．<br><br>このような読解を行なった学習者は，この論文に対して，<div id='summary_area'>"+result[0]["summary"]+"</div><br>という要約をしています．もう一度この要約やマインドマップを見て，この解釈について，<br><br>何故自分が思いつけなかったのか<br><br>どうすればこの解釈ができるか<br><br>に着目して考えてみましょう"
            //                 // document.getElementById("ref_text").innerHTML = text;
            //                 // mapid = result[0]["parent_map_id"];
            //                 // show_selected_sheet("on");
            //                 // $("mindmap_tab").css("display: none;");

                            
            //                 // getData2(mapid);
            //             },
            //             error: function(xhr, status, error) {
            //                 console.error("Error:", error);
            //             }
            //         });
            //     }
            // });
        // }
        

    }
    if (mode == "crit"){
        document.getElementById(mode).style.display = "block";
        document.getElementById("mind").style.display = "none";
        var otherElements = document.getElementsByClassName("other");
        // 取得した要素に対して処理を行う
        for (var i = 0; i < otherElements.length; i++) {
            otherElements[i].style.display = 'none';
        }

        
    }

}   

//update_database("データ")
function update_summary(data){
    console.log("ooo")
    $.ajax({

        url: "php/update_node.php",
        type: "POST",
        data: { update : "summary",
                summary : data
              },
        success: function(question){
            console.log(question)
        }
    });
}


function jump_node() {
    // 対象となる要素を取得
    var area = document.getElementById("jsmind_container2");
    conceptid = document.getElementById("concept_content").getAttribute("concept_id");
    var elements = area.querySelectorAll("jmnode[concept_id='"+conceptid+"']");
    
    console.log(conceptid)
    
    // 一致する要素を格納する配列
    var matchingElements = [];

    // 全ての要素を検査
    for (var i = 0; i < elements.length; i++) {
        // 要素の concept_id を取得
        var elementConceptId = elements[i].getAttribute("concept_id");

        // concept_id が指定された値と一致する場合は、配列に追加
        if (elementConceptId === conceptid) {
            matchingElements.push(elements[i]);
        }
    }

    if (matchingElements.length > 0) {
        // 最初に一致した要素があれば、それを中央にスクロール
        matchingElements[0].scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    } else {
        console.log("No matching elements found for conceptid: " + conceptid);
    }
}

function submit_strat() {
    var content = document.getElementById("ref_text").value;
    console.log(content);

    // "nid" 属性を取得する
    var nodeid = document.getElementById("make_micro_strat_form").getAttribute("nid");
    var node_type = document.getElementById("make_micro_strat_form").getAttribute("type");

    // "nodeid" 属性を用いて type 属性を更新する
    var ni = $("[nodeid='" + nodeid + "']");
    ni.css("border-color", "rgb(0, 149, 255)");
    // `node_type` が適切に定義され、正しい値を持っていることを確認
    if (node_type == "other_answer") {
        var type = "other_to_myanswer"
        ni.attr("type", type);
    }
    else if(node_type == "other_question"){
        var type = "other_to_myquestion";
        ni.attr("type", type);
    }

    $("#ref_guidance").text("");
    $("#ref_text").val("");
    console.log($("#ref_guidance"));
    $("#make_micro_strat_form").css("display", "none");

    // AJAX リクエストを行う
    $.ajax({
        url: "php/update_node.php",
        type: "POST",
        data: {
            update: "micro_strat",
            nodeid: nodeid,
            content: content,
            type: type
        },
        success: function (question) {
            console.log(question);
        },
        error: function (xhr, status, error) {
            console.error("AJAX リクエストが失敗しました:", error);
        }
    });
}

    

