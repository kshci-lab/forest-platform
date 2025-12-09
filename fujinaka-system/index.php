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
}

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
    <head>
        <meta charset="utf-8">
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
        <link rel="stylesheet" type="text/css" href="../css/thinking-process-network.css" />


        <script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
        <script type="text/javascript" src="js/jquery-ui.min.js"></script>
        <script type="text/javascript" src="js/jsmind.js"></script>
        <script type="text/javascript" src="js/jsmind.draggable.js"></script>
        <script type="text/javascript" src="js/add_node.js"></script>
        <script type="text/javascript" src="js/add_annotations.js"></script>
        <script type="text/javascript" src="js/version.js"></script>
        <script type="text/javascript" src="quill-2.0/quill-2.0.js"></script>
        <script type="text/javascript" src="diff-match-patch-master/javascript/diff_match_patch.js" ></script>
        <script type="text/javascript" src="../js/vis-network.min.js"></script>
        <script type="text/javascript" src="../js/thinking-process-network.js"></script>


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
        </ul>
      <!-- タブメニュー　Finish -->

        <form name="target_mode" class="select_form" action="">
            <select class="cp_ipselect2 cp_sl02"name="Select1">
              <option>論文執筆モード</option>
              <option>論文推敲モード</option>
            </select>
            <input type="button" class="button3" value="実行" onclick="ModeChangeButtonClick();" />
        </form>
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
        <!-- <div class="Menu">Menu</div> -->

        <!--メインメニュー　Start  -->
        <div class="tabcontent">
        <!-- 思考整理支援システム -->
          <div id="tab01">
            <div id="layout">
              <div id="jsmind_nav">
                <div style="text-align: left">
                  <div id = "map_menu">
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
                    <button class="button4" id="map-snapshot-button" onclick="MapSnapShot();">
                        マップver更新
                    </button>

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

                  <div id ="presen_menu">
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

            <div id="jsmind_container" oncontextmenu="return false;"></div>
            <div id="mindmap_conmenu">
              <ul>
                <li>
                    <button class="button4" onclick="showThinkingProcessMap()">
                        思考過程表出化マップ
                    </button>
                </li>
                <li>
                  <button class="button4" onclick="NodeVersionUpdate()">
                    ノードverを更新
                  </button>
                </li>
                <li>
                  <button class="button4" onclick="SetPurposeonChapter()">
                    章を作成
                  </button>
                </li>
                <li>
                  <button class="button4" onclick="SetPurposeonSection()">
                    節を作成
                  </button>
                </li>
                <li>
                  <button class="button4" onclick="SetPurpose()">
                    パラグラフを作成
                  </button>
                </li>
                <li>
                  <button class="button4" onclick="NodeAppend()">
                    パラグラフに内容を追加
                  </button>
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
            <div id="feedback_area"></div>

            <!--
              <!-- プレゼンモードのサイドメニュー -- >
              <div id="document">
                <div id="advice_frame" class="searchFrame">
                    <!-- 事前設定 -->
                    <!-- <div id='pre_set' style="margin-top: 120px;">
                      <center><input type="button" value="事前設定" onclick="ShowModel()" style="width:100px; height:50px; background-color:#FFDBE1;"></center>
                    </div> -->
                    <!-- 発表の場の選択 -- >
                    <div id='set_audience'>
                      <h2>発表の場の選択</h2>
                      <form name="form1">
                        <input type="radio" class="aradio" value="1" opt="卒業論文発表" checked>卒業論文発表<br>
                        <input type="radio" class="aradio" value="2" opt="修士論文発表">修士論文発表<br>
                        <!-- <input type="radio" class="aradio" value="1" opt="夏季成果報告会（学士/未システム）" checked>夏季成果報告会（学士/未システム）<br>
                        <input type="radio" class="aradio" value="2" opt="夏季成果報告会（学士/システム）">夏季成果報告会（学士/システム）<br>
                        <input type="radio" class="aradio" value="3" opt="夏季成果報告会（修士1年）">夏季成果報告会（修士1年）<br>
                        <input type="radio" class="aradio" value="4" opt="夏季成果報告会（修士2年）">夏季成果報告会（修士2年）<br>
                        <input type="radio" class="aradio" value="5" opt="夏季成果報告会（博士）">夏季成果報告会（博士）<br> -- >
                        <input class="simple_btn" type="button" name="set" value="NEXT" onclick="audience_xmlLoad()"/>
                        <!-- <input class="simple_btn" type="button" name="set" value="NEXT" onclick="SetAudience()"/> -- >
                      </form>
                    </div>
                    <!-- 学習者による聴衆モデルの選択 -- >
                    <div id='set_model'>
                      <h2>目標の設定</h2>
                      <form name="form1">
                        <div id="set_perspective">
                        </div>


                        <div id="input_pluralBox">
                          <!-- <div id="input_plural">
                          　<input type="text" class="form-control" placeholder="〇〇は述べられているか">
                            <input type="button" value="－" class="del pluralBtn">
                          </div> -- >
                        </div>
                        <input class="add pluralBtn" class="simple_btn" type="button" value="＋"><br>
                        <!-- その他 -->
                        <!-- 折りたたみ展開ボタン -- >
                        <div onclick="obj=document.getElementById('menu1').style; obj.display=(obj.display=='none')?'block':'none';">
                        <a style="cursor:pointer;">▼ その他(クリックで展開)</a>
                        </div>
                        <!--// 折りたたみ展開ボタン -- >
                        <!-- ここから先を折りたたむ -- >
                        <div id="menu1" style="display:none;clear:both;">
                        </div>
                        <!--// ここまでを折りたたむ -- >

                        <input class="simple_btn" type="button" name="set" value="OK" onclick="SetModel();" style="margin-top: 20px"/>
                        <input class="simple_btn" type="button" name="set" value="発表の場の選択に戻る" onclick="Back_Select()" style="margin-top: 20px"/>
                      </form>
                    </div>
                    <!-- 選択中の聴衆モデル-- >
                    <div id='set_final'>
                      <h2>設定目標</h2>
                    </div>
                    <div id='edit_model'>
                      <input class="simple_btn" type="button" value="目標の設定に戻る" onclick="Edit_Model();"/>
                    </div>

                </div>
              </div>-->

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
              <div id="comment" style="display:none;" >
                <!-- <div class=check_menu">添削一覧</div>aaa -->
                <!-- <div class="check_list">
                  <input class="button5" type="button" onclick="showGeneration();" value="all">
                  添削一覧を表示
                </div> -->

                <!-- <div class="templete_area">
                  <div id="tensaku_templete"></div>

                  <!--<div>【典型的な問題点】</div>
                  <div id="testxml"></div>
                  <div id="ont"></div>

                  <div>【独自の問題点】</div>
                  <div id="intention"></div>
                  
                   <div>【表現の問題点】</div>
                  <div id="check_deep"></div> --v>
                </div> -->


                <div class="check_list">
                  <input id="add_tensaku" type="button" onclick="Add_tensaku();" value="添削コメントを追加"  style="display:none;" >
                </div>
                <div id="tensaku_area">
                </div>
              </div>
              <!--サイドメニュー　finish-->
               <!-- 思考過程表出化マップ　By川 -->
                <div id="process_network_container" oncontextmenu="return false;" >
                    <div id="myProcessnetwork2">
                        <div id="buttoncluster">
                            <input type="button" class="thinkingProcess_network_button"
                                    id="process_addNode" value="要約ノード追加" />
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
                        </div>
                        <div id="t_Process_conmenu">
                            <ul>
                                <li><a href="javascript:void(0);" id="process_conmenu1">概念をつける</a></li>
                                <li><a href="javascript:void(0);" id="process_conmenu2">マインドマップと対応付ける</a></li>
                                <li><a href="javascript:void(0);" id="process_conmenu3" style="display:none">採用/棄却をつける</a></li>
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


        <script type="text/javascript" src="js/second_advice.js"></script>
        <script type="text/javascript" src="js/mindmap.js"></script>
        <script type="text/javascript" src="js/past_sheet.js"></script>
        <script type="text/javascript" src="../js/node_tag.js"></script>
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
        <script>
          open_empty();
          getData();
          rebuild_version_area();
        </script>
    </body>
</html>
