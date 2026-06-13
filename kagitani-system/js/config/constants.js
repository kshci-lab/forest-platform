/**
 * システム共通の定数・設定定義モジュール
 */

// vis.js Network の描画オプション
export const NETWORK_OPTIONS = {
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
                values.shadow = true;
                values.shadowColor = 'rgba(0,0,0,0.18)';
                values.shadowSize = 18;
                values.shadowX = 4;
                values.shadowY = 4;
            }
        },
        scaling: { min: 10, max: 30 }
    },
    groups: {
        'topic-tag': {
            color: {
                background: '#7eb6e6',
                border: '#FF8C00'
            },
            borderWidth: 3,
            borderWidthSelected: 4,
            font: { color: '#333' }
        }
    },
    edges: {
        arrows: 'to',
        smooth: false,
        dashes: true,
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
        zoomView: false,
        dragView: true,
        navigationButtons: false,
        keyboard: {
            enabled: false
        },
        tooltipDelay: 200,
        hideEdgesOnDrag: false,
        hideNodesOnDrag: false,
        hover: true
    },
    configure: {
        enabled: false
    }
};

// UI・ドラッグ判定などの設定
export const UI_CONFIG = {
    DRAG_THRESHOLD: 5,            // プラスボタンからのドラッグ結線判定閾値（px）
    APPEND_MAP_OFFSET_X: 600,     // 並列ロード時のX座標追加オフセット量（px）
    DEFAULT_NODE_COLOR: '#888888',
    NEW_NODE_OFFSET_Y: 80,        // 新規子ノード作成時のY座標オフセット
    ADD_BUTTON_RADIUS: 12,        // ＋ボタンの半径 (width/2)
    Z_INDEX_PREVIEW: 9999,        // ドラッグプレビュー矢印のz-index
    Z_INDEX_ADD_BUTTON: 1000      // プラスボタンのz-index
};
