<?php
session_start();
require("../php/connect_db.php");
require("php/sheet.php");

// ログイン状態のチェック
if (!isset($_SESSION["USERID"]) ) { //ログイン出来ていない
    header("Location: ../logout.php");
    exit;
}

if( (isset($_POST["sheetbtn"])) ||   //シート選択ボタンが押された
    (isset($_SESSION["USERID"]) && !isset($_SESSION["MAPID"]) )) { //ログインは出来ているがシート未選択の場合
    header("Location: select_sheet.php");
    $_SESSION["MAPID"] = null; //シート選択画面に遷移させた時にMAPIDをリセット
}

if(isset($_POST["logout"])){ //logoutボタンが押された
    // alert("本当にログアウトしますか？");
    
    // 時間があれば確認ダイアログを作る
    header("Location: ../logout.php");
    exit;
}

if(isset($_POST["myFileImage"])){ //imageFileImage
    // print("画像");

    if (!empty($_FILES['ImageFile']['name'])) {
        $uuid = uniqid();
        $name = $_FILES['ImageFile']['name'];
        $type = $_FILES['ImageFile']['type'];
        $content = file_get_contents($_FILES['ImageFile']['tmp_name']);
        $size = $_FILES['ImageFile']['size'];

        $sql = "INSERT INTO images(image_id, image_name, image_type, image_content, image_size, created_at)
      VALUES ('$uuid', :image_name, :image_type, :image_content, :image_size, now())";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':image_name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':image_type', $type, PDO::PARAM_STR);
        $stmt->bindValue(':image_content', $content, PDO::PARAM_STR);
        $stmt->bindValue(':image_size', $size, PDO::PARAM_INT);
        $stmt->execute();
    }
    header("Location: index.php");
    // CreateSlide_Image();
    // header("Location: select_sheet.php");
    exit();
}


?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<!-- ここから大槻修正 -->
<html lang="en">
    <!-- ここまで大槻修正 -->
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>自己内対話活性化支援システム</title>
        <link type="text/css" rel="stylesheet" href="../css/jsmind.css" />
        <link rel="stylesheet" type="text/css" href="../css/item.css">
        <link rel="stylesheet" type="text/css" href="css/font.css">
        <link rel="stylesheet" type="text/css" href="css/jquery.cleditor.css">
        <link rel="stylesheet" type="text/css" href="css/ui.css">
        <link rel="stylesheet" type="text/css" href="css/style.css">
        <link rel="stylesheet" type="text/css" href="css/smart-goals.css">
        <link rel="stylesheet" type="text/css" href="css/goal.css">
        <!-- <link rel="stylesheet" type="text/css" href="../css/thinking-process-network.css" /> -->
        
        <style>
        /* 問い一覧のスタイリング - 最高優先度 */
        #testxml ul {
            list-style: none !important;
            margin: 0 0 8px 0 !important;
            padding: 8px 12px !important;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
            border: 1px solid #dee2e6 !important;
            border-radius: 6px !important;
            transition: all 0.2s ease !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }

        #testxml ul:hover {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
            border-color: #2196f3 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15) !important;
        }

        #testxml ul img {
            width: 16px !important;
            height: 16px !important;
            opacity: 0.7 !important;
            transition: opacity 0.2s ease !important;
            flex-shrink: 0 !important;
        }

        #testxml ul:hover img {
            opacity: 1 !important;
        }

        #testxml ul a {
            color: #495057 !important;
            text-decoration: none !important;
            font-weight: 500 !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
            flex: 1 !important;
            transition: color 0.2s ease !important;
        }

        #testxml ul:hover a {
            color: #1976d2 !important;
        }

        #intention ul, #rationality ul {
            list-style: none !important;
            margin: 0 0 8px 0 !important;
            padding: 8px 12px !important;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
            border: 1px solid #dee2e6 !important;
            border-radius: 6px !important;
            transition: all 0.2s ease !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }

        #intention ul:hover, #rationality ul:hover {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
            border-color: #2196f3 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15) !important;
        }

        #intention ul img, #rationality ul img {
            width: 16px !important;
            height: 16px !important;
            opacity: 0.7 !important;
            transition: opacity 0.2s ease !important;
            flex-shrink: 0 !important;
        }

        #intention ul:hover img, #rationality ul:hover img {
            opacity: 1 !important;
        }

        #intention ul a, #rationality ul a {
            color: #495057 !important;
            text-decoration: none !important;
            font-weight: 500 !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
            flex: 1 !important;
            transition: color 0.2s ease !important;
        }

        #intention ul:hover a, #rationality ul:hover a {
            color: #1976d2 !important;
        }
        
        /* ハンバーガーメニューのタブナビゲーション */
        .tab-navigation {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .dropdown-tab-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            color: #495057;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
            width: 100%;
        }
        
        .dropdown-tab-item:hover {
            background: #e9ecef;
            color: #333;
        }
        
        .dropdown-tab-item.active {
            background: #405dca;
            color: white;
            border-color: #405dca;
        }
        </style>
<script type="text/javascript">
document.addEventListener('DOMContentLoaded', function() {
  var showBtn = document.getElementById('showQuestionsBtn');
  var listDiv = document.getElementById('questionsList');
  if (showBtn && listDiv) {
    showBtn.addEventListener('click', function() {
      if (listDiv.style.display === 'none' || listDiv.style.display === '') {
        listDiv.style.display = 'block';
        // TODO: 問い一覧の内容をここでセットする（例: listDiv.innerHTML = ...）
      } else {
        listDiv.style.display = 'none';
      }
    });
  }
});
</script>

        <script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
        <script type="text/javascript" src="js/jquery-ui.min.js"></script>
        <script type="text/javascript" src="js/jsmind.js"></script>
        <script type="text/javascript" src="js/jsmind.draggable.js"></script>
        <script type="text/javascript" src="../js/vis-network.min.js"></script>

        <script src="js/jquery.autosize.js"></script>
        <script src="js/jquery.autosize.min.js"></script>

        <script type="text/javascript" src="js/version_update.js"></script>
        <script type="text/javascript" src="js/get_thinking.js"></script>
        <script type="text/javascript" src="js/jsmind.screenshot.js"></script>
        <script type="text/javascript" src="js/change_tab.js"></script>
        <script type="text/javascript" src="../js/meeting-reflection-network.js"></script>
        <link rel="stylesheet" type="text/css" href="../css/meeting-reflection-network.css" />
        <script type="text/javascript" src="js/navigator.js"></script>
        <script type="text/javascript" src="js/object-network.js"></script>
        <link rel="stylesheet" type="text/css" href="css/object-network.css" />
        <script type="text/javascript" src="js/timeline_slider.js"></script>
        <script type="text/javascript" src="js/goal_list.js"></script>
        <script type="text/javascript">
        window.onbeforeunload = function(e) {e.returnValue = "ページを離れようとしています。よろしいですか？";}
        
        // タブ切り替え機能
        function switchTab(tabId, evt) {
            // 全てのタブコンテンツを非表示
            const tabContents = document.querySelectorAll('.tabcontent > div');
            tabContents.forEach(tab => {
                tab.style.display = 'none';
            });
            
            // 選択されたタブを表示
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.style.display = 'block';
            }
            
            // ハンバーガーメニューのタブボタンの状態を更新
            const tabButtons = document.querySelectorAll('.dropdown-tab-item');
            tabButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            // クリックされたボタンをアクティブに
            // inline onclick などで渡されたイベントを優先、未定義ならonclick属性で一致するボタンを探す
            var activeButton = null;
            if (evt && evt.target) {
                activeButton = evt.target;
            } else if (typeof event !== 'undefined' && event && event.target) {
                activeButton = event.target;
            } else {
                // onclick="switchTab('tab01')" のようなボタンを探す
                var buttons = document.querySelectorAll('.dropdown-tab-item');
                buttons.forEach(function(btn) {
                    var onclick = btn.getAttribute('onclick') || '';
                    if (onclick.indexOf("switchTab('" + tabId + "')") !== -1 || onclick.indexOf('switchTab(\"' + tabId + '\"') !== -1) {
                        activeButton = btn;
                    }
                });
            }
            if (activeButton && activeButton.classList) activeButton.classList.add('active');
            
            // メニューを閉じる
            const hamburgerMenu = document.querySelector('.hamburger-menu');
            const dropdownMenu = document.querySelector('.dropdown-menu');
            const overlay = document.querySelector('.menu-overlay');
            
            hamburgerMenu.classList.remove('active');
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.visibility = 'hidden';
            dropdownMenu.style.transform = 'translateX(-100%)';
            overlay.classList.remove('active');
        }
        
     
        
        // ハンバーガーメニューのクリックイベント
        document.addEventListener('DOMContentLoaded', function() {
            const hamburgerMenu = document.querySelector('.hamburger-menu');
            const dropdownMenu = document.querySelector('.dropdown-menu');
            let isMenuOpen = false;
            
            // オーバーレイ要素を作成
            const overlay = document.createElement('div');
            overlay.className = 'menu-overlay';
            document.body.appendChild(overlay);
            
            hamburgerMenu.addEventListener('click', function(e) {
                e.stopPropagation();
                isMenuOpen = !isMenuOpen;
                
                if (isMenuOpen) {
                    hamburgerMenu.classList.add('active');
                    dropdownMenu.style.opacity = '1';
                    dropdownMenu.style.visibility = 'visible';
                    dropdownMenu.style.transform = 'translateX(0)';
                    overlay.classList.add('active');
                } else {
                    hamburgerMenu.classList.remove('active');
                    dropdownMenu.style.opacity = '0';
                    dropdownMenu.style.visibility = 'hidden';
                    dropdownMenu.style.transform = 'translateX(-100%)';
                    overlay.classList.remove('active');
                }
            });
            
            // メニュー外をクリックしたら閉じる
            document.addEventListener('click', function() {
                if (isMenuOpen) {
                    isMenuOpen = false;
                    hamburgerMenu.classList.remove('active');
                    dropdownMenu.style.opacity = '0';
                    dropdownMenu.style.visibility = 'hidden';
                    dropdownMenu.style.transform = 'translateX(-100%)';
                    overlay.classList.remove('active');
                }
            });
            
            // オーバーレイをクリックしたら閉じる
            overlay.addEventListener('click', function() {
                if (isMenuOpen) {
                    isMenuOpen = false;
                    hamburgerMenu.classList.remove('active');
                    dropdownMenu.style.opacity = '0';
                    dropdownMenu.style.visibility = 'hidden';
                    dropdownMenu.style.transform = 'translateX(-100%)';
                    overlay.classList.remove('active');
                }
            });
            
            // ドロップダウンメニュー内のクリックでは閉じない
            dropdownMenu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            // 初期タブ表示設定
            switchTab('tab01');
            
            // フィードバックエリアを表示
            const feedbackArea = document.getElementById('feedback_area');
            if (feedbackArea) {
                feedbackArea.style.display = 'block';
            }
            
            // ノード数更新を開始
            startNodeCountUpdater();
        });
        </script>

        <!-- <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
             <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous"> -->

    </head>
    <body id="all">
        <!-- 言語切替スライダー -->
                <div id="language-toggle-container" style="position:fixed;top:10px;right:30px;z-index:9999;">
                        <label style="display:flex;align-items:center;gap:8px;font-size:15px;">
                                <span id="lang-label-ja">日本語</span>
                                <label class="switch">
                                    <input type="checkbox" id="language-toggle" />
                                    <span class="slider round"></span>
                                </label>
                                <span id="lang-label-en">English</span>
                        </label>
                </div>
                <style>
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 46px;
                    height: 24px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 24px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: #2196F3;
                }
                input:checked + .slider:before {
                    transform: translateX(22px);
                }
                .slider.round {
                    border-radius: 24px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                </style>
        <div id="language-switching-message" style="display:none;position:fixed;top:50px;right:30px;background:#fff3cd;color:#856404;padding:8px 18px;border-radius:7px;box-shadow:0 2px 8px #ccc;z-index:9999;font-size:16px;">言語切り替え中・・・</div>
        <script>
        // 言語テキスト辞書（主要ボタン）
        const langDict = {
            ja: {
                'processMenuTitle': 'ノード操作',
                'processMenuStart': '開始',
                'processMenuComplete': '完了',
                'processMenuPause': '中断',
                'processMenuReason': '理由を記述',
                'processMenuDeadline': '完了予定を設定',
                'processMenuCancel': 'キャンセル',
                'reasonPurposeTitle': '【理由・目的】',
                'rationalityTitle': '【合理性】',
                'lang-label-ja': '日本語',
                'lang-label-en': 'English',
                'addWeeklyGoalBtn': '小目標に追加',
                'addWeeklyGoalMenuLabel': '小目標に追加',
                'showThinkingProcessMapBtn': '目標手段階層マップ',
                'sheetbtn': 'シート選択画面に戻る',
                'logout': 'ログアウト',
                'addQNodeText': '問いノード追加',
                'addAnodeText': '答えノード追加',
                'addLabelText': 'ラベル追加',
                'removeNodeText': 'ノードの削除',
                'zoomInText': '拡大',
                'zoomOutText': '縮小',
                'screenshotLabel': '【Screenshot】',
                'screenshotText': 'screenshot',
                'processCloseText': '閉じる',
                'processAddNodeText': 'ノード追加',
                'processStartEditEdgeText': 'エッジ追加',
                'processZoomInText': '拡大',
                'processZoomOutText': '縮小',
                'returnToCurrentText': '現在に戻る',
                'historyIndicatorText': '📅 過去の表示',
                'nodeCountLabel': '📊 現在のノード数: ',
                'nodeCountUnit': ' 個',
                'refreshNodeCountIcon': '🔄',
                'completedLabel': '完了',
                'inProgressLabel': '実行中',
                'pausedLabel': '中断',
                'notStartedLabel': '未着手',
                'navigatorGreetingHeader': 'こんにちは！',
                'navigatorGreetingSub': '目標手段階層マップへようこそ',
                'weeklyGoalTitle': '時間軸で目標を整理',
                'weeklyGoalTooltip': '次のMTの１週間の目標',
                'weeklyGoalStartLabel': '開始日',
                'weeklyGoalEndLabel': '終了日',
                'addWeeklyGoalBtnText': '追加',
                'exportWeeklyGoalBtnText': 'レポート出力',
                'editWeeklyGoalBtnText': '編集',
                'deleteWeeklyGoalBtnText': '削除',
            },
            en: {
                'processMenuTitle': 'Node Actions',
                'processMenuStart': 'Start',
                'processMenuComplete': 'Complete',
                'processMenuPause': 'Pause',
                'processMenuReason': 'Add Reason',
                'processMenuDeadline': 'Set Deadline',
                'processMenuCancel': 'Cancel',
                'reasonPurposeTitle': '[Reason/Purpose]',
                'rationalityTitle': '[Rationality]',
                'lang-label-ja': 'Japanese',
                'showQuestionsBtnText': '問い一覧',
                'inquiryAreaTitle': '【情報の表出化】',
                'mediumGoalTitle': '中目標（半年〜1年目標）',
                'addMediumGoalBtnText': '追加',
                'mediumGoalTextPlaceholder': '中目標を入力',
                'showQuestionsBtnText': 'Inquiry List',
                'inquiryAreaTitle': '[Information Expression]',
                'editWeeklyGoalBtnText': '編集',
                'mediumGoalTitle': 'Medium Goal (6 months - 1 year)',
                'addMediumGoalBtnText': 'Add',
                'mediumGoalTextPlaceholder': 'Enter medium goal',
                'lang-label-en': 'English',
                'addWeeklyGoalBtn': 'Add Weekly Goal',
                'addWeeklyGoalMenuLabel': 'Add Weekly Goal',
                'showThinkingProcessMapBtn': 'Goal Hierarchy Map',
                'editWeeklyGoalBtnText': 'Edit',
                'exportWeeklyGoalBtnText': 'Export Journal',
                'deleteWeeklyGoalBtnText': 'Delete',
                'sheetbtn': 'Back to Sheet Selection',
                'logout': 'Logout',
                'addQNodeText': 'Add Q Node',
                'addAnodeText': 'Add A Node',
                'addLabelText': 'Add Label',
                'removeNodeText': 'Delete Node',
                'zoomInText': 'Zoom +',
                'zoomOutText': 'Zoom -',
                'screenshotLabel': '[Screenshot]',
                'screenshotText': 'Screenshot',
                'processCloseText': 'Close',
                'processAddNodeText': 'Add Node',
                'processStartEditEdgeText': 'Add Edge',
                'processZoomInText': 'Zoom+',
                'processZoomOutText': 'Zoom-',
                'returnToCurrentText': 'Return to Current',
                'historyIndicatorText': '📅 History',
                'nodeCountLabel': '📊 Node Count: ',
                'nodeCountUnit': '',
                'refreshNodeCountIcon': '🔄',
                'completedLabel': 'Completed',
                'inProgressLabel': 'In Progress',
                'pausedLabel': 'Paused',
                'notStartedLabel': 'Not Started',
                'navigatorGreetingHeader': 'Hello!',
                'navigatorGreetingSub': 'Welcome to the Goal Hierarchy Map',
                'weeklyGoalTitle': 'Weekly Goal',
                'weeklyGoalStartLabel': 'Start Date',
                'weeklyGoalEndLabel': 'End Date',
                'addWeeklyGoalBtnText': 'Add',
            }
        };
        function setLanguage(lang) {
                // 週目標日付範囲の表示も切り替え
                const weeklyGoalsList = document.getElementById('weeklyGoalsList');
                if (weeklyGoalsList) {
                    const dateRanges = weeklyGoalsList.querySelectorAll('.weekly-goal-date-range');
                    dateRanges.forEach(span => {
                        const start = span.getAttribute('data-start');
                        const end = span.getAttribute('data-end');
                        if (lang === 'ja') {
                            // 日本語: 10月3日〜10月9日
                            span.textContent = start + '〜' + end;
                        } else {
                            // 英語: Oct 3 - Oct 9
                            // 日本語日付を英語に変換
                            function jaToEnDate(jp) {
                                const m = jp.match(/(\d+)月(\d+)日/);
                                if (!m) return jp;
                                const month = parseInt(m[1], 10);
                                const day = parseInt(m[2], 10);
                                const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                return monthsEn[month-1] + ' ' + day;
                            }
                            span.textContent = jaToEnDate(start) + ' - ' + jaToEnDate(end);
                        }
                    });
                }
            document.getElementById('language-switching-message').style.display = 'block';
            console.log('言語切り替え中・・・');
            setTimeout(function() {
                Object.keys(langDict[lang]).forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) {
                        if (el.tagName === 'INPUT' && el.type === 'submit') {
                            el.value = langDict[lang][id];
                        } else {
                            el.textContent = langDict[lang][id];
                        }
                    }
                });
                // Medium goal input placeholder
                var mediumGoalInput = document.getElementById('mediumGoalText');
                if (mediumGoalInput) {
                    mediumGoalInput.placeholder = langDict[lang]['mediumGoalTextPlaceholder'];
                }
                // 動的な週目標ボタンのテキストも切り替え
                const weeklyGoalsList = document.getElementById('weeklyGoalsList');
                if (weeklyGoalsList) {
                    // 編集ボタン
                    const editBtns = weeklyGoalsList.querySelectorAll('[id^="editWeeklyGoalBtnText"]');
                    editBtns.forEach(btn => {
                        btn.textContent = langDict[lang]['editWeeklyGoalBtnText'];
                    });
                    // レポート出力ボタン
                    const exportBtns = weeklyGoalsList.querySelectorAll('[id^="exportWeeklyGoalBtnText"]');
                    exportBtns.forEach(btn => {
                        btn.textContent = langDict[lang]['exportWeeklyGoalBtnText'];
                    });
                    // 削除ボタン
                    const deleteBtns = weeklyGoalsList.querySelectorAll('[id^="deleteWeeklyGoalBtnText"]');
                    deleteBtns.forEach(btn => {
                        btn.textContent = langDict[lang]['deleteWeeklyGoalBtnText'];
                    });
                }
                document.getElementById('language-switching-message').style.display = 'none';
                console.log('言語切替完了: ' + (lang === 'ja' ? '日本語' : 'English'));
                // 問い一覧（testxml）も言語切替
                if (window.setInquiryLang) {
                    window.setInquiryLang(lang);
                }
            }, 700);
        }
        document.addEventListener('DOMContentLoaded', function() {
            var toggle = document.getElementById('language-toggle');
            setLanguage('ja');
            toggle.checked = false;
            toggle.addEventListener('change', function() {
                if (toggle.checked) {
                    setLanguage('en');
                } else {
                    setLanguage('ja');
                }
            });
        });
        </script>
        <!---        タイトルメニューStart                 -->
        <div id="main_title">
            <div class="header-container">
                <div class="hamburger-menu">
                    <div class="hamburger-icon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div class="dropdown-menu">
                        <form name="return" method="POST">
                            <input class="dropdown-item" type="submit" name="sheetbtn" id="sheetbtn" value="シート選択画面に戻る">
                            <input class="dropdown-item logout-btn" type="submit" name="logout" id="logout" value="ログアウト">
                        </form>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-section">
                            <span class="dropdown-section-title">画面切り替え</span>
                            <div class="tab-navigation">
                                <button class="dropdown-tab-item active" onclick="switchTab('tab01')">思考整理支援システム</button>
                                <button class="dropdown-tab-item" onclick="switchTab('tab04')">過去のマインドマップ</button>
                            </div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-section">
                            <span class="dropdown-section-title">モード選択</span>
                            <form name="target_mode" action="">
                                <select class="dropdown-select" name="Select1">
                                    <option>自己内対話モード</option>
                                    <option>資料構成作成モード</option>
                                    <option>資料作成モード</option>
                                    <option>議論内省マップモード</option>
                                </select>
                                <input type="button" class="dropdown-button" value="実行" onclick="ModeChangeButtonClick();" />
                            </form>
                        </div>
                    </div>
                </div>
                <span class="title_name">Forest</span>
            </div>
            <!-- Hamburger menu icon -->
            <!-- <span id="hamburger_menu" style="display: inline-block; cursor: pointer; margin-right: 10px;">
                <span style="font-size: 22px;">&#9776;</span>
            </span> -->
            <!-- Memo button icon -->
            <!-- <button id="memo_button" title="メモ" style="background: none; border: none; padding: 0 6px; margin-left: 2px; font-size: 18px; cursor: pointer; color: #007cba; vertical-align: middle;" onclick="openMemoModal()">
                <span style="font-size: 18px;">&#9998;</span>
            </button> -->
            <!-- Memo Modal -->
            <!-- <div id="memo_modal" style="display:none; position:fixed; z-index:1001; background:white; border:2px solid #007cba; border-radius:8px; padding:16px; width:340px; box-shadow:0 6px 20px rgba(0,124,186,0.2); left:50%; top:50%; transform:translate(-50%,-50%);">
                <div style="font-weight:bold; color:#007cba; margin-bottom:10px; text-align:center;">📝 メモ</div>
                <textarea id="memo_textarea" rows="7" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-size:13px; resize:vertical; box-sizing:border-box;" placeholder="ここにメモを入力..."></textarea>
                <div style="display:flex; justify-content:space-between; gap:10px; margin-top:14px;">
                    <button onclick="saveMemo()" style="flex:1; padding:8px; background-color:#28a745; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:13px;">💾 保存</button>
                    <button onclick="closeMemoModal()" style="flex:1; padding:8px; background-color:#6c757d; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:13px;">❌ キャンセル</button>
                </div>
            </div> -->
        </div>
        <!-- <form name="return" method="POST">
             <div id="session">
             <span class="session_php">
             <?php //echo("ユーザ名：");
             //echo($_SESSION["USERNAME"]);
             //echo("  　シート名：");
             //getMapname();?>
             </span>
             <span>
             <a href="" class="modal"><input type="button" id="js-show-popup" class="button9"  onclick="OperateDescription();" value="操作確認"></a>
             <input class="button7" type="button" onclick="save_node();" value="DBの接続確認">
             </span>
             </div>
             </form> -->
        <!---          タイトルメニューFinish              -->

        <!--      タブメニュー Start (ハンバーガーメニューに移動済み) -->
        <ul div class="tabnav" style="display: none;">
            <li class="active"><a href="#tab01">思考整理支援システム</a></li>
            <!-- <li><a href="#tab02">過去のマインドマップ</a></li>
                 <li class="active"><a href="#tab03" >リフレクション</a></li>
                 <li class="active"><a href="#record_tab" >履歴</a></li> -->
            <li class="active"><a href="#tab04">過去のマインドマップ</a></li>  <!--hatakeyama-->
        </ul>

        
        
        <!-- タブメニュー　Finish -->

        

        <!--メインメニュー　Start  -->
        <div class="tabcontent">
            <!-- 思考整理支援システム -->
            <div id="tab01">
                <div id="layout">
                    <div id ="system">
                        <div id="area">

                            <div id="jsmind_nav">
                                <div style="text-align: left">
                                    <!-- 【Edit】 -->
                                    <button class="button4" id="addQNodeBtn" onclick="add_Qnode();"><span id="addQNodeText">問いノード追加</span></button>
                                    <button class="button4" id="addAnodeBtn" onclick="add_Anode();"><span id="addAnodeText">答えノード追加</span></button>
                                    <button class="button4" id="addLabelBtn" onclick="add_Label('primary_label');"><span id="addLabelText">ラベル追加</span></button>
                                    <!-- <li><button onclick="horisage();">掘り下げる</button></li>
                                        horisage()関数は現在存在しない-->
                                    <button class="button4" id="removeNodeBtn" onclick="remove_node();"><span id="removeNodeText">ノードの削除</span></button>
                                    <!--1つ前に消したノードを復元-->
                                    <!-- <button class="button4" onclick="return_node();">
                                        1つ前に戻る
                                        </button> -->
                                    <!-- 【Zoom】 -->
                                    <button class="button3" id="zoomInBtn" onclick="zoomIn();"><span id="zoomInText">拡大</span></button>
                                    <button class="button3" id="zoomOutBtn" onclick="zoomOut();"><span id="zoomOutText">縮小</span></button>
                                    <!-- <button class="button4" id="map-snapshot-button" onclick="MapSnapShot();RecordRelation();">
                                        マップver更新 
                                    </button> -->
                                    <!-- <span id="screenshotLabel">【Screenshot】</span> -->
                                    <!-- <button class="button4" id="screenshotBtn" onclick="screen_shot();"><span id="screenshotText">screenshot</span></button> -->
                                    <!-- 【Reason】
                                        <button class="button4" onclick="add_edit_reason();">
                                        修正理由の追加
                                        </button> -->
                                    <!-- 【Screenshot】
                                        <button class="button4" style="width:80px" onclick="screen_shot();">
                                        screenshot
                                        </button> -->
                                    <!-- <label><input type="checkbox" name="Difference" id="Difference" onClick="Difference();">以前のマップとの差分</label> -->
                                    
                                    <div id="comment_balloon2"class="comment two" hidden><!--hatakeyama -->
                                        <p>緑にハイライトされたノードは合理性を考えるべきノードです．<br/>このノードの考えを変えた際には，関連したノードも考え直す必要はないか考えてみましょう！</p>
                                    </div>
                                    <div id="comment_balloon3"class="comment three" hidden><!--hatakeyama-->
                                        <p>何度もバージョン更新を行っている重要なノードです．<br/>定期的に考えを確認しましょう！</p>
                                    </div>
                                    
                                    <!-- ここから清水さん１ -->
                                    <div id ="presen_menu">
                                        <!-- 【Slide】 -->
                                        <!-- <button class="button4" onclick="MakeSlide();">スライド追加</button> -->
                                        <!-- <button class="button4" onclick="MakeNewPage();">ページ追加</button> -->
                                        <!-- <button class="button4" onclick="AddImage();">画像追加</button> -->
                                        <!-- <input type="file" id="myFile" style="display: none">
                                            <button class="button4" onclick="selectImage()">画像追加</button> -->
                                        <!-- <button class="button4" type="submit" name="selectImage">画像追加</button> -->

                                        <button class="button4" onclick="NewContent_Append('問い')">問いノード追加</button>
                                        <button class="button4" onclick="NewContent_Append('答え')">答えノード追加</button>
                                        <button class="button4" onclick="add_Confirm();">マップ側へ反映</button>
                                        <button class="button4" onclick="Unreflected_node();">未反映ノード</button>
                                        <!-- <button class="button4" onclick="CheckNodeAllLogicRelation();">関係性の一覧</button> -->
                                        <button class="button4" onclick="DeleteLogicRelation();">関係性の解消</button>
                                        <!-- <button class="button4" onclick="AllItemVersionUpdate();">資料のバージョンを更新</button> -->
                                        <!-- <button class="button4" id="input_file" onclick="InputFile();">
                                            資料再現
                                            </button> -->
                                        <!-- <button class="button4" onclick="Get_SlideRank();Get_ContentRank();Get_SlideTitle();">
                                            スライド保存
                                            </button> -->
                                        <!-- 【Export】
                                            <button class="button4" onclick="OutputScenario();">
                                            test
                                            </button> -->
                                        <!-- <button class="button4" onclick="OutputFile()">
                                            test
                                            </button> -->
                                    </div>
                                </div>
                                    
                                <!-- presen_menu fin -->

                                <!--  <div id ="presen_menu"> -->
                                <!-- 【Slide】 -->
                                <!-- <button class="button4" onclick="MakeSlide();">
                                    スライド追加
                                    </button> -->
                                <!-- <button class="button4" onclick="MakeNewPage();">
                                    ページ追加
                                    </button> -->
                                <!-- <button class="button4" onclick="NewContent_Append('問い')">
                                    問いノード追加
                                    </button>
                                    <button class="button4" onclick="NewContent_Append('答え')">
                                    答えノード追加
                                    </button>
                                    <button class="button4" onclick="add_Confirm();">
                                    マップ側へ反映
                                    </button> -->
                                <!-- <button class="button4" id="input_file" onclick="InputFile();">
                                    資料再現
                                    </button> -->
                                <!-- <button class="button4" onclick="Get_SlideRank();Get_ContentRank();Get_SlideTitle();">
                                    スライド保存
                                    </button> -->
                                <!-- <button class="button4" onclick="Unreflected_node();">
                                    未反映ノード
                                    </button>
                                    <button class="button4" onclick="CheckAllLogicRelation();">
                                    関係性の一覧
                                    </button>
                                    <button class="button4" onclick="DeleteLogicRelation();">
                                    関係性の解消
                                    </button>-->
                                <!-- <button class="button4" onclick="recommend_xmlLoad();">
                                    test
                                    </button> -->
                                <!-- 【Export】
                                    <button class="button4" onclick="OutputScenario();">
                                    test
                                    </button> -->
                                    <!-- <button class="button4" onclick="OutputFile()">
                                    test
                                    </button> -->
                                <!--</div>  presen_menu fin-->
                            </div>
                            <!--jsmind_nav fin-->

                            <!-- <div class="Menu">Menu</div> -->
                            <div id="jsmind_container" oncontextmenu="return false;">
                                <div id="mindmap_conmenu">
                                    <ul>
                                        <!-- <li><a href="javascript:void(0);" onClick="SetPurpose()">スライドを作成する</a></li> -->
                                        <!-- <li><a href="javascript:void(0);" onClick="NodeAppend()">資料に追加する</a></li> -->
                                        <!--  -->
                                        
                                        <!-- <li>
                                            ノードの変更
                                        </li> 
                                        <li>
                                            <button class="button4" onclick="add_Qnode();">
                                                問いノードを追加
                                            </button>
                                        </li>
                                        <li>
                                            <button class="button4" onclick="add_Anode();">
                                                答えノードを追加
                                            </button>
                                        </li>
                                        <li>
                                            <button class="button4" onclick="remove_node();">
                                                ノードを削除
                                            </button>
                                        </li> -->
                                        <!-- <li>
                                            <button class="button4" onclick="NodeVersionUpdate(null);">
                                                ノードを更新
                                            </button>
                                        </li> -->
                                        <li>
                                            <button class="main-action-btn compact-btn" onclick="addWeeklyGoal();"><span id="addWeeklyGoalMenuLabel">小目標に追加</span></button>
                                        </li>
                                        <li>
                                            <button class="main-action-btn compact-btn" onclick="showThinkingProcessMap();"><span id="showThinkingProcessMapBtn">目標手段階層マップ</span></button>
        <!-- Duplicate language dictionary removed to avoid redeclaration of `langDict`. Using the main `langDict` defined earlier. -->
        </script>
                                        </li>
                                       
                                        <!-- <li>
                                            ノードを資料へ追加
                                        </li> 
                                        <li>
                                            <button class="button4" onclick="ItemAddDocument()">
                                                項目として追加する
                                            </button>
                                        </li>
                                        <li>
                                            <button class="button4" onclick="NodeAppendLogic()">
                                                内容として追加する 
                                            </button>
                                        </li> -->
                                        <!-- <li>
                                            <button class="button4" onclick="VersionSpread();RecordRelation()">
                                                ノードの更新をマップ全体に波及させる
                                            </button>
                                        </li>hatakeyama -->
                                       
                                    </ul>
                                </div>
                            </div>
                            <div id="document_area" oncontextmenu="return false;">
                                <div id="document_title">
                                    <div class="document_purpose">
                                        <textarea id="scenario_title" class="document_title_area" class="statement" onfocus='TextboxClick()' onblur='Edit_title(this);' placeholder="資料タイトル" style='width:90%;'></textarea>
                                    </div>
                                </div>
                            </div>
                            <!-- 20221208 shimizu　資料構成作成エリアで右クリックしたときに項目出現 -->
                            <div id="document_area_conmenu">
                                <ul>
                                    <li><a href="javascript:void(0);" onClick="LogicRelationChecker()">設定した関係を確認する</a></li>
                                </ul>
                                <!-- <ul>
                                    <li><a href="javascript:void(0);" onClick="ItemVersionUpdate()">バージョンを更新</a></li>
                                </ul> -->
                            </div>
                            
                            <div id="document_area_conmenu2" >
                                <select  id="Slides" class='cp_ipselect cp_sl05'>
                                </select><a id="SlideName">大枠</a><br>
                                <select id="Sentences" class='cp_ipselect cp_sl05'>
                                </select><a id="SelectNode">文章</a><br>
                                <input id="ImageOntologyDecide"type="button" value="決定" onclick="AddOntologyInfo();">
                                <input type="button" value="キャンセル" onclick="CancelButton_Click('document_area_conmenu2')">
                            </div>
                            
                            <div id="document_area_conmenu3" >
                                <div id="first_choice_node">
                                    <select id="first_logic_node" class='cp_ipselect cp_sl05'>
                                        <option value="主張">主張</option>
                                        <option value="論拠">論拠</option>
                                        <option value="根拠">根拠</option>
                                    </select>
                                    <select id="logic_intention1_node" class="cp_ipselect cp_sl04" >
                                    </select><a id="SelectContent1_node">スライドA</a><br>
                                </div>
                                <div id="second_choice_node">
                                    <select id="second_logic_node" class='cp_ipselect cp_sl05'>
                                    </select>
                                    <select id="logic_intention2_node" class="cp_ipselect cp_sl04">
                                    </select><a id="SelectContent2_node">スライドB</a><br>
                                </div>
                                <input id="DecideLogicRelationButton" type="button" value="決定" onclick="DecideNodeLogicRelation_Click();">
                                <input id="DecideLogicRelationButton" type="button" value="キャンセル" onclick="CancelButton_Click('document_area_conmenu3')">
                            </div>
                            
                            <div id="document_area_conmenu4" >
                                <div id="first_choice">
                                    <select id="first_logic" class='cp_ipselect cp_sl05'>
                                        <option value="主張">主張</option>
                                        <option value="論拠">論拠</option>
                                        <option value="根拠">根拠</option>
                                    </select>
                                    <select id="logic_intention1" class="cp_ipselect cp_sl04" >
                                    </select><a id="SelectContent1">A</a><br>
                                </div>
                                <div id="second_choice">
                                    <select id="second_logic" class='cp_ipselect cp_sl05'>
                                    </select>
                                    <select id="logic_intention2" class="cp_ipselect cp_sl04">
                                    </select><a id="SelectContent2">B</a><br>
                                </div>
                                <input id="DecideLogicRelationButton" type="button" value="決定" onclick="DecideSlideLogicRelation_Click();">
                                <input id="DecideLogicRelationButton" type="button" value="キャンセル" onclick="CancelButton_Click('document_area_conmenu4')">
                            </div>
                            <!--  ここから大槻修正　-->
                            <div id="network_container" oncontextmenu="return false;" >
                                <div id="utterance_area">
                                    <div id="rclick2">
                                        <div id="timedisplay"></div>
                                        <div id="rclick"></div>
                                    </div>
                                    <div id="utterance_area2">
                                    </div>
                                </div>
                                <div id="mynetwork2">
                                    <div id="buttoncluster">
                                        <input type="button" class="meeting_reflectin_network_button"
                                            id="mrnb_addNode" value="要約ノード追加" />
                                        <input type="button" class="meeting_reflectin_network_button"
                                            id="mrnb_removeNode" value="ノード削除" />
                                        <input type="button" class="meeting_reflectin_network_button"
                                            id="mrnb_startEditEdge" value="エッジ追加" />
                                        <input type="button" class="meeting_reflectin_network_button"
                                            id="mrnb_removeEdge" value="エッジ削除" />
                                        <input type="button" class="meeting_reflectin_network_button"
                                            id="mrnb_ZoomIn" value="拡大" />
                                        <input type="button" class="meeting_reflectin_network_button"
                                            id="mrnb_ZoomOut" value="縮小" />
                                    </div>
                                    <div id="network_conmenu">
                                        <ul>
                                            <li><a href="javascript:void(0);" id="net_conmenu1">概念をつける</a></li>
                                            <li><a href="javascript:void(0);" id="net_conmenu2">マインドマップと対応付ける</a></li>
                                            <li><a href="javascript:void(0);" id="net_conmenu3" style="display:none">採用/棄却をつける</a></li>
                                            <li><a href="javascript:void(0);" id="net_conmenu4">キャンセル</a></li>
                                        </ul>
                                    </div>
                                    <div id="labelselect">
                                        <select id="selectionlist" size="3">
                                            <!-- いるやつあれば追加やけど未実装（研究活動オントロジー読み込みかな？） -->
                                        </select>
                                        <input type="button" value="選択完了" id="ontology_select">
                                    </div>
                                    <div id="recruitselect">
                                        <select id="recruitselectionlist">
                                            <option value="採用">採用</option>
                                            <option value="棄却">棄却</option>
                                        </select>
                                        <input type="button" value="選択完了" id="recruit_select">
                                    </div>
                                    <div id="mynetwork"></div>
                                </div>
                            </div>
                            <!--  ここから大槻修正　-->
                            
                            <!--  ここまで大槻修正　-->

                            <!-- 思考過程表出化マップ　By川 -->
                            <div id="process_network_container" oncontextmenu="return false;" >
                                <div id="myProcessnetwork2">
                                    <!-- ボタンとシークバーを横並びに配置 -->
                                    <div class="control-panel">
                                        <div id="buttoncluster">
                                            <!-- `process_close` button removed as it's not needed -->
                                            <button type="button" class="thinkingProcess_network_button"
                                                    id="process_addNode" title="手段追加">
                                                <span class="button-icon">＋</span>
                                                <span class="button-text" id="processAddNodeText">手段追加</span>
                                            </button>
                                            <button type="button" class="thinkingProcess_network_button"
                                                    id="process_startEditEdge" title="エッジ追加">
                                                <span class="button-icon">⟷</span>
                                                <span class="button-text" id="processStartEditEdgeText">エッジ追加</span>
                                            </button>
                                            <button type="button" class="thinkingProcess_network_button"
                                                    id="process_removeNode" title="手段削除">
                                                <span class="button-icon">−</span>
                                                <span class="button-text" id="processRemoveNodeText">手段削除</span>
                                            </button>
                                            <button type="button" class="thinkingProcess_network_button"
                                                    id="process_ZoomIn" title="拡大">
                                                <span class="button-text" id="processZoomInText">拡大</span>
                                            </button>
                                            <button type="button" class="thinkingProcess_network_button"
                                                    id="process_ZoomOut" title="縮小">
                                                <span class="button-text" id="processZoomOutText">縮小</span>
                                            </button>
                                        </div>
                                        <!-- シークバーを隣に配置（横幅いっぱい使用） -->
                                        <div id="timeline_container">
                                            <input type="range" id="timeline_slider" min="0" max="0" value="0" step="1" />
                                            <span id="timeline_label">読み込み中...</span>
                                            <button id="return_to_current" style="margin-left: 10px; padding: 5px 10px; font-size: 12px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;"><span id="returnToCurrentText">現在に戻る</span></button>
                                            <span id="history_indicator" style="display: none; margin-left: 10px; color: #ff6b6b; font-weight: bold; font-size: 12px;"><span id="historyIndicatorText">📅 過去の表示</span></span>
                                        </div>
                                    </div>

                                        <div id="myProcessnetwork"></div>
                                    <div id="t_Process_conmenu" class="context-menu" role="menu" aria-label="ノード操作メニュー">
                                        <div class="context-menu-header">
                                            <span class="context-menu-title" id="processMenuTitle">ノード操作</span>
                                        </div>
                                        <ul class="context-menu-list" role="none">
                                            <li class="context-menu-item status-action" role="none">
                                                <a href="javascript:void(0);" id="object_conmenu1" class="context-menu-link" role="menuitem" 
                                                   title="ノードの作業を開始状態にします" aria-label="作業開始">
                                                    <span class="context-menu-icon" aria-hidden="true">▶️</span>
                                                    <span class="context-menu-text" id="processMenuStart">開始</span>
                                                </a>
                                            </li>
                                            <li class="context-menu-item status-action" role="none">
                                                <a href="javascript:void(0);" id="object_conmenu2" class="context-menu-link" role="menuitem"
                                                   title="ノードの作業を完了し、内省記録を入力します" aria-label="作業完了">
                                                    <span class="context-menu-icon" aria-hidden="true">✅</span>
                                                    <span class="context-menu-text" id="processMenuComplete">完了</span>
                                                </a>
                                            </li>
                                            <li class="context-menu-item status-action" role="none">
                                                <a href="javascript:void(0);" id="object_conmenu3" class="context-menu-link" role="menuitem"
                                                   title="ノードの作業を一時中断状態にします" aria-label="作業中断">
                                                    <span class="context-menu-icon" aria-hidden="true">⏸️</span>
                                                    <span class="context-menu-text" id="processMenuPause">中断</span>
                                                </a>
                                            </li>
                                            <li class="context-menu-separator" role="separator" aria-hidden="true"></li>
                                            <!-- SMART目標設定メニューを追加 -->
                                            <li class="context-menu-item annotation-action" role="none">
                                                <a href="javascript:void(0);" id="process_conmenu5" class="context-menu-link" role="menuitem"
                                                   title="このノードの理由を記述します" aria-label="理由を記述">
                                                    <span class="context-menu-icon" aria-hidden="true">📝</span>
                                                    <span class="context-menu-text" id="processMenuReason">理由を記述</span>
                                                </a>
                                            </li>
                                            <!-- <li class="context-menu-item smart-goal-action" role="none">
                                                <a href="javascript:void(0);" id="process_conmenu_smartgoal" class="context-menu-link" role="menuitem"
                                                   title="SMART目標を設定します" aria-label="SMART目標設定">
                                                    <span class="context-menu-icon" aria-hidden="true">🎯</span>
                                                    <span class="context-menu-text">SMART目標設定</span>
                                                </a>
                                            </li> -->
                                            <li class="context-menu-item annotation-action" role="none">
                                                <a href="javascript:void(0);" id="process_conmenu6" class="context-menu-link" role="menuitem"
                                                   title="このノードの完了予定日時を設定します" aria-label="完了予定設定">
                                                    <span class="context-menu-icon" aria-hidden="true">⏰</span>
                                                    <span class="context-menu-text" id="processMenuDeadline">完了予定を設定</span>
                                                </a>
                                            </li>
                                            <li class="context-menu-separator" role="separator" aria-hidden="true"></li>
                                            <li class="context-menu-item cancel-action" role="none">
                                                <a href="javascript:void(0);" id="process_conmenu4" class="context-menu-link" role="menuitem"
                                                   title="メニューを閉じます (ESCキーでも可能)" aria-label="キャンセル">
                                                    <span class="context-menu-icon" aria-hidden="true">❌</span>
                                                    <span class="context-menu-text" id="processMenuCancel">キャンセル</span>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                    <div id="feedbackTooltip" style="position:absolute; display:none; z-index:1000;"></div>
                                    <div id="labelselect">
                                        <select id="selectionlist" size="3">
                                            <!-- いるやつあれば追加やけど未実装（研究活動オントロジー読み込みかな？） -->
                                        </select>
                                        <input type="button" value="選択完了" id="p_ontology_select">
                                    </div>
                                    <div id="recruitselect">
                                        <select id="recruitselectionlist">
                                            <option value="採用">採用</option>
                                            <option value="棄却">棄却</option>
                                        </select>
                                        <input type="button" value="選択完了" id="p_recruit_select">
                                    </div>
                                    <div id="t_Process_labelselect" style="display:none; position:absolute; z-index:1000; background:white; border:1px solid #ccc; padding:10px;">
                                        <select id="t_Process_selectionlist" size="3">
                                            <!-- いるやつあれば追加やけど未実装（研究活動オントロジー読み込みかな？） -->
                                        </select>
                                        <input type="button" value="選択完了" id="t_p_ontology_select">
                                    </div>
                                    <div id="t_Process_recruitselect" style="display:none; position:absolute; z-index:1000; background:white; border:1px solid #ccc; padding:10px;">
                                        <select id="t_Process_recruitselectionlist">
                                            <option value="採用">採用</option>
                                            <option value="棄却">棄却</option>
                                        </select>
                                        <input type="button" value="選択完了" id="t_p_recruit_select">
                                    </div>
                                    <div id="t_Process_reasonselect" style="display:none; position:absolute; z-index:1000; background:white; border:3px solid #FF8C00; padding:10px; width:360px; box-sizing:border-box; border-radius:6px;">
                                        <label for="t_Process_reasontext">なぜそれを取り組もうとしたか:</label><br>
                                        <textarea id="t_Process_reasontext" rows="4" style="width:100%; box-sizing:border-box; font-family:inherit;" placeholder="理由を入力してください..."></textarea><br><br>
                                        <input type="button" value="決定" id="t_p_reason_select">
                                        <input type="button" value="キャンセル" id="t_p_reason_cancel">
                                    </div>
                                    <div id="t_Process_timeselect" style="display:none; position:absolute; z-index:1000; background:white; border:3px solid #2e8b57; padding:10px; width:300px; box-sizing:border-box; border-radius:6px;">
                                        <label for="t_Process_timetext">完了予定:</label><br>
                                        <select id="t_Process_timetext" style="width: 200px;">
                                            <option value="">選択してください</option>
                                            <option value="今日中">今日中</option>
                                            <option value="明日まで">明日まで</option>
                                            <option value="3日後">3日後</option>
                                            <option value="1週間後">1週間後</option>
                                            <option value="2週間後">2週間後</option>
                                            <option value="1ヶ月後">1ヶ月後</option>
                                            <option value="2ヶ月後">2ヶ月後</option>
                                            <option value="3ヶ月後">3ヶ月後</option>
                                            <option value="半年後">半年後</option>
                                            <option value="1年後">1年後</option>
                                            <option value="未定">未定</option>
                                        </select><br><br>
                                        <input type="button" value="決定" id="t_p_time_select">
                                        <input type="button" value="キャンセル" id="t_p_time_cancel">
                                    </div>
                                    
                                    <!-- SMART目標設定フォーム -->
                                    <div id="smart_goal_form" style="display:none; position:fixed; z-index:1000; background:white; border:2px solid #007bff; border-radius: 8px; padding: 16px; width: 480px; box-shadow: 0 6px 20px rgba(0,123,255,0.3); left: 50%; top: 50%; transform: translate(-50%, -50%);">
                                        <div id="smart_goal_header" style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 12px; margin: -16px -16px 16px -16px; border-radius: 8px 8px 0 0; font-weight: bold; text-align: center; font-size: 16px; cursor: move; user-select: none;">
                                            🎯 SMART目標設定
                                        </div>
                                        
                                        <div style="margin-bottom: 12px;">
                                            <label style="font-weight: bold; color: #007bff; display: block; margin-bottom: 4px; font-size: 13px;">
                                                📝 Specific（具体的）
                                            </label>
                                            <textarea id="smart_specific" rows="2" placeholder="何を、どのように達成するか具体的に記述してください（例：英語の論文を1日5ページずつ読み進める）" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; resize: vertical; box-sizing: border-box;"></textarea>
                                        </div>
                                        
                                        <div style="margin-bottom: 12px;">
                                            <label style="font-weight: bold; color: #28a745; display: block; margin-bottom: 4px; font-size: 13px;">
                                                📊 Measurable（測定可能）
                                            </label>
                                            <input type="text" id="smart_measurable" placeholder="例：80点以上、10個の単語、3時間、5ページなど" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                                        </div>
                                        
                                        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                                            <div style="flex: 1;">
                                                <label style="font-weight: bold; color: #17a2b8; display: block; margin-bottom: 4px; font-size: 13px;">
                                                    ✅ Achievable（達成可能性）
                                                </label>
                                                <select id="smart_achievable" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                                                    <option value="">選択してください</option>
                                                    <option value="easy">簡単（80%以上の確率）</option>
                                                    <option value="moderate">適度（60-80%の確率）</option>
                                                    <option value="challenging">挑戦的（40-60%の確率）</option>
                                                    <option value="stretch">ストレッチ（20-40%の確率）</option>
                                                </select>
                                            </div>
                                            <div style="flex: 1;">
                                                <label style="font-weight: bold; color: #6f42c1; display: block; margin-bottom: 4px; font-size: 13px;">
                                                    🎯 Relevant（関連性）
                                                </label>
                                                <input type="text" id="smart_relevant" placeholder="最終目標との関連性" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                                            </div>
                                        </div>
                                        
                                        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                                            <div style="flex: 1;">
                                                <label style="font-weight: bold; color: #fd7e14; display: block; margin-bottom: 4px; font-size: 13px;">
                                                    ⏰ Time-bound（期限）
                                                </label>
                                                <input type="datetime-local" id="smart_deadline" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                                            </div>
                                            <div style="flex: 1;">
                                                <label style="font-weight: bold; color: #fd7e14; display: block; margin-bottom: 4px; font-size: 13px;">
                                                    📈 進捗確認頻度
                                                </label>
                                                <select id="smart_check_frequency" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                                                    <option value="">選択してください</option>
                                                    <option value="daily">毎日</option>
                                                    <option value="weekly">週1回</option>
                                                    <option value="biweekly">2週間に1回</option>
                                                    <option value="monthly">月1回</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <!-- 新しく追加：振り返り機能 -->
                                        <div style="border-top: 2px solid #e9ecef; padding-top: 16px; margin-bottom: 16px;">
                                            <div style="font-weight: bold; color: #dc3545; margin-bottom: 12px; font-size: 14px;">
                                                🔍 振り返り・自己評価項目
                                            </div>
                                            
                                            <div style="margin-bottom: 12px;">
                                                <label style="font-weight: bold; color: #dc3545; display: block; margin-bottom: 4px; font-size: 12px;">
                                                    📋 成果評価基準（手段実行≠成功の認識）
                                                </label>
                                                <textarea id="smart_success_criteria" rows="2" placeholder="「計画通りにやった」だけでなく「何が達成できたか」を評価する基準を設定（例：単語帳を3周した→実際にテストで何点取れたか、何個の単語を正確に覚えたか）" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; resize: vertical; box-sizing: border-box;"></textarea>
                                            </div>
                                            
                                            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                                                <div style="flex: 1;">
                                                    <label style="font-weight: bold; color: #ffc107; display: block; margin-bottom: 4px; font-size: 12px;">
                                                        🔔 中間確認ポイント
                                                    </label>
                                                    <textarea id="smart_monitoring_points" rows="2" placeholder="実行中に確認すべき点（例：集中が続かない、理解が進まない、予想より難しい等の違和感に気づく）" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; resize: vertical; box-sizing: border-box;"></textarea>
                                                </div>
                                                <div style="flex: 1;">
                                                    <label style="font-weight: bold; color: #17a2b8; display: block; margin-bottom: 4px; font-size: 12px;">
                                                        🔄 調整基準
                                                    </label>
                                                    <textarea id="smart_adjustment_criteria" rows="2" placeholder="どうなったら計画を変更するか（例：3日続けても理解度が向上しない、予定時間の2倍かかる等）" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; resize: vertical; box-sizing: border-box;"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style="display: flex; justify-content: space-between; gap: 12px;">
                                            <button id="smart_goal_save" style="flex: 1; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background-color 0.2s;">
                                                💾 SMART目標を設定
                                            </button>
                                            <button id="smart_goal_cancel" style="flex: 1; padding: 10px; background-color: #6c757d; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background-color 0.2s;">
                                                ❌ キャンセル
                                            </button>
                                        </div>
                                    </div>
                                    <div id="t_Process_reflectionselect" style="display:none; position:absolute; z-index:1000; background:white; border:1px solid #ccc; padding:10px; width:400px;">
                                        <h4>内省を記述する</h4>
                                        <label for="t_Process_actionReason">行動意図：なぜこの手段を実行しましたか？</label><br>
                                        <textarea id="t_Process_actionReason" rows="3" cols="50" placeholder="例：実験対象者を選定するための参考基準を得るため．"></textarea><br><br>
                                        
                                        <label for="t_Process_completionReason">完了基準：なぜ完了と判断しましたか？</label><br>
                                        <textarea id="t_Process_completionReason" rows="3" cols="50" placeholder="例：必要な研究事例（5つ）を確認し，比較表を作成できたから．"></textarea><br><br>
                                        
                                        <label for="t_Process_challengesLearnings">経験の活用：困難や学びはありますか？</label><br>
                                        <textarea id="t_Process_challengesLearnings" rows="4" cols="50" placeholder="例：他の研究事例を調べる過程で混乱が生じた．関連論文を追加調査し共通点を抽出した．"></textarea><br><br>
                                        
                                        <input type="button" value="決定" id="t_p_reflection_select">
                                        <input type="button" value="キャンセル" id="t_p_reflection_cancel">
                                    </div>
                                    
                                    <!-- 振り返りリマインダーモーダル -->
                                    <div id="reflection_reminder_modal" style="display:none; position:fixed; z-index:1001; background:white; border:2px solid #dc3545; border-radius: 8px; padding: 16px; width: 500px; box-shadow: 0 6px 20px rgba(220,53,69,0.3); left: 50%; top: 50%; transform: translate(-50%, -50%);">
                                        <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 12px; margin: -16px -16px 16px -16px; border-radius: 8px 8px 0 0; font-weight: bold; text-align: center; font-size: 16px;">
                                            🔍 振り返りリマインダー
                                        </div>
                                        
                                        <div id="reflection_content" style="margin-bottom: 16px; font-size: 13px; line-height: 1.5;">
                                            <!-- 動的にコンテンツが入る -->
                                        </div>
                                        
                                        <div style="display: flex; justify-content: center; gap: 12px;">
                                            <button onclick="closeReflectionReminder()" style="flex: 1; padding: 10px; background-color: #6c757d; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 13px;">
                                                閉じる
                                            </button>
                                        </div>
                                    </div>

                                    <!-- 個別目標の振り返りモーダル -->
                                    <div id="goal_reflection_modal" style="display:none; position:fixed; z-index:1001; background:white; border:2px solid #ffc107; border-radius: 8px; padding: 16px; width: 520px; box-shadow: 0 6px 20px rgba(255,193,7,0.3); left: 50%; top: 50%; transform: translate(-50%, -50%);">
                                        <div style="background: linear-gradient(135deg, #ffc107, #e0a800); color: #212529; padding: 12px; margin: -16px -16px 16px -16px; border-radius: 8px 8px 0 0; font-weight: bold; text-align: center; font-size: 16px;">
                                            📊 目標振り返り
                                        </div>
                                        
                                        <div id="goal_reflection_title" style="font-weight: bold; margin-bottom: 12px; color: #495057;">
                                            <!-- 目標タイトルが入る -->
                                        </div>
                                        
                                        <div style="margin-bottom: 12px;">
                                            <label style="font-weight: bold; color: #dc3545; display: block; margin-bottom: 4px; font-size: 12px;">
                                                📋 実際の成果（数値・具体的結果）
                                            </label>
                                            <textarea id="reflection_actual_result" rows="2" placeholder="計画通りにやっただけでなく、実際に何が達成できたかを記録してください" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; resize: vertical; box-sizing: border-box;"></textarea>
                                        </div>
                                        
                                        <div style="margin-bottom: 12px;">
                                            <label style="font-weight: bold; color: #ffc107; display: block; margin-bottom: 4px; font-size: 12px;">
                                                🤔 気づいた違和感・課題
                                            </label>
                                            <textarea id="reflection_issues" rows="2" placeholder="実行中に感じた違和感、予想と異なった点、うまくいかなかった点など" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; resize: vertical; box-sizing: border-box;"></textarea>
                                        </div>
                                        
                                        <div style="margin-bottom: 12px;">
                                            <label style="font-weight: bold; color: #17a2b8; display: block; margin-bottom: 4px; font-size: 12px;">
                                                💡 次回への改善点
                                            </label>
                                            <textarea id="reflection_improvements" rows="2" placeholder="今回の経験から、次回はどのように改善しますか？" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; resize: vertical; box-sizing: border-box;"></textarea>
                                        </div>
                                        
                                        <div style="margin-bottom: 16px;">
                                            <label style="font-weight: bold; color: #6f42c1; display: block; margin-bottom: 4px; font-size: 12px;">
                                                ⭐ 目標達成度（自己評価）
                                            </label>
                                            <select id="reflection_achievement_level" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                                                <option value="">選択してください</option>
                                                <option value="excellent">優秀（予想以上の成果）</option>
                                                <option value="good">良好（期待通りの成果）</option>
                                                <option value="partial">部分的（一部達成）</option>
                                                <option value="insufficient">不十分（見直しが必要）</option>
                                                <option value="failed">失敗（根本的な変更が必要）</option>
                                            </select>
                                        </div>
                                        
                                        <div style="display: flex; justify-content: space-between; gap: 12px;">
                                            <button onclick="saveGoalReflection()" style="flex: 1; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 13px;">
                                                💾 振り返りを保存
                                            </button>
                                            <button onclick="closeGoalReflection()" style="flex: 1; padding: 10px; background-color: #6c757d; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 13px;">
                                                キャンセル
                                            </button>
                                        </div>
                                    </div>
                                    <!-- <div id="myProcessnetwork"></div> -->
                                </div>
                                <div id="trigger_area">
                                    <div id="trigger_area_display">
                                        <div id="conceptdisplay"></div>
                                        <div id="trigger_click"></div>
                                        <div id="trigger_area_add">
                                            <input type="button" id="inputTriggerbutton" value=" ＋ 活動を入力" onclick="inputTriggerAreaOpen()"/>
                                            <div id="trigger_add">
                                            </div>
                                        </div>
                                    </div>
                                    <div id="trigger_area_list">
                                    </div>
                                </div>
                            </div>
                            <!-- 思考過程表出化マップ　fin -->

                        </div>
                        <!--are fin-->
                    </div>
                    <!--system fin-->
                </div>
                <!--layout fin-->
            

            <!-- 　　　tab02メニュー　　　　　-->
            <!--  過去のマインドマップを表示する　-->
            <!-- <div id="tab02">
                 <div id="layout">
                 <div id="jsmind_nav2">
                 <div class ="mt_timing">
                 <select name="mttime_list" id="mttime_list"> -->
            <!-- ログイン中のユーザのMT時間を取得する -->
            <!--  -->
            <!-- </select>
                 <input type="button" class="ShowCurrentMapButton" onClick="ShowCurrentMap();" value="現在のマップを表示">
                 <input type="button" class="HideCurrentMapButton" onClick="HideCurrentMap();" value="現在のマップを隠す">
                 </div>
                 </div> -->
            <!-- 過去のマインドマップを表示する部分 -->
            <!-- <div id="jsmind_container_mrn2"> -->
            <!-- <div>過去のオントロジー</div> -->
            <!-- </div> -->
            <!-- 現在のマインドマップのコピー
                 <div id="jsmind_container_mrn3"></div>
                 </div>
                 </div> -->

                 <!--サイドメニュー　start-->
                <div id="side_menu">
                    
                    <!-- マインドマップ編集のサイドメニュー -->
                    
                    <div id="mind">
                        
                        <!--チェックメニュー　Start  -->
                        

                        <div class="toi_list" style="text-align: center;">
    <!-- <div id="mind_all">
        <input class="button5" type="button" onclick="showGeneration();" value="問い一覧">
         <b>マインドマップモード</b> -->
    <!-- </div> --> 
                            <!-- <div id="presen_all" hidden>
                                <input class="button5" type="button" onclick="P_showGeneration();" value="問い一覧">
                                <b>資料作成モード</b>
                            </div> -->
                        </div>

                        <div id="mind" class="side">
                            <div class="inquiry_area">
<button id="showQuestionsBtn" style="display: block; width: 100%; background: #007bff; color: white; border: none; border-radius: 4px; padding: 6px 0; margin-bottom: 8px; font-size: 13px; font-weight: bold; cursor: pointer;" onclick="showGeneration();"><span id="showQuestionsBtnText">問い一覧</span></button>
<!-- <div id="questionsList" style="display:none; background:#f8f9fa; border:1px solid #dee2e6; border-radius:4px; padding:8px; margin-bottom:8px; max-height:120px; overflow-y:auto;"></div> -->
<div style="background-color: #69a7ff; color: white; padding: 3px 6px; text-align: center; font-weight: bold; margin-bottom: 7px; border-radius: 4px; font-size: 12px;"><span id="inquiryAreaTitle">【情報の表出化】</span></div>
<div id="testxml"></div>
<div id="ont"></div>
<div style="background-color: #69a7ff; color: white; padding: 3px 6px; text-align: center; font-weight: bold; margin-bottom: 7px; margin-top: 10px; border-radius: 4px; font-size: 12px;"><span id="reasonPurposeTitle">【理由・目的】</span></div>
<div id="intention"></div>
<div style="background-color: #69a7ff; color: white; padding: 3px 6px; text-align: center; font-weight: bold; margin-bottom: 7px; margin-top: 10px; border-radius: 4px; font-size: 12px;"><span id="rationalityTitle">【合理性】</span></div>
<div id="rationality"></div>
                            </div>

                        <!--ここから大槻修正-->
                        <div id = "feedback_area" style="display: none; width: 100%; overflow: auto; box-sizing: border-box;">
                            
                            <!-- メモ機能エリア削除済み -->
                            
                            
                            
                            <!-- <div id = "ontology_feedback"></div> -->
                            <!-- <div id = "accordion_discussion"></div>
                            <input id = "feedbackrecord" type="button" value="記録"> -->
                            <!-- 目標管理エリア（小・中・大目標） -->
    <div id="simple_goals_area" style="background: none; border: none; border-radius: 0; padding: 0; margin: 0;">
                                
                                <!-- 小目標（大きく・使いやすく） -->
                                <div id="weekly_goal_area" style="background: #fff; border: 2px solid #28a745; border-radius: 8px; padding: 18px 18px 12px 18px; margin-bottom: 18px; box-shadow: 0 2px 8px rgba(40,167,69,0.08);">
                                    <div class="goal-title-tooltip" style="font-weight: bold; color: #28a745; font-size: 14px; margin-bottom: 7px; position: relative; display: inline-block; cursor: pointer;">📅 <span id="weeklyGoalTitle">SRL Journal</span>
                                    <form id="weeklyGoalForm" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px;">
                                        <div style="display: flex; flex-direction: column; gap: 8px;">
                                            <label for="weeklyGoalStart" style="font-size: 15px; color: #28a745;"><span id="weeklyGoalStartLabel">開始日</span></label>
                                            <input type="date" id="weeklyGoalStart" style="font-size: 15px; padding: 8px; border-radius: 6px; border: 1.5px solid #28a745;">
                                            <label for="weeklyGoalEnd" style="font-size: 15px; color: #28a745;"><span id="weeklyGoalEndLabel">終了日</span></label>
                                            <input type="date" id="weeklyGoalEnd" style="font-size: 15px; padding: 8px; border-radius: 6px; border: 1.5px solid #28a745;">
                                        </div>
                                        <button type="button" id="addWeeklyGoalBtn" style="background:#28a745;color:white;border:none;border-radius:6px;padding:12px 0;font-size:16px;font-weight:bold;cursor:pointer;"><span id="addWeeklyGoalBtnText">追加</span></button>
                                    </form>
                                    <div id="weeklyGoalsList" style="margin-top:8px;"></div>
                                </div>
                                <!-- 中・大目標（横並び・控えめ） -->
                                <!-- <div id="midlong_goal_area" style="display: flex; gap: 18px; justify-content: flex-start;">
                                    <div style="flex:1; background: #f4f4f4; border: 1.5px solid #6f42c1; border-radius: 7px; padding: 12px; min-width: 220px;">
                                        <div style="font-weight: bold; color: #6f42c1; font-size: 14px; margin-bottom: 7px;">📅 <span id="mediumGoalTitle">中目標（半年〜1年目標）</span></div>
                                        <form id="mediumGoalForm" style="display: flex; flex-direction: column; gap: 7px; margin-bottom: 7px;">
                                            <input type="text" id="mediumGoalText" placeholder="中目標を入力" style="font-size: 13px; padding: 7px; border-radius: 5px; border: 1px solid #6f42c1;">
                                            <button type="button" id="addMediumGoalBtn" style="background:#6f42c1;color:white;border:none;border-radius:5px;padding:7px 0;font-size:13px;font-weight:bold;cursor:pointer;"><span id="addMediumGoalBtnText">追加</span></button>
                                        </form>
                                        <div id="mediumGoalsList"></div>
                                    </div>
                                    <!-- <div style="flex:1; background: #f4f4f4; border: 1.5px solid #1976d2; border-radius: 7px; padding: 12px; min-width: 220px;">
                                        <div style="font-weight: bold; color: #1976d2; font-size: 14px; margin-bottom: 7px;">🎓 大目標（卒業までの目標）</div>
                                        <form id="largeGoalForm" style="display: flex; flex-direction: column; gap: 7px; margin-bottom: 7px;">
                                            <input type="text" id="largeGoalText" placeholder="大目標を入力" style="font-size: 13px; padding: 7px; border-radius: 5px; border: 1px solid #1976d2;">
                                            <button type="button" id="addLargeGoalBtn" style="background:#1976d2;color:white;border:none;border-radius:5px;padding:7px 0;font-size:13px;font-weight:bold;cursor:pointer;">追加</button>
                                        </form>
                                        <div id="largeGoalsList"></div>
                                    </div> -->
                                </div> 
                            </div>
                        </div>
                        <div id="xml_upload_area" style="display: none">
                            <!-- <form id="uploadForm" enctype="multipart/form-data"> -->
                                <!-- <div style="font-size: 15px;">XMLファイルを選んでください</div>
                                <input type="file" name="xmlFile" id="meetingUtteranceXmlFileUploader" accept=".xml"> -->
                            <!-- </form> -->
                            <!-- <button id="discussion_log_xml_file_upload_button">アップロード</button>
                            <div id="uploaded_meeting_utterance_xml_concent_display_area" style="display: none"></div> -->
                        </div>
                        <!--ここまで大槻修正-->
                        <!-- <div class="correct_reason">修正理由</div>
                            <div id="reason" align="center"></div>
                            <div class="toi_menu">問い一覧</div> -->

                        <!--  hatakeyama  -->
                        <!-- <div class="version_reason">
                            <div class="correct_reason">バージョン更新理由</div>
                            <div id="comment_balloon"class="comment balloon-under" hidden>
                                <p>バージョンを更新した理由が<br/>あれば記述しましょう！</p>
                            </div>
                            <div id="reason" style="text-align:'center'"></div>
                        </div>
                        <div class="correct_reason">ノードバージョン履歴</div>
                        <div id="node_version_log" class="node_version_log"></div> -->
                        <!--  hatakeyama  -->
                            <div id="ImageAddContent">
                                <!-- <form id="ImageForm" method="POST" enctype="multipart/form-data"> -->
                                <div class="deco-file">
                                    <label>
                                        画像追加
                                        <input id="myFile" type="file" name="ImageFile" onchange="handleFileSelect()" accept="image/*" required>
                                    </label>
                                    <p id="FilenameDisplay" class="file-names"></p>
                                </div>
                                <!-- <button id="ImageSaveButton" type="submit" class="btn btn-primary" name="myFileImage">画像保存</button> -->
                                <button id="ImageSaveButton" name="myFileImage" hidden>画像保存</button>
                                <!-- </form> -->
                            </div>
                            <div id='node_slide'>
                                <!-- <input id="finish_btn" class="presen-btn" type="button" value="資料作成終了" onclick="macrolevel_xmlLoad();"> -->
                                <input id="output_file" class="presen-btn" type="button" value="資料構成出力" onclick="OutputFile();">
                                <button id="input_btn" class="presen-btn">資料構成復元</button>
                                <input id="input_file" type="file" onclick="InputFile()" >
                            </div>
                            <div id='document_slide'>
                                <input id="finish_btn" class="presen-btn" type="button" value="資料作成終了" onclick="OutputFileS();">
                            </div>
                            <!-- <input type="file" id="myFile" style="display: none">
                                <button class="button4" onclick="selectImage()">画像追加</button> -->
                            <!-- <div>
                                <form method="post" enctype="multipart/form-data">
                                <input type="file" name="image" required>
                                <button type="submit" name="myFile">保存</button>
                                </form>
                                </div> -->
                        </div>
                        
                    </div> <!-- mind fin -->

                    
                </div>
                <!--サイドメニュー　finish-->
            </div>
            <!--tab01 fin-->

            <!--  tab04メニュー　　hatakeyama　　-->
            <div id="tab04">
                <div id="layout">
                    <div id="jsmind_nav2">
                        <div class ="mt_timing">
                            <!-- 時刻入力で過去のマップ表示 -->
                            <!-- ここから大槻修正 -->
                            <div id="timeselect">
                                <select id="selectiontime">
                                </select>
                                <input id="past_time_select_button" type="button" value="選択完了">
                            </div>
                            
                            <!-- <form id ="reco_peri" class="ref_peri" method="post" acion="">
                                <input id="od" name="start_date" type="datetime-local"/>
                                <span><input id="pastmap_btn" type="button" onclick="GetPastMap($('#reco_period').val());" value="過去のマップを表示" /></span>
                                <input type="button" class="ShowCurrentMapButton" onClick="ShowCurrentMap();" value="現在のマップを表示">
                                <input type="button" class="HideCurrentMapButton" onClick="HideCurrentMap();" value="現在のマップを隠す">
                            </form> -->
                            <!-- ここまで大槻修正 -->
                        </div>
                    </div>
                    <!-- ここから大槻修正 -->
                    <div id="jsmind_container_mrn4">
                        <!-- ここまで大槻修正 -->
                        <!-- 過去のマインドマップを表示する部分 -->
                        <div id="jsmind_container_mrn2"></div>
                        <!--<div>過去のオントロジー</div>-->
                        <!-- </div> -->
                        <!-- 現在のマインドマップのコピー -->
                        <div id="jsmind_container_mrn3"></div>
                        <!-- ここから大槻修正 -->
                    </div>
                    <div id="mynetwork_show"></div>
                    <!-- ここまで大槻修正 -->
                </div>
            </div>

            <!-- リフレクション　yoshioka -->
            <div id="tab03">
                <div id="layout">
                    <div id="reflection_container">
                        <form id ="ref_peri" class="ref_peri" method = "post" acion="">
                            <p>リフクション期間を設定してください</p>
                            <label><input id="ref_c2" type="radio" name="ref_per" value="today" onclick="riflection_period2();" checked/>本日分のリフレクション</label>
                            <br>
                            <br>
                            <label><input id="ref_c" type="radio" name="ref_per" value="select" onclick="riflection_period();"/>リフレクション期間を指定する</label>
                            <br>
                            <input id="reflection_period" name="start_date" type="date" disabled="disabled"/>から<input id="reflection_period2" name="finish_date" type="date" disabled="disabled"/>
                            <br>
                            <br>
                            <span><input id="reflection_btn" type="button" onclick="activity_reflection();" value="リフレクション開始" /></span>
                        </form>
                        <form id ="reflection_form" class="ref_form" method = "post" action = "php/record_reflection.php" ></form>
                    </div>
                </div>
            </div>
            <!--リフレクション終了 yoshioka -->

            <!-- 履歴　yoshioka -->
            <div id="record_tab">
                <div id="layout">
                    <div id="record_container">
                        <form id ="reco_peri" class="ref_peri" method = "post" acion="">
                            <p>確認したいリフレクション履歴期間を設定してください</p>
                            <label><input id="reco_c2" type="radio" name="reco_per" value="today" onclick="record_period2();" checked/>本日分のリフレクション</label>
                            <br>
                            <br>
                            <label><input id="reco_c" type="radio" name="reco_per" value="select" onclick="record_period();"/>リフレクション期間を指定する</label>
                            <br>
                            <input id="reco_period" name="start_date" type="date" disabled="disabled"/>から<input id="reco_period2" name="finish_date" type="date" disabled="disabled"/>
                            <br>
                            <br>
                            <!-- ↓idがバッティングしていたため，とりあえずコメントアウトしている． -->
                            <!-- <span><input id="reflection_btn" type="button" onclick="get_recordAAAA();" value="リフレクション履歴表示" /></span> -->
                        </form>
                        <div id ="record_table"></div>
                    </div>
                </div>
            </div>
            <!--履歴 yoshioka -->

        </div>    
        

        <!-- メインメニュー　Finish -->

        <div id="macro_feedback_area">
            <!-- <h3>【聴衆モデルによる助言】</h3>
                 <p>「学術的な意義が述べられているか」を主題の一つとして選択していますが，「どのような新規性がありますか？」の問いには，答える必要はありませんか？</p>
                 <textarea placeholder='回答' style='width:300px; height:100px;'></textarea>
                 </br></br></br>
                 <p>今回の発表では分野外の聴衆から理解を得る必要があります．「学術的な意義が述べられているか」を主題に設定する必要はありませんか？</p>
                 <input type="button" value="必要ある"><input type="button" value="必要ない">
                 <br>
                 <p>「どのような新規性がありますか？」の問いには，答える必要はありませんか？</p>
                 <textarea placeholder='回答' style='width:300px; height:100px;'></textarea>
                 <br><br></br>
                 <button>終了</button>
                 <p>　</p> -->

        </div>


        <script type="text/javascript" src="js/second_advice.js"></script>
        <script type="text/javascript" src="js/mindmap.js"></script>
        <script type="text/javascript" src="js/add_node.js"></script>
        <!-- <script type="text/javascript" src="js/smart-goals.js"></script> -->
        <script type="text/javascript" src="../js/node_tag.js"></script>
        <script type="text/javascript" src="../js/ont_choose_thinking.js"></script>
        <!-- <script type="text/javascript" src="../js/thinking-process-network.js"></script> -->
        <script type="text/javascript" src="js/past_sheet.js"></script>
        <script type="text/javascript" src="js/record_presentation.js"></script>
        <script type="text/javascript" src="js/presentation.js"></script>
        <script type="text/javascript" src="js/micro.js"></script>
        <script type="text/javascript" src="js/macro.js"></script>
        <script type="text/javascript" src="js/macrolevel_advice.js"></script>
        <script type="text/javascript" src="js/rationality.js"></script>
        <script type="text/javascript" src="plugins/Sortable-master/Sortable.js"></script>
        <script type="text/javascript" src="plugins/Sortable-master/Sortable.min.js"></script>
        <script type="text/javascript" src="plugins/Modaal-master/dist/js/modaal.js"></script>
        <script type="text/javascript" src="plugins/Modaal-master/dist/js/modaal.min.js"></script>
        <!-- <script src="plugins/Modaal-master/dist/css/modaal.css"></script> -->
        <script type="text/javascript" src="js/ont_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_inquiry_verp.js"></script>
        <script type="text/javascript" src="js/ont_choose_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_choose_input_output.js"></script>
        <script type="text/javascript" src="js/ont_rationality.js"></script>
        <script type="text/javascript" src="js/ont_scenario_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_audience_model.js"></script>
        <script type="text/javascript" src="js/upload.js"></script>     
        <!-- 2022.shimizu -->
        <script type="text/javascript" src="js/html2canvas.min.js"></script>
        <script type="text/javascript" src="js/add_OntologyArea.js"></script>
        <!--  ここから大槻修正　--> 
        <!-- <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.css" rel="stylesheet" type="text/css" /> -->
        <script type="text/javascript" src="./js/network.js"></script>  
        <script type="text/javascript" src="./js/readxmldata.js"></script>  
        
        <!--  ここまで大槻修正　-->
        
        <!-- メモ機能のJavaScript -->
        <script type="text/javascript">
        // メモモーダル用のロジック
        function openMemoModal() {
            document.getElementById('memo_modal').style.display = 'block';
            document.getElementById('memo_textarea').value = localStorage.getItem('user_memo') || '';
        }
        function closeMemoModal() {
            document.getElementById('memo_modal').style.display = 'none';
        }
        function saveMemo() {
            var memo = document.getElementById('memo_textarea').value;
            localStorage.setItem('user_memo', memo);
            closeMemoModal();
        }
        </script>
        <script type="text/javascript">

</script>
    </body>
</html>
