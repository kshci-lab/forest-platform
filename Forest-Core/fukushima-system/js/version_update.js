//hatakeyama

//ノードの挿入
function NodeInsert(nodeVERSION, nodeID, parentID, nodeTEXT, reasonLEARNER, reasonSYSTEM){
  console.log("NodeInsert");
    $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { 
                data : "node_insert",
                node_version_id : nodeVERSION,
                node_id : nodeID,
                parent_node_id : parentID,
                text : nodeTEXT,
                updated_reason_by_learner : reasonLEARNER,
                updated_reason_by_system : reasonSYSTEM
              },
  
        success: function (res) {
          // console.log("node_versionsに保存成功");
        },
        error: function () {
          console.log("node_versionsに保存失敗");
        },
    });
}
  
//ノードの編集／移動
function NodeEdit(nodeVERSION, nodeID, parentID, nodeTEXT, reasonLEARNER, reasonSYSTEM){
  console.log("NodeEdit");
    $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { 
                data : "node_edit",
                node_version_id : nodeVERSION,
                node_id : nodeID,
                parent_node_id : parentID,
                text : nodeTEXT,
                updated_reason_by_learner : reasonLEARNER,
                updated_reason_by_system : reasonSYSTEM
              },
  
        success: function (res) {
          // console.log("node_versionsに保存成功");
           //shimizu ここに資料との対応があれば記載していく
           //console.log(nodeID)
           GetPairNodeId_ContentRelationTable(nodeID)

        },
        error: function () {
          console.log("node_versionsに保存失敗");
        },
    });
}

function NodeVersionUpdate(nodes){

  var typeID;

  if(!nodes){
    var nodeVERSION = jsMind.util.uuid.newid();
    var node = _jm.get_selected_node();
    var nodeID = node.id;
    var class_name = Get_NodeInfo(nodeID, 'class').split(' ')[0]; // 'XXX selected'になっているのでselectedを取り除く
    var type_name = Get_NodeInfo(nodeID, 'type');
    var parentID = node.parent.id;
    var nodeTEXT = node.topic;
    var conceptID = Get_NodeInfo(nodeID, 'concept_id');
    var x = node._data.view.abs_x;
    var y = node._data.view.abs_y;

    //　node_type_idを取得
    $.ajax({
      url: "php/get_Typeid.php",
      type: "POST",
      data: { class: class_name, type: type_name },
      success: function(response) {
        typeID = JSON.parse(response)['node_type_id'];
        
        //　node_type_idを取得できたらversion更新
        $.ajax({
          url: "php/version_update.php",
          type: "POST",
          data: { 
                  data : "node",
                  node_version_id : nodeVERSION,
                  node_id : nodeID,
                  node_type_id: typeID,
                  parent_id : parentID,
                  content : nodeTEXT,
                  concept_id: conceptID,
                  x: x,
                  y: y,
                },
    
          success: function (res) {
            if(res){
              console.log(res);
            }
            GetPairNodeId_ContentRelationTable(nodeID);
    
            // 親ノードIDがnodeIDと一致する子ノードのインデックスを取得
            node.children.forEach(childNode => {
                // ノードのDOM要素を取得
                const childID = childNode.id;
                
                if (childID) {
                    proposeThinkingProcess(childID);
                }
            });
    
            console.log(nodeID)
            proposeThinkingProcess(nodeID);
             
          },
          error: function () {
            console.log("node_versionsに保存失敗");
          },
        });
      },
      error: function(error) {
        console.log("エラー:", error);
      }
    });

  }else if(nodes){

    console.log(nodes);
    var nodeVERSION = jsMind.util.uuid.newid();
    typeID = nodes['node_type_id'];

    $.ajax({
      url: "php/version_update.php",
      type: "POST",
      data: { 
              data : "node",
              node_version_id : nodeVERSION,
              node_id : nodes['node_id'],
              node_type_id: typeID,
              parent_id : nodes['parent_id'],
              content : nodes['content'],
              concept_id: nodes['concept_id'],
              x: nodes['x'],
              y: nodes['y'],
            },
      success: function (res) {
         if(res){
          console.log(res);
         }
         GetPairNodeId_ContentRelationTable(nodeID);
      },
      error: function () {
        console.log("node_versionsに保存失敗");
      },
    });
  }
    
}

// relationテーブルにINSERTし、現在存在しているノードと新しいマップを結びつける
function RecordRelation(count){

    var jmnode = document.getElementsByTagName("jmnode");
    GetMapVersion().then(function (res) { //最新map_version_idを取得
        const parse = JSON.parse(res)

        if (jmnode.length == 2){  //rootと追加したノードのみならINSERTだけ,後で
        
        }else{  //INSERT & UPDATE
    
            for(let i=1; i<jmnode.length; i++){ //現存ノードで回す(root抜き)
    
                $node_id = jmnode[i].getAttribute("nodeid");
        // 
                if ($node_id!=null){
        
                    $.ajax({
                    url: "php/version_update.php",
                    type: "POST",
                    data: { data : "relation",
                            count : count,
                            node_id : $node_id,
                            map_version_id : parse[0]
                            }
                    });
        
                }
    
            }

        }

    });

}

//マップver更新ボタンをクリック
var mapSnapshotButton = document.getElementById("map-snapshot-button");
function MapSnapShot(){

    //map_versionsを更新
    $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "map"},
        success: function(e){
          if(e == 'null'){
            alert("マップverが更新されました");
            show_edit_reason();
          }else{
            console.log(e);
            var nodes = JSON.parse(e);
            for(var i=0; i<Object.keys(nodes).length; i++){
              NodeVersionUpdate(nodes[i]);
            }
            alert("マップverと変更があったノードのverが更新されました");
            show_edit_reason();
          }
        }
    });

    $('#comment_balloon').hide();
    $('#comment_balloon').fadeIn(1000);
}

// ノードの更新をマップ全体に波及させる関数
function VersionSpread(){

    let selected_node = CheckSelectedNode();
    if(selected_node == null || selected_node.topic == undefined){
        // (textareaのid名).value = "ノードを選択してください";
        return;
    }else{

    //map_versionsを更新
    $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "map",
                node_id : selected_node.id
            }
    });
    alert("ノードの更新をマップ全体に波及しました！")
    show_edit_reason();
    $('#comment_balloon').hide();
    $('#comment_balloon').fadeIn(1000);

    }
}


//ノードver更新理由を最新順で取得する関数 （999 => 'temp'を入れてるのでlengthは+1）
function GetNodeReason(node_id){

    return $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "get_node_reason",
                node_id : node_id
            },
    })
}
//マップver更新理由を時間を指定して取得する関数
function GetMapReason(mttime){

    return $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "get_map_reason",
                time : mttime
        },
    })
}

//ノードのversionを最新順で取得する関数 （999 => 'temp'を入れてるのでlengthは+1）
function GetSelectedNodeVersion(node_id){

    return $.ajax({
    url: "php/version_update.php",
    type: "POST",
    data: { data : "node_version",
            node_id : node_id
            },
    })
}
//マップのversionを最新順で取得する関数 （999 => 'temp'を入れてるのでlengthは+1）
function GetMapVersion(){

    return $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "map_version"},
    })
}
//editがあるか調べる関数 （999 => 'temp'を入れてるのでlengthは+1）
function CheckEdit(node_id){

    return $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "check_edit",
                node_id : node_id},
    })
}
//ノードのversion履歴(理由があるもののみ)を最新順で取得する関数
function NodeVersionLog(node_id){

    return $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "node_version_log",
                node_id : node_id
            },
    })

}
//ノードversion履歴表示フォーム
function ShowNodeVersionLog(array){ //arrayはノードバージョン最新順
    // var log = document.getElementById("node_version_log");

    // while(log.firstChild){  //一旦中身を空に
    //     log.removeChild(log.firstChild);
    // };

    // $("#log").html(""); //logに""を追加？

    // for(i=0;i<array.length;i++){
    //     var imgtag = document.createElement("img");
    //     imgtag.src = "image/list6.png";
    //     imgtag.style.width = 15;
    //     imgtag.style.height = 15;
    //     log.appendChild(imgtag);

    //     var atag = document.createElement("a");
    //     var tab04 = document.getElementById('tab04');
    //     var tab01 = document.getElementById('tab01');
    //     atag.href = "#";
    //     atag.id = "atag" + i;

    //     function atagClicked(e){  //なんでこれでできるかわからんができたー！！
    //     // tab01.style.display = "none";  //下とどっちでも良さげ
    //     // tab04.style.display = "block";
    //     $("#tab01").hide().fadeOut(); //フェードではない
    //     $("#tab04").show().fadeIn();
    //     // $('.tabnav a:first').removeClass('active');
    //     // $(tab04).addClass('active');  //できてない
    //     console.log(array[this.num]["updated_reason_by_system"]);
    //     GetPastMapFromNode(array[this.num]["appeared_at"], array[this.num]["updated_reason_by_learner"]);
    //     };

    //     atag.addEventListener('click', {arr: array, num: i, handleEvent: atagClicked});

    //     // $(function() {
    //     //   $("#"+atag.id).on("click", function() {
    //     //   console.log("!!");
    //     //     $("#tab01").hide();
    //     //     $("#tab04").show();
    //     //   });
    //     // });
    //     atag.innerHTML = array[i]["appeared_at"] + "<br/>&emsp;テキスト：" + array[i]["content"] + "<br/>&emsp;更新理由：" + array[i]["updated_reason_by_learner"] + "<br/>";
    //     log.appendChild(atag);
    // }


}
// ----------------------- 過去のマインドマップを表示する --------------------------


// ノードver履歴からマップを復元
function ShowMapFromNode(mttime){

    $("#tab04").click();  //tab04がクリックされた時の動作

    if(mttime == "null"){
        return;
    }
    else{
        $.ajax({
        url: "php/past_sheet.php",
        type: "POST",
        data: { val : "time",
                time : mttime
                },
        success: function(data){
            var obj = JSON.parse(data); //！多分その日の最新のマップ取ってきてる

            if(obj['time'] == ""){
            alert("日時の取得に失敗しました．");
            }else{
            // 配列に変換
            var node_array = new Array();
            node_array = obj['array'];

            // 表示する関数に受け渡す
            OpenPastMap(node_array);
            }
        }
        })
    }
}

// 過去のマインドマップのノード情報を取得する
function GetPastMap(mttime){  //mttimeより前で最新のマップを表示
    //var mttime = $('#reco_period').val();//選択した年月日
    if(mttime == "null"){
        console.log("null");
        return;
    }
    else{
        $.ajax({    //mttime時点のマップのノード集合を取ってくる
            url: "php/past_sheet.php",
            type: "POST",
            data: { val : "time",
                    time : mttime
                    },
            success: function(data){
                var obj = JSON.parse(data); //mttime時点のマップ
                console.log("obj:");
                console.log(obj);
                if(obj['time'] == ""){
                    alert("日時の取得に失敗しました．");
                }else{
                    // 配列に変換
                    var node_array = new Array();
                    node_array = obj['array'];
                    console.log("node_array:");
                    console.log(node_array);
                    // 表示する関数に受け渡す
                    OpenPastMap(node_array);
                }
            }
        })

        $.ajax({
          url: "php/version_update.php",
          type: "POST",
          data: { data : "past_time_log" }
        })
    }
}

//ここから大槻修正
const GetPastMap2 = (mttime) => {  //mttimeより前で最新のマップを表示
  //var mttime = $('#reco_period').val();//選択した年月日
  if(mttime == "null"){
      console.log("null");
      return;
  }
  else{
      $.ajax({    //mttime時点のマップのノード集合を取ってくる
          url: "php/past_sheet.php",
          type: "POST",
          data: { val : "time",
                  time : mttime
                  },
          success: function(data){
              var obj = JSON.parse(data); //mttime時点のマップ
              console.log("obj:");
              console.log(obj);
              if(obj['time'] == ""){
                  alert("日時の取得に失敗しました．");
              }else{
                  // 配列に変換
                  var node_array = new Array();
                  node_array = obj['array'];
                  console.log("node_array:");
                  console.log(node_array);
                  // 表示する関数に受け渡す
                  OpenPastMap2(node_array, mttime);
              }
          }
      })

      $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "past_time_log" }
      })
  }
}

const GetPastMap3 = (mttime) => {  //mttimeより前で最新のマップを表示
  //var mttime = $('#reco_period').val();//選択した年月日
  if(mttime == "null"){
      console.log("null");
      return;
  }
  else{
      $.ajax({    //mttime時点のマップのノード集合を取ってくる
          url: "php/past_sheet.php",
          type: "POST",
          data: { val : "time",
                  time : mttime
                  },
          success: function(data){
              var obj = JSON.parse(data); //mttime時点のマップ
              console.log("obj:");
              console.log(obj);
              if(obj['time'] == ""){
                  alert("日時の取得に失敗しました．");
              }else{
                  // 配列に変換
                  var node_array = new Array();
                  node_array = obj['array'];
                  console.log("node_array:");
                  console.log(node_array);
                  // 表示する関数に受け渡す
                  OpenPastMap3(node_array, mttime);
              }
          }
      })

      $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "past_time_log" }
      })
  }
}
//ここまで大槻修正

function aaa(mttime){

    return $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "map_version_at",
                time : mttime
            },
    })

}
// 過去のマインドマップを表示する関数
function OpenPastMap(array){

    if(_jm2 != null){   // 過去のマインドマップ表示部分を呼び出されるたびに初期化
        $("#jsmind_container2").empty();
    }

    var mttime = $('#reco_period').val(); //選択した年月日





    //その前のマップ情報を表示，できたらいいな マップ消えてもうて無理
    //mttime時点とその前後のappeared_at取得
    // aaa(mttime).then(function (res) {
    //     const parse = JSON.parse(res)
    //     console.log(parse);

    //     var cont2 = document.getElementById("jsmind_container2");
    //     $("#jsmind_container2").html("");

    //     var atag = document.createElement("a");
    //     atag.href = "#";
    //     atag.id = "aa";

    //     function atagC(e){
    //         GetPastMap(parse[1]);
    //     };

    //     atag.addEventListener('click', {parse: parse, handleEvent: atagC});

    //     atag.innerHTML = "前のバージョン";
    //     cont2.appendChild(atag);
    //     //GetPastMap(parse[1]);//前

    //   });

    var mttime_str =  mttime.replace("T"," ") + ":00";
    GetMapReason(mttime_str).then(function (res) {

        const parse = JSON.parse(res);
        $('#jsmind_container2').prepend("<div>"+mttime_str+"のマインドマップ</div><div>マップバージョン更新理由："+parse[0]+"</div>");

    });    

    // テーマ設定
    var options = {
        container:'jsmind_container2',
        theme:'past_sheet',
        // editable:true
    }

    var mind2 = {
        "meta":{ // metaデータ（特に意味はないっぽい）
        "name":"jsMind remote",
        "author":"hizzgdev@163.com",
        "version":"0.2"
        },
        "format":"node_array",
        "data":array
    };
    
    _jm2 = new jsMind(options);
    _jm2.show(mind2); // jsmind_container2に表示
    
    ChangeNodesColor(array);
}

//ここから大槻修正
// 過去のマインドマップを表示する関数
const OpenPastMap2 = (array, mttime) => {
  console.log("pastmap2")
  if(_jm2 != null){   // 過去のマインドマップ表示部分を呼び出されるたびに初期化
      $("#jsmind_container2").empty();
  }
  //その前のマップ情報を表示，できたらいいな マップ消えてもうて無理
  //mttime時点とその前後のappeared_at取得
  // aaa(mttime).then(function (res) {
  //     const parse = JSON.parse(res)
  //     console.log(parse);

  //     var cont2 = document.getElementById("jsmind_container2");
  //     $("#jsmind_container2").html("");

  //     var atag = document.createElement("a");
  //     atag.href = "#";
  //     atag.id = "aa";

  //     function atagC(e){
  //         GetPastMap(parse[1]);
  //     };

  //     atag.addEventListener('click', {parse: parse, handleEvent: atagC});

  //     atag.innerHTML = "前のバージョン";
  //     cont2.appendChild(atag);
  //     //GetPastMap(parse[1]);//前

  //   });
  var mttime_str =  mttime.replace("T"," ") + ":00";
  GetMapReason(mttime_str).then(function (res) {

      const parse = JSON.parse(res);
      $('#jsmind_container2').prepend("<div>"+mttime_str+"のマインドマップ</div><div>マップバージョン更新理由："+parse[0]+"</div>");

  });    

  // テーマ設定
  const options = {
      container:'jsmind_container2',
      theme:'past_sheet',
      // editable:true
  }

  const mind2 = {
      "meta":{ // metaデータ（特に意味はないっぽい）
      "name":"jsMind remote",
      "author":"hizzgdev@163.com",
      "version":"0.2"
      },
      "format":"node_array",
      "data":array
  };
  
  _jm2 = new jsMind(options);
  _jm2.show(mind2); // jsmind_container3に表示
  
  ChangeNodesColor(array);
}

// 過去のマインドマップを表示する関数
const OpenPastMap3 = (array, mttime) => {
  console.log("pastmap3")
  if(_jm2 != null){   // 過去のマインドマップ表示部分を呼び出されるたびに初期化
      $("#jsmind_container3").empty();
  }
  //その前のマップ情報を表示，できたらいいな マップ消えてもうて無理
  //mttime時点とその前後のappeared_at取得
  // aaa(mttime).then(function (res) {
  //     const parse = JSON.parse(res)
  //     console.log(parse);

  //     var cont2 = document.getElementById("jsmind_container2");
  //     $("#jsmind_container2").html("");

  //     var atag = document.createElement("a");
  //     atag.href = "#";
  //     atag.id = "aa";

  //     function atagC(e){
  //         GetPastMap(parse[1]);
  //     };

  //     atag.addEventListener('click', {parse: parse, handleEvent: atagC});

  //     atag.innerHTML = "前のバージョン";
  //     cont2.appendChild(atag);
  //     //GetPastMap(parse[1]);//前

  //   });

  var mttime_str =  mttime.replace("T"," ") + ":00";
  GetMapReason(mttime_str).then(function (res) {

      const parse = JSON.parse(res);
      $('#jsmind_container3').prepend("<div>"+mttime_str+"のマインドマップ</div><div>マップバージョン更新理由："+parse[0]+"</div>");

  });    

  // テーマ設定
  const options = {
      container:'jsmind_container3',
      theme:'past_sheet',
      // editable:true
  }

  const mind3 = {
      "meta":{ // metaデータ（特に意味はないっぽい）
      "name":"jsMind remote",
      "author":"hizzgdev@163.com",
      "version":"0.2"
      },
      "format":"node_array",
      "data":array
  };
  
  _jm3 = new jsMind(options);
  _jm3.show(mind3); // jsmind_container3に表示
  
  ChangeNodesColor(array);
}
//ここまで大槻修正

function GetPastMapFromNode(mttime, reason){  //ノードバージョン履歴クリックして過去のマップを復元する  //結構無駄なプログラムの書き方してる
    $.ajax({
        url: "php/past_sheet.php",
        type: "POST",
        data: { val : "time",
                time : mttime
                },
        success: function(data){
            var obj = JSON.parse(data); //mttimeより前で最新のマップ
            if(obj['time'] == ""){
                alert("日時の取得に失敗しました．");
            }else{
                // 配列に変換
                var node_array = new Array();
                node_array = obj['array'];

                // 表示する関数に受け渡す
                OpenPastMapFromNode(node_array, mttime, reason);
            }
        }
    })
    $.ajax({
      url: "php/version_update.php",
      type: "POST",
      data: { data : "past_version_log" }
    })
}

// // 過去のマインドマップを表示する関数
// function OpenPastMapFromNode(array, mttime, reason){

//     if(_jm2 != null){   // 過去のマインドマップ表示部分を呼び出されるたびに初期化                   obj["time"]
//         $("#jsmind_container2").empty();
//     }
//     $('#jsmind_container2').prepend("<div>"+mttime+"のマインドマップ</div><div>ノードバージョン更新理由："+reason+"</div>");
      
//     // テーマ設定
//     var options = {
//         container:'jsmind_container2',
//         theme:'past_sheet',
//         // editable:true
//     }

//     var mind2 = {
//         "meta":{ // metaデータ（特に意味はないっぽい）
//         "name":"jsMind remote",
//         "author":"hizzgdev@163.com",
//         "version":"0.2"
//         },
//         "format":"node_array",
//         "data":array
//     };
    
//     _jm2 = new jsMind(options);
//     _jm2.show(mind2); // jsmind_container2に表示

//     ChangeNodesColor(array);

// }






// 過去のマインドマップを表示する関数
function OpenPastMapFromNode(array, mttime, reason){
  OpenNetwork(mttime, null);
  if(_jm3 != null){   // 過去のマインドマップ表示部分を呼び出されるたびに初期化                   obj["time"]
      $("#jsmind_container3").empty();
  }
  $('#jsmind_container3').prepend("<div>"+mttime+"のマインドマップ</div><div>ノードバージョン更新理由："+reason+"</div>");
    
  // テーマ設定
  var options3 = {
      container:'jsmind_container3',
      theme:'past_sheet',
      // editable:true
  }

  var mind3 = {
      "meta":{ // metaデータ（特に意味はないっぽい）
      "name":"jsMind remote",
      "author":"hizzgdev@163.com",
      "version":"0.2"
      },
      "format":"node_array",
      "data":array
  };
  
  _jm3 = new jsMind(options3);
  _jm3.show(mind3); // jsmind_container2に表示

  ChangeNodesColor(array);

}
//ここまで大槻修正


//-------------------   資料作成    ---------------------



//資料作成終了ボタンを押したとき新しいシートを作成する．
function FinishDocument(){

  //資料の内容すべて削除
    deleteDocument();

    //新しいsheet作成（ここほんとはテーブル分けるべき）
    $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "create_sheet" }
    })

    //DBから空の資料復元 動いてない～
    Rebuild_title();
  // Rebuild_s().then(() => {  

  //   Rebuild_content_s().then(() => {
  //     SetIndent();
  //   });

  // });
}


function deleteDocument(){

  $.ajax({
    url: "php/version_update.php",
    type: "POST",
    data: { data : "delete_document"},
});

}

//このシートに含まれる過去の資料一覧（タイトル，日付）を取得して返す(mapsから)
function GetPastDocument(){

  return $.ajax({
      url: "php/version_update.php",
      type: "POST",
      data: { data : "get_past_document"},
  })

}
//このシートに含まれる過去の資料一覧（id，タイトル，updated_at）を取得して返す(h_documentsから)
function GetDocument(){

  return $.ajax({
      url: "php/version_update.php",
      type: "POST",
      data: { data : "get_document"},
  })

}

//過去の資料一覧表示
function ShowDocumentList(){
  //hatakeyama
  GetPastDocument().then(function (res) {
    const parse = JSON.parse(res);
    console.log(parse);
    var select = document.getElementById("document_list");


    for(i=0;i<parse.length;i++){
      var datestrings = parse[i]["updated_at"].split(' ');  //年月日だけ
      var option = document.createElement("option");
      option.text = datestrings[0] + "：" + parse[i]["scenario_title"];
      option.value = parse[i]["updated_at"];
      select.appendChild(option);



      //$('#document_list').append($('<option>').html(parse[i]["scenario_title"]).val(parse[i]["updated_at"]));　//こっちの書き方でもよし
    }
  });
}

//（タイトル，日付）押すと時間取得して，資料とマップ復元
function PastDocumentButton(){
  let select = document.getElementById('document_list');
  var area = document.getElementById("document_area");

  //$('#document_area').empty();

  //一旦資料全削除

  console.log(select.value);
  //資料復元
  Rebuild_Past(select.value);

  //マップ復元
  GetPastMapFromNode(select.value, "資料作成終了")  //mttime, reason

}










//時間を指定（誤差前後3秒）して過去の資料を復元する
function Rebuild_Past(endtime){

  Rebuild_title_Past(endtime);

  Rebuild_s_Past(endtime).then(() => {  
  
    Rebuild_content_s_Past(endtime).then(() => {
      SetIndent();
    });
  
  });
  
}

function Rebuild_title_Past(endtime){
    $.ajax({
          url: "php/title_rebuild_past.php",
          type: "POST",
          data: { endtime : endtime},
          success: function(title){
          var parse = JSON.parse(title);
          console.log(title);
          var scenario_title = parse[0].scenario_title;
          const title_value = document.getElementById("scenario_title");
          title_value.value = scenario_title;
          },
        error:function(){
          console.log("エラーです");
        }
      });
  }
  async function Rebuild_s_Past(endtime){

    await $.ajax({
        url: "php/document_rebuild_past.php",
        type: "POST",
        data: { endtime : endtime},
        success: function(arr){
          if(arr == "[]"){
            // console.log(arr);
          }else{
            // console.log(arr);
            var parse = JSON.parse(arr);
            // console.log(parse);//スライドの内容
  
            for(var i=0; i<parse.length; i++){
              for(var j=0; j<parse.length; j++){
                if(String(i) == parse[j].rank){
                  // console.log(parse[j].rank);
                  const newslide = new Slide({
                    slide_title: parse[j].title,
                    slide_id: parse[j].slide_id,
                    logic_option: parse[j].logic_option,
                    node_id: parse[j].node_id,
                    concept_id: parse[j].concept_id
                  });  
                  delete newslide;
                  console.log("スライド再現完了");
                  break;
                }
              }
            }
          }
          // console.log("スライドOK");
  
          //2022-11-23 shimizu 中身を追加
          for(var LogicLabel in Output_ConceptIDtoClassLabel){
            // console.log(LogicLabel);
            // console.log(Output_ConceptIDtoClassLabel[LogicLabel]);
            var Label = LogicLabel;
            $("select[name='Logic_options_title']").append(new Option(Label, Output_ConceptIDtoClassLabel[LogicLabel]));
          }
          //関数を追加
          let selectTitleLogic = document.querySelectorAll("[name='Logic_options_title']");
          selectTitleLogic.forEach(select => select.addEventListener('change', ChangeLogicSelectTitle));
          //選択ずみの値を設定
          console.log(parse);
          if(parse.length !== undefined){ //エラー
            for(var q=0; q<parse.length; q++){
              //console.log(parse[q].slide_id);
              var selected_id = "SelectBox-"+parse[q].slide_id;
              //console.log(selected_id);
              var objSelect = document.getElementById(selected_id);
              // console.log(parse[q].logic_option)
              objSelect.options[parse[q].logic_option].selected = true;
              
            }
          }
          
          // console.log("選択肢を追加");
          return 'スライドOK';
        },
        error:function(){
          console.log("エラーです");
        }
    });
    
  }
  async function Rebuild_content_s_Past(endtime){
    await $.ajax({
	    url: "php/document_content_rebuild.php",
	    type: "POST",
	    success: function(arr){
        if(arr == "[]" || arr == ""){
          console.log(arr);
        }else{
          var parse = JSON.parse(arr);
          // console.log(parse);
          var bro_id = "root";
          let j = 0;
          let num = parse.length;
          
          while(num>0){
            if(parse[j].brother_id == bro_id){
              const newContent = new Content({
                content_id: parse[j].item_content_id,
                node_id: parse[j].node_id,
                content: parse[j].content,
                slide_id: parse[j].item_id,
                type: parse[j].type,
                brother_id: parse[j].brother_id,
                indent: parse[j].indent,
                logic_option: parse[j].logic_option,
              });
              delete newContent;

              bro_id = parse[j].item_content_id; // 更新
              console.log(parse[j].item_content_id);
              num--;
              j = 0;
            }else{
              j++;
            }
          }
          

          console.log("コンテント再現完了");

          SetIndent();

          //2022-11-23 論理構成意図を選択するためのセレクトボックスの中身を追加
          for(var LogicLabel in Base_ClassLabeltoConceptID){
            // console.log(LogicLabel);
            // console.log(Output_ConceptIDtoClassLabel[LogicLabel]);
            var Label = LogicLabel;
            if(Label == "事実[自身]" || Label == "事実[世の中]" || Label == "仮説[自身]" || Label == "仮説[世の中]"){
              $("select[name='Logic_options_contents']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
            }
            // $("select[name='Logic_options_contents']").append(new Option(Label, Base_ClassLabeltoConceptID[LogicLabel]));
          }
          let selectContentLogic = document.querySelectorAll("[name='Logic_options_contents']");
          selectContentLogic.forEach(select => select.addEventListener('change', ChangeLogicSelectContent))
          //選択ずみの値を設定
          for(var q=0; q<parse.length; q++){
            // console.log(parse[q].slide_id);
            var selected_id = "SelectBox-"+parse[q].item_content_id;
            var objSelect = document.getElementById(selected_id);
            // console.log(parse[q].item_content_id)
            // console.log(parse[q].logic_option)
            // console.log(objSelect);
            objSelect.options[parse[q].logic_option].selected = true;
            
          }
          // console.log("選択肢を追加");
        }
      },
      error:function(){
        console.log("エラーです");
      }
	});
  
    //2022-12-21 付与した関係性があれば追加する
    await $.ajax({
      url: "php/get_LogicRelation.php",
      type: "POST",
      success: function(arr){
        if(arr == "[]"){
          console.log(arr);
        }else{
          console.log(arr);
          var parse = JSON.parse(arr);
          // console.log(parse);//スライド上に追加してあるのノードの内容
          // console.log(parse.length);//スライド上に追加してあるのノードの個数
          
          for(var i=0; i<parse.length; i++){
            // var delete_button_id1 = "DeleteButton-"+parse[i].doc_con1_id;
            // var delete_button_id2 = "DeleteButton-"+parse[i].doc_con2_id;
            // var delete_button1 = document.getElementById(delete_button_id1);
            // var delete_button2 = document.getElementById(delete_button_id2);
            var select_box_id1 = "SelectBox-"+parse[i].item_content1_id;
            var select_box_id2 = "SelectBox-"+parse[i].item_content2_id;
            var select_box1 = document.getElementById(select_box_id1);
            var select_box2 = document.getElementById(select_box_id2);
            
            var createElement1 = document.createElement('span')
            if(parse[i].item_content1_label == "前提" || parse[i].item_content1_label == "提案"){
              createElement1.id = parse[i].id+","+parse[i].item_content1_id;
              createElement1.className = "badge bg-blue";
              createElement1.textContent = parse[i].item_content1_label; 
              // delete_button1.after(createElement1);
              select_box1.after(createElement1);
            }else if(parse[i].item_content1_label == "主張" || parse[i].item_content1_label == "根拠"){
              createElement1.id = parse[i].id+","+parse[i].item_content1_id;
              createElement1.className = "badge bg-red";
              createElement1.textContent = parse[i].item_content1_label; 
              // delete_button1.after(createElement1);
              select_box1.after(createElement1);
            }else if(parse[i].item_content1_label == "事実" || parse[i].item_content1_label == "推測"){
              createElement1.id = parse[i].id+","+parse[i].item_content1_id;
              createElement1.className = "badge bg-green";
              createElement1.textContent = parse[i].item_content1_label; 
              // delete_button1.after(createElement1);
              select_box1.after(createElement1);
            }else if(parse[i].item_content1_label == "議論目的" || parse[i].item_content1_label == "指針"){
              createElement1.id = parse[i].id+","+parse[i].item_content1_id;
              createElement1.className = "badge bg-yellow";
              createElement1.textContent = parse[i].item_content1_label;  
              // delete_button1.after(createElement1);
              select_box1.after(createElement1);
            }
  
            var createElement2 = document.createElement('span')
            if(parse[i].item_content2_label == "前提" || parse[i].item_content2_label == "提案"){
              createElement2.id = parse[i].id+","+parse[i].item_content2_id;
              createElement2.className = "badge bg-blue";
              createElement2.textContent = parse[i].item_content2_label; 
              // delete_button2.after(createElement2);
              select_box2.after(createElement2);
            }else if(parse[i].item_content2_label == "主張" || parse[i].item_content2_label == "根拠"){
              createElement2.id = parse[i].id+","+parse[i].item_content2_id;
              createElement2.className = "badge bg-red";
              createElement2.textContent = parse[i].item_content2_label; 
              // delete_button2.after(createElement2);
              select_box2.after(createElement2);
            }else if(parse[i].item_content2_label == "事実" || parse[i].item_content2_label == "推測"){
              createElement2.id = parse[i].id+","+parse[i].item_content2_id;
              createElement2.className = "badge bg-green";
              createElement2.textContent = parse[i].item_content2_label; 
              // delete_button2.after(createElement2);
              select_box2.after(createElement2);
            }else if(parse[i].item_content2_label == "議論目的" || parse[i].item_content2_label == "指針"){
              createElement2.id = parse[i].id+","+parse[i].item_content2_id;
              createElement2.className = "badge bg-yellow";
              createElement2.textContent = parse[i].item_content2_label;  
              // delete_button2.after(createElement2);
              select_box2.after(createElement2);
            }
                
          }
          console.log("関係性を追加");
        }
      },
      error:function(){
        console.log("エラーです");
      }
  });
}

//20230130shimizu 
async function GetPairNodeId_ContentRelationTable(node_id)
{
    await $.ajax({
        url: "php/get_NodeIDLogicRelation.php",
        type: "POST",
        data: { node_id   : node_id},
        success: function(arr){
          if(arr == "[]"){
          }else{
            //console.log(arr);
            var parse = JSON.parse(arr);
            console.log(parse);

            console.log("これを根拠とした関係性がある");
            //1.関係性があるノードの色を変更する
            console.log(parse.length);

            var jmnode = document.getElementsByTagName("jmnode");
            
            for(var logic_pair_count = 0; logic_pair_count<parse.length; logic_pair_count++){
                //console.log(parse[logic_pair_count].node2_id); //ペアのnode_id
                var LogicPairNodeID  = parse[logic_pair_count].node2_id;
                for(var node_count=0; node_count<jmnode.length; node_count++){
                    //選択したノードにペアとなるノードがあればそのノードの色を変更
                    if(jmnode[node_count].getAttribute("nodeid") == LogicPairNodeID){
                      for(var i = 0; i<jmnode.length;i++){
                        if(jmnode[i].getAttribute("nodeid") == node_id){
                          console.log(node_count);
                          jmnode[node_count].style.backgroundColor = "#ff69b4";
                          jmnode[node_count].style.border = "5px solid #9fd94f";
                          alert("資料上で["+parse[logic_pair_count].item_content1_label+"]と位置付けている「"+jmnode[i].innerHTML+"」に変更がありました．これに基づいて考えられた["+parse[logic_pair_count].item_content2_label+"]の["+jmnode[node_count].innerHTML+"]も考え直す必要はないか検討してみましょう！");
  
                          $.ajax({
                            url: "php/version_update.php",
                            type: "POST",
                            data: { data : "relation_advice" }
                          })
                        }
                      }

                    }
                }
            }

          }
        },
        error:function(){
          console.log("エラーです");
        }
    });
}