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

  // 追加: fact用ID生成（必ず reason より小さいIDを返す）
  generateFactId() {
    const ts = Date.now().toString();
    let a = Math.floor(Math.random() * 1e6);
    let b = Math.floor(Math.random() * 1e6);
    // 同値回避
    while (a === b) b = Math.floor(Math.random() * 1e6);
    // a < b に正規化
    if (a > b) { const tmp = a; a = b; b = tmp; }
    const fact = ts + String(a).padStart(6, '0');
    const reason = ts + String(b).padStart(6, '0');
    // 次回のreason要求に備えて保存
    this._nextReasonIdFromFactPair = reason;
    return fact;
  }

  // 追加: reason用ID生成（factより大きいIDを返す）
  generateReasonId() {
    // 直前の generateFactId で用意済みならそれを使う
    if (this._nextReasonIdFromFactPair) {
      const id = this._nextReasonIdFromFactPair;
      this._nextReasonIdFromFactPair = null;
      return id;
    }
    // 単独呼び出し時は自分で大きい方を生成
    const ts = Date.now().toString();
    let a = Math.floor(Math.random() * 1e6);
    let b = Math.floor(Math.random() * 1e6);
    while (a === b) b = Math.floor(Math.random() * 1e6);
    if (a > b) { const tmp = a; a = b; b = tmp; }
    return ts + String(b).padStart(6, '0');
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
  addNode(node_id, label, f_node_id = null, p_node_id = null, edited = false, level) {
    const newNode = {
      id: node_id,
      label: label,
      // x, y は設定しない（レイアウトに委譲）
      shape: 'box',
      f_node_id: f_node_id,
      p_node_id: p_node_id,
      edited: !!edited,
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
    
    // 編集されているならedited = trueで実線，未編集ならedited = falseで点線
    if (!node.edited) {
      borderDashes = true; // 点線
      // Forest/P の紐づきがどちらも無いときだけ黒枠
      if ((node.f_node_id == null || node.f_node_id === '') &&
          (node.p_node_id == null || node.p_node_id === '')) {
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
    if (node) {
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
        edited: true // 編集されたので true に設定
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
      defaultRecordLogicNetwork.edit_LogicNode(node.id, result_label, true, node.f_node_id || null, node.p_node_id || null);
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
    const claimlevel = 0;
    const factlevel = 1;
    const reasonlevel = 1;

    const triangle_id = this.generateUniqueNumberText();
    const claim_id = this.generateUniqueNumberText();
    // 変更: 必ず fact_id < reason_id になるよう専用関数を使用
    const fact_id = this.generateFactId();
    const reason_id = this.generateReasonId();

    // 主張ノードは整形済みラベルを使用
    //三角形描画のため、ノードとエッジを追加
    this.addNode(claim_id, claimLabel, f_node_id, p_node_id, !!edited, claimlevel);
    this.addNode(fact_id, "事実", null, null, false, factlevel);
    this.addNode(reason_id, "理由", null, null, false, reasonlevel);
    this.addEdge(fact_id, claim_id);
    this.addEdge(claim_id, reason_id);
    this.addEdge(reason_id, fact_id);

    // レイアウトを再適用（重なり回避）
    this.relayoutHierarchy(true);

    // DB記録（edited は bool -> 1/0 変換は送信側で実施）
    defaultRecordLogicNetwork.record_LogicNode(claim_id, claimLabel, f_node_id, p_node_id, !!edited, claimlevel);
    defaultRecordLogicNetwork.record_LogicNode(fact_id, "事実", null, null, false, factlevel);
    defaultRecordLogicNetwork.record_LogicNode(reason_id, "理由 ", null, null, false, reasonlevel);
    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, claim_id, fact_id, reason_id, "", "");

    // 追加: メモリ上の三角一覧にも反映
    try {
      this.triangles = this.triangles || [];
      this.triangles.push({
        triangle_id: triangle_id,
        claim_id: claim_id,
        fact_id: fact_id,
        reason_id: reason_id,
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
  
    // 新しい三角ロジックのIDを生成
    const triangle_id = this.generateUniqueNumberText();
    // 新しいノードのIDを生成
    const add_reason_id = this.generateUniqueNumberText();
    const add_fact_id = this.generateUniqueNumberText();
  
    // 新しいノードを追加（選択ノードの1つ下のレベルに配置）
    this.addNode(add_reason_id, "", null, null, false, newNodeLevel);
    this.addNode(add_fact_id, "", null, null, false, newNodeLevel);

    // エッジ追加まで完了
    this.addEdge(selectedNodeId, add_reason_id);
    this.addEdge(add_reason_id, add_fact_id);
    this.addEdge(add_fact_id, selectedNodeId);

    // レイアウトを再適用（重なり回避）
    this.relayoutHierarchy(true);

    // DB記録
    // ここで保存ラベルが表示の役割と逆になっているなら入れ替える
    defaultRecordLogicNetwork.record_LogicNode(add_reason_id, "", null, null, false, newNodeLevel);   // 旧: "Reason"
    defaultRecordLogicNetwork.record_LogicNode(add_fact_id, "", null, null, false, newNodeLevel);   // 旧: "Fact"
    defaultRecordLogicNetwork.record_LogicTriangle(triangle_id, baseNode.id, add_fact_id, add_reason_id, "", "");

    // 追加: メモリ上の三角一覧にも反映
    try {
      this.triangles = this.triangles || [];
      this.triangles.push({
        triangle_id: triangle_id,
        claim_id: baseNode.id,
        fact_id: add_fact_id,
        reason_id: add_reason_id,
        claimReason: "",
        conflict: ""
      });
    } catch (_) {}
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

    // DBから type を取得してtoiノードならブロック
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
    // 三角ロジックの選択ノードを取得
    const LogicNodeId = this.ownNetwork.getSelection().nodes[0];
    console.log("applyForestToTriangle: LogicNodeId =", LogicNodeId);
    
    if (!LogicNodeId) {
      alert("右側のノードを選択してください");
      return;
    }

    // 三角ロジックノードの現在の状態をチェック
    const currentLogicNode = this.nodes.get(LogicNodeId);
    const wasDeleted = !currentLogicNode.label || currentLogicNode.label === null || currentLogicNode.label === '';

    // 三角ロジックのラベルをForestの内容で更新
    console.log("applyForestToTriangle: editNodeを呼び出し");
    this.editNode(LogicNodeId, f_node.topic);
    // Forestから反映されたノードに特別なスタイルを適用
    const updatedNode = this.nodes.get(LogicNodeId);
    const styledNode = {
      ...updatedNode,
      f_node_id: f_node.id || "default",
      edited: true
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
    
    // Forestから反映されたので edited = true を設定して送信（送信側で1/0に変換）
    defaultRecordLogicNetwork.edit_LogicNode(LogicNodeId, f_node.topic, true, f_node_id, null);
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

    // 論理ネットワーク側の選択ノードを取得
    const selectedLogicNodeId = this.ownNetwork.getSelection().nodes[0];
    
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
  
    alert(`論理ネットワークノードの内容を「${elementText}」で更新しました`);
    
    // presentation要素のIDを取得
    const p_element_id = selectedElement.id || selectedElement.getAttribute('node_id') || "default";
    console.log("applyPresentationToTriangle: edit_LogicNode 呼び出し (p, concept)", { p_element_id, conceptIdFromPresentation });

    // presentation ID付きでデータベースを更新（conceptidがあれば第四引数に渡す）
    defaultRecordLogicNetwork.edit_LogicNode(
      selectedLogicNodeId,
      elementText,
      true,
      conceptIdFromPresentation || null,
      p_element_id
    );
  }

  // 論理の説明を追加する関数（旧）→ 新モーダルに委譲
  completeLogic() {
    return this.openLogicDetailModal();
  }

  // 論理の認知的葛藤を追加する関数（旧）→ 新モーダルに委譲
  conflictLogic() {
    return this.openLogicDetailModal();
  }

  // 統合: 説明・葛藤入力モーダルを開く
  openLogicDetailModal() {
    console.log("openLogicDetailModal: 開始");

    // 選択されているノードを取得
    const selectedNodeId = this.ownNetwork.getSelection().nodes[0];
    if (!selectedNodeId) {
      alert("ノードを選択してください");
      return;
    }

    const selectedNode = this.nodes.get(selectedNodeId);
    if (!selectedNode) {
      console.error("選択されたノードが見つかりません");
      return;
    }
    if (!this.isClaimNode(selectedNodeId)) {
      alert("主張ノード（claim）を選択してください");
      return;
    }
    if (!selectedNode.label || selectedNode.label.trim() === "") {
      alert("まず、ノードに内容を入力してください");
      return;
    }

    // 既存値を取得
    const existingClaimReason = selectedNode.claimReason || selectedNode.ClaimReason || "";
    const existingConflict = selectedNode.conflict || "";

    // モーダル表示
    this.showLogicDetailModal(selectedNodeId, selectedNode.label, existingClaimReason, existingConflict);
  }

  // 統合モーダルの表示処理
  showLogicDetailModal(nodeId, nodeLabel, existingClaimReason, existingConflict) {
    console.log("showLogicDetailModal: nodeId =", nodeId);

    const modal = document.getElementById('logicDetailModal');
    const nodeTitle = document.getElementById('detailNodeTitle');
    const crTextarea = document.getElementById('detailClaimReasonTextarea');
    const cfTextarea = document.getElementById('detailConflictTextarea');

    if (modal && nodeTitle && crTextarea && cfTextarea) {
      const cleanLabel = String(nodeLabel || "").replace(/\n/g, ' ').trim();
      nodeTitle.textContent = `「${cleanLabel}」の説明・葛藤`;

      crTextarea.value = existingClaimReason || "";
      cfTextarea.value = existingConflict || "";

      modal.style.display = 'block';
      crTextarea.focus();

      modal.dataset.currentNodeId = String(nodeId);
    } else {
      console.error("統合モーダル要素が見つかりません");
      alert("説明・葛藤入力画面を表示できませんでした");
    }
  }

  // 統合: 説明・葛藤を保存
  saveLogicDetail() {
    console.log("saveLogicDetail: 開始");

    const modal = document.getElementById('logicDetailModal');
    const crTextarea = document.getElementById('detailClaimReasonTextarea');
    const cfTextarea = document.getElementById('detailConflictTextarea');

    if (!modal || !crTextarea || !cfTextarea) {
      console.error("統合モーダル要素が見つかりません");
      return;
    }

    const nodeId = modal.dataset.currentNodeId;
    if (!nodeId) {
      console.error("ノードIDが取得できません");
      return;
    }

    const claimReason = (crTextarea.value || "").trim();
    const conflict = (cfTextarea.value || "").trim();

    // このノードが主張となる三角形のIDを取得して保存
    this.getTriangleIdByClaimId(nodeId).then(triangleId => {
      if (!triangleId) {
        console.error("該当する三角形が見つかりません");
        alert("この主張に対応する三角が見つかりません");
        return;
      }

      // ノード側へも保持（UI反映）
      const node = this.nodes.get(nodeId);
      if (node) {
        this.nodes.update({
          id: nodeId,
          claimReason: claimReason,
          hasClaimReason: claimReason.length > 0,
          conflict: conflict,
          hasConflict: conflict.length > 0
        });
      }

      // DB保存（既存のAPIを順に呼ぶ）
      this.saveClaimReasonToDatabase(triangleId, claimReason);
      this.saveConflictToDatabase(triangleId, conflict);

      this.closeLogicDetailModal();
      alert((claimReason.length > 0 || conflict.length > 0) ? "説明・葛藤を保存しました" : "説明・葛藤を削除しました");
    });
  }

  // 統合モーダルを閉じる
  closeLogicDetailModal() {
    const modal = document.getElementById('logicDetailModal');
    if (modal) {
      // 追加: 図形バッジ生成/削除（主張ノードのみ）
      const nodeId = modal.dataset && modal.dataset.currentNodeId ? String(modal.dataset.currentNodeId) : null;
      if (nodeId) {
        try {
          const isClaim =
            (typeof this.isClaimNode === 'function') ? this.isClaimNode(nodeId) : true;
          if (isClaim && this.nodes) {
            const n = this.nodes.get(nodeId);
            const has =
              !!(n && ((n.claimReason && String(n.claimReason).trim().length) ||
                       (n.conflict && String(n.conflict).trim().length)));

            const badgeId = `ln_status_dot_${nodeId}`; // 既存IDを流用
            const container = this._containerEl || document.getElementById('mynetwork') || document.body;

            if (has) {
              // 生成/更新（上向き三角形のバッジ）
              let el = document.getElementById(badgeId);
              if (!el) {
                el = document.createElement('div');
                el.id = badgeId;
                el.style.position = 'absolute';
                el.style.pointerEvents = 'none';
                el.style.zIndex = '11';
                el.title = '説明/葛藤あり';
                container.appendChild(el);
              }
              // 三角形スタイル（幅高さ0 + ボーダーで描画）
              el.style.width = '0';
              el.style.height = '0';
              el.style.background = 'transparent';
              el.style.borderRadius = '0';
              el.style.borderLeft = '7px solid transparent';
              el.style.borderRight = '7px solid transparent';
              el.style.borderBottom = '12px solid #ff8c00'; // オレンジ色の三角形

              // 位置更新（右上）
              try {
                if (this.ownNetwork && typeof this.ownNetwork.getBoundingBox === 'function') {
                  const bb = this.ownNetwork.getBoundingBox(nodeId);
                  if (bb && typeof this.ownNetwork.canvasToDOM === 'function') {
                    const pos = { x: bb.right + 2, y: bb.top - 2 };
                    const dom = this.ownNetwork.canvasToDOM(pos);
                    el.style.left = `${dom.x}px`;
                    el.style.top = `${dom.y}px`;
                    el.style.transform = 'translate(-100%, -100%)';
                  }
                }
              } catch(_) {}
            } else {
              // 無ければ削除
              const el = document.getElementById(badgeId);
              if (el) { try { el.remove(); } catch(_) {} }
            }
          }
        } catch(_) {}
      }

      // 既存の閉じ処理
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

        // edited を boolean に正規化（true/1/"1" => true）
        const editedBool = (node.edited === true) || (node.edited === 1) || (node.edited === "1");

        const restoredNode = {
          id: node.node_id,
          label: isDeleted ? "" : formattedLabel,
          // x, y は設定しない
          shape: 'box',
          f_node_id: node.f_node_id || null,
          p_node_id: node.p_node_id || null,
          edited: editedBool,
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
          // 修正: claimId の取得ミスを修正（以前は claimReason を参照していた）
          const claimId = t && (t.claim_id ?? t.claimId);
          if (!claimId) continue;

          const n = this.nodes.get(String(claimId));
          if (!n) continue;

          const cr = (t.claimReason ?? "").trim();
          const cf = (t.conflict ?? "").trim();

          const next = { id: n.id };
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
          if (need) updates.push(next);
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
        addEdgeOnce(claimId, fact_id);
        addEdgeOnce(claimId, reason_id);
        addEdgeOnce(fact_id, reason_id);
        // reason / fact が次の claim になっている場合は続けて再現
        if (claimIndex.has(fact_id)) dfs(fact_id);
        if (claimIndex.has(reason_id)) dfs(reason_id);
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
      if (!nt) return null;
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

  // 三角(複数)をハイライト + 役割タグ表示（主張=下、事実/理由付け=上に分割）
  highlightTriangles(triangles) {
    // 既存ハイライトとタグ解除
    this.clearTriangleHighlight();

    const nodeIds = new Set();
    const edgeTriples = [];
    const nodeRoles = new Map(); // nodeId -> Set(役割)

    const addRole = (nodeId, role) => {
      if (!nodeRoles.has(nodeId)) nodeRoles.set(nodeId, new Set());
      nodeRoles.get(nodeId).add(role);
    };

    // 役割を集計（表示ラベルは既存どおり: reason=「事実」, fact=「理由付け」）
    for (const t of triangles) {
      const nt = this.normalizeTriangle(t);
      if (!nt) continue;
      addRole(nt.claimId, "主張");
      addRole(nt.factId, "事実");
      addRole(nt.reasonId, "理由付け");

      nodeIds.add(nt.claimId);
      nodeIds.add(nt.factId);
      nodeIds.add(nt.reasonId);

      edgeTriples.push([nt.claimId, nt.factId]);
      edgeTriples.push([nt.claimId, nt.reasonId]);
      edgeTriples.push([nt.factId, nt.reasonId]);
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

    // 役割タグを生成（主張=下、事実/理由付け=上）: 役割ごとに上下へ分割
    nodeRoles.forEach((rolesSet, nodeId) => {
      const roles = Array.from(rolesSet);
      const bottomRoles = roles.filter(r => r === '主張');
      const topRoles = roles.filter(r => r !== '主張');
      if (topRoles.length) this.createOrUpdateRoleTag(String(nodeId), topRoles, 'top');
      if (bottomRoles.length) this.createOrUpdateRoleTag(String(nodeId), bottomRoles, 'bottom');
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

  // 役割タグDOMを生成/更新（位置: 'top' or 'bottom' をサポート）
  createOrUpdateRoleTag(nodeId, roles, posMode) {
    try {
      if (!this._containerEl || !this.ownNetwork) return;
      const text = Array.isArray(roles) ? roles.join('・') : String(roles || '');
      const pos = (posMode === 'bottom') ? 'bottom' : (posMode === 'top' ? 'top' : 'top-left');
      const key = `${nodeId}:${pos}`;

      let el = this._roleTagEls.get(key);
      if (!el) {
        el = document.createElement('div');
        el.className = 'ln-role-tag';
        el.style.position = 'absolute';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '10';
        el.style.fontSize = '17px';
        el.style.lineHeight = '1.4';
        el.style.whiteSpace = 'nowrap';
        el.style.color = '#000';
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

  // 単一タグの位置更新（上: top, 下: bottom, 互換: top-left）
  updateRoleTagPositionFor(nodeId, el) {
    try {
      if (!this.ownNetwork) return;
      const bb = this.ownNetwork.getBoundingBox(nodeId);
      if (!bb) return;
      const posMode = el.dataset.pos || 'top';

      if (posMode === 'bottom') {
        // 下中央
        const bottomCenter = { x: (bb.left + bb.right) / 2, y: bb.bottom + 4 };
        const dom = this.ownNetwork.canvasToDOM(bottomCenter);
        el.style.left = `${dom.x}px`;
        el.style.top = `${dom.y}px`;
        el.style.transform = 'translate(-50%, 0)';
      } else if (posMode === 'top') {
        // 上中央（少し離して上に）
        const topCenter = { x: (bb.left + bb.right) / 2, y: bb.top - 6 };
        const dom = this.ownNetwork.canvasToDOM(topCenter);
        el.style.left = `${dom.x}px`;
        el.style.top = `${dom.y}px`;
        el.style.transform = 'translate(-50%, -100%)';
      } else {
        // 互換: 左上
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
    try {
      // 1) レポート本文を作成（collectTriangleLogic 優先）
      const reportText = this.buildTriangleTextReport();
      if (!reportText || reportText.trim() === "") {
        alert("出力する三角ロジックが見つかりません");
        return;
      }

      const ts = this._buildTimestamp();
      const outName = filename || `logic_triangles_${ts}.pdf`;

      // 2) jsPDF 検出（旧/新両対応）
      const JSPDFCtor =
        (window.jspdf && (window.jspdf.jsPDF || window.jspdf.default)) ||
        window.jsPDF;

      if (!JSPDFCtor) {
        // TXT フォールバック
        const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (outName.replace(/\.pdf$/i, '') + ".txt");
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        return;
      }

      // PDF 出力
      const pdf = new JSPDFCtor({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // 旧API互換: getWidth/getHeight が無い環境に対応
      const ps = pdf.internal && pdf.internal.pageSize ? pdf.internal.pageSize : {};
      const pageW = (typeof ps.getWidth === 'function') ? ps.getWidth() : (ps.width || 595.28);
      const pageH = (typeof ps.getHeight === 'function') ? ps.getHeight() : (ps.height || 841.89);

      const margin = 36;
      const maxW = pageW - margin * 2;
      const lineH = 14;

      // ヘッダー
      pdf.setFontSize(12);
      pdf.text("三角ロジック エクスポート", margin, 20);
      pdf.setFontSize(9);
      pdf.text(`Exported: ${ts}`, pageW - margin - 140, 20);

      // 本文
      pdf.setFontSize(11);

      // splitTextToSize が無い場合のフォールバック
      const simpleWrap = (text, maxChars = 60) => {
        const result = [];
        const para = String(text).split('\n');
        for (let p = 0; p < para.length; p++) {
          const t = para[p];
          if (t.length <= maxChars) { result.push(t); continue; }
          for (let i = 0; i < t.length; i += maxChars) {
            result.push(t.substr(i, maxChars));
          }
        }
        return result;
      };
      const lines = (typeof pdf.splitTextToSize === 'function')
        ? pdf.splitTextToSize(reportText, maxW)
        : simpleWrap(reportText, 80);

      let y = 36 + 10;
      for (const line of lines) {
        if (y > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += lineH;
      }

      pdf.save(outName);
    } catch (e) {
      console.error("exportNetworkToPDF text-mode error:", e && (e.stack || e));
      alert("文章の出力に失敗しました");
    }
  }

  // collectTriangleLogic を使って文章を作成。無ければ this.triangles + this.nodes で生成
  buildTriangleTextReport() {
    const header = () => {
      const ts = this._buildTimestamp();
      return [
        "=== 三角ロジック エクスポート ===",
        `Exported: ${ts}`,
        ""
      ].join("\n");
    };

    // 1) 外部collectTriangleLogicを優先
    try {
      const external = (typeof this.collectTriangleLogic === "function")
        ? this.collectTriangleLogic()
        : (typeof window.collectTriangleLogic === "function")
          ? window.collectTriangleLogic()
          : null;

      if (external) {
        // 文字列ならそのまま
        if (typeof external === "string") {
          return header() + external;
        }
        // オブジェクト/配列なら整形
        const body = this._formatTrianglesFromExternal(external);
        if (body && body.trim() !== "") {
          return header() + body;
        }
      }
    } catch (e) {
      console.warn("collectTriangleLogic 呼び出しに失敗:", e);
    }

    // 2) フォールバック: this.triangles と nodes から構築
    if (!Array.isArray(this.triangles) || this.triangles.length === 0) {
      return "";
    }

    const lines = [header()];
    let idx = 1;
    for (const t of this.triangles) {
      const triId = String(t.triangle_id ?? t.triangleId ?? idx);
      const claimId = String(t.claim_id ?? t.claimId ?? "");
      const reasonId = String(t.reason_id ?? t.reasonId ?? "");
      const factId = String(t.fact_id ?? t.factId ?? "");

      // ラベル取得（boxノードの label から改行を除去）
      const claim = this._getCleanLabel(this.nodes.get(claimId));
      const reason = this._getCleanLabel(this.nodes.get(reasonId));
      const fact = this._getCleanLabel(this.nodes.get(factId));

      // 役割の表記はハイライト時の定義に合わせる（reason=事実, fact=理由付け）
      const claimReason = (t.claimReason ?? this.nodes.get(claimId)?.claimReason ?? "") || "";
      const conflict = (t.conflict ?? this.nodes.get(claimId)?.conflict ?? "") || "";

      lines.push(
        `#${idx}`,
        `三角ID: ${triId}`,
        `主張: ${claim || "(空)"}`,
        `理由付け: ${fact || "(空)"}`,
        `事実: ${reason || "(空)"}`,
        `説明: ${claimReason || "-"}`,
        `葛藤: ${conflict || "-"}`,
        ""
      );
      idx++;
    }

    return lines.join("\n");
  }

  // 外部データ（collectTriangleLogicの戻り値）をできるだけ賢く整形
  _formatTrianglesFromExternal(external) {
    const arr = Array.isArray(external)
      ? external
      : (external && Array.isArray(external.triangles))
        ? external.triangles
        : null;

    if (!arr || arr.length === 0) return "";

    const lines = [];
    let idx = 1;
    for (const t of arr) {
      // さまざまなキー名に対応
      const triId = String(t.triangle_id ?? t.triangleId ?? idx);
      const claim = String(
        t.claim ?? t.Claim ?? t.claim_text ?? t.claimLabel ?? ""
      ).trim();
      // 役割名の揺れにも対応（reason/factの意味は既存UIに合わせて表示を入替）
      const reasonText = String(
        t.reason ?? t.Reason ?? t.reason_text ?? t.reasonLabel ?? ""
      ).trim();
      const factText = String(
        t.fact ?? t.Fact ?? t.fact_text ?? t.factLabel ?? ""
      ).trim();

      const claimReason = String(
        t.claimReason ?? t.ClaimReason ?? t.explain ?? ""
      ).trim();
      const conflict = String(t.conflict ?? t.Conflict ?? "").trim();

      lines.push(
        `#${idx}`,
        `三角ID: ${triId}`,
        `主張: ${claim || "(空)"}`,
        `理由付け: ${factText || "(空)"}`, // 表示は UI と同じく fact→理由付け
        `事実: ${reasonText || "(空)"}`,
        `説明: ${claimReason || "-"}`,
        `葛藤: ${conflict || "-"}`,
        ""
      );
      idx++;
    }
    return lines.join("\n");
  }

  // ノードの label を改行除去して取得（未定義や空も安全に処理）
  _getCleanLabel(node) {
    if (!node || typeof node.label !== "string") return "";
    return node.label.replace(/\n/g, "").trim();
  }

  // 足りていないと例外になるため追加（タイムスタンプ: YYYYMMDD_HHMM）
  _buildTimestamp() {
    const d = new Date();
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}`;
  }

  // 追加: 主張ノード判定（triangles の claim_id に含まれるか）
  isClaimNode(nodeId) {
    if (!Array.isArray(this.triangles) || this.triangles.length === 0) return false;
    const id = String(nodeId);
    return this.triangles.some(t => String(t.claim_id ?? t.claimId) === id);
  }

  // 主張ノードIDから三角IDを取得（saveLogicDetail 互換のため Promise 返却）
  getTriangleIdByClaimId(claimNodeId) {
    const id = String(claimNodeId);
    if (!Array.isArray(this.triangles)) return Promise.resolve(null);
    for (const t of this.triangles) {
      const cid = t && (t.claim_id ?? t.claimId);
      if (cid != null && String(cid) === id) {
        const triId = t.triangle_id ?? t.triangleId ?? null;
        return Promise.resolve(triId);
      }
    }
    return Promise.resolve(null);
  }

  // 説明（claimReason）保存
  saveClaimReasonToDatabase(triangleId, claimReason) {
    try {
      $.ajax({
        url: "php/logic_maneger.php",
        type: "POST",
        data: {
          purpose: 'update',
          update_thing: 'claim_reason',
          triangle_id: triangleId,
          claim_reason: claimReason
        },
        dataType: "json"
      });
    } catch(_) {}
  }

  // 認知的葛藤（conflict）保存
  saveConflictToDatabase(triangleId, conflict) {
    try {
      $.ajax({
        url: "php/logic_maneger.php",
        type: "POST",
        data: {
          purpose: 'update',
          update_thing: 'conflict',
          triangle_id: triangleId,
          conflict: conflict
        },
        dataType: "json"
      });
    } catch(_) {}
  }
}

class RecordLogicNetwork{
  record_LogicTriangle(triangle_id, claim_id, fact_id, reason_id){
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        triangle_id : triangle_id,
        claim_id : claim_id,
        fact_id : fact_id,
        reason_id : reason_id,
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

  record_LogicNode(node_id, label, f_node_id, p_node_id, edited = false, node_level) {
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
        // bool -> 1/0 に変換して送信
        edited: edited ? 1 : 0,
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

  edit_LogicNode(node_id, new_label, edited = true, f_node_id = null, p_node_id = null) {
    $.ajax({
      url: "php/logic_maneger.php",
      type: "POST",
      data: {
        node_id: node_id,
        new_label: new_label,
        // bool -> 1/0 に変換して送信
        edited: edited ? 1 : 0,
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