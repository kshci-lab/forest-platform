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
        // GetPairNodeId_ContentRelationTable(nodeID);

        // 親ノードIDがnodeIDと一致する子ノードのインデックスを取得
        node.children.forEach(childNode => {
            // ノードのDOM要素を取得
            const childID = childNode.id;
            
            if (childID) {
                proposeThinkingProcess(childID);
            }
        });

        proposeThinkingProcess(nodeID);

       
    },
    error: function () {
      console.log("node_versionsに保存失敗");
    },
  });