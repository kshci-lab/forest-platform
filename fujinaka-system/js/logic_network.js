let defaultLogicNetwork;
let defaultRecordLogicNetwork;

class LogicNetwork {
  constructor(container, load) {
    defaultRecordLogicNetwork = new RecordLogicNetwork();
    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();
    this.options = {
      physics: false,
      interaction: {
        multiselect: false,
      },
      edges: {
      smooth: false // これを追加
      }
    };
    this.latest_selected_node_info = {
      x: 0,
      y: 35,
    }
    this.network = null;
    this.edgeEditMode = false; //リンクの編集モード
    this.dragStartNodeId = null;  //ドラッグスタートしたノードのID
    this.dragEndNodeId = null; //ドラッグエンドしたノードID

    this.ownNetwork = this.generateLogicNetworkCanvas(container, this.nodes, this.edges);
      if(load == "load")
        this.ownNetwork.on('dragStart', this.dragstart.bind(this));
        this.ownNetwork.on('dragEnd', this.dragend.bind(this));
        this.ownNetwork.on('doubleClick', this.doubleclick.bind(this));
  }

  setNodes(newNodes) {
    this.nodes = newNodes;
  }
  setEdges(newEdges) {
    this.edges = newEdges;
  }
  setOptions(options) {
    this.options = options;
  }

  //エッジ編集できるか切り替え
  SelectEditEdge(){
    console.log("切り替え");
    this.edgeEditMode = !this.edgeEditMode;
    if(this.edgeEditMode){
      this.enableEditEdge();
    }else{
      this.disableEditEdge();
    }
  }

  //エッジ編集できる場合の処理
  enableEditEdge() {
    document.getElementById("ln_startEditEdge").value = "エッジ追加終了";
    this.nodes.update(this.nodes.map(n => {
      return { ...n, fixed: true };
    }));
  }

  //エッジ編集できない場合の処理
  disableEditEdge() {
    document.getElementById("ln_startEditEdge").value = "エッジ追加";
    this.edgeEditMode = false;
    this.nodes.update(this.nodes.map(n => {
      return n.type !== "topic-tag" ? { ...n, fixed: false } : { ...n, fixed: true };
    }));
  }

  //乱数生成
  generateUniqueNumberText() {
    return `${new Date().getTime()}${Math.floor(1000000 * Math.random())}`;
  }

  //ネットワークを生成する
  generateLogicNetworkCanvas(mynetwork, nodes, edges) {
    return new vis.Network(
      document.getElementById(mynetwork),
      {
        nodes: nodes,
        edges: edges,
      },
      this.options
    );
  }

  //ノードを追加する
  addNode(node_id, label, node_x, node_y, concept_id = null) {
    let node_color = '#fffacd';
    let node_shape = 'box';
    const newNode = {
      id: node_id,
      label: label,
      color: node_color,
      shape: node_shape,
      x: node_x,
      y: node_y,
      concept_id: concept_id // conceptIDを追加
    };
    this.nodes.add(newNode);
    console.log(concept_id);
    // defaultRecordLogicNetwork.record_LogicNode(node_id, label, node_x, node_y, concept_id);
    return this.nodes;
  }

  //ノードのラベル編集(完了)
  editNode(node_id, node_content) {
    //ノードのラベルの編集
    const node = this.nodes.get(node_id);
    if (node) { // IDに相当するノードがある場合の中身を編集
      let result_label = '';
      for (let i = 0; i < node_content.length; i += 10) {
        result_label += node_content.substr(i, 10) + '\n';
      }
      result_label = result_label.trim(); // 末尾の不要な改行を除去
      node.label = result_label;
      // 編集を反映
      this.nodes.update(node);
    }
  }

    //ダブルクリックでラベル編集
  doubleclick (params) {
    console.log('Double-click event triggered:', params); // デバッグ用
    params.event.preventDefault();
    const clickedNodeId = params.nodes[0];
    if (clickedNodeId !== undefined) {
      // ユーザーに新しいラベルを尋ね、それをノードの中身に設定
      const newLabel = prompt('新しいラベルを入力してください:', this.nodes.get(clickedNodeId).label.split('\n').join(''));
      // 編集したラベルを反映
      if (newLabel !== null) {
        this.editNode(clickedNodeId, newLabel);
      }
    }
    
  }

  //ノードを削除する
  deleteNode (){
    const selectNodeId = this.ownNetwork.getSelection().nodes[0];
    if(selectNodeId !== undefined){
        this.edges.remove(this.ownNetwork.getConnectedEdges(selectNodeId));
        this.nodes.remove({id: selectNodeId});
    }
    defaultRecordLogicNetwork.delete_LogicNode(selectNodeId);
    defaultRecordLogicNetwork.delete_LogicEdge(selectNodeId, "");
    defaultRecordLogicNetwork.delete_LogicEdge("", selectNodeId);
  }

  //エッジを追加する
  addEdge(E_start, E_end) {
    this.edges.add({ from: E_start, to: E_end });
    // defaultRecordLogicNetwork.record_LogicEdge(E_start, E_end);
  }

  //ドラッグ開始
  dragstart(params) {
    if (!this.edgeEditMode) {
      params.event.preventDefault();
    } else {
      this.dragStartNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
    }
  }

  //ドラッグ終了
  //edgeEditModeの場合にaddEdge
  dragend(params) {
    if (this.edgeEditMode) {
      this.dragEndNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
      if (this.dragStartNodeId !== null && this.dragEndNodeId !== null && this.dragEndNodeId !== this.dragStartNodeId && this.dragEndNodeId !== undefined && this.nodes.get(this.dragStartNodeId).shape != "ellipse" && this.nodes.get(this.dragEndNodeId).shape != "ellipse") {
        let notable = true;
        const ConnectSelectNode = [];
        const connectedEdges = this.ownNetwork.getConnectedEdges(this.dragStartNodeId);
        connectedEdges.map((n) => {
          ConnectSelectNode.push(this.ownNetwork.getConnectedNodes(n).filter(n => n !== this.dragStartNodeId)[0]);
        });
        ConnectSelectNode.map((n) => {
          if (n === this.dragEndNodeId) {
            notable = false;
          }
        });
        if (!notable) {
          return;
        }
        this.edges.add({ from: this.dragStartNodeId, to: this.dragEndNodeId });
        defaultRecordLogicNetwork.record_LogicEdge(this.dragStartNodeId, this.dragEndNodeId);
      }
      this.dragStartNodeId = null;
      this.dragEndNodeId = null;
    } else {
      //移動したノードの情報を保存
      const movedNodeId = params.nodes[0];
      if (movedNodeId !== undefined) {
        const node = this.nodes.get(movedNodeId);
        if (!node) {
          console.error(`ノードID ${movedNodeId} に該当するノードが見つかりません。`);
          return;
        }
        this.nodes.update({
          id: movedNodeId,
          x: params.pointer.x,
          y: params.pointer.y,
        })
        const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
        this.latest_selected_node_info.x = (nodeBoundingBox.right + nodeBoundingBox.left) / 2;
        this.latest_selected_node_info.y = nodeBoundingBox.bottom + 10;
        try {
          defaultRecordLogicNetwork.update_LogicNodePosition(movedNodeId, this.latest_selected_node_info.x, this.latest_selected_node_info.y);
        } catch (error) {
          console.error("Error updating defaultRecordLogicNetwork:", error);
        }
      }
    }
  }

  deleteEdge() {
    const selectEdgeId = this.ownNetwork.getSelection().edges[0];
    const startid = this.edges.get(selectEdgeId).from;
    const endid = this.edges.get(selectEdgeId).to;
        if(selectEdgeId !== undefined){
            this.edges.remove({id: selectEdgeId});
        }
    defaultRecordLogicNetwork.delete_LogicEdge(startid, endid);
  }

  CheckSelectedNode(){
    let selected_node = null;
    if(_jm.get_selected_node() == false){
      selected_node = last_selected_node;
    }else{
      selected_node = _jm.get_selected_node();
    }
    return selected_node; // 選択中のノード情報を返す
  }

  // nodeIDを引数にしてconceptIDを取得する関数（presentation.jsと同様）
  GetConceptId(nodeID){
    var node_obj = document.getElementsByTagName("jmnode");
    var conceptID = "default";

    for(let k=0; k<node_obj.length; k++){
      if(node_obj[k].getAttribute("nodeid") == nodeID){//回ってきたidが選択中ノードの時
        conceptID = node_obj[k].getAttribute("concept_id");//コンセプトid
        console.log("Logic Network - ConceptID:", conceptID);
      }
      if(conceptID != "default"){//同じコンセプトIDがいくつか存在するから
        break;
      }
    }
    return conceptID;
  }

  // 現在選択されているマインドマップノードのconceptIDを取得
  getSelectedNodeConceptId(){
    const selected_node = this.CheckSelectedNode();
    if(selected_node && selected_node.id){
      return this.GetConceptId(selected_node.id);
    }
    return "default";
  }

  maketriangle(topic, f_node_id, f_reason_id = null, f_fact_id = null,) {
    if (topic === undefined) {
      topic = "New claim";
    }
    
    
    const reason_content = "New reason";
    const fact_content = "New fact";

    // 三角形の中心座標とサイズを設定
    const centerX = 0; // 中心のX座標
    const centerY = 0; // 中心のY座標
    const size = 100; // 三角形の辺の長さ

    // 三角形の頂点の座標を計算
    const node1X = centerX;
    const node1Y = centerY - size / Math.sqrt(3); // 上の頂点
    const node2X = centerX - size / 2;
    const node2Y = centerY + size / (2 * Math.sqrt(3)); // 左下の頂点
    const node3X = centerX + size / 2;
    const node3Y = centerY + size / (2 * Math.sqrt(3)); // 右下の頂点

    // ノードを追加
    const triangle_id = this.generateUniqueNumberText();
    const claim_id = this.generateUniqueNumberText();
    const reason_id = this.generateUniqueNumberText();
    const fact_id = this.generateUniqueNumberText();

    this.addNode(claim_id, topic, node1X, node1Y, f_node_id); // 最初のノードにconceptIDを設定
    this.addNode(reason_id, reason_content, node2X, node2Y);
    this.addNode(fact_id, fact_content, node3X, node3Y);

    // エッジを追加して三角形を形成
    this.addEdge(claim_id, reason_id);
    this.addEdge(reason_id, fact_id);
    this.addEdge(fact_id, claim_id);

    console.log("三角形を作成しました");

    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, claim_id, reason_id, fact_id, f_node_id, f_reason_id, f_fact_id, topic, reason_content, fact_content)
  }

  // Forestのノードを起点に三角ロジックを作成する
  createTriangleFromForest() {
    // マインドマップ側から選択ノード情報を取得
    let selected_fnode = this.CheckSelectedNode();
    if (!selected_fnode || !selected_fnode.topic) {
      alert("ノードを選択してください");
      return;
    }

    // 選択されたノードのIDを取得（conceptIDの代わり）
    const forestNodeId = selected_fnode.id;
    console.log("Selected Forest node ID:", forestNodeId);

    // maketriangleを呼び出し、ForestのノードIDを渡す
    this.maketriangle(selected_fnode.topic, forestNodeId);
  }
  // マインドマップの選択ノードの内容を論理ネットワークの選択ノードに反映する
  applyForestToTriangle() {
    // 左側（マインドマップ）の選択ノードを取得
    const f_node_id = this.CheckSelectedNode();
    if (!f_node_id || !f_node_id.topic) {
      alert("左側のノードを選択してください");
      return;
    }

    // 右側（論理ネットワーク）の選択ノードを取得
    const LogicNodeId = this.ownNetwork.getSelection().nodes[0];
    if (!LogicNodeId) {
      alert("右側のノードを選択してください");
      return;
    }

    // 右側ノードのラベルを左側ノードの内容で更新
    this.editNode(LogicNodeId, f_node_id.topic);
    alert("右側ノードの内容を更新しました");
    defaultRecordLogicNetwork.update_f_to_LogicNodelabel(LogicNodeId, f_node_id.topic, f_node_id);
  }

  // 三角ロジックの事実や理由付けを主張として三角ロジックを作成
  createTriangleFromSelectedNode() {
    // 選択されているノードを取得
    const selectedNodeId = this.ownNetwork.getSelection().nodes[0];
    if (!selectedNodeId) {
      console.error("ノードが選択されていません");
      alert("ノードを選択してください");
      return;
    }
  
    // 選択されたノードの情報を取得
    const baseNode = this.nodes.get(selectedNodeId);
    if (!baseNode) {
      console.error("選択されたノードが見つかりません");
      return;
    }
  
    // 基準ノードの座標とconceptID
    const centerX = baseNode.x;
    const centerY = baseNode.y;
    const conceptID = baseNode.concept_id || null; // 既存ノードのconceptIDを取得
    const size = 100; // 三角形の辺の長さ
  
    // 三角形の他の2つの頂点の座標を計算
    const node2X = centerX - size / 2;
    const node2Y = centerY + size / (2 * Math.sqrt(3)); // 左下の頂点
    const node3X = centerX + size / 2;
    const node3Y = centerY + size / (2 * Math.sqrt(3)); // 右下の頂点
  
    // 新しいノードのIDを生成
    const node2Id = this.generateUniqueNumberText();
    const node3Id = this.generateUniqueNumberText();
  
    // 新しいノードを追加（conceptIDは継承しない）
    this.addNode(node2Id, "Node 2", node2X, node2Y);
    this.addNode(node3Id, "Node 3", node3X, node3Y);
  
    // エッジを追加して三角形を形成
    this.addEdge(selectedNodeId, node2Id);
    this.addEdge(node2Id, node3Id);
    this.addEdge(node3Id, selectedNodeId);
  
    console.log("三角形を作成しました - 基準ノードのconceptID:", conceptID);
  }

  // データベースからロジックネットワークをロードする
  async loadLogicNetworkFromDatabase() {
    try {
      const response = await $.ajax({
        url: "php/logic_maneger.php",
        type: "POST",
        data: {
          purpose: 'load',
          load_thing: 'all'
        },
        dataType: "json"
      });

      if (response.status === "success") {
        this.restoreFromData(response.nodes, response.edges);
        console.log("ロジックネットワークを復元しました");
      } else {
        console.error("ロードエラー:", response.message);
      }
    } catch (error) {
      console.error("通信エラー:", error);
    }
  }

  // データからノードとエッジを復元する
  restoreFromData(nodeData, edgeData) {
    // 既存のノードとエッジをクリア
    this.nodes.clear();
    this.edges.clear();

    // ノードを復元
    if (nodeData && nodeData.length > 0) {
      // ノードIDでソート（作成順序を保持)
      nodeData.sort((a, b) => a.node_id.localeCompare(b.node_id));
      
      nodeData.forEach(node => {
        const restoredNode = {
          id: node.node_id,
          label: node.label || "Node",
          x: parseFloat(node.x) || 0,
          y: parseFloat(node.y) || 0,
          color: '#fffacd',
          shape: 'box',
          concept_id: node.concept_id || null
        };
        this.nodes.add(restoredNode);
      });
    }

    // エッジを復元
    if (edgeData && edgeData.length > 0) {
      edgeData.forEach(edge => {
        const restoredEdge = {
          from: edge.edge_start,
          to: edge.edge_end
        };
        this.edges.add(restoredEdge);
      });
    }
  }

  // ネットワークを更新・再描画する
  async refreshNetwork() {
    await this.loadLogicNetworkFromDatabase();
  }

  // 初期化時にデータベースから復元する
  async initializeFromDatabase() {
    await this.loadLogicNetworkFromDatabase();
  }
}

class RecordLogicNetwork{
  record_LogicTriangle(triangle_id, claim_id, reason_id, fact_id, f_claim_id, f_reason_id, f_fact_id, claim_content, reason_content, fact_content){
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        triangle_id : triangle_id,
        claim_id : claim_id,
        reason_id : reason_id,
        fact_id : fact_id,
        f_claim_id : f_claim_id,
        f_reason_id : f_reason_id,
        f_fact_id : f_fact_id,
        claim_content : claim_content,
        reason_content : reason_content,
        fact_content : fact_content,
        purpose : 'record',
      },
      dataType: "json",
      success: function(response) {
        console.log(response); // ← ここでレスポンス確認
        if (response.status === "success") {
          console.log("記録成功:", response.node_id);
        } else {
          console.error("エラー:", response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error("通信エラー:", error);
      }
    });
  }

  update_f_to_LogicNodelabel(LogicNodeId, newlabel, f_node_id) {
    $.ajax({
    url: "php/logic_maneger.php",
    type: "POST",
    data: {
      updatedNodeId: LogicNodeId,
      label: newlabel,
      f_node_id: f_node_id,
      purpose: 'update',
    },
    dataType: "json",
    success: function(response) {
      console.log("ラベル更新レスポンス:", response);
      if (response.status === "success") {
        console.log("ラベル更新成功:", response.node_id);
      } else {
        console.error("ラベル更新エラー:", response.message);
      }
    },
    error: function(xhr, status, error) {
      console.error("ラベル更新通信エラー:", error);
    }
  });
  }

  delete_LogicNode (node_id){
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        node_id : node_id,
        purpose : 'delete',
        delete_thing : 'node'
      },
      dataType: "json",
      success: function(response) {
        console.log(response); // ← ここでレスポンス確認
        if (response.status === "success") {
          console.log("記録成功:", response.node_id);
        } else {
          console.error("エラー:", response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error("通信エラー:", error);
      }
    })
  }

  record_LogicEdge (edge_start,  edge_end){
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        edge_start: edge_start,
        edge_end: edge_end,
        purpose: 'record',
        record_thing: 'edge'
      },
      dataType: "json",
      success: function(response) {
        console.log(response); // ← ここでレスポンス確認
        if (response.status === "success") {
          console.log("記録成功:", response.node_id);
        } else {
          console.error("エラー:", response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error("通信エラー:", error);
      }
    })
  }

  delete_LogicEdge (edge_start, edge_end){
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        edge_start: edge_start,
        edge_end: edge_end,
        purpose : 'delete',
        delete_thing : 'edge'
      },
      dataType: "json",
      success: function(response) {
        console.log(response); // ← ここでレスポンス確認
        if (response.status === "success") {
          console.log("記録成功:", response.node_id);
        } else {
          console.error("エラー:", response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error("通信エラー:", error);
      }
    })
  }
  

}

window.addEventListener('load', async () => {
  defaultLogicNetwork = new LogicNetwork("mynetwork", "load");
  
  // データベースから復元
  await defaultLogicNetwork.initializeFromDatabase();
  
  $('#mynetwork').css('visibility', 'visible');
  
  // 既存のイベントリスナー
  $(`#ln_addNode`).on("click", e => {
    defaultLogicNetwork.addNewNode();
  });
  $(`#ln_deleteNode`).on("click", e => {
    defaultLogicNetwork.deleteNode();
  });
  $(`#ln_startEditEdge`).on("click", e => {
    defaultLogicNetwork.SelectEditEdge();
  });
  $(`#ln_deleteEdge`).on("click", e => {
    defaultLogicNetwork.deleteEdge();
  });
  $(`ln_addjmNode`).on("click", e => {
    defaultLogicNetwork.jm_to_ls();
  });
  $(`#ln_maketriangle`).on("click", e => {
    defaultLogicNetwork.maketriangle();
  });
  $(`#ln_createtriangle`).on("click", e => {
    defaultLogicNetwork.createTriangleFromSelectedNode();
  });
  
  // 更新ボタンのイベントリスナーを追加
  $(`#ln_refresh`).on("click", async e => {
    await defaultLogicNetwork.refreshNetwork();
  });
});

// グローバル関数として追加（HTMLから呼び出すため）
async function refreshLogicNetwork() {
  if (window.defaultLogicNetwork && typeof defaultLogicNetwork.refreshNetwork === "function") {
    await defaultLogicNetwork.refreshNetwork();
  } else {
    alert("ロジックネットワークが初期化されていません");
  }
}


// document.getElementById("logic_btn").addEventListener("click", () => {
//   document.getElementById("logic_area").style.display = "block";
//   defaultLogicNetwork = new LogicNetwork("mynetwork", "load");
//   $(`#ln_addNode`).on("click", e => {
//     defaultLogicNetwork.addNode();
//   });
//   $(`#ln_deleteNode`).on("click", e => {
//     defaultLogicNetwork.deleteNode();
//   });
//   $(`#ln_startEditEdge`).on("click", e => {
//     defaultLogicNetwork.SelectEditEdge();
//   });
//   $(`#ln_deleteEdge`).on("click", e => {
//     defaultLogicNetwork.deleteEdge();
//   });
// });
function addTagToNode(nodeId, tag) {
  const node = defaultLogicNetwork.nodes.get(nodeId);
  // 既存のタグ（[主張][事実][理由付け]）を除去してから新しいタグを付与
  const newLabel = node.label.replace(/\s*\[(主張|事実|理由付け)\]$/, '') + ' [' + tag + ']';
  defaultLogicNetwork.nodes.update({ id: nodeId, label: newLabel });
}

// タグボタン生成
['主張', '事実', '理由付け'].forEach(tag => {
  const btn = document.createElement('button');
  btn.textContent = tag;
  btn.onclick = () => {
    addTagToNode(nodeId, tag);
    tagMenu.remove();
  };
  tagMenu.appendChild(btn);
});