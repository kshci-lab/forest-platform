<?php
session_start();
require("php/connect_db.php");
require("php/sheet.php");

// ログイン状態のチェック
if (!isset($_SESSION["USERID"]) ) { //ログイン出来ていない
    header("Location: logout.php");
    exit;
}

if( (isset($_POST["sheetbtn"])) ||   //シート選択ボタンが押された
    (isset($_SESSION["USERID"]) && !isset($_SESSION["SHEETID"]) )) { //ログインは出来ているがシート未選択の場合
  header("Location: select_sheet.php");
  $_SESSION["SHEETID"] = null; //シート選択画面に遷移させた時にSHEETIDをリセット
}

if(isset($_POST["logout"])){ //logoutボタンが押された
    // alert("本当にログアウトしますか？");
    // 時間があれば確認ダイアログを作る
    header("Location: logout.php");
}

// 追加: AJAXでの実行要求に応答（Pythonを実行してJSONで返す）
if (isset($_GET['action']) && $_GET['action'] === 'run_ai') {
    // 受信したシナリオを取得（JSON優先、fallbackでapplication/x-www-form-urlencodedも対応）
    $scenario = '';
    $raw = file_get_contents('php://input');
    if ($raw !== false && $raw !== '') {
        $data = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && isset($data['scenario'])) {
            $scenario = (string)$data['scenario'];
        }
    }
    if ($scenario === '' && isset($_POST['scenario'])) {
        $scenario = (string)$_POST['scenario'];
    }

    // 追加: 受け取ったシナリオをサーバコンソール（エラーログ）に出力
    if ($scenario !== '') {
        error_log("[run_ai] scenario length=" . strlen($scenario));
        error_log("[run_ai] scenario sample: " . substr($scenario, 0, 2000)); // 長すぎる場合は先頭のみ
    }

    $ai_output = '';
    try {
        $python = stripos(PHP_OS, 'WIN') === 0 ? 'python' : 'python3';
        $script = __DIR__ . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'test.py';
        $cmd = $python . ' ' . escapeshellarg($script);

        $disabled = (string)ini_get('disable_functions');
        if (stripos($disabled, 'proc_open') !== false) {
            $ai_output = "PHP設定で proc_open が無効です。php.ini の disable_functions を確認してください。";
        } else {
            $descriptorspec = [
                0 => ['pipe', 'w'], // stdin（ここに論文シナリオ文字列を書き込み、Pythonへ渡す）
                1 => ['pipe', 'w'], // stdout
                2 => ['pipe', 'w'], // stderr
            ];
            $process = @proc_open($cmd, $descriptorspec, $pipes);
            if (is_resource($process)) {
                // シナリオを書き込み
                if (is_string($scenario) && $scenario !== '') {
                    // ここでPHP→Python(test.py)へ論文シナリオを標準入力で送る
                    fwrite($pipes[0], $scenario);
                }
                fclose($pipes[0]);

                stream_set_blocking($pipes[1], true);
                stream_set_blocking($pipes[2], true);
                $stdout = stream_get_contents($pipes[1]);
                $stderr = stream_get_contents($pipes[2]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                $exitCode = proc_close($process);

                if ($exitCode === 0 && trim($stdout) !== '') {
                    $ai_output = trim($stdout);
                } else {
                    $errMsg = trim($stderr) !== '' ? trim($stderr) : '不明';
                    $outMsg = trim($stdout);
                    $ai_output = "Python実行エラー\nコマンド: {$cmd}\n終了コード: {$exitCode}\nエラー: {$errMsg}";
                    if ($outMsg !== '') {
                        $ai_output .= "\n標準出力: {$outMsg}";
                    }
                }
            } else {
                $ai_output = "proc_open の初期化に失敗しました。";
            }
        }
    } catch (Throwable $e) {
        $ai_output = 'AI出力の取得に失敗しました: ' . $e->getMessage();
    }

    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['output' => $ai_output], JSON_UNESCAPED_UNICODE);
    exit;
}

// 【変更】初期表示時は実行しない（空のまま）
$ai_output = '';
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>自己内対話活性化支援システム</title>
        <link type="text/css" rel="stylesheet" href="css/jsmind.css" />
        <link rel="stylesheet" type="text/css" href="css/item.css">
        <link rel="stylesheet" type="text/css" href="css/font.css">
        <link rel="stylesheet" type="text/css" href="css/jquery.cleditor.css">
        <link rel="stylesheet" type="text/css" href="css/ui.css">
        <link rel="stylesheet" type="text/css" href="css/style.css">
        <link rel="stylesheet" type="text/css" href="css/annotation.css">
        <link rel="stylesheet" type="text/css" href="quill-2.0/snow-2.0.css" >
        
        
        
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js"></script>
        <script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
        <script type="text/javascript" src="js/jquery-ui.min.js"></script>
        <script type="text/javascript" src="js/jsmind.js"></script>
        <script type="text/javascript" src="js/jsmind.draggable.js"></script>
        <script type="text/javascript" src="js/add_node.js"></script>
        <script type="text/javascript" src="js/add_annotations.js"></script>
        <script type="text/javascript" src="js/version.js"></script>
        <script type="text/javascript" src="quill-2.0/quill-2.0.js"></script>
        <script type="text/javascript" src="diff-match-patch-master/javascript/diff_match_patch.js" ></script>
        


        <script src="js/jquery.autosize.js"></script>
        <script src="js/jquery.autosize.min.js"></script>

        <script type="text/javascript" src="js/get_thinking.js"></script>
        <script type="text/javascript" src="js/jsmind.screenshot.js"></script>
        <script type="text/javascript" src="js/change_tab.js"></script>


        <script type="text/javascript">
          window.onbeforeunload = function(e) {e.returnValue = "ページを離れようとしています。よろしいですか？";}
        </script>

    </head>
    <body id="all">
      <!---        タイトルメニューStart                 -->
      <div id="main_title">
        <form name="return" method="POST">
          <span class="title_name">ForestCW</span>
          <span><input class="button2" type="submit" name="logout" value="ログアウト"></span>
          <span><input class="button1" type="submit" name="sheetbtn" value="シート選択画面に戻る"></span>
        </form>
      </div>

      <!--      タブメニュー Start        -->
        <div id ="tab_menu">
          <ul div class="tabnav">
            <li class="active"><a href="#tab01">思考整理支援システム</a></li>
          </ul>


          
          <div id="checkbox_area">
            <div class="checkbox" id="logic_btn">
              <input type="checkbox" id="logicbox" class="checkbox" name="check" onclick="CheckClick()">
              <label for="logicbox" data-on-label="" data-off-label=""></label>
              <span class="checkbox_text">【三角ロジックを表示】</span>
            </div>

            <div class="checkbox" id="scenario_btn">
              <input type="checkbox" id="scenariobox" class="checkbox" name="check" onclick="CheckClick()">
              <label for="scenariobox" data-on-label="" data-off-label=""></label>
              <span class="checkbox_text">【論文シナリオを表示】</span>
            </div>
            <div class="checkbox" id="preview_btn" style="display:none;" >
              <input type="checkbox" id="previewbox" class="checkbox" name="check" onclick="CheckClick()">
              <label for="previewbox" data-on-label="" data-off-label=""></label>
              <span class="checkbox_text">【論文プレビューを表示】</span>
            </div>
            <div class="checkbox" id="plusmap_btn" style="display:none;" >
              <input type="checkbox" id="plusmapbox" class="checkbox" name="check" onclick="CheckClick()">
              <label for="plusmapbox" data-on-label="" data-off-label=""></label>
              <span class="checkbox_text">【マップも表示】</span>
            </div>
          </div>

          <form name="target_mode" class="select_form" action="">
              <select class="cp_ipselect2 cp_sl02"name="Select1">
                <option>論文執筆モード</option>
                <option>論文推敲モード</option>
              </select>
              <input type="button" class="button3" value="実行" onclick="ModeChangeButtonClick();" />
          </form>
        </div>
        <!-- <div class="Menu">Menu</div> -->

        <!--メインメニュー　Start  -->
        <div class="tabcontent">
          <div id="tab01">
            <div id="btn_menu">
              <div class="menu_css" id = "map_menu">
                <!-- 【Edit】 -->
                <button class="button4" onclick="add_Qnode();">
                  問いノード追加
                </button>
                <button class="button4" onclick="add_Anode();">
                  答えノード追加
                </button>
                <!-- <li><button onclick="horisage();">掘り下げる</button></li>
                  <horisage()関数は現在存在しない-->
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
                <!-- 【Reason】
                <button class="button4" onclick="add_edit_reason();">
                  修正理由の追加
                </button> -->
                <!-- 【Screenshot】 -->
                <button class="button4" style="width:80px" onclick="screen_shot();">
                  screenshot
                </button>
                <!-- <label><input type="checkbox" name="Difference" id="Difference" onClick="Difference();">以前のマップとの差分</label> -->
              </div>

              <div class="menu_css" id="logic_menu">
                <input type="button" id="ln_deleteNode" value="ノード削除">
                <input type="button" id="ln_maketriangle" value="三角ロジックを作成する">
                <input type="button" id="ln_createtriangle" value="三角ロジックを追加する">
              </div>

              <div class="menu_css" id ="presen_menu">
                <!-- 【Slide】 -->
                <button class="button4" onclick="MakeChapter(null);">
                  章追加
                </button>
                <button class="button4" onclick="MakeSection(null);">
                  節追加
                </button>
                <button class="button4" onclick="MakeSlide();">
                  パラグラフ追加
                </button>
                <button class="button4" onclick="NewContent_Append('問い')">
                  問いノード追加
                </button>
                <button class="button4" onclick="NewContent_Append('答え')">
                  答えノード追加
                </button>
                <button class="button4" onclick="add_Confirm();">
                  マップ側へ反映
                </button>
                <!-- <button class="button4" onclick="Rebuild();">
                  スライド再現
                </button> -->
                <!-- <button class="button4" onclick="Get_SlideRank();Get_ContentRank();Get_SlideTitle();">
                  スライド保存
                </button> -->
                <button class="button4" onclick="Unreflected_node();">
                  未反映ノード
                </button>
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
              </div>
              
              <div id ="preview_menu">
                  <!-- 【Preview】 -->
                  <button class="button4" onclick="Create_preview();">
                    プレビュー更新
              </div>
            </div>
            <div id="version_area" style="display:none;"></div>

            <div class="Menu">Menu</div>
            <!-- <div class="checkbox"> -->
              <!-- <input type="checkbox" id="checkbox" class="checkbox" name="check" onclick="CheckClick()"> -->
              <!-- <input type="checkbox" id="checkbox" class="checkbox" name="check" onclick="">
              <label for="checkbox" data-on-label="On" data-off-label="Off"></label>
              <span class="checkbox_text">【プレゼン作成】</span>
            </div> -->

            <!-- <div class="changemode_button">
              <input type="button" id="documentation_mode_button" value="プレゼン" onclick="change_documentation_mode()">
              <input type="button" id="mindmap_mode_button" value="マインドマップ" onclick="change_mindmap_mode()">
            </div> -->
            <div id="content">
              <div id="jsmind_area">
                <div id="jsmind_container" oncontextmenu="return false;"></div>
              </div>

              <div id="logic_area">
                <div id="mynetwork"></div>
                <li><a href="javascript:void(0);" onClick="defaultLogicNetwork.exportNetworkToPDF;">PDF</a></li>
              </div>

              <div id="logic_conmenu">
                <ul>
                  <li class="category-header">三角ロジック</li>
                  <li class="subcategory">
                    <ul>
                      <li><a href="javascript:void(0);" onClick="defaultLogicNetwork.completeLogic();">完了</a></li>
                      <li><a href="javascript:void(0);" onClick="defaultLogicNetwork.conflictLogic()">途中</a></li>
                    </ul>
                  </li>
                  <li class="category-header">Forest</li>
                  <li class="subcategory">
                    <ul>
                      <li><a href="javascript:void(0);" onClick="createNodeFromLogic()">Forestに反映</a></li>
                    </ul>
                  </li>
                  <li class="category-header">論文シナリオ</li>
                  <li class="subcategory">
                    <ul>
                      <li><a href="javascript:void(0);" onClick="SetPurposeonChapterfromlogic()">章を作成</a></li>
                      <li><a href="javascript:void(0);" onClick="SetPurposeonSectionfromlogic()">節を作成</a></li>
                      <li><a href="javascript:void(0);" onClick="SetPurposefromLogic()">パラグラフを作成</a></li>
                      <li><a href="javascript:void(0);" onClick="NodeAppendfromLogic()">パラグラフに追加</a></li>
                    </ul>
                  </li>
                </ul>
              </div>

              <!-- 論理説明用モーダル -->
              <div id="logicClaimReasonModal" class="modal">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 id="claimReasonNodeTitle">論理の説明</h3>
                    <span class="close" onclick="defaultLogicNetwork.closeLogicClaimReasonModal()">&times;</span>
                  </div>
                  <div class="modal-body">
                    <p class="claimReason-prompt">なぜこの主張をしましたか？</p>
                    <textarea id="claimReasonTextarea" placeholder="この主張をした理由や根拠を詳しく説明してください..." rows="8"></textarea>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="defaultLogicNetwork.saveLogicClaimReason()">保存</button>
                    <button type="button" class="btn btn-secondary" onclick="defaultLogicNetwork.closeLogicClaimReasonModal()">キャンセル</button>
                  </div>
                </div>
              </div>

              <!-- 論理葛藤用モーダル -->
              <div id="logicConflictModal" class="modal">
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 id="conflictNodeTitle">論理の葛藤</h3>
                    <span class="close" onclick="defaultLogicNetwork.closeLogicConflictModal()">&times;</span>
                  </div>
                  <div class="modal-body">
                    <p class="conflict-prompt">どのような葛藤がありますか？</p>
                    <textarea id="conflictTextarea" placeholder="この主張をする際の葛藤や迷い、対立する意見などを詳しく記録してください..." rows="8"></textarea>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="defaultLogicNetwork.saveLogicConflict()">保存</button>
                    <button type="button" class="btn btn-secondary" onclick="defaultLogicNetwork.closeLogicConflictModal()">キャンセル</button>
                  </div>
                </div>
              </div>

              <div id="presentation_conmenu">
                <ul>
                  <li class="category-header">三角ロジック</li>
                  <li class="subcategory">
                    <ul>
                      <li><a href="javascript:void(0);" onClick="defaultLogicNetwork.createTriangleFromScenario()">三角ロジックを作成</a></li>
                      <li><a href="javascript:void(0);" onClick="defaultLogicNetwork.applyPresentationToTriangle()">三角ロジックに反映</a></li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div id="mindmap_conmenu">
                <ul>
                  <li class="category-header">三角ロジック</li>
                  <li class="subcategory">
                    <ul>
                      <li><a href="javascript:void(0);" onClick="defaultLogicNetwork.createTriangleFromForest()">三角ロジックを作成</a></li>
                      <li><a href="javascript:void(0);" onClick="defaultLogicNetwork.applyForestToTriangle()">三角ロジックに反映</a></li>
                    </ul>
                  </li>
                  <li class="category-header">論文シナリオ</li>
                  <li class="subcategory">
                    <ul>
                      <li><a href="javascript:void(0);" onClick="SetPurposeonChapter()">章を作成</a></li>
                      <li><a href="javascript:void(0);" onClick="SetPurposeonSection()">節を作成</a></li>
                      <li><a href="javascript:void(0);" onClick="SetPurpose()">パラグラフを作成</a></li>
                      <li><a href="javascript:void(0);" onClick="NodeAppend()">パラグラフに追加</a></li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div id="document_area"> 
                <div id="document_title">
                  <div class="document_purpose">
                    <textarea id="scenario_title" class="document_title_area" class="statement" onfocus='TextboxClick()' onblur='Edit_title(this);' placeholder="論文タイトル" style='width:91%;'></textarea>
                  </div>
                </div>
                <div id="chapter_area"></div>
              </div>
              <div id="preview_area"></div>

              <!-- 追加: 出力領域 -->
              <div id="ai_output_panel" style="margin:14px 0; padding:12px; border:1px solid #ddd; border-radius:8px; background:#fff;">
                <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
                  <div style="font-weight:bold;">AI出力</div>
                  <button id="run_ai_btn" type="button" class="button4" onclick="runAi()">実行</button>
                </div>
                <div id="ai_output" style="white-space:pre-wrap; line-height:1.6; font-size:0.95em; min-height:2em; color:#333;">
                  <?php echo htmlspecialchars($ai_output ?? '', ENT_QUOTES, 'UTF-8'); ?>
                </div>
              </div>
            </div>
            <div id="elab_jsmind_container" style="display:none;" oncontextmenu="return false;" ></div>
            <div id="elab_map_conmenu" class="elab_conmenu">
              <ul>
                <li><a href="javascript:void(0);" onClick="var result = Add_tensaku(); add_to_comment(result, 'map');">選択したマップのノードを対象としたコメント追加</a></li>
                <li><a href="javascript:void(0);" onClick="add_to_comment('', 'map')">コメントにノードを対応づける</a></li>
                <li><a href="javascript:void(0);" onClick="remove_annotation('map')"></a>対応を削除</li>
              </ul>
            </div>
            <div id="elab_document_area" oncontextmenu="return false;" > 
              <div id="elab_document_title">
                <div class="elab_document_purpose">
                  <div id="elab_scenario_title" class="elab_document_title_area" class="statement" onfocus='TextboxClick()'placeholder="論文タイトル" style='width:91%;'></div>
                </div>
              </div>
              <div id="elab_chapter_area"></div>
            </div>
            <div id="elab_chapter_conmenu" class="elab_conmenu">
              <ul>
                <li><a href="javascript:void(0);" onClick="var result = Add_tensaku(); add_to_comment(result, 'chapter');">選択した章を対象としたコメント追加</a></li>
                <li><a href="javascript:void(0);" onClick="add_to_comment('', 'chapter')">コメントに章を対応づける</a></li>
                <li><a href="javascript:void(0);" onClick="remove_add_to_comment('chapter')"></a>対応を削除</li>
              </ul>
            </div>
            <div id="elab_section_conmenu" class="elab_conmenu">
              <ul>
                <li><a href="javascript:void(0);" onClick="var result = Add_tensaku();add_to_comment(result, 'section');">選択した節を対象としたコメント追加</a></li>
                <li><a href="javascript:void(0);" onClick="add_to_comment('', 'section')">コメントに節を対応づける</a></li>
                <li><a href="javascript:void(0);" onClick="remove_add_to_comment('section')"></a>対応を削除</li>
              </ul>
            </div>
            <div id="elab_paragraph_conmenu" class="elab_conmenu">
              <ul>
                <li><a href="javascript:void(0);" onClick="var result = Add_tensaku();add_to_comment(result, 'paragraph');">選択したパラグラフを対象としたコメント追加</a></li>
                <li><a href="javascript:void(0);" onClick="add_to_comment('', 'paragraph')">コメントにパラグラフを対応づける</a></li>
                <li><a href="javascript:void(0);" onClick="remove_add_to_comment('paragraph')"></a>対応を削除</li>
              </ul>
            </div>
            <div id="elab_content_conmenu" class="elab_conmenu">
              <ul>
                <li><a href="javascript:void(0);" onClick="var result = Add_tensaku();add_to_comment(result, 'content');">選択したパラグラフのノードを対象としたコメント追加</a></li>
                <li><a href="javascript:void(0);" onClick="add_to_comment('', 'content')">コメントにノードを対応づける</a></li>
                <li><a href="javascript:void(0);" onClick="remove_add_to_comment('content')"></a>対応を削除</li>
              </ul>
            </div>
            <div id="elab_preview_area" oncontextmenu="return false;" ></div>
            <div id="preview_conmenu">
              <ul>
                <li><a href="javascript:void(0);" onClick="var result = Add_tensaku();add_annotation(result);">コメント追加</a></li>
                <li><a href="javascript:void(0);" onClick="add_annotation()">コメントにアノテーションを付与</a></li>
                <li><a href="javascript:void(0);" onClick="remove_annotation()"></a>アノテーションを削除</li>
              </ul>
            </div>
            

            <!--サイドメニュー　start-->
            <div id="side_menu">

              <!-- マインドマップ編集のサイドメニュー -->
              <div id="mind">
                <!-- <div class="correct_reason">修正理由</div>
                <div id="reason" align="center"></div>

                <div class="toi_menu">問い一覧</div> -->
                <div class="toi_list">
                  <div id="mind_all">
                  <input class="button5" type="button" onclick="showGeneration();" value="問い一覧">
                  <b>マインドマップモード</b>
                  </div>
                  <div id="presen_all" hidden>
                  <input class="button5" type="button" onclick="P_showGeneration();" value="問い一覧">
                  <b>論文執筆モード</b>
                  </div>
                </div>

                <div class="inquiry_area">
                  <div>【情報の表出化】</div>
                  <div id="testxml"></div>
                  <div id="ont"></div>

                  <div>【理由・目的】</div>
                  <div id="intention"></div>

                  <div>【合理性】</div>
                  <div id="rationality"></div>
                </div>
                <div id='node_slide'>
                  <input id="finish1_btn" class="presen-btn" type="button" value="シナリオ構成終了" onclick="unreflected_rationality_feedback(); save_version();" style="display:none;">
                </div>
              </div>
              <!-- 添削コメント編集のサイドメニュー -->



              <div class="check_list">
                <input id="add_tensaku" type="button" onclick="Add_tensaku();" value="添削コメントを追加"  style="display:none;" >
              </div>
            </div>
          </div>

          <!--  　　　tab02メニュー　　　　　-->
          <!--  過去のマインドマップを表示する　-->
          <div id="tab02">
            <div id="layout">
              <div id="jsmind_nav2">
                <div class ="mt_timing">
                  <select name="mttime_list" id="mttime_list">
                  <!-- ログイン中のユーザのMT時間を取得する -->
                    <?php
                      get_mttiming();
                    ?>
                  </select>
                  <input type="button" class="ShowCurrentMapButton" onClick="ShowCurrentMap();" value="現在のマップを表示">
                  <input type="button" class="HideCurrentMapButton" onClick="HideCurrentMap();" value="現在のマップを隠す">
                </div>
              </div>
              <!-- 過去のマインドマップを表示する部分 -->
              <div id="jsmind_container2">
                <div>過去のオントロジー</div>
              </div>
              <!-- 現在のマインドマップのコピー -->
              <div id="jsmind_container3"></div>
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
          <!-- <div id="record_tab">
            <div id="layout">
            <div id="record_container">
              <form id ="reco_peri" class="ref_peri" method = "post" acion="">
                      <p>確認したいリフクション履歴期間を設定してください</p>
                      <label><input id="reco_c2" type="radio" name="reco_per" value="today" onclick="record_period2();" checked/>本日分のリフレクション</label>
                      <br>
                      <br>
                      <label><input id="reco_c" type="radio" name="reco_per" value="select" onclick="record_period();"/>リフレクション期間を指定する</label>
                      <br>
                      <input id="reco_period" name="start_date" type="date" disabled="disabled"/>から<input id="reco_period2" name="finish_date" type="date" disabled="disabled"/>
                      <br>
                      <br>
                      ↓idがバッティングしていたため，とりあえずコメントアウトしている．
                      <span><input id="reflection_btn" type="button" onclick="get_recordAAAA();" value="リフレクション履歴表示" /></span>
              </form>
              <div id ="record_table"></div>
            </div>
            </div>
          </div> -->
          <!--履歴 yoshioka -->
        </div>
        <!-- メインメニュー　Finish -->


        <script type="text/javascript" src="js/second_advice.js"></script>
        <script type="text/javascript" src="js/mindmap.js"></script>
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
        <script type="text/javascript" src="js/ont_rationality.js"></script>
        <script type="text/javascript" src="js/ont_scenario_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_audience_model.js"></script>
        <script type="text/javascript" src="js/ont_audience_model.js"></script>
        <script type="text/javascript" src="js/tensaku.js"></script>
        <script type="text/javascript" src="js/logic_network.js"></script>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script>
          // 実行ボタン: DOMから論文シナリオを収集して送信
          function runAi() {
            const btn = document.getElementById('run_ai_btn');
            const out = document.getElementById('ai_output');
            const org = btn.textContent;

            // タイトルと本文を収集（必要に応じて採取元を調整）
            const titleEl = document.getElementById('scenario_title');
            const title = titleEl ? (titleEl.value || titleEl.textContent || '') : '';
            const bodyEl = document.getElementById('chapter_area');
            const body = bodyEl ? bodyEl.innerText : '';
            const scenario = (title ? ('【タイトル】' + title + '\n\n') : '') + (body || '');

            // 追加: ブラウザコンソールに送信内容を出力
            console.group('AI送信デバッグ');
            console.log('タイトル:', title);
            console.log('本文(先頭500文字):', body ? body.slice(0, 500) : '');
            console.log('送信シナリオ:', scenario);
            console.groupEnd();

            btn.disabled = true;
            btn.textContent = '実行中...';
            out.textContent = '';

            fetch('index.php?action=run_ai&_t=' + Date.now(), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify({ scenario })
            })
            .then(r => r.ok ? r.json() : Promise.reject(r.status + ' ' + r.statusText))
            .then(j => { out.textContent = j.output || ''; })
            .catch(e => { out.textContent = '要求に失敗しました: ' + e; })
            .finally(() => { btn.disabled = false; btn.textContent = org; });
          }

          open_empty();
          getData();
          rebuild_version_area();
        </script>
    </body>
</html>
