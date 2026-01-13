/*
 * Navigator.js
 * ナビゲーター機能を管理するクラス
 * 目標手段階層マップでのユーザーガイダンスを提供
 */

class Navigator {
    constructor() {
        this.isGreetingVisible = false;
        this.greetingTimeout = null;
        this.persistentMode = true; // デフォルトで永続表示モード
        this.currentMood = 'encourage'; // 現在のフクロウの表情
        this.triggers = new Map(); // トリガーとコールバック関数の管理
        this.initializeStyles();
    }

    // CSSスタイルの初期化
    initializeStyles() {
        if (!document.querySelector('#navigator-styles')) {
            const style = document.createElement('style');
            style.id = 'navigator-styles';
            style.textContent = `
                @keyframes fadeInScale {
                    0% {
                        opacity: 0;
                        transform: scale(0.8) translateY(-10px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                @keyframes fadeOutScale {
                    0% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0.8) translateY(-10px);
                    }
                }
                
                .navigator-greeting {
                    margin-top: 10px;
                    padding: 20px 70px 20px 20px;
                    background-color: #f0f0f0;
                    border-radius: 10px;
                    box-shadow: 
                        0 2px 4px rgba(0,0,0,0.1);
                    position: relative;
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                    animation: fadeInScale 0.5s ease-out;
                    transition: all 0.3s ease;
                    border: 1px solid #ccc;
                }
                
                .navigator-greeting:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
                }
                
                .navigator-avatar {
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    position: absolute;
                    bottom: 15px;
                    right: 15px;
                }
                
                .navigator-avatar svg {
                    width: 48px;
                    height: 48px;
                }
                
                @keyframes navigatorPulse {
                    0%, 100% {
                        box-shadow: 
                            0 4px 12px rgba(255, 152, 0, 0.3),
                            inset 0 2px 4px rgba(255,255,255,0.2),
                            0 0 0 2px rgba(255, 152, 0, 0.2);
                    }
                    50% {
                        box-shadow: 
                            0 6px 20px rgba(255, 152, 0, 0.5),
                            inset 0 2px 4px rgba(255,255,255,0.3),
                            0 0 0 4px rgba(255, 152, 0, 0.4);
                        transform: scale(1.05);
                    }
                }
                
                @keyframes navigatorBob {
                    0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
                    50% { transform: translate(-50%, -50%) translateY(-2px); }
                }
                
                .navigator-avatar.custom-avatar svg {
                    width: 44px;
                    height: 44px;
                }
                
                .navigator-message {
                    color: #333;
                    font-size: 18px;
                    line-height: 1.5;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    margin-right: 10px;
                    
                }
                
                .navigator-message-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    width: 100%;
                }
                
                .navigator-message-sub {
                    margin-top: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    opacity: 0.95;
                    line-height: 1.4;
                    width: 100%;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // トリガーを登録する
    registerTrigger(triggerName, callback) {
        this.triggers.set(triggerName, callback);
        console.log(`トリガー "${triggerName}" が登録されました`);
    }

    // トリガーを削除する
    removeTrigger(triggerName) {
        const removed = this.triggers.delete(triggerName);
        if (removed) {
            console.log(`トリガー "${triggerName}" が削除されました`);
        }
        return removed;
    }

    // トリガーを実行する
    executeTrigger(triggerName, ...args) {
        const callback = this.triggers.get(triggerName);
        if (callback && typeof callback === 'function') {
            try {
                callback(...args);
                console.log(`トリガー "${triggerName}" が実行されました`);
            } catch (error) {
                console.error(`トリガー "${triggerName}" の実行中にエラーが発生しました:`, error);
            }
        } else {
            console.warn(`トリガー "${triggerName}" が見つかりません`);
        }
    }

    // フクロウの表情を変更する
    changeMood(newMood, message = null, duration = null) {
        // 有効な表情かチェック
        const validMoods = ['encourage', 'suggest', 'check'];
        if (!validMoods.includes(newMood)) {
            console.warn(`無効な表情です: ${newMood}. 有効な表情: ${validMoods.join(', ')}`);
            return;
        }

        this.currentMood = newMood;
        console.log(`フクロウの表情を "${newMood}" に変更しました`);

        // 現在表示中のアバターを更新
        this.updateCurrentAvatar(newMood);

        // メッセージが指定されている場合は表示（durationがnullなら永続表示）
        if (message) {
            this.showMessage('tip', message, duration);
        }
    }

    // 現在表示中のアバターを更新
    updateCurrentAvatar(mood) {
        /* navigator-greeting を無効化したため、ここでの直接操作もスキップします
        const currentGreeting = document.getElementById('navigator-greeting');
        if (currentGreeting) {
            const avatar = currentGreeting.querySelector('.navigator-avatar');
            if (avatar) {
                // SVGアイコンを新しい表情で更新
                avatar.innerHTML = this.createOwlSVG(mood);
                
                // 表情変化のアニメーション効果
                avatar.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    avatar.style.transform = 'scale(1)';
                }, 200);
            }
        }
        */

        // その他のナビゲーターメッセージも更新
        const allMessages = document.querySelectorAll('[id^="navigator-message-"]');
        allMessages.forEach(message => {
            const avatar = message.querySelector('.navigator-avatar');
            if (avatar) {
                avatar.innerHTML = this.createOwlSVG(mood);
                avatar.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    avatar.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }

    // デフォルトトリガーを初期化
    initializeDefaultTriggers() {
        // ノード作成時のトリガー例（永続表示）
        this.registerTrigger('node_created', () => {
            this.changeMood('encourage', '素晴らしいですね！ノードが追加されました！', null);
        });

        // ノード削除時のトリガー例（永続表示）
        this.registerTrigger('node_deleted', () => {
            this.changeMood('check', 'ノードが削除されました', null);
        });

        // ノード編集時のトリガー例（永続表示）
        this.registerTrigger('node_edited', () => {
            this.changeMood('suggest', '編集が完了しました', null);
        });

        // マップ保存時のトリガー例（永続表示）
        this.registerTrigger('map_saved', () => {
            this.changeMood('encourage', 'マップが保存されました！', null);
        });

        console.log('デフォルトトリガーが初期化されました');
    }

    // フクロウSVGアイコンを生成
    createOwlSVG(mood = 'encourage') {
        const moodConfig = {
            encourage: {
                eyeLeft: { cx: 18, cy: 17, r: 3 },
                eyeRight: { cx: 26, cy: 17, r: 3 },
                pupilLeft: { cx: 18, cy: 16, r: 1.5 },
                pupilRight: { cx: 26, cy: 16, r: 1.5 },
                beak: 'M22 22 L20 25 L24 25 Z',
                color: '#a7c6ed' // 薄い青
            },
            suggest: {
                eyeLeft: { cx: 18, cy: 18, r: 2, closed: true },
                eyeRight: { cx: 26, cy: 18, r: 3 },
                pupilLeft: null,
                pupilRight: { cx: 26, cy: 17, r: 1.5 },
                beak: 'M22 22 L20 25 L24 25 Z',
                color: '#b8d4a8' // 薄い緑
            },
            check: {
                eyeLeft: { cx: 18, cy: 18, r: 2.5 },
                eyeRight: { cx: 26, cy: 18, r: 2.5 },
                pupilLeft: { cx: 18, cy: 18, r: 1.2 },
                pupilRight: { cx: 26, cy: 18, r: 1.2 },
                beak: 'M22 21 L20 24 L24 24 Z',
                color: '#f5e6a8' // 薄い黄色
            }
        };
        
        const config = moodConfig[mood] || moodConfig.encourage;
        
        return `
            <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                <!-- フクロウの体 -->
                <ellipse cx="22" cy="26" rx="16" ry="14" fill="${config.color}" />
                
                <!-- フクロウの頭 -->
                <circle cx="22" cy="16" r="12" fill="${config.color}" />
                
                <!-- 耳の房 -->
                <ellipse cx="16" cy="8" rx="2" ry="4" fill="${config.color}" />
                <ellipse cx="28" cy="8" rx="2" ry="4" fill="${config.color}" />
                
                <!-- 目の輪郭 -->
                <circle cx="${config.eyeLeft.cx}" cy="${config.eyeLeft.cy}" r="${config.eyeLeft.r + 1}" fill="white" />
                <circle cx="${config.eyeRight.cx}" cy="${config.eyeRight.cy}" r="${config.eyeRight.r + 1}" fill="white" />
                
                <!-- 目 -->
                ${config.eyeLeft.closed ? 
                    `<path d="M${config.eyeLeft.cx - 2} ${config.eyeLeft.cy} Q${config.eyeLeft.cx} ${config.eyeLeft.cy - 1} ${config.eyeLeft.cx + 2} ${config.eyeLeft.cy}" 
                           stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round" />` :
                    `<circle cx="${config.eyeLeft.cx}" cy="${config.eyeLeft.cy}" r="${config.eyeLeft.r}" fill="white" />`
                }
                <circle cx="${config.eyeRight.cx}" cy="${config.eyeRight.cy}" r="${config.eyeRight.r}" fill="white" />
                
                <!-- 瞳 -->
                ${config.pupilLeft ? `<circle cx="${config.pupilLeft.cx}" cy="${config.pupilLeft.cy}" r="${config.pupilLeft.r}" fill="#333" />` : ''}
                ${config.pupilRight ? `<circle cx="${config.pupilRight.cx}" cy="${config.pupilRight.cy}" r="${config.pupilRight.r}" fill="#333" />` : ''}
                
                <!-- くちばし -->
                <path d="${config.beak}" fill="#ff8c42" />
                
                <!-- 胸の模様 -->
                <ellipse cx="22" cy="28" rx="8" ry="6" fill="rgba(255,255,255,0.3)" />
                <ellipse cx="22" cy="30" rx="6" ry="4" fill="rgba(255,255,255,0.2)" />
            </svg>
        `;
    }
    showGreeting() {
        // 既に表示中の場合は何もしない
        if (this.isGreetingVisible) {
            return;
        }

        // feedback_areaとnode_count_displayを探す
        const feedbackArea = document.getElementById('feedback_area');
        const nodeCountDisplay = document.getElementById('node_count_display');
        
        if (!feedbackArea || !nodeCountDisplay) {
            console.warn('feedback_areaまたはnode_count_displayが見つかりません');
            return;
        }
        
        /* navigator-greeting を無効化しました（表示しない）
        // 既存の挨拶メッセージがあれば削除
        this.hideGreeting();
        
        // ナビゲーターの挨拶要素を作成
        const greetingContainer = this.createGreetingElement();
        
        // node_count_displayの後に挿入
        nodeCountDisplay.parentNode.insertBefore(greetingContainer, nodeCountDisplay.nextSibling);
        
        this.isGreetingVisible = true;
        
        // 永続表示モードでない場合のみ自動消去タイマーを設定（デフォルトは永続表示）
        if (!this.persistentMode) {
            this.greetingTimeout = setTimeout(() => {
                this.hideGreeting();
            }, 3000);
        }
        
        console.log(`ナビゲーターの挨拶を表示しました（${this.persistentMode ? '永続表示' : '3秒後自動消去'}）`);
        */
    }

    // 永続表示モードの設定
    setPersistentMode(enabled) {
        this.persistentMode = enabled;
        console.log(`ナビゲーター永続表示モード: ${enabled ? 'ON' : 'OFF'}`);
    }

    // 永続表示モードの状態を取得
    isPersistentMode() {
        return this.persistentMode;
    }

    // 挨拶要素を作成
    createGreetingElement() {
        const greetingContainer = document.createElement('div');
        greetingContainer.id = 'navigator-greeting';
        greetingContainer.className = 'navigator-greeting';
        
        // ナビゲーターのアバター
        const avatar = document.createElement('div');
        avatar.className = 'navigator-avatar';
        avatar.innerHTML = this.createOwlSVG('encourage');
        // CSSのSVGでフクロウアイコンを表示
        
        // 挨拶メッセージ
        const message = document.createElement('div');
        message.className = 'navigator-message';
        message.innerHTML = `
            <div class="navigator-message-header">
                <span id="navigatorGreetingHeader">こんにちは！</span>
            </div>
            <div class="navigator-message-sub">
                <span id="navigatorGreetingSub">目標手段階層マップへようこそ</span>
            </div>
        `;
        
        // 要素を組み立て
        greetingContainer.appendChild(avatar);
        greetingContainer.appendChild(message);
        
        return greetingContainer;
    }

    // 挨拶メッセージを非表示
    hideGreeting() {
        const existingGreeting = document.getElementById('navigator-greeting');
        if (existingGreeting) {
            existingGreeting.style.animation = 'fadeOutScale 0.3s ease-in';
            setTimeout(() => {
                if (existingGreeting.parentNode) {
                    existingGreeting.remove();
                }
            }, 300);
        }
        
        // タイムアウトをクリア
        if (this.greetingTimeout) {
            clearTimeout(this.greetingTimeout);
            this.greetingTimeout = null;
        }
        
        this.isGreetingVisible = false;
    }

    // 複数のメッセージタイプに対応した表示機能
    showMessage(type, content, duration = null) {
        const messageConfig = this.getMessageConfig(type);
        const messageElement = this.createMessageElement(messageConfig, content);
        
        // メッセージを表示
        this.displayMessage(messageElement, duration);
    }

    // メッセージタイプ別の設定を取得
    getMessageConfig(type) {
        const configs = {
            greeting: {
                icon: '👋',
                avatar: '👨‍💼', // ビジネスマン（ナビゲーター）
                mood: 'encourage',
                gradient: '#f0f0f0',
                title: 'こんにちは！',
                subtitle: '目標手段階層マップへようこそ'
            },
            tip: {
                icon: '💡',
                avatar: '👨‍�', // 教師（ヒントを教える人）
                mood: 'suggest',
                gradient: '#f5f5f5',
                title: 'ヒント',
                subtitle: '操作のコツをお教えします'
            },
            warning: {
                icon: '⚠️',
                avatar: '👨‍�', // 消防士（警告する人）
                mood: 'check',
                gradient: '#fff3cd',
                title: '注意',
                subtitle: 'ご確認ください'
            },
            success: {
                icon: '✅',
                avatar: '👨‍�', // 卒業生（成功を祝う人）
                mood: 'encourage',
                title: '成功！',
                subtitle: '処理が完了しました'
            }
        };
        
        return configs[type] || configs.greeting;
    }

    // カスタムメッセージ要素を作成
    createMessageElement(config, content) {
        const container = document.createElement('div');
        container.className = 'navigator-greeting';
        container.style.background = config.gradient;
        
        // アバター
        const avatar = document.createElement('div');
        avatar.className = 'navigator-avatar';
        // フクロウのSVGアイコンを設定
        avatar.innerHTML = this.createOwlSVG(config.mood || 'encourage');
        // デフォルトはフクロウSVGを表示
        
        // メッセージ
        const message = document.createElement('div');
        message.className = 'navigator-message';
        message.innerHTML = `
            <div class="navigator-message-header">
                <span style="font-size: 18px;">${config.icon}</span>
                <span>${config.title}</span>
            </div>
            <div class="navigator-message-sub">
                ${content || config.subtitle}
            </div>
        `;
        
        container.appendChild(avatar);
        container.appendChild(message);
        
        return container;
    }

    // メッセージを表示
    displayMessage(messageElement, duration) {
        const feedbackArea = document.getElementById('feedback_area');
        const nodeCountDisplay = document.getElementById('node_count_display');
        
        if (!feedbackArea || !nodeCountDisplay) {
            console.warn('表示エリアが見つかりません');
            return;
        }
        
        // 既存のナビゲーターメッセージを削除
        this.hideAllMessages();
        
        // ユニークIDを設定
        const messageId = 'navigator-message-' + Date.now();
        messageElement.id = messageId;
        
        // メッセージを挿入
        nodeCountDisplay.parentNode.insertBefore(messageElement, nodeCountDisplay.nextSibling);
        
        // 自動非表示タイマー（durationがnullでない場合のみ）
        if (duration && duration > 0) {
            setTimeout(() => {
                this.hideMessage(messageElement);
            }, duration);
        }
        // durationがnullの場合は永続表示（タイマーを設定しない）
    }

    // 特定のメッセージを非表示
    hideMessage(messageElement) {
        if (messageElement && messageElement.parentNode) {
            messageElement.style.animation = 'fadeOutScale 0.3s ease-in';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 300);
        }
    }

    // すべてのナビゲーターメッセージを非表示
    hideAllMessages() {
        const existingGreeting = document.getElementById('navigator-greeting');
        if (existingGreeting) {
            this.hideMessage(existingGreeting);
        }
        
        // その他のナビゲーターメッセージも削除
        const allMessages = document.querySelectorAll('[id^="navigator-message-"]');
        allMessages.forEach(message => {
            this.hideMessage(message);
        });
    }

    // インスタンスの破棄
    destroy() {
        this.hideAllMessages();
        if (this.greetingTimeout) {
            clearTimeout(this.greetingTimeout);
        }
    }
}

// グローバルナビゲーターインスタンス
let globalNavigator = null;

// ナビゲーターの初期化
function initializeNavigator() {
    if (!globalNavigator) {
        globalNavigator = new Navigator();
        // デフォルトトリガーを初期化
        globalNavigator.initializeDefaultTriggers();
    }
    return globalNavigator;
}

// ナビゲーターの挨拶を表示（外部から呼び出し用）
function showNavigatorGreeting() {
    const navigator = initializeNavigator();
    navigator.showGreeting();
}

// ナビゲーターメッセージを表示（外部から呼び出し用）
function showNavigatorMessage(type, content, duration = null) {
    const navigator = initializeNavigator();
    navigator.showMessage(type, content, duration);
}

// ナビゲーターメッセージを非表示（外部から呼び出し用）
function hideNavigatorMessages() {
    if (globalNavigator) {
        globalNavigator.hideAllMessages();
    }
}

// ナビゲーターの永続表示モードを設定（外部から呼び出し用）
function setNavigatorPersistentMode(enabled) {
    const navigator = initializeNavigator();
    navigator.setPersistentMode(enabled);
}

// ナビゲーターの永続表示モード状態を取得（外部から呼び出し用）
function isNavigatorPersistentMode() {
    if (globalNavigator) {
        return globalNavigator.isPersistentMode();
    }
    return true; // デフォルトは永続表示
}

// フクロウの表情を変更（外部から呼び出し用）
function changeNavigatorMood(mood, message = null, duration = null) {
    const navigator = initializeNavigator();
    navigator.changeMood(mood, message, duration);
}

// トリガーを登録（外部から呼び出し用）
function registerNavigatorTrigger(triggerName, callback) {
    const navigator = initializeNavigator();
    navigator.registerTrigger(triggerName, callback);
}

// トリガーを実行（外部から呼び出し用）
function executeNavigatorTrigger(triggerName, ...args) {
    const navigator = initializeNavigator();
    navigator.executeTrigger(triggerName, ...args);
}

// トリガーを削除（外部から呼び出し用）
function removeNavigatorTrigger(triggerName) {
    if (globalNavigator) {
        return globalNavigator.removeTrigger(triggerName);
    }
    return false;
}

// エクスポート（モジュール使用時）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Navigator,
        initializeNavigator,
        showNavigatorGreeting,
        showNavigatorMessage,
        hideNavigatorMessages,
        changeNavigatorMood,
        registerNavigatorTrigger,
        executeNavigatorTrigger,
        removeNavigatorTrigger
    };
}
