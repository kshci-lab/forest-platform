// 議論内省マップに関する処理プログラム
let defaultThinkingProcess;
let defaultRecordThinkingProcess;
let defaultShowThinkingProcess;
let globalParams = null; //クリックされたネットワークノード
let undoRedoManager = null; // Undo/Redo管理インスタンス

// Undo/Redo管理クラス（レガシー互換用。現在はモジュール版を使用）
class LegacyUndoRedoManager {
    constructor() {
        this.undoStack = []; // 元に戻す操作のスタック
        this.redoStack = []; // やり直す操作のスタック
        this.maxStackSize = 50; // 最大履歴数
        this.isUndoing = false; // Undo実行中フラグ
        this.isRedoing = false; // Redo実行中フラグ
    }

    // 操作を記録
    recordAction(action) {
        // Undo/Redo実行中は記録しない
        if (this.isUndoing || this.isRedoing) return;
        
        this.undoStack.push(action);
        // 新しい操作が記録されたらRedoスタックをクリア
        this.redoStack = [];
        
        // スタックサイズ制限
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }
        
        this.updateButtons();
        console.log('📝 操作を記録:', action.type, action);
    }

    // Undo実行
    undo() {
        if (this.undoStack.length === 0) {
            console.log('⚠️ Undoする操作がありません');
            return;
        }
        
        const action = this.undoStack.pop();
        this.isUndoing = true;
        
        try {
            this.executeUndo(action);
            this.redoStack.push(action);
            console.log('↩️ Undo実行:', action.type);
        } catch (e) {
            console.error('❌ Undoエラー:', e);
            // エラー時は操作をスタックに戻す
            this.undoStack.push(action);
        } finally {
            this.isUndoing = false;
            this.updateButtons();
        }
    }

    // Redo実行
    redo() {
        if (this.redoStack.length === 0) {
            console.log('⚠️ Redoする操作がありません');
            return;
        }
        
        const action = this.redoStack.pop();
        this.isRedoing = true;
        
        try {
            this.executeRedo(action);
            this.undoStack.push(action);
            console.log('↪️ Redo実行:', action.type);
        } catch (e) {
            console.error('❌ Redoエラー:', e);
            // エラー時は操作をスタックに戻す
            this.redoStack.push(action);
        } finally {
            this.isRedoing = false;
            this.updateButtons();
        }
    }

    // Undo操作の実行
    executeUndo(action) {
        switch (action.type) {
            case 'ADD_NODE':
                this.undoAddNode(action);
                break;
            case 'DELETE_NODE':
                this.undoDeleteNode(action);
                break;
            case 'ADD_EDGE':
                this.undoAddEdge(action);
                break;
            case 'DELETE_EDGE':
                this.undoDeleteEdge(action);
                break;
            case 'EDIT_NODE_LABEL':
                this.undoEditNodeLabel(action);
                break;
            case 'EDIT_REASON':
                this.undoEditReason(action);
                break;
            case 'MOVE_NODE':
                this.undoMoveNode(action);
                break;
            case 'CHANGE_STATUS':
                this.undoChangeStatus(action);
                break;
            default:
                console.warn('⚠️ 未対応のUndo操作:', action.type);
        }
    }

    // Redo操作の実行
    executeRedo(action) {
        switch (action.type) {
            case 'ADD_NODE':
                this.redoAddNode(action);
                break;
            case 'DELETE_NODE':
                this.redoDeleteNode(action);
                break;
            case 'ADD_EDGE':
                this.redoAddEdge(action);
                break;
            case 'DELETE_EDGE':
                this.redoDeleteEdge(action);
                break;
            case 'EDIT_NODE_LABEL':
                this.redoEditNodeLabel(action);
                break;
            case 'EDIT_REASON':
                this.redoEditReason(action);
                break;
            case 'MOVE_NODE':
                this.redoMoveNode(action);
                break;
            case 'CHANGE_STATUS':
                this.redoChangeStatus(action);
                break;
            default:
                console.warn('⚠️ 未対応のRedo操作:', action.type);
        }
    }

    // ノード追加のUndo（ノードを削除）
    undoAddNode(action) {
        const nodeId = action.nodeId;
        // 接続エッジも削除
        const connectedEdges = defaultThinkingProcess.ownNetwork.getConnectedEdges(nodeId);
        connectedEdges.forEach(edgeId => {
            const edge = defaultThinkingProcess.edges.get(edgeId);
            if (edge) {
                defaultThinkingProcess.edges.remove(edgeId);
                defaultRecordThinkingProcess.delete_db_Edge(edgeId, edge.from, edge.to);
            }
        });
        defaultThinkingProcess.nodes.remove(nodeId);
        defaultRecordThinkingProcess.delete_db_Node(nodeId);
    }

    // ノード追加のRedo（ノードを再追加）
    redoAddNode(action) {
        const nodeData = action.nodeData;
        defaultThinkingProcess.nodes.add(nodeData);
        defaultRecordThinkingProcess.record_Node(
            nodeData.id, 
            action.originalLabel || nodeData.label, 
            nodeData.group, 
            nodeData.x, 
            nodeData.y, 
            nodeData.status
        );
    }

    // ノード削除のUndo（ノードを復元）
    undoDeleteNode(action) {
        // ノードを復元
        defaultThinkingProcess.nodes.add(action.nodeData);
        defaultRecordThinkingProcess.record_Node(
            action.nodeData.id,
            action.originalLabel || action.nodeData.label,
            action.nodeData.group,
            action.nodeData.x,
            action.nodeData.y,
            action.nodeData.status
        );
        
        // 接続エッジを復元
        if (action.connectedEdges && action.connectedEdges.length > 0) {
            action.connectedEdges.forEach(edgeData => {
                defaultThinkingProcess.edges.add(edgeData);
                defaultRecordThinkingProcess.record_Edge(edgeData.id, edgeData.from, edgeData.to);
            });
        }
    }

    // ノード削除のRedo（ノードを再削除）
    redoDeleteNode(action) {
        const nodeId = action.nodeData.id;
        // 接続エッジを削除
        const connectedEdges = defaultThinkingProcess.ownNetwork.getConnectedEdges(nodeId);
        connectedEdges.forEach(edgeId => {
            const edge = defaultThinkingProcess.edges.get(edgeId);
            if (edge) {
                defaultThinkingProcess.edges.remove(edgeId);
                defaultRecordThinkingProcess.delete_db_Edge(edgeId, edge.from, edge.to);
            }
        });
        defaultThinkingProcess.nodes.remove(nodeId);
        defaultRecordThinkingProcess.delete_db_Node(nodeId);
    }

    // エッジ追加のUndo（エッジを削除）
    undoAddEdge(action) {
        const edgeId = action.edgeId;
        const edge = defaultThinkingProcess.edges.get(edgeId);
        if (edge) {
            defaultThinkingProcess.edges.remove(edgeId);
            defaultRecordThinkingProcess.delete_db_Edge(edgeId, edge.from, edge.to);
        }
    }

    // エッジ追加のRedo（エッジを再追加）
    redoAddEdge(action) {
        defaultThinkingProcess.edges.add(action.edgeData);
        defaultRecordThinkingProcess.record_Edge(action.edgeData.id, action.edgeData.from, action.edgeData.to);
    }

    // エッジ削除のUndo（エッジを復元）
    undoDeleteEdge(action) {
        console.log('🔄 undoDeleteEdge - edgeData:', action.edgeData);
        if (!action.edgeData || !action.edgeData.id) {
            console.error('❌ エッジデータまたはIDがありません:', action);
            return;
        }
        defaultThinkingProcess.edges.add(action.edgeData);
        defaultRecordThinkingProcess.record_Edge(action.edgeData.id, action.edgeData.from, action.edgeData.to);
        console.log('✅ エッジを復元しました:', action.edgeData.id);
    }

    // エッジ削除のRedo（エッジを再削除）
    redoDeleteEdge(action) {
        console.log('🔄 redoDeleteEdge - edgeData:', action.edgeData);
        if (!action.edgeData || !action.edgeData.id) {
            console.error('❌ エッジデータまたはIDがありません:', action);
            return;
        }
        const edgeId = action.edgeData.id;
        defaultThinkingProcess.edges.remove(edgeId);
        defaultRecordThinkingProcess.delete_db_Edge(edgeId, action.edgeData.from, action.edgeData.to);
        console.log('✅ エッジを再削除しました:', edgeId);
    }

    // ノードラベル編集のUndo
    undoEditNodeLabel(action) {
        const node = defaultThinkingProcess.nodes.get(action.nodeId);
        if (node) {
            // ラベルを整形
            let result_label = '';
            for (let i = 0; i < action.oldLabel.length; i += 10) {
                result_label += action.oldLabel.substr(i, 10) + '\n';
            }
            result_label = result_label.trim();
            
            node.label = result_label;
            defaultThinkingProcess.nodes.update(node);
            defaultRecordThinkingProcess.update_Node("label", action.nodeId, action.oldLabel, "");
        }
    }

    // ノードラベル編集のRedo
    redoEditNodeLabel(action) {
        const node = defaultThinkingProcess.nodes.get(action.nodeId);
        if (node) {
            let result_label = '';
            for (let i = 0; i < action.newLabel.length; i += 10) {
                result_label += action.newLabel.substr(i, 10) + '\n';
            }
            result_label = result_label.trim();
            
            node.label = result_label;
            defaultThinkingProcess.nodes.update(node);
            defaultRecordThinkingProcess.update_Node("label", action.nodeId, action.newLabel, "");
        }
    }

    // 理由編集のUndo
    undoEditReason(action) {
        const nodeId = action.nodeId;
        const oldReason = action.oldReason;
        
        // エッジの理由を更新
        if (action.edgeId) {
            const edge = defaultThinkingProcess.edges.get(action.edgeId);
            if (edge) {
                if (oldReason && oldReason.trim() !== '') {
                    edge.title = '💡 理由: ' + oldReason;
                    edge.dashes = false;
                    edge.width = 3;
                } else {
                    edge.title = '';
                    edge.dashes = true;
                    edge.width = 1;
                }
                defaultThinkingProcess.edges.update(edge);
            }
        }
        
        // ノードのpurposeを更新
        const node = defaultThinkingProcess.nodes.get(nodeId);
        if (node) {
            node.purpose = oldReason;
            defaultThinkingProcess.nodes.update(node);
        }
        
        // ReasonContent配列を更新
        const rIdx = defaultThinkingProcess.ReasonConnectNodeId.indexOf(nodeId);
        if (rIdx !== -1) {
            defaultThinkingProcess.ReasonContent[rIdx] = oldReason;
        }
        
        // DBに保存
        defaultRecordThinkingProcess.update_Node("purpose", nodeId, oldReason, "");
    }

    // 理由編集のRedo
    redoEditReason(action) {
        const nodeId = action.nodeId;
        const newReason = action.newReason;
        
        if (action.edgeId) {
            const edge = defaultThinkingProcess.edges.get(action.edgeId);
            if (edge) {
                if (newReason && newReason.trim() !== '') {
                    edge.title = '💡 理由: ' + newReason;
                    edge.dashes = false;
                    edge.width = 3;
                } else {
                    edge.title = '';
                    edge.dashes = true;
                    edge.width = 1;
                }
                defaultThinkingProcess.edges.update(edge);
            }
        }
        
        const node = defaultThinkingProcess.nodes.get(nodeId);
        if (node) {
            node.purpose = newReason;
            defaultThinkingProcess.nodes.update(node);
        }
        
        const rIdx = defaultThinkingProcess.ReasonConnectNodeId.indexOf(nodeId);
        if (rIdx !== -1) {
            defaultThinkingProcess.ReasonContent[rIdx] = newReason;
        }
        
        defaultRecordThinkingProcess.update_Node("purpose", nodeId, newReason, "");
    }

    // ノード移動のUndo
    undoMoveNode(action) {
        const node = defaultThinkingProcess.nodes.get(action.nodeId);
        if (node) {
            node.x = action.oldX;
            node.y = action.oldY;
            defaultThinkingProcess.nodes.update(node);
            defaultRecordThinkingProcess.update_Node("point", action.nodeId, action.oldX, action.oldY);
        }
    }

    // ノード移動のRedo
    redoMoveNode(action) {
        const node = defaultThinkingProcess.nodes.get(action.nodeId);
        if (node) {
            node.x = action.newX;
            node.y = action.newY;
            defaultThinkingProcess.nodes.update(node);
            defaultRecordThinkingProcess.update_Node("point", action.nodeId, action.newX, action.newY);
        }
    }

    // ステータス変更のUndo
    undoChangeStatus(action) {
        const node = defaultThinkingProcess.nodes.get(action.nodeId);
        if (node) {
            node.status = action.oldStatus;
            // ステータスに応じた色を設定
            this.applyStatusColor(node, action.oldStatus);
            defaultThinkingProcess.nodes.update(node);
            defaultRecordThinkingProcess.update_Node("status", action.nodeId, action.oldStatus, "");
        }
    }

    // ステータス変更のRedo
    redoChangeStatus(action) {
        const node = defaultThinkingProcess.nodes.get(action.nodeId);
        if (node) {
            node.status = action.newStatus;
            this.applyStatusColor(node, action.newStatus);
            defaultThinkingProcess.nodes.update(node);
            defaultRecordThinkingProcess.update_Node("status", action.nodeId, action.newStatus, "");
        }
    }

    // ステータスに応じた色を適用
    applyStatusColor(node, status) {
        switch (status) {
            case 'doing':
                node.color = { background: '#fff3cd', border: '#333' };
                break;
            case 'done':
                node.color = { background: '#d4edda', border: '#333' };
                break;
            case 'todo':
            default:
                node.color = { background: '#d6f5d6', border: '#333' };
                break;
        }
    }

    // ボタンの有効/無効を更新
    updateButtons() {
        const undoBtn = document.getElementById('process_undo');
        const redoBtn = document.getElementById('process_redo');
        
        if (undoBtn) {
            if (this.undoStack.length === 0) {
                undoBtn.classList.add('disabled');
                undoBtn.disabled = true;
            } else {
                undoBtn.classList.remove('disabled');
                undoBtn.disabled = false;
            }
        }
        
        if (redoBtn) {
            if (this.redoStack.length === 0) {
                redoBtn.classList.add('disabled');
                redoBtn.disabled = true;
            } else {
                redoBtn.classList.remove('disabled');
                redoBtn.disabled = false;
            }
        }
    }

    // スタックをクリア
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateButtons();
    }
}

// ノードの色を暗くしてエッジ用の色を生成するヘルパー関数
function darkenColor(color, amount = 0.3) {
    // HEX形式の色を処理
    let hex = color.replace('#', '');
    
    // 8桁のHEX（アルファチャンネル付き）の場合は6桁に変換
    if (hex.length === 8) {
        hex = hex.substring(0, 6);
    }
    
    // 3桁のHEXを6桁に変換
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // RGB値を抽出
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 各成分を暗くする
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    
    // HEX形式に戻す
    return '#' + 
        newR.toString(16).padStart(2, '0') + 
        newG.toString(16).padStart(2, '0') + 
        newB.toString(16).padStart(2, '0');
}

// グローバルスコープに移動

class ThinkingProcess { // forestMRN: forest Meeting Reflection Network
    constructor(container, load) {
        // this.ownNetwork = this.generateThinkingProcessNetworkCanvas(container, {}, {}); // デフォルトのマップを表示

        defaultRecordThinkingProcess = new RecordThinkingProcess();
        // Undo/Redo管理インスタンスをモジュール版から初期化（依存性注入）
        undoRedoManager = new window.UndoRedoManager(this, defaultRecordThinkingProcess);
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
                },
                label: false // ホバー時にフォントが太文字になって四角のサイズが変わるバグを防止
            },
            scaling: { min: 10, max: 30 }
        },
        groups: {
            'topic-tag': {
                color: {
                    background: '#7eb6e6',
                    border: '#48bb78'
                },
                borderWidth: 3,
                borderWidthSelected: 4,
                font: { color: '#333' }
            }
        },
            edges: {
                arrows: 'to', // エッジに矢印を付けて有向グラフにする
                smooth: false, // falseにするとエッジが直線になる
                dashes: true, // 点線にする
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)',
                    size: 5,
                    x: 3,
                    y: 3
                }
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
        this.dragStartPosition = null; //ドラッグ開始時のノード位置（Undo/Redo用）
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
            // disable oncontext
            // this.ownNetwork.on("oncontext", this.onContext.bind(this));
            this.ownNetwork.on('select', this.selectdelete.bind(this));
            this.ownNetwork.on('selectNode', this.onNodeSelectedForToolbar.bind(this));
            this.ownNetwork.on('deselectNode', this.onNodeDeselectedForToolbar.bind(this));
            this.ownNetwork.on('dragging', this.onNodeDraggingForToolbar.bind(this));
            this.ownNetwork.on('zoom', this.onNodeDraggingForToolbar.bind(this));
            
            // マウス移動による拡張ホバー検出
            this.ownNetwork.on("hoverNode", (params) => {
                console.log("hoverNode event triggered for node:", params.node);
                // 現在のノードの状態を取得して保持
                const currentNode = this.nodes.get(params.node);
                console.log("currentNode:", currentNode);
                if (currentNode) {
                    // 内省タグ（reflection-tag）の場合、カスタムツールチップを表示
                    if (currentNode.group === 'reflection-tag') {
                        // カスタムツールチップを確実に表示
                        this.showReflectionTooltip(params.node, params);
                    }
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
                    // 内省タグの場合、カスタムツールチップを非表示
                    if (currentNode.group === 'reflection-tag') {
                        this.hideReflectionTooltip();
                    }
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
        }
        this.choose_input_xmlLoad();
        // ミニマップ（ナビゲーター）の初期化
        this.initMinimap("myProcessnetwork");
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
        if (params.nodes && params.nodes.length > 0) {
            const node = this.nodes.get(params.nodes[0]);
            if (node && node.shape == "ellipse") {
                // 選択を解除
                this.ownNetwork.setSelection({ nodes: [] });
            }
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
        if (button) {
            const buttonText = button.querySelector(".button-text");
            if (buttonText) {
                buttonText.textContent = "エッジ追加終了";
            } else {
                // フォールバック: value属性も設定（古いHTMLの場合）
                button.value = "エッジ追加終了";
            }
            button.title = "エッジ追加終了";
        }
        button.title = "エッジ追加終了";
        
        this.nodes.update(this.nodes.map(n => {
            return { ...n, fixed: true };
        }));     
    }

    //エッジ編集できない場合の処理
    disableEditEdge() {
        const button = document.getElementById("process_startEditEdge");
        if (button) {
            const buttonText = button.querySelector(".button-text");
            if (buttonText) {
                buttonText.textContent = "エッジ追加";
            } else {
                // フォールバック: value属性も設定（古いHTMLの場合）
                button.value = "エッジ追加";
            }
            button.title = "エッジ追加";
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

        // 衝突回避ロジックを自動実行
        network.on("afterDrawing", (ctx) => {
            if (this._needsCollisionResolution) {
                this._needsCollisionResolution = false;
                this.resolveCollisions();
            }
        });

        // 初回ロード時に一回避ける
        this._needsCollisionResolution = true;
        return network;

        // this.setCanvasOptions(load);
        // return network;
    }

    /*
     * ノードの衝突解決ロジック
     */
    resolveCollisions() {
        if (!this.nodes || !this.ownNetwork) return;
        
        const nodesData = this.nodes.get();
        if (nodesData.length === 0) return;
        
        let collisionFound = true;
        let iter = 0;
        const maxIter = 50;
        const safetyMargin = 30; // ノード間を開ける最低マージン
        let updates = [];
        
        let posMap = {};
        nodesData.forEach(n => {
            posMap[n.id] = { x: n.x || 0, y: n.y || 0 };
        });
        
        while (collisionFound && iter < maxIter) {
            collisionFound = false;
            iter++;
            
            for (let i = 0; i < nodesData.length; i++) {
                for (let j = i + 1; j < nodesData.length; j++) {
                    const n1 = nodesData[i];
                    const n2 = nodesData[j];
                    
                    let bb1 = this.ownNetwork.getBoundingBox(n1.id);
                    let bb2 = this.ownNetwork.getBoundingBox(n2.id);
                    if (!bb1) bb1 = { left: (n1.x || 0) - 100, right: (n1.x || 0) + 100, top: (n1.y || 0) - 20, bottom: (n1.y || 0) + 20 };
                    if (!bb2) bb2 = { left: (n2.x || 0) - 100, right: (n2.x || 0) + 100, top: (n2.y || 0) - 20, bottom: (n2.y || 0) + 20 };
                    
                    // 現在のオフセットを加算
                    const dx1 = posMap[n1.id].x - (n1.x || 0);
                    const dy1 = posMap[n1.id].y - (n1.y || 0);
                    const dx2 = posMap[n2.id].x - (n2.x || 0);
                    const dy2 = posMap[n2.id].y - (n2.y || 0);
                    
                    const left1 = bb1.left + dx1 - safetyMargin/2;
                    const right1 = bb1.right + dx1 + safetyMargin/2;
                    const top1 = bb1.top + dy1 - safetyMargin/2;
                    const bottom1 = bb1.bottom + dy1 + safetyMargin/2;
                    
                    const left2 = bb2.left + dx2 - safetyMargin/2;
                    const right2 = bb2.right + dx2 + safetyMargin/2;
                    const top2 = bb2.top + dy2 - safetyMargin/2;
                    const bottom2 = bb2.bottom + dy2 + safetyMargin/2;
                    
                    if (left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2) {
                        collisionFound = true;
                        
                        const cx1 = (left1 + right1)/2;
                        const cy1 = (top1 + bottom1)/2;
                        const cx2 = (left2 + right2)/2;
                        const cy2 = (top2 + bottom2)/2;
                        
                        let diffX = cx1 - cx2;
                        let diffY = cy1 - cy2;
                        if (diffX === 0 && diffY === 0) {
                            diffX = Math.random() - 0.5;
                            diffY = Math.random() - 0.5;
                        }
                        
                        if (Math.abs(diffX) > Math.abs(diffY)) {
                            // 水平方向に押し出す
                            const overlapX = ((right1 - left1)/2 + (right2 - left2)/2) - Math.abs(diffX);
                            const push = (overlapX + 2) / 2 * (diffX > 0 ? 1 : -1);
                            posMap[n1.id].x += push;
                            posMap[n2.id].x -= push;
                        } else {
                            // 垂直方向に押し出す
                            const overlapY = ((bottom1 - top1)/2 + (bottom2 - top2)/2) - Math.abs(diffY);
                            const push = (overlapY + 2) / 2 * (diffY > 0 ? 1 : -1);
                            posMap[n1.id].y += push;
                            posMap[n2.id].y -= push;
                        }
                    }
                }
            }
        }
        
        nodesData.forEach(n => {
            if (Math.abs(posMap[n.id].x - (n.x || 0)) > 0.1 || Math.abs(posMap[n.id].y - (n.y || 0)) > 0.1) {
                updates.push({ 
                    id: n.id, 
                    x: posMap[n.id].x, 
                    y: posMap[n.id].y,
                    color: n.color // 座標更新時に色がリセットされるのを防ぐため、元の色を維持する
                });
            }
        });
        
        if (updates.length > 0) {
            this.nodes.update(updates);
        }
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
        let border_color = '#333';  // 枠線の色
        let border_width = 1;       // 枠線の幅

        // 問いノード（topic-tag）の場合の色設定
        if (node_type === "topic-tag") {
            node_color = '#0f172a'; // 濃いブルー（Target/Goal）
            border_color = '#38bdf8'; // スカイブルーの枠線
            border_width = 2;       // 枠線
            text_color = '#ffffff'; // 白文字
            position_fixed = true;  // 固定位置
        }

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
        result_label = result_label.trim(); // 末尾の不要な改行を除去
        
        const newNode = {
            id: node_id,
            label: result_label,
            group: node_type,
            color: {
                background: node_color,
                border: border_color
            }, 
            shape: node_shape,
            font: { color: text_color },
            fixed: position_fixed,
            x: node_x, y: node_y, 
            status: "todo",
            borderWidth: border_width,
            borderWidthSelected: border_width + 1,
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

        this.nodes.add(newNode);
        this._needsCollisionResolution = true;
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
        
        // Undo/Redo: ノード追加を記録
        if (undoRedoManager) {
            const addedNode = this.nodes.get(node_id);
            undoRedoManager.recordAction({
                type: 'ADD_NODE',
                nodeId: node_id,
                nodeData: { ...addedNode },
                originalLabel: node_label
            });
        }
        
        // ナビゲーターのトリガーを実行
        if (typeof executeNavigatorTrigger === 'function') {
            executeNavigatorTrigger('node_created');
        }
        
        console.log(this.nodes);
        return this.nodes;
    }

    // 既存ノード同士を結ぶエッジを新規生成するメソッド
    addEdgeBetweenNodes(fromNodeId, toNodeId) {
        // 重複チェック
        let notable = true;
        const connectedEdges = this.ownNetwork.getConnectedEdges(fromNodeId);
        const ConnectSelectNode = connectedEdges.map(n => 
            this.ownNetwork.getConnectedNodes(n).filter(node => node !== fromNodeId)[0]
        );
        if (ConnectSelectNode.includes(toNodeId)) {
            notable = false;
        }
        if (!notable) {
            console.log("⚠️ エッジは既に存在します。");
            return false;
        }

        const fromNode = this.nodes.get(fromNodeId);
        const toNode = this.nodes.get(toNodeId);
        if (!fromNode || !toNode || fromNode.shape === "ellipse" || toNode.shape === "ellipse") {
            console.log("⚠️ 楕円ノードとの接続は無効です。");
            return false;
        }

        // 新しいエッジIDを生成
        let edge_id = this.generateUniqueNumberText();
        
        // エッジの色を設定
        let nodeColor = '#888888';
        if (fromNode && fromNode.color) {
            if (typeof fromNode.color === 'string') {
                nodeColor = fromNode.color;
            } else if (fromNode.color.background) {
                nodeColor = fromNode.color.background;
            }
        }
        const edgeColor = darkenColor(nodeColor, 0.3);

        const edgeData = {
            id: edge_id, 
            from: fromNodeId, 
            to: toNodeId,
            color: {
                color: edgeColor,
                highlight: edgeColor,
                hover: edgeColor
            }
        };

        this.edges.add(edgeData);
        defaultRecordThinkingProcess.record_Edge(edge_id, fromNodeId, toNodeId);

        // Undo/Redo の登録
        if (undoRedoManager) {
            undoRedoManager.recordAction({
                type: 'ADD_EDGE',
                edgeId: edge_id,
                edgeData: { ...edgeData }
            });
        }
        
        console.log("✅ エッジを新しく接続しました:", edge_id);
        return true;
    }

    // ノードの追加（リロード用）(完了)
    addReloadNode(node_id, node_label, node_type, node_x, node_y, status, purpose = null, evaluation_good = null, attribution = null, attribution_bad = null, application = null, estimated_time = null, evaluation_bad = null) {
        // reason-tagタイプのノードはスキップ（廃止された機能）
        if (node_type === "reason-tag") {
            console.log(`reason-tagノードをスキップ: ${node_id}`);
            return;
        }
        
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
        let border_color = '#333'; // デフォルトの枠線色

        // 問いノード（topic-tag）の場合の色設定
        if (node_type === "topic-tag") {
            node_color = '#0f172a'; // 濃いブルー（Target/Goal）
            border_color = '#38bdf8'; // スカイブルーの枠線
            border_width = 2;       // 枠線
            border_width_selected = 4;
            text_color = '#ffffff'; // 白文字
            position_fixed = true;  // 固定位置
        }

        // ステータスに応じて色や枠線を設定（topic-tag以外）
        if (node_type !== "topic-tag") {
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
            if (evaluation_good || attribution || application || attribution_bad) {
                tooltip += '\n\n内省情報:';
                tooltip += '\n行動意図: ' + (evaluation_good || '');
                tooltip += '\n完了基準(良): ' + (attribution || '');
                tooltip += '\n原因帰属(悪): ' + (attribution_bad || '');
                tooltip += '\n学び: ' + (application || '');
            }

        // ノード作成
        const newNode = {
            id: `${node_id}`,
            label: result_label,
            group: node_type,
            color: {
                background: node_color,
                border: border_color
            },
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

        // attach reflective fields so UI can prefill from node data
        newNode.evaluation_good = evaluation_good || '';
        newNode.attribution = attribution || '';
        newNode.attribution_bad = attribution_bad || '';
        newNode.application = application || '';
        newNode.purpose = purpose || '';
        newNode.estimated_time = estimated_time || '';

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

        // 古いロジック（ノードのpurposeで全エッジを上書きする）を削除。
        // 代わりにaddReloadEdge側で個別のエッジの理由（label）に基づき実線化・ツールチップ設定を行う。

        // 完了予定がある場合、緑色の時間タグを追加（ノードの左下）
        if (estimated_time && estimated_time.trim() !== '') {
            setTimeout(() => {
                const nodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
                const timeTagId = `time-tag-${node_id}`;
                const _priorityToCircled = (v) => String(v);
                const timeTagLabel = _priorityToCircled(estimated_time);
                const timeTag = {
                    id: timeTagId,
                    label: timeTagLabel,
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
                    title: '優先順位: ' + estimated_time,
                    borderWidth: 0,
                    borderWidthSelected: 0,
                    shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
                };
                defaultThinkingProcess.nodes.add(timeTag);
            }, 100);
        }

        // 内省情報がある場合、内省タグを右上に追加
        if (evaluation_good || attribution || application) {
            setTimeout(() => {
                const nodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
                const reflectionTagId = `reflection-tag-${node_id}`;
                
                // ツールチップ用のテキストを生成
                const titleParts = [];
                if (evaluation_good) titleParts.push(`【成功点】${evaluation_good}`);
                if (attribution) titleParts.push(`【成功の理由】${attribution}`);
                if (evaluation_bad) titleParts.push(`【失敗点】${evaluation_bad}`);
                if (attribution_bad) titleParts.push(`【失敗の理由】${attribution_bad}`);
                if (application) titleParts.push(`【今後の教訓】${application}`);
                const titleText = titleParts.join('<br>');

                const reflectionTag = {
                    id: reflectionTagId,
                    label: '📝',
                    shape: 'text',
                    font: { 
                        size: 24,
                        face: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
                    },
                    x: nodeBoundingBox.right - 4,
                    y: nodeBoundingBox.top + 4,
                    fixed: true,
                    physics: false,
                    group: 'reflection-tag',
                    title: titleText || '内省データ',
                    // 内省データを保持
                    reflectionData: {
                        successPoints: evaluation_good || '',
                        failurePoints: evaluation_bad || '',
                        completionReasonGood: attribution || '',
                        completionReasonBad: attribution_bad || '',
                        challengesAndLearnings: application || '',
                        whenApplicable: ''
                    }
                };
                defaultThinkingProcess.nodes.add(reflectionTag);
                // データベースから追加のレッスン情報を取得して reflectionData を更新
                try {
                    $.ajax({
                        url: 'php/get_lessons.php',
                        type: 'GET',
                        dataType: 'json',
                        data: { object_node_id: node_id },
                        success: function(res) {
                            try {
                                var when = '';
                                var lessonText = application || '';
                                if (res && res.success && Array.isArray(res.items) && res.items.length) {
                                    var it = res.items[0];
                                    lessonText = it.lesson_learned || it.application || lessonText || '';
                                    when = it.opportunity || '';
                                }
                                // reflectionData を更新（title はundefinedのまま）
                                try { 
                                    defaultThinkingProcess.nodes.update({ 
                                        id: reflectionTagId, 
                                        title: undefined,  // カスタムツールチップを使用
                                        reflectionData: {
                                            successPoints: evaluation_good || '',
                                            failurePoints: evaluation_bad || '',
                                            completionReasonGood: attribution || '',
                                            completionReasonBad: attribution_bad || '',
                                            challengesAndLearnings: lessonText || '',
                                            whenApplicable: when || ''
                                        }
                                    }); 
                                } catch(e) {}
                            } catch(e) { console.warn('failed to update reflectionTag data from lessons', e); }
                        },
                        error: function() { /* ignore */ }
                    });
                } catch(e) { /* ignore */ }
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
            this.edges.update(update_edge);
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
        this.edges.add(newEdge);

        //triggerとなるノードを追加
        const newNode = {
            id: trigger_id,
            label: t_time,
            title: t_title,
            group: "trigger",
            type: t_type,
            color: color,
            shape: 'box',
            fixed: false,
            x: node_x, y: node_y,
        };
        this.nodes.add(newNode);
        this._needsCollisionResolution = true;

        if(flag == "New"){
            defaultRecordThinkingProcess.record_trigger(trigger_id, activity_id, from_node, to_node, t_time, t_type, t_label, node_x, node_y);
        }

        return this.edges, this.nodes;
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
        let fromNode = this.nodes.get(edge_start);
        if (!fromNode) {
            fromNode = this.nodes.get('topic-tag_' + edge_start) || this.nodes.get('versions_' + edge_start);
            if (fromNode) edge_start = fromNode.id;
        }

        let toNode = this.nodes.get(edge_end);
        if (!toNode) {
            toNode = this.nodes.get('topic-tag_' + edge_end) || this.nodes.get('versions_' + edge_end);
            if (toNode) edge_end = toNode.id;
        }

        if (!fromNode) {
            console.error(`❌ 参照元ノード ${edge_start} が存在しません。エッジ ${edge_id} を追加できません。`);
            return;
        }
        if (!toNode) {
            console.error(`❌ 参照先ノード ${edge_end} が存在しません。エッジ ${edge_id} を追加できません。`);
            return;
        }

        // 上位ノード（from側）の色を取得してエッジに設定
        let nodeColor = '#a8d5a2'; // デフォルトは緑系（想定外の黒矢印を避ける）
        if (fromNode.color) {
            if (typeof fromNode.color === 'string') {
                nodeColor = fromNode.color;
            } else if (fromNode.color.background) {
                nodeColor = fromNode.color.background;
            }
        }
        // ノードの色を暗くしてエッジ色を生成
        const edgeColor = darkenColor(nodeColor, 0.3);

        const edgeData = {
            id: String(edge_id), // IDを文字列として明示的に設定
            from: String(edge_start), 
            to: String(edge_end),
            color: {
                color: edgeColor,
                highlight: edgeColor,
                hover: edgeColor
            }
        };
        
        // 古い仕様（object_nodes.purpose）からの情報引き継ぎ（フォールバック）
        // エッジ自身のラベルが空の場合でも、接続先ノードが過去の理由データを持っていればそれを代用する
        if (!edge_label || edge_label.trim() === '') {
            const targetNode = this.nodes.get(String(edge_end));
            if (targetNode && targetNode.purpose && targetNode.purpose.trim() !== '') {
                edge_label = targetNode.purpose;
            }
        }

        // ラベル（理由）が存在する場合は実線化・ツールチップ追加のみ行う（線の上に文字は出さない）
        if (edge_label && edge_label.trim() !== '') {
            edgeData.title = '💡 理由: ' + edge_label; // ツールチップを追加
            edgeData.dashes = false; // 実線に変更
            edgeData.width = 3; // 理由があるエッジは太く目立たせる
            
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
            // 改行文字をすべて除去してから処理する
            if (node_content) {
                node_content = node_content.replace(/\r?\n|\r/g, '');
            }
            
            // Undo/Redo: 古いラベルを保存
            const oldLabel = node.label ? node.label.replace(/\r?\n|\r/g, '') : '';
            
            let result_label = '';
            for (let i = 0; i < node_content.length; i += 10) {
                result_label += node_content.substr(i, 10) + '\n';
            }
            result_label = result_label.trim(); // 末尾の不要な改行を除去
            node.label = result_label;
            // 編集を反映
            this.nodes.update(node);
            defaultRecordThinkingProcess.update_Node("label", node_id, node_content, "");
            
            // Undo/Redo: ラベル編集を記録
            if (undoRedoManager && oldLabel !== node_content) {
                undoRedoManager.recordAction({
                    type: 'EDIT_NODE_LABEL',
                    nodeId: node_id,
                    oldLabel: oldLabel,
                    newLabel: node_content
                });
            }
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
        
        // ノードがダブルクリックされた場合を先にチェック
        if (params.nodes && params.nodes.length > 0) {
            // ノードがクリックされた場合はノード編集処理へ
            // （後続のノード処理ブロックで処理される）
        } else if (params.edges && params.edges.length > 0) {
            // ノードがクリックされておらず、エッジがダブルクリックされた場合
            const clickedEdgeId = params.edges[0];
            const edgeData = this.edges.get(clickedEdgeId);
            if (edgeData && edgeData.to) {
                const targetNodeId = edgeData.to;
                console.log('エッジがダブルクリックされました。対象ノード:', targetNodeId);
                
                // selectId を設定
                this.selectId = targetNodeId;
                try { sessionStorage.setItem('currentSelectId', this.selectId); } catch (e) { /* ignore */ }
                
                // 既存の理由を取得してダイアログに表示
                let reasonText = '';
                
                // 1. ReasonContent配列から取得を試みる
                const rIdx = this.ReasonConnectNodeId.indexOf(targetNodeId);
                if (rIdx !== -1 && this.ReasonContent[rIdx]) {
                    reasonText = this.ReasonContent[rIdx];
                }
                
                // 2. ノードのpurposeフィールドからも取得を試みる
                if (!reasonText || reasonText.trim() === '') {
                    const targetNode = this.nodes.get(targetNodeId);
                    if (targetNode && targetNode.purpose && targetNode.purpose.trim() !== '') {
                        reasonText = targetNode.purpose;
                    }
                }
                
                // 3. エッジのtitle（ツールチップ）から理由を抽出
                if (!reasonText || reasonText.trim() === '') {
                    if (edgeData.title && edgeData.title.includes('理由:')) {
                        // "💡 理由: ..." の形式から理由部分を抽出
                        const match = edgeData.title.match(/理由:\s*(.+)/);
                        if (match && match[1]) {
                            reasonText = match[1].trim();
                        }
                    }
                }
                
                console.log('既存の理由:', reasonText);
                
                // モーダルを編集モードで表示（理由枠にフォーカス）
                this.openActionModal('edit', targetNodeId, 'reason', reasonText);
            }
            return; // エッジのダブルクリック処理後は終了
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

                // ユーザーに新しいラベルを尋ねる代わりにモーダルを編集モードで起動
                this.openActionModal('edit', clickedNodeId, 'name');
            }
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
            
            // Undo/Redo: 削除前のノードデータとエッジデータを保存
            const nodeDataForUndo = { ...this.nodes.get(selectNodeId) };
            const connectedEdgesForUndo = [];
            
            // 削除するノードに接続されているエッジを取得
            const connectedEdges = this.ownNetwork.getConnectedEdges(selectNodeId);
            
            // エッジデータをUndo用に保存
            connectedEdges.forEach(edgeId => {
                const edge = this.edges.get(edgeId);
                if (edge) {
                    connectedEdgesForUndo.push({ ...edge });
                }
            });
            
            // 上位ノード（このノードへ接続しているノード）と下位ノード（このノードから接続しているノード）を取得
            const fromNodes = []; // このノードに向かっているエッジのfromノード
            const toNodes = [];   // このノードから出ているエッジのtoノード
            const edgeReasons = {}; // toノードごとの理由を保存
            
            connectedEdges.forEach(edgeId => {
                const edge = this.edges.get(edgeId);
                if (edge) {
                    if (edge.to === selectNodeId) {
                        // このノードに向かっているエッジ
                        fromNodes.push(edge.from);
                    } else if (edge.from === selectNodeId) {
                        // このノードから出ているエッジ
                        toNodes.push(edge.to);
                        // このエッジの理由を保存（実線の場合）
                        if (edge.title && edge.title.includes('理由:')) {
                            const match = edge.title.match(/理由:\s*(.+)/);
                            if (match && match[1]) {
                                edgeReasons[edge.to] = match[1].trim();
                            }
                        }
                    }
                }
            });
            
            console.log(`削除ノード ${selectNodeId} の上位ノード:`, fromNodes, '下位ノード:', toNodes);
            
            if(node_group == "trigger"){
                defaultRecordThinkingProcess.delete_trigger_Node(selectNodeId);
            }else{
                defaultRecordThinkingProcess.delete_db_Node(selectNodeId);
            }
            defaultRecordThinkingProcess.delete_db_Edge(null, selectNodeId, "");
            defaultRecordThinkingProcess.delete_db_Edge(null, "", selectNodeId);

            // 関連するエッジのラベル情報をクリア
            connectedEdges.forEach(edgeId => {
                if (this.EdgeLabels[edgeId]) {
                    delete this.EdgeLabels[edgeId];
                    console.log(`エッジ ${edgeId} のラベル情報を削除しました`);
                }
            });

            this.edges.remove(this.ownNetwork.getConnectedEdges(selectNodeId));
            this.nodes.remove({id: selectNodeId});
            
            // 上位ノードと下位ノードを結ぶ新しいエッジを作成
            if (fromNodes.length > 0 && toNodes.length > 0) {
                fromNodes.forEach(fromNodeId => {
                    toNodes.forEach(toNodeId => {
                        // 既に同じエッジが存在しないかチェック
                        const existingEdges = this.edges.get().filter(e => 
                            e.from === fromNodeId && e.to === toNodeId
                        );
                        
                        if (existingEdges.length === 0) {
                            const newEdgeId = this.generateUniqueNumberText();
                            
                            // fromノードの色を取得してエッジ色を設定
                            const fromNode = this.nodes.get(fromNodeId);
                            let nodeColor = '#888888';
                            if (fromNode && fromNode.color) {
                                if (typeof fromNode.color === 'string') {
                                    nodeColor = fromNode.color;
                                } else if (fromNode.color.background) {
                                    nodeColor = fromNode.color.background;
                                }
                            }
                            const edgeColor = darkenColor(nodeColor, 0.3);
                            
                            const newEdgeData = {
                                id: String(newEdgeId),
                                from: String(fromNodeId),
                                to: String(toNodeId),
                                color: {
                                    color: edgeColor,
                                    highlight: edgeColor,
                                    hover: edgeColor
                                }
                            };
                            
                            // 削除されたノードから下位ノードへの理由があれば引き継ぐ
                            if (edgeReasons[toNodeId]) {
                                newEdgeData.dashes = false; // 実線
                                newEdgeData.width = 3;
                                newEdgeData.title = '💡 理由: ' + edgeReasons[toNodeId];
                                console.log(`理由を新しいエッジに引き継ぎました: "${edgeReasons[toNodeId]}"`);
                            }
                            
                            this.edges.add(newEdgeData);
                            defaultRecordThinkingProcess.record_Edge(newEdgeId, fromNodeId, toNodeId, '');
                            console.log(`新しいエッジを作成しました: ${fromNodeId} -> ${toNodeId}`);
                        }
                    });
                });
            }
            
            const ontology_index = this.OntologyConnectNodeId.indexOf(selectNodeId);
            if(ontology_index !== -1){
                this.nodes.remove({ id: this.OntologyNodeId[ontology_index]});
                defaultRecordThinkingProcess.delete_db_Node(this.OntologyNodeId[ontology_index]);
                this.OntologyNodeId.splice(ontology_index, 1);
                this.OntologyConnectNodeId.splice(ontology_index, 1);
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
            
            // Undo/Redo: ノード削除を記録
            if (undoRedoManager && nodeDataForUndo) {
                undoRedoManager.recordAction({
                    type: 'DELETE_NODE',
                    nodeData: nodeDataForUndo,
                    connectedEdges: connectedEdgesForUndo,
                    originalLabel: nodeDataForUndo.label ? nodeDataForUndo.label.replace(/\n/g, '') : ''
                });
            }
        }
    }

    onNodeSelectedForToolbar(params) {
        console.log("onNodeSelectedForToolbar Fired!", params);
        if (this.isViewingPastData) return;
        
        if (params.nodes.length == 1) {
            const selectId = params.nodes[0];
            this.selectId = selectId;
            sessionStorage.setItem('currentSelectId', selectId);
            
            const nodeObj = this.nodes.get(selectId);
            console.log("Selected nodeObj:", nodeObj);
            if (!nodeObj) return;
            
            const nodeGroup = nodeObj.group;
            // 一番上のノード（versions, versionsBro）や各種タグにはツールバーを表示しない
            if(nodeGroup === "reflection-tag" || nodeGroup === "time-tag" || nodeGroup === "ontology-tag" || nodeGroup === "goal-tag" || nodeGroup === "versions" || nodeGroup === "versionsBro") {
                console.log("Ignored nodeGroup:", nodeGroup);
                return; // don't show toolbar for tags or version nodes
            }
            
            const NetworkMenu = document.getElementById('t_Process_conmenu');
            if(!NetworkMenu) return;
            
            // Calculate DOM position
            const nodePosition = this.ownNetwork.getPositions([selectId])[selectId];
            const domPosition = this.ownNetwork.canvasToDOM(nodePosition);
            const myProcessnetworkElem = document.getElementById("myProcessnetwork");
            const mynetPosition = myProcessnetworkElem ? myProcessnetworkElem.getBoundingClientRect() : {left: 0, top: 0};
            
            // Position above the node
            const menuX = domPosition.x + mynetPosition.left;
            const menuY = domPosition.y + mynetPosition.top - 40; // 40px above node center
            
            NetworkMenu.style.left = menuX + 'px';
            NetworkMenu.style.top = menuY + 'px';
            NetworkMenu.style.display = 'block';
            
            // Allow CSS transition to trigger by adding visible class after display block
            setTimeout(() => {
                NetworkMenu.classList.add('visible');
            }, 10);
            
            // 中断ボタンは常に表示
            const pauseBtn = document.getElementById("object_conmenu3");
            if (pauseBtn) {
                pauseBtn.style.display = "inline-flex";
            }
        } else {
            this.onNodeDeselectedForToolbar();
        }
    }

    onNodeDeselectedForToolbar(params) {
        const NetworkMenu = document.getElementById('t_Process_conmenu');
        if (!NetworkMenu) return;
        NetworkMenu.classList.remove('visible');
        setTimeout(() => {
            if(!NetworkMenu.classList.contains('visible')) {
                NetworkMenu.style.display = 'none';
            }
        }, 200); // match CSS transition duration
    }

    onNodeDraggingForToolbar(params) {
        // Hide or update position while dragging/zooming
        const NetworkMenu = document.getElementById('t_Process_conmenu');
        if (NetworkMenu && NetworkMenu.classList.contains('visible') && this.selectId) {
            const nodePosition = this.ownNetwork.getPositions([this.selectId])[this.selectId];
            if(nodePosition) {
                const domPosition = this.ownNetwork.canvasToDOM(nodePosition);
                const mynetPosition = document.getElementById("myProcessnetwork2").getBoundingClientRect();
                NetworkMenu.style.left = (domPosition.x + mynetPosition.left) + 'px';
                NetworkMenu.style.top = (domPosition.y + mynetPosition.top - 40) + 'px';
            }
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
        this.onNodeDeselectedForToolbar();
        
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
        this.onNodeDeselectedForToolbar();
        
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
        this.onNodeDeselectedForToolbar();
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
        this.onNodeDeselectedForToolbar();
        
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

            // Enterキーで保存するイベントリスナー
            // マップ切替後も古いインスタンスを参照しないよう、毎回現在インスタンスへ付け替える
            if (reasontext._reasonCompStartHandler) {
                reasontext.removeEventListener('compositionstart', reasontext._reasonCompStartHandler);
            }
            if (reasontext._reasonCompEndHandler) {
                reasontext.removeEventListener('compositionend', reasontext._reasonCompEndHandler);
            }
            if (reasontext._reasonKeydownHandler) {
                reasontext.removeEventListener('keydown', reasontext._reasonKeydownHandler);
            }

            reasontext._isComposing = false;
            reasontext._reasonCompStartHandler = () => {
                reasontext._isComposing = true;
            };
            reasontext._reasonCompEndHandler = () => {
                reasontext._isComposing = false;
            };
            reasontext._reasonKeydownHandler = (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !reasontext._isComposing) {
                    e.preventDefault();
                    this.add_reason();
                }
            };

            reasontext.addEventListener('compositionstart', reasontext._reasonCompStartHandler);
            reasontext.addEventListener('compositionend', reasontext._reasonCompEndHandler);
            reasontext.addEventListener('keydown', reasontext._reasonKeydownHandler);
        }
        
        console.log('ダイアログを表示します - 座標:', this.BoxDisplay.x, this.BoxDisplay.y);
        
        // 画面の中央に表示するように変更
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const dialogWidth = 400;
        const dialogHeight = 250;
        
        const centerX = (windowWidth - dialogWidth) / 2;
        const centerY = (windowHeight - dialogHeight) / 2;
        
        reasonselect.style.display = "block";
        reasonselect.style.left = centerX + "px";
        reasonselect.style.top = centerY + "px";
        
        // テキストエリアに自動的にフォーカスを当てる
        setTimeout(() => {
            if (reasontext) {
                reasontext.focus();
            }
        }, 100);
        
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
                return;
            }
        }
        
        // Undo/Redo: 古い理由を保存
        const rIdx = this.ReasonConnectNodeId.indexOf(this.selectId);
        const oldReason = (rIdx !== -1) ? this.ReasonContent[rIdx] : '';
        const isNewReason = (rIdx === -1); // 新規追加かどうか
        
        // すでに理由が記述されているかチェック（新規追加の場合のみ）
        if(!isNewReason){
            // 既存の理由がある場合は更新処理
            const reasonText = document.getElementById("t_Process_reasontext").value.trim();
            if (!reasonText) {
                alert('理由を入力してください');
                return;
            }
            
            // 理由を更新
            this.ReasonContent[rIdx] = reasonText;
            
            // エッジを更新
            this.updateEdgesToNodeWithReason(this.selectId, reasonText);
            
            // DBに保存（ノードではなく、該当する全てのエッジに対して記録する）
            const connectedEdges = this.ownNetwork.getConnectedEdges(this.selectId);
            connectedEdges.forEach(edgeId => {
                const edgeData = this.edges.get(edgeId);
                if (edgeData && String(edgeData.to) === String(this.selectId)) {
                    defaultRecordThinkingProcess.record_reason(this.selectId, `reason-${this.selectId}`, reasonText, edgeData.from);
                }
            });
            
            // Undo/Redo: 理由編集を記録
            if (undoRedoManager && oldReason !== reasonText) {
                // エッジIDを取得
                let targetEdgeId = null;
                const connectedEdges = this.ownNetwork.getConnectedEdges(this.selectId);
                connectedEdges.forEach(edgeId => {
                    const edgeData = this.edges.get(edgeId);
                    if (edgeData && edgeData.to === this.selectId) {
                        targetEdgeId = edgeId;
                    }
                });
                
                undoRedoManager.recordAction({
                    type: 'EDIT_REASON',
                    nodeId: this.selectId,
                    edgeId: targetEdgeId,
                    oldReason: oldReason,
                    newReason: reasonText
                });
            }
            
            // 理由入力ダイアログを閉じる
            document.getElementById("t_Process_reasonselect").style.display = "none";
            sessionStorage.removeItem('currentSelectId');
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
            return;
        }
        
        console.log('選択されたノード:', selectedNode);
        
        const reasonNodeId = `reason-${this.selectId}`;

        // 理由の関連付けを記録
        this.ReasonConnectNodeId.push(this.selectId);
        this.ReasonNodeId.push(reasonNodeId);
        this.ReasonContent.push(reasonText);

        // 理由をDBに保存（全てのエッジに対して記録する）
        const connectedEdges = this.ownNetwork.getConnectedEdges(this.selectId);
        connectedEdges.forEach(edgeId => {
            const edgeData = this.edges.get(edgeId);
            if (edgeData && String(edgeData.to) === String(this.selectId)) {
                defaultRecordThinkingProcess.record_reason(this.selectId, reasonNodeId, reasonText, edgeData.from);
            }
        });
        console.log('理由を記録しました:', reasonNodeId, reasonText);
        
        // 理由が記述されたノードへのエッジを実線に変更（理由テキストも渡す）
        this.updateEdgesToNodeWithReason(this.selectId, reasonText);
        
        // Undo/Redo: 理由追加を記録
        if (undoRedoManager) {
            // エッジIDを取得
            let targetEdgeId = null;
            const connectedEdges = this.ownNetwork.getConnectedEdges(this.selectId);
            connectedEdges.forEach(edgeId => {
                const edgeData = this.edges.get(edgeId);
                if (edgeData && edgeData.to === this.selectId) {
                    targetEdgeId = edgeId;
                }
            });
            
            undoRedoManager.recordAction({
                type: 'EDIT_REASON',
                nodeId: this.selectId,
                edgeId: targetEdgeId,
                oldReason: '',
                newReason: reasonText
            });
        }
        
        console.log('理由を記録しました:', reasonText);
        console.log('関連付けノードID:', this.selectId);
        
        // 処理完了後にセッションストレージをクリア
        sessionStorage.removeItem('currentSelectId');
        
        // 理由入力ダイアログを閉じる
        document.getElementById("t_Process_reasonselect").style.display = "none";
    }

    //理由入力をキャンセル
    cancel_reason_input (){
        document.getElementById("t_Process_reasonselect").style.display = "none";
    }

    // 理由が記述されたノードへのエッジを実線に変更し、ホバー時に理由を表示する
    updateEdgesToNodeWithReason(nodeId, reasonText = null, sourceNodeId = null) {
        try {
            const nodeIdStr = String(nodeId);

            // 理由テキストが渡されていない場合はメモリから取得
            if (!reasonText) {
                const rIdx = this.ReasonConnectNodeId.indexOf(nodeIdStr);
                if (rIdx !== -1 && this.ReasonContent[rIdx]) {
                    reasonText = this.ReasonContent[rIdx];
                }
            }
            
            // 型差（number/string）やネットワーク状態差に強くするため、全エッジから to 一致を拾う
            const allEdges = this.edges.get();
            let targetEdges = allEdges.filter(e => String(e.to) === nodeIdStr);
            
            // sourceNodeIdが指定されている場合は、該当する特定のエッジ1本だけに絞り込む（複合キー特定）
            if (sourceNodeId) {
                targetEdges = targetEdges.filter(e => String(e.from) === String(sourceNodeId));
            }

            if (!targetEdges || targetEdges.length === 0) {
                console.log('ノードに接続されているエッジがありません:', nodeId);
                return;
            }
            
            // 各エッジをチェックして、toがこのノードのものを実線に変更
            targetEdges.forEach(edgeData => {
                if (edgeData) {
                    // 上位ノード（from側）の色を取得
                    const fromNode = this.nodes.get(edgeData.from);
                    let nodeColor = '#8abf8a'; // デフォルトは緑寄りにして黒矢印化を避ける
                    if (fromNode && fromNode.color) {
                        if (typeof fromNode.color === 'string') {
                            nodeColor = fromNode.color;
                        } else if (fromNode.color.background) {
                            nodeColor = fromNode.color.background;
                        }
                    }
                    // ノードの色を暗くしてエッジ色を生成
                    const edgeColor = darkenColor(nodeColor, 0.3);
                    
                    // エッジを実線に更新し、太く目立つようにする
                    const updateData = { 
                        id: edgeData.id,
                        dashes: false,
                        width: 3,
                        color: {
                            color: edgeColor,
                            highlight: edgeColor,
                            hover: edgeColor
                        }
                    };
                    if (reasonText) {
                        updateData.title = '💡 理由: ' + reasonText;
                    }
                    this.edges.update(updateData);
                    console.log('エッジを実線に変更しました:', edgeData.id, '-> ノード:', nodeIdStr, '理由:', reasonText);
                }
            });
        } catch (e) {
            console.error('エッジの更新中にエラーが発生しました:', e);
        }
    }

    //完了予定を記述する機能
    show_time_input (){
        this.onNodeDeselectedForToolbar();
        
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
        const _priorityToCircled = (v) => String(v);
        const timeTagLabel = _priorityToCircled(timeText);
        const timeTag = {
            id: `time-tag-${this.selectId}`,
            label: timeTagLabel,
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
            title: '優先順位: ' + timeText,
            borderWidth: 0,
            borderWidthSelected: 0,
            shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 2, x: 2, y: 2 }
        };
        
        // 完了予定タグをネットワークに追加
        this.nodes.add(timeTag);
        this._needsCollisionResolution = true;
        
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
        this.onNodeDeselectedForToolbar();
        
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
        this.onNodeDeselectedForToolbar();


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

        // Undo/Redo: 古いステータスを保存
        const oldNode = this.nodes.get(this.selectId);
        const oldStatus = oldNode ? oldNode.status : 'todo';

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
        
        // Undo/Redo: ステータス変更を記録
        if (undoRedoManager && oldStatus !== 'inProgress') {
            undoRedoManager.recordAction({
                type: 'CHANGE_STATUS',
                nodeId: this.selectId,
                oldStatus: oldStatus,
                newStatus: 'inProgress'
            });
        }
        // feedback_area の自動表示は不要なため無効化（ユーザー要望による）
        // this.showNodeMemoUI(this.selectId);
    }


    // 手段中断ボタン
    step_paused() {
        this.onNodeDeselectedForToolbar();

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

        // Undo/Redo: 古いステータスを保存
        const oldNode = this.nodes.get(this.selectId);
        const oldStatus = oldNode ? oldNode.status : 'todo';

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

        // Undo/Redo: ステータス変更を記録
        if (undoRedoManager && oldStatus !== 'paused') {
            undoRedoManager.recordAction({
                type: 'CHANGE_STATUS',
                nodeId: this.selectId,
                oldStatus: oldStatus,
                newStatus: 'paused'
            });
        }

        // フィードバック吹き出しを表示するならここで
        // this.showFeedbackTooltip();
    }


    // 手段完了ボタン
    step_end() {
        this.onNodeDeselectedForToolbar();
    
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
        // フィードバックの吹き出しを表示
        this.showFeedbackTooltip('initial-complete');
    }
    
    showFeedbackTooltip(mode = 'edit') {
        const tooltip = document.getElementById("feedbackTooltip");
        if (!tooltip) {
            console.error("フィードバック用ツールチップの要素が見つかりませんでした。");
            return;
        }

        const getCurrentLang = () => {
            try {
                if (window.currentLang === 'ja' || window.currentLang === 'en') {
                    return window.currentLang;
                }
                const toggle = document.getElementById('language-toggle');
                return (toggle && toggle.checked) ? 'en' : 'ja';
            } catch (e) {
                return 'ja';
            }
        };

        const feedbackDict = {
            ja: {
                headerTitle: '振り返り',
                historyBtn: '過去の記録を見る',
                successQuestion: 'うまくいった点はありますか？',
                successPlaceholder: '例: 先生と話してスケジュールが決まった',
                successReasonLabel: 'なぜそうなったと思いますか？',
                successReasonPlaceholder: '例: 先に優先順位を共有できた',
                failureQuestion: 'うまくいかなかった点はありますか？',
                failurePlaceholder: '例: 想定より確認に時間がかかった',
                failureReasonLabel: 'なぜそうなったと思いますか？',
                failureReasonPlaceholder: '例: 事前の段取りが不足していた',
                lessonLabel: '教訓',
                lessonFocusLabel: '今後の活動でどのようなことを意識したいですか？',
                lessonFocusPlaceholder: '例: 次回は開始前にゴールを共有する',
                lessonWhyLabel: 'なぜその教訓が大切だと考えますか？',
                lessonWhyPlaceholder: '（例）この教訓を意識することで、次に類似した課題に直面した際、同じ失敗を回避できると考えたため。',
                lessonWhenLabel: 'その教訓はどのような時に活かせそうですか？',
                lessonWhenPlaceholder: '例: 次回の準備開始時',
                cancelBtn: 'キャンセル',
                saveBtn: '振り返りを終える',
                historyPanelLabel: '過去の記録',
                historyTitle: '過去の記録',
                lessonDeleteConfirm: 'この教訓を削除しますか？',
                lessonDeleteLastAlert: '最後の教訓は削除できません'
            },
            en: {
                headerTitle: 'Reflection',
                historyBtn: 'View past records',
                successQuestion: 'What went well?',
                successPlaceholder: 'e.g., We aligned the schedule after talking to the instructor',
                successReasonLabel: 'Why do you think it went that way?',
                successReasonPlaceholder: 'e.g., We shared priorities early',
                failureQuestion: 'What did not go well?',
                failurePlaceholder: 'e.g., Reviews took longer than expected',
                failureReasonLabel: 'Why do you think it went that way?',
                failureReasonPlaceholder: 'e.g., The preparation steps were insufficient',
                lessonLabel: 'Lesson',
                lessonFocusLabel: 'What do you want to keep in mind for future activities?',
                lessonFocusPlaceholder: 'e.g., Share the goal before starting next time',
                lessonWhyLabel: 'Why do you think this lesson is important?',
                lessonWhyPlaceholder: 'e.g., By keeping this in mind, I can avoid the same failure when facing a similar task next time.',
                lessonWhenLabel: 'When can you apply this lesson?',
                lessonWhenPlaceholder: 'e.g., At the start of next preparation',
                cancelBtn: 'Cancel',
                saveBtn: 'Finish reflection',
                historyPanelLabel: 'Past records',
                historyTitle: 'Past records',
                lessonDeleteConfirm: 'Delete this lesson?',
                lessonDeleteLastAlert: 'You cannot delete the last lesson'
            }
        };

        const t = (key) => {
            const lang = getCurrentLang();
            if (feedbackDict[lang] && typeof feedbackDict[lang][key] !== 'undefined') {
                return feedbackDict[lang][key];
            }
            return (feedbackDict.ja && typeof feedbackDict.ja[key] !== 'undefined') ? feedbackDict.ja[key] : key;
        };
        const formatLessonLabel = (index) => `${t('lessonLabel')} #${index + 1}`;

        const applyFeedbackTooltipLang = (root) => {
            if (!root) return;
            const headerTitle = root.querySelector('#feedbackTooltipHeader > div');
            if (headerTitle) headerTitle.textContent = t('headerTitle');

            const historyBtn = root.querySelector('#btnReflectionHistory');
            if (historyBtn) historyBtn.textContent = t('historyBtn');

            const successQuestion = root.querySelector('.feedback-card--success .feedback-card-title .feedback-micro-label');
            if (successQuestion) successQuestion.textContent = t('successQuestion');
            const successReasonLabel = root.querySelector('label[for="completionReasonGood"]');
            if (successReasonLabel) successReasonLabel.textContent = t('successReasonLabel');

            const failureQuestion = root.querySelector('.feedback-card--failure .feedback-card-title .feedback-micro-label');
            if (failureQuestion) failureQuestion.textContent = t('failureQuestion');
            const failureReasonLabel = root.querySelector('label[for="completionReasonBad"]');
            if (failureReasonLabel) failureReasonLabel.textContent = t('failureReasonLabel');

            const successPoints = root.querySelector('#successPoints');
            if (successPoints) successPoints.placeholder = t('successPlaceholder');
            const completionReasonGood = root.querySelector('#completionReasonGood');
            if (completionReasonGood) completionReasonGood.placeholder = t('successReasonPlaceholder');
            const failurePoints = root.querySelector('#failurePoints');
            if (failurePoints) failurePoints.placeholder = t('failurePlaceholder');
            const completionReasonBad = root.querySelector('#completionReasonBad');
            if (completionReasonBad) completionReasonBad.placeholder = t('failureReasonPlaceholder');

            const lessonFocus = root.querySelector('#challengesAndLearnings');
            if (lessonFocus) lessonFocus.placeholder = t('lessonFocusPlaceholder');
            const lessonWhen = root.querySelector('#whenApplicable');
            if (lessonWhen) lessonWhen.placeholder = t('lessonWhenPlaceholder');

            const lessonLabels = root.querySelectorAll('.lesson-tab-content label.feedback-micro-label');
            lessonLabels.forEach((label, idx) => {
                label.textContent = (idx % 2 === 0) ? t('lessonFocusLabel') : t('lessonWhenLabel');
            });

            const cancelBtn = root.querySelector('#btnCancelFeedback');
            if (cancelBtn) cancelBtn.textContent = t('cancelBtn');
            const saveBtn = root.querySelector('#btnSaveFeedback');
            if (saveBtn) saveBtn.textContent = t('saveBtn');

            const historyPanel = root.querySelector('#reflectionHistoryPanel');
            if (historyPanel) historyPanel.setAttribute('aria-label', t('historyPanelLabel'));
            const historyTitle = root.querySelector('.feedback-drawer-title');
            if (historyTitle) {
                const icon = historyTitle.querySelector('.feedback-drawer-icon');
                const iconHtml = icon ? icon.outerHTML : '';
                historyTitle.innerHTML = iconHtml + t('historyTitle');
            }

            if (window._lessonTabHelpers && typeof window._lessonTabHelpers.updateLessonTabLabels === 'function') {
                window._lessonTabHelpers.updateLessonTabLabels();
            }
        };
    
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
    
        // 吹き出しの内容を設定（共通クラスを使用）
        tooltip.style.left = `${canvasPosition.x}px`;
        tooltip.style.top = `${canvasPosition.y + 20}px`; // ノードの下に表示
        tooltip.style.position = "fixed";
        tooltip.style.zIndex = "2147483647";
        if (!tooltip.dataset.initialSized) {
            tooltip.style.width = '683px';
            tooltip.style.height = 'auto';
            tooltip.dataset.initialSized = '1';
        }
        tooltip.classList.add('fl-card','fl-card--wide');
        tooltip.innerHTML = `
    <div id="feedbackTooltipHeader" class="fl-header reflection-header-row">
        <div class="reflection-main-title" style="font-weight:700; font-size:16px;">${t('headerTitle')}</div>
        <div class="header-actions-group">
            <button type="button" id="btnReflectionHistory" class="btn-view-past-logs" aria-controls="reflectionHistoryPanel" aria-expanded="false">${t('historyBtn')}</button>
            <button type="button" id="btnCancelFeedback" class="modal-close-v4-btn" title="閉じる">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    </div>
    <div class="fl-body">
        <div class="feedback-layout">
        <div class="feedback-main">
        <form id="formFeedbackInput">
            <div class="feedback-cards">
                <div class="feedback-card feedback-card--success">
                    <div class="feedback-card-title"><span class="feedback-card-icon">😊</span><span class="feedback-micro-label">${t('successQuestion')}</span></div>
                    <textarea id="successPoints" name="successPoints" rows="3" class="feedback-textarea" placeholder="${t('successPlaceholder')}"></textarea>
                    <label for="completionReasonGood" class="feedback-micro-label">${t('successReasonLabel')}</label>
                    <textarea id="completionReasonGood" name="completionReasonGood" rows="2" class="feedback-textarea" placeholder="${t('successReasonPlaceholder')}"></textarea>
                </div>
                <div class="feedback-card feedback-card--failure">
                    <div class="feedback-card-title"><span class="feedback-card-icon">😔</span><span class="feedback-micro-label">${t('failureQuestion')}</span></div>
                    <textarea id="failurePoints" name="failurePoints" rows="3" class="feedback-textarea" placeholder="${t('failurePlaceholder')}"></textarea>
                    <label for="completionReasonBad" class="feedback-micro-label">${t('failureReasonLabel')}</label>
                    <textarea id="completionReasonBad" name="completionReasonBad" rows="2" class="feedback-textarea" placeholder="${t('failureReasonPlaceholder')}"></textarea>
                </div>
            </div>

            <!-- Lesson section -->

            <div class="lesson-panel">
                <div class="lesson-panel-header">
                    <span class="lesson-panel-icon">💡</span>
                    <div id="lessonTabContainer" class="lesson-tabs">
                        <div class="lesson-tab lesson-tab-active" data-lesson-index="0">
                            <span class="lesson-tab-label">${formatLessonLabel(0)}</span>
                        </div>
                        <button type="button" id="btnAddLessonTab" class="lesson-tab-add">+</button>
                    </div>
                </div>
                <div id="lessonTabContentContainer" class="lesson-tab-content-container">
                    <div class="lesson-tab-content lesson-tab-content-active" data-lesson-index="0">
                        <label class="feedback-micro-label">${t('lessonFocusLabel')}</label>
                        <textarea id="challengesAndLearnings" name="challengesAndLearnings" rows="2" class="feedback-textarea" placeholder="${t('lessonFocusPlaceholder')}"></textarea>
                        <label class="feedback-micro-label">${t('lessonWhyLabel')}</label>
                        <textarea id="whyImportant" name="whyImportant" rows="2" class="feedback-textarea" placeholder="${t('lessonWhyPlaceholder')}"></textarea>
                        <label class="feedback-micro-label">${t('lessonWhenLabel')}</label>
                        <textarea id="whenApplicable" name="whenApplicable" rows="1" class="feedback-textarea" placeholder="${t('lessonWhenPlaceholder')}"></textarea>
                    </div>
                </div>
            </div>

            <div class="reflection-footer-status" style="margin-top: 24px; width: 100%;">
                ${mode === 'initial-complete'
                    ? `<button type="button" class="btn-finish-reflection" id="btn-finish-reflection">${t('saveBtn')}</button>`
                    : `<button type="button" class="save-status-text" id="node-reflection-save-status" disabled>保存済み</button>`
                }
            </div>
        </form>
        </div>
        <aside id="reflectionHistoryPanel" class="feedback-drawer" aria-label="${t('historyPanelLabel')}">
            <div class="feedback-drawer-header">
                <div class="feedback-drawer-title"><span class="feedback-drawer-icon">🕒</span>${t('historyTitle')}</div>
            </div>
            <div id="reflectionHistoryList" class="history-list"></div>
        </aside>
        </div>
    </div>

    `;
    
        tooltip.classList.remove('feedback-drawer-open');
        const historyBtn = document.getElementById('btnReflectionHistory');
        if (historyBtn) {
            historyBtn.textContent = t('historyBtn');
            historyBtn.setAttribute('aria-expanded', 'false');
        }
        tooltip.style.display = "block";
        this.setupReflectionHistoryButton();

        const applyAutoGrow = (ta) => {
            if (!ta) return;
            ta.style.overflow = 'hidden';
            const resize = () => {
                ta.style.height = 'auto';
                ta.style.height = `${ta.scrollHeight}px`;
            };
            ta.addEventListener('input', resize);
            setTimeout(resize, 0);
        };

        tooltip.querySelectorAll('textarea').forEach((ta) => applyAutoGrow(ta));

        // Update tooltip text when language changes without re-rendering inputs.
        window.updateFeedbackTooltipLang = () => {
            const currentTooltip = document.getElementById('feedbackTooltip');
            if (!currentTooltip || currentTooltip.style.display === 'none') return;
            applyFeedbackTooltipLang(currentTooltip);
        };

        // 保存ボタンのイベントリスナーを設定
        this.setupTooltipAutoSave(tooltip, mode);
        this.setupTooltipDrag(tooltip);
        
        // 教訓タブ機能の設定
        try {
            const lessonTabContainer = document.getElementById('lessonTabContainer');
            const lessonTabContentContainer = document.getElementById('lessonTabContentContainer');
            const addLessonTabBtn = document.getElementById('btnAddLessonTab');
            
            if (lessonTabContainer && lessonTabContentContainer && addLessonTabBtn) {
                // Helper functions
                const getLessonTabs = () => Array.from(lessonTabContainer.querySelectorAll('.lesson-tab'));
                const getLessonTabContents = () => Array.from(lessonTabContentContainer.querySelectorAll('.lesson-tab-content'));
                
                // windowオブジェクトに関数を保存（AJAX内から呼び出すため）
                window._lessonTabHelpers = {
                    getLessonTabs,
                    getLessonTabContents,
                    lessonTabContainer,
                    lessonTabContentContainer,
                    addLessonTabBtn
                };
                
                const activateLessonTab = (index) => {
                    const tabs = getLessonTabs();
                    const contents = getLessonTabContents();
                    tabs.forEach((t, i) => {
                        if (i === index) {
                            t.classList.add('lesson-tab-active');
                        } else {
                            t.classList.remove('lesson-tab-active');
                        }
                    });
                    contents.forEach((c, i) => {
                        if (i === index) {
                            c.classList.add('lesson-tab-content-active');
                            c.style.display = 'block';
                        } else {
                            c.classList.remove('lesson-tab-content-active');
                            c.style.display = 'none';
                        }
                    });
                    updateLessonTabLabels();
                };
                
                const updateLessonTabLabels = () => {
                    const tabs = getLessonTabs();
                    tabs.forEach((tab, i) => {
                        const isActive = tab.classList.contains('lesson-tab-active');
                        let label = formatLessonLabel(i);
                        const labelSpan = tab.querySelector('.lesson-tab-label');
                        if (labelSpan) labelSpan.textContent = label;
                    });
                };
                
                const createLessonTab = (isFirst) => {
                    const tabs = getLessonTabs();
                    const tab = document.createElement('div');
                    tab.className = 'lesson-tab';
                    tab.dataset.lessonIndex = tabs.length;
                    
                    const tabLabel = document.createElement('span');
                    tabLabel.className = 'lesson-tab-label';
                    tabLabel.textContent = formatLessonLabel(tabs.length);
                    tab.appendChild(tabLabel);
                    
                    if (!isFirst) {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.type = 'button';
                        deleteBtn.textContent = '×';
                        deleteBtn.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; padding:0; margin:0; background:transparent; border:1px solid transparent; border-radius:50%; font-size:12px; color:#999; cursor:pointer; transition:background 0.2s, color 0.2s;';
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            deleteLessonTab(tab);
                        });
                        deleteBtn.addEventListener('mouseenter', () => { deleteBtn.style.background = '#fee'; deleteBtn.style.color = '#c62828'; });
                        deleteBtn.addEventListener('mouseleave', () => { deleteBtn.style.background = 'transparent'; deleteBtn.style.color = '#999'; });
                        tab.appendChild(deleteBtn);
                    }
                    
                    tab.addEventListener('click', () => {
                        const allTabs = getLessonTabs();
                        const idx = allTabs.indexOf(tab);
                        if (idx >= 0) activateLessonTab(idx);
                    });
                    
                    lessonTabContainer.insertBefore(tab, addLessonTabBtn);
                    return tab;
                };
                
                const createLessonTabContent = (focusVal, whyVal, whenVal, dbId) => {
                    const contents = getLessonTabContents();
                    const content = document.createElement('div');
                    content.className = 'lesson-tab-content';
                    content.dataset.lessonIndex = contents.length;
                    content.style.display = 'none';
                    if (dbId) content.dataset.objectLeId = dbId;

                    const labelFocus = document.createElement('label');
                    labelFocus.textContent = t('lessonFocusLabel');
                    labelFocus.className = 'feedback-micro-label';
                    content.appendChild(labelFocus);

                    const taFocus = document.createElement('textarea');
                    taFocus.className = 'lesson-focus';
                    taFocus.rows = 2;
                    taFocus.placeholder = t('lessonFocusPlaceholder');
                    taFocus.classList.add('feedback-textarea');
                    if (focusVal) taFocus.value = focusVal;
                    content.appendChild(taFocus);

                    const labelWhy = document.createElement('label');
                    labelWhy.textContent = t('lessonWhyLabel');
                    labelWhy.className = 'feedback-micro-label';
                    content.appendChild(labelWhy);

                    const taWhy = document.createElement('textarea');
                    taWhy.className = 'lesson-why';
                    taWhy.rows = 2;
                    taWhy.placeholder = t('lessonWhyPlaceholder');
                    taWhy.classList.add('feedback-textarea');
                    if (whyVal) taWhy.value = whyVal;
                    content.appendChild(taWhy);

                    const labelWhen = document.createElement('label');
                    labelWhen.textContent = t('lessonWhenLabel');
                    labelWhen.className = 'feedback-micro-label';
                    content.appendChild(labelWhen);

                    const taWhen = document.createElement('textarea');
                    taWhen.className = 'lesson-when';
                    taWhen.rows = 1;
                    taWhen.placeholder = t('lessonWhenPlaceholder');
                    taWhen.classList.add('feedback-textarea');
                    if (whenVal) taWhen.value = whenVal;
                    content.appendChild(taWhen);

                    applyAutoGrow(taFocus);
                    applyAutoGrow(taWhy);
                    applyAutoGrow(taWhen);
                    lessonTabContentContainer.appendChild(content);
                    return content;
                };
                
                const deleteLessonTab = (tabEl) => {
                    const tabs = getLessonTabs();
                    const contents = getLessonTabContents();
                    if (tabs.length <= 1) {
                        alert(t('lessonDeleteLastAlert'));
                        return;
                    }
                    if (!confirm(t('lessonDeleteConfirm'))) return;
                    
                    const arrIndex = tabs.indexOf(tabEl);
                    if (arrIndex < 0) return;
                    
                    const tabContent = contents[arrIndex];
                    tabEl.remove();
                    if (tabContent) tabContent.remove();
                    
                    // Re-index
                    const remainingTabs = getLessonTabs();
                    const remainingContents = getLessonTabContents();
                    remainingTabs.forEach((t, i) => { t.dataset.lessonIndex = i; });
                    remainingContents.forEach((c, i) => { c.dataset.lessonIndex = i; });
                    
                    updateLessonTabLabels();
                    if (remainingTabs.length > 0) {
                        activateLessonTab(Math.min(arrIndex, remainingTabs.length - 1));
                    }
                };
                
                // windowオブジェクトに関数を保存（AJAX内から呼び出すため）
                window._lessonTabHelpers.createLessonTab = createLessonTab;
                window._lessonTabHelpers.createLessonTabContent = createLessonTabContent;
                window._lessonTabHelpers.activateLessonTab = activateLessonTab;
                window._lessonTabHelpers.updateLessonTabLabels = updateLessonTabLabels;
                window._lessonTabHelpers.deleteLessonTab = deleteLessonTab;
                
                // Wire existing first tab
                const firstTab = lessonTabContainer.querySelector('.lesson-tab');
                if (firstTab) {
                    firstTab.addEventListener('click', () => activateLessonTab(0));
                }
                
                // Wire add button
                addLessonTabBtn.addEventListener('click', () => {
                    createLessonTab(false);
                    createLessonTabContent('', '', '');
                    const tabs = getLessonTabs();
                    updateLessonTabLabels();
                    activateLessonTab(tabs.length - 1);
                });
                
                // Hover effect for add button
                addLessonTabBtn.addEventListener('mouseenter', () => { addLessonTabBtn.style.color = '#2a241c'; });
                addLessonTabBtn.addEventListener('mouseleave', () => { addLessonTabBtn.style.color = '#7a7166'; });
            }
        } catch (e) { console.warn('lesson tab setup error', e); }
        
        // 既存の内省タグがあれば、reflectionData から値を抽出して textarea に流し込む
        try {
            const reflectionTagNode = this.nodes.get(`reflection-tag-${this.selectId}`);
            if (reflectionTagNode) {
                // まず reflectionData から取得を試みる
                const reflectionData = reflectionTagNode.reflectionData || {};
                let successPoints = reflectionData.successPoints || '';
                let failurePoints = reflectionData.failurePoints || '';
                let completionReasonGood = reflectionData.completionReasonGood || '';
                let completionReasonBad = reflectionData.completionReasonBad || '';
                let challengesAndLearnings = reflectionData.challengesAndLearnings || '';
                let whenApplicable = reflectionData.whenApplicable || '';

                // reflectionData が空で、title がある場合は旧フォーマットからパース（後方互換性）
                if (!successPoints && !failurePoints && !challengesAndLearnings && reflectionTagNode.title) {
                    const titleText = reflectionTagNode.title || '';
                    try {
                        const lines = titleText.split(/\n|\r\n/).map(s => s.trim());
                        for (const line of lines) {
                            if (/(うまくいった点|行動意図|行動評価|評価)[:：]?/.test(line)) {
                                const m = line.split(/[:：]/);
                                successPoints = (m.slice(1).join(':') || '').trim();
                            } else if (/(うまくいかなかった点|うまくいかなかった|失敗|問題)[:：]?/.test(line)) {
                                const m = line.split(/[:：]/);
                                failurePoints = (m.slice(1).join(':') || '').trim();
                            } else if (/よかった点の原因帰属|よかった.*原因|良かった.*原因/.test(line)) {
                                const m = line.split(/[:：]/);
                                completionReasonGood = (m.slice(1).join(':') || '').trim();
                            } else if (/悪かった点の原因帰属|悪かった.*原因/.test(line)) {
                                const m = line.split(/[:：]/);
                                completionReasonBad = (m.slice(1).join(':') || '').trim();
                            } else if (/原因分析|完了基準|原因[:：]/.test(line)) {
                                const m = line.split(/[:：]/);
                                const guessed = (m.slice(1).join(':') || '').trim();
                                if (!completionReasonGood) completionReasonGood = guessed;
                                else if (!completionReasonBad) completionReasonBad = guessed;
                            } else if (/学び|学習|学んだ/.test(line)) {
                                const m = line.split(/[:：]/);
                                challengesAndLearnings = (m.slice(1).join(':') || '').trim();
                            } else if (/いつ.*活|いついかせ|いつ.*活か|活かせる/.test(line)) {
                                const m = line.split(/[:：]/);
                                whenApplicable = (m.slice(1).join(':') || '').trim();
                            }
                        }
                    } catch (e) {
                        console.warn('reflection title parse error', e);
                    }
                }
                // textarea 要素に値をセット
                try {
                    const sEl = document.getElementById('successPoints');
                    const fEl = document.getElementById('failurePoints');
                    const cElGood = document.getElementById('completionReasonGood');
                    const cElBad = document.getElementById('completionReasonBad');
                    const lEl = document.getElementById('challengesAndLearnings');
                    const wEl = document.getElementById('whenApplicable');
                    if (sEl) sEl.value = successPoints || '';
                    if (fEl) fEl.value = failurePoints || '';
                    if (cElGood) cElGood.value = completionReasonGood || '';
                    if (cElBad) cElBad.value = completionReasonBad || '';
                    if (lEl) {
                        // 初期値としてタイトルからの抽出を入れる
                        lEl.value = challengesAndLearnings || '';
                        if (wEl) wEl.value = whenApplicable || '';
                        // If still empty, try to prefill from the node's stored fields (object_nodes)
                        try {
                            const nodeData = this.nodes.get(this.selectId);
                            if (nodeData) {
                                try { if (cElGood && (!cElGood.value || cElGood.value.trim() === '')) cElGood.value = nodeData.attribution || nodeData.evaluation_good || ''; } catch(e) {}
                                try { if (cElBad && (!cElBad.value || cElBad.value.trim() === '')) cElBad.value = nodeData.attribution_bad || ''; } catch(e) {}
                                try { if (lEl && (!lEl.value || lEl.value.trim() === '')) lEl.value = nodeData.application || ''; } catch(e) {}
                                try { if (wEl && (!wEl.value || wEl.value.trim() === '')) wEl.value = nodeData.estimated_time || ''; } catch(e) {}
                            }
                        } catch(e) { /* ignore */ }
                        // DB の `object_lesson-learneds` に教訓があれば、タブ形式で表示する
                        try {
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
                                            var items = res.items;
                                            var helpers = window._lessonTabHelpers;
                                            
                                            if (helpers && items.length > 0) {
                                                // 最初の教訓はメインのtextarea（タブ#1）に入れる
                                                lEl.value = items[0].lesson_learned || items[0].application || '';
                                                try { if (document.getElementById('whyImportant')) document.getElementById('whyImportant').value = items[0].why_important || ''; } catch(e) {}
                                                try { if (wEl) wEl.value = items[0].opportunity || ''; } catch(e) {}
                                                
                                                // 最初のタブコンテンツにobject_le_idを設定
                                                var firstContent = document.querySelector('.lesson-tab-content[data-lesson-index="0"]');
                                                if (firstContent && items[0].object_le_id) {
                                                    firstContent.dataset.objectLeId = items[0].object_le_id;
                                                }
                                                
                                                // 2つ目以降の教訓は新しいタブとして追加
                                                for (var i = 1; i < items.length; i++) {
                                                    try {
                                                        var text = items[i].lesson_learned || items[i].application || '';
                                                        var why = items[i].why_important || '';
                                                        var opp = items[i].opportunity || '';
                                                        var dbId = items[i].object_le_id || '';
                                                        
                                                        // 新しいタブとコンテンツを作成
                                                        helpers.createLessonTab(false);
                                                        helpers.createLessonTabContent(text, why, opp, dbId);
                                                    } catch(e) { console.warn('failed to create lesson tab', e); }
                                                }
                                                
                                                // タブラベルを更新して最初のタブをアクティブに
                                                helpers.updateLessonTabLabels();
                                                helpers.activateLessonTab(0);
                                            } else if (items.length > 0) {
                                                // フォールバック: helpersがない場合は最初の教訓だけ表示
                                                lEl.value = items[0].lesson_learned || items[0].application || '';
                                                try { if (document.getElementById('whyImportant')) document.getElementById('whyImportant').value = items[0].why_important || ''; } catch(e) {}
                                                try { if (wEl) wEl.value = items[0].opportunity || ''; } catch(e) {}
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
                try { if (typeof updateFeedbackProgress === 'function') updateFeedbackProgress(); } catch(e) {}
                // Final fallback: ensure attribution fields are populated from the node data if still empty
                try {
                    const nodeData = this.nodes.get(this.selectId);
                    if (nodeData) {
                        const cElGood = document.getElementById('completionReasonGood');
                        const cElBad = document.getElementById('completionReasonBad');
                        const lEl = document.getElementById('challengesAndLearnings');
                        const wEl = document.getElementById('whenApplicable');
                        try { if (cElGood && (!cElGood.value || cElGood.value.trim() === '')) cElGood.value = nodeData.attribution || nodeData.evaluation_good || ''; } catch(e) {}
                        try { if (cElBad && (!cElBad.value || cElBad.value.trim() === '')) cElBad.value = nodeData.attribution_bad || ''; } catch(e) {}
                        try { if (lEl && (!lEl.value || lEl.value.trim() === '')) lEl.value = nodeData.application || ''; } catch(e) {}
                        try { if (wEl && (!wEl.value || wEl.value.trim() === '')) wEl.value = nodeData.estimated_time || ''; } catch(e) {}
                    }
                } catch(e) { /* ignore */ }
            }
        } catch (e) {
            console.warn('error while pre-filling feedbackTooltip from reflection-tag', e);
        }
    }

    setupReflectionHistoryButton() {
        const historyBtn = document.getElementById('btnReflectionHistory');
        const tooltip = document.getElementById('feedbackTooltip');
        if (!historyBtn || !tooltip) return;

        historyBtn.addEventListener('click', () => {
            const isOpen = tooltip.classList.contains('feedback-drawer-open');
            if (isOpen) {
                tooltip.classList.remove('feedback-drawer-open');
                historyBtn.textContent = '過去の記録を見る';
                historyBtn.setAttribute('aria-expanded', 'false');
                return;
            }
            tooltip.classList.add('feedback-drawer-open');
            historyBtn.textContent = '過去の記録を閉じる';
            historyBtn.setAttribute('aria-expanded', 'true');
            this.loadReflectionHistory();
        });
    }

    escapeReflectionHtml(value) {
        const str = value === null || value === undefined ? '' : String(value);
        return str.replace(/[&<>"]/g, (ch) => {
            switch (ch) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                default: return ch;
            }
        });
    }

    formatReflectionDateTime(ts) {
        if (!ts) return '';
        const clean = String(ts).replace(/\.\d+$/, '');
        const parts = clean.split(' ');
        if (parts.length === 0) return clean;
        const datePart = parts[0] || '';
        const timePart = parts[1] || '';
        const d = datePart.split('-');
        const t = timePart.split(':');
        if (d.length < 3) return clean;
        const yyyy = d[0];
        const mm = d[1] || '00';
        const dd = d[2] || '00';
        const hh = t[0] || '00';
        const mi = t[1] || '00';
        return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
    }

    buildReflectionHistoryItemHTML(rec, isOpen) {
        const created = this.formatReflectionDateTime(rec.created_at);
        const good = this.escapeReflectionHtml(rec.evaluation_good || '');
        const goodReason = this.escapeReflectionHtml(rec.attribution || '');
        const bad = this.escapeReflectionHtml(rec.evaluation_bad || '');
        const badReason = this.escapeReflectionHtml(rec.attribution_bad || '');
        const lessons = Array.isArray(rec.lessons) ? rec.lessons : [];

        const lessonsHtml = lessons.length > 0
            ? lessons.map((l) => {
                const opp = this.escapeReflectionHtml(l.opportunity || '');
                const text = this.escapeReflectionHtml(l.lesson_learned || l.lesson || '');
                const why = this.escapeReflectionHtml(l.why_important || '');
                const attrText = (text || '').replace(/\s+/g, ' ').trim();
                return `
                    <div class="history-lesson-item">
                        <div class="history-lesson-text">${text || '-'}</div>
                        ${why ? `<div class="history-lesson-why">${why}</div>` : ''}
                        ${opp ? `<div class="history-lesson-opportunity">${opp}</div>` : ''}
                        <button type="button" class="history-copy-btn" data-lesson-text="${attrText}">教訓をコピー</button>
                    </div>
                `;
            }).join('')
            : '<div class="history-empty">教訓はありません。</div>';

        return `
            <div class="history-timeline-item">
                <div class="history-timeline-dot"></div>
                <div class="history-timeline-line"></div>
                <details class="history-card" ${isOpen ? 'open' : ''}>
                    <summary class="history-card-header">
                        <span class="history-card-date">${created || '日時不明'}</span>
                    </summary>
                    <div class="history-card-body">
                        <div class="history-lesson">
                            <div class="history-lesson-title"><span class="history-icon">💡</span>教訓</div>
                            <div class="history-lesson-list">${lessonsHtml}</div>
                        </div>
                        <div class="history-section">
                            <div class="history-section-title history-good"><span class="history-icon">😊</span>うまくいった点</div>
                            <div class="history-section-content">${good || '-'}</div>
                            <div class="history-section-title history-good"><span class="history-icon">✅</span>理由</div>
                            <div class="history-section-content">${goodReason || '-'}</div>
                        </div>
                        <div class="history-section">
                            <div class="history-section-title history-bad"><span class="history-icon">😔</span>うまくいかなかった点</div>
                            <div class="history-section-content">${bad || '-'}</div>
                            <div class="history-section-title history-bad"><span class="history-icon">🧭</span>理由</div>
                            <div class="history-section-content">${badReason || '-'}</div>
                        </div>
                    </div>
                </details>
            </div>
        `;
    }

    prependReflectionHistoryItem(rec) {
        const listEl = document.getElementById('reflectionHistoryList');
        if (!listEl) return;

        const emptyEl = listEl.querySelector('[data-empty="1"]');
        if (emptyEl) listEl.innerHTML = '';

        const html = this.buildReflectionHistoryItemHTML(rec, true);
        listEl.insertAdjacentHTML('afterbegin', html);
    }

    loadReflectionHistory() {
        const listEl = document.getElementById('reflectionHistoryList');
        if (!listEl) return;

        listEl.innerHTML = '<div class="history-empty">読み込み中...</div>';

        $.ajax({
            url: 'php/get_reflection_records.php',
            type: 'GET',
            dataType: 'json',
            data: { object_node_id: this.selectId },
            success: (res) => {
                if (!res || !res.success) {
                    listEl.innerHTML = '<div class="history-empty history-error">読み込みに失敗しました。</div>';
                    return;
                }
                const records = Array.isArray(res.records) ? res.records : [];
                const visibleRecords = records.length > 1 ? records.slice(1) : [];
                if (visibleRecords.length === 0) {
                    listEl.innerHTML = '<div data-empty="1" class="history-empty">過去の記録はありません。</div>';
                    return;
                }

                const html = visibleRecords.map((rec, idx) => this.buildReflectionHistoryItemHTML(rec, idx === 0)).join('');
                listEl.innerHTML = html;
            },
            error: () => {
                listEl.innerHTML = '<div class="history-empty history-error">読み込みに失敗しました。</div>';
            }
        });
    }

    saveReflectionHistoryRecord(payload) {
        const postData = {
            object_node_id: payload.object_node_id,
            evaluation_good: payload.evaluation_good || '',
            evaluation_bad: payload.evaluation_bad || '',
            attribution: payload.attribution || '',
            attribution_bad: payload.attribution_bad || ''
        };

        if (payload.lessons && payload.lessons.length > 0) {
            postData.lessons_json = JSON.stringify(payload.lessons);
        }

        $.ajax({
            url: 'php/insert_reflection_record.php',
            type: 'POST',
            data: postData,
            success: (res) => {
                try {
                    const parsed = typeof res === 'string' ? JSON.parse(res) : res;
                    if (!parsed || !parsed.success) {
                        console.warn('reflection history save failed', parsed);
                        return;
                    }

                    const nowStamp = new Date();
                    const localStamp = `${nowStamp.getFullYear()}-${String(nowStamp.getMonth() + 1).padStart(2, '0')}-${String(nowStamp.getDate()).padStart(2, '0')} ${String(nowStamp.getHours()).padStart(2, '0')}:${String(nowStamp.getMinutes()).padStart(2, '0')}:00`;

                    const tooltip = document.getElementById('feedbackTooltip');
                    const isOpen = !!(tooltip && tooltip.classList.contains('feedback-drawer-open'));
                    if (isOpen) {
                        this.loadReflectionHistory();
                    }
                } catch (e) {
                    console.warn('reflection history response parse error', e);
                }
            },
            error: function(xhr) {
                console.warn('reflection history save error', xhr && xhr.responseText ? xhr.responseText : xhr);
            }
        });
    }
    
    setupTooltipAutoSave(tooltip) {
        const cancelButton = document.getElementById("btnCancelFeedback");
        if (cancelButton) {
            cancelButton.addEventListener("click", () => {
                try { tooltip.style.display = "none"; } catch (e) { console.warn('failed to close tooltip on cancel', e); }
            });
        }
        
        
        const saveStatusBtn = document.getElementById("node-reflection-save-status");
        if (saveStatusBtn) {
            saveStatusBtn.addEventListener("click", () => {
                if (saveStatusBtn.disabled) return;
                executeSave();
            });
        }
        
        const finishBtn = document.getElementById("btn-finish-reflection");
        if (finishBtn) {
            finishBtn.addEventListener("click", () => {
                executeSave();
                try { tooltip.style.display = "none"; } catch (e) { console.warn('failed to close tooltip', e); }
            });
        }
        
        const executeSave = () => {
            if (saveStatusBtn) {
                saveStatusBtn.textContent = "保存中...";
                saveStatusBtn.disabled = true;
                saveStatusBtn.classList.remove("has-changes");
                saveStatusBtn.classList.add("saving");
            }
            if (finishBtn) {
                finishBtn.textContent = "保存中...";
                finishBtn.disabled = true;
            }

            // Undo/Redo: 古いステータスを保存（保存ボタン押下時に取得）
            const oldNodeForUndo = this.nodes.get(this.selectId);
            const oldStatusForUndo = oldNodeForUndo ? oldNodeForUndo.status : 'todo';
            
            const successPoints = (document.getElementById("successPoints") || {value:''}).value.trim();
            const failurePoints = (document.getElementById("failurePoints") || {value:''}).value.trim();
            const completionReasonGood = (document.getElementById("completionReasonGood") || {value:''}).value.trim();
            const completionReasonBad = (document.getElementById("completionReasonBad") || {value:''}).value.trim();
            const completionReason = [completionReasonGood, completionReasonBad].filter(Boolean).join('\n\n');
            
            // タブ形式の教訓を収集（複数教訓対応）
            let lessonsArray = [];
            let challengesAndLearnings = '';
            let whenApplicable = '';
            
            try {
                // 最初の教訓（固定のID）
                const firstLesson = (document.getElementById("challengesAndLearnings") || {value:''}).value.trim();
                const firstWhy = (document.getElementById("whyImportant") || {value:''}).value.trim();
                const firstWhen = (document.getElementById("whenApplicable") || {value:''}).value.trim();
                if (firstLesson || firstWhy || firstWhen) {
                    lessonsArray.push({ lesson: firstLesson, why_important: firstWhy, opportunity: firstWhen });
                }
                
                // タブコンテンツから追加の教訓を収集
                const tabContents = document.querySelectorAll('.lesson-tab-content');
                tabContents.forEach((content, idx) => {
                    // 最初のタブはIDベースで既に取得済みなのでスキップ
                    if (idx === 0) return;
                    
                    const focusEl = content.querySelector('.lesson-focus');
                    const whyEl = content.querySelector('.lesson-why');
                    const whenEl = content.querySelector('.lesson-when');
                    const lessonText = focusEl ? focusEl.value.trim() : '';
                    const whyText = whyEl ? whyEl.value.trim() : '';
                    const whenText = whenEl ? whenEl.value.trim() : '';
                    const dbId = content.dataset.objectLeId || '';
                    
                    if (lessonText || whyText || whenText) {
                        lessonsArray.push({ lesson: lessonText, why_important: whyText, opportunity: whenText, object_le_id: dbId });
                    }
                });
                
                // 後方互換性のため、全教訓を結合した文字列も作成
                if (lessonsArray.length > 0) {
                    challengesAndLearnings = lessonsArray.map(l => l.lesson).join('\n\n');
                    whenApplicable = lessonsArray[0].opportunity || '';
                }
            } catch (e) {
                console.warn('Failed to collect lessons from tabs', e);
                // フォールバック: 従来の方法
                challengesAndLearnings = (document.getElementById("challengesAndLearnings") || {value:''}).value.trim();
                whenApplicable = (document.getElementById("whenApplicable") || {value:''}).value.trim();
            }

                // 互換性のため、従来の evaluation_good には成功・失敗を結合して送る
            const combinedActionReason = [successPoints, failurePoints].filter(Boolean).join('\n');

            // サーバーにデータを送信（新しいフィールドも追加）
            const payload = {};
            // only include non-empty values so server can keep NULLs when empty
            if (combinedActionReason) payload.evaluation_good = combinedActionReason;
            if (successPoints) payload.success_points = successPoints;
            if (failurePoints) payload.failure_points = failurePoints;
            if (completionReason) payload.attribution = completionReason;
            if (completionReasonGood) payload.attribution_good = completionReasonGood;
            if (completionReasonBad) payload.attribution_bad = completionReasonBad;
            // Note: lessons are saved via insert_reflection_record.php to avoid double inserts
            payload.object_node_id = this.selectId;
            payload.purpose = 'record';
            payload.record_thing = 'reflection';

            const historyPayload = {
                object_node_id: this.selectId,
                evaluation_good: successPoints,
                evaluation_bad: failurePoints,
                attribution: completionReasonGood,
                attribution_bad: completionReasonBad,
                lessons: lessonsArray.map((l) => ({
                    lesson: l.lesson || l.lesson_learned || '',
                    why_important: l.why_important || '',
                    opportunity: l.opportunity || ''
                }))
            };

            $.ajax({
                url: "php/object_maneger.php",
                type: "POST",
                data: payload,
                success: (response) => {
                    console.log("サーバーの応答:", response);
                    this.saveReflectionHistoryRecord(historyPayload);

                    // ノードの見た目を更新（完了状態にする）
                    this.nodes.update({
                        id: this.selectId,
                        status: 'completed',
                        color: 'gray',
                        title: '作業完了',
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
                    
                    // Undo/Redo: ステータス変更を記録
                    if (undoRedoManager && oldStatusForUndo !== 'completed') {
                        undoRedoManager.recordAction({
                            type: 'CHANGE_STATUS',
                            nodeId: this.selectId,
                            oldStatus: oldStatusForUndo,
                            newStatus: 'completed'
                        });
                    }

                    // 内省情報がある場合、内省タグを右上に追加
                    if (successPoints || failurePoints || completionReason || challengesAndLearnings) {
                        const nodeBoundingBox = this.ownNetwork.getBoundingBox(this.selectId);
                        const reflectionTagId = `reflection-tag-${this.selectId}`;
                        
                        // ツールチップ用のテキストを生成
                        const titleParts = [];
                        if (successPoints) titleParts.push(`【成功点】${successPoints}`);
                        if (completionReasonGood) titleParts.push(`【成功の理由】${completionReasonGood}`);
                        if (failurePoints) titleParts.push(`【失敗点】${failurePoints}`);
                        if (completionReasonBad) titleParts.push(`【失敗の理由】${completionReasonBad}`);
                        if (challengesAndLearnings) titleParts.push(`【今後の教訓】${challengesAndLearnings}`);
                        if (whenApplicable) titleParts.push(`【適用場面】${whenApplicable}`);
                        const titleText = titleParts.join('<br>');

                        // 既存の内省タグがあるかチェック
                        const existingReflectionTag = this.nodes.get(reflectionTagId);
                        if (existingReflectionTag) {
                            // 既存のタグを更新
                            this.nodes.update({
                                id: reflectionTagId,
                                label: '📝',
                                shape: 'text',
                                font: { 
                                    size: 24,
                                    face: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
                                },
                                title: titleText || '内省データ',
                                reflectionData: {
                                    successPoints: successPoints || '',
                                    failurePoints: failurePoints || '',
                                    completionReasonGood: completionReasonGood || '',
                                    completionReasonBad: completionReasonBad || '',
                                    challengesAndLearnings: challengesAndLearnings || '',
                                    whenApplicable: whenApplicable || ''
                                }
                            });
                            console.log('既存の内省タグを更新しました:', reflectionTagId);
                        } else {
                            // 新しい内省タグを追加
                            const reflectionTag = {
                                id: reflectionTagId,
                                label: '📝',
                                shape: 'text',
                                font: { 
                                    size: 24,
                                    face: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
                                },
                                x: nodeBoundingBox.right - 4,
                                y: nodeBoundingBox.top + 4,
                                fixed: true,
                                physics: false,
                                group: 'reflection-tag',
                                title: titleText || '内省データ',
                                reflectionData: {
                                    successPoints: successPoints || '',
                                    failurePoints: failurePoints || '',
                                    completionReasonGood: completionReasonGood || '',
                                    completionReasonBad: completionReasonBad || '',
                                    challengesAndLearnings: challengesAndLearnings || '',
                                    whenApplicable: whenApplicable || ''
                                }
                            };
                            this.nodes.add(reflectionTag);
                            this._needsCollisionResolution = true;
                            console.log('新しい内省タグを追加しました:', reflectionTagId);
                        }
                    }

                    console.log(`ノード ${this.selectId} のタイトルを更新しました。`);
                    if (saveStatusBtn) {
                        saveStatusBtn.textContent = "保存済み";
                        saveStatusBtn.classList.remove("saving");
                    }
                    if (finishBtn) {
                        finishBtn.textContent = "振り返りを終える";
                        finishBtn.disabled = false;
                    }
                },
                error: (error) => {
                    console.error("記録保存中にエラーが発生しました:", error);
                    if (saveStatusBtn) {
                        saveStatusBtn.textContent = "保存失敗";
                        saveStatusBtn.classList.remove("saving");
                        saveStatusBtn.disabled = false;
                        saveStatusBtn.classList.add("has-changes");
                    }
                    if (finishBtn) {
                        finishBtn.textContent = "保存失敗";
                        finishBtn.disabled = false;
                    }
                }
            });

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

                
            console.log(`ノード ${this.selectId} の作業完了だよ！！`);
            // ステータスを completed に更新
            defaultRecordThinkingProcess.update_Node("status", this.selectId, "completed", 7);
        }; // executeSave end

        // 全てのテキストエリアにinputイベントをバインドしてボタンをアクティブ化
        const textareas = tooltip.querySelectorAll('.feedback-textarea, .lesson-focus, .lesson-why, .lesson-when');
        textareas.forEach(ta => {
            ta.addEventListener('input', () => {
                if (saveStatusBtn && saveStatusBtn.disabled) {
                    saveStatusBtn.textContent = "変更を保存する";
                    saveStatusBtn.classList.add("has-changes");
                    saveStatusBtn.disabled = false;
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
        const networkCanvas = document.getElementById("myProcessnetwork");
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
        addButton.title = 'クリックで手段追加 / ドラッグでエッジ接続';
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

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        const threshold = 5; // 5px以上の移動でドラッグ判定

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
                if (!isDragging) {
                    this.hideAddNodeButton();
                }
            }, 200);
        });

        // ドラッグ用ポインター移動イベント
        const onPointerMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (!isDragging && distance > threshold) {
                isDragging = true;
                // ドラッグ開始を認識したらボタンを半透明にする
                addButton.style.opacity = '0.3';
            }

            if (isDragging) {
                // ボタンの中心座標から現在のカーソル位置までプレビュー線を描画
                drawEdgeDragPreview(buttonX + 12, buttonY + 12, moveEvent.clientX, moveEvent.clientY);
            }
        };

        // ドラッグ終了（マウスリリース）イベント
        const onPointerUp = (upEvent) => {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);

            if (isDragging) {
                removeEdgeDragPreview();
                isDragging = false;
                
                // ドロップ位置の vis.js ノードを取得
                const rect = networkCanvas.getBoundingClientRect();
                const domPos = {
                    x: upEvent.clientX - rect.left,
                    y: upEvent.clientY - rect.top
                };
                const dropNodeId = this.ownNetwork.getNodeAt(domPos);

                console.log("📍 Drag & Drop Connection Debug:", {
                    clientX: upEvent.clientX,
                    clientY: upEvent.clientY,
                    rectLeft: rect.left,
                    rectTop: rect.top,
                    domX: domPos.x,
                    domY: domPos.y,
                    startNodeId: nodeId,
                    dropNodeId: dropNodeId
                });

                if (dropNodeId && dropNodeId !== nodeId) {
                    const success = this.addEdgeBetweenNodes(nodeId, dropNodeId);
                    if (success) {
                        // 結線成功時に理由入力ダイアログを表示
                        setTimeout(() => {
                            this.selectId = dropNodeId;
                            try { sessionStorage.setItem('currentSelectId', dropNodeId); } catch(e) {}
                            
                            // 結線時の新しい一画面モーダル「接続モード（connect）」起動
                            this.openActionModal({
                                mode: 'connect',
                                parentNode: this.nodes.get(nodeId),
                                childNode: this.nodes.get(dropNodeId),
                                focusTarget: 'reason'
                            });
                        }, 100);
                    }
                }
            } else {
                // 通常クリック時は新規ノード自動生成
                if (!this.isViewingPastData) {
                    this.openActionModal('add', nodeId, 'name');
                }
            }
            
            this.hideAddNodeButton();
        };

        // mousedown/pointerdown でドラッグ＆クリック判定を開始
        // 過去表示中は無効化
        if (this.isViewingPastData) {
            addButton.disabled = true;
            addButton.setAttribute('aria-disabled', 'true');
            addButton.title = '過去表示では操作できません';
            addButton.style.opacity = '0.45';
            addButton.style.cursor = 'not-allowed';
        } else {
            addButton.addEventListener('pointerdown', (downEvent) => {
                downEvent.stopPropagation();
                downEvent.preventDefault();

                isDragging = false;
                startX = downEvent.clientX;
                startY = downEvent.clientY;

                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', onPointerUp);
            });
        }

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

    // 内省タグのカスタムツールチップを表示
    showReflectionTooltip(nodeId, params) {
        console.log('showReflectionTooltip called for:', nodeId);
        const tooltip = document.getElementById('reflection-tooltip');
        if (!tooltip) {
            console.log('tooltip element not found');
            return;
        }

        // ノードデータを取得（内省タグ自体）
        const nodeData = this.nodes.get(nodeId);
        if (!nodeData) {
            console.log('nodeData not found for:', nodeId);
            return;
        }
        console.log('nodeData:', nodeData);

        // reflectionData から内省情報を取得
        const reflectionData = nodeData.reflectionData || {};
        console.log('reflectionData:', reflectionData);
        let successContent = reflectionData.successPoints || '';
        let failureContent = reflectionData.failurePoints || '';
        let completionReasonGood = reflectionData.completionReasonGood || '';
        let completionReasonBad = reflectionData.completionReasonBad || '';
        let lessonContent = reflectionData.challengesAndLearnings || '';

        // 対応する親ノードからも取得を試みる（フォールバック）
        if (!successContent && !failureContent && !lessonContent) {
            const parentNodeId = nodeId.replace('reflection-tag-', '');
            const parentNode = this.nodes.get(parentNodeId);
            if (parentNode) {
                successContent = parentNode.evaluation_good || '';
                failureContent = parentNode.attribution_bad || parentNode.attribution || '';
                lessonContent = parentNode.application || '';
            }
        }

        // コンテンツを設定（記述のみ、記載がない場合は非表示）
        const successEl = document.getElementById('reflection-success-content');
        const successReasonEl = document.getElementById('reflection-success-reason');
        const failureEl = document.getElementById('reflection-failure-content');
        const failureReasonEl = document.getElementById('reflection-failure-reason');
        const lessonEl = document.getElementById('reflection-lesson-content');

        // 成功セクション
        if (successEl) successEl.textContent = successContent || '';
        if (successReasonEl) successReasonEl.textContent = completionReasonGood || '';
        
        // 成功セクションの表示/非表示
        const successSection = successEl ? successEl.closest('.reflection-section') : null;
        if (successSection) successSection.style.display = successContent ? 'flex' : 'none';
        if (successReasonEl) successReasonEl.style.display = completionReasonGood ? 'block' : 'none';

        // 失敗セクション
        if (failureEl) failureEl.textContent = failureContent || '';
        if (failureReasonEl) failureReasonEl.textContent = completionReasonBad || '';
        
        // 失敗セクションの表示/非表示
        const failureSection = failureEl ? failureEl.closest('.reflection-section') : null;
        if (failureSection) failureSection.style.display = failureContent ? 'flex' : 'none';
        if (failureReasonEl) failureReasonEl.style.display = completionReasonBad ? 'block' : 'none';

        // 教訓の表示（DBから取得して複数表示）
        const whenApplicableEl = document.getElementById('reflection-when-applicable');
        const lessonContentEl = document.getElementById('reflection-lesson-content');
        
        // 親ノードIDを取得してDBから教訓を取得
        const parentNodeId = nodeId.replace('reflection-tag-', '');
        
        // DBから教訓を取得
        $.ajax({
            url: 'php/get_lessons.php',
            type: 'GET',
            dataType: 'json',
            data: { object_node_id: parentNodeId },
            success: function(res) {
                try {
                    if (res && res.success && Array.isArray(res.items) && res.items.length > 0) {
                        // 複数の教訓を縦に並べて表示（左側に矢印付き）
                        var combinedHtml = '';
                        res.items.forEach(function(item, index) {
                            var opp = item.opportunity || '';
                            var lesson = item.lesson_learned || item.application || '';
                            if (opp || lesson) {
                                if (index > 0) combinedHtml += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;"></div>';
                                combinedHtml += '<div style="display:flex;align-items:stretch;">';
                                combinedHtml += '<div style="display:flex;align-items:center;padding-right:8px;color:#f9a825;font-size:20px;">→</div>';
                                combinedHtml += '<div style="flex:1;">';
                                if (opp) combinedHtml += '<div style="font-weight:600;color:#333;">' + opp + '</div>';
                                if (lesson) combinedHtml += '<div style="color:#555;margin-top:2px;">' + lesson + '</div>';
                                combinedHtml += '</div></div>';
                            }
                        });
                        // whenApplicableElを非表示にして、lessonContentElに全て表示
                        if (whenApplicableEl) whenApplicableEl.style.display = 'none';
                        if (lessonContentEl) {
                            lessonContentEl.innerHTML = combinedHtml;
                            lessonContentEl.style.display = combinedHtml ? 'block' : 'none';
                        }
                    } else {
                        // フォールバック: reflectionDataから表示
                        if (whenApplicableEl) {
                            whenApplicableEl.textContent = reflectionData.whenApplicable || '';
                            whenApplicableEl.style.display = reflectionData.whenApplicable ? 'block' : 'none';
                        }
                        if (lessonContentEl) {
                            lessonContentEl.textContent = lessonContent || '';
                            lessonContentEl.style.display = lessonContent ? 'block' : 'none';
                        }
                    }
                } catch(e) {
                    console.warn('reflection tooltip lessons error', e);
                }
            },
            error: function() {
                // エラー時はフォールバック
                if (whenApplicableEl) {
                    whenApplicableEl.textContent = reflectionData.whenApplicable || '';
                    whenApplicableEl.style.display = reflectionData.whenApplicable ? 'block' : 'none';
                }
                if (lessonContentEl) {
                    lessonContentEl.textContent = lessonContent || '';
                    lessonContentEl.style.display = lessonContent ? 'block' : 'none';
                }
            }
        });

        // ノードの位置を取得してツールチップを配置
        const nodePositions = this.ownNetwork.getPositions([nodeId]);
        const nodePos = nodePositions[nodeId];
        if (!nodePos) {
            console.log('nodePos not found');
            return;
        }

        // キャンバス座標をDOM座標に変換
        const canvasPosition = this.ownNetwork.canvasToDOM({ x: nodePos.x, y: nodePos.y });
        console.log('canvasPosition:', canvasPosition);

        // ネットワークコンテナの位置を取得
        const networkContainer = document.getElementById('myProcessnetwork');
        const containerRect = networkContainer ? networkContainer.getBoundingClientRect() : { left: 0, top: 0 };
        console.log('containerRect:', containerRect);

        // ツールチップの位置を設定（ノードの右側に表示、viewport基準で固定）
        const tooltipX = containerRect.left + canvasPosition.x + 30;
        const tooltipY = containerRect.top + canvasPosition.y - 50;
        
        console.log('tooltip position:', tooltipX, tooltipY);

        tooltip.style.position = 'fixed';  // absolute から fixed に変更
        tooltip.style.left = tooltipX + 'px';
        tooltip.style.top = tooltipY + 'px';
        tooltip.style.zIndex = '99999';  // より高い z-index を設定
        tooltip.classList.add('visible');
        console.log('tooltip should be visible now, classes:', tooltip.classList);
    }

    // 内省タグのカスタムツールチップを非表示
    hideReflectionTooltip() {
        const tooltip = document.getElementById('reflection-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
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
        
        // 元のエッジの理由（toノードへの理由）を保存
        const originalToNodeId = edge.to;
        let originalReasonText = '';
        
        // 1. エッジのtitle（ツールチップ）から理由を抽出
        if (edge.title && edge.title.includes('理由:')) {
            const match = edge.title.match(/理由:\s*(.+)/);
            if (match && match[1]) {
                originalReasonText = match[1].trim();
            }
        }
        
        // 2. toノードのpurposeフィールドから取得
        if (!originalReasonText || originalReasonText.trim() === '') {
            const toNode = this.nodes.get(originalToNodeId);
            if (toNode && toNode.purpose && toNode.purpose.trim() !== '') {
                originalReasonText = toNode.purpose;
            }
        }
        
        // 3. ReasonContent配列から取得
        if (!originalReasonText || originalReasonText.trim() === '') {
            const rIdx = this.ReasonConnectNodeId.indexOf(originalToNodeId);
            if (rIdx !== -1 && this.ReasonContent[rIdx]) {
                originalReasonText = this.ReasonContent[rIdx];
            }
        }
        
        console.log(`元のエッジの理由: "${originalReasonText}"`);
        
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
        const allEdgesBeforeAdd = this.edges.get();
        console.log(`📋 現在のエッジ数: ${allEdgesBeforeAdd.length}`);
        
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
        
        // 新しいエッジを作成（from -> 新しいノード）- 点線（理由は後で入力される）
        console.log(`🔗 新しいエッジ1を作成中: ${edge.from} -> ${newNodeId}`);
        const newEdgeId1 = this.generateUniqueNumberText();
        const newEdgeData1 = {
            id: String(newEdgeId1),
            from: String(edge.from),
            to: String(newNodeId)
        };

        // エッジ1にも明示色を設定（未設定だとデフォルトの黒系になる）
        {
            const fromNode1 = this.nodes.get(edge.from);
            let baseColor1 = '#a8d5a2';
            if (fromNode1 && fromNode1.color) {
                if (typeof fromNode1.color === 'string') {
                    baseColor1 = fromNode1.color;
                } else if (fromNode1.color.background) {
                    baseColor1 = fromNode1.color.background;
                }
            }
            const edgeColor1 = darkenColor(baseColor1, 0.3);
            newEdgeData1.color = {
                color: edgeColor1,
                highlight: edgeColor1,
                hover: edgeColor1
            };
        }
        
        console.log(`➕ エッジ1を追加中:`, newEdgeData1);
        this.edges.add(newEdgeData1);
        
        // 新しいエッジを作成（新しいノード -> to）- 元の理由を引き継ぐ
        console.log(`🔗 新しいエッジ2を作成中: ${newNodeId} -> ${edge.to}`);
        const newEdgeId2 = this.generateUniqueNumberText();
        const newEdgeData2 = {
            id: String(newEdgeId2),
            from: String(newNodeId),
            to: String(edge.to)
        };

        // エッジ2にも明示色を設定（理由未設定時でも黒矢印にしない）
        {
            const fromNode2 = this.nodes.get(newNodeId);
            let baseColor2 = '#a8d5a2';
            if (fromNode2 && fromNode2.color) {
                if (typeof fromNode2.color === 'string') {
                    baseColor2 = fromNode2.color;
                } else if (fromNode2.color.background) {
                    baseColor2 = fromNode2.color.background;
                }
            }
            const edgeColor2 = darkenColor(baseColor2, 0.3);
            newEdgeData2.color = {
                color: edgeColor2,
                highlight: edgeColor2,
                hover: edgeColor2
            };
        }
        
        // 元のエッジに理由があった場合、新ノード→toのエッジに引き継ぐ
        if (originalReasonText && originalReasonText.trim() !== '') {
            // 新ノードの色を取得してエッジ色を設定
            const newNode = this.nodes.get(newNodeId);
            let nodeColor = '#888888';
            if (newNode && newNode.color) {
                if (typeof newNode.color === 'string') {
                    nodeColor = newNode.color;
                } else if (newNode.color.background) {
                    nodeColor = newNode.color.background;
                }
            }
            const edgeColor = darkenColor(nodeColor, 0.3);
            
            newEdgeData2.dashes = false; // 実線
            newEdgeData2.width = 3;
            newEdgeData2.color = {
                color: edgeColor,
                highlight: edgeColor,
                hover: edgeColor
            };
            newEdgeData2.title = '💡 理由: ' + originalReasonText;
            console.log(`元の理由を新ノード→toのエッジに引き継ぎました: "${originalReasonText}"`);
        }
        
        // 元のエッジにラベルがあった場合、新ノード→toのエッジに引き継ぐ
        if (originalEdgeLabel) {
            newEdgeData2.label = originalEdgeLabel;
            newEdgeData2.font = {
                size: 12,
                color: '#333333',
                background: 'rgba(255, 255, 255, 0.8)',
                strokeWidth: 1,
                strokeColor: '#ffffff'
            };
            this.EdgeLabels[newEdgeId2] = originalEdgeLabel;
        }
        
        console.log(`➕ エッジ2を追加中:`, newEdgeData2);
        this.edges.add(newEdgeData2);
        
        // データベースに新しいエッジを記録
        if (typeof defaultRecordThinkingProcess !== 'undefined' && defaultRecordThinkingProcess.record_Edge) {
            defaultRecordThinkingProcess.record_Edge(newEdgeId1, edge.from, newNodeId, '');
            defaultRecordThinkingProcess.record_Edge(newEdgeId2, newNodeId, edge.to, originalEdgeLabel || '');
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

        // 新しいノードの理由記述ダイアログを表示（from→新ノードのエッジに対する理由）
        setTimeout(() => {
            this.selectId = newNodeId;
            // BoxDisplayの位置を新しいノードの近くに設定
            const newNodeBoundingBox = this.ownNetwork.getBoundingBox(newNodeId);
            if (newNodeBoundingBox) {
                const nodeScreenPos = this.ownNetwork.canvasToDOM({
                    x: midPoint.x,
                    y: newNodeBoundingBox.bottom
                });
                const networkCanvas = document.getElementById("myProcessnetwork2");
                const canvasRect = networkCanvas.getBoundingClientRect();
                this.BoxDisplay.x = canvasRect.left + nodeScreenPos.x;
                this.BoxDisplay.y = canvasRect.top + nodeScreenPos.y + 20;
            }
            this.show_reason_input();
        }, 100);
    }

    // モーダル一元管理（追加・編集・接続）
    openActionModal(modeOrConfig, targetNodeId, focusTarget = 'name', providedReason = null) {
        let config;
        if (typeof modeOrConfig === 'object' && modeOrConfig !== null) {
            config = modeOrConfig;
        } else {
            config = { mode: modeOrConfig, targetNodeId, focusTarget, providedReason };
        }
        
        const mode = config.mode;
        const fTarget = config.focusTarget || 'name';
        const pReason = config.providedReason || null;
        
        const modal = document.getElementById('modal-add-action');
        const parentTextSpan = document.getElementById('parent-node-text');
        const inputName = document.getElementById('action-name');
        const inputReason = document.getElementById('action-reason');
        const btnSubmit = document.getElementById('unified-action-submit');
        const btnCancel = document.getElementById('unified-action-cancel');

        if (!modal) {
            console.error('モーダル要素が見つかりません');
            return;
        }

        let parentNode = null;
        let editNode = null;
        let initialReason = pReason || '';

        if (mode === 'connect') {
            parentNode = config.parentNode;
            editNode = config.childNode;
            if (!parentNode || !editNode) return;
            btnSubmit.textContent = '手段追加';
            initialReason = ''; // 接続時は理由を空からスタート
        } else if (mode === 'add') {
            parentNode = this.nodes.get(config.targetNodeId);
            if (!parentNode) return;
            btnSubmit.textContent = '手段追加';
        } else if (mode === 'edit') {
            editNode = this.nodes.get(config.targetNodeId);
            if (!editNode) return;
            
            btnSubmit.textContent = '更新';
            
            // 親ノードを探す
            const edges = this.edges.get();
            const parentEdge = edges.find(edge => edge.to === config.targetNodeId);
            if (parentEdge && parentEdge.from) {
                parentNode = this.nodes.get(parentEdge.from);
            } else {
                parentNode = editNode; // フォールバック
            }
            
            // 既存の理由を取得 (providedReason がない場合)
            if (!initialReason) {
                const rIdx = this.ReasonConnectNodeId.indexOf(config.targetNodeId);
                if (rIdx !== -1 && this.ReasonContent[rIdx]) {
                    initialReason = this.ReasonContent[rIdx];
                } else if (editNode.purpose && editNode.purpose.trim() !== '') {
                    initialReason = editNode.purpose;
                }
            }
        }

        // 親ノードのテキストをセット（label または topic）
        const parentLabel = (parentNode && (parentNode.label || parentNode.topic)) ? (parentNode.label || parentNode.topic) : '親ノード';
        
        // 親ノードがルート（最上位）か判定する（親へ向かうエッジがない場合ルートとみなす）
        const allEdges = this.edges.get();
        const isRootNode = parentNode ? !allEdges.some(edge => edge.to === parentNode.id) : false;
        
        const labelElement = document.getElementById('action-name-label');
        if (labelElement) {
            if (isRootNode) {
                labelElement.innerHTML = `「<span id="parent-node-text">${parentLabel}</span>」を明らかにするためにどのような手段を行いますか？`;
            } else {
                labelElement.innerHTML = `「<span id="parent-node-text">${parentLabel}</span>」を実行するためにどのような手段を行いますか？`;
            }
        } else if (parentTextSpan) {
            parentTextSpan.textContent = parentLabel; // フォールバック
        }

        // 高さを自動調整する共通関数
        const autoResizeTextarea = (textarea) => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };

        // リアルタイム自動伸縮のバインド
        [inputName, inputReason].forEach(textarea => {
            textarea.oninput = function() {
                autoResizeTextarea(this);
            };
        });

        // 入力をセット
        if (mode === 'add') {
            inputName.value = '';
            inputReason.value = '';
        } else if (mode === 'edit') {
            const rawLabel = editNode.label || editNode.topic || '';
            inputName.value = rawLabel.replace(/\r?\n|\r/g, '');
            inputReason.value = initialReason || '';
        } else if (mode === 'connect') {
            const rawLabel = editNode.label || editNode.topic || '';
            inputName.value = rawLabel.replace(/\r?\n|\r/g, '');
            inputReason.value = '';
        }

        // 高さも初期化
        inputName.style.height = 'auto';
        inputReason.style.height = 'auto';

        // 画面中央に配置
        modal.style.display = 'block';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';

        // 表示された後じゃないとscrollHeightが正しく取れないので少し待ってからフィット・フォーカスさせる
        setTimeout(() => {
            autoResizeTextarea(inputName);
            autoResizeTextarea(inputReason);
            if (fTarget === 'name') {
                inputName.focus();
            } else if (fTarget === 'reason') {
                inputReason.focus();
            }
        }, 50);

        // イベントリスナーを張り替える（重複登録防止）
        const newBtnSubmit = btnSubmit.cloneNode(true);
        const newBtnCancel = btnCancel.cloneNode(true);
        btnSubmit.parentNode.replaceChild(newBtnSubmit, btnSubmit);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

        // キーボード（Enter）によるフォーカスリレー
        inputName.onkeydown = (e) => {
            if (e.isComposing) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                inputReason.focus();
            }
        };

        inputReason.onkeydown = (e) => {
            if (e.isComposing) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                newBtnSubmit.click();
            }
        };

        newBtnSubmit.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                newBtnSubmit.click();
            }
        };

        newBtnCancel.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        newBtnSubmit.addEventListener('click', () => {
            const newLabel = inputName.value.trim();
            const reasonText = inputReason.value.trim();

            if (!newLabel) {
                alert('行う活動（手段）を入力してください');
                inputName.focus();
                return;
            }

            modal.style.display = 'none';

            if (mode === 'add') {
                // 新規追加ロジック
                const parentBoundingBox = this.ownNetwork.getBoundingBox(targetNodeId);
                const newNodeX = parentNode.x;
                const newNodeY = parentBoundingBox.bottom + 80;

                const newNodeId = this.generateUniqueNumberText();
                this.addNode(newNodeId, newLabel, "step", newNodeX, newNodeY);
                this.addNewEdge(targetNodeId, newNodeId);

                console.log(`親ノード ${targetNodeId} の下に新しいノード ${newNodeId} を追加しました`);

                if (reasonText) {
                    this.selectId = newNodeId;
                    const reasonNodeId = `reason-${newNodeId}`;

                    this.ReasonConnectNodeId.push(newNodeId);
                    this.ReasonNodeId.push(reasonNodeId);
                    this.ReasonContent.push(reasonText);

                    if (typeof defaultRecordThinkingProcess !== 'undefined') {
                        defaultRecordThinkingProcess.record_reason(newNodeId, reasonNodeId, reasonText, parentNode ? parentNode.id : null);
                    }
                    
                    this.updateEdgesToNodeWithReason(newNodeId, reasonText, parentNode ? parentNode.id : null);
                    
                    if (typeof undoRedoManager !== 'undefined') {
                        let targetEdgeId = null;
                        const connectedEdges = this.ownNetwork.getConnectedEdges(newNodeId);
                        connectedEdges.forEach(edgeId => {
                            const edgeData = this.edges.get(edgeId);
                            if (edgeData && edgeData.to === newNodeId) {
                                targetEdgeId = edgeId;
                            }
                        });
                        
                        undoRedoManager.recordAction({
                            type: 'EDIT_REASON',
                            nodeId: newNodeId,
                            edgeId: targetEdgeId,
                            oldReason: '',
                            newReason: reasonText
                        });
                    }
                }
            } else if (mode === 'connect') {
                // エッジはすでに接続済み。ラベルや理由の更新のみ行う。
                if (newLabel !== (editNode.label || editNode.topic)) {
                    this.editNode(editNode.id, newLabel);
                }
                if (reasonText) {
                    const rIdx = this.ReasonConnectNodeId.indexOf(editNode.id);
                    if (rIdx !== -1) {
                        this.ReasonContent[rIdx] = reasonText;
                        const reasonNodeId = this.ReasonNodeId[rIdx];
                        if (typeof defaultRecordThinkingProcess !== 'undefined') {
                            defaultRecordThinkingProcess.record_reason(editNode.id, reasonNodeId, reasonText, parentNode ? parentNode.id : null);
                        }
                    } else {
                        const reasonNodeId = `reason-${editNode.id}`;
                        this.ReasonConnectNodeId.push(editNode.id);
                        this.ReasonNodeId.push(reasonNodeId);
                        this.ReasonContent.push(reasonText);
                        if (typeof defaultRecordThinkingProcess !== 'undefined') {
                            defaultRecordThinkingProcess.record_reason(editNode.id, reasonNodeId, reasonText, parentNode ? parentNode.id : null);
                        }
                    }
                    this.updateEdgesToNodeWithReason(editNode.id, reasonText, parentNode ? parentNode.id : null);
                }
            } else if (mode === 'edit') {
                // 既存編集ロジック
                // ラベルの更新
                this.editNode(targetNodeId, newLabel);
                
                // 親ノードIDを取得する
                let actualParentNodeId = null;
                if (parentNode) {
                    actualParentNodeId = parentNode.id;
                } else {
                    const connectedEdges = this.ownNetwork.getConnectedEdges(targetNodeId);
                    connectedEdges.forEach(edgeId => {
                        const edgeData = this.edges.get(edgeId);
                        if (edgeData && String(edgeData.to) === String(targetNodeId)) {
                            actualParentNodeId = edgeData.from;
                        }
                    });
                }
                
                // 理由の更新
                if (reasonText) {
                    const rIdx = this.ReasonConnectNodeId.indexOf(targetNodeId);
                    if (rIdx !== -1) {
                        this.ReasonContent[rIdx] = reasonText;
                        const reasonNodeId = this.ReasonNodeId[rIdx];
                        if (typeof defaultRecordThinkingProcess !== 'undefined') {
                            defaultRecordThinkingProcess.record_reason(targetNodeId, reasonNodeId, reasonText, actualParentNodeId);
                        }
                    } else {
                        // 新規で理由を追加
                        const reasonNodeId = `reason-${targetNodeId}`;
                        this.ReasonConnectNodeId.push(targetNodeId);
                        this.ReasonNodeId.push(reasonNodeId);
                        this.ReasonContent.push(reasonText);
                        if (typeof defaultRecordThinkingProcess !== 'undefined') {
                            defaultRecordThinkingProcess.record_reason(targetNodeId, reasonNodeId, reasonText, actualParentNodeId);
                        }
                    }
                    this.updateEdgesToNodeWithReason(targetNodeId, reasonText, actualParentNodeId);
                } else {
                    // 理由が空になった場合の処理（必要に応じて）
                    const rIdx = this.ReasonConnectNodeId.indexOf(targetNodeId);
                    if (rIdx !== -1) {
                        this.ReasonContent[rIdx] = '';
                        const reasonNodeId = this.ReasonNodeId[rIdx];
                        if (typeof defaultRecordThinkingProcess !== 'undefined') {
                            defaultRecordThinkingProcess.record_reason(targetNodeId, reasonNodeId, '', actualParentNodeId);
                        }
                    }
                    this.updateEdgesToNodeWithReason(targetNodeId, '', actualParentNodeId);
                }
            }
        });
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
            // ノード移動モード: ドラッグ開始位置を保存（Undo/Redo用）
            const draggedNodeId = params.nodes[0];
            if (draggedNodeId !== undefined) {
                const node = this.nodes.get(draggedNodeId);
                if (node) {
                    this.dragStartPosition = {
                        nodeId: draggedNodeId,
                        x: node.x,
                        y: node.y
                    };
                }
            }
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
                
                // 上位ノード（from側）の色を取得してエッジに設定
                const fromNode = this.nodes.get(this.dragStartNodeId);
                let nodeColor = '#888888'; // デフォルトのグレー
                if (fromNode && fromNode.color) {
                    if (typeof fromNode.color === 'string') {
                        nodeColor = fromNode.color;
                    } else if (fromNode.color.background) {
                        nodeColor = fromNode.color.background;
                    }
                }
                // ノードの色を暗くしてエッジ色を生成
                const edgeColor = darkenColor(nodeColor, 0.3);
                
                const newEdgeData = {
                    id: edge_id, 
                    from: this.dragStartNodeId, 
                    to: this.dragEndNodeId,
                    color: {
                        color: edgeColor,
                        highlight: edgeColor,
                        hover: edgeColor
                    }
                };
                this.edges.add(newEdgeData);
                defaultRecordThinkingProcess.record_Edge(edge_id, this.dragStartNodeId, this.dragEndNodeId);
                
                // Undo/Redo: エッジ追加を記録
                if (undoRedoManager) {
                    undoRedoManager.recordAction({
                        type: 'ADD_EDGE',
                        edgeId: edge_id,
                        edgeData: { ...newEdgeData }
                    });
                }
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
                    this.nodes.update({ id: this.OntologyNodeId[ontology_index], color: { background: '#7eb6e6', border: '#FF8C00'}, borderWidth: 3, x: ontology_x, y: ontology_y });
                    defaultRecordThinkingProcess.update_Node("point" ,this.OntologyNodeId[ontology_index], ontology_x, ontology_y);
                }
                
                // 内省タグの位置も更新（リロード時の内省タグにも対応）
                const reflectionTagId = `reflection-tag-${movedNodeId}`;
                const reflectionTag = this.nodes.get(reflectionTagId);
                if (reflectionTag) {
                    const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                    const tag_x = nodeBoundingBox.right - 4;
                    const tag_y = nodeBoundingBox.top + 4;
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
                
                // Undo/Redo: ノード移動を記録
                if (undoRedoManager && this.dragStartPosition && this.dragStartPosition.nodeId === movedNodeId) {
                    const newNode = this.nodes.get(movedNodeId);
                    // 移動があった場合のみ記録（同じ位置の場合は記録しない）
                    if (newNode && (this.dragStartPosition.x !== newNode.x || this.dragStartPosition.y !== newNode.y)) {
                        undoRedoManager.recordAction({
                            type: 'MOVE_NODE',
                            nodeId: movedNodeId,
                            oldX: this.dragStartPosition.x,
                            oldY: this.dragStartPosition.y,
                            newX: newNode.x,
                            newY: newNode.y
                        });
                        console.log('📍 ノード移動を記録:', movedNodeId, '移動前:', this.dragStartPosition.x, this.dragStartPosition.y, '移動後:', newNode.x, newNode.y);
                    }
                    this.dragStartPosition = null;
                }
            }
        }
    }
    
    // エッジの削除（完了）
    deleteEdge() {
        const selectEdgeId = this.ownNetwork.getSelection().edges[0];
        if(selectEdgeId === undefined) return;
        
        // Undo/Redo: 削除前のエッジデータを保存（idを明示的に含める）
        const edgeData = this.edges.get(selectEdgeId);
        const edgeDataForUndo = { 
            id: selectEdgeId,
            ...edgeData
        };
        
        const startid = this.edges.get(selectEdgeId).from;
        const endid = this.edges.get(selectEdgeId).to;
        
        this.edges.remove({id: selectEdgeId});
        defaultRecordThinkingProcess.delete_db_Edge(selectEdgeId, startid, endid);
        const Edge_index = this.OntologyConnectNodeId.indexOf(startid);
        if(Edge_index !== -1){
            this.EdgeStartId.splice(Edge_index, 1);
            this.EdgeEndId.splice(Edge_index, 1);
        }
        
        // Undo/Redo: エッジ削除を記録
        if (undoRedoManager && edgeDataForUndo) {
            undoRedoManager.recordAction({
                type: 'DELETE_EDGE',
                edgeData: edgeDataForUndo
            });
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

    // ミニマップ機能の初期化
    initMinimap(containerId) {
        const mainContainer = document.getElementById(containerId);
        if (!mainContainer) {
            console.warn("⚠️ Minimap target container not found:", containerId);
            return;
        }

        // 既にミニマップが存在すれば再生成しない
        if (document.getElementById('minimap-container')) return;

        // 1. ミニマップ用DOM要素を生成してアタッチ
        const minimapContainer = document.createElement('div');
        minimapContainer.id = 'minimap-container';
        
        const minimapNetworkDiv = document.createElement('div');
        minimapNetworkDiv.id = 'myProcessnetwork-minimap';
        
        const indicator = document.createElement('div');
        indicator.id = 'minimap-indicator';
        
        minimapContainer.appendChild(minimapNetworkDiv);
        minimapContainer.appendChild(indicator);
        mainContainer.appendChild(minimapContainer);

        // 2. ミニマップ用 vis.Network を初期化 (同一 DataSet を共有)
        const minimapOptions = {
            physics: false,
            interaction: {
                dragView: false,
                zoomView: false,
                dragNodes: false,
                hover: false,
                selectConnectedEdges: false
            },
            nodes: {
                font: { size: 0 }, // ミニマップ上のノードテキストを非表示にする
                shadow: false
            },
            edges: {
                shadow: false
            }
        };
        
        this.minimapNetwork = new vis.Network(minimapNetworkDiv, {
            nodes: this.nodes,
            edges: this.edges
        }, minimapOptions);

        // 3. メイン画面の描画更新および移動イベントに合わせて視野枠を同期
        const syncMinimap = () => {
            this.updateMinimapView();
        };

        this.ownNetwork.on('afterDrawing', syncMinimap);
        this.ownNetwork.on('zoom', syncMinimap);
        this.ownNetwork.on('dragEnd', syncMinimap);
        this.ownNetwork.on('animationFinished', syncMinimap);

        // 4. 視野枠のドラッグ制御をセットアップ
        this.setupMinimapDrag(indicator);
        
        // 初回表示の同期
        setTimeout(() => this.updateMinimapView(), 300);
    }

    // 視野枠の同期
    updateMinimapView() {
        if (!this.minimapNetwork) return;

        const mainContainer = this.ownNetwork.body.container;
        const mainWidth = mainContainer.clientWidth;
        const mainHeight = mainContainer.clientHeight;
        const indicator = document.getElementById('minimap-indicator');
        if (!indicator) return;

        // 1. メイン画面の現在の表示視野（論理座標）を取得
        const topLeft = this.ownNetwork.DOMtoCanvas({ x: 0, y: 0 });
        const bottomRight = this.ownNetwork.DOMtoCanvas({ x: mainWidth, y: mainHeight });

        // 2. ミニマップ側のカメラをノード全体に自動フィット
        this.minimapNetwork.fit({ animation: false });

        // 3. 視野の論理座標をミニマップ上の DOM 座標に変換
        const minimapTopLeft = this.minimapNetwork.canvasToDOM(topLeft);
        const minimapBottomRight = this.minimapNetwork.canvasToDOM(bottomRight);

        // 4. ミニマップの寸法に基づいてインジケーターサイズを調整・制限
        const minimapContainer = document.getElementById('minimap-container');
        const mapWidth = minimapContainer.clientWidth;
        const mapHeight = minimapContainer.clientHeight;

        const left = Math.max(0, Math.min(mapWidth, minimapTopLeft.x));
        const top = Math.max(0, Math.min(mapHeight, minimapTopLeft.y));
        const width = Math.min(mapWidth - left, Math.max(5, minimapBottomRight.x - minimapTopLeft.x));
        const height = Math.min(mapHeight - top, Math.max(5, minimapBottomRight.y - minimapTopLeft.y));

        indicator.style.left = `${left}px`;
        indicator.style.top = `${top}px`;
        indicator.style.width = `${width}px`;
        indicator.style.height = `${height}px`;
        indicator.style.display = 'block';
    }

    // 視野枠のドラッグイベント制御
    setupMinimapDrag(indicator) {
        let isDragging = false;

        indicator.addEventListener('pointerdown', (e) => {
            isDragging = true;
            indicator.setPointerCapture(e.pointerId);
            e.stopPropagation();
            e.preventDefault();
        });

        indicator.addEventListener('pointermove', (e) => {
            if (!isDragging) return;

            const rect = document.getElementById('minimap-container').getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // ミニマップ上のマウス位置の論理座標を取得
            const canvasPos = this.minimapNetwork.DOMtoCanvas({ x: mouseX, y: mouseY });

            // メイン画面の表示中心を、その論理座標に移動
            this.ownNetwork.moveTo({
                position: canvasPos,
                animation: false
            });
            
            e.stopPropagation();
            e.preventDefault();
        });

        const stopDrag = (e) => {
            if (isDragging) {
                isDragging = false;
                try {
                    indicator.releasePointerCapture(e.pointerId);
                } catch(err) {}
            }
        };

        indicator.addEventListener('pointerup', stopDrag);
        indicator.addEventListener('pointercancel', stopDrag);
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
    record_reason (node_id, reason_node_id, reason_text, source_node_id = null){
        // DBのIDと一致させるため、プレフィックスを取り除く
        if (source_node_id && typeof source_node_id === 'string') {
            if (source_node_id.startsWith('topic-tag_')) source_node_id = source_node_id.replace('topic-tag_', '');
            if (source_node_id.startsWith('versions_')) source_node_id = source_node_id.replace('versions_', '');
        }

        $.ajax({
            url: "php/object_maneger.php",
            type: "POST",
            data: {node_id : node_id,
                reason_node_id : reason_node_id,
                reason_text : reason_text,
                source_node_id : source_node_id,
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

/**
 * jsMindツリーから指定ノードの全子孫node_idを再帰的に収集する
 * @param {string} nodeId - 起点ノードのID
 * @returns {string[]} - 起点ノード自身を含む全子孫のnode_id配列
 */
const collectDescendantNodeIds = (nodeId) => {
    const ids = [nodeId];
    try {
        if (typeof _jm !== 'undefined' && _jm.mind) {
            const node = _jm.mind.get_node(nodeId);
            if (node && node.children && node.children.length > 0) {
                const traverse = (n) => {
                    for (const child of n.children) {
                        ids.push(child.id);
                        if (child.children && child.children.length > 0) {
                            traverse(child);
                        }
                    }
                };
                traverse(node);
            }
        }
    } catch (e) {
        console.warn('collectDescendantNodeIds: ツリー探索でエラー:', e);
    }
    console.log('📌 収集された子孫ノードID:', ids);
    return ids;
};
const getProcessMapDataFromDB = (callback, targetNodeId) => {
    //選択されているノードIDとconcept_id
    let selected_node_id;
    let selected_concept_id;
    if (targetNodeId) {
        selected_node_id = targetNodeId;
        selected_concept_id = Get_NodeInfo(selected_node_id, "concept_id");
    } else if(process_mode == "all"){
        selected_node_id = _jm.get_selected_node() ? _jm.get_selected_node().id : null;
        selected_concept_id = selected_node_id ? Get_NodeInfo(selected_node_id, "concept_id") : null;
    }else{
        const conceptDiplay = document.getElementById("conceptdisplay");
        selected_node_id = conceptDiplay ? conceptDiplay.getAttribute('nodeid') : null;
        selected_concept_id = conceptDiplay ? conceptDiplay.getAttribute('conceptid') : null;
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
                        concept_ids: conceptIds,
                        descendant_node_ids: selected_node_id ? collectDescendantNodeIds(selected_node_id) : []
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
                    
                    // 既存のノードとエッジをクリア（topic-tagノードとversionsノードは保持）
                    let existingTopicTagNodes = [];
                    let existingVersionsNodes = [];
                    if (typeof defaultThinkingProcess !== 'undefined') {
                        // topic-tagノードとversionsノードを保持するため、それ以外のノードのみ削除
                        const allNodes = defaultThinkingProcess.nodes.get();
                        existingTopicTagNodes = allNodes.filter(n => n.group === 'topic-tag');
                        existingVersionsNodes = allNodes.filter(n => n.group === 'versions');
                        const nodesToRemove = allNodes.filter(n => n.group !== 'topic-tag' && n.group !== 'versions').map(n => n.id);
                        
                        // topic-tagとversions以外のノードを削除
                        if (nodesToRemove.length > 0) {
                            defaultThinkingProcess.nodes.remove(nodesToRemove);
                        }
                        
                        // versionsノードに関連するエッジを保持
                        const versionsNodeIds = existingVersionsNodes.map(n => n.id);
                        const allEdges = defaultThinkingProcess.edges.get();
                        const edgesToRemove = allEdges.filter(e => 
                            !versionsNodeIds.includes(e.from) && !versionsNodeIds.includes(e.to)
                        ).map(e => e.id);
                        if (edgesToRemove.length > 0) {
                            defaultThinkingProcess.edges.remove(edgesToRemove);
                        }
                        
                        console.log(`📌 topic-tagノードを保持: ${existingTopicTagNodes.length}個`);
                        if (existingTopicTagNodes.length > 0) {
                            console.log(`📌 保持されるtopic-tagノードID: ${existingTopicTagNodes.map(n => n.id).join(', ')}`);
                        }
                        console.log(`📌 versionsノードを保持: ${existingVersionsNodes.length}個`);
                        if (existingVersionsNodes.length > 0) {
                            console.log(`📌 保持されるversionsノードID: ${existingVersionsNodes.map(n => n.id).join(', ')}`);
                        }
                        
                        // 過去データ復元中は物理シミュレーションを無効化
                        if (defaultThinkingProcess.ownNetwork && typeof defaultThinkingProcess.ownNetwork.setOptions === 'function') {
                            defaultThinkingProcess.ownNetwork.setOptions({ physics: { enabled: false } });
                            console.log('📌 物理シミュレーションを無効化');
                        }
                    }
                    
                    // 履歴データからノードを復元（topic-tagは既存がある場合のみスキップ）
                    historyArray.forEach((node, i) => {
                        // topic-tagノードの処理
                        if (node.object_node_type === 'topic-tag') {
                            // 既存のtopic-tagがある場合はスキップ
                            if (existingTopicTagNodes.length > 0) {
                                console.log(`[${i + 1}] topic-tagノードをスキップ（既存を維持）: ${node.object_node_id}`);
                                return;
                            }
                            // 既存のtopic-tagが無い場合は履歴から復元
                            console.log(`[${i + 1}] topic-tagノードを履歴から復元: ${node.object_node_id}`);
                        }
                        
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
                                node.attribution_bad,
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
                            
                            // 現在のtopic-tagノードを取得（DBのobject_node_idと画面上のIDのマッピング用）
                            const topicTagNodes = defaultThinkingProcess.nodes.get().filter(n => n.group === 'topic-tag');
                            console.log(`📌 現在のtopic-tagノード: ${topicTagNodes.map(n => n.id).join(', ')}`);
                            
                            // DBから取得したtopic-tagのobject_node_idリスト
                            const topicTagDbIds = historyArray
                                .filter(n => n.object_node_type === 'topic-tag')
                                .map(n => n.object_node_id);
                            console.log(`📌 DBのtopic-tag object_node_id: ${topicTagDbIds.join(', ')}`);
                            
                            edgeArray.forEach((edge, i) => {
                                console.log(`[エッジ${i + 1}/${edgeArray.length}] 復元処理開始`);
                                console.log(`  📋 edge_id: ${edge.object_edge_id || edge.id}`);
                                console.log(`  📋 edge_start: ${edge.edge_start || edge.from}`);
                                console.log(`  📋 edge_end: ${edge.edge_end || edge.to}`);
                                console.log(`  📋 label: ${edge.label || ''}`);
                                
                                // フィールド名の標準化（PHPから来るデータ構造に対応）
                                const edgeId = edge.object_edge_id || edge.id;
                                let edgeStart = edge.edge_start || edge.from;
                                let edgeEnd = edge.edge_end || edge.to;
                                const edgeLabel = edge.label || '';
                                
                                // topic-tagノードのIDマッピング
                                // DBのtopic-tag IDが画面のtopic-tag IDと異なる場合、画面のIDを使用
                                if (topicTagDbIds.includes(edgeStart) && topicTagNodes.length > 0) {
                                    const originalStart = edgeStart;
                                    edgeStart = topicTagNodes[0].id;
                                    console.log(`📌 topic-tag IDをマッピング: ${originalStart} → ${edgeStart}`);
                                }
                                if (topicTagDbIds.includes(edgeEnd) && topicTagNodes.length > 0) {
                                    const originalEnd = edgeEnd;
                                    edgeEnd = topicTagNodes[0].id;
                                    console.log(`📌 topic-tag IDをマッピング: ${originalEnd} → ${edgeEnd}`);
                                }
                                
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
                                $('#process_removeEdge, #process_removeNode, #process_undo, #process_redo').addClass('disabled').prop('disabled', true);
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
const displayTriggerData = (mode, display_target_area_id, targetNodeId, targetProcessInstance) => {
    const processInstance = targetProcessInstance || defaultThinkingProcess;
    // 現在データ表示時は過去データフラグを解除
    if (typeof processInstance !== 'undefined' && processInstance) {
        processInstance.isViewingPastData = false;
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
        if (targetNodeId) {
            selected_node_id = targetNodeId;
            selected_concept_id = Get_NodeInfo(selected_node_id, "concept_id");
            if (conceptdisplay_area.length) {
                const conceptDisplayEl = document.getElementById('conceptdisplay');
                if (conceptDisplayEl) {
                    conceptDisplayEl.setAttribute('nodeId', selected_node_id);
                    conceptDisplayEl.setAttribute('conceptId', selected_concept_id);
                }
            }
        } else if(mode=="all"){
            selected_node_id = _jm.get_selected_node() ? _jm.get_selected_node().id : null;
            if (selected_node_id) {
                var jmnode = document.getElementsByTagName("jmnode");
                for(var i=0; i<jmnode.length; i++){
                    if(selected_node_id == jmnode[i].getAttribute("nodeid")){
                        selected_concept_id = jmnode[i].getAttribute("concept_id");
                    }
                }
                const conceptDisplayEl = document.getElementById('conceptdisplay');
                if (conceptDisplayEl) {
                    conceptDisplayEl.setAttribute('nodeId', selected_node_id);
                    conceptDisplayEl.setAttribute('conceptId', selected_concept_id);
                }
            }
        }else{
            const conceptDisplay = document.getElementById('conceptdisplay');
            selected_node_id = conceptDisplay ? conceptDisplay.getAttribute('nodeid') : null;
            selected_concept_id = conceptDisplay ? conceptDisplay.getAttribute('conceptid') : null;
        }

        // --- 追加: プロセスと同期したハイライト処理 ---
        if (typeof _jm !== 'undefined' && _jm && _jm.mind && _jm.mind.nodes) {
            // まず全てのリセット
            var jmnodes = document.getElementsByTagName("jmnode");
            for(var i=0; i<jmnodes.length; i++){
                jmnodes[i].classList.remove("is-process-active");
            }
            for (var nid in _jm.mind.nodes) {
                _jm.mind.nodes[nid].is_process_active_edge = false;
            }

            if (selected_node_id) {
                let targetNode = _jm.get_node(selected_node_id);
                if (targetNode) {
                    let el = document.querySelector(`jmnode[nodeid="${selected_node_id}"]`);
                    if(el) el.classList.add("is-process-active");
                    
                    if (targetNode.children) {
                        for (let i = 0; i < targetNode.children.length; i++) {
                            let child = targetNode.children[i];
                            let childEl = document.querySelector(`jmnode[nodeid="${child.id}"]`);
                            if(childEl) childEl.classList.add("is-process-active");
                            child.is_process_active_edge = true;
                        }
                    }
                }
                if (_jm.view && _jm.view.show_lines) {
                    _jm.view.show_lines(); // Canvas再描画
                }
            }
        }
        // ------------------------------------------

        getProcessMapDataFromDB ((trigger_list_info) => {
            //concept_labelを表示
            const concept_label = trigger_list_info['selected_concept'];
            conceptdisplay_area.html(concept_label);
            let j = 0;

            // X座標のオフセット計算
            let offsetX = 0;
            if (targetNodeId && processInstance) {
                const allNodes = processInstance.nodes.get();
                if (allNodes.length > 0) {
                    let maxRight = -Infinity;
                    allNodes.forEach(node => {
                        const bb = processInstance.ownNetwork.getBoundingBox(node.id);
                        if (bb && bb.right !== undefined) {
                            if (bb.right > maxRight) maxRight = bb.right;
                        } else if (node.x !== undefined) {
                            if (node.x > maxRight) maxRight = node.x + 150;
                        }
                    });
                    if (maxRight === -Infinity) maxRight = 0;

                    let newMinX = Infinity;
                    if (Array.isArray(trigger_list_info.node_versions) && trigger_list_info.node_versions.length > 0) {
                        if (node_x < newMinX) newMinX = node_x;
                    }
                    if (Array.isArray(trigger_list_info.trigger)) {
                        trigger_list_info.trigger.forEach(u => {
                            if (u && u.x !== undefined && u.x !== null) {
                                let tx = parseFloat(u.x);
                                if (!isNaN(tx) && tx < newMinX) newMinX = tx;
                            }
                        });
                    }
                    if (Array.isArray(trigger_list_info.onode)) {
                        trigger_list_info.onode.forEach(n => {
                            if (n && n.node_x !== undefined && n.node_x !== null) {
                                let rx = parseFloat(n.node_x);
                                if (!isNaN(rx) && rx < newMinX) newMinX = rx;
                            }
                        });
                    }
                    if (newMinX === Infinity) newMinX = 0;

                    offsetX = maxRight + 60 - newMinX; // 60ピクセル右にずらす
                }
            }

            // versionノードは最新のもの1つだけ表示する
            if (Array.isArray(trigger_list_info.node_versions) && trigger_list_info.node_versions.length > 0) {
                const v = trigger_list_info.node_versions[trigger_list_info.node_versions.length - 1];
                // 表示するテキストは、選択されたノードの content を優先して使う
                let selectedContent = '';
                try {
                    // まずマインドマップの現在選択ノード（jmnode）のテキストを取得して優先使用
                    if (selected_node_id) {
                        const jmnodeEl = document.querySelector(`jmnode[nodeid="${selected_node_id}"]`);
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
                } catch (e) {
                    console.warn('selected jmnode lookup failed', e);
                }
                // 次に、server から渡された onode.content を参照（あれば使用）
                if (!selectedContent && Array.isArray(trigger_list_info.onode) && trigger_list_info.onode.length > 0) {
                    selectedContent = trigger_list_info.onode[0].content || '';
                }
                const textForVersion = selectedContent || v.content || '';
                const finalNodeX = node_x + offsetX;
                const finalNodeY = node_y;
                processInstance.addVersionNode(v.node_version_id, textForVersion, "versions", v.appeared_at, finalNodeX, finalNodeY);
                if (from_id != "") {
                    processInstance.addVersionEdge(from_id, v.node_version_id);
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
                    let edge_ids = processInstance.ownNetwork.getConnectedEdges(from_node);
                    let num = 0;
                    for(i = 0; i<edge_ids.length; i++){
                        if(processInstance.edges.get(edge_ids[i]).group == "versionEdges" || processInstance.edges.get(edge_ids[i]).group == "trigger_from"){
                            //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                            if(processInstance.ownNetwork.getConnectedNodes(edge_ids[i])[1] != from_node){
                                num = i;
                            }
                        }
                    }
                    let edge_id = edge_ids[num];
                    const triggerX = u.x ? parseFloat(u.x) + offsetX : null;
                    const triggerY = u.y ? parseFloat(u.y) : null;
                    processInstance.addTriggerNode("Reload", u.trigger_id, edge_id, from_node, to_node, u.activity_id, u.content, u.activity_type, u.activity_time, triggerX, triggerY);
                }
            });
            console.log("onodeの中身:", trigger_list_info.onode);
            console.log("pedgeの中身:", trigger_list_info.pedge);
            console.log("datesの中身:", trigger_list_info.dates);

            // --- バージョン更新に伴うエッジ切断の防止 ---
            let rootVersionId = null;
            let rootAliases = new Set();
            if (Array.isArray(trigger_list_info.node_versions) && trigger_list_info.node_versions.length > 0) {
                const v = trigger_list_info.node_versions[trigger_list_info.node_versions.length - 1];
                rootVersionId = String(v.node_version_id);
                
                if (selected_node_id) rootAliases.add(String(selected_node_id));
                trigger_list_info.node_versions.forEach(version => {
                    rootAliases.add(String(version.node_version_id));
                });
                
                if (trigger_list_info.pedge) {
                    trigger_list_info.pedge.forEach(edge => {
                        if (rootAliases.has(String(edge.edge_start))) edge.edge_start = rootVersionId;
                        if (rootAliases.has(String(edge.edge_end))) edge.edge_end = rootVersionId;
                    });
                }
            }
            
            // --- 孤立ノードのフィルタリング（ルートからの到達可能性による完全なポジティブ抽出） ---
            const pedges = trigger_list_info.pedge || [];
            
            // 1. ルートノードの特定（探索の起点）
            const rootNodeIds = [];
            let hasExplicitRoot = false;
            if (Array.isArray(trigger_list_info.onode)) {
                trigger_list_info.onode.forEach(n => {
                    if (n.object_nodes_type === 'topic-tag' || n.object_nodes_type === 'root' || n.isroot) {
                        rootNodeIds.push(String(n.object_node_id)); // 確実に文字列として扱う
                        hasExplicitRoot = true;
                    }
                });
            }
            
            // --- 最新の問いノード（バージョンID）を確実に探索の起点に追加 ---
            if (typeof rootVersionId !== 'undefined' && rootVersionId) {
                if (!rootNodeIds.includes(String(rootVersionId))) {
                    rootNodeIds.push(String(rootVersionId));
                    hasExplicitRoot = true;
                }
            }

            // ★ネットワーク上に既に保持されている topic-tag や versions ノードの「本来のID」もルートとして拾い上げる
            if (typeof processInstance !== 'undefined' && processInstance.nodes) {
                const existingNodes = processInstance.nodes.get();
                existingNodes.forEach(n => {
                    if (n.group === 'topic-tag' || n.group === 'versions') {
                        let rawId = String(n.id);
                        if (rawId.startsWith('topic-tag_')) rawId = rawId.replace('topic-tag_', '');
                        if (rawId.startsWith('versions_')) rawId = rawId.replace('versions_', '');
                        if (!rootNodeIds.includes(rawId)) {
                            rootNodeIds.push(rawId);
                            hasExplicitRoot = true;
                        }
                    }
                });
            }
            
            // 2. エッジから単方向の隣接リスト（グラフ）を構築
            const adjList = {};
            const nodesWithEdges = new Set();
            pedges.forEach(edge => {
                const start = String(edge.edge_start);
                const end = String(edge.edge_end);
                if (start && end && start !== 'undefined' && end !== 'undefined') {
                    if (!adjList[start]) adjList[start] = [];
                    if (!adjList[end]) adjList[end] = [];
                    adjList[start].push(end); // 逆引きを削除し、大元からの純粋な派生ツリーのみを辿る
                    nodesWithEdges.add(start);
                    nodesWithEdges.add(end);
                }
            });
            
            // 明示的なルートが見つからないマップ（SRL整理マップ等）の場合の安全なフォールバック
            if (!hasExplicitRoot) {
                // エッジを持っているノードはとりあえず全て起点とみなし、完全に線がないノードだけを除外する
                nodesWithEdges.forEach(id => rootNodeIds.push(id));
            }
            
            // 3. BFS（幅優先探索）でルートから辿れるノードIDをすべて網羅
            const reachableNodeIds = new Set(rootNodeIds);
            const queue = [...rootNodeIds];
            
            while (queue.length > 0) {
                const currentId = queue.shift();
                const neighbors = adjList[currentId] || [];
                for (const neighborId of neighbors) {
                    if (!reachableNodeIds.has(neighborId)) {
                        reachableNodeIds.add(neighborId);
                        queue.push(neighborId);
                    }
                }
            }

            if (Array.isArray(trigger_list_info.onode)) {
                // 4. ルートから辿れる（繋がっている）ノードだけを実直に残す
                trigger_list_info.onode = trigger_list_info.onode.filter(n => reachableNodeIds.has(String(n.object_node_id)));
            }

            trigger_list_info.onode.map((n) => {
                const reloadX = parseFloat(n.node_x) + offsetX;
                const reloadY = parseFloat(n.node_y);
                processInstance.addReloadNode(n.object_node_id, n.content, n.object_nodes_type, reloadX, reloadY, n.status, n.purpose, n.evaluation_good, n.attribution, n.attribution_bad, n.application, n.estimated_time, n.evaluation_bad);
            });
            trigger_list_info.pedge.map((n) => {
                console.log("🔍 エッジデータ確認:", n);
                // object_edge_idが正しいフィールド名
                const edgeId = n.object_edge_id || n.process_edge_id;
                if (edgeId) {
                    processInstance.addReloadEdge(edgeId, n.edge_start, n.edge_end, n.label);
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
                                $('#process_removeEdge, #process_removeNode').removeClass('disabled').prop('disabled', false);
                                // Undo/Redoボタンの状態を更新
                                if (undoRedoManager) {
                                    undoRedoManager.updateButtons();
                                }
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
                                $('#process_removeEdge, #process_removeNode').removeClass('disabled').prop('disabled', false);
                                // Undo/Redoボタンの状態を更新
                                if (undoRedoManager) {
                                    undoRedoManager.updateButtons();
                                }
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
            
        }, targetNodeId);
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
            if (defaultThinkingProcess) {
                try { defaultThinkingProcess.removeEventLister(); } catch (e) { console.warn('removeEventLister failed', e); }
                try { sessionStorage.removeItem('currentSelectId'); } catch (e) { /* ignore */ }
            }
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

function showThinkingProcessMap(clickedNodeId, isShiftKey) {
    // 整理マップが作成（または開かれた）瞬間に、jsMind側のノードへ即座にコンパスアイコンを付与する
    if (clickedNodeId) {
        try {
            const nodeElement = document.querySelector(`jmnode[nodeid="${clickedNodeId}"]`);
            if (nodeElement) {
                const existingIcon = nodeElement.querySelector('.compass-icon');
                if (!existingIcon && typeof createNodeIcon === 'function') {
                    createNodeIcon(nodeElement);
                }
            }
        } catch (e) {
            console.warn('コンパスアイコンの即時付与に失敗しました:', e);
        }
    }

    document.getElementById('feedback_area').style.display = "block";
    document.getElementById('xml_upload_area').style.display = "block";
    $('#process_network_container').css('display', 'flex');
    $('#process_network_container').css('width', 'calc(100% - 300px)');
    $('#jsmind_container').css('width', 'calc(100% - 300px)');
    $('#jsmind_container').css('min-width', '300px');
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

    if (isShiftKey && defaultThinkingProcess) {
        // Shiftキー押下時は、既存のインスタンスを維持し、データを追加ロード (第3引数にclickedNodeId, 第4引数にdefaultThinkingProcessを指定)
        displayTriggerData("all", "trigger_area_list", clickedNodeId, defaultThinkingProcess);
    } else {
        if (defaultThinkingProcess) {
            try { defaultThinkingProcess.removeEventLister(); } catch (e) { console.warn('removeEventLister failed', e); }
            try { sessionStorage.removeItem('currentSelectId'); } catch (e) { /* ignore */ }
        }
        defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
        displayTriggerData("all", "trigger_area_list", clickedNodeId, defaultThinkingProcess);
    }
    
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
    $('#jsmind_container').css('width','calc(100% - 300px)');
    $('#jsmind_container').css('min-width', '300px');
    $('#jsmind_container').css('height','');
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

    $(`#process_removeEdge`).on("click", e => {
        if (defaultThinkingProcess && defaultThinkingProcess.isViewingPastData) {
            console.log('過去データ表示中のため、エッジ削除は無効化されています');
            try { alert('過去の表示中はエッジ削除できません'); } catch (err) { /* ignore */ }
            return;
        }
        defaultThinkingProcess.deleteEdge();
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
    
    // Undo/Redoボタンのイベントハンドラ
    $(`#process_undo`).on("click", e => {
        if (defaultThinkingProcess && defaultThinkingProcess.isViewingPastData) {
            console.log('過去データ表示中のため、Undoは無効化されています');
            return;
        }
        if (undoRedoManager) {
            undoRedoManager.undo();
        }
    });
    $(`#process_redo`).on("click", e => {
        if (defaultThinkingProcess && defaultThinkingProcess.isViewingPastData) {
            console.log('過去データ表示中のため、Redoは無効化されています');
            return;
        }
        if (undoRedoManager) {
            undoRedoManager.redo();
        }
    });
    
    // キーボードショートカット（Ctrl+Z: Undo, Ctrl+Y: Redo）
    document.addEventListener('keydown', (e) => {
        // テキスト入力中は無効
        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.contentEditable === 'true'
        )) {
            return;
        }
        
        // 過去データ表示中は無効
        if (defaultThinkingProcess && defaultThinkingProcess.isViewingPastData) {
            return;
        }
        
        // Ctrl+Z: Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (undoRedoManager) {
                undoRedoManager.undo();
            }
        }
        // Ctrl+Y または Ctrl+Shift+Z: Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            if (undoRedoManager) {
                undoRedoManager.redo();
            }
        }
    });

    const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', function () {
        const accordionItem = this.parentElement;
        accordionItem.classList.toggle('active');
      });
    });
});

// ドラッグ中のエッジプレビュー線（ゴムバンド矢印）を描画するヘルパー関数
function drawEdgeDragPreview(startX, startY, endX, endY) {
    let svg = document.getElementById('edgeDragPreview');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'edgeDragPreview';
        svg.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9999;';
        
        // 矢印マーカー定義
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'drag-arrow');
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '6');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto-start-reverse');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        path.setAttribute('fill', '#4CAF50'); // ボタンと同じ緑色
        
        marker.appendChild(path);
        defs.appendChild(marker);
        svg.appendChild(defs);
        document.body.appendChild(svg);
    }
    
    let line = svg.querySelector('line');
    if (!line) {
        line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', '#4CAF50');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('marker-end', 'url(#drag-arrow)');
        line.setAttribute('stroke-dasharray', '5,5'); // 点線
        svg.appendChild(line);
    }
    
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
}

function removeEdgeDragPreview() {
    const svg = document.getElementById('edgeDragPreview');
    if (svg) svg.remove();
}

// モーダルドラッグ＆ドロップ移動機能
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal-add-action');
    if (!modal) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    function isDraggableElement(target) {
        const tagName = target.tagName.toLowerCase();
        return tagName !== 'textarea' && tagName !== 'input' && tagName !== 'button' && tagName !== 'a' && !target.closest('.modal-close-v4-btn');
    }

    modal.addEventListener('mousedown', function(e) {
        if (!isDraggableElement(e.target)) return;
        
        isDragging = true;
        modal.classList.add('is-dragging');
        
        const rect = modal.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        
        startX = e.clientX;
        startY = e.clientY;
        
        modal.style.transform = 'none';
        modal.style.left = initialLeft + 'px';
        modal.style.top = initialTop + 'px';
        modal.style.margin = '0';
        
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        modal.style.left = (initialLeft + dx) + 'px';
        modal.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            modal.classList.remove('is-dragging');
        }
    });
});
