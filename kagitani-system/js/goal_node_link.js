// goal_node_link.js
function sendNodeIdToPHP(node_id) {
    $.ajax({
        url: 'php/link_node_to_latest_goal.php',
        type: 'POST',
        data: { node_id: node_id },
        success: function(response) {
            console.log('ノードリンク結果:', response);
            alert('ノードを目標にリンクしました: ' + response);
        },
        error: function(xhr, status, error) {
            console.error('通信エラー:', error);
            alert('通信エラー');
        }
    });
}

// Mindmapノードの右クリックイベント
function setupMindmapRightClick(mindmapInstance) {
    mindmapInstance.view.add_event('contextmenu', function(node) {
        // node.idがノードID
        sendNodeIdToPHP(node.id);
        return false; // デフォルトの右クリックメニューを無効化
    });
}
// 例: mindmapインスタンスが _jm の場合
// setupMindmapRightClick(_jm);
