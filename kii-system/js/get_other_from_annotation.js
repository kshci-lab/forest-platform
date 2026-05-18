


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
function create_mindmapbutton(map_id_Array, judge, concept_id=null){
    $('#mindmap_tab').empty();
    show_selected_sheet("on");
    var arrayDisplay = document.getElementById("mindmap_tab");
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
        map_id = map_id_Array[i]["map_id"];
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

function hasSheetId(map_id) {
    var elements = document.querySelectorAll('[data-map_id]');
    console.log(elements);
  
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var dataSheetId = element.getAttribute('data-map_id');
  
      if (dataSheetId === map_id) {
        return true;
      }
    }
    return false;
  }






