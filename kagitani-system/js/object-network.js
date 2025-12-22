// 議論内省マップに関する処理プログラム
let defaultThinkingProcess;
let defaultRecordThinkingProcess;
let defaultShowThinkingProcess;
let globalParams = null; //クリックされたネットワークノード

// グローバルスコープに移動

class ThinkingProcess { // forestMRN: forest Meeting Reflection Network
    constructor(container, load) {
        // this.ownNetwork = this.generateThinkingProcessNetworkCanvas(container, {}, {}); // デフォルトのマップを表示

        defaultRecordThinkingProcess = new RecordThinkingProcess();
        this.nodes = new vis.DataSet();
        // エッジDataSetの初期化時にIDフィールドを明示
        this.edges = new vis.DataSet([], { 
            idField: 'id'  // IDフィールドを明示的に指定
        });
        this.options = {
        physics: false,
        nodes: {
            margin: 15,
            widthConstraint: { maximum: 150 },
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.18)',
                size: 18,
                x: 4,
                y: 4
            },
            chosen: {
                node: function(values, id, selected, hovering) {
                    // 影は常に有効
                    values.shadow = true;
                    values.shadowColor = 'rgba(0,0,0,0.18)';
                    values.shadowSize = 18;
                    values.shadowX = 4;
                    values.shadowY = 4;
                }
            },
            scaling: { min: 10, max: 30 }
        },
            edges: {
                arrows: 'to', // エッジに矢印を付けて有向グラフにする
                smooth: false // falseにするとエッジが直線になる
            },
            interaction: {
                multiselect: false,
                zoomView: false, // ピンチズームを無効にする
                dragView: true, // パン（ドラッグによる移動）を有効にする
                navigationButtons: false, // ナビゲーションボタンを無効化
                keyboard: {
                    enabled: false // キーボードナビゲーションを無効化
                },
                tooltipDelay: 200,
                hideEdgesOnDrag: false,
                hideNodesOnDrag: false,
                hover: true  // ホバーを明示的に有効化
            },
            configure: {
                enabled: false
            },
            // カスタムツールチップの設定は vis の options ではなく
            // setupCustomTooltip()/ノードの `title` で制御します。
            // ここに不正な `tooltip` オブジェクトを残すと vis.Network が
            // "Unknown option detected: 'tooltip'" と投げるため削除しました。
        };
        this.nodeConnectEnabled = false; // マインドマップとの対応づけを可能にする（マインドマップのノードクリックが，議論内省マップノードとの対応を付与するのかそうでないのかを判定するよう）
        this.latest_selected_node_info = {
            x: 0,
            y: 35
        }; // 最後にクリックされたノードの情報
        this.output_input = {}; //オントロジーの入力と出力の対応付け
        this.output_list = [];  //概念として出すもの
        this.dragStartNodeId = null;  //ドラッグスタートしたノードのID
        this.dragEndNodeId = null; //ドラッグエンドしたノードID
        this.edgeEditMode = false; // リンクを編集できるかどうかのモード（Falseは編集不可）
        this.EdgeStartId = []; //エッジの開始ID
        this.EdgeEndId = []; //エッジの終了ID
        this.OntologyNodeId = []; //オントロジーノードのノードID
        this.OntologyConnectNodeId = []; //オントロジーノードと対応づいているノードID
        this.ReasonNodeId = []; //理由ノードのノードID
        this.ReasonConnectNodeId = []; //理由ノードと対応づいているノードID
        this.ReasonContent = []; //理由ノードの内容を保存する配列
        this.TimeNodeId = []; //完了予定ノードのノードID
        this.TimeConnectNodeId = []; //完了予定ノードと対応づいているノードID
        this.TimeContent = []; //完了予定ノードの内容を保存する配列
        this.EdgeLabels = {}; //エッジのラベル情報を保存するオブジェクト {edgeId: label}
        this.ConnectNetworkNodeId = [];
        this.ConnectMindMapNodeId = [];
        this.RecruitNodeId = [];//採用or棄却されたノードID
        this.Recruit = [];//採用or棄却
        this.Feedback = [];//フィードバック書いたかどうか
        this.FeedbackNodeId = null; //フィードバック書かれるノードID
        this.selectId = null;//選択されたノードID
        this.interval = null; //インターバル抜けるための変数
        this.material_id = null;
        this.concept_id = null;
        this.scale = 1;
        this.isViewingPastData = false; // 過去データ表示状態フラグ
        this.BoxDisplay = {
            x: 0,
            y: 0
        }//右クリックされやメニューの表示場所
        this.jmindex = []; // マインドマップとの連携用インデックス配列
        this.ownNetwork = this.generateThinkingProcessNetworkCanvas(container, this.nodes, this.edges); // デフォルトのマップを表示
        this.choose_input_xmlLoad();
        // jmnode の右クリック制御をセットアップ
        this.setupJmnodeContextGuards();
        // カスタムツールチップの設定
        this.setupCustomTooltip();
        if(load == "load"){
            this.jmindex = [];
            // bind UI handlers via addEventLister() to avoid duplicate bindings
            this.addEventLister();
            // network event handlers (not bound in addEventLister)
            this.ownNetwork.on('click', this.networkClick.bind(this));
            this.ownNetwork.on('dragStart', this.dragstart.bind(this));
            this.ownNetwork.on('dragEnd', this.dragend.bind(this));
            this.ownNetwork.on('doubleClick', this.doubleclick.bind(this));
            this.ownNetwork.on("oncontext", this.onContext.bind(this));
            this.ownNetwork.on('select', this.selectdelete.bind(this));
            
            // マウス移動による拡張ホバー検出
            this.ownNetwork.on("hoverNode", (params) => {
                // console.log("hoverNode event triggered for node:", params.node);
                // 現在のノードの状態を取得して保持
                const currentNode = this.nodes.get(params.node);
                if (currentNode) {
                    // 影は常に有効なので、ホバー時の影変更は不要
                    if (currentNode.group === "step" || currentNode.group === "versions" || currentNode.group === "versionsBro") {
                        this.showAddNodeButton(params.node, params);
                    }
                }
            });

            this.ownNetwork.on("blurNode", (params) => {
                // console.log("blurNode event triggered for node:", params.node);
                // 現在のノードの状態を取得して保持
                const currentNode = this.nodes.get(params.node);
                if (currentNode) {
                    // 影は常に有効なので、ホバー解除時の影変更は不要
                }
                // ホバーが外れた時にボタンを非表示
                this.hideAddNodeButton();
            });

            // エッジのホバーイベント
            this.ownNetwork.on("hoverEdge", (params) => {
                console.log("🔍 hoverEdge event triggered for edge:", params.edge);
                
                // エッジの詳細情報を取得して表示
                const edgeData = this.edges.get(params.edge);
                if (edgeData) {
                    console.log("📊 エッジの詳細情報:", {
                        "エッジID (object_edge_id)": edgeData.id,
                        "開始ノード (edge_start)": edgeData.from,
                        "終了ノード (edge_end)": edgeData.to,
                        "グループ": edgeData.group,
                        "ラベル": edgeData.label || "なし"
                    });
                    
                    // ブラウザの画面上にも表示
                    const message = `エッジID: ${edgeData.id}\n開始: ${edgeData.from} → 終了: ${edgeData.to}`;
                    console.log(`💡 ${message}`);
                } else {
                    console.warn("⚠️ エッジデータが見つかりません:", params.edge);
                    // 全エッジを確認
                    const allEdges = this.edges.get();
                    console.log("📋 現在のすべてのエッジ:", allEdges.map(e => ({
                        id: e.id,
                        from: e.from,
                        to: e.to,
                        group: e.group
                    })));
                }
                
                this.showAddEdgeButton(params.edge);
            });

            this.ownNetwork.on("blurEdge", (params) => {
                console.log("blurEdge event triggered for edge:", params.edge);
                this.hideAddEdgeButton();
            });

            // 拡張ホバー検出を追加
            const networkContainer = document.getElementById('mynetworkid');
            if (networkContainer) {
                networkContainer.addEventListener('mousemove', (event) => {
                    const position = this.ownNetwork.DOMtoCanvas({x: event.offsetX, y: event.offsetY});
                    const nodeId = this.ownNetwork.getNodeAt(position);
                    
                    if (nodeId) {
                        const nodePositions = this.ownNetwork.getPositions([nodeId]);
                        const nodePos = nodePositions[nodeId];
                        const distance = Math.sqrt(Math.pow(position.x - nodePos.x, 2) + Math.pow(position.y - nodePos.y, 2));
                        
                        // ノードから25ピクセル以内でホバー扱い（拡張範囲）
                        if (distance <= 25) {
                            const currentNode = this.nodes.get(nodeId);
                            if (currentNode && (currentNode.group === "step" || currentNode.group === "versions" || currentNode.group === "versionsBro")) {
                                // 既にボタンが表示されていない場合のみ表示
                                const existingButton = document.querySelector('.add-node-button');
                                if (!existingButton) {
                                    this.showAddNodeButton(nodeId, {node: nodeId});
                                }
                            }
                        }
                    }
                });
            }
            
            // キーボードイベントリスナーを追加（Deleteキーでノード・エッジ削除）
            this.setupKeyboardListeners();
        }
        this.choose_input_xmlLoad();
    }

    // jmnode 要素の右クリックをガードする (type="answer" のときは無効化)
    setupJmnodeContextGuards() {
        const attachGuard = (el) => {
            try {
                if (!el) return;
                const type = el.getAttribute && el.getAttribute('type');
                if (type === 'answer') {
                    // 重複登録を避ける
                    if (!el._answerContextGuarded) {
                        el.addEventListener('contextmenu', (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            // optional: 小さなコンソールログで確認できるようにする
                            console.log('右クリック無効（answerノード）:', el.getAttribute('nodeid'));
                            return false;
                        }, { capture: true });
                        el._answerContextGuarded = true;
                    }
                }
            } catch (e) {
                console.warn('attachGuard error', e);
            }
        };

        // 既存の jmnode 要素に適用
        try {
            const existing = document.getElementsByTagName('jmnode');
            for (let i = 0; i < existing.length; i++) {
                attachGuard(existing[i]);
            }
        } catch (e) { /* ignore */ }

        // ドキュメント内で新しく追加される jmnode に対しても自動でアタッチ
        try {
            const mo = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.addedNodes && m.addedNodes.length) {
                        m.addedNodes.forEach((node) => {
                            if (!node) return;
                            if (node.tagName && node.tagName.toLowerCase() === 'jmnode') {
                                attachGuard(node);
                            } else if (node.querySelectorAll) {
                                const kids = node.querySelectorAll('jmnode');
                                kids.forEach(k => attachGuard(k));
                            }
                        });
                    }
                }
            });
            mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
            this._jmnodeMutationObserver = mo;
        } catch (e) { /* ignore */ }
    }


    choose_input_xmlLoad(){
        $.ajax({
            url:'js/hozo.xml',
            type:'get',
            dataType:'xml',
            timeout:1000,
            success:this.choose_input_parse_xml.bind(this)
        });
    }

    choose_input_parse_xml(xml,status){
        if(status!='success')return;
        const XML = $(xml).find('W_CONCEPTS');
        const label = Array.from(XML[0].getElementsByTagName('LABEL'));
        const isa = Array.from(XML[0].getElementsByTagName('ISA'));
        const rationaly_record = (return_slot) => {
            let rationaly_label;
            let input_count = 0;
            for(var i=0; i<return_slot.length; i++){
                if(return_slot[i].getAttribute("role") === "入力"){
                    label.map((content_label2) => {
                        if(return_slot[i].getAttribute('class_constraint') === content_label2.childNodes[0].nodeValue){
                            const slot_content = Array.from(content_label2.parentNode.getElementsByTagName("SLOT"));
                            slot_content.map((content_slot2) => {
                                if(content_slot2.getAttribute("role") === "出力"){
                                    if(!this.output_list.includes(content_slot2.getAttribute("class_constraint"))) {
                                        this.output_list.push(content_slot2.getAttribute("class_constraint"));
                                    }
                                    if(input_count == 0){
                                        rationaly_label = content_slot2.getAttribute("class_constraint");
                                    }else{
                                        this.output_input[rationaly_label] = content_slot2.getAttribute("class_constraint");
                                        this.output_input[content_slot2.getAttribute("class_constraint")] = rationaly_label;
                                    }
                                }
                            });
                        return;
                        }
                    });
                    input_count += 1;
                }
            }
        }
        //hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
        isa.map((content)=>{
            if(content.getAttribute('parent') === "合理性を考える"){
                label.map((content_label) => {
                    if(content.getAttribute('child') === content_label.childNodes[0].nodeValue){
                        rationaly_record(Array.from(content_label.parentNode.getElementsByTagName("SLOT")))
                        return;
                    }
                })
            }
        });
        const selectElement = document.getElementById("selectionlist");
        while (selectElement.options.length > 0) {
            selectElement.remove(0);
        }
        this.output_list.map((n) => {
            const optionElement = document.createElement('option');
            optionElement.value = n;
            optionElement.text = n;
            selectElement.appendChild(optionElement);
        })
        
        // t_Process用の選択リストも同様に更新
        const tProcessSelectElement = document.getElementById("t_Process_selectionlist");
        if (tProcessSelectElement) {
            while (tProcessSelectElement.options.length > 0) {
                tProcessSelectElement.remove(0);
            }
            this.output_list.map((n) => {
                const optionElement = document.createElement('option');
                optionElement.value = n;
                optionElement.text = n;
                tProcessSelectElement.appendChild(optionElement);
            })
        }
    }

    //オントロジーノードを選択不可に
    selectdelete(params) {
        if (this.nodes.get(params.nodes[0]).shape == "ellipse") {
            // 選択を解除
            this.ownNetwork.setSelection({ nodes: [] });
        }
    }

    addEventLister(){
        // Guard: avoid binding events multiple times
        if (this._eventsAdded) {
            console.log('イベントリスナーは既に追加済みです。スキップします。');
            return;
        }
        console.log('イベントリスナーを追加中...');
        this._eventsAdded = true;

        this.bindconnect_mindmap = this.connect_mindmap.bind(this);
        this.bindshow_select = this.show_select.bind(this);
        this.bindconnect_network = this.connect_network.bind(this);
        this.bindstep_start = this.step_start.bind(this); //kagitani
        this.bindstep_paused = this.step_paused.bind(this); //kagitani
        this.bindstep_end = this.step_end.bind(this); //kagitani
        this.bindContentmenuCancel = this.ContentmenuCancel.bind(this);
        this.bindaddontology = this.addontology.bind(this);
        this.bindshow_reason_input = this.show_reason_input.bind(this);
        this.bindadd_reason = this.add_reason.bind(this);
        this.bindcancel_reason_input = this.cancel_reason_input.bind(this);
        this.bindshow_time_input = this.show_time_input.bind(this);
        this.bindadd_time = this.add_time.bind(this);
        this.bindcancel_time_input = this.cancel_time_input.bind(this);
        this.bindSelected_Recruit_Idea = this.Selected_Recruit_Idea.bind(this);
        this.bindRecruit_Idea = this.Recruit_Idea.bind(this);

        // Use namespaced events and unbind the namespace first to ensure idempotence
        $(`#jsmind_container`).off('click.objectNetwork').on('click.objectNetwork', this.bindconnect_mindmap);
        $(`#object_conmenu1`).off('click.objectNetwork').on('click.objectNetwork', this.bindstep_start);
        $(`#object_conmenu2`).off('click.objectNetwork').on('click.objectNetwork', this.bindstep_end);
        $(`#object_conmenu3`).off('click.objectNetwork').on('click.objectNetwork', this.bindstep_paused);
        $(`#net_conmenu02`).off('click.objectNetwork').on('click.objectNetwork', this.bindstep_end);
        $(`#process_conmenu1`).off('click.objectNetwork').on('click.objectNetwork', this.bindshow_select);
        $(`#process_conmenu2`).off('click.objectNetwork').on('click.objectNetwork', this.bindconnect_network);
        $(`#process_conmenu3`).off('click.objectNetwork').on('click.objectNetwork', this.bindRecruit_Idea);
        $(`#process_conmenu4`).off('click.objectNetwork').on('click.objectNetwork', this.bindContentmenuCancel);
        $(`#process_conmenu5`).off('click.objectNetwork').on('click.objectNetwork', function() {
            console.log('理由記述ボタンがクリックされました');
        });
        $(`#process_conmenu5`).off('click.objectNetwork').on('click.objectNetwork', this.bindshow_reason_input);
        $(`#process_conmenu6`).off('click.objectNetwork').on('click.objectNetwork', this.bindshow_time_input);
        $(`#p_ontology_select`).off('click.objectNetwork').on('click.objectNetwork', this.bindaddontology);
        $(`#p_recruit_select`).off('click.objectNetwork').on('click.objectNetwork', this.bindSelected_Recruit_Idea);
        $(`#t_p_ontology_select`).off('click.objectNetwork').on('click.objectNetwork', this.bindaddontology);
        $(`#t_p_recruit_select`).off('click.objectNetwork').on('click.objectNetwork', this.bindSelected_Recruit_Idea);
        $(`#t_p_reason_select`).off('click.objectNetwork').on('click.objectNetwork', this.bindadd_reason);
        $(`#t_p_reason_cancel`).off('click.objectNetwork').on('click.objectNetwork', this.bindcancel_reason_input);
        $(`#t_p_time_select`).off('click.objectNetwork').on('click.objectNetwork', this.bindadd_time);
        $(`#t_p_time_cancel`).off('click.objectNetwork').on('click.objectNetwork', this.bindcancel_time_input);
    }

    removeEventLister(){
        $(`#jsmind_container`).off('click.objectNetwork',this.bindconnect_mindmap);
        $(`#object_conmenu1`).off('click.objectNetwork',this.bindstep_start);
        $(`#object_conmenu2`).off('click.objectNetwork',this.bindstep_end);
        $(`#object_conmenu3`).off('click.objectNetwork', this.bindstep_paused);
        $(`#net_conmenu02`).off('click.objectNetwork',this.bindstep_end);
        $(`#process_conmenu1`).off('click.objectNetwork',this.bindshow_select);
        $(`#process_conmenu2`).off('click.objectNetwork',this.bindconnect_network);
        $(`#process_conmenu3`).off('click.objectNetwork',this.bindRecruit_Idea);
        $(`#process_conmenu4`).off('click.objectNetwork',this.bindContentmenuCancel);
        $(`#process_conmenu5`).off('click.objectNetwork',this.bindshow_reason_input);
        $(`#process_conmenu6`).off('click.objectNetwork',this.bindshow_time_input);
        $(`#p_ontology_select`).off('click.objectNetwork',this.bindaddontology);
        $(`#p_recruit_select`).off('click.objectNetwork',this.bindSelected_Recruit_Idea);
        $(`#t_p_ontology_select`).off('click.objectNetwork',this.bindaddontology);
        $(`#t_p_recruit_select`).off('click.objectNetwork',this.bindSelected_Recruit_Idea);
        $(`#t_p_reason_select`).off('click.objectNetwork',this.bindadd_reason);
        $(`#t_p_reason_cancel`).off('click.objectNetwork',this.bindcancel_reason_input);
        $(`#t_p_time_select`).off('click.objectNetwork',this.bindadd_time);
        $(`#t_p_time_cancel`).off('click.objectNetwork',this.bindcancel_time_input);
        clearInterval(this.interval);
        this._eventsAdded = false;
        
        // キーボードイベントリスナーを削除
        this.removeKeyboardListeners();
    }
    /*
     * マップ編集ユーティリティ
     */
    generateUniqueNumberText() {
        return `${new Date().getTime()}${Math.floor(1000000 * Math.random())}`;
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
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、エッジ編集モードの切替は無効化されています');
            return;
        }
        this.edgeEditMode = !this.edgeEditMode;
        if(this.edgeEditMode){
            this.enableEditEdge();
        }else{
            this.disableEditEdge();
        }
    }

    //エッジ編集できる場合の処理
    enableEditEdge() {
        // エッジを編集するときは，ノードの動きを止める
        const button = document.getElementById("process_startEditEdge");
        const buttonText = button.querySelector(".button-text");
        if (buttonText) {
            buttonText.textContent = "エッジ追加終了";
        } else {
            // フォールバック: value属性も設定（古いHTMLの場合）
            button.value = "エッジ追加終了";
        }
        button.title = "エッジ追加終了";
        
        this.nodes.update(this.nodes.map(n => {
            return { ...n, fixed: true };
        }));     
    }

    //エッジ編集できない場合の処理
    disableEditEdge() {
        const button = document.getElementById("process_startEditEdge");
        const buttonText = button.querySelector(".button-text");
        if (buttonText) {
            buttonText.textContent = "エッジ追加";
        } else {
            // フォールバック: value属性も設定（古いHTMLの場合）
            button.value = "エッジ追加";
        }
        button.title = "エッジ追加";
        
        // エッジの編集モードを抜けたときは，ノードの動きを再度始める（ただし，タグノードはFixedにしておく）
        this.edgeEditMode = false;
        this.nodes.update(this.nodes.map(n => {
            return n.type !== "topic-tag" ? { ...n, fixed: false } : { ...n, fixed: true };
        }))
    }

    /*
     * 議論内省マップの表示・操作部分（Extend vis.js）
     */
    generateThinkingProcessNetworkCanvas (canvas_dom_id, nodes, edges) {
        // マップを表示

        this.setNodes(nodes);
        this.setEdges(edges);

        const network = new vis.Network(
            document.getElementById(canvas_dom_id),
            {
                nodes: nodes,
                edges: edges,
            },
            this.options
        );

        // トラックパッドスクロールをパンに割り当て
        const canvas = document.getElementById(canvas_dom_id);
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault(); // デフォルトのスクロール動作を無効化
            
            // スクロール量を取得（マップを押して動かす感覚にする）
            const deltaX = event.deltaX;
            const deltaY = event.deltaY;
            
            // 現在のビューポジションを取得
            const moveOptions = network.getViewPosition();
            
            // スクロール量に基づいてパン（マップを押して動かす感覚）
            // NOTE: 垂直方向を上下反転しているのに加え、水平も左右反転する（ユーザ要望）
            const panSensitivity = 2; // パンの感度調整
            network.moveTo({
                position: {
                    // Xを反転: 以前は moveOptions.x - deltaX * ... だったが、左右反転のため + に変更
                    x: moveOptions.x + deltaX * panSensitivity,
                    // Yは既に上下反転されている
                    y: moveOptions.y + deltaY * panSensitivity
                },
                animation: false // スムーズな移動のためアニメーションを無効化
            });
        }, { passive: false });

        // ノードクリックイベントを追加
        network.on("click", (params) => {
            this.networkClick(params);
        });

        // 右クリックイベントを追加
        network.on("oncontext", (params) => {
            this.onContext(params);
        });

        return network;

        // this.setCanvasOptions(load);
        // return network;
    }

    /*
     * ノードの操作
     */
    //手段ノードの追加
    addNode(node_id, node_label, node_type, node_x, node_y) {
        let node_color = '#d6f5d6'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        let position_fixed = false;   // ノードを動かせるかどうか（Falseなら動かせる）

        // 理由タグノードの場合の色設定
        if (node_type === "reason-tag") {
            node_color = '#FFA500'; // オレンジ色（少し薄めに調整）
            node_shape = 'ellipse'; // ゴシック絵文字をラベルで表示するため楕円形に変更
            text_color = 'white';  // 白い文字（見やすくするため）
            position_fixed = true;   // 固定位置
        }

        let result_label = '';
        // 理由タグノードの場合はアイコンラベルを使用
        if (node_type === "reason-tag") {
            result_label = '💡';
        } else {
            const maxLength = 20;
            let currentPosition = 0;
            
            while (currentPosition < node_label.length) {
                let endPosition = Math.min(currentPosition + maxLength, node_label.length);
                
                // 行の途中で終わる場合は、最後の空白を探す
                if (endPosition < node_label.length) {
                    let lastSpaceIndex = node_label.substring(currentPosition, endPosition).lastIndexOf(' ');
                    
                    // スペースが見つかった場合
                    if (lastSpaceIndex !== -1) {
                        endPosition = currentPosition + lastSpaceIndex;
                    } else {
                        // スペースが見つからない場合は、英単語の途中を避けるため、
                        // 次の文字が英字なら前に戻り、そうでなければそのまま切る
                        if (endPosition < node_label.length && 
                            /[a-zA-Z]/.test(node_label[endPosition]) && 
                            /[a-zA-Z]/.test(node_label[endPosition - 1])) {
                            // 英単語の途中の場合、前の文字まで戻る
                            while (endPosition > currentPosition && 
                                   /[a-zA-Z]/.test(node_label[endPosition - 1])) {
                                endPosition--;
                            }
                            // 戻りすぎた場合は元の位置に戻す
                            if (endPosition === currentPosition) {
                                endPosition = currentPosition + maxLength;
                            }
                        }
                    }
                }
                
                result_label += node_label.substring(currentPosition, endPosition) + '\n';
                currentPosition = endPosition;
                // 次の行の開始位置を空白の後ろにする
                while (currentPosition < node_label.length && node_label[currentPosition] === ' ') {
                    currentPosition++;
                }
            }
            result_label = result_label.trim(); // 末尾の不要な改行を除去
        }
        
        const newNode = {
            id: node_id,
            label: result_label,
            group: node_type,
            color: node_color, 
            shape: node_shape,
            font: { color: text_color },
            fixed: position_fixed,
            x: node_x, y: node_y, 
            status: "todo",
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.15)',
                size: 1,
                x: 4,
                y: 4
            }
        };

        // 手段ノード（group === 'step'）は枠線を表示しない
        if (node_type === 'step') {
            newNode.borderWidth = 0;
            newNode.borderWidthSelected = 0;
            newNode.shapeProperties = { borderDashes: false };
        }

        // 理由タグノードは絵文字ラベルで表示
        if (node_type === "reason-tag") {
            newNode.size = 20;
            newNode.title = `なぜそれを取り組もうとしたか: ${node_label}`;
            newNode.font = { color: 'white', size: 16 };
        }
        this.nodes.add(newNode);
        const boundingBox = this.ownNetwork.getBoundingBox(node_id);
        node_y += Math.floor(((boundingBox.bottom)-(boundingBox.top))/2);
        this.nodes.update({
            id : node_id,
            color: node_color,
            shape: node_shape,
            font: { color: text_color },
            y : node_y
        });
        const boundingBoxupdate = this.ownNetwork.getBoundingBox(node_id);
        this.latest_selected_node_info.x = node_x;
        this.latest_selected_node_info.y = boundingBoxupdate.bottom+10;
        defaultRecordThinkingProcess.record_Node(node_id, node_label, node_type, node_x, node_y,status);
        
        // ナビゲーターのトリガーを実行（理由タグ以外のノード追加時）
        if (node_type !== "reason-tag" && typeof executeNavigatorTrigger === 'function') {
            executeNavigatorTrigger('node_created');
        }
        
        console.log(this.nodes);
        return this.nodes;
    }
    

    // ノードの追加（リロード用）(完了)
    addReloadNode(node_id, node_label, node_type, node_x, node_y, status, purpose = null, evaluation_good = null, attribution = null, application = null, estimated_time = null) {
        const existingNode = this.nodes.get(node_id);
        if (existingNode) {
            console.log(`Node with ID ${node_id} already exists. Skipping addition.`);
            return; // 重複がある場合は追加せずにリターン
        }

        let node_color = '#d6f5d6'; // デフォルトの背景色
        let node_shape = 'box';
        let text_color = 'black';
        let position_fixed = false;
        let border_width = 1;
        let border_width_selected = 2;
        let shape_border_dashes = false;

        // ステータスに応じて色や枠線を設定
        switch (status) {
            case "inProgress":
                node_color = 'orange';
                border_width = 3;
                border_width_selected = 5;
                shape_border_dashes = [10, 5];
                break;
            case "paused":
                node_color = 'LightCoral';
                border_width = 3;
                border_width_selected = 5;
                shape_border_dashes = [5, 5];
                break;
            case "completed":
                node_color = 'gray';
                border_width = 3;
                border_width_selected = 5;
                shape_border_dashes = false;
                break;
            default:
                node_color = '#d6f5d6';
                break;
        }

        // 改行処理
        let result_label = '';
        const maxLength = 20;
        let currentPosition = 0;
        
        while (currentPosition < node_label.length) {
            let endPosition = Math.min(currentPosition + maxLength, node_label.length);
            
            // 行の途中で終わる場合は、最後の空白を探す
            if (endPosition < node_label.length) {
                let lastSpaceIndex = node_label.substring(currentPosition, endPosition).lastIndexOf(' ');
                
                // スペースが見つかった場合
                if (lastSpaceIndex !== -1) {
                    endPosition = currentPosition + lastSpaceIndex;
                } else {
                    // スペースが見つからない場合は、英単語の途中を避けるため、
                    // 次の文字が英字なら前に戻り、そうでなければそのまま切る
                    if (endPosition < node_label.length && 
                        /[a-zA-Z]/.test(node_label[endPosition]) && 
                        /[a-zA-Z]/.test(node_label[endPosition - 1])) {
                        // 英単語の途中の場合、前の文字まで戻る
                        while (endPosition > currentPosition && 
                               /[a-zA-Z]/.test(node_label[endPosition - 1])) {
                            endPosition--;
                        }
                        // 戻りすぎた場合は元の位置に戻す
                        if (endPosition === currentPosition) {
                            endPosition = currentPosition + maxLength;
                        }
                    }
                }
            }
            
            result_label += node_label.substring(currentPosition, endPosition) + '\n';
            currentPosition = endPosition;
            // 次の行の開始位置を空白の後ろにする
            while (currentPosition < node_label.length && node_label[currentPosition] === ' ') {
                currentPosition++;
            }
        }
        result_label = result_label.trim();

        // ツールチップの設定（理由と内省情報がある場合）
        let tooltip = result_label;
            if (purpose && purpose.trim() !== '') {
                tooltip += '\n\n理由: ' + purpose;
            }
            if (evaluation_good || attribution || application) {
                tooltip += '\n\n内省情報:';
                tooltip += '\n行動意図: ' + (evaluation_good || '未記入');
                tooltip += '\n完了基準: ' + (attribution || '未記入');
                tooltip += '\n学び: ' + (application || '未記入');
            }

        // ノード作成
        const newNode = {
            id: `${node_id}`,
            label: result_label,
            group: node_type,
            color: node_color,
            shape: node_shape,
            font: { color: text_color },
            fixed: position_fixed,
            x: node_x, y: node_y,
            borderWidth: border_width,
            borderWidthSelected: border_width_selected,
            shapeProperties: {
                borderDashes: shape_border_dashes
            }
        };

        // デフォルトで影を設定（手段ノードやタグは上書きする）
        newNode.shadow = { enabled: true, color: 'rgba(0,0,0,0.15)', size: 1, x: 4, y: 4 };

        // 手段ノード（group === 'step'）は枠線を表示しない
        if (node_type === 'step') {
            newNode.borderWidth = 0;
            newNode.borderWidthSelected = 0;
            newNode.shapeProperties = { borderDashes: false };
        }

        // 手段ノード以外の場合はtitleを追加
        if (node_type !== "step") {
            newNode.title = tooltip;
        }

        defaultThinkingProcess.nodes.add(newNode);

        // 理由がある場合、オレンジ色の理由タグを追加
        if (purpose && purpose.trim() !== '') {
            // ノードが追加された後にBoundingBoxを取得して正確な位置を計算
            setTimeout(() => {
                const nodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
                const reasonTagId = `reason-tag-${node_id}`;
                    const reasonTag = {
                    id: reasonTagId,
                    label: '💡',
                    shape: 'ellipse',
                    size: 20,
                    font: { size: 16, color: 'white' },
                        color: {
                        background: '#FFA500',
                        border: '#D17A00'
                    },
                    x: nodeBoundingBox.left + 8,
                    y: nodeBoundingBox.top + 8,
                    fixed: true,
                    physics: false,
                    group: 'reason-tag',
                    title: '理由: ' + purpose,
                    borderWidth: 0,
                    borderWidthSelected: 0,
                    shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
                };
                defaultThinkingProcess.nodes.add(reasonTag);
            }, 100);
        }

        // 完了予定がある場合、緑色の時間タグを追加（ノードの左下）
        if (estimated_time && estimated_time.trim() !== '') {
            setTimeout(() => {
                const nodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
                const timeTagId = `time-tag-${node_id}`;
                const timeTag = {
                    id: timeTagId,
                    label: '⏳',
                    shape: 'ellipse',
                    size: 20,
                    color: {
                        background: 'lightgreen',
                        border: 'green'
                    },
                    font: { 
                        size: 14,
                        color: 'darkgreen'
                    },
                    x: nodeBoundingBox.left + 8,
                    y: nodeBoundingBox.bottom - 8,
                    fixed: true,
                    physics: false,
                    group: 'time-tag',
                    title: '完了予定: ' + estimated_time,
                    borderWidth: 0,
                    borderWidthSelected: 0,
                    shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
                };
                defaultThinkingProcess.nodes.add(timeTag);
            }, 100);
        }

        // 内省情報がある場合、青色の内省タグを右上に追加
        if (evaluation_good || attribution || application) {
            setTimeout(() => {
                const nodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
                const reflectionTagId = `reflection-tag-${node_id}`;
                const reflectionTitle = `行動評価: ${evaluation_good || "未記入"}\n原因分析: ${attribution || "未記入"}\n学び: ${application || "未記入"}`;
                const reflectionTag = {
                    id: reflectionTagId,
                    label: '💭',
                    shape: 'ellipse',
                    size: 20,
                    color: {
                        background: 'lightblue',
                        border: 'blue'
                    },
                    font: { 
                        size: 18,
                        color: 'darkblue'
                    },
                    x: nodeBoundingBox.right - 8,
                    y: nodeBoundingBox.top + 8,
                    fixed: true,
                    physics: false,
                    group: 'reflection-tag',
                    title: reflectionTitle,
                    borderWidth: 0,
                    borderWidthSelected: 0,
                    shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
                };
                defaultThinkingProcess.nodes.add(reflectionTag);
            }, 100);
        }

        const boundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
        defaultThinkingProcess.latest_selected_node_info.x = node_x;
        defaultThinkingProcess.latest_selected_node_info.y = boundingBox.bottom + 10;

        return defaultThinkingProcess.nodes;
    }


    //ここで一番上のノードを作成
    addVersionNode(node_id, node_l, node_type, appeared_at, node_x, node_y){
        const existingNode = defaultThinkingProcess.nodes.get(node_id);
        if (existingNode) {
            console.log(`Node with ID ${node_id} already exists. Skipping addition.`);
            return; // 重複がある場合は追加せずにリターン
        }
        let node_color = '#bee2f9'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        var y_fixed = true;
        let node_label;
        
        if(node_l == '<select name="change_labels" id="select_labels"><optgroup label="ラベル付与"><option value="node_labels">ラベル選択</option>          <option value="primary_label">主軸</option></optgroup><optgroup label="----L主軸"><option value="pl_1">---L有用性</option><option value="pl_2">---L新規性</option> <option value="pl_3">---L信頼性</option><option value="pl_0">---Lその他</option>                   </optgroup>              <option value="issue_label">課題</option> <optgroup label="----L未検討"> <option value="il_non_1">---L語の妥当性</option><option value="il_non_2">---L証拠の十分性</option><option value="il_non_3">---L論理の整合性</option><option value="il_non_0">---Lその他</option></optgroup><optgroup label="----L再検討"> <option value="il_re_1">---L語の妥当性</option><option value="il_re_2">---L証拠の十分性</option><option value="il_re_3">---L論理の整合性</option><option value="il_re_0">---Lその他</option></optgroup><option value="cl_0">整合性</option></select>'){
            node_label = "【ラベル選択】";
        }else{
            node_label = node_l
        }

        if(node_type == "versionsBro"){
            node_color = '#ffd7c9'; // ノードの背景色
            y_fixed = false;
        }

        const newNode = {
            id: `${node_id}`,
            label: node_label,
            group: node_type,
            color: node_color,
            shape: node_shape,
            font: { color: text_color },
            fixed: {y: y_fixed },
            x: node_x, y: node_y, 
        };
        // バージョンノードにも影を適用
        newNode.shadow = { enabled: true, color: 'rgba(0,0,0,0.15)', size: 1, x: 4, y: 4 };
        // console.log(newNode);
        
        defaultThinkingProcess.nodes.add(newNode);
        return defaultThinkingProcess.nodes;
    }

    addVersionEdge(from_node_id, to_node_id){
        // let node_color = 'orange'; // ノードの背景色
        // let node_shape = 'box';     // ノードの形状
        // let text_color = 'black';   // ノード内文字列の色
        
        // 一意のエッジIDを生成
        const edgeId = this.generateUniqueNumberText();
        
        const newEdge = {
            id: String(edgeId),  // IDを明示的に設定
            from: String(from_node_id),
            to: String(to_node_id),
            group: "versionEdges",
            fixed: true,
        };
        
        console.log("🔧 addVersionEdge: バージョンエッジを追加中", newEdge);
        defaultThinkingProcess.edges.add(newEdge);
        return defaultThinkingProcess.edges;

    }

    addTriggerNode(flag, trigger_id, edge_id, from_node, to_node, activity_id, t_label, t_type, t_time, node_x, node_y){
        let color = '#82ae46'; // ノードの背景色
        let node_shape = 'circularImage';     // ノードの形状
        var DIR_img = "../image/triggers/"; //ノードのアイコンとなる画像のパス
        let image = "thinking.png"; 
        const t_title = document.createElement("div");  // titleのHTML

        if(!activity_id){
            color = '#60bfa3'; // ノードの背景色
        }

        t_title.innerHTML = "<div id='" + trigger_id + "' class='trigger_title' timestamp='" + t_time + "'><b>"+t_type+"</b></br>" + t_label + " </div>";
        if(!node_x){
            node_x = (defaultThinkingProcess.nodes.get(from_node).x + defaultThinkingProcess.nodes.get(to_node).x ) /2; //ノードがversionの間に来るように
        }
        if(!node_y){
            node_y = Math.floor(Math.random()*200)-100;
        }

        //triggerとなった活動ごとにアイコンを変更
        switch(t_type) {
            case "自己内対話": //自己内対話
                break;
            case "議論資料作成": //議論資料作成
                image = "writing.png";
                break;
            case "議論内省": //議論内省
                image = "meeting.png";
                break;
            case "論文読解": //論文読解
                image = "reading.png";
                break;
            case "論文執筆": //論文執筆
                image = "writing-scholar.png";
                break;
            default: // その他
                break;
        }

        // trigger_fromの設定
        if(defaultThinkingProcess.edges.get(edge_id).group == "trigger_from"){
            // エッジの先がtrigger_nodeならその先のversion_nodeに繋ぐ
            //　trigge自身を指す新しいエッジを追加
            const newEdge = {
                from: from_node,
                to: trigger_id,
                arrows: 'dynamic',
                color: color,
                group: "trigger_from",
                smooth: true,
                fixed: true,
            };
            defaultThinkingProcess.edges.add(newEdge);

        }else{
            // 既存のversionEdgeをtrigger自身を指すようにエッジを繋ぎかえ
            const update_edge = defaultThinkingProcess.edges.get(edge_id);
            update_edge.arrows = 'dynamic';
            update_edge.color = color;
            update_edge.to = trigger_id;
            update_edge.group = "trigger_from";
            update_edge.smooth = true;
            defaultThinkingProcess.edges.update(update_edge);
        }

        //　trigger_toの設定
        const newEdge = {
            from: trigger_id,
            to: to_node,
            arrows: 'dynamic',
            color: color,
            group: "trigger_to",
            smooth: true,
            fixed: true,
        };
        defaultThinkingProcess.edges.add(newEdge);

        //triggerとなるノードを追加
        const newNode = {
            id: trigger_id,
            label: t_time,
            title: t_title,
            group: "trigger",
            type: t_type,
            color: color,
            shape: node_shape,
            image: DIR_img + image,
            imagePadding: 7,
            fixed: false,
            x: node_x, y: node_y,
        };
        defaultThinkingProcess.nodes.add(newNode);

        if(flag == "New"){
            defaultRecordThinkingProcess.record_trigger(trigger_id, activity_id, from_node, to_node, t_time, t_type, t_label, node_x, node_y);
        }

        return defaultThinkingProcess.edges, defaultThinkingProcess.nodes;
    }

    addReloadEdge(edge_id, edge_start, edge_end, edge_label) {
        console.log("🔧 addReloadEdge called with:", {
            edge_id: edge_id,
            edge_start: edge_start,
            edge_end: edge_end,
            edge_label: edge_label
        });

        // 重複チェック
        const existingEdge = this.edges.get(edge_id);
        if (existingEdge) {
            console.log(`⚠️ エッジ ${edge_id} は既に存在します。スキップします。`);
            return;
        }

        // ノードの存在チェック
        const fromNode = this.nodes.get(edge_start);
        const toNode = this.nodes.get(edge_end);
        
        if (!fromNode) {
            console.error(`❌ 参照元ノード ${edge_start} が存在しません。エッジ ${edge_id} を追加できません。`);
            return;
        }
        if (!toNode) {
            console.error(`❌ 参照先ノード ${edge_end} が存在しません。エッジ ${edge_id} を追加できません。`);
            return;
        }

        const edgeData = {
            id: String(edge_id), // IDを文字列として明示的に設定
            from: String(edge_start), 
            to: String(edge_end)
        };
        
        // ラベルが存在する場合は追加
        if (edge_label && edge_label.trim() !== '') {
            edgeData.label = edge_label;
            edgeData.font = {
                size: 12,
                color: '#333333',
                background: 'rgba(255, 255, 255, 0.8)',
                strokeWidth: 1,
                strokeColor: '#ffffff'
            };
            // 内部管理オブジェクトにも保存
            this.EdgeLabels[edge_id] = edge_label;
        }
        
        console.log("➕ エッジを追加中:", edgeData);
        try {
            this.edges.add(edgeData);
            console.log(`✅ エッジ ${edge_id} を正常に追加しました`);
        } catch (error) {
            console.error(`❌ エッジ ${edge_id} の追加に失敗:`, error);
            return;
        }
        
        // 追加後のデータを確認
        const addedEdge = this.edges.get(edge_id);
        if (addedEdge) {
            console.log("✅ 追加されたエッジの確認:", addedEdge);
        } else {
            console.error(`❌ エッジ ${edge_id} の追加後確認に失敗`);
        }
    }

    //未完成　ノード追加
    addNewNode() {
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、新しいノードの追加は無効化されています');
            return;
        }
        this.addNode(this.generateUniqueNumberText(), "newNode", "step", this.latest_selected_node_info.x, this.latest_selected_node_info.y);
    }

    //ノードのラベル編集(完了)
    editNode(node_id, node_content) {
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、ノード編集は無効化されています');
            return;
        }
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
            defaultRecordThinkingProcess.update_Node("label", node_id, node_content, "");
        }
    }

    // NOTE: エッジラベルの編集機能は仕様変更により廃止しました。
    //    以前は editEdgeLabel によりエッジラベルを入力・保存していましたが、
    //    現在はエッジラベル編集のUIを表示しません。

    //ダブルクリック時編集(完了)
    doubleclick (params) {
        // デバッグ: doubleclick イベントの発火を確認
        try {
            console.log('doubleclick event params:', params);
        } catch (e) {
            /* ignore */
        }

        // 過去データ表示時は操作を無効化
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、ノード編集が無効化されています');
            return;
        }
        
        // ノードがダブルクリックされた場合
        let clickedNodeId = params.nodes[0];
        // params.nodes が空のときは、pointer の位置からノードを探すフォールバックを行う
        if (clickedNodeId === undefined || (Array.isArray(params.nodes) && params.nodes.length === 0)) {
            try {
                const network = this.ownNetwork;
                let found = null;

                // 1) pointer.canvas をそのまま試す
                try {
                    if (params.pointer && params.pointer.canvas && typeof params.pointer.canvas.x === 'number') {
                        found = network.getNodeAt({ x: params.pointer.canvas.x, y: params.pointer.canvas.y });
                        console.log('doubleclick fallback try pointer.canvas ->', found);
                    }
                } catch (e) {
                    console.warn('doubleclick fallback pointer.canvas error:', e);
                }

                // 2) pointer.DOM があれば DOM->canvas 変換を試す
                if (!found && params.pointer && params.pointer.DOM && typeof params.pointer.DOM.x === 'number') {
                    try {
                        // network.body.container があればそれを使う（vis の内部コンテナ）、無ければ id 'myProcessnetwork' を試す
                        const container = (network && network.body && network.body.container) ? network.body.container : document.getElementById('myProcessnetwork');
                        if (container) {
                            const rect = container.getBoundingClientRect();
                            // DOM 座標をコンテナ基準の canvas/DOM 座標へ変換
                            const cx = params.pointer.DOM.x - rect.left;
                            const cy = params.pointer.DOM.y - rect.top;
                            // ここでは一旦変換後の座標をそのまま getNodeAt に渡す
                            try {
                                found = network.getNodeAt({ x: cx, y: cy });
                                console.log('doubleclick fallback try pointer.DOM->canvas ->', found, 'coords:', {x: cx, y: cy});
                            } catch (e2) {
                                console.warn('doubleclick fallback getNodeAt with DOM->canvas coords failed:', e2);
                            }
                        }
                    } catch (e) {
                        console.warn('doubleclick fallback pointer.DOM conversion error:', e);
                    }
                }

                // 3) それでも見つからない場合は最寄りノード探索（距離閾値で決定）
                if (!found) {
                    try {
                        // 参照するターゲット座標（優先: canvas, 次: DOM）
                        let target = null;
                        if (params.pointer && params.pointer.canvas && typeof params.pointer.canvas.x === 'number') {
                            target = { x: params.pointer.canvas.x, y: params.pointer.canvas.y };
                        } else if (params.pointer && params.pointer.DOM && typeof params.pointer.DOM.x === 'number') {
                            // DOM -> コンテナ基準
                            const container = (network && network.body && network.body.container) ? network.body.container : document.getElementById('myProcessnetwork');
                            if (container) {
                                const rect = container.getBoundingClientRect();
                                target = { x: params.pointer.DOM.x - rect.left, y: params.pointer.DOM.y - rect.top };
                            } else {
                                target = { x: params.pointer.DOM.x, y: params.pointer.DOM.y };
                            }
                        }

                        if (target) {
                            const positions = network.getPositions();
                            let bestId = null;
                            let bestDist = Infinity;
                            for (const id in positions) {
                                if (!positions.hasOwnProperty(id)) continue;
                                const p = positions[id];
                                const dx = p.x - target.x;
                                const dy = p.y - target.y;
                                const d = Math.sqrt(dx * dx + dy * dy);
                                if (d < bestDist) { bestDist = d; bestId = id; }
                            }
                            console.log('doubleclick fallback nearest:', bestId, 'dist:', bestDist);
                            // 閾値はおおよそ 30-40px（必要なら調整）
                            if (bestDist <= 40) {
                                found = bestId;
                            }
                        }
                    } catch (e) {
                        console.warn('doubleclick fallback nearest-node search error:', e);
                    }
                }

                console.log('doubleclick fallback found node at pointer:', found);
                if (found !== undefined && found !== null) {
                    clickedNodeId = found;
                }
            } catch (e) {
                console.warn('doubleclick fallback error:', e);
            }
        }

        if (clickedNodeId !== undefined) {
            const clickedIdStr = String(clickedNodeId);
            // メモタグ（memo-tag-<nodeId>）がダブルクリックされたら、対応するノードのメモ編集UIを開く
            if (clickedIdStr.startsWith('memo-tag-')) {
                const targetNodeId = clickedIdStr.replace('memo-tag-', '');
                try {
                    this.showNodeMemoUI(targetNodeId);
                } catch (e) {
                    console.error('メモタグのダブルクリック処理でエラー:', e);
                }
            // 理由タグ（reason-tag-<nodeId>）がダブルクリックされたら理由編集ダイアログを開く
            } else if (clickedIdStr.startsWith('reason-tag-')) {
                try {
                    const targetNodeId = clickedIdStr.replace('reason-tag-', '');
                    this.selectId = targetNodeId; // show_reason_input は this.selectId を参照する
                    // ダブルクリックから理由ダイアログを開くフローでは sessionStorage にも退避しておく
                    // これにより、ダイアログを開いている間に selectId がクリアされても復元できます
                    try { sessionStorage.setItem('currentSelectId', this.selectId); } catch (e) { /* ignore */ }
                    // 既存の理由をメモリ/ノードタイトルから取得
                    let reasonText = '';
                    const rIdx = this.ReasonConnectNodeId.indexOf(targetNodeId);
                    if (rIdx !== -1 && this.ReasonContent[rIdx]) {
                        reasonText = this.ReasonContent[rIdx];
                    } else {
                        const reasonTagNode = this.nodes.get(clickedNodeId);
                        if (reasonTagNode && reasonTagNode.title) {
                            const m = reasonTagNode.title.split(/[:：]/);
                            reasonText = m.slice(1).join(':').trim();
                        }
                    }
                    this.show_reason_input();
                    // ダイアログの textarea に既存値をセット
                    try { document.getElementById('t_Process_reasontext').value = reasonText || ''; } catch (e) { /* ignore */ }
                } catch (e) {
                    console.error('理由タグダブルクリック処理でエラー:', e);
                }
                return;
            // 完了予定タグ（time-tag-<nodeId>）がダブルクリックされたら完了予定編集ダイアログを開く
            } else if (clickedIdStr.startsWith('time-tag-')) {
                try {
                    const targetNodeId = clickedIdStr.replace('time-tag-', '');
                    this.selectId = targetNodeId; // show_time_input は this.selectId を参照する
                    // 既存の完了予定をメモリ/ノードタイトルから取得
                    let timeText = '';
                    const tIdx = this.TimeConnectNodeId.indexOf(targetNodeId);
                    if (tIdx !== -1 && this.TimeContent[tIdx]) {
                        timeText = this.TimeContent[tIdx];
                    } else {
                        const timeTagNode = this.nodes.get(clickedNodeId);
                        if (timeTagNode && timeTagNode.title) {
                            const m = timeTagNode.title.split(/[:：]/);
                            timeText = m.slice(1).join(':').trim();
                        }
                    }
                    this.show_time_input();
                    // ダイアログの入力に既存値をセット
                    try { document.getElementById('t_Process_timetext').value = timeText || ''; } catch (e) { /* ignore */ }
                } catch (e) {
                    console.error('時間タグダブルクリック処理でエラー:', e);
                }
                return;
            // 内省タグ（reflection-tag-<nodeId>）がダブルクリックされたらログ出力
            } else if (clickedIdStr.startsWith('reflection-tag-')) {
                // reflection-tag-<nodeId> の場合、対応するノードの内省吹き出しを開く
                try {
                    const targetNodeId = clickedIdStr.replace('reflection-tag-', '');
                    this.selectId = targetNodeId; // showFeedbackTooltip は this.selectId を参照する
                    // showFeedbackTooltip 内で既存の内省タグがあれば内容を抽出して textarea に差し込む
                    this.showFeedbackTooltip();
                } catch (e) {
                    console.error('内省タグダブルクリック処理でエラー:', e);
                }
                return;
            } else {
                // 通常のノードダブルクリックはラベル編集
                // ただしステータスが completed のノードは編集不可とする
                const nodeObj = this.nodes.get(clickedNodeId) || {};
                const nodeStatus = (nodeObj.status || '').toString();
                // ノードの色情報を取得（string か {background:...} の可能性がある）
                let nodeColorVal = '';
                try {
                    if (typeof nodeObj.color === 'string') {
                        nodeColorVal = nodeObj.color;
                    } else if (nodeObj.color && typeof nodeObj.color.background === 'string') {
                        nodeColorVal = nodeObj.color.background;
                    }
                } catch (e) {
                    nodeColorVal = '';
                }
                // 追加デバッグ: どのIDが来ているかとステータス／色をログ出力
                try {
                    console.log('doubleclick: clickedNodeId=', clickedNodeId, 'nodeObj=', nodeObj, 'nodeStatus=', nodeStatus, 'nodeColor=', nodeColorVal);
                } catch (e) { /* ignore */ }

                // ガード: ノードの色が 'gray' の場合は編集不可とする
                if (nodeColorVal === 'gray' || nodeStatus === 'completed') {
                    console.log(`ノード ${clickedNodeId} は完了済み（color=${nodeColorVal} / status=${nodeStatus}）のため編集できません`);
                    try {
                        alert('このノードは完了済みのため編集できません');
                    } catch (e) {
                        /* ignore: alert が存在しない環境でも処理継続 */
                    }
                    return;
                }

                // ユーザーに新しいラベルを尋ね、それをノードの中身に設定
                const currentLabel = (nodeObj.label || '').split('\n').join('');
                const newLabel = prompt('新しいラベルを入力してください:', currentLabel);
                // 編集したラベルを反映
                if (newLabel !== null) {
                    this.editNode(clickedNodeId, newLabel);
                }
            }
        }
        
        // エッジがダブルクリックされた場合
        const clickedEdgeId = params.edges[0];
        if (clickedEdgeId !== undefined) {
            // エッジに文字を入力する処理は廃止されています
            console.log('エッジがダブルクリックされました（ラベル編集は無効）:', clickedEdgeId);
            return;
        }
    }

    // ノード削除(完了)
    deleteNode (){
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、ノード削除は無効化されています');
            return;
        }
        const selectNodeId = this.ownNetwork.getSelection().nodes[0];
        if(selectNodeId !== undefined){
            console.log(defaultThinkingProcess.nodes.get(selectNodeId));
            const node_group = defaultThinkingProcess.nodes.get(selectNodeId).group;
            console.log(node_group);
            if(node_group == "trigger"){
                defaultRecordThinkingProcess.delete_trigger_Node(selectNodeId);
            }else{
                defaultRecordThinkingProcess.delete_db_Node(selectNodeId);
            }
            defaultRecordThinkingProcess.delete_db_Edge(null, selectNodeId, "");
            defaultRecordThinkingProcess.delete_db_Edge(null, "", selectNodeId);

            // 関連するエッジのラベル情報をクリア
            const connectedEdges = this.ownNetwork.getConnectedEdges(selectNodeId);
            connectedEdges.forEach(edgeId => {
                if (this.EdgeLabels[edgeId]) {
                    delete this.EdgeLabels[edgeId];
                    console.log(`エッジ ${edgeId} のラベル情報を削除しました`);
                }
            });

            this.edges.remove(this.ownNetwork.getConnectedEdges(selectNodeId));
            this.nodes.remove({id: selectNodeId});
            const ontology_index = this.OntologyConnectNodeId.indexOf(selectNodeId);
            if(ontology_index !== -1){
                this.nodes.remove({ id: this.OntologyNodeId[ontology_index]});
                defaultRecordThinkingProcess.delete_db_Node(this.OntologyNodeId[ontology_index]);
                this.OntologyNodeId.splice(ontology_index, 1);
                this.OntologyConnectNodeId.splice(ontology_index, 1);
            }
            // 理由の関連付けも削除
            const reason_index = this.ReasonConnectNodeId.indexOf(selectNodeId);
            if(reason_index !== -1){
                // 理由ノードも削除
                this.nodes.remove({ id: this.ReasonNodeId[reason_index]});
                defaultRecordThinkingProcess.delete_db_Node(this.ReasonNodeId[reason_index]);
                this.ReasonNodeId.splice(reason_index, 1);
                this.ReasonConnectNodeId.splice(reason_index, 1);
                this.ReasonContent.splice(reason_index, 1); // 理由内容も削除
            }
            // 理由タグも削除（リロード時のタグ）
            const reasonTagId = `reason-tag-${selectNodeId}`;
            const reasonTagNode = this.nodes.get(reasonTagId);
            if (reasonTagNode) {
                this.nodes.remove({ id: reasonTagId });
            }
            
            // 完了予定の関連付けも削除
            const time_index = this.TimeConnectNodeId.indexOf(selectNodeId);
            if(time_index !== -1){
                // 完了予定ノードも削除
                this.nodes.remove({ id: this.TimeNodeId[time_index]});
                defaultRecordThinkingProcess.delete_db_Node(this.TimeNodeId[time_index]);
                this.TimeNodeId.splice(time_index, 1);
                this.TimeConnectNodeId.splice(time_index, 1);
                this.TimeContent.splice(time_index, 1); // 完了予定内容も削除
            }
            // 時間タグも削除（リロード時のタグ）
            const timeTagId = `time-tag-${selectNodeId}`;
            const timeTagNode = this.nodes.get(timeTagId);
            if (timeTagNode) {
                this.nodes.remove({ id: timeTagId });
            }
            
            // 内省タグも削除（完了時に生成されたタグ）
            const reflectionTagId = `reflection-tag-${selectNodeId}`;
            const reflectionTagNode = this.nodes.get(reflectionTagId);
            if (reflectionTagNode) {
                this.nodes.remove({ id: reflectionTagId });
                console.log('内省タグを削除しました:', reflectionTagId);
            }
            
            const connect_net_index = [];
            this.ConnectNetworkNodeId.map((n_id, index) => {
                if(n_id === selectNodeId){
                    connect_net_index.push(index);
                }
            });
            connect_net_index.sort((a, b) => b - a);
            connect_net_index.forEach(index => {
                this.ConnectNetworkNodeId.splice(index, 1);
                this.ConnectMindMapNodeId.splice(index, 1);
            });
            defaultRecordThinkingProcess.delete_connection(selectNodeId);
        }
    }

    // 右クリック時
    onContext(params) {
        // 過去データ表示時は右クリック操作を無効化
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、右クリック操作が無効化されています');
            return;
        }
        
        this.nodeConnectEnabled = false;

        if (params.nodes.length == 1) {
            const NetworkMenu = document.getElementById('t_Process_conmenu');
            this.selectId = params.nodes[0]; // ここで選択されたノードIDを設定
            console.log(`右クリックされたノードID: ${this.selectId}`); // デバッグ用ログ
            
            // セッションストレージにも保存してバックアップとする
            sessionStorage.setItem('currentSelectId', this.selectId);
            
            const pointerX = params.pointer.DOM.x;
            const pointerY = params.pointer.DOM.y;
            const mynetPosition = document.getElementById("myProcessnetwork2").getBoundingClientRect();
            
            // 画面端での位置調整
            const menuWidth = 320;
            const menuHeight = 280;
            let menuX = pointerX + mynetPosition.left + 20;
            let menuY = pointerY + mynetPosition.top + 20;
            
            // 右端チェック
            if (menuX + menuWidth > window.innerWidth) {
                menuX = pointerX + mynetPosition.left - menuWidth - 20;
            }
            
            // 下端チェック
            if (menuY + menuHeight > window.innerHeight) {
                menuY = pointerY + mynetPosition.top - menuHeight - 20;
            }
            
            this.BoxDisplay.x = menuX;
            this.BoxDisplay.y = menuY;
            
            NetworkMenu.style.left = this.BoxDisplay.x + 'px';
            NetworkMenu.style.top = this.BoxDisplay.y + 'px';
            NetworkMenu.style.display = "block";
            
            // アクセシビリティ：最初のメニュー項目にフォーカス
            setTimeout(() => {
                const firstMenuItem = NetworkMenu.querySelector('.context-menu-link');
                if (firstMenuItem) {
                    firstMenuItem.focus();
                }
            }, 10);
            
            // キーボードナビゲーションの設定
            this.setupContextMenuKeyboardNavigation(NetworkMenu);
            
            if(this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
                document.getElementById("process_conmenu3").style.display = "block";
            }
            
            // ESCキーでメニューを閉じる
            const closeMenuOnEsc = (e) => {
                if (e.key === 'Escape') {
                    NetworkMenu.style.display = 'none';
                    document.removeEventListener('keydown', closeMenuOnEsc);
                }
            };
            document.addEventListener('keydown', closeMenuOnEsc);
            
            // メニュー外クリックで閉じる
            const closeMenuOnOutsideClick = (e) => {
                if (!NetworkMenu.contains(e.target)) {
                    NetworkMenu.style.display = 'none';
                    document.removeEventListener('click', closeMenuOnOutsideClick);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', closeMenuOnOutsideClick);
            }, 10);
        }
    }

    // キーボードナビゲーション設定
    setupContextMenuKeyboardNavigation(menu) {
        const menuItems = menu.querySelectorAll('.context-menu-link');
        let currentIndex = 0;
        
        const handleKeyDown = (e) => {
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = (currentIndex + 1) % menuItems.length;
                    menuItems[currentIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
                    menuItems[currentIndex].focus();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    menuItems[currentIndex].click();
                    break;
                case 'Escape':
                    menu.style.display = 'none';
                    break;
            }
        };
        
        menuItems.forEach((item, index) => {
            item.setAttribute('tabindex', '0');
            item.addEventListener('focus', () => {
                currentIndex = index;
            });
            item.addEventListener('keydown', handleKeyDown);
        });
    }

    // キーボードイベントリスナーの設定
    setupKeyboardListeners() {
        // キーボードイベントリスナーを削除する関数
        this.removeKeyboardListener = (e) => {
            // Deleteキーが押された場合
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // 過去データ表示時は操作を無効化
                if (this.isViewingPastData) {
                    console.log('過去データ表示中のため、削除操作が無効化されています');
                    return;
                }

                // テキスト入力中でないことを確認
                const activeElement = document.activeElement;
                if (activeElement && (
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA' || 
                    activeElement.contentEditable === 'true'
                )) {
                    // テキスト入力中の場合は何もしない
                    return;
                }

                // 現在選択されているノードまたはエッジを取得
                const selection = this.ownNetwork.getSelection();
                
                // ノードが選択されている場合はノードを削除
                if (selection.nodes.length > 0) {
                    e.preventDefault();
                    console.log('Deleteキーでノード削除:', selection.nodes[0]);
                    this.deleteNode();
                }
                // エッジが選択されている場合はエッジを削除
                else if (selection.edges.length > 0) {
                    e.preventDefault();
                    console.log('Deleteキーでエッジ削除:', selection.edges[0]);
                    this.deleteEdge();
                }
            }
        };

        // グローバルキーボードイベントリスナーを追加
        document.addEventListener('keydown', this.removeKeyboardListener);
        
        // ネットワークコンテナにフォーカスが当たるようにする
        const networkContainer = document.getElementById('myProcessnetwork');
        if (networkContainer) {
            networkContainer.setAttribute('tabindex', '0');
            networkContainer.style.outline = 'none'; // フォーカス時の枠線を非表示
        }
    }

    // キーボードイベントリスナーの削除
    removeKeyboardListeners() {
        if (this.removeKeyboardListener) {
            document.removeEventListener('keydown', this.removeKeyboardListener);
            this.removeKeyboardListener = null;
        }
    }

    //ラベルの選択（完了）
    show_select (){
        document.getElementById('t_Process_conmenu').style.display = "none";
        
        // selectIdが設定されているかチェック
        if (!this.selectId) {
            // セッションストレージからバックアップを取得
            const backupSelectId = sessionStorage.getItem('currentSelectId');
            if (backupSelectId) {
                this.selectId = backupSelectId;
                console.log('セッションストレージからselectIdを復元:', this.selectId);
            } else {
                console.error('selectIdが設定されていません:', this.selectId);
                alert('ノードが選択されていません。先にノードを右クリックして選択してください。');
                return;
            }
        }
        
        if(this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
            alert('このノードにはすでに概念がつけられているため概念付けできません');
            return;
        }
        const labelselect = document.getElementById("t_Process_labelselect");
        labelselect.style.display = "block";
        labelselect.style.left = this.BoxDisplay.x + "px";
        labelselect.style.top = this.BoxDisplay.y + "px";
        labelselect.style.position = "absolute";
        labelselect.style.zIndex = "1000";
    }

    ContentmenuCancel(){
        const menu = document.getElementById('t_Process_conmenu');
        menu.style.display = "none";
        
        // フェードアウトアニメーションを追加
        menu.style.animation = 'contextMenuFadeOut 0.15s ease-in';
        setTimeout(() => {
            menu.style.animation = '';
        }, 150);
        
        // セッションストレージもクリア
        sessionStorage.removeItem('currentSelectId');
        this.selectId = null;
        console.log('メニューキャンセル: selectIdをクリアしました');
        
        // イベントリスナーを削除
        document.removeEventListener('keydown', this.escKeyListener);
        document.removeEventListener('click', this.outsideClickListener);
    }

    //マインドマップとネットワークつなげる
    connect_network (){
        document.getElementById('t_Process_conmenu').style.display = "none";
        this.nodeConnectEnabled = true;
    }

    // マインドマップのノードがクリックされたときの処理
    connect_mindmap (e) {
        const Jsmind = new jsMind({container:'jsmind_container',
                                editable: false});
        if (!this.nodeConnectEnabled) {
            return;
        }else{
            const mm_nodeid = Jsmind.view.get_binded_nodeid(e.target);
            if(mm_nodeid == null){
                alert('ノードのクリックがうまくできませんでした．もう一度試してみてください');
                return;
            }else{
                if(this.ConnectNetworkNodeId.indexOf(this.selectId) !== -1 && this.ConnectMindMapNodeId.indexOf(mm_nodeid) !== -1){
                    alert('このノードはすでに選択されています');
                    return;
                }
                defaultRecordThinkingProcess.record_connection(this.selectId,mm_nodeid);
                this.ConnectNetworkNodeId.push(this.selectId);
                this.ConnectMindMapNodeId.push(mm_nodeid);
                this.nodeConnectEnabled = false;
            }
        }
    }

    //概念をマップに追加（概念選択なし版）
    addontology (){
        // 両方の選択ダイアログを非表示にする
        const labelselect = document.getElementById("labelselect");
        const tProcessLabelselect = document.getElementById("t_Process_labelselect");
        if (labelselect) labelselect.style.display = "none";
        if (tProcessLabelselect) tProcessLabelselect.style.display = "none";
        
        // 右クリックメニューを非表示にする
        document.getElementById('t_Process_conmenu').style.display = "none";
        
        // selectIdが設定されているかチェック
        if (!this.selectId) {
            console.error('selectIdが設定されていません:', this.selectId);
            //alert('ノードが選択されていません');
            return;
        }
        
        // すでに概念がつけられているかチェック
        if(this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
            //alert('このノードにはすでに概念がつけられているため概念付けできません');
            return;
        }
        
        // ノードが存在するかチェック
        const selectedNode = this.nodes.get(this.selectId);
        if (!selectedNode) {
            console.error('選択されたノードが見つかりません:', this.selectId);
            //alert('選択されたノードが見つかりません');
            return;
        }
        
        console.log('選択されたノード:', selectedNode);
        
        const nodeBoundingBox = this.ownNetwork.getBoundingBox(this.selectId);
        if (!nodeBoundingBox) {
            console.error('ノードの位置情報を取得できませんでした:', this.selectId);
            //lert('ノードの位置情報を取得できませんでした');
            return;
        }
        
        console.log('ノードの位置情報:', nodeBoundingBox);
        
        const TopicTagId = this.generateUniqueNumberText();
        
        // 概念選択機能
        // どちらの選択リストが使用されているかを判定
        let selectionlist = document.getElementById('selectionlist');
        let tProcessSelectionlist = document.getElementById('t_Process_selectionlist');
        let selectedValue = '';
        
        if (selectionlist && selectionlist.value) {
            selectedValue = selectionlist.value;
        } else if (tProcessSelectionlist && tProcessSelectionlist.value) {
            selectedValue = tProcessSelectionlist.value;
        }
        
        if (!selectedValue) {
            alert('概念を選択してください');
            return;
        }
        
        this.addNode(TopicTagId, selectedValue, "topic-tag", nodeBoundingBox.left, nodeBoundingBox.top);
        this.OntologyConnectNodeId.push(this.selectId);
        this.OntologyNodeId.push('topic-tag_'+TopicTagId);
        defaultRecordThinkingProcess.record_ontology(this.selectId, 'topic-tag_'+TopicTagId);
        
        // 選択をリセット
        if (selectionlist && selectionlist.options.length > 2) {
            selectionlist.options[2].selected = true;
        }
        if (tProcessSelectionlist && tProcessSelectionlist.options.length > 2) {
            tProcessSelectionlist.options[2].selected = true;
        }
    }

    //理由を記述する機能
    show_reason_input (){
        console.log('show_reason_input関数が呼ばれました');
        document.getElementById('t_Process_conmenu').style.display = "none";
        
        // selectIdが設定されているかチェック
        if (!this.selectId) {
            // セッションストレージからバックアップを取得
            const backupSelectId = sessionStorage.getItem('currentSelectId');
            if (backupSelectId) {
                this.selectId = backupSelectId;
                console.log('セッションストレージからselectIdを復元:', this.selectId);
            } else {
                console.error('selectIdが設定されていません:', this.selectId);
                alert('ノードが選択されていません。先にノードを右クリックして選択してください。');
                return;
            }
        }
        
        console.log('BoxDisplay座標:', this.BoxDisplay);
        
        const reasonselect = document.getElementById("t_Process_reasonselect");
        console.log('理由入力ダイアログ要素:', reasonselect);
        if (!reasonselect) {
            alert('理由入力ダイアログが見つかりません');
            return;
        }
        
        // テキストエリアをクリア
        const reasontext = document.getElementById("t_Process_reasontext");
        console.log('テキストエリア要素:', reasontext);
        if (reasontext) {
            reasontext.value = "";
        }
        
        console.log('ダイアログを表示します - 座標:', this.BoxDisplay.x, this.BoxDisplay.y);
        
        // 画面の中央に表示するように変更
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const dialogWidth = 300;
        const dialogHeight = 200;
        
        const centerX = (windowWidth - dialogWidth) / 2;
        const centerY = (windowHeight - dialogHeight) / 2;
        
        reasonselect.style.display = "block";
        reasonselect.style.left = centerX + "px";
        reasonselect.style.top = centerY + "px";
        reasonselect.style.position = "fixed"; // absoluteからfixedに変更
        reasonselect.style.zIndex = "9999"; // より高いz-indexに設定
        reasonselect.style.backgroundColor = "white";
        reasonselect.style.border = "3px solid #FFA500"; // 理由タグと同じオレンジで統一（少し薄め）
        reasonselect.style.boxShadow = "0 6px 18px rgba(255,165,0,0.08)"; // オレンジ寄りの柔らかい影（色を合わせる）
        reasonselect.style.borderRadius = "6px";
        
        console.log('中央表示座標:', centerX, centerY);
        
        console.log('ダイアログのスタイル設定完了:', {
            display: reasonselect.style.display,
            left: reasonselect.style.left,
            top: reasonselect.style.top,
            position: reasonselect.style.position,
            zIndex: reasonselect.style.zIndex
        });
    }

    //理由を追加する
    add_reason (){
        const reasonselect = document.getElementById("t_Process_reasonselect");
        if (reasonselect) reasonselect.style.display = "none";
        
        // selectIdが設定されているかチェック
        if (!this.selectId) {
            // セッションストレージからバックアップを取得して復元を試みる
            const backupSelectId = sessionStorage.getItem('currentSelectId');
            if (backupSelectId) {
                this.selectId = backupSelectId;
                console.log('add_reason: セッションストレージからselectIdを復元:', this.selectId);
            } else {
                console.error('selectIdが設定されていません:', this.selectId);
                // alert('ノードが選択されていません');
                return;
            }
        }
        
        // すでに理由が記述されているかチェック
        if(this.ReasonConnectNodeId.indexOf(this.selectId) !== -1){
            // alert('このノードにはすでに理由が記述されているため記述できません');
            return;
        }
        
        // 理由テキストを取得
        const reasonText = document.getElementById("t_Process_reasontext").value.trim();
        if (!reasonText) {
            alert('理由を入力してください');
            return;
        }
        
        // ノードが存在するかチェック
        const selectedNode = this.nodes.get(this.selectId);
        if (!selectedNode) {
            console.error('選択されたノードが見つかりません:', this.selectId);
            // alert('選択されたノードが見つかりません');
            return;
        }
        
        console.log('選択されたノード:', selectedNode);
        
        // ノードの位置情報を取得
        const nodeBoundingBox = this.ownNetwork.getBoundingBox(this.selectId);
        if (!nodeBoundingBox) {
            console.error('ノードの位置情報を取得できませんでした:', this.selectId);
            // alert('ノードの位置情報を取得できませんでした');
            return;
        }
        
        const ReasonTagId = this.generateUniqueNumberText();
        
        // 理由タグノードを作成（左上に配置）
        const reasonTag = {
            id: `reason-tag-${this.selectId}`,
            label: '💡',
            shape: 'ellipse',
            size: 20,
            font: { size: 16, color: 'white' },
            color: {
                background: '#FFA500',
                border: '#D17A00'
            },
            x: nodeBoundingBox.left + 8,
            y: nodeBoundingBox.top + 8,
            fixed: true,
            physics: false,
            group: 'reason-tag',
            title: '理由: ' + reasonText,
            borderWidth: 0,
            borderWidthSelected: 0,
            shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
        };
        
        // 理由タグをネットワークに追加
        this.nodes.add(reasonTag);
        
        // 理由の関連付けを記録
        this.ReasonConnectNodeId.push(this.selectId);
        this.ReasonNodeId.push('reason-tag_'+ReasonTagId);
        this.ReasonContent.push(reasonText); // 理由内容をメモリに保存
        
        // 理由ノードの記録（DBに保存）
        defaultRecordThinkingProcess.record_reason(this.selectId, 'reason-tag_'+ReasonTagId, reasonText);
        
        console.log('理由を記録しました:', reasonText);
        console.log('関連付けノードID:', this.selectId);
        console.log('理由ID:', 'reason-tag_'+ReasonTagId);
        
        // 処理完了後にセッションストレージをクリア
        sessionStorage.removeItem('currentSelectId');
        
        // 理由入力ダイアログを閉じる
        document.getElementById("t_Process_reasonselect").style.display = "none";
    }

    //理由入力をキャンセル
    cancel_reason_input (){
        document.getElementById("t_Process_reasonselect").style.display = "none";
    }

    //完了予定を記述する機能
    show_time_input (){
        document.getElementById('t_Process_conmenu').style.display = "none";
        
        // selectIdが設定されているかチェック
        if (!this.selectId) {
            // セッションストレージからバックアップを取得
            const backupSelectId = sessionStorage.getItem('currentSelectId');
            if (backupSelectId) {
                this.selectId = backupSelectId;
                console.log('セッションストレージからselectIdを復元:', this.selectId);
            } else {
                console.error('selectIdが設定されていません:', this.selectId);
                alert('ノードが選択されていません。先にノードを右クリックして選択してください。');
                return;
            }
        }
        
        const timeselect = document.getElementById("t_Process_timeselect");
        if (!timeselect) {
            // alert('完了予定入力ダイアログが見つかりません');
            return;
        }
        
        // 選択をリセット
        document.getElementById("t_Process_timetext").value = "";
        
        // 画面の中央に表示
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const dialogWidth = 300;
        const dialogHeight = 200;
        
        const centerX = (windowWidth - dialogWidth) / 2;
        const centerY = (windowHeight - dialogHeight) / 2;
        
        timeselect.style.display = "block";
        timeselect.style.left = centerX + "px";
        timeselect.style.top = centerY + "px";
        timeselect.style.position = "fixed";
        timeselect.style.zIndex = "9999";
        timeselect.style.backgroundColor = "white";
        // 時間タグと統一感を出すため緑系のボーダーとやわらかい緑の影を付与
        timeselect.style.border = "3px solid #2e8b57";
        timeselect.style.boxShadow = "0 6px 18px rgba(46,139,87,0.08)";
        timeselect.style.borderRadius = "6px";
    }

    //完了予定を追加する
    add_time (){
        const timeselect = document.getElementById("t_Process_timeselect");
        if (timeselect) timeselect.style.display = "none";
        
        // selectIdが設定されているかチェック
        if (!this.selectId) {
            console.error('selectIdが設定されていません:', this.selectId);
            return;
        }
        
        // すでに完了予定が記述されているかチェック
        if(this.TimeConnectNodeId.indexOf(this.selectId) !== -1){
            // alert('このノードにはすでに完了予定が記述されているため記述できません');
            return;
        }
        
        // 完了予定を取得
        const timeText = document.getElementById("t_Process_timetext").value.trim();
        if (!timeText) {
            // alert('完了予定を選択してください');
            return;
        }
        
        // ノードが存在するかチェック
        const selectedNode = this.nodes.get(this.selectId);
        if (!selectedNode) {
            console.error('選択されたノードが見つかりません:', this.selectId);
            // alert('選択されたノードが見つかりません');
            return;
        }
        
        const TimeTagId = this.generateUniqueNumberText();
        
        // 完了予定タグノードを作成（左下に配置）
        const nodeBoundingBox = this.ownNetwork.getBoundingBox(this.selectId);
        const timeTag = {
            id: `time-tag-${this.selectId}`,
            label: '⏳',
            shape: 'ellipse',
            size: 20,
            color: {
                background: 'lightgreen',
                border: 'green'
            },
            font: { 
                size: 14,
                color: 'darkgreen'
            },
            x: nodeBoundingBox.left + 8,
            y: nodeBoundingBox.bottom - 8,
            fixed: true,
            physics: false,
            group: 'time-tag',
            title: '完了予定: ' + timeText,
            borderWidth: 0,
            borderWidthSelected: 0,
            shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
        };
        
        // 完了予定タグをネットワークに追加
        this.nodes.add(timeTag);
        
        // 完了予定の関連付けを記録
        this.TimeConnectNodeId.push(this.selectId);
        this.TimeNodeId.push('time-tag_'+TimeTagId);
        this.TimeContent.push(timeText); // 完了予定内容をメモリに保存
        
        // 完了予定ノードの記録（DBに保存）
        defaultRecordThinkingProcess.record_time(this.selectId, 'time-tag_'+TimeTagId, timeText);
        
        console.log('完了予定を記録しました:', timeText);
        console.log('関連付けノードID:', this.selectId);
        console.log('完了予定ID:', 'time-tag_'+TimeTagId);
        
        // 処理完了後にセッションストレージをクリア
        sessionStorage.removeItem('currentSelectId');
        
        // 完了予定入力ダイアログを閉じる
        document.getElementById("t_Process_timeselect").style.display = "none";
    }

    //完了予定入力をキャンセル
    cancel_time_input (){
        document.getElementById("t_Process_timeselect").style.display = "none";
    }

    Recruit_Idea (){
        document.getElementById('t_Process_conmenu').style.display = "none";
        
        // selectIdが設定されているかチェック
        if (!this.selectId) {
            alert('ノードが選択されていません');
            return;
        }
        
        if(this.RecruitNodeId.indexOf(this.selectId) !== -1){
            alert('このノードにはすでに採用不採用がつけられています');
            return;
        }
        const recruitselect = document.getElementById("t_Process_recruitselect");
        if (!recruitselect) {
            alert('採用/棄却選択ダイアログが見つかりません');
            return;
        }
        recruitselect.style.display = "block";
        recruitselect.style.left = this.BoxDisplay.x + "px";
        recruitselect.style.top = this.BoxDisplay.y + "px";
    }

    Selected_Recruit_Idea (){
        const FeedBackReflectionText = [];
        const FeedBackReflection = [];
        
        // 両方のダイアログを非表示にする
        const recruitselect = document.getElementById("recruitselect");
        const tProcessRecruitselect = document.getElementById("t_Process_recruitselect");
        if (recruitselect) recruitselect.style.display = "none";
        if (tProcessRecruitselect) tProcessRecruitselect.style.display = "none";
        
        // どちらの選択リストが使用されているかを判定
        let selectionlist = document.getElementById('recruitselectionlist');
        let tProcessSelectionlist = document.getElementById('t_Process_recruitselectionlist');
        let selectedValue = '';
        
        if (selectionlist && selectionlist.value) {
            selectedValue = selectionlist.value;
        } else if (tProcessSelectionlist && tProcessSelectionlist.value) {
            selectedValue = tProcessSelectionlist.value;
        }
        
        if (!selectedValue) {
            alert('採用/棄却を選択してください');
            return;
        }
        
        const Ontology_Node_Id = this.OntologyNodeId[this.OntologyConnectNodeId.indexOf(this.selectId)];
        this.RecruitNodeId.push(this.selectId);
        this.Feedback.push(this.selectId);
        this.Recruit.push(selectedValue);
        if (selectedValue === "採用") {
            this.nodes.update({
                id : Ontology_Node_Id,
                borderWidth: 5,
                color: {
                    border: "green",
                },
            });
        }else if(selectedValue === "棄却"){
            this.nodes.update({
                id : Ontology_Node_Id,
                borderWidth: 5,
                color: {
                    border: "red",
                },
            });
        }
        const node_info = this.nodes.get(this.selectId);
        document.getElementById("accordion_discussion").innerHTML += "<div id='"+this.selectId+"' class='accordion-item'><div class='accordion-header' style='font-size:10px'>なぜ「"+node_info.label+"」は"+selectedValue+"されたのですか？</div><div class='accordion-content'><textarea id='text"+ this.selectId +"' class='accordion-input'></textarea></div></div>";
        const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
        accordionHeaders.forEach(header => {
          header.addEventListener('click', function () {
            const accordionItem = this.parentElement;
            accordionItem.classList.toggle('active');
          });
        });
        for(var i=0; i<this.RecruitNodeId.length-1; i++){
            document.getElementById("text"+this.RecruitNodeId[i]).innerHTML = FeedBackReflection[FeedBackReflectionText.indexOf("text"+this.RecruitNodeId[i])];
        }
        defaultRecordThinkingProcess.record_recruit(this.selectId, Ontology_Node_Id, selectedValue);
    }

    //手段開始ボタン
    step_start() {
        const menu = document.getElementById('t_Process_conmenu');
        if (menu) menu.style.display = "none";


        if (!this.selectId) {
            // セッションストレージからバックアップを取得
            const backupSelectId = sessionStorage.getItem('currentSelectId');
            if (backupSelectId) {
                this.selectId = backupSelectId;
                console.log('セッションストレージからselectIdを復元:', this.selectId);
            } else {
                console.error("選択されたノードIDが設定されていません。");
                alert('ノードが選択されていません。先にノードを右クリックして選択してください。');
                return;
            }
        }

        console.log(`ノード ${this.selectId} の作業開始だよ！！`);
        try {
            defaultRecordThinkingProcess.update_Node("status", this.selectId, "inProgress", 5);
        } catch (e) {
            console.error('update_Node エラー（無視して続行）:', e);
        }

        // const fromNodeId = globalParams.nodes[0] || globalParams.nodes;
        // const fromNode = this.nodes.get(fromNodeId);
        // console.log("ここ確認する！！！！！！！", fromNode);

        this.nodes.update({
            id: this.selectId,
            color: 'orange',
            status: 'inProgress',
            title: "作業中",
            size: 50,
            physics: { enabled: false },
            borderWidth: 3,
            borderWidthSelected: 5,
            shapeProperties: {
                borderDashes: [10, 5]
            }
        });

        const updatedNode = this.nodes.get(this.selectId);
        console.log('更新後のノード:', updatedNode);
        // feedback_area の自動表示は不要なため無効化（ユーザー要望による）
        // this.showNodeMemoUI(this.selectId);
    }


    // 手段中断ボタン
    step_paused() {
        const menu = document.getElementById('t_Process_conmenu');
        if (menu) menu.style.display = "none";

        console.log(`step_paused() を呼び出しました。選択中のノードID: ${this.selectId}`);
        if (!this.selectId) {
            // セッションストレージからバックアップを取得
            const backupSelectId = sessionStorage.getItem('currentSelectId');
            if (backupSelectId) {
                this.selectId = backupSelectId;
                console.log('セッションストレージからselectIdを復元:', this.selectId);
            } else {
                console.error("選択されたノードIDが設定されていません。");
                alert('ノードが選択されていません。先にノードを右クリックして選択してください。');
                return;
            }
        }

        console.log(`ノード ${this.selectId} の作業中断だよ！！`);
        // ステータスを更新
        defaultRecordThinkingProcess.update_Node("status", this.selectId, "paused", 6);

        // ノードの見た目を更新
        this.nodes.update({
            id: this.selectId,
            status: 'paused',
            color: 'LightCoral',
            title: "作業中断",
            size: 50,
            physics: { enabled: false },
            borderWidth: 3,
            borderWidthSelected: 5,
            shapeProperties: {
                borderDashes: [5, 5]
            }
        });

        const updatedNode = this.nodes.get(this.selectId);
        console.log('更新後のノード（中断）:', updatedNode);

        // フィードバック吹き出しを表示するならここで
        // this.showFeedbackTooltip();
    }


    // 手段終了ボタン
    step_end() {
        const menu = document.getElementById('t_Process_conmenu');
        if (menu) menu.style.display = "none";
    
        console.log(`step_end() を呼び出しました。選択中のノードID: ${this.selectId}`);
        if (!this.selectId) {
            // セッションストレージからバックアップを取得
            const backupSelectId = sessionStorage.getItem('currentSelectId');
            if (backupSelectId) {
                this.selectId = backupSelectId;
                console.log('セッションストレージからselectIdを復元:', this.selectId);
            } else {
                console.error("選択されたノードIDが設定されていません。");
                alert('ノードが選択されていません。先にノードを右クリックして選択してください。');
                return;
            }
        }
    
        console.log(`ノード ${this.selectId} の作業完了だよ！！`);
        // ステータスを completed に更新
        defaultRecordThinkingProcess.update_Node("status", this.selectId, "completed", 7);
    
        // ノードの見た目を更新
        this.nodes.update({
            id: this.selectId,
            status: 'completed',
            color: 'gray',
            title: "作業完了",
            size: 50,
            physics: { enabled: false },
            borderWidth: 3,
            borderWidthSelected: 5,
            shapeProperties: {
                borderDashes: false
            }
        });
    
        const updatedNode = this.nodes.get(this.selectId);
        console.log('更新後のノード（完了）:', updatedNode);
    
        // フィードバックの吹き出しを表示
        this.showFeedbackTooltip();
    }
    
    showFeedbackTooltip() {
        const tooltip = document.getElementById("feedbackTooltip");
        if (!tooltip) {
            console.error("フィードバック用ツールチップの要素が見つかりませんでした。");
            return;
        }
    
        // ノードの位置を取得
        const positions = this.ownNetwork.getPositions(this.selectId);
        if (!positions || !positions[this.selectId]) {
            console.error("選択されたノードの位置情報が取得できませんでした。");
            return;
        }
        const nodePosition = positions[this.selectId];
        const canvasPosition = this.ownNetwork.canvasToDOM({
            x: nodePosition.x,
            y: nodePosition.y
        });
    
        // 吹き出しの内容を設定
        tooltip.style.left = `${canvasPosition.x}px`;
        tooltip.style.top = `${canvasPosition.y + 20}px`; // ノードの下に表示
        // 常に最前面に表示されるよう position と z-index を明示的に設定
        tooltip.style.position = "fixed";
        tooltip.style.zIndex = "2147483647"; // 最大に近い値で最前面に
        // 横長にして入力欄がゆったり広がるように調整
        tooltip.style.width = "700px";
        tooltip.style.minWidth = "500px";
        tooltip.innerHTML = `
        <div style="border: 2px solid #888; border-radius: 8px; background: white; box-shadow: 2px 2px 8px rgba(0,0,0,0.3);">
    <div id="feedbackTooltipHeader" style="cursor: move; background: #ccc; padding: 5px; border-bottom: 1px solid #888;">
        <strong>振り返り</strong>
    </div>
    <div style="padding: 10px;">
        <form id="formFeedbackInput">
            <div style="margin-bottom:8px;"><strong>評価</strong></div>
            <div style="display:flex; gap:12px;">
                <div style="flex:1;">
                    <label for="successPoints">この活動でうまくいった点はありますか？</label>
                    <textarea id="successPoints" name="successPoints" rows="6" placeholder="例：文献レビューは網羅的だった。" style="width: 100%; height:120px; box-sizing: border-box;"></textarea>
                </div>
                <div style="flex:1;">
                    <label for="failurePoints">この活動でうまくいかなかった点はありますか？</label>
                    <textarea id="failurePoints" name="failurePoints" rows="6" placeholder="例：想定より時間がかかった。入手困難な資料があった。" style="width: 100%; height:120px; box-sizing: border-box;"></textarea>
                </div>
            </div>

            <div style="margin-top:10px;">
                <label for="completionReason">原因帰属：そのような結果になった理由は何だと思いますか？</label>
                <textarea id="completionReason" name="completionReason" rows="3" placeholder="例：検索戦略が不十分だったため時間を要した。特定のキーワードを用いたことで重要な論文を見つけられた。" style="width: 100%;"></textarea>
            </div>

            <div style="margin-top:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <label for="challengesAndLearnings" style="flex:1;">教訓：今後の活動ではどのようなことを意識すればよいと思いますか？その教訓は次にどのような時に活かせそうですか？</label>
                </div>
                <textarea id="challengesAndLearnings" name="challengesAndLearnings" rows="3" placeholder="例：次回は事前に検索プランを作成し、必要なアクセス権を確認する。" style="width: 100%; margin-top:6px;"></textarea>

                <div id="additionalLessonsContainer" style="margin-top:8px;">
                    <!-- 追加の教訓テキストエリアはここに動的に追加されます -->
                </div>
                <div style="margin-top:6px;">
                    <button type="button" id="btnAddLessonInfo" style="background:#fff;border:1px dashed #999;padding:6px 10px;border-radius:6px;color:#333;cursor:pointer;font-size:0.9em;">複数の教訓を追加できます（＋ボタンで追加）。</button>
                </div>
            </div>

            <div style="text-align: right; margin-top:8px;">
                <button type="button" id="btnCancelFeedback" style="margin-right:8px;">キャンセル</button>
                <button type="button" id="btnSaveFeedback">保存</button>
            </div>
        </form>
    </div>
</div>

    `;
    
        tooltip.style.display = "block";
    
        // 保存ボタンのイベントリスナーを設定
        this.setupTooltipSaveButton(tooltip);
        this.setupTooltipDrag(tooltip);
            // 追加教訓のプラスボタンを動作させる（複数追加可能にする）
        try {
            const infoBtn = document.getElementById('btnAddLessonInfo');
            const container = document.getElementById('additionalLessonsContainer');
            const makeLessonField = (text) => {
                const wrap = document.createElement('div');
                wrap.className = 'additional-lesson-wrap';
                wrap.style.marginTop = '8px';
                const label = document.createElement('label');
                label.textContent = '追加の教訓';
                label.style.display = 'block';
                const ta = document.createElement('textarea');
                ta.className = 'additional-lesson';
                ta.name = 'additionalLesson[]';
                ta.rows = 3;
                ta.placeholder = '追記：別の教訓や詳細をここに書いてください。';
                ta.style.width = '100%';
                if (text) ta.value = text;
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.textContent = '削除';
                removeBtn.style.marginTop = '6px';
                removeBtn.style.marginLeft = '6px';
                removeBtn.addEventListener('click', () => {
                    try {
                        if (!confirm('本当に削除しますか？')) return;
                        wrap.remove();
                    } catch (e) { console.warn('remove unsaved lesson handler', e); }
                });
                wrap.appendChild(label);
                wrap.appendChild(ta);
                wrap.appendChild(removeBtn);
                return wrap;
            };

            if (infoBtn && container) {
                infoBtn.addEventListener('click', (ev) => {
                    try {
                        const newField = makeLessonField('');
                        container.appendChild(newField);
                        const ta = newField.querySelector('textarea');
                        if (ta) ta.focus();
                    } catch (e) { console.warn('btnAddLessonInfo handler error', e); }
                });
            }
        } catch (e) { /* ignore */ }
        // 既存の内省タグがあれば、そのタイトルから値を抽出して textarea に流し込む
        try {
            const reflectionTagNode = this.nodes.get(`reflection-tag-${this.selectId}`);
            if (reflectionTagNode && reflectionTagNode.title) {
                const titleText = reflectionTagNode.title || '';
                // 複数のフォーマットに対応して抽出
                let successPoints = '';
                let failurePoints = '';
                let completionReason = '';
                let challengesAndLearnings = '';
                try {
                    const lines = titleText.split(/\n|\r\n/).map(s => s.trim());
                    for (const line of lines) {
                        if (/(うまくいった点|行動意図|行動評価|評価)[:：]?/.test(line)) {
                            const m = line.split(/[:：]/);
                            successPoints = (m.slice(1).join(':') || '').trim();
                        } else if (/(うまくいかなかった点|うまくいかなかった|失敗|問題)[:：]?/.test(line)) {
                            const m = line.split(/[:：]/);
                            failurePoints = (m.slice(1).join(':') || '').trim();
                        } else if (/原因分析|完了基準|原因[:：]/.test(line)) {
                            const m = line.split(/[:：]/);
                            completionReason = (m.slice(1).join(':') || '').trim();
                        } else if (/学び|学習|学んだ/.test(line)) {
                            const m = line.split(/[:：]/);
                            challengesAndLearnings = (m.slice(1).join(':') || '').trim();
                        }
                    }
                } catch (e) {
                    console.warn('reflection title parse error', e);
                }
                // textarea 要素に値をセット
                try {
                    const sEl = document.getElementById('successPoints');
                    const fEl = document.getElementById('failurePoints');
                    const cEl = document.getElementById('completionReason');
                    const lEl = document.getElementById('challengesAndLearnings');
                    if (sEl) sEl.value = successPoints || '';
                    if (fEl) fEl.value = failurePoints || '';
                    if (cEl) cEl.value = completionReason || '';
                    if (lEl) {
                        // 初期値としてタイトルからの抽出を入れる
                        lEl.value = challengesAndLearnings || '';
                        // DB の `object_lesson-learneds` に教訓があれば、それぞれのフィールドとして表示する
                        try {
                            const container = document.getElementById('additionalLessonsContainer');
                            $.ajax({
                                url: 'php/get_lessons.php',
                                type: 'GET',
                                dataType: 'json',
                                data: { object_node_id: this.selectId },
                                success: function(res) {
                                    try {
                                        // If server returned evaluation_bad, prefer it for the failure textarea
                                        if (res && res.success && typeof res.evaluation_bad !== 'undefined' && res.evaluation_bad !== null) {
                                            try { if (fEl) fEl.value = res.evaluation_bad || ''; } catch(e) {}
                                        }
                                        if (res && res.success && Array.isArray(res.items) && res.items.length) {
                                            // 最初の教訓はメインの textarea に入れ、残りは追加フィールドとして作成
                                            var items = res.items;
                                            if (items.length > 0) {
                                                lEl.value = items[0].lesson_learned || items[0].application || '';
                                            }
                                            if (container) {
                                                // 既存の追加フィールドをクリア
                                                container.innerHTML = '';
                                                for (var i = 1; i < items.length; i++) {
                                                    try {
                                                        var text = items[i].lesson_learned || items[i].application || '';
                                                        var wrap = document.createElement('div');
                                                        wrap.className = 'additional-lesson-wrap';
                                                        wrap.style.marginTop = '8px';
                                                        var label = document.createElement('label');
                                                        label.textContent = '追加の教訓';
                                                        label.style.display = 'block';
                                                        var ta = document.createElement('textarea');
                                                        ta.className = 'additional-lesson';
                                                        ta.name = 'additionalLesson[]';
                                                        ta.rows = 3;
                                                        ta.placeholder = '追記：別の教訓や詳細をここに書いてください。';
                                                        ta.style.width = '100%';
                                                        ta.value = text;
                                                        var removeBtn = document.createElement('button');
                                                        removeBtn.type = 'button';
                                                        removeBtn.textContent = '削除';
                                                        removeBtn.style.marginTop = '6px';
                                                        removeBtn.style.marginLeft = '6px';
                                                        // mark this wrap with the DB lesson id so deletion can call the server
                                                        if (items[i].object_le_id) {
                                                            wrap.dataset.objectLeId = items[i].object_le_id;
                                                        }
                                                        (function(r, w){
                                                            r.addEventListener('click', function(){
                                                                try {
                                                                    if (!confirm('本当に削除しますか？')) return;
                                                                    var leId = w.dataset.objectLeId;
                                                                    if (leId) {
                                                                        r.disabled = true;
                                                                        $.ajax({
                                                                            url: 'php/delete_lesson.php',
                                                                            type: 'POST',
                                                                            dataType: 'json',
                                                                            data: { object_le_id: leId },
                                                                            success: function(res) {
                                                                                try {
                                                                                    if (res && res.success) {
                                                                                        w.remove();
                                                                                    } else {
                                                                                        alert('教訓の削除に失敗しました');
                                                                                        r.disabled = false;
                                                                                    }
                                                                                } catch(e) { console.warn('delete lesson success handler', e); r.disabled = false; }
                                                                            },
                                                                            error: function() { alert('教訓の削除に失敗しました'); r.disabled = false; }
                                                                        });
                                                                    } else {
                                                                        // not persisted yet, just remove from DOM
                                                                        w.remove();
                                                                    }
                                                                } catch(e) { console.warn('remove lesson handler', e); }
                                                            });
                                                        })(removeBtn, wrap);
                                                        wrap.appendChild(label);
                                                        wrap.appendChild(ta);
                                                        wrap.appendChild(removeBtn);
                                                        container.appendChild(wrap);
                                                    } catch(e) { console.warn('failed to create lesson field', e); }
                                                }
                                            }
                                        }
                                    } catch(e) { console.warn('lessons success handler error', e); }
                                },
                                error: function() { /* ignore */ }
                            });
                        } catch (e) { console.warn('failed to fetch lessons', e); }
                    }
                } catch (e) {
                    console.warn('failed to set textarea values for feedbackTooltip', e);
                }
            }
        } catch (e) {
            console.warn('error while pre-filling feedbackTooltip from reflection-tag', e);
        }
    }
    
    setupTooltipSaveButton(tooltip) {
        const saveButton = document.getElementById("btnSaveFeedback");
        const cancelButton = document.getElementById("btnCancelFeedback");
        if (cancelButton) {
            cancelButton.addEventListener("click", () => {
                try { tooltip.style.display = "none"; } catch (e) { console.warn('failed to close tooltip on cancel', e); }
            });
        }
        saveButton.addEventListener("click", () => {
            const successPoints = (document.getElementById("successPoints") || {value:''}).value.trim();
            const failurePoints = (document.getElementById("failurePoints") || {value:''}).value.trim();
            const completionReason = (document.getElementById("completionReason") || {value:''}).value.trim();
            let challengesAndLearnings = (document.getElementById("challengesAndLearnings") || {value:''}).value.trim();
            // 追加の教訓がある場合はすべて結合して送る（複数対応）
            try {
                const nodes = document.querySelectorAll('.additional-lesson');
                if (nodes && nodes.length) {
                    const extras = Array.from(nodes).map(n => (n.value || '').trim()).filter(Boolean);
                    if (extras.length) {
                        const combinedExtras = extras.join('\n\n');
                        if (challengesAndLearnings) challengesAndLearnings = challengesAndLearnings + '\n\n' + combinedExtras;
                        else challengesAndLearnings = combinedExtras;
                    }
                }
            } catch (e) { /* ignore */ }

            // 互換性のため、従来の evaluation_good には成功・失敗を結合して送る
            const combinedActionReason = [successPoints, failurePoints].filter(Boolean).join('\n');

            // サーバーにデータを送信（新しいフィールドも追加）
            $.ajax({
                url: "php/object_maneger.php",
                type: "POST",
                data: {
                    evaluation_good: combinedActionReason,
                    success_points: successPoints,
                    failure_points: failurePoints,
                    attribution: completionReason,
                    application: challengesAndLearnings,
                    object_node_id: this.selectId,
                    purpose: 'record',
                    record_thing: 'reflection'
                },
                success: (response) => {
                    console.log("サーバーの応答:", response);

                    // ノードの title を更新（入力内容を簡略化して表示）
                    const title = `
                        うまくいった点: ${successPoints || "未記入"}\n
                        うまくいかなかった点: ${failurePoints || "未記入"}\n
                        完了基準: ${completionReason || "未記入"}\n
                        学び: ${challengesAndLearnings || "未記入"}
                    `;
                    this.nodes.update({
                        id: this.selectId,
                        color: 'gray',
                        title: title
                    });

                    // 内省情報がある場合、青色の内省タグを右上に追加
                    if (successPoints || failurePoints || completionReason || challengesAndLearnings) {
                        const nodeBoundingBox = this.ownNetwork.getBoundingBox(this.selectId);
                        const reflectionTagId = `reflection-tag-${this.selectId}`;
                        const reflectionTitle = `うまくいった点: ${successPoints || "未記入"}\nうまくいかなかった点: ${failurePoints || "未記入"}\n完了基準: ${completionReason || "未記入"}\n学び: ${challengesAndLearnings || "未記入"}`;
                        
                        // 既存の内省タグがあるかチェック
                        const existingReflectionTag = this.nodes.get(reflectionTagId);
                        if (existingReflectionTag) {
                            // 既存のタグのタイトルを更新し、枠線を消して影を付ける
                            this.nodes.update({
                                id: reflectionTagId,
                                title: reflectionTitle,
                                borderWidth: 0,
                                borderWidthSelected: 0,
                                shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
                            });
                            console.log('既存の内省タグを更新しました:', reflectionTagId);
                        } else {
                            // 新しい内省タグを追加
                            const reflectionTag = {
                                id: reflectionTagId,
                                label: '💭',
                                shape: 'ellipse',
                                size: 20,
                                color: {
                                    background: 'lightblue',
                                    border: 'blue'
                                },
                                font: { 
                                    size: 18,
                                    color: 'darkblue'
                                },
                                x: nodeBoundingBox.right - 8,
                                y: nodeBoundingBox.top + 8,
                                fixed: true,
                                physics: false,
                                group: 'reflection-tag',
                                title: reflectionTitle,
                                borderWidth: 0,
                                borderWidthSelected: 0,
                                shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
                            };
                            this.nodes.add(reflectionTag);
                            console.log('新しい内省タグを追加しました:', reflectionTagId);
                        }
                    }

                    console.log(`ノード ${this.selectId} のタイトルを更新しました。`);
                    tooltip.style.display = "none"; // 保存後に吹き出しを閉じる
                },
                error: (error) => {
                    console.error("記録保存中にエラーが発生しました:", error);
                    alert("記録の保存に失敗しました。");
                }
            });
        });
    }
    
    setupTooltipDrag(tooltip) {
        const header = document.getElementById("feedbackTooltipHeader");
        let offsetX = 0, offsetY = 0, isDragging = false;
    
        header.addEventListener("mousedown", (event) => {
            isDragging = true;
            offsetX = event.clientX - tooltip.offsetLeft;
            offsetY = event.clientY - tooltip.offsetTop;
            document.body.style.cursor = "grabbing";
        });
    
        document.addEventListener("mousemove", (event) => {
            if (isDragging) {
                tooltip.style.left = `${event.clientX - offsetX}px`;
                tooltip.style.top = `${event.clientY - offsetY}px`;
            }
        });
    
        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = "default";
            }
        });
    }
    


    //ノードがクリックされたときの処理
    networkClick (params){
        // 過去データ表示時は操作を無効化（ホバーは除く）
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、ノード操作が無効化されています');
            return;
        }
        
        //他のところクリックしたら色直す
        const feedbackElem = document.getElementById("ontology_feedback");
        if (feedbackElem) {
            feedbackElem.innerHTML = "";
        }
        const feedbackarea = document.getElementsByClassName("accordion-item");
        for(var i=0; i<feedbackarea.length; i++){
            feedbackarea[i].style.display = "none";
        }
        if(this.jmindex != []){
            const jmnode = document.getElementsByTagName("jmnode");
            this.jmindex.map((n) => {
                if(jmnode[n].getAttribute("type") == "answer"){
                    jmnode[n].style.backgroundColor = "#ffffff";
                }else{
                    jmnode[n].style.backgroundColor = "#87cefa";
                }
            })
            this.jmindex.length = 0;
        }
        
        // ノードがクリックされた場合の処理
        if(params.nodes.length == 1){
            const clickedNodeId = params.nodes[0];
            const clickedNode = this.nodes.get(clickedNodeId);
            
            if(this.OntologyConnectNodeId.indexOf(params.nodes[0]) !== -1){
                const node_infomation = this.nodes.get(this.OntologyNodeId[this.OntologyConnectNodeId.indexOf(params.nodes[0])]);
                if (feedbackElem) {
                    feedbackElem.innerHTML = "<div class='feedback_message'>この発言は「"+node_infomation.label + "」と「" + this.output_input[node_infomation.label] + "」<br>との合理性を意識して発言されたのかもしれません</div>";
                }
            }
            // 理由が記述されたノードの場合、理由を表示
            if(this.ReasonConnectNodeId.indexOf(params.nodes[0]) !== -1){
                const reason_index = this.ReasonConnectNodeId.indexOf(params.nodes[0]);
                const reason_id = this.ReasonNodeId[reason_index];
                // 理由の詳細をDBから取得して表示する処理を追加可能
                console.log('理由が記述されたノードがクリックされました:', reason_id);
                // 必要に応じてここで理由の詳細表示ダイアログを表示
            }
        }
        if(this.RecruitNodeId.indexOf(params.nodes[0]) !== -1){
            this.FeedbackNodeId = params.nodes[0];
            document.getElementById(this.FeedbackNodeId).style.display = "block";
        }
        if(params.nodes.length == 1){
            const net_index = this.ConnectNetworkNodeId.map((n_id, index) => {
                return n_id === params.nodes[0] ? index : null;
            }).filter(n => n !== null);
            if(net_index == ""){
                return;
            }
            const jmnode = document.getElementsByTagName("jmnode");
            net_index.map((m_id) => {
                this.jmindex.push(this.ConnectMindMapNodeId[m_id]);
                if(jmnode[this.ConnectMindMapNodeId[m_id]].getAttribute("type") == "answer"){
                    jmnode[this.ConnectMindMapNodeId[m_id]].style.backgroundColor = "#ffff99";
                }else{
                    jmnode[this.ConnectMindMapNodeId[m_id]].style.backgroundColor = "#ffff99";
                }
            });
        }
        // console.log(params);
        // console.log(params.pointer.DOM);
        // console.log(params.pointer.DOM.x, params.pointer.DOM.y);
    }

    // 手段ノード下に追加ボタンを表示
    showAddNodeButton(nodeId, params) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // 既存のボタンがあれば削除
        this.hideAddNodeButton();

        // ノードの位置を取得
        const nodeBoundingBox = this.ownNetwork.getBoundingBox(nodeId);
        if (!nodeBoundingBox) return;

        // ネットワークキャンバスのDOM要素とその位置を取得
        const networkCanvas = document.getElementById("myProcessnetwork2");
        const canvasRect = networkCanvas.getBoundingClientRect();

        // ノードの実際の座標を取得して画面座標に変換
        const nodePosition = this.ownNetwork.getPositions(nodeId)[nodeId];
        const nodeScreenPos = this.ownNetwork.canvasToDOM({
            x: nodePosition.x,
            y: nodePosition.y
        });

        // プラスアイコンをノードの中央付近に配置（ノードに大きく被る）
        const nodeHeight = nodeBoundingBox.bottom - nodeBoundingBox.top;
        const nodeWidth = nodeBoundingBox.right - nodeBoundingBox.left;
        const buttonX = canvasRect.left + nodeScreenPos.x;
        const buttonY = canvasRect.top + nodeScreenPos.y + 5;

        // 追加ボタンを作成（小さなプラスアイコン）
        const addButton = document.createElement('button');
        addButton.id = 'addNodeButton';
        addButton.innerHTML = '＋';
        addButton.title = '手段を追加';
        addButton.style.cssText = `
            position: fixed;
            left: ${buttonX}px;
            top: ${buttonY}px;
            z-index: 1000;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        `;

        // ホバー効果
        addButton.addEventListener('mouseenter', () => {
            addButton.style.background = '#45a049';
            addButton.style.transform = 'scale(1.1)';
            addButton.style.boxShadow = '0 3px 6px rgba(0,0,0,0.4)';
        });

        addButton.addEventListener('mouseleave', () => {
            addButton.style.background = '#4CAF50';
            addButton.style.transform = 'scale(1)';
            addButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            // ボタンからマウスが離れた時は少し遅らせて非表示
            setTimeout(() => {
                this.hideAddNodeButton();
            }, 200);
        });

        // クリックイベント
        // 過去表示中はクリックを無効化
        if (this.isViewingPastData) {
            addButton.disabled = true;
            addButton.setAttribute('aria-disabled', 'true');
            addButton.title = '過去表示では操作できません';
            addButton.style.opacity = '0.45';
            addButton.style.cursor = 'not-allowed';
        }

        addButton.addEventListener('click', (e) => {
            // 過去表示モードでは何もしない
            if (this.isViewingPastData) {
                e.stopPropagation();
                console.log('過去データ表示中のため、ノード追加ボタンは無効です');
                return;
            }
            e.stopPropagation();
            this.addChildNode(nodeId);
            this.hideAddNodeButton();
        });

        // ドキュメントに追加
        document.body.appendChild(addButton);
    }

    // 追加ボタンを非表示
    hideAddNodeButton() {
        const existingButton = document.getElementById('addNodeButton');
        if (existingButton) {
            existingButton.remove();
        }
    }

    // エッジ用プラスボタンを表示
    showAddEdgeButton(edgeId) {
        // 既存のエッジボタンを削除
        this.hideAddEdgeButton();
        
        // エッジの位置を取得
        const edgeData = this.edges.get(edgeId);
        if (!edgeData) return;

        // エッジの中点を計算
        const fromPos = this.ownNetwork.getPositions([edgeData.from])[edgeData.from];
        const toPos = this.ownNetwork.getPositions([edgeData.to])[edgeData.to];
        
        if (!fromPos || !toPos) return;

        const midPoint = {
            x: (fromPos.x + toPos.x) / 2,
            y: (fromPos.y + toPos.y) / 2
        };

        // キャンバス座標をDOM座標に変換
        const canvasPosition = this.ownNetwork.canvasToDOM(midPoint);

        // プラスボタンを作成
        const button = document.createElement('button');
        button.id = 'addEdgeButton';
        button.innerHTML = '+';
        button.style.position = 'absolute';
        button.style.left = (canvasPosition.x - 10) + 'px';
        button.style.top = (canvasPosition.y - 10) + 'px';
        button.style.width = '20px';
        button.style.height = '20px';
        button.style.borderRadius = '50%';
        button.style.border = '1px solid #ccc';
        button.style.backgroundColor = '#fff';
        button.style.color = '#666';
        button.style.fontSize = '12px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';

        // コンテナに追加
        const container = this.ownNetwork.body.container;
        container.appendChild(button);

        // 今後の処理のためにエッジIDを保存
        button.setAttribute('data-edge-id', edgeId);

        // 過去表示モード中は見た目を変えて無効にする
        if (this.isViewingPastData) {
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
            button.title = '過去表示では操作できません';
            button.style.opacity = '0.45';
            button.style.cursor = 'not-allowed';
        }

        // クリックイベントリスナーを追加（過去表示時は無効化）
        button.addEventListener('click', (event) => {
            // 過去データ表示モードでは操作を無効化
            if (this.isViewingPastData) {
                event.stopPropagation();
                console.log('過去データ表示中のため、エッジ追加ボタンは無効です');
                return;
            }

            // 通常時はエッジ間にノードを追加する処理へ
            const targetEdgeId = button.getAttribute('data-edge-id') || edgeId;
            if (targetEdgeId) {
                try {
                    this.addNodeBetweenEdge(targetEdgeId);
                } catch (e) {
                    console.error('エッジ間ノード追加でエラー:', e);
                }
            } else {
                console.warn('data-edge-id が設定されていません');
            }
        });

        console.log('Edge plus button displayed for edge:', edgeId);
    }

    // エッジ用プラスボタンを非表示
    hideAddEdgeButton() {
        const existingButton = document.getElementById('addEdgeButton');
        if (existingButton) {
            existingButton.remove();
        }
    }

    // エッジの間にノードを追加
    addNodeBetweenEdge(edgeId) {
        console.log(`エッジ ${edgeId} の間にノードを追加中...`);
        
        // エッジが存在するかチェック
        const edge = this.edges.get(edgeId);
        if (!edge) {
            console.error(`エッジ ${edgeId} が見つかりません`);
            return;
        }
        
        // プラスボタンを非表示
        this.hideAddEdgeButton();
        
        // エッジの開始・終了ノード位置を取得
        const fromPos = this.ownNetwork.getPositions([edge.from])[edge.from];
        const toPos = this.ownNetwork.getPositions([edge.to])[edge.to];
        
        if (!fromPos || !toPos) {
            console.error('ノード位置を取得できませんでした');
            return;
        }
        
        // 中間点を計算
        const midPoint = {
            x: (fromPos.x + toPos.x) / 2,
            y: (fromPos.y + toPos.y) / 2
        };
        
        // 新しいノードのIDを生成
        const newNodeId = this.generateUniqueNumberText();
        
        // ユーザーに新しいノードのラベルを入力してもらう
        const newLabel = prompt('新しいノードのラベルを入力してください:', '新しいノード');
        
        if (newLabel === null) {
            console.log('ノード追加がキャンセルされました');
            return;
        }
        
        const actualLabel = newLabel.trim() || '新しいノード';
        
        // 元のエッジのラベルを保存
        const originalEdgeLabel = this.EdgeLabels[edgeId] || edge.label || '';
        
        console.log(`🗑️ 元のエッジを削除中: ${edgeId} (${edge.from} -> ${edge.to})`);
        
        // 元のエッジを削除（複数の方法で確実に削除）
        try {
            this.edges.remove(edgeId);
            console.log(`DataSetからエッジ ${edgeId} を削除しました`);
        } catch (error) {
            console.warn(`DataSetからの削除に失敗:`, error);
            // オブジェクト形式で再試行
            try {
                this.edges.remove({id: edgeId});
                console.log(`オブジェクト形式でエッジ ${edgeId} を削除しました`);
            } catch (error2) {
                console.error(`エッジ削除に完全に失敗:`, error2);
            }
        }
        
        // エッジラベル管理からも削除
        if (this.EdgeLabels[edgeId]) {
            delete this.EdgeLabels[edgeId];
        }
        
        // データベースからも削除（正しいパラメータで呼び出し）
        if (typeof defaultRecordThinkingProcess !== 'undefined' && defaultRecordThinkingProcess.delete_db_Edge) {
            defaultRecordThinkingProcess.delete_db_Edge(edgeId, edge.from, edge.to);
        }
        
        console.log(`✅ 元のエッジ ${edgeId} を完全に削除しました`);
        
        // エッジが確実に削除されたかを確認
        const deletedEdgeCheck = this.edges.get(edgeId);
        if (deletedEdgeCheck) {
            console.warn(`⚠️ エッジ ${edgeId} がまだ存在しています:`, deletedEdgeCheck);
            // 強制的に削除を試行
            this.edges.remove({id: edgeId});
            // 再度確認
            const doubleCheck = this.edges.get(edgeId);
            if (doubleCheck) {
                console.error(`❌ エッジ ${edgeId} の削除に失敗しました`);
                return; // 削除に失敗した場合は処理を中断
            }
        } else {
            console.log(`✓ エッジ ${edgeId} の削除を確認しました`);
        }
        
        // 全エッジの状況をログ出力（デバッグ用）
        const allEdges = this.edges.get();
        console.log(`📋 現在のエッジ数: ${allEdges.length}`);
        
        // 新しいノードを追加
        console.log(`➕ 新しいノード ${newNodeId} を追加中...`);
        this.addNode(newNodeId, actualLabel, "step", midPoint.x, midPoint.y);
        
        // 元のエッジが完全に削除されたことを最終確認
        const finalCheck = this.edges.get(edgeId);
        if (finalCheck) {
            console.error(`❌ 致命的エラー: エッジ ${edgeId} がまだ存在しています`);
            // 最後の手段として、IDを使って強制削除
            const allEdges = this.edges.get();
            const targetEdge = allEdges.find(e => e.id === edgeId);
            if (targetEdge) {
                console.log(`🔧 最後の手段でエッジを削除中...`);
                this.edges.remove([edgeId]);
            }
        }
        
        // 新しいエッジを作成（from -> 新しいノード）
        console.log(`🔗 新しいエッジ1を作成中: ${edge.from} -> ${newNodeId}`);
        const newEdgeId1 = this.generateUniqueNumberText();
        const newEdgeData1 = {
            id: String(newEdgeId1),  // IDを文字列として設定
            from: String(edge.from),
            to: String(newNodeId)
        };
        
        // 元のエッジにラベルがあった場合、最初のエッジに引き継ぐ
        if (originalEdgeLabel) {
            newEdgeData1.label = originalEdgeLabel;
            newEdgeData1.font = {
                size: 12,
                color: '#333333',
                background: 'rgba(255, 255, 255, 0.8)',
                strokeWidth: 1,
                strokeColor: '#ffffff'
            };
            this.EdgeLabels[newEdgeId1] = originalEdgeLabel;
        }
        
        console.log(`➕ エッジ1を追加中:`, newEdgeData1);
        this.edges.add(newEdgeData1);
        
        // 新しいエッジを作成（新しいノード -> to）
        console.log(`🔗 新しいエッジ2を作成中: ${newNodeId} -> ${edge.to}`);
        const newEdgeId2 = this.generateUniqueNumberText();
        const newEdgeData2 = {
            id: String(newEdgeId2),  // IDを文字列として設定
            from: String(newNodeId),
            to: String(edge.to)
        };
        
        console.log(`➕ エッジ2を追加中:`, newEdgeData2);
        this.edges.add(newEdgeData2);
        
        // データベースに新しいエッジを記録
        if (typeof defaultRecordThinkingProcess !== 'undefined' && defaultRecordThinkingProcess.record_Edge) {
            defaultRecordThinkingProcess.record_Edge(newEdgeId1, edge.from, newNodeId, originalEdgeLabel || '');
            defaultRecordThinkingProcess.record_Edge(newEdgeId2, newNodeId, edge.to, '');
        }
        
        console.log(`✅ エッジ ${edgeId} の間に新しいノード ${newNodeId} (${actualLabel}) を追加しました`);
        console.log(`🔗 新しいエッジ: ${newEdgeId1} (${edge.from} -> ${newNodeId}), ${newEdgeId2} (${newNodeId} -> ${edge.to})`);
        
        // 処理完了後のエッジ状況を確認
        const finalEdgeCount = this.edges.get().length;
        console.log(`📊 処理完了後のエッジ数: ${finalEdgeCount}`);
        console.log(`🎯 元のエッジ ${edgeId} が存在するか最終確認:`, !!this.edges.get(edgeId));
        
        // ナビゲーターのトリガーを実行
        if (typeof executeNavigatorTrigger === 'function') {
            executeNavigatorTrigger('node_created');
        }
    }

    // 子ノードを追加
    addChildNode(parentNodeId) {
        const parentNode = this.nodes.get(parentNodeId);
        if (!parentNode) return;

        // 親ノードの下の位置を計算
        const parentBoundingBox = this.ownNetwork.getBoundingBox(parentNodeId);
        const newNodeX = parentNode.x;
        const newNodeY = parentBoundingBox.bottom + 80;

        // 新しいノードのラベルを取得
        const newLabel = prompt('新しい手段の名前を入力してください:', '新しい手段');
        if (!newLabel || newLabel.trim() === '') return;

        // 新しいノードを追加
        const newNodeId = this.generateUniqueNumberText();
        this.addNode(newNodeId, newLabel.trim(), "step", newNodeX, newNodeY);

        // 親ノードから子ノードへのエッジを作成
        this.addNewEdge(parentNodeId, newNodeId);

        console.log(`親ノード ${parentNodeId} の下に新しいノード ${newNodeId} を追加しました`);
    }

    addNewEdge(E_start, E_end){
        let edge_id = this.generateUniqueNumberText();
        console.log("🔧 addNewEdge: 新しいエッジを作成中 ID =", edge_id);
        
        const edgeData = { 
            id: String(edge_id),  // IDを文字列として明示的に設定
            from: String(E_start), 
            to: String(E_end) 
        };
        
        console.log("➕ 新しいエッジデータ:", edgeData);
        this.edges.add(edgeData);
        defaultRecordThinkingProcess.record_Edge(edge_id, E_start, E_end);
        
        // 追加後の確認
        const addedEdge = this.edges.get(edge_id);
        console.log("✅ 新しく追加されたエッジの確認:", addedEdge);
    }

    //ドラッグ開始(完成)
    dragstart (params) {
        // 過去データ表示時はドラッグ操作を無効化
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、ドラッグ操作が無効化されています');
            params.event.preventDefault();
            return;
        }
        
        if(!this.edgeEditMode){
            params.event.preventDefault();
        }else{
            this.dragStartNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
        }
    }

    //ドラッグ終了(完成)
    dragend (params) {
        // 過去データ表示時はドラッグ操作を無効化
        if (this.isViewingPastData) {
            console.log('過去データ表示中のため、ドラッグ操作が無効化されています');
            return;
        }
        
        if(this.edgeEditMode){
            this.dragEndNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
            if(this.dragStartNodeId !== null && this.dragEndNodeId !== null && this.dragEndNodeId !== this.dragStartNodeId && this.dragEndNodeId !== undefined && this.nodes.get(this.dragStartNodeId).shape != "ellipse" && this.nodes.get(this.dragEndNodeId).shape != "ellipse"){
                let notable = true;
                const ConnectSelectNode = [];
                const connectedEdges = this.ownNetwork.getConnectedEdges(this.dragStartNodeId);
                connectedEdges.map((n)=>{
                    ConnectSelectNode.push(this.ownNetwork.getConnectedNodes(n).filter(n => n !== this.dragStartNodeId)[0]);
                });
                ConnectSelectNode.map((n)=>{
                    if(n === this.dragEndNodeId){
                        notable = false;
                    }
                });
                if(notable == false){
                    return;
                }
                let edge_id = this.generateUniqueNumberText();
                this.edges.add({id: edge_id, from: this.dragStartNodeId, to: this.dragEndNodeId });
                defaultRecordThinkingProcess.record_Edge(edge_id, this.dragStartNodeId, this.dragEndNodeId);
            }
            this.dragStartNodeId = null;
            this.dragEndNodeId = null;
        }else{
            const movedNodeId = params.nodes[0];
            if (movedNodeId !== undefined) {
                //なぜか更新したら色変わってしまうから一時的に
                let node_color = this.nodes.get(movedNodeId).color;
                // let border_color = '#ffdb4f'; 
                // switch(this.nodes.get(movedNodeId).group) {
                //     case "process": // 自分で考えた要約に関するノードの場合
                //         node_color = '#ffdb4f';
                //         break;
                //     case "versions": // 議論内での発言ノードの場合
                //         node_color = '#ffbaa1';
                //         break;
                //     case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                //         node_color = '#ffdb4f';
                //         break;
                //     default: // その他
                //         break;
                // }
                this.nodes.update({ id: movedNodeId, color: node_color, x: params.pointer.x, y: params.pointer.y });
                const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                //次に追加したノードの座標指定
                this.latest_selected_node_info.x = (nodeBoundingBox.right + nodeBoundingBox.left)/2;
                this.latest_selected_node_info.y = nodeBoundingBox.bottom + 10;
                console.log(params.nodes);
                console.log(`ノード ${movedNodeId} の位置を更新しました。新しい座標: (${this.latest_selected_node_info.x}, ${this.latest_selected_node_info.y})`);
            
                defaultRecordThinkingProcess.update_Node("point" ,movedNodeId, (nodeBoundingBox.right + nodeBoundingBox.left)/2, (nodeBoundingBox.bottom + nodeBoundingBox.top)/2, 1)
                
                const ontology_index = this.OntologyConnectNodeId.indexOf(movedNodeId);
                if(ontology_index !== -1){
                    const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                    const ontology_x = nodeBoundingBox.left;
                    const ontology_y = nodeBoundingBox.top;
                    /*
                    console.log(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]);
                    let border_color = '#ffdb4f';
                    if(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]==="採用"){
                        border_color = 'green'; 
                    }else if(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]==="棄却"){
                        border_color = 'red'; 
                    }
                    this.nodes.update({ id: this.OntologyNodeId[ontology_index], color: { background: 'blue', border: border_color}, x: ontology_x, y: ontology_y });
                    */
                    this.nodes.update({ id: this.OntologyNodeId[ontology_index], color: { background: 'blue', border: '#ffdb4f'}, x: ontology_x, y: ontology_y });
                    defaultRecordThinkingProcess.update_Node("point" ,this.OntologyNodeId[ontology_index], ontology_x, ontology_y);
                }
                
                // 理由タグの位置も更新（リロード時の理由タグにも対応）
                const reasonTagId = `reason-tag-${movedNodeId}`;
                const reasonTag = this.nodes.get(reasonTagId);
                if (reasonTag) {
                    const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                    const tag_x = nodeBoundingBox.left + 8;
                    const tag_y = nodeBoundingBox.top + 8;
                    this.nodes.update({ 
                        id: reasonTagId, 
                        x: tag_x, 
                        y: tag_y
                    });
                }
                
                // 内省タグの位置も更新（リロード時の内省タグにも対応）
                const reflectionTagId = `reflection-tag-${movedNodeId}`;
                const reflectionTag = this.nodes.get(reflectionTagId);
                if (reflectionTag) {
                    const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                    const tag_x = nodeBoundingBox.right - 8;
                    const tag_y = nodeBoundingBox.top + 8;
                    this.nodes.update({ 
                        id: reflectionTagId, 
                        x: tag_x, 
                        y: tag_y
                    });
                }
                
                // 時間タグの位置も更新（リロード時の時間タグにも対応）
                const timeTagId = `time-tag-${movedNodeId}`;
                const timeTag = this.nodes.get(timeTagId);
                if (timeTag) {
                    const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                    const tag_x = nodeBoundingBox.left + 8;
                    const tag_y = nodeBoundingBox.bottom - 8; // ノードの左下
                    this.nodes.update({ 
                        id: timeTagId, 
                        x: tag_x, 
                        y: tag_y
                    });
                }
                
                // 理由ノードの位置も更新（従来のシステム用）
                const reason_index = this.ReasonConnectNodeId.indexOf(movedNodeId);
                if(reason_index !== -1){
                    const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                    const reason_x = nodeBoundingBox.left;
                    const reason_y = nodeBoundingBox.top;
                    
                    // 理由ノードの詳細情報をメモリから取得
                    const reasonNodeId = this.ReasonNodeId[reason_index];
                    const reasonContent = this.ReasonContent[reason_index]; // メモリから理由内容を取得
                    
                    this.nodes.update({ 
                        id: this.ReasonNodeId[reason_index], 
                        color: { background: '#FFA500', border: '#FF6347'}, 
                        x: reason_x, 
                        y: reason_y,
                        title: `なぜそれを取り組もうとしたか: ${reasonContent}`
                    });
                    defaultRecordThinkingProcess.update_Node("point" ,this.ReasonNodeId[reason_index], reason_x, reason_y);
                }
            }
        }
    }
    
    // エッジの削除（完了）
    deleteEdge() {
        const selectEdgeId = this.ownNetwork.getSelection().edges[0];
        const startid = this.edges.get(selectEdgeId).from;
        const endid = this.edges.get(selectEdgeId).to;
        if(selectEdgeId !== undefined){
            this.edges.remove({id: selectEdgeId});
            defaultRecordThinkingProcess.delete_db_Edge(selectEdgeId, startid, endid);
            const Edge_index = this.OntologyConnectNodeId.indexOf(startid);
            if(Edge_index !== -1){
                this.EdgeStartId.splice(Edge_index, 1);
                this.EdgeEndId.splice(Edge_index, 1);
            }
        }
    }

    addMaterialOntology(material_id, concept_id){
        $.ajax({
            url:'js/hozo.xml',
            type:'get',
            dataType:'xml',
            timeout:1000,
            success: (xml,status) => {
                if(status!='success')return;
                const XML = $(xml).find('W_CONCEPTS');
                const concept = Array.from(XML[0].getElementsByTagName('CONCEPT'));
                //hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
                concept.map((content)=>{
                    if(content.getAttribute('id') === concept_id){
                        const slot_content = Array.from(content.getElementsByTagName("SLOT"));
                        slot_content.map((content_slot) => {
                            if(content_slot.getAttribute("role") === "出力"){
                                const nodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(material_id);
                                this.addNode(concept_id, content_slot.getAttribute("class_constraint"), "topic-tag", nodeBoundingBox.left, nodeBoundingBox.top);
                                this.OntologyConnectNodeId.push(material_id);
                                this.OntologyNodeId.push('topic-tag_'+concept_id);
                                defaultRecordThinkingProcess.record_ontology(material_id, 'topic-tag_'+concept_id);
                            }
                        });
                    }
                });
            }
        });
    }

    zoomIn() {
        const scale = this.ownNetwork.getScale() * 1.1; // Increase scale by 10%
        this.scale = scale;
        this.ownNetwork.moveTo({ scale: scale });
    }
      
    zoomOut() {
        const scale = this.ownNetwork.getScale() * 0.9; // Decrease scale by 10%
        this.scale = scale;
        this.ownNetwork.moveTo({ scale: scale });
    }

    // シンプルなツールチップ設定（vis.jsのデフォルトツールチップを使用）
    setupCustomTooltip() {
        // vis.jsのデフォルトツールチップを使用するため、特別な設定は不要
        // ノードのtitle属性が自動的にツールチップとして表示される
    }

}

// ネットワーク関係の記録
class RecordThinkingProcess{
    //ノードの記録(完了)
    record_Node(id, label, node_type, x, y, status) {
        let selected_node_id = document.getElementById('conceptdisplay').getAttribute('nodeId');
        $.ajax({
            url: "php/object_maneger.php",
            type: "POST",
            data: {
                node_id: id,
                label: label,
                node_type: node_type,
                x: x,
                y: y,
                status: status,
                selected_node_id: selected_node_id,
                purpose: 'record',
                record_thing: 'node'
            },

        });
    }

    //エッジの記録(完了)
    record_Edge(edge_id, edge_start, edge_end) {
        $.ajax({
    url: "php/edit_object_map_maneger.php",
    type: "POST",
    dataType: "json",   // ここを追加
    data: {
        edge_id: edge_id,
        edge_start: edge_start,
        edge_end: edge_end,
        purpose: 'record',
        record_thing: 'edge'
    },
    success: function(res) {
        console.log("✅ edge記録成功:", res);
    },
    error: function(xhr, status, error) {
        console.error("❌ edge記録エラー:", status, error);
        console.warn("📄 レスポンステキスト:", xhr.responseText);
    }
});
    }
    

    //ノードの更新(完了)
    // 4つ目の引数までの互換性を保ちつつ、5番目の引数で drag フラグを受け取れるようにする
    update_Node (select_update, id, node_update_thing1, node_update_thing2, dragFlag = 0){
        const postData = {
            select_update : select_update,
            node_id : id,
            purpose : 'update',
            update_thing : 'node',
            node_update_thing1 : node_update_thing1,
            node_update_thing2: node_update_thing2
        };
        // dragFlag が指定されている（1）の場合はサーバに伝える
        if (typeof dragFlag !== 'undefined' && (dragFlag === 1 || dragFlag === '1')) {
            postData.drag = 1;
        }

        $.ajax({
            url: "php/object_maneger.php",
            type: "POST",
            data: postData,
            success:function(e){
                if(e){
                    console.log(e);
                }
            }
        });
    }

    //ノードの削除(完了)
    delete_db_Node (id){
        $.ajax({
            url: "php/object_maneger.php",
            type: "POST",
            data: {node_id : id,
                purpose : 'delete',
                delete_thing : 'node'},
        });
    }

    //triggerの削除
    delete_trigger_Node (id){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {trigger_id : id,
                purpose : 'delete',
                delete_thing : 'trigger'},
            success: function(e){
                if(e){
                    console.log(e);
                }
            }
        });
    }
    
    //エッジの削除(完了)
    delete_db_Edge (edge_id, edge_start,edge_end){
        $.ajax({
            url: "php/object_maneger.php",
            type: "POST",
            data: {edge_id: edge_id,
                edge_start : edge_start,
                edge_end : edge_end,
                purpose : 'delete',
                delete_thing : 'edge'},
                success: function(e){
                    if(e){
                        console.log(e);
                    }
                }
        });
    }

    delete_connection (id){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {node_id : id,
                purpose : 'delete',
                delete_thing : 'connection'},
        });
    }

    //繋げたものをDBに記録
    record_connection (NetworkNodeId,MindMapNodeId){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {networknodeid : NetworkNodeId,
                mindmapnodeid : MindMapNodeId,
                purpose : 'record',
                record_thing : 'connection'},
        });
    }

    // オントロジーの対応付けの記録
    record_ontology (node_id, ontology_node_id){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {node_id : node_id,
                ontology_node_id : ontology_node_id,
                purpose : 'record',
                record_thing : 'ontology'},
        });
    }

    // 理由の記録
    record_reason (node_id, reason_node_id, reason_text){
        $.ajax({
            url: "php/object_maneger.php",
            type: "POST",
            data: {node_id : node_id,
                reason_node_id : reason_node_id,
                reason_text : reason_text,
                purpose : 'record',
                record_thing : 'reason'},
        });
    }

    // 完了予定の記録
    record_time (node_id, time_node_id, time_text){
        $.ajax({
            url: "php/object_maneger.php",
            type: "POST",
            data: {node_id : node_id,
                time_node_id : time_node_id,
                time_text : time_text,
                purpose : 'record',
                record_thing : 'estimated_time'},
        });
    }

    /*
    // オントロジーの対応付けの記録
    record_recruit (node_id, ontology_node, result){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {node_id : node_id,
                ontology_node : ontology_node,
                result_recruit : result,
                purpose : 'record',
                record_thing : 'recruit'},
        });
    }
    */

    record_trigger(trigger_id, activity_id, from, to, time, activity_type, content, x, y){
        
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {trigger_id : trigger_id,
                activity_id : activity_id,
                node_version_from : from,
                node_version_to : to,
                activity_time : time,
                activity_type : activity_type,
                content : content,
                x : x,
                y : y,
                purpose: 'record',
                record_thing : 'trigger'},
            success: function(e){
                if(e){
                    console.log(e);
                }else{
                    if(activity_id){
                        document.getElementById(activity_id).trigger_on = 1;
                        document.getElementById(activity_id).style.background = "#979997";
                        document.getElementById(activity_id).style.borderWidth = 3;
                    }
                }
            }
        });
    }
}


/*
 * データベースからの読み込み
 */
let process_mode;
let trigger_list;
const getProcessMapDataFromDB = (callback) => {
    //選択されているノードIDとconcept_id
    let selected_node_id;
    let selected_concept_id;
    if(process_mode == "all"){
        selected_node_id = _jm.get_selected_node().id;
        selected_concept_id = Get_NodeInfo(selected_node_id, "concept_id");
    }else{
        const conceptDiplay = document.getElementById("conceptdisplay");
        selected_node_id = conceptDiplay.getAttribute('nodeid');
        selected_concept_id = conceptDiplay.getAttribute('conceptid');;
    }
    choose_trigger_xmlLoad().then(conceptIds => {
        return new Promise((resolve, reject) => {
            try{
                return $.ajax({
                    url: "php/object_map_manager.php",
                    type: "POST",
                    data: data =  {
                        process_mode: process_mode,
                        selected_node_id: selected_node_id,
                        selected_concept_id: selected_concept_id,
                        concept_ids: conceptIds
                    },
                }).success((r) => {
                    trigger_list = JSON.parse(r);
                    console.log(trigger_list);
                    callback(trigger_list);
                });
            } catch (error){
                reject(error);
            }
        });
    }).catch(error => {
        console.error(error); // エラー処理
    });
}

const getPassDataFromDB = (selected_date) => {
    console.log("過去データ取得開始:", selected_date);
    
    // 選択されているノードIDを取得
    let selected_node_id = null;
    const conceptDisplay = document.getElementById("conceptdisplay");
    if (conceptDisplay) {
        selected_node_id = conceptDisplay.getAttribute('nodeid');
    }
    
    const postData = {
        process_mode: "PassData",
        selected_date: selected_date,
        selected_node_id: selected_node_id  // ノードIDを送信
    };

    console.log("送信データ:", postData);

    $.ajax({
        url: "php/object_map_manager.php",
        type: "POST",
        data: postData,
        success: function(response) {
            console.log("レスポンス文字列:", response);
            try {
                const data = JSON.parse(response);
                console.log("パース結果:", data);
                console.log("データ構造確認 - 利用可能なキー:", Object.keys(data));

                // ノード履歴データ（object_nodes_historiesから）
                const historyArray = data.hnode || data.node_histories || data.nodes || [];
                // エッジ履歴データ（object_edges_historiesから）  
                const edgeArray = data.hedge || data.edge_histories || data.edges || [];
                
                console.log("🔍 ノードデータ配列:", historyArray);
                console.log("🔍 エッジデータ配列:", edgeArray);

                if (Array.isArray(historyArray) && historyArray.length > 0) {
                    console.log(`📊 履歴データ: ノード=${historyArray.length}個, エッジ=${edgeArray.length}個`);
                    console.log(`🔧 履歴ノードの最初の要素:`, historyArray[0]);
                    if (edgeArray.length > 0) {
                        console.log(`🔧 履歴エッジの最初の要素:`, edgeArray[0]);
                    }
                    
                    // 既存のノードとエッジをクリア
                    if (typeof defaultThinkingProcess !== 'undefined') {
                        defaultThinkingProcess.nodes.clear();
                        defaultThinkingProcess.edges.clear();
                    }
                    
                    // 履歴データからノードを復元
                    historyArray.forEach((node, i) => {
                        console.log(`[${i + 1}] object_node_id: ${node.object_node_id}`);
                        console.log("  content:", node.content);
                        console.log("  object_node_type:", node.object_node_type);
                        console.log("  x:", node.x, " y:", node.y);
                        console.log("  status:", node.status);
                        console.log("  appeared_at:", node.appeared_at);
                        console.log("  disappeared_at:", node.disappeared_at);
                        
                        // ノードを追加
                        if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess.addReloadNode) {
                            defaultThinkingProcess.addReloadNode(
                                node.object_node_id,
                                node.content,
                                node.object_node_type,
                                node.x,
                                node.y,
                                node.status,
                                node.purpose,
                                node.evaluation_good,
                                node.attribution,
                                node.application,
                                node.estimated_time
                            );
                        }
                    });

                    // エッジデータからエッジを復元（ノード復元後に実行）
                    if (Array.isArray(edgeArray) && edgeArray.length > 0) {
                        console.log(`🔗 ${edgeArray.length}個のエッジを復元開始`);
                        // 少し遅延させてノードが確実に作成された後にエッジを追加
                        setTimeout(() => {
                            let successCount = 0;
                            let skipCount = 0;
                            
                            edgeArray.forEach((edge, i) => {
                                console.log(`[エッジ${i + 1}/${edgeArray.length}] 復元処理開始`);
                                console.log(`  📋 edge_id: ${edge.object_edge_id || edge.id}`);
                                console.log(`  📋 edge_start: ${edge.edge_start || edge.from}`);
                                console.log(`  📋 edge_end: ${edge.edge_end || edge.to}`);
                                console.log(`  📋 label: ${edge.label || ''}`);
                                console.log(`  📋 appeared_at: ${edge.appeared_at || ''}`);
                                console.log(`  📋 disappeared_at: ${edge.disappeared_at || ''}`);
                                
                                // フィールド名の標準化（PHPから来るデータ構造に対応）
                                const edgeId = edge.object_edge_id || edge.id;
                                const edgeStart = edge.edge_start || edge.from;
                                const edgeEnd = edge.edge_end || edge.to;
                                const edgeLabel = edge.label || '';
                                
                                // 参照元・参照先のノードが存在するかチェック
                                const fromNode = defaultThinkingProcess.nodes.get(edgeStart);
                                const toNode = defaultThinkingProcess.nodes.get(edgeEnd);
                                
                                if (!fromNode) {
                                    console.warn(`⚠️ エッジ ${edgeId} の参照元ノード ${edgeStart} が存在しません`);
                                    skipCount++;
                                    return;
                                }
                                if (!toNode) {
                                    console.warn(`⚠️ エッジ ${edgeId} の参照先ノード ${edgeEnd} が存在しません`);
                                    skipCount++;
                                    return;
                                }
                                
                                // エッジを追加
                                if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess.addReloadEdge) {
                                    defaultThinkingProcess.addReloadEdge(
                                        edgeId,
                                        edgeStart,
                                        edgeEnd,
                                        edgeLabel
                                    );
                                    successCount++;
                                    console.log(`✅ エッジ ${edgeId} の復元が完了しました (${i + 1}/${edgeArray.length})`);
                                } else {
                                    console.error("❌ defaultThinkingProcessまたはaddReloadEdgeメソッドが見つかりません");
                                    skipCount++;
                                }
                            });
                            
                            console.log(`🎯 エッジ復元完了: 成功=${successCount}個, スキップ=${skipCount}個`);
                        }, 100); // 100ms遅延
                    } else {
                        console.log("⚠️ エッジデータが存在しないか、配列でありません");
                        console.log("📊 edgeArray:", edgeArray);
                        console.log("📊 edgeArray type:", typeof edgeArray);
                        console.log("📊 edgeArray isArray:", Array.isArray(edgeArray));
                    }

                    console.log(`${selected_date}の過去データ表示完了`);
                    
                    // 復元完了状況を遅延して確認（エッジ復元処理完了後）
                    setTimeout(() => {
                        const finalNodeCount = defaultThinkingProcess ? defaultThinkingProcess.nodes.length : 0;
                        const finalEdgeCount = defaultThinkingProcess ? defaultThinkingProcess.edges.length : 0;
                        console.log(`📊 最終復元状況: ノード数=${finalNodeCount}, エッジ数=${finalEdgeCount}`);
                    }, 200);
                    
                    // 過去データ表示フラグを設定
                    if (typeof defaultThinkingProcess !== 'undefined') {
                        defaultThinkingProcess.isViewingPastData = true;
                        console.log("過去データ表示モードを有効化しました");
                            try {
                                // ビュー切替に合わせて操作系ボタンを視覚的に無効化
                                $('#process_addNode, #process_startEditEdge, #process_removeNode').addClass('disabled').prop('disabled', true);
                            } catch (e) {
                                /* ignore */
                            }
                        try {
                            // ノードをすべて固定して移動できなくする
                            const allNodes = defaultThinkingProcess.nodes.get();
                            if (Array.isArray(allNodes) && allNodes.length > 0) {
                                defaultThinkingProcess.nodes.update(allNodes.map(n => ({
                                    id: n.id,
                                    fixed: true,
                                    color: n.color,
                                    shape: n.shape,
                                    font: n.font,
                                    size: n.size,
                                    borderWidth: n.borderWidth,
                                    borderWidthSelected: n.borderWidthSelected,
                                    image: n.image,
                                    group: n.group
                                })));
                            }
                            // vis.Network のノードドラッグを無効化
                            if (defaultThinkingProcess.ownNetwork && typeof defaultThinkingProcess.ownNetwork.setOptions === 'function') {
                                defaultThinkingProcess.ownNetwork.setOptions({ interaction: { dragNodes: false } });
                            }
                            // キーボードによる削除操作も無効化
                            if (typeof defaultThinkingProcess.removeKeyboardListeners === 'function') {
                                defaultThinkingProcess.removeKeyboardListeners();
                            }
                        } catch (e) {
                            console.error('過去表示モード切替処理でエラー:', e);
                        }
                    }
                    
                    // 過去データ表示の視覚的フィードバック
                    const networkContainer = document.getElementById("myProcessnetwork2") || document.getElementById("myProcessnetwork");
                    if (networkContainer) {
                        networkContainer.style.border = "3px solid #ff6b6b";
                        networkContainer.style.backgroundColor = "rgba(255, 107, 107, 0.1)";
                    }

                } else {
                    console.warn("履歴データが見つかりません");
                    // データがない場合はマップをクリア
                    if (typeof defaultThinkingProcess !== 'undefined') {
                        defaultThinkingProcess.nodes.clear();
                        defaultThinkingProcess.edges.clear();
                    }
                }

                if (data.status && data.status !== "success") {
                    console.warn("正常終了していません:", data.status, data.message);
                }
            } catch (e) {
                console.error("JSONパース失敗:", e);
                console.error("レスポンス内容:", response);
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX通信エラー:", status, error);
            console.error("レスポンス:", xhr.responseText);
        }
    });
};

// 日付シークバーを作成・表示する関数
const createDateSeekBar = (dates) => {
    if (!Array.isArray(dates) || dates.length === 0) {
        console.log("日付データがありません");
        return;
    }

    // 既存のシークバーがあれば削除
    const existingSeekBar = document.getElementById('dateSeekBarContainer');
    if (existingSeekBar) {
        existingSeekBar.remove();
    }

    // シークバーコンテナを作成
    const seekBarContainer = document.createElement('div');
    seekBarContainer.id = 'dateSeekBarContainer';
    seekBarContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        min-width: 400px;
        text-align: center;
    `;

    // タイトル
    const title = document.createElement('div');
    title.textContent = 'マップの履歴を表示';
    title.style.cssText = `
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
    `;

    // 日付表示
    const dateDisplay = document.createElement('div');
    dateDisplay.id = 'currentDateDisplay';
    dateDisplay.style.cssText = `
        font-size: 14px;
        color: #666;
        margin-bottom: 10px;
    `;

    // スライダー
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'dateSeekBar';
    slider.min = 0;
    slider.max = dates.length - 1;
    slider.value = dates.length - 1; // 最新の日付を初期値とする
    slider.style.cssText = `
        width: 100%;
        margin: 10px 0;
        cursor: pointer;
    `;

    // 日付ラベル（最初と最後）
    const dateLabels = document.createElement('div');
    dateLabels.style.cssText = `
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #999;
        margin-top: 5px;
    `;

    const firstDate = document.createElement('span');
    firstDate.textContent = dates[0];
    const lastDate = document.createElement('span');
    lastDate.textContent = dates[dates.length - 1];

    dateLabels.appendChild(firstDate);
    dateLabels.appendChild(lastDate);

    // 現在表示ボタン
    const showCurrentButton = document.createElement('button');
    showCurrentButton.textContent = '現在のマップに戻る';
    showCurrentButton.style.cssText = `
        background: #007cba;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        margin: 0 5px;
        font-size: 12px;
    `;

    // 閉じるボタン
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        background: #dc3545;
        color: white;
        border: none;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        cursor: pointer;
        position: absolute;
        top: 5px;
        right: 5px;
        font-size: 16px;
        line-height: 1;
    `;

    // 初期表示の日付を設定
    const updateDateDisplay = (index) => {
        dateDisplay.textContent = `選択中: ${dates[index]} (${index + 1}/${dates.length})`;
    };
    updateDateDisplay(slider.value);

    // スライダーの変更イベント
    slider.addEventListener('input', (e) => {
        const selectedIndex = parseInt(e.target.value);
        updateDateDisplay(selectedIndex);
        const selectedDate = dates[selectedIndex];
        
        // 選択された日付のマップデータを取得
        getPassDataFromDB(selectedDate);
    });

    // 現在のマップに戻るボタンのイベント
    showCurrentButton.addEventListener('click', () => {
        // 現在のマップデータを再表示
        displayTriggerData("allRE", "trigger_area");
    });

    // 閉じるボタンのイベント
    closeButton.addEventListener('click', () => {
        seekBarContainer.remove();
    });

    // 要素を組み立て
    seekBarContainer.appendChild(closeButton);
    seekBarContainer.appendChild(title);
    seekBarContainer.appendChild(dateDisplay);
    seekBarContainer.appendChild(slider);
    seekBarContainer.appendChild(dateLabels);
    seekBarContainer.appendChild(showCurrentButton);

    // ドキュメントに追加
    document.body.appendChild(seekBarContainer);

    console.log("シークバーを作成しました。日付数:", dates.length);
};


const makeTriggerInList = (id, activity_type, concept_label, content, timestamp, trigger_on) => {
    // 左側の発話ノードのリストのところのノードのDOMを構成する
    let backColor = "white";
    let borderColor = "#67796b";
    let borderWidth = 1;
    if(trigger_on == 1){
        backColor = "#979997";
        borderWidth = 2;
    }
    return $(`(<div id="${id}"
                 style='border: solid "${borderWidth}"px "${borderColor}"; background: ${backColor};'
                 class='trigger_in_list'
                 trigger_content='${content}'
                 timestamp='${timestamp}'
                 trigger_on='${trigger_on}'
                 activity_type='${activity_type}'
            >【${timestamp}：${activity_type}】<br>${concept_label}：<br>${content}</div>`);
}

// 思考過程表出化マップを表示
const displayTriggerData = (mode, display_target_area_id) => {
    // 現在データ表示時は過去データフラグを解除
    if (typeof defaultThinkingProcess !== 'undefined') {
        defaultThinkingProcess.isViewingPastData = false;
        console.log("現在データ表示により過去データモードを無効化");
        
        // 過去データ表示の視覚的要素をリセット
        const networkContainer = document.getElementById("myProcessnetwork2") || document.getElementById("myProcessnetwork");
        if (networkContainer) {
            networkContainer.style.border = "";
            networkContainer.style.backgroundColor = "";
        }
    }
    
    process_mode = mode;
    let node_x = 0;
    let node_y = 0;
    let from_id = "";
    if(mode=="all" || mode == "allRE"){
        const conceptdisplay_area = $(`#conceptdisplay`); // 何の認知活動かを表示するエリア
        const target_area = $(`#${display_target_area_id}`); // DOMエリア
        $('#trigger_area_list').html("");
        let selected_node_id;
        let selected_concept_id;
        // 初回読み込み時に何の認知活動かを表示する
        if(mode=="all"){
            selected_node_id = _jm.get_selected_node().id;
            var jmnode = document.getElementsByTagName("jmnode");
            for(var i=0; i<jmnode.length; i++){
                if(selected_node_id == jmnode[i].getAttribute("nodeid")){
                    selected_concept_id = jmnode[i].getAttribute("concept_id");
                }
            }
            document.getElementById('conceptdisplay').setAttribute('nodeId', selected_node_id);
            document.getElementById('conceptdisplay').setAttribute('conceptId', selected_concept_id);
        }else{
            const conceptDisplay = document.getElementById('conceptdisplay');
            selected_node_id = conceptDisplay.getAttribute('nodeid');
            selected_concept_id =conceptDisplay.getAttribute('conceptid');
        }

        getProcessMapDataFromDB ((trigger_list_info) => {
            //concept_labelを表示
            const concept_label = trigger_list_info['selected_concept'];
            conceptdisplay_area.html(concept_label);
            let j = 0;

            // versionノードは最新のもの1つだけ表示する
            if (Array.isArray(trigger_list_info.node_versions) && trigger_list_info.node_versions.length > 0) {
                const v = trigger_list_info.node_versions[trigger_list_info.node_versions.length - 1];
                // 表示するテキストは、選択されたノードの content を優先して使う
                let selectedContent = '';
                try {
                    // まずマインドマップの現在選択ノード（jmnode）のテキストを取得して優先使用
                    if (typeof _jm !== 'undefined' && _jm.get_selected_node) {
                        const sel = _jm.get_selected_node();
                        if (sel && sel.id) {
                            const jmnodeEl = document.querySelector(`jmnode[nodeid="${sel.id}"]`);
                            if (jmnodeEl) {
                                // jmnode の子要素にアイコン等があるため、最初のテキストノードを取り出す
                                const firstTextNode = Array.from(jmnodeEl.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim() !== '');
                                if (firstTextNode) {
                                    selectedContent = firstTextNode.nodeValue.trim();
                                } else {
                                    // fallback: 全てのテキストを結合してトリム
                                    selectedContent = jmnodeEl.textContent.replace(/\s+/g, ' ').trim();
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.warn('selected jmnode lookup failed', e);
                }
                // 次に、server から渡された onode.content を参照（あれば使用）
                if (!selectedContent && Array.isArray(trigger_list_info.onode) && trigger_list_info.onode.length > 0) {
                    selectedContent = trigger_list_info.onode[0].content || '';
                }
                const textForVersion = selectedContent || v.content || '';
                defaultThinkingProcess.addVersionNode(v.node_version_id, textForVersion, "versions", v.appeared_at, node_x, node_y);
                if (from_id != "") {
                    defaultThinkingProcess.addVersionEdge(from_id, v.node_version_id);
                }
                from_id = v.node_version_id;
                // 複数表示しないため、node_x の増加は不要
            }
            // triggerの候補一覧
            trigger_list_info.trigger_candidate.forEach((u) => {
                if(u){
                    const trigger_dom = makeTriggerInList(u.activity_id, u.activity_type, u.concept_label, u.content, u.appeared_at, u.trigger_on);
                    target_area.append(trigger_dom); // 挿入
                }
            });
            // triggerノードの表示
            trigger_list_info.trigger.forEach((u) => {
                j++;
                if(u){
                    let from_node = u.node_version_from;
                    let to_node = u.node_version_to;
                    let edge_ids = defaultThinkingProcess.ownNetwork.getConnectedEdges(from_node);
                    let num = 0;
                    for(i = 0; i<edge_ids.length; i++){
                        if(defaultThinkingProcess.edges.get(edge_ids[i]).group == "versionEdges" || defaultThinkingProcess.edges.get(edge_ids[i]).group == "trigger_from"){
                            //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                            if(defaultThinkingProcess.ownNetwork.getConnectedNodes(edge_ids[i])[1] != from_node){
                                num = i;
                            }
                        }
                    }
                    let edge_id = edge_ids[num];
                    defaultThinkingProcess.addTriggerNode("Reload", u.trigger_id, edge_id, from_node, to_node, u.activity_id, u.content, u.activity_type, u.activity_time, u.x, u.y);
                }
            });
            console.log("onodeの中身:", trigger_list_info.onode);
            console.log("pedgeの中身:", trigger_list_info.pedge);
            console.log("datesの中身:", trigger_list_info.dates);

            trigger_list_info.onode.map((n) => {
                defaultThinkingProcess.addReloadNode(n.object_node_id, n.content, n.object_nodes_type, n.node_x, n.node_y, n.status, n.purpose, n.evaluation_good, n.attribution, n.application, n.estimated_time);
            });
            trigger_list_info.pedge.map((n) => {
                console.log("🔍 エッジデータ確認:", n);
                // object_edge_idが正しいフィールド名
                const edgeId = n.object_edge_id || n.process_edge_id;
                if (edgeId) {
                    defaultThinkingProcess.addReloadEdge(edgeId, n.edge_start, n.edge_end, n.label);
                } else {
                    console.warn("⚠️ エッジIDが見つかりません:", n);
                }
            });

            // —————————————— 既存のシークバーに日付データを設定 ——————————————
            const timelineDates = trigger_list_info.dates;  // 日付配列
            const slider = document.getElementById("timeline_slider");
            const label = document.getElementById("timeline_label");
            const returnButton = document.getElementById("return_to_current");
            const historyIndicator = document.getElementById("history_indicator");
            
            if (timelineDates && timelineDates.length > 0 && slider && label) {
                console.log("日付データが取得されました:", timelineDates);
                
                // スライダーの設定
                slider.max = timelineDates.length - 1;
                slider.value = timelineDates.length - 1; // 最新の日付を初期値
                
                // 現在選択されている日付を表示
                const currentIndex = parseInt(slider.value);
                const selectedDate = timelineDates[currentIndex];
                label.textContent = `${selectedDate} (${currentIndex + 1}/${timelineDates.length})`;
                
                console.log("初期選択日付（最新）:", selectedDate);
                
                // 既存のイベントリスナーを削除（重複を防ぐため）
                const newSlider = slider.cloneNode(true);
                slider.parentNode.replaceChild(newSlider, slider);
                
                // スライダーのinputイベント（リアルタイム更新）
                newSlider.addEventListener('input', function() {
                    const index = parseInt(this.value);
                    const selectedDate = timelineDates[index];
                    label.textContent = `${selectedDate} (${index + 1}/${timelineDates.length})`;
                    console.log("選択された日付:", selectedDate);
                });
                
                // スライダーのchangeイベント（ドラッグ終了時に過去データ取得）
                newSlider.addEventListener('change', function() {
                    const index = parseInt(this.value);
                    const selectedDate = timelineDates[index];
                    console.log("選択確定日付:", selectedDate);
                    
                    // 最新の日付が選択されていない場合のみ過去データを取得
                    if (index < timelineDates.length - 1) {
                        console.log("過去データを取得します:", selectedDate);
                        getPassDataFromDB(selectedDate);
                        
                        // 過去表示インジケーターを表示
                        if (historyIndicator) {
                            historyIndicator.style.display = "inline";
                        }
                    } else {
                        console.log("最新データが選択されているため、現在のマップを表示");
                        // 現在のマップを再表示
                        displayTriggerData("allRE", "trigger_area");
                        
                        // 過去データ表示フラグを解除
                        if (typeof defaultThinkingProcess !== 'undefined') {
                            defaultThinkingProcess.isViewingPastData = false;
                            console.log("過去データ表示モードを無効化しました（最新データ選択）");
                            try {
                                $('#process_addNode, #process_startEditEdge, #process_removeNode').removeClass('disabled').prop('disabled', false);
                            } catch (e) { /* ignore */ }
                            try {
                                // ノード固定を解除（ただしタグノードなどは固定のまま）
                                const allNodes = defaultThinkingProcess.nodes.get();
                                if (Array.isArray(allNodes) && allNodes.length > 0) {
                                    defaultThinkingProcess.nodes.update(allNodes.map(n => ({
                                        id: n.id,
                                        fixed: n.group === 'topic-tag' ? true : false,
                                        color: n.color,
                                        shape: n.shape,
                                        font: n.font,
                                        size: n.size,
                                        borderWidth: n.borderWidth,
                                        borderWidthSelected: n.borderWidthSelected,
                                        image: n.image,
                                        group: n.group
                                    })));
                                }
                                // vis.Network のノードドラッグを有効化
                                if (defaultThinkingProcess.ownNetwork && typeof defaultThinkingProcess.ownNetwork.setOptions === 'function') {
                                    defaultThinkingProcess.ownNetwork.setOptions({ interaction: { dragNodes: true } });
                                }
                                // キーボードリスナーを復元
                                if (typeof defaultThinkingProcess.setupKeyboardListeners === 'function') {
                                    defaultThinkingProcess.setupKeyboardListeners();
                                }
                            } catch (e) {
                                console.error('過去表示解除処理でエラー:', e);
                            }
                        }
                        
                        // 過去表示インジケーターを非表示
                        if (historyIndicator) {
                            historyIndicator.style.display = "none";
                        }
                    }
                });
                
                // 「現在に戻る」ボタンのイベント
                if (returnButton) {
                    // 既存のイベントリスナーを削除
                    const newReturnButton = returnButton.cloneNode(true);
                    returnButton.parentNode.replaceChild(newReturnButton, returnButton);
                    
                    newReturnButton.addEventListener('click', function() {
                        console.log("現在のマップに戻ります");
                        
                        // スライダーを最新位置に戻す
                        newSlider.value = timelineDates.length - 1;
                        const latestDate = timelineDates[timelineDates.length - 1];
                        label.textContent = `${latestDate} (${timelineDates.length}/${timelineDates.length})`;
                        
                        // 過去表示インジケーターを非表示
                        if (historyIndicator) {
                            historyIndicator.style.display = "none";
                        }
                        
                        // 現在のマップを再表示
                        displayTriggerData("allRE", "trigger_area");
                        
                        // 過去データ表示フラグを解除
                        if (typeof defaultThinkingProcess !== 'undefined') {
                            defaultThinkingProcess.isViewingPastData = false;
                            console.log("過去データ表示モードを無効化しました");
                            try {
                                $('#process_addNode, #process_startEditEdge, #process_removeNode').removeClass('disabled').prop('disabled', false);
                            } catch (e) { /* ignore */ }
                            try {
                                // ノード固定を解除（ただしタグノードなどは固定のまま）
                                const allNodes = defaultThinkingProcess.nodes.get();
                                if (Array.isArray(allNodes) && allNodes.length > 0) {
                                    defaultThinkingProcess.nodes.update(allNodes.map(n => ({
                                        id: n.id,
                                        fixed: n.group === 'topic-tag' ? true : false,
                                        color: n.color,
                                        shape: n.shape,
                                        font: n.font,
                                        size: n.size,
                                        borderWidth: n.borderWidth,
                                        borderWidthSelected: n.borderWidthSelected,
                                        image: n.image,
                                        group: n.group
                                    })));
                                }
                                // vis.Network のノードドラッグを有効化
                                if (defaultThinkingProcess.ownNetwork && typeof defaultThinkingProcess.ownNetwork.setOptions === 'function') {
                                    defaultThinkingProcess.ownNetwork.setOptions({ interaction: { dragNodes: true } });
                                }
                                // キーボードリスナーを復元
                                if (typeof defaultThinkingProcess.setupKeyboardListeners === 'function') {
                                    defaultThinkingProcess.setupKeyboardListeners();
                                }
                            } catch (e) {
                                console.error('過去表示解除処理でエラー:', e);
                            }
                        }
                        
                        // 現在表示に戻った時の視覚的フィードバック
                        const networkContainer = document.getElementById("myProcessnetwork2") || document.getElementById("myProcessnetwork");
                        if (networkContainer) {
                            networkContainer.style.border = "3px solid #4CAF50";
                            networkContainer.style.backgroundColor = "#f5fff5";
                            
                            // 2秒後に通常の表示に戻す
                            setTimeout(() => {
                                networkContainer.style.border = "";
                                networkContainer.style.backgroundColor = "";
                            }, 2000);
                        }
                    });
                }
                
            } else {
                console.log("日付データがありません");
                if (label) {
                    label.textContent = "日付データなし";
                }
                if (slider) {
                    slider.max = 0;
                    slider.value = 0;
                }
                if (returnButton) {
                    returnButton.style.display = "none";
                }
            }

            addeventdisplayTriggerData();
            
        });
    }
    
}

const addeventdisplayTriggerData = () => {
    let mousedownId = null;
    const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const accordionItem = this.parentElement;
            accordionItem.classList.toggle('active');
        });
    });
    const feedbackarea = document.getElementsByClassName("accordion-item");
    for(var i=0; i<feedbackarea.length; i++){
        feedbackarea[i].style.display = "none";
    }
    $(`#trigger_area`).on('mousedown', (e) => {
    // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
    mousedownId = null;
    const overed_node = e.target;
    if(overed_node.getAttribute('trigger_on')==='0'){
        mousedownId = overed_node.getAttribute('id');
    }
    });
    $(`#trigger_area`).on('mouseleave', (e) => {
    // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
        // $(`#trigger_click`).empty();
    });
    $(`.trigger_in_list`).on('click', (e) => {
        // リスト内の発話ノードにマウスイベント(左クリック)を追加
        const clicked_trigger = e.target;
        document.getElementById("trigger_click").innerHTML="<input type='button' class='triggerbutton' id='triggerFromList' value='ノードとして追加'>";

        $(`#triggerFromList`).on("click", () => {
            const selected_node_id = defaultThinkingProcess.ownNetwork.getSelection().nodes[0];
            const selected_edge_id = defaultThinkingProcess.ownNetwork.getSelection().edges;
            const activity_id = clicked_trigger.getAttribute('id');
            const t_label = clicked_trigger.innerHTML;
            const t_type = clicked_trigger.getAttribute('activity_type');
            const t_time = clicked_trigger.getAttribute('timestamp');
            let edge_id =selected_edge_id;
            let trigger_id = defaultThinkingProcess.generateUniqueNumberText();
            let num = 0 ;
            let selected_node_group = defaultThinkingProcess.nodes.get(selected_node_id).group;

            if(selected_node_id && selected_node_group == "versions" || selected_node_group == "versionsBro"){
                //versionのノードが選択されている時，それにつながるedge_idを取得し，右側のedge_idにつながるnode_idを取得する
                for(i = 0; i<selected_edge_id.length; i++){
                    let selected_edge_group = defaultThinkingProcess.edges.get(selected_edge_id[i]).group;
                    if(selected_edge_group == "versionEdges" || selected_edge_group == "trigger_from"){
                        //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                        if(defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[i])[1] != selected_node_id){
                            num = i;
                        }
                    }
                }
                edge_id = selected_edge_id[num];
                const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[num]);
                let from_node = connect_node_ids[0];
                let to_node = connect_node_ids[1];
                if(defaultThinkingProcess.edges.get(selected_edge_id[num]).group == "trigger_to"){
                    // triggerを指しているedgeだった場合，その先のversionノードを取得する
                    let e = defaultThinkingProcess.ownNetwork.getConnectedEdges(connect_node_ids[1]);
                    let n = defaultThinkingProcess.ownNetwork.getConnectedNodes(e[1])
                    to_node = n[1];
                }
                defaultThinkingProcess.addTriggerNode("New", trigger_id, edge_id, from_node, to_node, activity_id, t_label, t_type, t_time, null, null);
                document.getElementById("trigger_click").innerHTML="";
                return;
            }else if(selected_edge_id.length == 1 && (defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "versionEdges" || defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "trigger_from")){
                //versionもしくはtriggerのエッジが選択されている時，それにつながるnode_id(2つ)を取得する
                const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id);
                let from_node = connect_node_ids[0];
                let to_node = connect_node_ids[1];
                if(defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "trigger_from"){
                    // triggerを指しているedgeだった場合，その先のversionノードを取得する
                    let e = defaultThinkingProcess.ownNetwork.getConnectedEdges(connect_node_ids[1]);
                    let n = defaultThinkingProcess.ownNetwork.getConnectedNodes(e[1])
                    to_node = n[1];
                }
                defaultThinkingProcess.addTriggerNode("New", trigger_id, selected_edge_id[0], from_node, to_node, activity_id, t_label, t_type, t_time, null, null);
                document.getElementById("trigger_click").innerHTML="";
                return;
            }else{
                alert('追加したい箇所のノードまたはエッジを選択してください');
                return;
            }
        });
    });
    $(`.trigger_in_list`).on('contextmenu', (e) => {
        // リスト内の発話ノードにマウスイベント(右クリック)を追加
        const clicked_trigger = e.target;
        document.getElementById("trigger_click").innerHTML="<input type='button' class='triggerbutton' id='triggerMapShow' value='マインドマップを表示'>";
        $(`#triggerMapShow`).on("click", () => {
            console.log(clicked_node.getAttribute('id'));
            document.getElementById("trigger_click").innerHTML="";
        });
    });
}

// 学習者がオリジナルのTriggerを入力できる箇所を作成
function inputTriggerAreaOpen(){
    $('#trigger_area_display').css('height','auto');
    $('#trigger_area_add').css('height','auto');
    $('#trigger_add').css('height','auto');
    document.getElementById('inputTriggerbutton').value = " × 閉じる";
    document.getElementById('inputTriggerbutton').onclick = inputTriggerAreaClose;

    // 日時入力欄
    let input_time = document.createElement('input');
    input_time.type = 'datetime-local';
    input_time.id = 'trigger_time';
    document.getElementById("trigger_add").appendChild(input_time);

    // 活動入力欄
    let input_activity = document.createElement('select');
    input_activity.id = 'trigger_activity';
    document.getElementById("trigger_add").appendChild(input_activity);

    // 活動一覧
    let s0 = document.createElement('option');
    s0.value = '';
    s0.textContent = '-何の活動を行いましたか？-';
    let s1 = document.createElement('option');
    s1.value = '自己内対話'
    s1.textContent = '自己内対話'
    let s2 = document.createElement('option');
    s2.value = '議論資料作成'
    s2.textContent = '議論資料作成'
    let s3 = document.createElement('option');
    s3.value = '議論内省'
    s3.textContent = '議論内省'
    let s4 = document.createElement('option');
    s4.value = '論文執筆'
    s4.textContent = '論文執筆'
    let s5 = document.createElement('option');
    s5.value = '論文読解'
    s5.textContent = '論文読解'
    document.getElementById("trigger_activity").appendChild(s0);
    document.getElementById("trigger_activity").appendChild(s1);
    document.getElementById("trigger_activity").appendChild(s2);
    document.getElementById("trigger_activity").appendChild(s3);
    document.getElementById("trigger_activity").appendChild(s4);
    document.getElementById("trigger_activity").appendChild(s5);

    // 自由記述欄
    let input_content = document.createElement('textarea');
    input_content.id = 'trigger_content';
    input_content.placeholder = '何をきっかけに思考が変化しましたか？';
    input_content.rows = 3
    document.getElementById("trigger_add").appendChild(input_content);
    
    // 入力ボタン 
    let input_button = document.createElement('input');
    input_button.type = 'button';
    input_button.className = 'triggerbutton';
    input_button.id = 'triggerNew'
    input_button.value = 'ノードとして追加';
    input_button.onclick = inputTrigger;
    document.getElementById("trigger_add").appendChild(input_button);
    
  }

//   Trigger入力箇所を閉じる処理
function inputTriggerAreaClose(){
    $('#trigger_area_display').css('height','100px');
    $('#trigger_area_add').css('height','20px');
    $('#trigger_add').css('height','0px');
    document.getElementById("trigger_time").remove();
    document.getElementById("trigger_activity").remove();
    document.getElementById("trigger_content").remove();
    document.getElementById("triggerNew").remove();
    document.getElementById('inputTriggerbutton').value = "＋ 活動を入力";
    document.getElementById('inputTriggerbutton').onclick = inputTriggerAreaOpen;
}

// 入力されたTriggerをマップに表示
function inputTrigger(){
    let trigger_id = defaultThinkingProcess.generateUniqueNumberText();
    const t_type = document.getElementById("trigger_activity").value;
    const t_time = document.getElementById("trigger_time").value.replace('T', ' ');
    let content = document.getElementById("trigger_content").value;
    const t_label = "【"+t_time+"："+t_type+"】<br>"+content+"";
    
    if(!t_type){
        alert('どの活動を行ったのか入力してください');
        return;
    }else if(!content){
        alert('どのような活動を行ったのか入力してください');
        return;
    }

    const selected_node_id = defaultThinkingProcess.ownNetwork.getSelection().nodes[0];
    const selected_edge_id = defaultThinkingProcess.ownNetwork.getSelection().edges;
    let edge_id =selected_edge_id;
    let num = 0 ;
    let selected_node_group = defaultThinkingProcess.nodes.get(selected_node_id).group;

    if(selected_node_id && selected_node_group == "versions" || selected_node_group == "versionsBro"){ 
        //versionのノードが選択されている時，それにつながるedge_idを取得し，右側のedge_idにつながるnode_idを取得する
        for(i = 0; i<selected_edge_id.length; i++){
            let selected_edge_group = defaultThinkingProcess.edges.get(selected_edge_id[i]).group
            if(selected_edge_group == "versionEdges" || selected_edge_group == "trigger_from"){
                //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                if(defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[i])[1] != selected_node_id){
                    num = i;
                }
            }
        }
        edge_id = selected_edge_id[num];
        const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[num]);
        let from_node = connect_node_ids[0];
        let to_node = connect_node_ids[1];
        if(defaultThinkingProcess.edges.get(selected_edge_id[num]).group == "trigger_to"){
            // triggerを指しているedgeだった場合，その先のversionノードを取得する
            let e = defaultThinkingProcess.ownNetwork.getConnectedEdges(connect_node_ids[1]);
            let n = defaultThinkingProcess.ownNetwork.getConnectedNodes(e[1])
            to_node = n[1];
        }
         defaultThinkingProcess.addTriggerNode("New", trigger_id, edge_id, from_node, to_node, null, t_label, t_type, t_time, null, null)
        // document.getElementById("trigger_time").reset();
        // document.getElementById("trigger_activity").reset();
        // document.getElementById("trigger_content").reset();   
    }else if(selected_edge_id.length == 1 && (defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "versionEdges" || defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "trigger_from")){
        //versionもしくはtriggerのエッジが選択されている時，それにつながるnode_id(2つ)を取得する
        const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id);
        let from_node = connect_node_ids[0];
        let to_node = connect_node_ids[1];
        if(defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "trigger_from"){
            // triggerを指しているedgeだった場合，その先のversionノードを取得する
            let e = defaultThinkingProcess.ownNetwork.getConnectedEdges(connect_node_ids[1]);
            let n = defaultThinkingProcess.ownNetwork.getConnectedNodes(e[1])
            to_node = n[1];
        }
         defaultThinkingProcess.addTriggerNode("New", trigger_id, selected_edge_id[0], from_node, to_node, null, t_label, t_type, t_time, null, null)
        // document.getElementById("trigger_time").reset();
        // document.getElementById("trigger_activity").reset();
        // document.getElementById("trigger_content").reset();   
        return;
    }else{
        alert('追加したい箇所のノードまたはエッジを選択してください');
        return;
    }
}

function ShowRelatedProcess(mode){
    // checkboxの状態を取得
    check = document.getElementById("checkbox_process");

    // 兄弟ノードを含めた表示
    if(mode=='brother'){
        // checlboxがチェックされている時の処理
        if(check.checked == true){
            console.log(check);
            displayTriggerData("AddBrother", "trigger_area_list");
        }
        else{
            console.log(check);
            defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
            displayTriggerData("allRE", "trigger_area_list");
        }
    }// 整合性ラベルのついたノードを含めた表示
    if(mode=='consistency'){
        console.log(mode);
        // checlboxがチェックされている時の処理
        if(check.checked == true){
            
        }
        else{
          
        }
    }
    
}

function showThinkingProcessMap() {
    document.getElementById('feedback_area').style.display = "block";
    document.getElementById('xml_upload_area').style.display = "block";
    $('#process_network_container').css('display', 'flex');
    $('#process_network_container').css('width', 'calc(-350px + 100vw)');
    $('#process_network_container').css('height', '80vh'); // 明示的に高さを設定
    $('#jsmind_container').css('width', 'calc(-350px + 100vw)');
    $('#jsmind_container').css('min-width', '300px');
    $('#jsmind_container').css('height', '40%');
    $('#jsmind_container').css('float', 'left');
    $('#mind').css('width', '280px');
    $('#mind').css('height', '90%');
    $('#mind').css('float', 'right');
    $('#mind').css('display', 'block');
    $('#document').hide();
    const frame_dom = document.getElementsByClassName("inquiry_area");
    frame_dom[0].style.border = "solid 5px #ccc";
    $('#side_menu .inquiry_area').css('height', '45%');
    $("#myProcessnetwork").css({
        width: '100%',
        height: '100%' // myProcessnetworkの全領域を使用
    });

    // trigger_areaを非表示にする
    $('#trigger_area').css('display', 'none');

    defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
    displayTriggerData("all", "trigger_area_list");
    
    // vis.jsに明示的にリサイズを通知（複数回実行して確実にリサイズ）
    setTimeout(() => {
        if (defaultThinkingProcess && defaultThinkingProcess.ownNetwork) {
            defaultThinkingProcess.ownNetwork.redraw();
            defaultThinkingProcess.ownNetwork.fit();
            // 追加のリサイズ処理
            setTimeout(() => {
                defaultThinkingProcess.ownNetwork.redraw();
            }, 100);
        }
    }, 200);

    // シークバーのイベントリスナーを追加
    const slider = document.getElementById("timeline_slider");
    const label = document.getElementById("timeline_label");

    slider.addEventListener("input", (event) => {
        const value = event.target.value;
        label.textContent = `${value}%`;

        // シークバーの値に応じて表示内容を変更する処理
        updateThinkingProcessMap(value);
    });
}

// シークバーの値に応じてマップを更新する関数
function updateThinkingProcessMap(value) {
    //console.log(`シークバーの値: ${value}`);
    // ここにシークバーの値に応じたマップの更新ロジックを実装
    // 例: ノードやエッジの表示/非表示を切り替える
}
function closeThinkingProcessMap(){
  
    document.getElementById('feedback_area').style.display = "block";
    document.getElementById('xml_upload_area').style.display = "block";
    $('#process_network_container').css('display','none');
    $('#jsmind_container').css('width','calc(100vw - 350px)');
    $('#jsmind_container').css('min-width', '300px');
    $('#jsmind_container').css('height','100%');
    $('#jsmind_container').css('float', 'left');
    $('#mind').css('width', '280px');
    $('#mind').css('height','100%');
    $('#mind').css('float', 'right');
    $('#mind').css('display', 'block');
}

// nodeIDをidにもつノードのtypeがラベルの時，思考過程表出化マップを開く
function proposeThinkingProcess(nodeID){

    const nodeClass = Get_NodeInfo(nodeID, "class").replace(" selected", "");
    console.log(nodeClass);
    if(nodeClass =='primary_label' || nodeClass =='issue_label' || nodeClass =='consistency_label' ){
        var label_name = "注目すべきである";
        switch (nodeClass){
            case 'primary_label':
                label_name = "主軸である";
                break;
            case 'issue_label':
                label_name = "課題である";
                break;
            case 'consistency_label':
                label_name = "整合性を保つべきである";
                break;
        }
        alert("「"+ label_name +"」と考えていた思考が変わりましたね．なぜそのように考えたのかを振り返ってみましょう！");
        showThinkingProcessMap();
    }
}

// ロードした際の関数
window.addEventListener('load', () => {

    // 初期表示時点でいくつかのオブジェクトを非表示にする
    document.getElementById("process_network_container").style.display="none";
    defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
    // マップ編集ボタンにイベント付与
    $(`#process_addNode`).on("click", e => {
        if (defaultThinkingProcess && defaultThinkingProcess.isViewingPastData) {
            console.log('過去データ表示中のため、ノード追加は無効化されています');
            try { alert('過去の表示中はノード追加できません'); } catch (err) { /* ignore */ }
            return;
        }
        defaultThinkingProcess.addNewNode();
    });
    $(`#process_startEditEdge`).on("click", e => {
        if (defaultThinkingProcess && defaultThinkingProcess.isViewingPastData) {
            console.log('過去データ表示中のため、エッジ追加は無効化されています');
            try { alert('過去の表示中はエッジ追加できません'); } catch (err) { /* ignore */ }
            return;
        }
        defaultThinkingProcess.SelectEditEdge();
    });
    $(`#process_removeNode`).on("click", e => {
        if (defaultThinkingProcess && defaultThinkingProcess.isViewingPastData) {
            console.log('過去データ表示中のため、ノード削除は無効化されています');
            try { alert('過去の表示中はノード削除できません'); } catch (err) { /* ignore */ }
            return;
        }
        defaultThinkingProcess.deleteNode();
    });
    $(`#process_ZoomIn`).on("click", e => {
        defaultThinkingProcess.zoomIn();
    });
    $(`#process_ZoomOut`).on("click", e => {
        defaultThinkingProcess.zoomOut();
    });

    const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', function () {
        const accordionItem = this.parentElement;
        accordionItem.classList.toggle('active');
      });
    });
});
