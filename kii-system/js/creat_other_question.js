var parent_map_id = null
var text = null;
var otherMindmapInstances = {};
var activeOtherMindmapId = null;

function getOtherMindmapViewId(mapId) {
    return "other_mindmap_" + String(mapId).replace(/[^a-zA-Z0-9_-]/g, "_");
}

function resetOtherMindmapViews() {
    otherMindmapInstances = {};
    activeOtherMindmapId = null;
    _jm2 = null;
    $("#jsmind_container_cr2").children(".other-mindmap-view, .jsmind-inner").remove();
}

function orderOtherMindmapNodes(nodes, rootNodeIds) {
    var nodeById = {};
    var childrenByParent = {};
    var ordered = [];
    var visited = {};

    nodes.forEach(function(node) {
        nodeById[String(node.id)] = node;
    });

    nodes.forEach(function(node) {
        var parentId = node.parent_id == null ? "root" : String(node.parent_id);
        if (parentId === "" || parentId === "root" || !nodeById[parentId]) {
            parentId = "root";
        }
        node.parent_id = parentId;
        if (!childrenByParent[parentId]) {
            childrenByParent[parentId] = [];
        }
        childrenByParent[parentId].push(node);
    });

    var queue = [];
    (rootNodeIds || []).forEach(function(nodeId) {
        var rootNode = nodeById[String(nodeId)];
        if (rootNode && queue.indexOf(rootNode) === -1) {
            rootNode.parent_id = "root";
            queue.push(rootNode);
        }
    });
    (childrenByParent.root || []).forEach(function(node) {
        if (queue.indexOf(node) === -1) {
            queue.push(node);
        }
    });

    while (queue.length > 0) {
        var current = queue.shift();
        var currentId = String(current.id);
        if (visited[currentId]) {
            continue;
        }
        visited[currentId] = true;
        ordered.push(current);

        (childrenByParent[currentId] || []).forEach(function(child) {
            queue.push(child);
        });
    }

    nodes.forEach(function(node) {
        if (!visited[String(node.id)]) {
            console.warn("Detached mind map node was attached to root:", node.id);
            node.parent_id = "root";
            ordered.push(node);
        }
    });

    return ordered;
}

function restoreOtherMindmap(nodes, rootNodeIds, containerId, mapId) {
    var container = document.getElementById(containerId);
    if (!container) {
        throw new Error("Other mind map container was not found.");
    }

    var orderedNodes = orderOtherMindmapNodes(nodes, rootNodeIds);
    var mindData = [{
        id: "root",
        topic: "*",
        isroot: true,
        readonly: true
    }];

    orderedNodes.forEach(function(node) {
        mindData.push({
            id: String(node.id),
            parentid: node.parent_id === "root" ? "root" : String(node.parent_id),
            parent_id: node.parent_id === "root" ? "root" : String(node.parent_id),
            topic: node.topic == null ? "" : String(node.topic),
            concept_id: node.concept_id,
            type: node.type,
            class: node.class,
            start_char_id: node.start_char_id,
            end_char_id: node.end_char_id,
            parent_map_id: mapId,
            readonly: true
        });
    });

    container.innerHTML = "";
    var instance = new jsMind({
        container: containerId,
        editable: false
    });
    instance.show({
        meta: {
            name: "jsMind remote",
            author: "forest-platform",
            version: "1.0"
        },
        format: "node_array",
        data: mindData
    });

    var dataById = {};
    orderedNodes.forEach(function(node) {
        dataById[String(node.id)] = node;
    });
    container.querySelectorAll("jmnode").forEach(function(element) {
        var node = dataById[String(element.getAttribute("nodeid"))];
        if (!node) {
            return;
        }
        element.setAttribute("parent_id", node.parent_id);
        element.setAttribute("parent_map_id", mapId);
        if (node.concept_id != null) {
            element.setAttribute("concept_id", node.concept_id);
        }
        if (node.type != null) {
            element.setAttribute("type", node.type);
        }
        if (node.start_char_id != null) {
            element.setAttribute("start_char_id", node.start_char_id);
        }
        if (node.end_char_id != null) {
            element.setAttribute("end_char_id", node.end_char_id);
        }
    });

    Object.keys(instance.mind.nodes).forEach(function(nodeId) {
        instance.view.init_nodes_size(instance.mind.nodes[nodeId]);
    });
    instance.layout.layout();
    instance.view.show(true);

    past_array = orderedNodes;
    return instance;
}

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
    var selected_other_node = _jm2 ? _jm2.get_selected_node() : null;
    if (!selected_node || !selected_other_node) {
        return;
    }
    console.log(selected_node)

    for(key in selected_node){

        if(key == "id"){

            var parent_id = selected_node[key];

        }

    }

    var nodeid = jsMind.util.uuid.newid();//idの生成

    var topic = selected_other_node.topic;
    console.log(selected_other_node);
    var node = _jm.add_node(selected_node, nodeid, topic);
    console.log(node);

    var jmnode = document.querySelectorAll("#jsmind_container jmnode");
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
                var node_type_id = await get_Typeid("", node_type);
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
        $('#jsmind_area').addClass('comparison-open');
        $('#jsmind_container').css('height','');
        $('#jsmind_container_cr2').css('display','block');
    }
    else{
        reset_annotation();

        $('#jsmind_area').removeClass('comparison-open');
        $('#jsmind_container').css('height','100%');
        resetOtherMindmapViews();
        $('#jsmind_container_cr2').css('display','none');
        $('#mindmap_tab').empty().append('<span id="all_annotation"></span>');
    }
}

function reset_annotation() {
    var elements = document.querySelectorAll('.user_s');

    elements.forEach(function(element) {
        element.classList.remove("user_s");
    });
}

function show_other_mindmap(button, map_id, parent_id){
    reset_annotation();

	var buttonMapId = button ? button.getAttribute("data-map_id") : null;
	if (buttonMapId != null && buttonMapId !== "") {
		map_id = buttonMapId;
	}
    parent_map_id = map_id;
    if (map_id == null || map_id === "null" || map_id === "") {
        return;
    }

    show_selected_sheet("on");
    $("#mindmap_tab [data-map_id]").removeAttr("aria-current");
    if (button) {
        button.setAttribute("aria-current", "true");
    }

    var allAnnotationButton = document.getElementById("all_annotation");
    if (allAnnotationButton) {
        allAnnotationButton.onclick = function() {
            show_other_mindmap(this, map_id, null);
        };
    }

    var mapKey = String(map_id);
    var viewId = getOtherMindmapViewId(mapKey);
    var comparisonArea = document.getElementById("jsmind_container_cr2");
    var mapView = document.getElementById(viewId);

    $(comparisonArea).children(".other-mindmap-view").hide();
    if (!mapView) {
        mapView = document.createElement("div");
        mapView.id = viewId;
        mapView.className = "other-mindmap-view";
        mapView.setAttribute("data-map-id", mapKey);
        comparisonArea.appendChild(mapView);
    }
    mapView.style.display = "block";
    activeOtherMindmapId = mapKey;

    if (otherMindmapInstances[mapKey]) {
        _jm2 = otherMindmapInstances[mapKey];
        jump_node();
    } else {
        $(mapView).text("Loading...");
        if (button) {
            button.disabled = true;
        }

        $.ajax({
            url: "php/open_data2.php",
            type: "POST",
            dataType: "json",
            data: {
                val: "all",
                mapid: map_id
            },
            success: function(response) {
                if (!response || response.success !== true || !Array.isArray(response.nodes)) {
                    $(mapView).text("Failed to load mind map.");
                    return;
                }

                var instance = restoreOtherMindmap(
                    response.nodes,
                    response.root_node_ids || [],
                    viewId,
                    mapKey
                );
                otherMindmapInstances[mapKey] = instance;
                mouseoverNode(mapView.querySelectorAll("jmnode"));

                if (activeOtherMindmapId === mapKey) {
                    _jm2 = instance;
                    jump_node();
                } else if (otherMindmapInstances[activeOtherMindmapId]) {
                    _jm2 = otherMindmapInstances[activeOtherMindmapId];
                }
            },
            error: function(xhr) {
                console.error("Failed to load the other mind map:", xhr.responseText);
                $(mapView).text("Failed to load mind map.");
            },
            complete: function() {
                if (button) {
                    button.disabled = false;
                }
            }
        });
    }

    if (parent_id != null && parent_id !== "null" && parent_id !== "") {
        Rebuild_paper3("paper_area", map_id, parent_id);
    } else {
        Rebuild_paper2("paper_area", map_id);
    }
}

function show_other_mindmap_legacy(button=null, map_id, parent_id=null){
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

/* Legacy confirmation text retained for reference.
function confirmAndExecute(mode) {
    // アラートを表示し、"はい"がクリックされたらchange_othermode関数を実行
    if (confirm("移行しますか？")) {
        change_othermode(mode);
    }
}



*/

function confirmAndExecute(mode) {
    if (confirm("Move this node?")) {
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
    var area = activeOtherMindmapId == null ? null :
        document.getElementById(getOtherMindmapViewId(activeOtherMindmapId));
    var conceptContent = document.getElementById("concept_content");
    if (!area || !conceptContent) {
        return;
    }
    conceptid = conceptContent.getAttribute("concept_id");
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
            var result = typeof question === "string" ? JSON.parse(question) : question;
            if (result && result.success) {
                ni.attr("paper-reading-reflection", "true");
            }
        },
        error: function (xhr, status, error) {
            console.error("AJAX リクエストが失敗しました:", error);
        }
    });
}

    

