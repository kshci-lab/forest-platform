


/* Legacy annotation menu implementation retained for reference.
function show_other_mindmap_anno(){

    judge_charid(function (result) {
        if (Array.isArray(result) && result.length !== 0) {
            // 成功時の処理
            console.log("result=", result);
            result.sort((a, b) =>
                a.start_char_id > b.start_char_id ? 1 : -1
            );

        
            create_mindmapbutton(result, "annotation");
            
        } else {
            // エラー時の処理
            console.error("処理に失敗しました。");
            $('#mindmap_tab').empty();
            var arrayDisplay = document.getElementById("mindmap_tab");
            jm2_menu = document.createElement("div");
            jm2_menu.innerHTML = "選択したエリアに解釈ノードは存在しません";
            arrayDisplay.appendChild(jm2_menu);

        }
    });
}

//論文の選択部のidを取ってくる関数
*/

function show_other_mindmap_anno() {
    judge_charid(function(result) {
        if (Array.isArray(result) && result.length > 0) {
            result.sort(function(a, b) {
                return Number(a.start_char_id) - Number(b.start_char_id);
            });
            create_mindmapbutton(result, "annotation");
            return;
        }

        var menu = document.getElementById("mindmap_tab");
        if (menu) {
            menu.innerHTML = "No matching mind maps were found.";
        }
    });
}

function get_charid(){
    var charid = null;
    var other = document.getElementById("change2").style.display;

    if (other == "none"){
        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
            var range = selection.getRangeAt(0);

            
            // 選択範囲内のテキストを取得
            var selectedText = range.toString();

            // 選択範囲内の最初の文字の `char_id` を取得
            var startCharId = range.startContainer.parentNode.getAttribute("char_id");

            // 選択範囲内の最後の文字の `char_id` を取得
            var endCharId = range.endContainer.parentNode.getAttribute("char_id");

            if (!startCharId || !endCharId) {
                return null;
            }

            charid = [startCharId, endCharId];
            var i = 0;

            for (var i = 0; i < charid.length; i++) {
                var match = charid[i].match(/\d+/);
                if (!match) {
                    return null;
                }
                charid[i] = match[0];
            }      
        }
        return charid;

    }
    return null;
    
}

//取得した文章と被るところの検索

/* Legacy selection lookup implementation retained for reference.
function judge_charid(callback) {
    var charid = get_charid(); // 文字IDを取得
    console.log(charid);

    if (Array.isArray(charid) && charid.length >= 2 && charid[0] !== undefined && charid[1] !== undefined) { // 選択が行われているかを確認
        $.ajax({
            url: "php/get_other_annotation.php",
            type: "POST",
            data: {
                val: "judge_annotation",
                start_char_id: charid[0],
                end_char_id: charid[1]
            },
            success: function (question) {
                console.log(question);
                var result = JSON.parse(question);
                callback(result); // 結果をコールバック関数に渡す
            },
            error: function (error) {
                console.error("AJAXリクエストでエラーが発生しました:", error);
                callback([]); // エラー時にもコールバック関数を呼び出す
            }
        });
    } else {
        console.error("テキストが選択されていません。");
        callback([]); // エラー時にもコールバック関数を呼び出す
    }
}

// judge は annotation か node
*/

function judge_charid(callback) {
    var charid = get_charid();
    if (!Array.isArray(charid) || charid.length < 2) {
        callback([]);
        return;
    }

    $.ajax({
        url: "php/get_other_annotation.php",
        type: "POST",
        data: {
            val: "judge_annotation",
            start_char_id: charid[0],
            end_char_id: charid[1]
        },
        success: function(question) {
            try {
                callback(JSON.parse(question));
            } catch (error) {
                console.error("Failed to parse annotation lookup.", error);
                callback([]);
            }
        },
        error: function(xhr) {
            console.error("Failed to look up annotations.", xhr.responseText);
            callback([]);
        }
    });
}

/* Legacy mind map button builder retained for reference.
function create_mindmapbutton(map_id_Array, judge, concept_id=null){
    var arrayDisplay = document.getElementById("mindmap_tab");
    var contextKey;

    if (!arrayDisplay) {
        var menuContainer = document.getElementById("jsmind_container_menu");
        if (!menuContainer) {
            console.error("Mind map menu container was not found.");
            return;
        }
        arrayDisplay = document.createElement("div");
        arrayDisplay.id = "mindmap_tab";
        arrayDisplay.innerHTML = '<span id="all_annotation"></span>';
        menuContainer.appendChild(arrayDisplay);
    }

    if (judge === "node") {
        contextKey = "node:" + String(get_selected_nodeid() || "") + ":" + String(concept_id || "");
    } else {
        contextKey = "annotation:" + map_id_Array.map(function(item) {
            return String(item.map_id) + ":" + String(item.parent_id || "");
        }).join("|");
    }

    if (arrayDisplay.getAttribute("data-context-key") === contextKey &&
        arrayDisplay.querySelector("[data-map_id]")) {
        show_selected_sheet("on");
        return;
    }

    resetOtherMindmapViews();
    $('#mindmap_tab').empty();
    arrayDisplay.setAttribute("data-context-key", contextKey);
    show_selected_sheet("on");
    jm2_menu = document.createElement("span");
    jm3_menu = document.createElement("div");


    if (judge == "node"){      
        console.log(CheckSelectedNode());
        jm2_menu.innerHTML = "選択中 : " + CheckSelectedNode()["topic"];
        jm2_menu.setAttribute("id", "concept_content");
        jm2_menu.setAttribute("concept_id", concept_id);
        arrayDisplay.appendChild(jm2_menu);
    }
    else if (judge == "annotation"){
        jm2_menu.innerHTML = "選択中 : 論文内文章    ";
        arrayDisplay.appendChild(jm2_menu);

    }
    console.log(map_id_Array);
    var n = 0;


    for (var i = 0; i < map_id_Array.length; i++) {
        
        var button = document.createElement("button"); // 新しいボタン要素を作成
        var map_id = map_id_Array[i]["map_id"];
        var result = hasSheetId(map_id);
        console.log(result);
        if (!result){
            button.innerHTML = n + 1;
            button.setAttribute("data-map_id", map_id);
            button.setAttribute("data-content", map_id_Array[i]["content"]);
            button.setAttribute("data-parent_id", map_id_Array[i]["parent_id"]);
            button.setAttribute("class", "button10");
            button.setAttribute("onClick", "show_other_mindmap(this, "+map_id+", '"+map_id_Array[i]["parent_id"]+"');");
            arrayDisplay.appendChild(button); // ボタンを表示用の要素に追加
            n++;
        }       
    }

        var allbutton = document.createElement("button");
        allbutton.setAttribute("id", "all_annotation");
        allbutton.innerHTML = "全アノテーション参照";
        allbutton.setAttribute("class", "button10");
        arrayDisplay.appendChild(allbutton);

        var jumpbutton = document.createElement("button");
        jumpbutton.setAttribute("id", "jump_button");
        jumpbutton.innerHTML = "jump";
        jumpbutton.setAttribute("class", "button10");
        jumpbutton.setAttribute("onClick", "jump_node();")
        arrayDisplay.appendChild(jumpbutton);

        var closebutton = document.createElement("button");
        closebutton.setAttribute("id", "close_button");
        closebutton.innerHTML = "閉じる";
        closebutton.setAttribute("class", "button10");
        closebutton.setAttribute("onClick", "show_selected_sheet('off');")
        arrayDisplay.appendChild(closebutton);


}

*/

function create_mindmapbutton(mapIdArray, judge, conceptId) {
    var menu = document.getElementById("mindmap_tab");
    if (!menu) {
        var menuContainer = document.getElementById("jsmind_container_menu");
        if (!menuContainer) {
            console.error("Mind map menu container was not found.");
            return;
        }
        menu = document.createElement("div");
        menu.id = "mindmap_tab";
        menuContainer.appendChild(menu);
    }

    mapIdArray = Array.isArray(mapIdArray) ? mapIdArray : [];
    var contextKey;
    if (judge === "node") {
        contextKey = "node:" + String(get_selected_nodeid() || "") + ":" + String(conceptId || "");
    } else {
        contextKey = "annotation:" + mapIdArray.map(function(item) {
            return String(item.map_id) + ":" + String(item.parent_id || "");
        }).join("|");
    }

    if (menu.getAttribute("data-context-key") === contextKey && menu.querySelector("[data-map_id]")) {
        show_selected_sheet("on");
        return;
    }

    resetOtherMindmapViews();
    menu.innerHTML = "";
    menu.setAttribute("data-context-key", contextKey);
    show_selected_sheet("on");

    var heading = document.createElement("span");
    if (judge === "node") {
        var selectedNode = CheckSelectedNode();
        heading.textContent = "\u9078\u629e\u4e2d: " + (selectedNode ? selectedNode.topic : "");
        heading.id = "concept_content";
        heading.setAttribute("concept_id", conceptId || "");
    } else {
        heading.textContent = "\u9078\u629e\u4e2d: \u8ad6\u6587\u5185\u6587\u7ae0";
    }
    menu.appendChild(heading);

    var seenMapIds = {};
    var buttonNumber = 1;
    mapIdArray.forEach(function(item) {
        var mapId = item.map_id;
        var mapKey = String(mapId);
        if (!mapKey || seenMapIds[mapKey]) {
            return;
        }
        seenMapIds[mapKey] = true;

        var button = document.createElement("button");
        button.type = "button";
        button.textContent = String(buttonNumber++);
        button.className = "button10";
        button.setAttribute("data-map_id", mapKey);
        button.setAttribute("data-content", item.content || "");
        button.setAttribute("data-parent_id", item.parent_id || "");
        button.addEventListener("click", function() {
            show_other_mindmap(button, mapId, item.parent_id || null);
        });
        menu.appendChild(button);
    });

    var allButton = document.createElement("button");
    allButton.type = "button";
    allButton.id = "all_annotation";
    allButton.className = "button10";
    allButton.textContent = "\u5168\u30a2\u30ce\u30c6\u30fc\u30b7\u30e7\u30f3\u53c2\u7167";
    menu.appendChild(allButton);

    var jumpButton = document.createElement("button");
    jumpButton.type = "button";
    jumpButton.id = "jump_button";
    jumpButton.className = "button10";
    jumpButton.textContent = "jump";
    jumpButton.addEventListener("click", jump_node);
    menu.appendChild(jumpButton);

    var closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.id = "close_button";
    closeButton.className = "button10";
    closeButton.textContent = "\u9589\u3058\u308b";
    closeButton.addEventListener("click", function() {
        show_selected_sheet("off");
    });
    menu.appendChild(closeButton);
}

function hasSheetId(map_id) {
    var elements = document.querySelectorAll('#mindmap_tab [data-map_id]');
    console.log(elements);
  
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var dataSheetId = element.getAttribute('data-map_id');
  
    if (dataSheetId === String(map_id)) {
        return true;
      }
    }
    return false;
  }






