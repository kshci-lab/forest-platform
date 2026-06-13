/**
 * フロントエンド モジュール エントリポイント
 * (レガシーコードとの互換性維持のためのグローバルブリッジ)
 */

import { NETWORK_OPTIONS, UI_CONFIG } from './config/constants.js';
import { UndoRedoManager } from './modules/undo-redo-manager.js';

// グローバルスコープへ安全に公開
window.SYSTEM_CONSTANTS = {
    NETWORK_OPTIONS,
    UI_CONFIG
};

window.UndoRedoManager = UndoRedoManager;

console.log("🚀 kagitani-system frontend module bridge loaded.");
