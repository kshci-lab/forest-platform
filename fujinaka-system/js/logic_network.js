let defaultLogicNetwork;
let defaultRecordLogicNetwork;

class LogicNetwork {
  constructor(container, load) {
    console.log("[LogicNetwork] constructor start");
    defaultRecordLogicNetwork = new RecordLogicNetwork();
    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();
    
    // 三角形のサイズを定数として定義
    this.TRIANGLE_SIZE = 100; // 三角形の辺の長さ
    
    this.options = {
      physics: false,
      interaction: {
        multiselect: false,
        dragNodes: false, // 手動ドラッグは無効
      },
      layout: {
        hierarchical: {
          enabled: true,            // 明示的に有効化
          direction: "UD",          // 上下方向
          levelSeparation: 150,     // レベル間（縦）の距離
          nodeSpacing: 200,         // 同レベル内ノード間（横）の距離
          blockShifting: true,      // ブロックのずれ補正
          edgeMinimization: true,   // エッジの交差最小化
          parentCentralization: true
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
    // ノード配置用の簡易グリッド（三角作成時の初期位置）
    this.triIndex = 0;
    this.triCols = 4;
    this.triSpacingX = this.TRIANGLE_SIZE * 2;
    this.triSpacingY = this.TRIANGLE_SIZE * 2;
    this.network = null;
    this.edgeEditMode = false; //リンクの編集モード
    this.dragStartNodeId = null;  //ドラッグスタートしたノードのID
    this.dragEndNodeId = null; //ドラッグエンドしたノードID

    // 三角定義とハイライト状態を保持
    this.triangles = [];
    this._highlightedNodeIds = new Set();
    this._highlightedEdgeIds = new Set();
    // 役割タグDOMの管理（ノードID+位置キーで複数タグを保持）
    this._roleTagEls = new Map();

    this.ownNetwork = this.generateLogicNetworkCanvas(container, this.nodes, this.edges);
    if (!this.ownNetwork) {
      console.error("[LogicNetwork] vis.Network not created. Check container:", container);
    }
    if (load == "load") {
      this.ownNetwork.on('dragStart', this.dragstart.bind(this));
      this.ownNetwork.on('dragEnd', this.dragend.bind(this));
      this.ownNetwork.on('doubleClick', this.doubleclick.bind(this));
      // 既存: Forest側をハイライト
      this.ownNetwork.on('click', this.handleNodeClickHighlightForest.bind(this));
      // 追加: シナリオ側をハイライト
      this.ownNetwork.on('click', this.handleNodeClickHighlightPresentation.bind(this));
      // 追加: 三角ロジック全体のハイライト
      this.ownNetwork.on('click', this.handleNodeClickHighlightTriangles.bind(this));
      // 再描画ごとに役割タグの位置を更新
      this.ownNetwork.on('afterDrawing', this.updateRoleTagPositions.bind(this));
    }
    // 追加: タグ配置のため、コンテナを相対配置に
    try {
      this._containerEl = document.getElementById(container);
      if (this._containerEl) this._containerEl.style.position = this._containerEl.style.position || 'relative';
    } catch(_) {}
    console.log("[LogicNetwork] constructor end");
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

  //ノードを追加する（x/yは渡さない）
  addNode(node_id, label, f_node_id = null, p_node_id = null, edited = 0, level) {
    const newNode = {
      id: node_id,
      label: label,
      // x, y は設定しない（レイアウトに委譲）
      shape: 'box',
      f_node_id: f_node_id,
      p_node_id: p_node_id,
      edited: edited,
      level: level
    };
    // スタイルを適用
    this.applyNodeStyle(newNode);
    this.nodes.add(newNode);
    return this.nodes;
  }

  // ラベルに自動改行を挿入する関数 (10文字ごと)
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
    let borderDashes = false; // 点線はfalse（実線）
    
    // editedの値に基づいて点線/実線を決定
    //編集されているならedited = 1で実線，未編集ならedited = 0で点線
    if (node.edited == 0) {
      borderDashes = true; // 点線
      // Forest/P の紐づきがどちらも無いときだけ黒枠
      if ((node.f_node_id == null || node.f_node_id === undefined) &&
          (node.p_node_id == null || node.p_node_id === undefined)) {
        borderWidth = 2;
        borderColor = '#000000'; // 黒色
      }
    } else {
      borderDashes = false; // 実線
    }
    
    // Origin判定
    const hasF = node.f_node_id !== null && node.f_node_id !== undefined && node.f_node_id !== "";
    const hasP = node.p_node_id !== null && node.p_node_id !== undefined && node.p_node_id !== "";

    // Forest，論文シナリオどちらにもあるなら赤色，片方なら緑色
    if (hasF && hasP) {
      borderWidth = 2;
      borderColor = '#DC143C'; // 赤
    } else if ((hasF || hasP) && !(hasF && hasP)) {
      borderWidth = 2;
      borderColor = '#228B22'; // 緑
    }
    
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
      result_label = result_label.trim();
      
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

      // レイアウトを再計算して重なりを回避
      this.relayoutHierarchy(false);

      // データベースに編集状態を記録（edited = 1）
      defaultRecordLogicNetwork.edit_LogicNode(node.id, result_label, 1, node.f_node_id || null, node.p_node_id || null);
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
    // ノードを削除すると三角ロジックの形が崩れてしまうため，データベース側でノードの内容をNULLにする処理にしている（edited = 0で削除状態）
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
  //一応おいてるけどエッジを自由につなげるような仕様にはしていないため使ってない
  //ドラッグ開始
  dragstart(params) {
    if (!this.edgeEditMode) {
      params.event.preventDefault();
    } else {
      this.dragStartNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
    }
  }

  //ドラッグ終了
  //edgeEditModeの場合にaddEdge（位置更新はしない）
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
        if (!notable) return;
        this.edges.add({ from: this.dragStartNodeId, to: this.dragEndNodeId });
      }
      this.dragStartNodeId = null;
      this.dragEndNodeId = null;
    } else {
      // 位置の手動更新はしない（hierarchical に委譲）
      return;
    }
  }

  //三角形を作成する基本関数（x/yは使わず level のみ指定）
  maketriangle(topic, f_node_id, p_node_id, edited) {
    //未編集ノードのためラベルは空白
    if (topic === undefined) {
      topic = "";
    }
    // 入力時に改行整形（既に \n が含まれている場合はそのまま）
    const claimLabel = topic && !topic.includes('\n')
      ? this.formatLabelWithLineBreaks(topic)
      : topic;

    // レベルのみ指定（縦: claim上、reason/fact下）
    const node1level = 0;
    const node2level = 1;
    const node3level = 1;

    const triangle_id = this.generateUniqueNumberText();
    const claim_id = this.generateUniqueNumberText();
    const reason_id = this.generateUniqueNumberText();
    const fact_id = this.generateUniqueNumberText();

    // 主張ノードは整形済みラベルを使用
    this.addNode(claim_id, claimLabel, f_node_id, p_node_id, edited, node1level);
    this.addNode(reason_id, "", null, null, 0, node2level);
    this.addNode(fact_id, "", null, null, 0, node3level);

    // エッジ追加まで完了
    this.addEdge(claim_id, reason_id);
    this.addEdge(reason_id, fact_id);
    this.addEdge(fact_id, claim_id);

    // レイアウトを再適用（重なり回避）
    this.relayoutHierarchy(true);

    // DB記録
    defaultRecordLogicNetwork.record_LogicNode(claim_id, claimLabel, f_node_id, p_node_id, edited, node1level);
    defaultRecordLogicNetwork.record_LogicNode(reason_id, "", null, null, 0, node2level);
    defaultRecordLogicNetwork.record_LogicNode(fact_id, "", null, null, 0, node3level);
    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, claim_id, reason_id, fact_id, "", "");

    // 追加: メモリ上の三角一覧にも反映
    try {
      this.triangles = this.triangles || [];
      this.triangles.push({
        triangle_id: triangle_id,
        claim_id: claim_id,
        reason_id: reason_id,
        fact_id: fact_id,
        claimReason: "",
        conflict: ""
      });
    } catch (_) {}
  }

  // 三角ロジックを追加する関数（選択しているノードを主張として事実，理由付けノードを作成する関数）（x/yは使わず level のみ）
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
    const f_node_id = baseNode.f_node_id || null; // 既存ノードのf_node_idを取得
    const size = this.TRIANGLE_SIZE; // 三角形の辺の長さ
  
    // 新しい三角ロジックのIDを生成
    const triangle_id = this.generateUniqueNumberText();
    // 新しいノードのIDを生成
    const reason_id = this.generateUniqueNumberText();
    const fact_id = this.generateUniqueNumberText();
  
    // 新しいノードを追加（選択ノードの1つ下のレベルに配置）
    this.addNode(reason_id, "", null, null, 0, newNodeLevel);
    this.addNode(fact_id, "", null, null, 0, newNodeLevel);

    // エッジ追加まで完了
    this.addEdge(selectedNodeId, reason_id);
    this.addEdge(reason_id, fact_id);
    this.addEdge(fact_id, selectedNodeId);

    // レイアウトを再適用（重なり回避）
    this.relayoutHierarchy(true);

    // DB記録
    defaultRecordLogicNetwork.record_LogicNode(reason_id, "Reason", null, null, 0, newNodeLevel);
    defaultRecordLogicNetwork.record_LogicNode(fact_id, "Fact", null, null, 0, newNodeLevel);
    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, baseNode.id, reason_id, fact_id, "", "");

    // 追加: メモリ上の三角一覧にも反映
    try {
      this.triangles = this.triangles || [];
      this.triangles.push({
        triangle_id: triangle_id,
        claim_id: baseNode.id,
        reason_id: reason_id,
        fact_id: fact_id,
        claimReason: "",
        conflict: ""
      });
    } catch (_) {}

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
  async createTriangleFromForest() {
    // マインドマップ側から選択ノード情報を取得
    let selected_fnode = this.CheckSelectedNode();
    if (!selected_fnode || !selected_fnode.topic) {
      alert("ノードを選択してください");
      return;
    }

    // DBから type を取得して判定
    const forestNodeId = selected_fnode.id;
    let fetchedType = null;
    try {
      fetchedType = await this.fetchForestNodeTypeById(forestNodeId);
      console.log(`[LogicNetwork] Forest node type fetched (id=${forestNodeId}):`, fetchedType);
    } catch (e) {
      console.warn("[LogicNetwork] fetchForestNodeTypeById failed:", e);
    }
    if (fetchedType && String(fetchedType).toLowerCase() === 'toi') {
      alert("問いノードは三角ロジックに適用できません。");
      return;
    }

    console.log("Selected Forest node ID:", forestNodeId);
    // maketriangleを呼び出し、ForestのノードIDを渡す
    this.maketriangle(selected_fnode.topic, forestNodeId, null, 1);
  }

  // DBから Forest ノードの type を取得
  async fetchForestNodeTypeById(nodeId) {
    const res = await $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        purpose: 'get',
        get_thing: 'node_type',
        node_id: nodeId
      },
      dataType: "json"
    });
    // 期待フォーマット: { status: "success", type: "..." }
    if (res && res.status === "success") {
      const t = res.type || res.node_type || (res.data && (res.data.type || res.data.node_type)) || null;
      return t;
    }
    console.warn("[LogicNetwork] fetchForestNodeTypeById unexpected response:", res);
    return null;
  }

  //シナリオ側から選択された要素の内容とIDを取得する関数
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
  async applyForestToTriangle() {
    // 左側（マインドマップ）の選択ノードを取得
    const f_node = this.CheckSelectedNode();
    console.log("applyForestToTriangle: f_node =", f_node);
    
    if (!f_node || !f_node.topic) {
      alert("左側のノードを選択してください");
      return;
    }

    // 追加: DBからtypeを取得して問い(toi)ならブロック
    try {
      const fetchedType = await this.fetchForestNodeTypeById(f_node.id);
      console.log(`[LogicNetwork] Forest node type fetched (id=${f_node.id}):`, fetchedType);
      if (fetchedType && String(fetchedType).toLowerCase() === 'toi') {
        alert("問いノードは三角ロジックに適用できません。");
        return;
      }
    } catch (e) {
      console.warn("[LogicNetwork] fetchForestNodeTypeById failed:", e);
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
      edited: 1 // Forestから持ってきたばかりなので1
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
    defaultRecordLogicNetwork.edit_LogicNode(LogicNodeId, f_node.topic, 1, f_node_id, null);
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

    // 追加: presentation要素が conceptid を持っていれば取得してUI側にも反映
    const conceptIdFromPresentation =
      selectedElement.getAttribute('concept_id') ||
      selectedElement.getAttribute('conceptid') ||
      (selectedElement.dataset ? (selectedElement.dataset.conceptid || selectedElement.dataset.conceptId) : null) || null;
    if (conceptIdFromPresentation) {
      updatedNode.f_node_id = conceptIdFromPresentation;
    }
    
    // 既存のapplyNodeStyleを使用してスタイルを再適用
    this.applyNodeStyle(updatedNode);
    this.nodes.update(updatedNode);
    
    // 削除済みノードだった場合の追加処理
    if (wasDeleted && elementText.length > 0) {
      console.log("削除済みノードを復元しました");
    }
    
    console.log("applyPresentationToTriangle: 内容更新完了");
    alert(`論理ネットワークノードの内容を「${elementText}」で更新しました`);
    
    // presentation要素のIDを取得
    const p_element_id = selectedElement.id || selectedElement.getAttribute('node_id') || "default";
    console.log("applyPresentationToTriangle: edit_LogicNode 呼び出し (p, concept)", { p_element_id, conceptIdFromPresentation });

    // presentation ID付きでデータベースを更新（conceptidがあれば第四引数に渡す）
    defaultRecordLogicNetwork.edit_LogicNode(
      selectedLogicNodeId,
      elementText,
      1,
      conceptIdFromPresentation || null,
      p_element_id
    );
  }

  // 論理の説明を追加する関数（なぜその主張をしたのかを入力する）
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
    // 修正: claimReason（小文字）を優先し、互換のため ClaimReason もフォールバック
    const existingClaimReason = selectedNode.claimReason || selectedNode.ClaimReason || "";
    console.log("[ClaimReason] existing for modal:", { nodeId: selectedNodeId, length: existingClaimReason.length });

    // モーダルボックスを表示
    this.showLogicClaimReasonModal(selectedNodeId, selectedNode.label, existingClaimReason);
  }

  // なぜその主張をするのかを入力するモーダルボックスを表示する関数
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
      textarea.value = existingClaimReason; // textarea に復元
      console.log("[ClaimReason] textarea set", { nodeId, length: existingClaimReason.length });
      
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

  // なぜその主張をするのかの内容を保存する関数
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
        alert("この主張に対応する三角が見つかりません");
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
  
// なぜその主張をするのかの内容をデータベースに保存する関数
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
  // 論理の認知的葛藤葛藤を追加する関数
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
        alert("この主張に対応する三角が見つかりません");
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
    });
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


  // データベースからロジックネットワークをロードする
  async loadLogicNetworkFromDatabase() {
    console.log("[LogicNetwork] loadLogicNetworkFromDatabase: start");
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
      console.log("[LogicNetwork] loadLogicNetworkFromDatabase: response", response);

      if (response.status === "success") {
        // triangles があればそれを利用して再構築（edgesが無くてもOK）
        this.restoreFromData(response.nodes, response.edges, response.triangles);
        console.log("[LogicNetwork] loadLogicNetworkFromDatabase: restored");
      } else {
        console.error("[LogicNetwork] load error:", response.message);
      }
    } catch (error) {
      // jQuery.ajax の errorオブジェクトから詳細を出す
      const xhr = error && error.responseText ? error.responseText : error;
      console.error("[LogicNetwork] ajax error:", xhr);
    }
    console.log("[LogicNetwork] loadLogicNetworkFromDatabase: end");
  }

  // 初期化時にDBから復元するためのエイリアスメソッド（ロード処理を委譲）
  async initializeFromDatabase() {
    console.log("[LogicNetwork] initializeFromDatabase: start");
    const res = await this.loadLogicNetworkFromDatabase();
    console.log("[LogicNetwork] initializeFromDatabase: end");
    return res;
  }

  // ネットワークの再読込API（ボタン用）
  async refreshNetwork() {
    console.log("[LogicNetwork] refreshNetwork: start");
    await this.loadLogicNetworkFromDatabase();
    console.log("[LogicNetwork] refreshNetwork: end");
  }

  // データからノードとエッジを復元（x/yは使わず、levelのみ反映）
  restoreFromData(nodeData, edgeData, triangleData) {
    console.log("[LogicNetwork] restoreFromData: nodes=", (nodeData||[]).length, "triangles=", (triangleData||[]).length, "edges=", (edgeData||[]).length);
    this.nodes.clear();
    this.edges.clear();

    // 追加: 三角定義を保持
    this.triangles = Array.isArray(triangleData) ? triangleData : [];

    // ノード追加（既存処理）
    if (nodeData && nodeData.length > 0) {
      nodeData.sort((a, b) => a.node_id.localeCompare(b.node_id));
      nodeData.forEach(node => {
        const isDeleted = !node.label || node.label === null || node.label === '';
        let formattedLabel = "";
        if (!isDeleted) {
          const originalLabel = node.label || "Node";
          formattedLabel = originalLabel.includes('\n')
            ? originalLabel
            : this.formatLabelWithLineBreaks(originalLabel);
        }

        const restoredNode = {
          id: node.node_id,
          label: isDeleted ? "" : formattedLabel,
          // x, y は設定しない
          shape: 'box',
          f_node_id: node.f_node_id || null,
          p_node_id: node.p_node_id || null,
          edited: parseInt(node.edited) || 0,
          level: parseInt(node.level) || 0
        };

        if (isDeleted) {
          restoredNode.color = { background: '#f0f0f0', border: '#cccccc' };
          restoredNode.borderWidth = 1;
          restoredNode.borderDashes = false;
        } else {
          this.applyNodeStyle(restoredNode);
        }
        this.nodes.add(restoredNode);
      });
    }

    // エッジは triangleData 優先で再構築。無ければ従来の edgeData を使用
    if (triangleData && triangleData.length > 0) {
      this.reconstructEdgesFromTriangles(nodeData || [], triangleData);
    } else if (edgeData && edgeData.length > 0) {
      edgeData.forEach(edge => {
        this.edges.add({
          from: edge.edge_start,
          to: edge.edge_end,
          color: { color: '#848484', highlight: '#848484', hover: '#848484' }
        });
      });
    }

    // 復元後にレイアウト
    if (this.ownNetwork) {
      this.ownNetwork.stabilize();
      this.ownNetwork.fit({ animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
    }
    console.log("[LogicNetwork] restoreFromData: applied");

    // 追加: triangles に保存されている claimReason / conflict を claim ノードへ再現
    console.log("[Restore] start apply claimReason/conflict:", { triangles: Array.isArray(triangleData) ? triangleData.length : 0 });
    try {
      if (Array.isArray(triangleData) && triangleData.length > 0) {
        const updates = [];
        for (const t of triangleData) {
          const claimId = t && (t.claimReason || t.ClaimReason);
          if (!claimId) continue;
          const n = this.nodes.get(String(claimId));
          if (!n) continue;

          const cr = (t.claimReason ?? "").trim();
          const cf = (t.conflict ?? "").trim();

          // 既存値と差分がある場合のみ更新
          const next = {};
          let need = false;
          if (cr !== "" || n.claimReason) {
            next.claimReason = cr;
            next.hasClaimReason = cr.length > 0;
            need = true;
          }
          if (cf !== "" || n.conflict) {
            next.conflict = cf;
            next.hasConflict = cf.length > 0;
            need = true;
          }
          if (need) updates.push({ id: n.id, ...next });
        }
        if (updates.length) {
          this.nodes.update(updates);
          console.log("[Restore] applied claimReason/conflict to nodes:", updates.map(u => u.id));
        } else {
          console.log("[Restore] no claimReason/conflict updates required");
        }
      }
    } catch (e) {
      console.warn("restoreFromData: reclaim claimReason/conflict failed:", e);
    }
  }

  // triangles（logic_triangle）から階層レベルを使って三角ロジックを再構築
  reconstructEdgesFromTriangles(nodeData, triangles) {
    // node_id -> level のマップと存在確認のためのセット
    const levelMap = new Map();
    const nodeSet = new Set();
    (nodeData || []).forEach(n => {
      nodeSet.add(n.node_id);
      levelMap.set(n.node_id, parseInt(n.level) || 0);
    });

    // claim_id -> [{reason_id, fact_id}]（1つのclaimに複数三角が紐づく場合にも対応）
    const claimIndex = new Map();
    (triangles || []).forEach(t => {
      if (!claimIndex.has(t.claim_id)) claimIndex.set(t.claim_id, []);
      claimIndex.get(t.claim_id).push({ reason_id: t.reason_id, fact_id: t.fact_id });
    });

    // レベル0の claim を起点に DFS で三角を辿る
    const roots = [...nodeSet].filter(id => (levelMap.get(id) || 0) === 0);
    const visitedEdges = new Set(); // 重複エッジ防止

    const addEdgeOnce = (from, to) => {
      const key = `${from}->${to}`;
      if (visitedEdges.has(key)) return;
      visitedEdges.add(key);
      this.edges.add({
        from,
        to,
        color: { color: '#848484', highlight: '#848484', hover: '#848484' }
      });
    };

    const dfs = (claimId) => {
      const triples = claimIndex.get(claimId);
      if (!triples || triples.length === 0) return;
      for (const tri of triples) {
        const { reason_id, fact_id } = tri;
        // 三角の3本の辺を追加
        addEdgeOnce(claimId, reason_id);
        addEdgeOnce(reason_id, fact_id);
        addEdgeOnce(fact_id, claimId);
        // reason / fact が次の claim になっている場合は続けて再現
        if (claimIndex.has(reason_id)) dfs(reason_id);
        if (claimIndex.has(fact_id)) dfs(fact_id);
      }
    };

    // ルートから辿る
    roots.forEach(rootId => dfs(rootId));

    // ルートから辿れない孤立三角もケア（全claimをフォールバック処理）
    for (const claimId of claimIndex.keys()) {
      dfs(claimId);
    }
  }

  //ノード編集(ラベル)後の重なり回避用: 階層レイアウトを再適用
  relayoutHierarchy(fit = false) {
    if (!this.ownNetwork) return;
    // 現在の選択状態を保持
    const selection = this.ownNetwork.getSelection();
    // データを再適用して階層レイアウトを再計算
    this.ownNetwork.setData({ nodes: this.nodes, edges: this.edges });
    // 選択状態を復元
    if (selection && (selection.nodes?.length || selection.edges?.length)) {
      this.ownNetwork.setSelection(selection);
    }
    if (fit) {
      this.ownNetwork.fit({ animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
    } else {
      this.ownNetwork.redraw();
    }
  }

  // Logic側ノードクリックでForest側の対応ノードをハイライト
  handleNodeClickHighlightForest(params) {
    try {
      if (!params || !Array.isArray(params.nodes) || params.nodes.length === 0) return;
      const clickedId = params.nodes[0];
      const node = this.nodes.get(clickedId);
      if (!node) return;

      const fId = node.f_node_id;

      // 追加: Forest側未対応の示唆
      if (fId === null || fId === undefined || fId === "") {
        this.suggestMissingForest();
        return;
      }

      // グローバルAPIがあればそれを使用
      if (typeof window.highlightForestNodeById === 'function') {
        window.highlightForestNodeById(String(fId));
        return;
      }

      // フォールバック（直接 jsMind に触る）
      if (typeof _jm !== 'undefined' && _jm) {
        _jm.select_node(String(fId));
        const jmnodes = document.getElementsByTagName("jmnode");
        for (let i = 0; i < jmnodes.length; i++) {
          if (jmnodes[i].getAttribute("nodeid") == String(fId)) {
            const el = jmnodes[i];
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            el.style.transition = "box-shadow 0.2s ease-out";
            el.style.boxShadow = "0 0 0 3px orange inset";
            setTimeout(() => { el.style.boxShadow = ""; }, 1200);
            break;
          }
        }
      }
    } catch (e) {
      console.warn("handleNodeClickHighlightForest error:", e);
    }
  }

  // 追加: 三角ロジックのノードクリックで、p_node_id に対応するシナリオ側ノードをハイライト
  handleNodeClickHighlightPresentation(params) {
    try {
      if (!params || !Array.isArray(params.nodes) || params.nodes.length === 0) return;
      const clickedId = params.nodes[0];
      const node = this.nodes.get(clickedId);
      if (!node) return;

      const pId = node.p_node_id;

      // 追加: Presentation側未対応の示唆
      if (pId === null || pId === undefined || pId === "") {
        this.suggestMissingPresentation();
        return;
      }

      // 1) id一致
      let el = document.getElementById(String(pId));
      // 2) node_id属性一致
      if (!el) {
        const candidates = document.querySelectorAll('.cspan, .tspan, .thread, .section, .chapter, .scenario_content');
        for (let i = 0; i < candidates.length; i++) {
          const nid = candidates[i].getAttribute('node_id') || candidates[i].getAttribute('nodeid');
          if (nid && String(nid) === String(pId)) { el = candidates[i]; break; }
        }
      }
      // 3) scenario_content の場合は中の .cspan へ
      if (el && el.classList && el.classList.contains('scenario_content')) {
        const inner = el.querySelector('.cspan') || el.querySelector('.tspan');
        if (inner) el = inner;
      }
      if (!el) return;

      // .cspan の選択枠をいったん解除
      const spans = document.getElementsByClassName('cspan');
      for (let i = 0; i < spans.length; i++) {
        spans[i].style.border = "";
      }

      // スクロール・フォーカス
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch(_) {}
      if (typeof el.focus === 'function') el.focus();

      // ハイライト（.cspanは既存の選択スタイルに合わせて枠線、その他は一時アウトライン）
      if (el.classList && el.classList.contains('cspan')) {
        el.style.border = "2px solid gray";
      } else {
        el.style.outline = "3px solid orange";
        setTimeout(() => { try { el.style.outline = ""; } catch(_) {} }, 1200);
      }
    } catch (e) {
      console.warn("handleNodeClickHighlightPresentation error:", e);
    }
  }

  // 追加: 欠落側に示唆（Forest側）
  suggestMissingForest() {
    // Forest領域の枠を一時点滅（候補: #mind_all）
    this.pulseElementById('mind_all');
    // トースト表示
    this.showToast('Forest側に未対応です。マインドマップのノードと対応付けるか、Forestから反映してください。');
  }

  // 追加: 欠落側に示唆（Presentation側）
  suggestMissingPresentation() {
    // Presentation領域の枠を一時点滅（候補: #document_area）
    this.pulseElementById('document_area');
    // トースト表示
    this.showToast('シナリオ側に未対応です。シナリオへ内容を反映するか、対応付けを行ってください。');
  }

  // 追加: コンテナを軽くハイライト
  pulseElementById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.style.outline;
    el.style.transition = 'outline 0.2s ease';
    el.style.outline = '3px solid orange';
    setTimeout(() => { try { el.style.outline = prev || ''; } catch(_) {} }, 1200);
  }

  // 追加: 簡易トースト表示（自動クローズ）
  showToast(message) {
    try {
      const old = document.getElementById('ln_toast_hint');
      if (old) old.remove();
      const div = document.createElement('div');
      div.id = 'ln_toast_hint';
      div.textContent = message;
      div.style.position = 'fixed';
      div.style.zIndex = 9999;
      div.style.left = '50%';
      div.style.top = '16px';
      div.style.transform = 'translateX(-50%)';
      div.style.background = 'rgba(0,0,0,0.75)';
      div.style.color = '#fff';
      div.style.padding = '8px 12px';
      div.style.borderRadius = '6px';
      div.style.fontSize = '13px';
      div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      document.body.appendChild(div);
      setTimeout(() => { try { div.remove(); } catch(_) {} }, 2500);
    } catch(_) {}
  }

  // ノードクリックで該当三角(複数可)をハイライト
  handleNodeClickHighlightTriangles(params) {
    try {
      if (!params || !Array.isArray(params.nodes)) return;

      if (params.nodes.length === 0) {
        this.clearTriangleHighlight();
        return;
      }

      const clickedId = String(params.nodes[0]);
      const tris = this.findTrianglesByNode(clickedId);

      if (!tris.length) {
        this.clearTriangleHighlight();
        return;
      }

      // クリックIDを渡し、主張レベル最小判定に基づく位置決定を行う
      this.highlightTriangles(tris, clickedId);
    } catch (e) {
      console.warn("handleNodeClickHighlightTriangles error:", e);
    }
  }

  // 指定ノードを含む三角を抽出（claim/reason/fact いずれでも）
  findTrianglesByNode(nodeId) {
    if (!Array.isArray(this.triangles) || this.triangles.length === 0) return [];
    const res = [];
    for (const t of this.triangles) {
      const nt = this.normalizeTriangle(t);
      if (!nt) continue;
      if (String(nt.claimId) === String(nodeId) ||
          String(nt.reasonId) === String(nodeId) ||
          String(nt.factId) === String(nodeId)) {
        res.push(nt);
      }
    }
    return res;
  }

  // 三角オブジェクトのキー差異を吸収
  normalizeTriangle(t) {
    if (!t) return null;
    const claimId = t.claim_id ?? t.claimId;
    const reasonId = t.reason_id ?? t.reasonId;
    const factId = t.fact_id ?? t.factId;
    const triangleId = t.triangle_id ?? t.triangleId ?? this.generateUniqueNumberText();
    if (claimId == null || reasonId == null || factId == null) return null;
    return {
      triangleId,
      claimId: String(claimId),
      reasonId: String(reasonId),
      factId: String(factId),
      claimReason: t.claimReason ?? "",
      conflict: t.conflict ?? ""
    };
  }

  // 三角(複数)をハイライト + 役割タグ表示（主張ノードのレベルでタグ位置決定）
  highlightTriangles(triangles, clickedNodeId) {
    // 既存ハイライトとタグ解除
    this.clearTriangleHighlight();

    const nodeIds = new Set();
    const edgeTriples = [];
    const nodeRoles = new Map();       // nodeId -> Set(役割)
    const nodePosSet = new Map();      // nodeId -> Set('top-left' | 'bottom')

    // 対象三角の主張レベル最小を算出（同時に主張レベルを控える）
    const claimLevels = [];
    const triWithLevels = [];
    for (const tri of triangles) {
      const nClaim = this.nodes.get(tri.claimId);
      if (!nClaim) continue;
      const lvClaim = parseInt(nClaim.level) || 0;
      claimLevels.push(lvClaim);
      triWithLevels.push({ tri, lvClaim });
    }
    if (triWithLevels.length === 0) return;

    const minClaimLevel = Math.min(...claimLevels);
    const multipleTri = triWithLevels.length > 1;

    const addRole = (nodeId, role) => {
      if (!nodeRoles.has(nodeId)) nodeRoles.set(nodeId, new Set());
      nodeRoles.get(nodeId).add(role);
    };
    const addPos = (nodeId, pos) => {
      if (!nodePosSet.has(nodeId)) nodePosSet.set(nodeId, new Set());
      nodePosSet.get(nodeId).add(pos);
    };

    // 役割と位置を集計
    for (const { tri, lvClaim } of triWithLevels) {
      // 位置: 主張レベルが「最小」なら左上、それ以外は真下
      const posForTriangle = (lvClaim === minClaimLevel) ? 'top-left' : (multipleTri ? 'bottom' : 'top-left');

      // 役割を付与
      addRole(tri.claimId, "主張");
      addRole(tri.reasonId, "理由付け");
      addRole(tri.factId, "事実");

      // 位置を三角内の全ノードに反映（同一ノードが複数三角に属する場合は集合で両位置を保持）
      addPos(tri.claimId, posForTriangle);
      addPos(tri.reasonId, posForTriangle);
      addPos(tri.factId, posForTriangle);

      // ハイライト対象ノード集約
      nodeIds.add(tri.claimId);
      nodeIds.add(tri.reasonId);
      nodeIds.add(tri.factId);

      // エッジ三本
      edgeTriples.push([tri.claimId, tri.reasonId]);
      edgeTriples.push([tri.reasonId, tri.factId]);
      edgeTriples.push([tri.factId, tri.claimId]);
    }

    // ノードを強調（枠太・枠色オレンジ）
    const nodeUpdates = [];
    nodeIds.forEach(id => {
      const n = this.nodes.get(id);
      if (!n) return;
      nodeUpdates.push({
        id: n.id,
        borderWidth: 3,
        borderWidthSelected: 3,
        color: { ...(n.color || {}), border: '#ff8c00' }
      });
      this._highlightedNodeIds.add(n.id);
    });
    if (nodeUpdates.length) this.nodes.update(nodeUpdates);

    // エッジを強調（太さ・色オレンジ）
    for (const [from, to] of edgeTriples) {
      const matches = this.edges.get({
        filter: e => String(e.from) === String(from) && String(e.to) === String(to)
      });
      matches.forEach(e => {
        this.edges.update({
          id: e.id,
          color: { color: '#ff8c00', highlight: '#ff8c00', hover: '#ff8c00' },
          width: 3
        });
        this._highlightedEdgeIds.add(e.id);
      });
    }

    // 役割タグを生成（必要なら同一ノードに左上と真下の両方を表示）
    nodeRoles.forEach((rolesSet, nodeId) => {
      const roles = Array.from(rolesSet);
      const posSet = nodePosSet.get(nodeId) || new Set(['top-left']);
      posSet.forEach(pos => {
        this.createOrUpdateRoleTag(String(nodeId), roles, pos);
      });
    });

    if (this.ownNetwork) this.ownNetwork.redraw();
  }

  // 三角ハイライト解除（元のスタイルへ）+ タグ削除
  clearTriangleHighlight() {
    // エッジを戻す
    if (this._highlightedEdgeIds && this._highlightedEdgeIds.size) {
      const edgeUpdates = [];
      this._highlightedEdgeIds.forEach(id => {
        const e = this.edges.get(id);
        if (!e) return;
        edgeUpdates.push({
          id: id,
          color: { color: '#848484', highlight: '#848484', hover: '#848484' },
          width: 1
        });
      });
      if (edgeUpdates.length) this.edges.update(edgeUpdates);
      this._highlightedEdgeIds.clear();
    }

    // ノードを戻す
    if (this._highlightedNodeIds && this._highlightedNodeIds.size) {
      const nodeUpdates = [];
      this._highlightedNodeIds.forEach(id => {
        const n = this.nodes.get(id);
        if (!n) return;

        // 削除状態（ラベル空）は灰色のまま
        if (!n.label || n.label === '') {
          nodeUpdates.push({
            id: n.id,
            color: { background: '#f0f0f0', border: '#cccccc' },
            borderWidth: 1,
            borderWidthSelected: 1,
            shapeProperties: { borderDashes: false }
          });
          return;
        }

        // 通常ノードは既存ルールで再適用
        const base = { ...n };
        this.applyNodeStyle(base);
        nodeUpdates.push({
          id: base.id,
          color: base.color,
          borderWidth: base.borderWidth,
          borderWidthSelected: base.borderWidthSelected,
          shapeProperties: base.shapeProperties
        });
      });
      if (nodeUpdates.length) this.nodes.update(nodeUpdates);
      this._highlightedNodeIds.clear();
    }

    // 追加: 役割タグを全削除
    this.removeAllRoleTags();

    if (this.ownNetwork) this.ownNetwork.redraw();
  }

  // 役割タグDOMを生成/更新（ノードID+位置の複数タグに対応）
  createOrUpdateRoleTag(nodeId, roles, posMode) {
    try {
      if (!this._containerEl || !this.ownNetwork) return;
      const text = Array.isArray(roles) ? roles.join('・') : String(roles || '');
      const pos = (posMode === 'bottom') ? 'bottom' : 'top-left';
      const key = `${nodeId}:${pos}`;

      let el = this._roleTagEls.get(key);
      if (!el) {
        el = document.createElement('div');
        el.className = 'ln-role-tag';
        el.style.position = 'absolute';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '10';
        el.style.fontSize = '17px'; // 11px → 17px
        el.style.lineHeight = '1.4';
        el.style.whiteSpace = 'nowrap';
        el.style.color = '#000'; // オレンジ → 黒
        el.style.background = 'rgba(255,140,0,0.10)';
        el.style.border = '1px solid #ff8c00';
        el.style.borderRadius = '4px';
        el.style.padding = '1px 6px';
        el.dataset.nodeId = String(nodeId);
        el.dataset.pos = pos;
        this._containerEl.appendChild(el);
        this._roleTagEls.set(key, el);
      }
      el.textContent = text;

      // 初回配置
      this.updateRoleTagPositionFor(nodeId, el);
    } catch(_) {}
  }

  // 全タグ削除
  removeAllRoleTags() {
    try {
      if (!this._roleTagEls) return;
      this._roleTagEls.forEach(el => { try { el.remove(); } catch(_) {} });
      this._roleTagEls.clear();
    } catch(_) {}
  }

  // 描画ごとに全タグ位置を更新
  updateRoleTagPositions() {
    if (!this._roleTagEls || this._roleTagEls.size === 0) return;
    this._roleTagEls.forEach((el) => {
      const nodeId = el.dataset && el.dataset.nodeId ? el.dataset.nodeId : null;
      if (nodeId) this.updateRoleTagPositionFor(nodeId, el);
    });
  }

  // 単一タグの位置更新（左上/真下）
  updateRoleTagPositionFor(nodeId, el) {
    try {
      if (!this.ownNetwork) return;
      const bb = this.ownNetwork.getBoundingBox(nodeId);
      if (!bb) return;
      const posMode = el.dataset.pos || 'top-left';

      if (posMode === 'bottom') {
        const bottomCenter = { x: (bb.left + bb.right) / 2, y: bb.bottom + 4 };
        const dom = this.ownNetwork.canvasToDOM(bottomCenter);
        el.style.left = `${dom.x}px`;
        el.style.top = `${dom.y}px`;
        el.style.transform = 'translate(-50%, 0)';
      } else {
        // 左上（さらに左上へオフセット）
        const topLeft = { x: bb.left - 14, y: bb.top - 14 };
        const dom = this.ownNetwork.canvasToDOM(topLeft);
        el.style.left = `${dom.x}px`;
        el.style.top = `${dom.y}px`;
        el.style.transform = 'none';
      }
    } catch(_) {}
  }

  // ネットワークキャンバスをPDF保存（jsPDF使用、未読込時はPNG保存にフォールバック）
  exportNetworkToPDF(filename) {
    if (!this.ownNetwork) {
      alert("ロジックネットワークが初期化されていません");
      return;
    }

    // 直近描画を保証してからキャプチャ
    const capture = () => {
      try {
        const canvas = this.ownNetwork.canvas?.frame?.canvas;
        if (!canvas) {
          alert("キャンバスが取得できませんでした");
          return;
        }
        const imgData = canvas.toDataURL("image/png", 1.0);

        // jsPDF 存在チェック（UMD/グローバル両対応）
        const JSPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!JSPDFCtor) {
          // フォールバック: PNG をダウンロード
          const a = document.createElement('a');
          const ts = this._buildTimestamp();
          a.href = imgData;
          a.download = filename || `logic_network_${ts}.png`;
          a.click();
          return;
        }

        // キャンバス縦横から向きを決定
        const isLandscape = canvas.width >= canvas.height;
        const pdf = new JSPDFCtor({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 24; // pt
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;

        // 画像をA4にフィット
        const imgW = canvas.width;
        const imgH = canvas.height;
        const scale = Math.min(maxW / imgW, maxH / imgH);
        const drawW = Math.max(1, imgW * scale);
        const drawH = Math.max(1, imgH * scale);
        const x = margin + (maxW - drawW) / 2;
        const y = margin + (maxH - drawH) / 2;

        // タイトル/タイムスタンプ
        const ts = this._buildTimestamp();
        const title = "Logic Network";
        pdf.setFontSize(12);
        pdf.text(title, margin, 18);
        pdf.setFontSize(9);
        pdf.text(`Exported: ${ts}`, pageW - margin - 140, 18);

        pdf.addImage(imgData, 'PNG', x, y, drawW, drawH, undefined, 'FAST');
        pdf.save(filename || `logic_network_${ts}.pdf`);
      } catch (e) {
        console.error("exportNetworkToPDF error:", e);
        alert("PDFの作成に失敗しました");
      }
    };

    // 一度の描画完了後にキャプチャ
    this.ownNetwork.once('afterDrawing', capture);
    this.ownNetwork.redraw();
  }

  // タイムスタンプ生成（YYYYMMDD_HHMM）
  _buildTimestamp() {
    const d = new Date();
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}`;
  }

  // ...existing code...
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

  record_LogicNode(node_id, label, f_node_id, p_node_id, edited = 0, node_level) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        purpose: 'record',
        record_thing: 'node',
        node_id: node_id,
        label: label,
        f_node_id: f_node_id,
        p_node_id: p_node_id,
        edited: edited,
        level: node_level,
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

  edit_LogicNode(node_id, new_label, edited = 1, f_node_id = null, p_node_id = null) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        node_id: node_id,
        new_label: new_label,
        edited: edited,
        f_node_id: f_node_id,
        p_node_id: p_node_id,
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
}

window.addEventListener('load', async () => {
    try {
    console.log("[LogicNetwork] window load: start");
    defaultLogicNetwork = new LogicNetwork("mynetwork", "load");
    window.defaultLogicNetwork = defaultLogicNetwork;
    console.log("[LogicNetwork] instance created:", !!window.defaultLogicNetwork);

    // データベースから復元
    await defaultLogicNetwork.initializeFromDatabase();

    // デバッグ用: 初期化確認
    console.log('[LogicNetwork] initialized:', !!window.defaultLogicNetwork);
    console.log('[LogicNetwork] ownNetwork exists:', !!window.defaultLogicNetwork.ownNetwork);

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

  // PDF出力ボタン（id: ln_export_pdf）
  $(`#ln_export_pdf`).on("click", e => {
    defaultLogicNetwork.exportNetworkToPDF();
  });

  // フォールバック: inline onClick="defaultLogicNetwork.exportNetworkToPDF;" にも対応
  document.querySelectorAll('a[onclick*="defaultLogicNetwork.exportNetworkToPDF"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      try {
        window.defaultLogicNetwork && window.defaultLogicNetwork.exportNetworkToPDF();
      } catch (e) {
        console.error("inline-PDF export failed:", e);
      }
    });
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
  } catch (e) {
    console.error("[LogicNetwork] window load error:", e);
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