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
        multiselect: false,// 複数選択を無効化
        // dragNodes: false, // ノードのドラッグを無効化
      },
      layout: {
        hierarchical: {
          direction: "UD", // 上下方向
          sortMethod: "none", // ノードのレベルによってソート
          levelSeparation: 150, // レベル間の距離
          nodeSpacing: 100, // ノード間の距離
        },
      },
      edges: {
        smooth: false, //エッジが直線になる
        color: {
          color: 'black', // エッジの色（黒）
        },
        width: 1
      },
    };
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
  addNode(node_id, label, f_node_id = null, p_node_id = null,node_x, node_y, edited = 0, level) {
    // ラベルが長い場合は自動で改行を挿入
    let formatted_label = this.formatLabelWithLineBreaks(label);
    
    const newNode = {
      id: node_id,
      label: formatted_label,
      x: node_x,
      y: node_y,
      shape: 'box',
      f_node_id: f_node_id,
      p_node_id: p_node_id,
      edited: edited,
      level: level
    };
    
    // スタイルを適用
    this.applyNodeStyle(newNode);
    
    this.nodes.add(newNode);
    console.log(f_node_id);
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

  // ノードにスタイルを適用するヘルパー関数
  applyNodeStyle(node) {
    // editedとf_node_id、p_node_idに基づいてスタイルを設定
    let borderWidth = 0; // 枠無し
    let borderColor = '#fffacd'; // ノードと同じ
    let backgroundColor = '#fffacd'; // デフォルトの背景色
    let borderDashes = false; //　点線はfalse（実線）
    
    // editedの値に基づいて点線/実線を決定
    // edited=0の場合は点線、edited=1の場合は実線
    if (node.edited == 0) {
      borderDashes = true; // 点線
      // 通常のノードの場合、点線を見えるようにborderWidthとcolorを設定
      if ((node.f_node_id == null || node.f_node_id == undefined) && 
          (node.p_node_id == null || node.p_node_id == undefined)) {
        borderWidth = 2;
        borderColor = '#000000'; // 黒色
      }
    } else {
      borderDashes = false; // 実線
    }
    
    // Forestから持ってきた場合（f_node_idがある場合）は緑色
    if (node.f_node_id !== null ) {
      borderWidth = 2;
      borderColor = '#228B22'; // 緑色（フォレストグリーン）
    }
    // Presentationから持ってきた場合（p_node_idがある場合）は赤色
    else if (node.p_node_id !== null) {
      borderWidth = 2;
      borderColor = '#DC143C'; // 赤色（クリムゾン）
    }
    // 通常のノードの場合は枠無し（何もしない）
    
    // ノードのスタイルを設定
    node.color = {
      background: backgroundColor,
      border: borderColor
    };
    node.borderWidth = borderWidth;
    node.borderWidthSelected = borderWidth;
    node.shapeProperties = {
      borderDashes: borderDashes
    };
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
        label: result_label,
        edited: 1 // 編集されたので1に設定
      };
      
      // スタイルを適用
      this.applyNodeStyle(updatedNode);
      
      // 元が削除済みノードの場合、色とスタイルを復元
      if (wasDeleted && result_label.length > 0) {
        updatedNode.color.background = '#fffacd'; // 通常のノード色に復元
      }
      
      // 編集を反映
      this.nodes.update(updatedNode);
      
      // データベースに編集状態を記録（edited = 1）
      defaultRecordLogicNetwork.edit_LogicNode(node.id, result_label, 1);
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
    // データベース側でもノードの内容をNULLにする（edited = 0で削除状態）
    defaultRecordLogicNetwork.delete_LogicNode(selectNodeId, 0);
  }

  //エッジを追加する
  addEdge(E_start, E_end) {
    this.edges.add({ 
      from: E_start, 
      to: E_end,
      color: {
        color: '#848484', // エッジの色（グレー）
        highlight: '#848484',
        hover: '#848484'
      }
    });
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

  //三角形を作成する基本関数
  maketriangle(topic, f_node_id, p_node_id, edited) {
    //未編集ノードのためラベルは空白
    if (topic === undefined) {
      topic = "";
    }

    //未編集ノードのためラベルは空白
    const reason_content = "";
    const fact_content = "";
    
    // 右に並べるレイアウト（横一列）
    // const centerX = independentGroups * gridSpacing;
    const centerX = 0
    const centerY = 0; // Y座標は固定
    const size = this.TRIANGLE_SIZE; // 三角形の辺の長さ


    // 三角形の頂点の座標を計算
    const node1X = centerX;
    const node1Y = centerY - size / Math.sqrt(3); // 上の頂点
    const node2X = centerX - size / 2;
    const node2Y = centerY + size / (2 * Math.sqrt(3)); // 左下の頂点
    const node3X = centerX + size / 2;
    const node3Y = centerY + size / (2 * Math.sqrt(3)); // 右下の頂点
    const node1level = 0; // 上の頂点のレベル
    const node2level = 1; // 左下の頂点のレベル
    const node3level = 1; // 右下の頂点のレベル

    // ノードを追加（ノードタイプを指定）
    const triangle_id = this.generateUniqueNumberText();
    const claim_id = this.generateUniqueNumberText();
    const reason_id = this.generateUniqueNumberText();
    const fact_id = this.generateUniqueNumberText();

    this.addNode(claim_id, topic, f_node_id, p_node_id, node1X, node1Y, edited, node1level); // 主張ノード
    this.addNode(reason_id, reason_content, null, null, node2X, node2Y, 0, node2level); // 理由ノード
    this.addNode(fact_id, fact_content, null, null, node3X, node3Y, 0, node3level); // 事実ノード

    // エッジを追加して三角形を形成
    this.addEdge(claim_id, reason_id);
    this.addEdge(reason_id, fact_id);
    this.addEdge(fact_id, claim_id);

    console.log("三角形を作成しました");

    defaultRecordLogicNetwork.record_LogicNode(claim_id, topic,  f_node_id, p_node_id, node1X, node1Y, edited, node1level);
    defaultRecordLogicNetwork.record_LogicNode(reason_id, reason_content, null, null, node2X, node2Y, 0, node2level);
    defaultRecordLogicNetwork.record_LogicNode(fact_id, fact_content, null, null, node3X, node3Y, 0, node3level);
    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, claim_id, reason_id, fact_id, "", "");
  }

  // 三角ロジックを追加する関数（修正版）
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

    // 選択ノードのレベルを取得
    const baseLevel = baseNode.level || 0;
    const newNodeLevel = baseLevel + 1; // 1つ下のレベル

    console.log(`選択ノードのレベル: ${baseLevel}, 新ノードのレベル: ${newNodeLevel}`);

    // 基準ノードの座標とf_node_id
    const centerX = baseNode.x;
    const centerY = baseNode.y;
    const f_node_id = baseNode.f_node_id || null; // 既存ノードのf_node_idを取得
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
  
    // 新しいノードを追加（選択ノードの1つ下のレベルに配置）
    this.addNode(reason_id, "", null, null, node2X, node2Y, 0, newNodeLevel);
    this.addNode(fact_id, "", null, null, node3X, node3Y, 0, newNodeLevel);

    // エッジを追加して三角形を形成
    this.addEdge(selectedNodeId, reason_id);
    this.addEdge(reason_id, fact_id);
    this.addEdge(fact_id, selectedNodeId);

    // データベースに記録（新しいレベルで記録）
    defaultRecordLogicNetwork.record_LogicNode(reason_id, "Reason", null, null, node2X, node2Y, 0, newNodeLevel);
    defaultRecordLogicNetwork.record_LogicNode(fact_id, "Fact", null, null, node3X, node3Y, 0, newNodeLevel);
    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, baseNode.id, reason_id, fact_id, "", "");

    console.log(`三角形を作成しました - 基準ノード: ${selectedNodeId} (レベル${baseLevel}), 新ノード: レベル${newNodeLevel}`);
  }

  //Forestで選択しているノードのIDとラベルを取得する関数
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
    this.maketriangle(selected_fnode.topic, forestNodeId, null, 1);
  }

  // シナリオ側から選択された要素の内容とIDを取得する関数
  getSelectedScenarioContent() {
    console.log("getSelectedScenarioContent: 開始");
    
    try {
      // 現在選択されている要素を取得
      const selectedElement = document.querySelector('.cspan[style*="border: 2px solid gray"], .tspan:focus, .text_border:focus');
      
      if (!selectedElement) {
        console.log("選択された要素が見つかりません");
        return null;
      }
      
      // 要素のテキスト内容を取得
      const elementText = selectedElement.textContent || selectedElement.innerHTML || selectedElement.value || "";
      
      if (!elementText || elementText.trim() === "") {
        console.log("選択された要素に内容がありません");
        return null;
      }
      
      // 要素のIDを取得
      const elementId = selectedElement.id || selectedElement.getAttribute('node_id') || this.generateUniqueNumberText();
      
      console.log("取得したシナリオ情報:", { text: elementText, id: elementId });
      
      return {
        text: elementText.trim(),
        id: elementId
      };
      
    } catch (error) {
      console.error("getSelectedScenarioContent: エラーが発生しました:", error);
      return null;
    }
  }

  // 論文シナリオのノードを起点に三角ロジックを作成する関数
  createTriangleFromScenario() {
    // マインドマップ側から選択ノード情報を取得
    let selected_pnode = this.getSelectedScenarioContent();
    if (!selected_pnode || !selected_pnode.text) {
      alert("ノードを選択してください");
      return;
    }
    // maketriangleを呼び出し、ForestのノードIDを渡す
    this.maketriangle(selected_pnode.text, null, selected_pnode.id, 1);
  }

  // Forestのノードの内容を三角ロジックに反映する
  applyForestToTriangle() {
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
    const styledNode = {
      ...updatedNode,
      f_node_id: f_node.id || "default", // Forestから持ってきたことを示す
      edited: 1, // Forestから持ってきたばかりなので1
    };
    // スタイルを適用
    this.applyNodeStyle(styledNode);
    // ノードを更新
    this.nodes.update(styledNode);
    // 削除済みノードだった場合の追加処理
    if (wasDeleted && f_node.topic.length > 0) {
      console.log("削除済みノードを復元しました");
    }
    
    alert("右側ノードの内容を更新しました");
    
    // f_node_idは文字列として渡す（オブジェクト全体ではなくIDのみ）
    const f_node_id = f_node.id || "default";
    console.log("applyForestToTriangle: update_f_to_LogicNodelabelを呼び出し, f_node_id =", f_node_id);
    
    // Forestから反映されたので edited = 1 を設定
    defaultRecordLogicNetwork.update_f_to_LogicNodelabel(LogicNodeId, f_node.topic, f_node_id, 1);
  }

  // 三角ロジックのノードの内容を論文シナリオの内容に反映する
  applyPresentationToTriangle() {
    // presentation側で現在選択されている要素を取得
    const selectedElement = document.querySelector('.cspan[style*="border: 2px solid gray"], .tspan:focus, .text_border:focus');
    console.log("applyPresentationToTriangle: selectedElement =", selectedElement);
      
    if (!selectedElement) {
      alert("presentation側で章、節、またはパラグラフを選択してください");
      return;
    }

    // 選択された要素のテキスト内容を取得
    const elementText = selectedElement.textContent || selectedElement.innerHTML || selectedElement.value || "";

    if (!elementText || elementText.trim() === "") {
      alert("選択された要素に内容がありません");
      return;
    }

    console.log("applyPresentationToTriangle: elementText =", elementText);

    // 論理ネットワーク側の選択ノードを取得
    const selectedLogicNodeId = this.ownNetwork.getSelection().nodes[0];
    console.log("applyPresentationToTriangle: selectedLogicNodeId =", selectedLogicNodeId);
    
    if (!selectedLogicNodeId) {
      alert("論理ネットワーク側のノードを選択してください");
      return;
    }

    // 論理ネットワークノードの現在の状態をチェック
    const currentLogicNode = this.nodes.get(selectedLogicNodeId);
    const wasDeleted = !currentLogicNode.label || currentLogicNode.label === null || currentLogicNode.label === '';

    // 論理ネットワークノードのラベルをpresentation要素の内容で更新（edited=1で実線に）
    console.log("applyPresentationToTriangle: editNodeを呼び出し");
    this.editNode(selectedLogicNodeId, elementText);
    
    // presentationから反映されたことを示すためにp_node_idを設定
    const updatedNode = this.nodes.get(selectedLogicNodeId);
    updatedNode.p_node_id = selectedElement.id || selectedElement.getAttribute('node_id') || "default";
    updatedNode.presentation_origin = true; // presentationから反映されたことを示すフラグ
    
    // 既存のapplyNodeStyleを使用してスタイルを再適用
    this.applyNodeStyle(updatedNode);
    
    // ノードを更新
    this.nodes.update(updatedNode);
    
    // 削除済みノードだった場合の追加処理
    if (wasDeleted && elementText.length > 0) {
      console.log("削除済みノードを復元しました");
    }
    
    console.log("applyPresentationToTriangle: 内容更新完了");
    alert(`論理ネットワークノードの内容を「${elementText}」で更新しました`);
    
    // presentation要素のIDを取得
    const p_element_id = selectedElement.id || selectedElement.getAttribute('node_id') || "default";
    console.log("applyPresentationToTriangle: update_p_to_LogicNodelabelを呼び出し, p_element_id =", p_element_id);
    
    // presentation ID付きでデータベースを更新
    defaultRecordLogicNetwork.update_p_to_LogicNodelabel(selectedLogicNodeId, elementText, p_element_id, 1);
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
        
        // ラベルに改行処理を適用（削除済みでない場合）
        let formattedLabel = "";
        if (!isDeleted) {
          const originalLabel = node.label || "Node";
          formattedLabel = this.formatLabelWithLineBreaks(originalLabel);
        }
        
        const restoredNode = {
          id: node.node_id,
          label: isDeleted ? "" : formattedLabel,
          x: parseFloat(node.x) || 0,
          y: parseFloat(node.y) || 0,
          shape: 'box',
          f_node_id: node.f_node_id || null,
          p_node_id: node.p_node_id || null,
          edited: parseInt(node.edited) || 0,
          level: parseInt(node.level) || 0
        };
        
        // スタイルを適用
        if (isDeleted) {
          restoredNode.color = {
            background: '#f0f0f0',
            border: '#cccccc'
          };
          restoredNode.borderWidth = 1;
          restoredNode.borderDashes = false;
        } else {
          this.applyNodeStyle(restoredNode);
        }
        
        this.nodes.add(restoredNode);
      });
    }

    // エッジを復元
    if (edgeData && edgeData.length > 0) {
      edgeData.forEach(edge => {
        const restoredEdge = {
          from: edge.edge_start,
          to: edge.edge_end,
          color: {
            color: '#848484', // エッジの色（グレー）
            highlight: '#848484',
            hover: '#848484'
          }
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

  // 論理の説明を追加する関数
  completeLogic() {
    console.log("completeLogic: 開始");
    
    // 選択されているノードを取得
    const selectedNodeId = this.ownNetwork.getSelection().nodes[0];
    
    if (!selectedNodeId) {
      alert("ノードを選択してください");
      return;
    }

    // 選択されたノードの情報を取得
    const selectedNode = this.nodes.get(selectedNodeId);
    
    if (!selectedNode) {
      console.error("選択されたノードが見つかりません");
      return;
    }

    // ノードのラベルが空の場合は説明を追加できない
    if (!selectedNode.label || selectedNode.label.trim() === "") {
      alert("まず、ノードに内容を入力してください");
      return;
    }

    // 既存の説明を取得（ある場合）
    const existingClaimReason = selectedNode.ClaimReason || "";

    // モーダルボックスを表示
    this.showLogicClaimReasonModal(selectedNodeId, selectedNode.label, existingClaimReason);
  }

  // 論理説明用のモーダルボックスを表示する関数
  showLogicClaimReasonModal(nodeId, nodeLabel, existingClaimReason) {
    console.log("showLogicClaimReasonModal: nodeId =", nodeId);
    
    // モーダルの表示
    const modal = document.getElementById('logicClaimReasonModal');
    const nodeTitle = document.getElementById('claimReasonNodeTitle');
    const textarea = document.getElementById('claimReasonTextarea');
    
    if (modal && nodeTitle && textarea) {
      // ノードのラベルを表示（改行文字を除去）
      const cleanLabel = nodeLabel.replace(/\n/g, ' ').trim();
      nodeTitle.textContent = `「${cleanLabel}」についての説明`;
      
      // 既存の説明があれば設定
      textarea.value = existingClaimReason;
      
      // モーダルを表示
      modal.style.display = 'block';
      
      // テキストエリアにフォーカス
      textarea.focus();
      
      // 現在のノードIDを保存
      modal.dataset.currentNodeId = nodeId;
    } else {
      console.error("モーダル要素が見つかりません");
      alert("説明入力画面を表示できませんでした");
    }
  }

  // 論理説明を保存する関数
  saveLogicClaimReason() {
    console.log("saveLogicClaimReason: 開始");

    const modal = document.getElementById('logicClaimReasonModal');
    const textarea = document.getElementById('claimReasonTextarea');

    if (!modal || !textarea) {
      console.error("モーダル要素が見つかりません");
      return;
    }

    const nodeId = modal.dataset.currentNodeId;
    const claimReason = textarea.value.trim();

    if (!nodeId) {
      console.error("ノードIDが取得できません");
      return;
    }

    // 選択されたノードが主張となる三角形のIDを取得
    this.getTriangleIdByClaimId(nodeId).then(triangleId => {
      if (!triangleId) {
        console.error("該当する三角形が見つかりません");
        alert("この主張に対応する三角形が見つかりません");
        return;
      }

    // ノードに説明を追加
    const node = this.nodes.get(nodeId);
    if (node) {
      const updatedNode = {
        ...node,
        claimReason: claimReason,
        hasClaimReason: claimReason.length > 0
      };

      // ノードを更新
      this.nodes.update(updatedNode);

      // データベースに保存
      this.saveClaimReasonToDatabase(triangleId, claimReason);

      console.log(`ノード ${nodeId} の説明を更新しました:`, claimReason);
    }

    // モーダルを閉じる
    this.closeLogicClaimReasonModal();

    alert(claimReason.length > 0 ? "説明を保存しました" : "説明を削除しました");
  });
}

// 主張ノードIDから三角形IDを取得する関数
  async getTriangleIdByClaimId(claimId) {
    try {
      const response = await $.ajax({
        url: "php/logic_maneger.php",
        type: "POST",
        data: {
          claim_id: claimId,
          purpose: 'get',
          get_thing: 'triangle_by_claim'
        },
        dataType: "json"
      });

      if (response.status === "success" && response.triangle_id) {
        return response.triangle_id;
      } else {
        console.error("三角形ID取得エラー:", response.message);
        return null;
      }
    } catch (error) {
      console.error("三角形ID取得通信エラー:", error);
      return null;
    }
  }

  // 論理説明をデータベースに保存する関数
  saveClaimReasonToDatabase(triangleId, claimReason) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        triangle_id: triangleId,
        claimReason: claimReason,
        purpose: 'update',
        update_thing: 'claimReason'
      },
      dataType: "json",
      success: function(response) {
        console.log("説明保存レスポンス:", response);
        if (response.status === "success") {
          console.log("説明保存成功:", response.node_id);
        } else {
          console.error("説明保存エラー:", response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error("説明保存通信エラー:", error);
      }
    });
  }

  // モーダルを閉じる関数
  closeLogicClaimReasonModal() {
    const modal = document.getElementById('logicClaimReasonModal');
    if (modal) {
      modal.style.display = 'none';
      modal.dataset.currentNodeId = '';
    }
  }

  // 論理の葛藤を追加する関数
  conflictLogic() {
    console.log("conflictLogic: 開始");
    
    // 選択されているノードを取得
    const selectedNodeId = this.ownNetwork.getSelection().nodes[0];
    
    if (!selectedNodeId) {
      alert("ノードを選択してください");
      return;
    }

    // 選択されたノードの情報を取得
    const selectedNode = this.nodes.get(selectedNodeId);
    
    if (!selectedNode) {
      console.error("選択されたノードが見つかりません");
      return;
    }

    // ノードのラベルが空の場合は葛藤を追加できない
    if (!selectedNode.label || selectedNode.label.trim() === "") {
      alert("まず、ノードに内容を入力してください");
      return;
    }

    // 既存の葛藤を取得（ある場合）
    const existingConflict = selectedNode.conflict || "";

    // モーダルボックスを表示
    this.showLogicConflictModal(selectedNodeId, selectedNode.label, existingConflict);
  }

  // 論理葛藤用のモーダルボックスを表示する関数
  showLogicConflictModal(nodeId, nodeLabel, existingConflict) {
    console.log("showLogicConflictModal: nodeId =", nodeId);
    
    // モーダルの表示
    const modal = document.getElementById('logicConflictModal');
    const nodeTitle = document.getElementById('conflictNodeTitle');
    const textarea = document.getElementById('conflictTextarea');
    
    if (modal && nodeTitle && textarea) {
      // ノードのラベルを表示（改行文字を除去）
      const cleanLabel = nodeLabel.replace(/\n/g, ' ').trim();
      nodeTitle.textContent = `「${cleanLabel}」についての葛藤`;
      
      // 既存の葛藤があれば設定
      textarea.value = existingConflict;
      
      // モーダルを表示
      modal.style.display = 'block';
      
      // テキストエリアにフォーカス
      textarea.focus();
      
      // 現在のノードIDを保存
      modal.dataset.currentNodeId = nodeId;
    } else {
      console.error("モーダル要素が見つかりません");
      alert("葛藤入力画面を表示できませんでした");
    }
  }

  // 論理葛藤を保存する関数
  saveLogicConflict() {
    console.log("saveLogicConflict: 開始");
    
    const modal = document.getElementById('logicConflictModal');
    const textarea = document.getElementById('conflictTextarea');
    
    if (!modal || !textarea) {
      console.error("モーダル要素が見つかりません");
      return;
    }

    const nodeId = modal.dataset.currentNodeId;
    const conflict = textarea.value.trim();

    if (!nodeId) {
      console.error("ノードIDが取得できません");
      return;
    }

    // 選択されたノードが主張となる三角形のIDを取得
    this.getTriangleIdByClaimId(nodeId).then(triangleId => {
      if (!triangleId) {
        console.error("該当する三角形が見つかりません");
        alert("この主張に対応する三角形が見つかりません");
        return;
      }

      console.log("取得した三角形ID:", triangleId);

      // ノードに葛藤を追加
      const node = this.nodes.get(nodeId);
      if (node) {
        const updatedNode = {
          ...node,
          conflict: conflict,
          hasConflict: conflict.length > 0
        };

        // ノードを更新
        this.nodes.update(updatedNode);

        // データベースに保存（三角形IDを使用）
        this.saveConflictToDatabase(triangleId, conflict);

        console.log(`ノード ${nodeId} の葛藤を更新しました:`, conflict);
      }

      // モーダルを閉じる
      this.closeLogicConflictModal();
      
      alert(conflict.length > 0 ? "葛藤を保存しました" : "葛藤を削除しました");
    });
  }

  // 主張ノードIDから三角形IDを取得する関数
  async getTriangleIdByClaimId(claimId) {
    try {
      const response = await $.ajax({
        url: "php/logic_maneger.php",
        type: "POST",
        data: {
          claim_id: claimId,
          purpose: 'get',
          get_thing: 'triangle_by_claim'
        },
        dataType: "json"
      });

      if (response.status === "success" && response.triangle_id) {
        return response.triangle_id;
      } else {
        console.error("三角形ID取得エラー:", response.message);
        return null;
      }
    } catch (error) {
      console.error("三角形ID取得通信エラー:", error);
      return null;
    }
  }

  // 論理葛藤をデータベースに保存する関数
  saveConflictToDatabase(triangleId, conflict) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        triangle_id: triangleId,
        conflict: conflict,
        purpose: 'update',
        update_thing: 'conflict'
      },
      dataType: "json",
      success: function(response) {
        console.log("葛藤保存レスポンス:", response);
        if (response.status === "success") {
          console.log("葛藤保存成功:", response.node_id);
        } else {
          console.error("葛藤保存エラー:", response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error("葛藤保存通信エラー:", error);
      }
    });
  }

  // 葛藤モーダルを閉じる関数
  closeLogicConflictModal() {
    const modal = document.getElementById('logicConflictModal');
    if (modal) {
      modal.style.display = 'none';
      modal.dataset.currentNodeId = '';
    }
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

  record_LogicNode(node_id, label, f_node_id, p_node_id, node_x, node_y, edited = 0, node_level) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        node_id: node_id,
        label: label,
        f_node_id: f_node_id,
        p_node_id: p_node_id,
        x: node_x,
        y: node_y,
        edited: edited,
        level: node_level,
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

  edit_LogicNode(node_id, new_label, edited = 1) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        node_id: node_id,
        new_label: new_label,
        edited: edited,
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

  update_f_to_LogicNodelabel(LogicNodeId, newlabel, f_node_id, edited = 1) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        updatedNodeId: LogicNodeId,
        label: newlabel,
        f_node_id: f_node_id,
        edited: edited,
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

  delete_LogicNode (node_id, edited = 0){
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        node_id : node_id,
        edited: edited,
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
  // presentation IDと共にラベルを更新
  update_p_to_LogicNodelabel(LogicNodeId, newlabel, p_node_id, edited = 1) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        updatedNodeId: LogicNodeId,
        label: newlabel,
        p_node_id: p_node_id,
        edited: edited,
        purpose: 'update',
        update_thing: 'p_to_LogicNodelabel'
      },
      dataType: "json",
      success: function(response) {
        console.log("presentation ID付きラベル更新レスポンス:", response);
        if (response.status === "success") {
          console.log("presentation ID付きラベル更新成功:", response.node_id);
        } else {
          console.error("presentation ID付きラベル更新エラー:", response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error("presentation ID付きラベル更新通信エラー:", error);
      }
    });
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