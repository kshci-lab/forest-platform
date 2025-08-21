let defaultLogicNetwork;
let defaultRecordLogicNetwork;

class LogicNetwork {
  constructor(container, load) {
    defaultRecordLogicNetwork = new RecordLogicNetwork();
    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();
    
    // 三角形のサイズを定数として定義
    this.TRIANGLE_SIZE = 100; // 三角形の辺の長さ
    
    this.options = {
      physics: false, // ノードが物理演算で動かないようにする
      interaction: {
        multiselect: false,
        dragNodes: false, // ノードのドラッグを無効化
      },
      edges: {
      smooth: false // これを追加
      },
      nodes: {
        fixed: true, // ノードを固定位置に配置
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
  addNode(node_id, label, node_x, node_y, concept_id = null, node_type = null) {
    let node_color = '#fffacd';
    let node_shape = 'box';
    
    // ラベルが長い場合は自動で改行を挿入
    let formatted_label = this.formatLabelWithLineBreaks(label);
    
    const newNode = {
      id: node_id,
      label: formatted_label,
      color: node_color,
      shape: node_shape,
      x: node_x,
      y: node_y,
      concept_id: concept_id, // conceptIDを追加
      node_type: node_type // ノードタイプを追加
    };
    this.nodes.add(newNode);
    console.log(concept_id);
    // defaultRecordLogicNetwork.record_LogicNode(node_id, label, node_x, node_y, concept_id);
    return this.nodes;
  }

  // ラベルに自動改行を挿入する関数
  formatLabelWithLineBreaks(label, maxCharsPerLine = 10) {
    if (!label || label.length <= maxCharsPerLine) {
      return label;
    }
    
    let result_label = '';
    for (let i = 0; i < label.length; i += maxCharsPerLine) {
      result_label += label.substr(i, maxCharsPerLine) + '\n';
    }
    return result_label.trim(); // 末尾の不要な改行を除去
  }

  //ノードのラベル編集(完了)
  editNode(node_id, node_content) {
    //ノードのラベルの編集
    const node = this.nodes.get(node_id);
    if (node) { // IDに相当するノードがある場合の中身を編集
      // 元のラベルがnullまたは空の場合（削除済みノード）をチェック
      const wasDeleted = !node.label || node.label === null || node.label === '';
      
      let result_label = '';
      for (let i = 0; i < node_content.length; i += 10) {
        result_label += node_content.substr(i, 10) + '\n';
      }
      result_label = result_label.trim(); // 末尾の不要な改行を除去
      
      // ノードの情報を更新
      const updatedNode = {
        ...node,
        label: result_label
      };
      
      // 元が削除済みノードの場合、色とスタイルを復元
      if (wasDeleted && result_label.length > 0) {
        updatedNode.color = '#fffacd'; // 通常のノード色に復元
      }
      
      // Forestから反映されたノードの場合は点線スタイルを保持
      if (node.forest_origin) {
        updatedNode.borderWidth = 2;
        updatedNode.borderWidthSelected = 2;
        updatedNode.shapeProperties = {
          borderDashes: [5, 5] // 点線のパターンを保持
        };
      }
      
      // 編集を反映
      this.nodes.update(updatedNode);
      defaultRecordLogicNetwork.edit_LogicNode(node.id, result_label);
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

  //ノードを削除する（内容をクリアする）
  deleteNode (){
    const selectNodeId = this.ownNetwork.getSelection().nodes[0];
    if(selectNodeId !== undefined){
        
        // ノード自体は削除せず、ラベルを空にしてクリアした状態にする
        const clearedNode = {
          id: selectNodeId,
          label: "", // ラベルを空にする
          color: '#f0f0f0', // 色を薄いグレーに変更してクリア状態を示す
          shape: 'box'
        };
        this.nodes.update(clearedNode);
    }
    // データベース側でもノードの内容をNULLにする
    defaultRecordLogicNetwork.delete_LogicNode(selectNodeId);
  }

  //エッジを追加する
  addEdge(E_start, E_end) {
    this.edges.add({ from: E_start, to: E_end });
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
      }
    }
  }

  CheckSelectedNode(){
    console.log("CheckSelectedNode: 開始");
    
    try {
      let selected_node = null;
      
      // _jmが定義されているか確認
      if (typeof _jm === 'undefined') {
        console.warn("CheckSelectedNode: _jmが定義されていません");
        return null;
      }
      
      // get_selected_nodeが関数かどうか確認
      if (typeof _jm.get_selected_node !== 'function') {
        console.warn("CheckSelectedNode: _jm.get_selected_nodeが関数ではありません");
        return null;
      }
      
      const selectedNodeResult = _jm.get_selected_node();
      console.log("CheckSelectedNode: _jm.get_selected_node() result =", selectedNodeResult);
      
      if (selectedNodeResult == false || selectedNodeResult === null) {
        // last_selected_nodeが定義されているか確認
        if (typeof last_selected_node !== 'undefined') {
          selected_node = last_selected_node;
          console.log("CheckSelectedNode: last_selected_nodeを使用 =", selected_node);
        } else {
          console.warn("CheckSelectedNode: last_selected_nodeが定義されていません");
          selected_node = null;
        }
      } else {
        selected_node = selectedNodeResult;
        console.log("CheckSelectedNode: 選択されたノード =", selected_node);
      }
      
      return selected_node; // 選択中のノード情報を返す
      
    } catch (error) {
      console.error("CheckSelectedNode: エラーが発生しました:", error);
      return null;
    }
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

  // 独立した三角ロジック群の数をカウントする補助関数
  countIndependentTriangleGroups() {
    const edges = this.edges.get();
    const nodeConnections = new Map();
    
    // エッジからノードの接続情報を構築
    edges.forEach(edge => {
      if (!nodeConnections.has(edge.from)) {
        nodeConnections.set(edge.from, new Set());
      }
      if (!nodeConnections.has(edge.to)) {
        nodeConnections.set(edge.to, new Set());
      }
      nodeConnections.get(edge.from).add(edge.to);
      nodeConnections.get(edge.to).add(edge.from);
    });

    // 三角形を検出し、グループ化
    const triangleGroups = [];
    const visitedNodes = new Set();
    
    for (const [nodeA, connectionsA] of nodeConnections) {
      if (visitedNodes.has(nodeA)) continue;
      
      for (const nodeB of connectionsA) {
        if (visitedNodes.has(nodeB)) continue;
        
        for (const nodeC of connectionsA) {
          if (nodeC === nodeB || visitedNodes.has(nodeC)) continue;
          
          if (nodeConnections.get(nodeB).has(nodeC) && 
              nodeConnections.get(nodeC).has(nodeB)) {
            
            // 三角形を発見 - この三角形と接続されている全ノードをグループとする
            const group = new Set([nodeA, nodeB, nodeC]);
            const toVisit = [nodeA, nodeB, nodeC];
            
            // 接続されている全ノードを探索（階層的な三角形も含む）
            while (toVisit.length > 0) {
              const currentNode = toVisit.pop();
              if (nodeConnections.has(currentNode)) {
                for (const connectedNode of nodeConnections.get(currentNode)) {
                  if (!group.has(connectedNode)) {
                    group.add(connectedNode);
                    toVisit.push(connectedNode);
                  }
                }
              }
            }
            
            // グループに含まれる全ノードを訪問済みにマーク
            for (const node of group) {
              visitedNodes.add(node);
            }
            
            triangleGroups.push(group);
            break;
          }
        }
        if (visitedNodes.has(nodeA)) break;
      }
    }
    
    return triangleGroups.length;
  }

  maketriangle(topic, f_node_id) {
    if (topic === undefined) {
      topic = "New claim";
    }
    
    const reason_content = "New reason";
    const fact_content = "New fact";

    // 独立した三角ロジック群の数に基づいて位置を決定
    const independentGroups = this.countIndependentTriangleGroups();
    const gridSpacing = 300; // 三角形群間の間隔を大きめに設定
    
    // 右に並べるレイアウト（横一列）
    const centerX = independentGroups * gridSpacing;
    const centerY = 0; // Y座標は固定
    const size = this.TRIANGLE_SIZE; // 三角形の辺の長さ

    console.log(`新しい三角形グループ ${independentGroups + 1} を作成中 (位置: x=${centerX}, y=${centerY})`);

    // 三角形の頂点の座標を計算
    const node1X = centerX;
    const node1Y = centerY - size / Math.sqrt(3); // 上の頂点
    const node2X = centerX - size / 2;
    const node2Y = centerY + size / (2 * Math.sqrt(3)); // 左下の頂点
    const node3X = centerX + size / 2;
    const node3Y = centerY + size / (2 * Math.sqrt(3)); // 右下の頂点

    // ノードを追加（ノードタイプを指定）
    const triangle_id = this.generateUniqueNumberText();
    const claim_id = this.generateUniqueNumberText();
    const reason_id = this.generateUniqueNumberText();
    const fact_id = this.generateUniqueNumberText();

    this.addNode(claim_id, topic, node1X, node1Y, f_node_id, "claim"); // 主張ノード
    this.addNode(reason_id, reason_content, node2X, node2Y, null, "reason"); // 理由ノード
    this.addNode(fact_id, fact_content, node3X, node3Y, null, "fact"); // 事実ノード

    // エッジを追加して三角形を形成
    this.addEdge(claim_id, reason_id);
    this.addEdge(reason_id, fact_id);
    this.addEdge(fact_id, claim_id);

    console.log("三角形を作成しました");

    defaultRecordLogicNetwork.record_LogicNode(claim_id, topic, node1X, node1Y, f_node_id);
    defaultRecordLogicNetwork.record_LogicNode(reason_id, reason_content, node2X, node2Y);
    defaultRecordLogicNetwork.record_LogicNode(fact_id, fact_content, node3X, node3Y);
    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, claim_id, reason_id, fact_id)
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
    console.log("applyForestToTriangle: 開始");
    
    try {
      // 左側（マインドマップ）の選択ノードを取得
      const f_node = this.CheckSelectedNode();
      console.log("applyForestToTriangle: f_node =", f_node);
      
      if (!f_node || !f_node.topic) {
        alert("左側のノードを選択してください");
        return;
      }

      // 右側（論理ネットワーク）の選択ノードを取得
      const LogicNodeId = this.ownNetwork.getSelection().nodes[0];
      console.log("applyForestToTriangle: LogicNodeId =", LogicNodeId);
      
      if (!LogicNodeId) {
        alert("右側のノードを選択してください");
        return;
      }

      // 右側ノードの現在の状態をチェック
      const currentLogicNode = this.nodes.get(LogicNodeId);
      const wasDeleted = !currentLogicNode.label || currentLogicNode.label === null || currentLogicNode.label === '';

      // 右側ノードのラベルを左側ノードの内容で更新
      console.log("applyForestToTriangle: editNodeを呼び出し");
      this.editNode(LogicNodeId, f_node.topic);
      
      // Forestから反映されたノードに特別なスタイルを適用
      const updatedNode = this.nodes.get(LogicNodeId);
      this.nodes.update({
        ...updatedNode,
        color: '#fffacd', // 通常のノード色
        borderWidth: 2,
        borderWidthSelected: 2,
        shapeProperties: {
          borderDashes: [5, 5] // 点線のパターン [線の長さ, 間隔の長さ]
        },
        forest_origin: true // Forestから反映されたことを示すフラグ
      });
      
      // 削除済みノードだった場合の追加処理
      if (wasDeleted && f_node.topic.length > 0) {
        console.log("削除済みノードを復元しました");
      }
      
      alert("右側ノードの内容を更新しました");
      
      // f_node_idは文字列として渡す（オブジェクト全体ではなくIDのみ）
      const f_node_id = f_node.id || "default";
      console.log("applyForestToTriangle: update_f_to_LogicNodelabelを呼び出し, f_node_id =", f_node_id);
      
      defaultRecordLogicNetwork.update_f_to_LogicNodelabel(LogicNodeId, f_node.topic, f_node_id);
      
    } catch (error) {
      console.error("applyForestToTriangle: エラーが発生しました:", error);
      alert("エラーが発生しました: " + error.message);
    }
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
    const size = this.TRIANGLE_SIZE; // 三角形の辺の長さ
  
    // 三角形の他の2つの頂点の座標を計算（maketriangleと同じ計算式を使用）
    // 選択されたノードを上の頂点として扱い、残り2つのノードを下に配置
    const node2X = centerX - size / 2;
    const node2Y = centerY + size / Math.sqrt(3); // 左下の頂点
    const node3X = centerX + size / 2;
    const node3Y = centerY + size / Math.sqrt(3); // 右下の頂点
    
    // 新しい三角ロジックのIDを生成
    const triangle_id = this.generateUniqueNumberText();
    // 新しいノードのIDを生成
    const reason_id = this.generateUniqueNumberText();
    const fact_id = this.generateUniqueNumberText();
  
    // 新しいノードを追加
    this.addNode(reason_id, "Reason", node2X, node2Y);
    this.addNode(fact_id, "Fact", node3X, node3Y);

    // エッジを追加して三角形を形成
    this.addEdge(selectedNodeId, reason_id);
    this.addEdge(reason_id, fact_id);
    this.addEdge(fact_id, selectedNodeId);

    defaultRecordLogicNetwork.record_LogicNode(reason_id, "Reason", node2X, node2Y);
    defaultRecordLogicNetwork.record_LogicNode(fact_id, "Fact", node3X, node3Y);
    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, baseNode.id, reason_id, fact_id);

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
        // ラベルがNULLまたは空の場合は削除済みノードとして扱う
        const isDeleted = !node.label || node.label === null || node.label === '';
        
        const restoredNode = {
          id: node.node_id,
          label: isDeleted ? "" : (node.label || "Node"),
          x: parseFloat(node.x) || 0,
          y: parseFloat(node.y) || 0,
          color: isDeleted ? '#f0f0f0' : '#fffacd', // 削除済みは薄いグレー
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
  record_LogicTriangle(triangle_id, claim_id, reason_id, fact_id){
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        triangle_id : triangle_id,
        claim_id : claim_id,
        reason_id : reason_id,
        fact_id : fact_id,
        purpose : 'record',
        record_thing : 'triangle'
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

  record_LogicNode(node_id, label, node_x, node_y, f_node_id) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        node_id: node_id,
        label: label,
        x: node_x,
        y: node_y,
        f_node_id: f_node_id,
        purpose: 'record',
        record_thing: 'node'
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

  edit_LogicNode(node_id, new_label) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        node_id: node_id,
        new_label: new_label,
        purpose: 'update',
        update_thing: 'label'
      },
      dataType: "json",
      success: function(response) {
        console.log("ラベル編集レスポンス:", response);
        if (response.status === "success") {
          console.log("ラベル編集成功:", response.node_id);
        } else {
          console.error("ラベル編集エラー:", response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error("ラベル編集通信エラー:", error);
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
        update_thing: 'f_to_LogicNodelabel'
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
  window.defaultLogicNetwork = defaultLogicNetwork; // windowオブジェクトに明示的に設定
  
  // データベースから復元
  await defaultLogicNetwork.initializeFromDatabase();
  
  // デバッグ用: 初期化確認
  console.log('defaultLogicNetwork initialized:', !!window.defaultLogicNetwork);
  console.log('ownNetwork exists:', !!window.defaultLogicNetwork.ownNetwork);
  
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

  // mynetwork（ネットワークエリア）に右クリックイベントを追加
  const mynetwork = document.getElementById('mynetwork');
  console.log('mynetwork要素:', mynetwork); // デバッグ用
  
  if (mynetwork) {
    mynetwork.addEventListener('contextmenu', function(e) {
      console.log('ネットワーク右クリックイベント発生'); // デバッグ用
      e.preventDefault(); // デフォルトの右クリックメニューを無効化
      
      // コンテキストメニューの位置を設定
      const menu = document.getElementById('logic_conmenu');
      console.log('メニュー要素:', menu); // デバッグ用
      if (menu) {
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.className = 'on'; // メニューを表示
        console.log('メニューを表示しました'); // デバッグ用
      } else {
        console.log('logic_conmenuが見つかりません'); // デバッグ用
      }
    });
  } else {
    console.log('mynetworkが見つかりません'); // デバッグ用
  }

  // 画面のどこかをクリックしたらコンテキストメニューを非表示にする
  document.addEventListener('click', function() {
    const menu = document.getElementById('logic_conmenu');
    if (menu) {
      menu.className = '';
    }
  });

  // 初期化時に logic_conmenu を確実に非表示にする
  const logicMenu = document.getElementById('logic_conmenu');
  if (logicMenu) {
    logicMenu.className = '';
  }
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