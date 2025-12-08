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

// ノード更新ボタンが押された時の処理
function NodeVersionUpdate(){

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
        const typeID = JSON.parse(response)['node_type_id'];
        
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
             if(!res || res){
              console.log(res);
             }
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

    
}