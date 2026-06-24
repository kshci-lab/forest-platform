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
        <link rel="stylesheet" type="text/css" href="../css/font.css">
        <link rel="stylesheet" type="text/css" href="../css/jquery.cleditor.css">
        <link rel="stylesheet" type="text/css" href="../css/ui.css">
        <link rel="stylesheet" type="text/css" href="../css/style.css">
	        <link rel="stylesheet" type="text/css" href="../css/thinking-process-network.css" />
	        <link rel="stylesheet" type="text/css" href="../css/organizational-map.css" />

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
	        <script type="text/javascript" src="js/meeting-reflection-network.js"></script>
	        <link rel="stylesheet" type="text/css" href="css/meeting-reflection-network.css" />
        <script type="text/javascript">
        window.onbeforeunload = function(e) {e.returnValue = "ページを離れようとしています。よろしいですか？";}
        </script>

        <!-- <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
             <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous"> -->

    </head>
    <body id="all">
        
        <!---        タイトルメニューStart                 -->
        <div id="main_title">
            <form name="return" method="POST">
                <span class="title_name">Forest</span>
                <span><input id="logout-button" class="button2" type="submit" name="logout" value="ログアウト"></span>
                <span><input id="sheet-select-button" class="button1" type="submit" name="sheetbtn" value="シート選択画面に戻る"></span>
                <span>
                    <div id="language-toggle-container" style="position:relative;top:18px;right:20px;float:right;z-index:20;">
                        <label style="display:flex;align-items:center;gap:8px;font-size:15px;">
                            <span id="lang-label-ja">JA</span>
                            <label class="switch">
                                <input type="checkbox" id="language-toggle" />
                                <span class="slider round"></span>
                        </label>
                        <span id="lang-label-en">EN</span>
                        </label>
                    </div>
                    <style>
                        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
                        .switch input { opacity: 0; width: 0; height: 0; }
                        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
                        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: #fff; transition: .4s; border-radius: 50%; }
                        input:checked + .slider { background-color: #2196F3; }
                        input:checked + .slider:before { transform: translateX(20px); }
                    </style>
                    <div id="language-switching-message" style="display:none;position:fixed;top:50px;right:30px;background:#fff3cd;color:#856404;padding:8px 18px;border-radius:7px;box-shadow:0 2px 8px #ccc;z-index:9999;font-size:16px;">Switching language...</div>
                </span>
            </form>
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

        <!--      タブメニュー Start        -->
        <ul div class="tabnav">
            <li class="active"><a href="#tab01">思考整理支援システム</a></li>
            <!-- <li><a href="#tab02">過去のマインドマップ</a></li>
                 <li class="active"><a href="#tab03" >リフレクション</a></li>
                 <li class="active"><a href="#record_tab" >履歴</a></li> -->
            <!-- <li class="active"><a href="#tab04">過去のマインドマップ</a></li>  hatakeyama -->
            <li class="active"><a href="#tab05">組織知マップ</a></li> 

            <div class="checkbox_mode">
                <!-- <input type="checkbox" id="checkbox" class="checkbox" name="check" onclick="CheckClick()"> -->
                <!-- <input type="checkbox" id="checkbox" class="checkbox" name="check" onclick=""> -->
                <!-- onclick="CheckClick()" -->
                <!-- <label for="checkbox" data-on-label="" data-off-label=""></label> -->
                <!-- <span class="checkbox_text">【資料作成】</span> -->
                <form name="target_mode" action="">
                    <select class="cp_ipselect2 cp_sl02"name="Select1">
                        <option>自己内対話モード</option>
                        <option>資料構成作成モード</option>
                        <option>資料作成モード</option>
                        <option>議論内省マップモード</option>
                    </select>
                    <input type="button" class="button3" value="実行" onclick="ModeChangeButtonClick();" />
                </form>
                            
            </div>

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
                                    <button class="button4" onclick="add_Qnode();">
                                        問いノード追加
                                    </button>
                                    <button class="button4" onclick="add_Anode();">
                                        答えノード追加
                                    </button>
                                    <button class="button4" onclick="add_Label('primary_label');">
                                        ラベル追加
                                    </button>
                                    <!-- <li><button onclick="horisage();">掘り下げる</button></li>
                                        horisage()関数は現在存在しない-->
                                    <button class="button4" onclick="remove_node();">
                                        ノードの削除
                                    </button>
                                    <!--1つ前に消したノードを復元-->
                                    <!-- <button class="button4" onclick="return_node();">
                                        1つ前に戻る
                                        </button> -->
                                    <!-- 【Zoom】 -->
                                    <button class="button3" id="zoom-in-button" onclick="zoomIn();">
                                        拡大
                                    </button>
                                    <button class="button3" id="zoom-out-button" onclick="zoomOut();">
                                        縮小
                                    </button>
                                    <button class="button4" id="map-snapshot-button" onclick="MapSnapShot();">
                                        マップver更新
                                    </button>
                                    
                                    【Screenshot】
                                    <button class="button4" style="width:80px" onclick="screen_shot();">
                                        screenshot
                                    </button>
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
                                        
                                        <li>
                                            ノードの変更
                                        </li> 
                                        <li>
                                            <button class="button_conmenu" onclick="add_Qnode();">
                                                問いノードを追加
                                            </button>
                                        </li>
                                        <li>
                                            <button class="button_conmenu" onclick="add_Anode();">
                                                答えノードを追加
                                            </button>
                                        </li>
                                        <li>
                                            <button class="button_conmenu" onclick="remove_node();">
                                                ノードを削除
                                            </button>
                                        </li>
                                        <li>
                                            <button class="button_conmenu" onclick="NodeVersionUpdate(null);">
                                                ノードverを更新
                                            </button>
                                        </li>
                                        <li>
                                            <button class="button_conmenu" onclick="showThinkingProcessMap();">
                                                思考過程表出化マップ
                                            </button>
                                        </li>
                                        <li>
                                            ノードを資料へ追加
                                        </li> 
                                        <li>
                                            <button class="button_conmenu" onclick="ItemAddDocument()">
                                                項目として追加する
                                            </button>
                                        </li>
                                        <li>
                                            <button class="button_conmenu" onclick="NodeAppendLogic()">
                                                内容として追加する 
                                            </button>
                                        </li>
                                        <!-- <li>
                                            <button class="button_conmenu" onclick="VersionSpread();RecordRelation()">
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
                                <ul>
                                    <li><a href="javascript:void(0);" onClick="ItemVersionUpdate()">バージョンを更新</a></li>
                                </ul>
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
                                    <div id="buttoncluster">
                                        <input type="button" class="area_close" onclick="closeThinkingProcessMap()"
                                                id="area_close" value="×" />
                                        <input type="button" class="thinkingProcess_network_button"
                                                id="process_addNode" value="思考ノード追加" />
                                        <input type="button" class="thinkingProcess_network_button"
                                                id="process_removeNode" value="ノード削除" />
                                        <input type="button" class="thinkingProcess_network_button"
                                                id="process_startEditEdge" value="エッジ追加" />
                                        <input type="button" class="thinkingProcess_network_button"
                                                id="process_removeEdge" value="エッジ削除" />
                                        <input type="button" class="thinkingProcess_network_button"
                                                id="process_ZoomIn" value="拡大" />
                                        <input type="button" class="thinkingProcess_network_button"
                                                id="process_ZoomOut" value="縮小" />
                                        <!-- <div class="checkbox_process">
                                            <input type="checkbox" id="checkbox_process" class="checkbox_process" name="check_process" onclick="ShowRelatedProcess('brother')">
                                            <label for="checkbox_process" data-on-label="On" data-off-label="Off"></label>
                                            <span class="checkbox_process_text">【兄弟ノード表示】<br></span>
                                        </div> -->
                                        <!-- <div class="checkbox_process">
                                            <input type="checkbox" id="checkbox_process" class="checkbox_process" name="check_process" onclick="ShowRelatedProcess('consistency')">
                                            <label for="checkbox_process" data-on-label="On" data-off-label="Off"></label>
                                            <span class="checkbox_process_text">【整合性ノード表示】<br></span>
                                        </div> -->
                                    </div>
                                    <div id="t_Process_conmenu">
                                        <ul>
                                            <li><a href="javascript:void(0);" id="process_conmenu1">学びを入力</a></li>                                            </li>
                                            <li><a href="javascript:void(0);" id="process_conmenu4">キャンセル</a></li>
                                        </ul>
                                    </div>
                                    <div id="t_Process_labelselect">
                                        <select id="t_Process_selectionlist" size="3">
                                            <!-- いるやつあれば追加やけど未実装（研究活動オントロジー読み込みかな？） -->
                                        </select>
                                        <input type="button" value="選択完了" id="p_ontology_select">
                                    </div>
                                    <div id="t_Process_recruitselect">
                                        <select id="t_Process_recruitselectionlist">
                                            <option value="採用">採用</option>
                                            <option value="棄却">棄却</option>
                                        </select>
                                        <input type="button" value="選択完了" id="p_recruit_select">
                                    </div>
                                    <div id="myProcessnetwork"></div>
                                </div>
                                <div id="lesson_area">
                                    <div id="conceptdisplay"></div>

                                    <!-- trigger関連の表示 -->
                                    <div id="trigger_display">
                                        <div id="trigger_click"></div>
                                        <div id="area_trigger_add">
                                            <input type="button" id="inputTriggerbutton" value=" ＋ 活動を入力" onclick="inputTriggerAreaOpen()"/>
                                            <div id="trigger_add">
                                            </div>
                                        </div>
                                        <div id="trigger_candidate_list"></div>
                                    </div>

                                    <!-- 組織へ共有する学び関連の表示 -->
                                    <div id="lesson_display">
                                        <input type="button" class="area_close" value="×" onclick="showTriggerDisplay()" />
                                        <input type="button" class="lessonbutton" id="lesson_action_button" value="組織へ共有" onclick="selectShareOrganization()"/>
                                        <div id="area_lesson_add"></div>
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
                    
                    <div class="Menu">Menu</div>


                    <!-- プレゼンモードのサイドメニュー -->
                    <div id="document">
                        <div id="advice_frame" class="searchFrame">
                            <!-- 事前設定 -->
                            <!-- <div id='pre_set' style="margin-top: 120px;">
                                <center><input type="button" value="事前設定" onclick="ShowModel()" style="width:100px; height:50px; background-color:#FFDBE1;"></center>
                                </div> -->
                            <!-- 発表の場の選択 -->
                            <!-- <div id='set_audience'>
                                <h2>発表の場の選択</h2>
                                <form name="form1">
                                <input type="radio" class="aradio" value="1" opt="卒業論文発表" checked>卒業論文発表<br>
                                <input type="radio" class="aradio" value="2" opt="修士論文発表">修士論文発表<br> -->
                            <!-- <input type="radio" class="aradio" value="1" opt="夏季成果報告会（学士/未システム）" checked>夏季成果報告会（学士/未システム）<br>
                                <input type="radio" class="aradio" value="2" opt="夏季成果報告会（学士/システム）">夏季成果報告会（学士/システム）<br>
                                <input type="radio" class="aradio" value="3" opt="夏季成果報告会（修士1年）">夏季成果報告会（修士1年）<br>
                                <input type="radio" class="aradio" value="4" opt="夏季成果報告会（修士2年）">夏季成果報告会（修士2年）<br>
                                <input type="radio" class="aradio" value="5" opt="夏季成果報告会（博士）">夏季成果報告会（博士）<br> -->
                            <!-- <input class="simple_btn" type="button" name="set" value="NEXT" onclick="audience_xmlLoad()"/> -->
                            <!-- <input class="simple_btn" type="button" name="set" value="NEXT" onclick="SetAudience()"/> -->
                            <!-- </form>
                                </div> -->
                            <!-- 学習者による聴衆モデルの選択 -->
                            <!-- <div id='set_model'>
                                <h2>目標の設定</h2>
                                <form name="form1">
                                <div id="set_perspective">
                                </div>


                                <div id="input_pluralBox"> -->
                            <!-- <div id="input_plural">
                                <input type="text" class="form-control" placeholder="〇〇は述べられているか">
                                <input type="button" value="－" class="del pluralBtn">
                                </div> -->
                            <!-- </div>
                                <input class="add pluralBtn" class="simple_btn" type="button" value="＋"><br> -->
                            <!-- その他 -->
                            <!-- 折りたたみ展開ボタン -->
                            <!-- <div onclick="obj=document.getElementById('menu1').style; obj.display=(obj.display=='none')?'block':'none';">
                                <a style="cursor:pointer;">▼ その他(クリックで展開)</a>
                                </div> -->
                            <!--// 折りたたみ展開ボタン -->
                            <!-- ここから先を折りたたむ -->
                            <!-- <div id="menu1" style="display:none;clear:both;">
                                </div> -->
                            <!--// ここまでを折りたたむ -->

                            <!-- <input class="simple_btn" type="button" name="set" value="OK" onclick="SetModel();" style="margin-top: 20px"/>
                                <input class="simple_btn" type="button" name="set" value="発表の場の選択に戻る" onclick="Back_Select()" style="margin-top: 20px"/>
                                </form>
                                </div> -->
                            <!-- 選択中の聴衆モデル-->
                            <!-- <div id='set_final'>
                                <h2>設定目標</h2>
                                </div>
                                <div id='edit_model'>
                                <input class="simple_btn" type="button" value="目標の設定に戻る" onclick="Edit_Model();"/>
                                </div> -->
                            <!-- shimizu 論理関係確認用 -->
                            <p id=now_logic_relation> </p>
                        </div>
                    </div><!--document fin -->

                    <!-- マインドマップ編集のサイドメニュー -->
                    
                    <div id="mind">
                        
                        <!--チェックメニュー　Start  -->
                        

                        <!--ここから大槻修正-->
                        <div id = "feedback_area" style="display: none">
                            <div id = "ontology_feedback"></div>
                            <div id = "accordion_discussion"></div>
                            <input id = "feedbackrecord" type="button" value="記録">
                        </div>
                        <div id="xml_upload_area" style="display: none">
                            <form id="uploadForm" enctype="multipart/form-data">
                                <div style="font-size: 15px;">XMLファイルを選んでください</div>
                                <input type="file" name="xmlFile" id="meetingUtteranceXmlFileUploader" accept=".xml">
                            </form>
                            <button id="discussion_log_xml_file_upload_button">アップロード</button>
                            <div id="uploaded_meeting_utterance_xml_concent_display_area" style="display: none"></div>
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

                        <div id="mind" class="side">
                            <div class="inquiry_area">
                                <div class="inquiry-search">
                                    <div class="search-box-wrapper">
                                        <button type="button" id="showQuestionsBtn" class="inquiry-show-all">All</button>
                                        <input type="search" id="inquiry_search_input" class="inquiry-search-input" placeholder="Search questions..." autocomplete="off">
                                    </div>
                                    <div id="inquiry_search_result" class="inquiry-search-result" aria-live="polite"></div>
                                </div>
                                <div id="testxml"></div>
                                <div id="ont"></div>
                                <div id="intention"></div>
                                <div id="rationality"></div>
                            </div>
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

	            <!-- 0817川 組織知マップ -->
	            <div id="tab05">
	                <div id="layout">
	                    <div id="organizational_container">
                            <!-- 組織知マップ（共同化/連結化）サブタブ -->
                            <div class="org-subtabs" role="tablist" aria-label="組織知マップ タブ">
                                <button type="button" id="org-tab-cooperation" class="org-subtab is-active" role="tab" aria-selected="true" aria-controls="org-tabpanel-cooperation">共同化</button>
                                <button type="button" id="org-tab-combination" class="org-subtab" role="tab" aria-selected="false" aria-controls="org-tabpanel-combination">連結化</button>
                                <!-- 組織選択プルダウン（organizational_container 内で共通） -->
                                <form id="group_select_form" class="group_select_form" action="javascript:void(0);">
                                    <label for="group_select" id="group_select_label">組織選択：</label>
                                    <select id="group_select" name="group_select">
                                        <!-- organizational-map.jsでoptionを動的に追加 -->
                                    </select>
                                </form>
                            </div>

                            <div id="org-tabpanel-cooperation" class="org-subtab-panel is-active" role="tabpanel" aria-labelledby="org-tab-cooperation">
	                        <div id="myOrganizationalnetwork_area">
	                            <div id="buttoncluster">
                                <!-- <input type="button" class="Organizational_network_button"
                                        id="organizational_addNode" value="思考ノード追加" />
                                <input type="button" class="Organizational_network_button"
                                        id="organizational_removeNode" value="ノード削除" />
                                <input type="button" class="Organizational_network_button"
                                        id="organizational_startEditEdge" value="エッジ追加" />
                                <input type="button" class="Organizational_network_button"
                                        id="organizational_removeEdge" value="エッジ削除" /> -->
                                <input type="button" class="Organizational_network_button"
                                        id="organizational_ZoomIn" value="拡大" />
                                <input type="button" class="Organizational_network_button"
                                        id="organizational_ZoomOut" value="縮小" />
                                <!-- <div class="checkbox_organizational">
                                    <input type="checkbox" id="checkbox_organizational" class="checkbox_organizational" name="check_organizational" onclick="ShowRelatedOrganizational('brother')">
                                    <label for="checkbox_organizational" data-on-label="On" data-off-label="Off"></label>
                                    <span class="checkbox_organizational_text">【兄弟ノード表示】<br></span>
                                </div> -->
                                <!-- <div class="checkbox_process">
                                    <input type="checkbox" id="checkbox_process" class="checkbox_process" name="check_process" onclick="ShowRelatedProcess('consistency')">
                                    <label for="checkbox_process" data-on-label="On" data-off-label="Off"></label>
                                    <span class="checkbox_process_text">【整合性ノード表示】<br></span>
                                </div> -->
                            </div>
                            <div id="t_Organizational_conmenu">
                                <ul>
                                    <li><a href="javascript:void(0);" id="organizational_conmenu1">思考過程表出化マップを表示</a></li>
                                    <!-- <li><a href="javascript:void(0);" id="organizational_conmenu2">マインドマップと対応付ける</a></li> -->
                                    <!-- <li><a href="javascript:void(0);" id="organizational_conmenu3" style="display:none">採用/棄却をつける</a></li> -->
                                    <li><a href="javascript:void(0);" id="organizational_conmenu6" style="display:none">組織知を編集する</a></li>
                                    <li><a href="javascript:void(0);" id="organizational_conmenu5" style="display:none">組織知を削除する</a></li>
                                    <li><a href="javascript:void(0);" id="organizational_conmenu4">キャンセル</a></li>
                                </ul>
                            </div>
                            <!-- <div id="t_Organizational_labelselect">
                                <select id="t_Organizational_selectionlist" size="3">
                                </select>
                                <input type="button" value="選択完了" id="p_ontology_select">
                            </div> -->
                            <div id="t_Organizational_recruitselect">
                                <select id="t_Organizational_recruitselectionlist">
                                    <option value="採用">採用</option>
                                    <option value="棄却">棄却</option>
                                </select>
                                <input type="button" value="選択完了" id="p_recruit_select">
                            </div>
	                            <div id="myOrganizationalnetwork"></div>
	                        </div>

	                    <div id="process_others_network_container" oncontextmenu="return false;" >
                    
                        <div id="othersProcessnetwork_area">
                            <div id="buttoncluster">
                                <input type="button" class="area_close" onclick="closeOthersThinkingProcessMap()"
                                        id="area_close" value="×" />
                                <input type="button" class="thinkingProcess_network_button"
                                        id="process_ZoomIn" value="拡大" />
                                <input type="button" class="thinkingProcess_network_button"
                                        id="process_ZoomOut" value="縮小" />
                                <div id="others_conceptdisplay">あああ</div>
                                <!-- <div class="checkbox_process">
                                    <input type="checkbox" id="checkbox_process" class="checkbox_process" name="check_process" onclick="ShowRelatedProcess('brother')">
                                    <label for="checkbox_process" data-on-label="On" data-off-label="Off"></label>
                                    <span class="checkbox_process_text">【兄弟ノード表示】<br></span>
                                </div> -->
                            </div>

	                            <div id="othersProcessnetwork"></div>
	                        </div>
	                    </div>
                            </div><!-- /org-tabpanel-cooperation -->

	                            <div id="org-tabpanel-combination" class="org-subtab-panel" role="tabpanel" aria-labelledby="org-tab-combination" hidden>
	                                <!-- 福島システムの「連結化タブ」相当: shared_combination_overlay -->
	                                <div id="shared_combination_overlay">
	                                    <div class="comb-row">
	                                        <!-- Left 70%: fragments + discussion/register inputs -->
	                                        <div class="comb-left">
	                                            <div class="comb-left-top">
	                                                <div id="knowledge_fragments_workspace" class="knowledge_fragments_workspace">
	                                                    <div class="overlay-title">
	                                                        知識フラグメント一覧
	                                                        <div class="kfrag-action-group">
	                                                            <button type="button" id="kfrag-reset" class="kfrag-action-btn">Reset</button>
	                                                            <button type="button" id="kfrag-undo" class="kfrag-action-btn" disabled>Undo</button>
	                                                            <button type="button" id="kfrag-redo" class="kfrag-action-btn" disabled>Redo</button>
	                                                        </div>
	                                                    </div>
	                                                    <?php include __DIR__ . '/php/get_knowledge_fragments.php'; ?>
	                                                    <!-- JSで .knowledge_fragment をノード化してこのワークスペース内に絶対配置します -->
	                                                </div>
	                                            </div>

	                                            <div class="overlay-input-area">
	                                                <!-- 左右2分割: 左=ディスカッション履歴, 右=知識登録フォーム -->
	                                                <div id="discussion_history_area" class="discussion_history_area">
	                                                    <div class="overlay-title">
	                                                        <span class="title-text">ディスカッション履歴</span>
	                                                        <button type="button" id="fragment-discussed-toggle" class="fragment-discussed-btn">議論開始</button>
	                                                        <button type="button" id="fragment-add-select-toggle" class="fragment-add-select-btn" aria-label="追加のフラグメントを選択">
	                                                            <span class="plus-icon" aria-hidden="true">+</span>
	                                                            <span class="tooltip">追加のフラグメントを選択</span>
	                                                        </button>
	                                                    </div>
	                                                    <div id="fragment-selected-area" class="fragment-selected-area">
	                                                        <span class="selected-label">現在選択しているノード：</span>
	                                                        <div id="fragment-selected-list" class="fragment-selected-list" aria-live="polite"></div>
	                                                    </div>
	                                                    <div class="discussion-board" id="discussion_board" data-user-name="<?php echo isset($_SESSION['USERNAME']) ? htmlspecialchars($_SESSION['USERNAME'], ENT_QUOTES, 'UTF-8') : 'ユーザー'; ?>">
	                                                        <div class="message-list" id="discussion_message_list" aria-live="polite">
	                                                            <div class="discussion-placeholder">議論対象とするフラグメントを選択してください</div>
	                                                        </div>
	                                                        <form id="discussion_post_form" class="post-form" action="javascript:void(0)" style="display:none;">
	                                                            <textarea id="discussion_input" class="post-input" rows="2" maxlength="255" placeholder="コメントを入力..."></textarea>
	                                                            <button type="submit" class="post-button">投稿</button>
	                                                        </form>
	                                                    </div>
	                                                </div>

	                                                <div id="knowledge_register_area" class="knowledge_register_area">
	                                                    <div class="overlay-title">知識登録</div>
	                                                    <form id="knowledge_register_form" class="knowledge_register_form" onsubmit="return false;">
	                                                        <div class="kra-row kra-top">
	                                                            <label for="kra_area_select" class="kra-label">追加する領域:</label>
	                                                            <select id="kra_area_select" class="kra-control">
	                                                                <option value="知識関連" selected>知識関連</option>
	                                                                <option value="研究方略関連">研究方略関連</option>
	                                                                <option value="その他">その他</option>
	                                                            </select>
	                                                        </div>
	                                                        <div class="kra-row kra-body">
	                                                            <textarea id="kra_knowledge_content" class="kra-control" rows="4" maxlength="255" placeholder="ここに内容を記入"></textarea>
	                                                        </div>
	                                                        <div class="kra-row kra-comment">
	                                                            <label for="kra_comment_input" class="kra-label">コメント:</label>
	                                                            <textarea id="kra_comment_input" class="kra-control" rows="2" maxlength="255" placeholder="任意のコメント(適用場面・記述理由など)"></textarea>
	                                                        </div>
	                                                        <div class="kra-actions">
	                                                            <button type="submit" class="button4-seci kra-submit" id="kra-submit">登録</button>
	                                                        </div>
	                                                    </form>
	                                                    <div id="knowledge_register_feedback" class="knowledge_register_feedback"></div>
	                                                </div>
	                                            </div>
	                                        </div>

	                                        <!-- Right 30%: knowledge tree -->
	                                        <div class="comb-right">
	                                            <div class="overlay-knowledge-tree">
	                                                <div class="overlay-title overlay-title-with-action">
	                                                    産出した知
	                                                    <button type="button" id="kt-add-node" class="kt-add-node-btn" aria-label="項目を追加">＋</button>
	                                                </div>
	                                                <div id="overlay_knowledge_tree" class="overlay_knowledge_tree"></div>
	                                            </div>
	                                        </div>
	                                    </div>
	                                </div>
	                            </div><!-- /org-tabpanel-combination -->
	                </div>
	            </div>
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
        <script type="text/javascript" src="../js/node_tag.js"></script>
        <script type="text/javascript" src="../js/ont_choose_thinking.js"></script>
        <script type="text/javascript" src="../js/thinking-process-network.js"></script>
	        <script type="text/javascript" src="../js/organizational-map.js"></script>
	        <script type="text/javascript" src="js/organizational-combination-tab.js"></script>
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
        <script type="text/javascript" src="js/inquiry_search.js"></script>
        <script type="text/javascript" src="js/ont_choose_input_output.js"></script>
        <script type="text/javascript" src="js/ont_rationality.js"></script>
        <script type="text/javascript" src="js/ont_scenario_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_audience_model.js"></script>
        <script type="text/javascript" src="js/upload.js"></script>     
        <script type="text/javascript" src="js/ui_language.js"></script>
        <!-- 2022.shimizu -->
        <script type="text/javascript" src="js/html2canvas.min.js"></script>
        <script type="text/javascript" src="js/add_OntologyArea.js"></script>
        <!--  ここから大槻修正　--> 
        <!-- <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.css" rel="stylesheet" type="text/css" /> -->
        <script type="text/javascript" src="./js/network.js"></script>  
        <script type="text/javascript" src="./js/readxmldata.js"></script>  
        
        <!--  ここまで大槻修正　-->
    </body>
</html>
