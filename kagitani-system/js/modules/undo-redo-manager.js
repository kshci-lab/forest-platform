/**
 * Undo / Redo 操作履歴管理クラス
 */
export class UndoRedoManager {
    /**
     * @param {Object} appInstance - ThinkingProcess のインスタンス (または操作対象のファサード)
     * @param {Object} dbApiInstance - RecordThinkingProcess のインスタンス (API送信オブジェクト)
     */
    constructor(appInstance, dbApiInstance) {
        this.app = appInstance;
        this.db = dbApiInstance;
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50;
        this.isUndoing = false;
        this.isRedoing = false;
    }

    // 操作を記録
    recordAction(action) {
        if (this.isUndoing || this.isRedoing) return;
        
        this.undoStack.push(action);
        this.redoStack = []; // 新しい操作が入ったらRedo履歴は消去
        
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
            this.undoStack.push(action); // エラー時はスタックへ戻す
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
            this.redoStack.push(action);
        } finally {
            this.isRedoing = false;
            this.updateButtons();
        }
    }

    // Undo操作の具現化
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

    // Redo操作の具現化
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

    // --- 各個別操作の実装 ---
    
    undoAddNode(action) {
        const nodeId = action.nodeId;
        const connectedEdges = this.app.ownNetwork.getConnectedEdges(nodeId);
        connectedEdges.forEach(edgeId => {
            const edge = this.app.edges.get(edgeId);
            if (edge) {
                this.app.edges.remove(edgeId);
                this.db.delete_db_Edge(edgeId, edge.from, edge.to);
            }
        });
        this.app.nodes.remove(nodeId);
        this.db.delete_db_Node(nodeId);
    }

    redoAddNode(action) {
        const nodeData = action.nodeData;
        this.app.nodes.add(nodeData);
        this.db.record_Node(
            nodeData.id, 
            action.originalLabel || nodeData.label, 
            nodeData.group, 
            nodeData.x, 
            nodeData.y, 
            nodeData.status
        );
    }

    undoDeleteNode(action) {
        this.app.nodes.add(action.nodeData);
        this.db.record_Node(
            action.nodeData.id,
            action.originalLabel || action.nodeData.label,
            action.nodeData.group,
            action.nodeData.x,
            action.nodeData.y,
            action.nodeData.status
        );
        if (action.connectedEdges && action.connectedEdges.length > 0) {
            action.connectedEdges.forEach(edgeData => {
                this.app.edges.add(edgeData);
                this.db.record_Edge(edgeData.id, edgeData.from, edgeData.to);
            });
        }
    }

    redoDeleteNode(action) {
        const nodeId = action.nodeData.id;
        const connectedEdges = this.app.ownNetwork.getConnectedEdges(nodeId);
        connectedEdges.forEach(edgeId => {
            const edge = this.app.edges.get(edgeId);
            if (edge) {
                this.app.edges.remove(edgeId);
                this.db.delete_db_Edge(edgeId, edge.from, edge.to);
            }
        });
        this.app.nodes.remove(nodeId);
        this.db.delete_db_Node(nodeId);
    }

    undoAddEdge(action) {
        const edgeId = action.edgeId;
        const edge = this.app.edges.get(edgeId);
        if (edge) {
            this.app.edges.remove(edgeId);
            this.db.delete_db_Edge(edgeId, edge.from, edge.to);
        }
    }

    redoAddEdge(action) {
        this.app.edges.add(action.edgeData);
        this.db.record_Edge(action.edgeData.id, action.edgeData.from, action.edgeData.to);
    }

    undoDeleteEdge(action) {
        if (!action.edgeData || !action.edgeData.id) return;
        this.app.edges.add(action.edgeData);
        this.db.record_Edge(action.edgeData.id, action.edgeData.from, action.edgeData.to);
    }

    redoDeleteEdge(action) {
        if (!action.edgeData || !action.edgeData.id) return;
        const edgeId = action.edgeData.id;
        this.app.edges.remove(edgeId);
        this.db.delete_db_Edge(edgeId, action.edgeData.from, action.edgeData.to);
    }

    undoEditNodeLabel(action) {
        const node = this.app.nodes.get(action.nodeId);
        if (node) {
            let result_label = '';
            for (let i = 0; i < action.oldLabel.length; i += 10) {
                result_label += action.oldLabel.substr(i, 10) + '\n';
            }
            node.label = result_label.trim();
            this.app.nodes.update(node);
            this.db.update_Node("label", action.nodeId, action.oldLabel, "");
        }
    }

    redoEditNodeLabel(action) {
        const node = this.app.nodes.get(action.nodeId);
        if (node) {
            let result_label = '';
            for (let i = 0; i < action.newLabel.length; i += 10) {
                result_label += action.newLabel.substr(i, 10) + '\n';
            }
            node.label = result_label.trim();
            this.app.nodes.update(node);
            this.db.update_Node("label", action.nodeId, action.newLabel, "");
        }
    }

    undoEditReason(action) {
        const nodeId = action.nodeId;
        const oldReason = action.oldReason;
        
        if (action.edgeId) {
            const edge = this.app.edges.get(action.edgeId);
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
                this.app.edges.update(edge);
            }
        }
        
        const node = this.app.nodes.get(nodeId);
        if (node) {
            node.purpose = oldReason;
            this.app.nodes.update(node);
        }
        
        const rIdx = this.app.ReasonConnectNodeId.indexOf(nodeId);
        if (rIdx !== -1) {
            this.app.ReasonContent[rIdx] = oldReason;
        }
        
        this.db.update_Node("purpose", nodeId, oldReason, "");
    }

    redoEditReason(action) {
        const nodeId = action.nodeId;
        const newReason = action.newReason;
        
        if (action.edgeId) {
            const edge = this.app.edges.get(action.edgeId);
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
                this.app.edges.update(edge);
            }
        }
        
        const node = this.app.nodes.get(nodeId);
        if (node) {
            node.purpose = newReason;
            this.app.nodes.update(node);
        }
        
        const rIdx = this.app.ReasonConnectNodeId.indexOf(nodeId);
        if (rIdx !== -1) {
            this.app.ReasonContent[rIdx] = newReason;
        }
        
        this.db.update_Node("purpose", nodeId, newReason, "");
    }

    undoMoveNode(action) {
        const node = this.app.nodes.get(action.nodeId);
        if (node) {
            node.x = action.oldX;
            node.y = action.oldY;
            this.app.nodes.update(node);
            this.db.update_Node("point", action.nodeId, action.oldX, action.oldY);
        }
    }

    redoMoveNode(action) {
        const node = this.app.nodes.get(action.nodeId);
        if (node) {
            node.x = action.newX;
            node.y = action.newY;
            this.app.nodes.update(node);
            this.db.update_Node("point", action.nodeId, action.newX, action.newY);
        }
    }

    undoChangeStatus(action) {
        const node = this.app.nodes.get(action.nodeId);
        if (node) {
            node.status = action.oldStatus;
            this.applyStatusColor(node, action.oldStatus);
            this.app.nodes.update(node);
            this.db.update_Node("status", action.nodeId, action.oldStatus, "");
        }
    }

    redoChangeStatus(action) {
        const node = this.app.nodes.get(action.nodeId);
        if (node) {
            node.status = action.newStatus;
            this.applyStatusColor(node, action.newStatus);
            this.app.nodes.update(node);
            this.db.update_Node("status", action.nodeId, action.newStatus, "");
        }
    }

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

    // UIボタンの活性/非活性状態を同期
    updateButtons() {
        const undoBtn = document.getElementById('process_undo');
        const redoBtn = document.getElementById('process_redo');
        
        if (undoBtn) {
            undoBtn.disabled = (this.undoStack.length === 0);
            undoBtn.classList.toggle('disabled', this.undoStack.length === 0);
        }
        
        if (redoBtn) {
            redoBtn.disabled = (this.redoStack.length === 0);
            redoBtn.classList.toggle('disabled', this.redoStack.length === 0);
        }
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateButtons();
    }
}
