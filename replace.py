filepath = '/Applications/MAMP/htdocs/forest-platform/kagitani-system/js/object-network.js'
with open(filepath, 'r') as f:
    content = f.read()

target4 = """                    this.updateEdgesToNodeWithReason(targetNodeId, '', actualParentNodeId);
                }
            }
        });
    }"""

insert_submit = """                    this.updateEdgesToNodeWithReason(targetNodeId, '', actualParentNodeId);
                }
            } else if (mode === 'insert') {
                const edge = this.edges.get(config.targetEdgeId);
                if (!edge) return;
                
                const edgeId = edge.id;
                
                const fromPos = this.ownNetwork.getPositions([edge.from])[edge.from];
                const toPos = this.ownNetwork.getPositions([edge.to])[edge.to];
                
                if (!fromPos || !toPos) {
                    console.error('ノード位置を取得できませんでした');
                    return;
                }
                
                const midPoint = {
                    x: (fromPos.x + toPos.x) / 2,
                    y: (fromPos.y + toPos.y) / 2
                };
                
                const newNodeId = this.generateUniqueNumberText();
                const actualLabel = newLabel || '新しいノード';
                
                const originalEdgeLabel = this.EdgeLabels[edgeId] || edge.label || '';
                const originalToNodeId = edge.to;
                let originalReasonText = '';
                
                if (edge.title && edge.title.includes('理由:')) {
                    const match = edge.title.match(/理由:\\s*(.+)/);
                    if (match && match[1]) {
                        originalReasonText = match[1].trim();
                    }
                }
                
                if (!originalReasonText || originalReasonText.trim() === '') {
                    const toNode = this.nodes.get(originalToNodeId);
                    if (toNode && toNode.purpose && toNode.purpose.trim() !== '') {
                        originalReasonText = toNode.purpose;
                    }
                }
                
                if (!originalReasonText || originalReasonText.trim() === '') {
                    const rIdx = this.ReasonConnectNodeId.indexOf(originalToNodeId);
                    if (rIdx !== -1 && this.ReasonContent[rIdx]) {
                        originalReasonText = this.ReasonContent[rIdx];
                    }
                }
                
                try {
                    this.edges.remove(edgeId);
                } catch (error) {
                    try { this.edges.remove({id: edgeId}); } catch (e) {}
                }
                
                if (this.EdgeLabels[edgeId]) {
                    delete this.EdgeLabels[edgeId];
                }
                
                if (typeof defaultRecordThinkingProcess !== 'undefined' && defaultRecordThinkingProcess.delete_db_Edge) {
                    defaultRecordThinkingProcess.delete_db_Edge(edgeId, edge.from, edge.to);
                }
                
                if (this.edges.get(edgeId)) {
                    this.edges.remove({id: edgeId});
                }
                
                this.addNode(newNodeId, actualLabel, "step", midPoint.x, midPoint.y);
                
                if (this.edges.get(edgeId)) {
                    this.edges.remove([edgeId]);
                }
                
                const newEdgeId1 = this.generateUniqueNumberText();
                const newEdgeData1 = {
                    id: String(newEdgeId1),
                    from: String(edge.from),
                    to: String(newNodeId)
                };
                
                const fromNode1 = this.nodes.get(edge.from);
                let baseColor1 = '#a8d5a2';
                if (fromNode1 && fromNode1.color) {
                    if (typeof fromNode1.color === 'string') { baseColor1 = fromNode1.color; }
                    else if (fromNode1.color.background) { baseColor1 = fromNode1.color.background; }
                }
                const edgeColor1 = darkenColor(baseColor1, 0.3);
                newEdgeData1.color = { color: edgeColor1, highlight: edgeColor1, hover: edgeColor1 };
                
                this.edges.add(newEdgeData1);
                
                const newEdgeId2 = this.generateUniqueNumberText();
                const newEdgeData2 = {
                    id: String(newEdgeId2),
                    from: String(newNodeId),
                    to: String(edge.to)
                };
                
                const fromNode2 = this.nodes.get(newNodeId);
                let baseColor2 = '#a8d5a2';
                if (fromNode2 && fromNode2.color) {
                    if (typeof fromNode2.color === 'string') { baseColor2 = fromNode2.color; }
                    else if (fromNode2.color.background) { baseColor2 = fromNode2.color.background; }
                }
                const edgeColor2 = darkenColor(baseColor2, 0.3);
                newEdgeData2.color = { color: edgeColor2, highlight: edgeColor2, hover: edgeColor2 };
                
                if (originalReasonText && originalReasonText.trim() !== '') {
                    const newNode = this.nodes.get(newNodeId);
                    let nodeColor = '#888888';
                    if (newNode && newNode.color) {
                        if (typeof newNode.color === 'string') { nodeColor = newNode.color; }
                        else if (newNode.color.background) { nodeColor = newNode.color.background; }
                    }
                    const edgeColor = darkenColor(nodeColor, 0.3);
                    
                    newEdgeData2.dashes = false;
                    newEdgeData2.width = 3;
                    newEdgeData2.color = { color: edgeColor, highlight: edgeColor, hover: edgeColor };
                    newEdgeData2.title = '💡 理由: ' + originalReasonText;
                }
                
                if (originalEdgeLabel) {
                    newEdgeData2.label = originalEdgeLabel;
                    newEdgeData2.font = { size: 12, color: '#333333', background: 'rgba(255, 255, 255, 0.8)', strokeWidth: 1, strokeColor: '#ffffff' };
                    this.EdgeLabels[newEdgeId2] = originalEdgeLabel;
                }
                
                this.edges.add(newEdgeData2);
                
                if (typeof defaultRecordThinkingProcess !== 'undefined' && defaultRecordThinkingProcess.record_Edge) {
                    defaultRecordThinkingProcess.record_Edge(newEdgeId1, edge.from, newNodeId, '');
                    defaultRecordThinkingProcess.record_Edge(newEdgeId2, newNodeId, edge.to, originalEdgeLabel || '');
                }
                
                if (typeof executeNavigatorTrigger === 'function') {
                    executeNavigatorTrigger('node_created');
                }
                
                if (reasonText) {
                    const reasonNodeId = `reason-${newNodeId}`;
                    this.ReasonConnectNodeId.push(newNodeId);
                    this.ReasonNodeId.push(reasonNodeId);
                    this.ReasonContent.push(reasonText);
                    
                    if (typeof defaultRecordThinkingProcess !== 'undefined') {
                        defaultRecordThinkingProcess.record_reason(newNodeId, reasonNodeId, reasonText, edge.from);
                    }
                    
                    this.updateEdgesToNodeWithReason(newNodeId, reasonText, edge.from);
                    
                    if (typeof undoRedoManager !== 'undefined') {
                        undoRedoManager.recordAction({
                            type: 'EDIT_REASON',
                            nodeId: newNodeId,
                            edgeId: String(newEdgeId1),
                            oldReason: '',
                            newReason: reasonText
                        });
                    }
                }
                
                this.ownNetwork.selectNodes([newNodeId]);
                this.selectId = newNodeId;
            }
        });
    }"""

if target4 in content:
    content = content.replace(target4, insert_submit)
    print("Replaced target4")
else:
    print("target4 not found")

with open(filepath, 'w') as f:
    f.write(content)

