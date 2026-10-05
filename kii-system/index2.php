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

// if(isset($_POST["mt"])){ // mt.phpなんてない
//     require("php/mt.php");
//     header("Location: index.php");
// }

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>自己内対話活性化支援システム</title>
        <link type="text/css" rel="stylesheet" href="../css/jsmind.css" />
        <link rel="stylesheet" type="text/css" href="../css/item.css">
        <link rel="stylesheet" type="text/css" href="../css/font.css">
        <link rel="stylesheet" type="text/css" href="../css/jquery.cleditor.css">
        <link rel="stylesheet" type="text/css" href="../css/ui.css">
        <link rel="stylesheet" type="text/css" href="../css/style.css">

        <script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
        <script type="text/javascript" src="js/jquery-ui.min.js"></script>
        <script type="text/javascript" src="js/jsmind.js"></script>
        <script type="text/javascript" src="js/jsmind.draggable.js"></script>
        <script type="text/javascript" src="js/add_node.js"></script>

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
          <span class="title_name">ForestCR </span>
          <span><input class="button2" type="submit" name="logout" value="ログアウト"></span>
          <span><input class="button1" type="submit" name="sheetbtn" value="シート選択画面に戻る"></span>
        </form>
      </div>
      <form name="return" method="POST">
        <div id="session">
          <span class="session_php">
          <?php echo("ユーザ名：");
                echo($_SESSION["USERNAME"]);
                echo("  　シート名：");
                getMapname();?>
          </span>
          <span>
            <a href="#modal" class="modal"><input type="button" id="js-show-popup" class="button9"  onclick="OperateDescription();" value="操作確認"></a>
            <div id="modal" style="display:none;">
            	<p>これはサンプルです。</p>
            </div>
            <input class="button7" type="button" onclick="save_node();" value="DBの接続確認">
          </span>
        </div>
      </form>
      <!---          タイトルメニューFinish              -->

      <!--      タブメニュー Start        -->
        <ul div class="tabnav">
          <li class="active"><a href="#tab01">思考整理支援システム</a></li>
          <li><a href="#tab02">過去のマインドマップ</a></li>
          <li class="active"><a href="#tab03" >リフレクション</a></li><!-- yoshioka -->
          <li class="active"><a href="#record_tab" >履歴</a></li><!-- yoshioka -->
        </ul>
      <!-- タブメニュー　Finish -->
        <div class="Menu">Menu</div>

        <!--メインメニュー　Start  -->
        <div class="tabcontent">
        <!-- 思考整理支援システム -->
          <div id="tab01">
            <div id="layout">
              <div id="jsmind_nav">
                【Edit】
                  <button class="button4" onclick="add_Qnode2();">
                    問いノード追加
                  </button>
                  <button class="button4" onclick="add_Anode();">
                    答えノード追加
                  </button>
                  <!-- <li><button onclick="horisage();">掘り下げる</button></li>
                        horisage()関数は現在存在しない-->
                  <button class="button4" onclick="remove_node();">
                    ノードの削除
                  </button>
                  <!--1つ前に消したノードを復元-->
                  <button class="button4" onclick="return_node();">
                    1つ前に戻る
                  </button>

                  【Zoom】
                  <button class="button3" id="zoom-in-button" onclick="zoomIn();">
                      拡大
                  </button>
                  <button class="button3" id="zoom-out-button" onclick="zoomOut();">
                      縮小
                  </button>
                  【Reason】
                  <button class="button4" onclick="add_edit_reason();">
                    修正理由の追加
                  </button>
                  【Screenshot】
                  <button class="button4" style="width:80px" onclick="screen_shot();">
                    screenshot
                  </button>
                  <!-- <button class="button4" style="width:80px" onclick="Difference();"> -->
                  <label><input type="checkbox" name="Difference" id="Difference" onClick="Difference();">以前のマップとの差分</label>
                  <!-- </button> -->
              </div>
              　
              <div class="checkbox">
                <input type="checkbox" id="checkbox" class="checkbox" name="check" onclick="CheckClick()">
                <label for="checkbox" data-on-label="On" data-off-label="Off"></label>
                <span class="checkbox_text">【文書化モード】</span>
              </div>

              <div class="changemode_button">
                <input type="button" id="documentation_mode_button" value="ドキュメント" onclick="change_documentation_mode()">
                <input type="button" id="mindmap_mode_button" value="マインドマップ" onclick="change_mindmap_mode()">
              </div>

            <div id="jsmind_container" oncontextmenu="return false;"></div>
            <!-- <div id="jsmind_container"></div> -->
            <div id="mindmap_conmenu">
              <ul>
                <li><a href="javascript:void(0);" target="_blank" onClick="CreateOriginalThread()">議論目的に設定する</a></li>
                <li><a href="javascript:void(0);" target="_blank" onClick="SetPurpose('提案')">提案として記述する</a></li>
                <li><a href="javascript:void(0);" target="_blank" onClick="SetPurpose('共有')">共有として記述する</a></li>
              </ul>
            </div>
            <!-- <div id="document_area" oncontextmenu="return false;"></div> -->
            <!-- <div id="document_area">
              <div id="document_title">
                <h3>本日の議論内容：</h3>
                <div class="document_purpose">
                  <textarea class="document_title_area" class="statement"></textarea>
                  <input type="button" class="meeting_purpose" value="追加" onClick="AddMeetingPurpose();">
                </div>
              </div>
            </div> -->
            <div id="document_conmenu">
              <ul>
                <li><a href="javascript:void(0);" target="_blank" onClick="SelecttextToNode()">選択範囲をマインドマップに追加する</a></li>
              </ul>
            </div>

            <!--サイドメニュー　start-->
            <div id="side_menu">
              <!-- マインドマップ編集のサイドメニュー -->
              <div id="mind">
                <div class="correct_reason">修正理由</div>
                <!-- 修正理由のテキストボックス -->
                <div id="reason" align="center"></div>

                <div class="toi_menu">問い一覧</div>
                <div class="toi_list">
                  <input class="button5" type="button" onclick="showGeneration();" value="all">
                  問い一覧を表示
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
              </div>

              <!-- 文書化のサイドメニュー -->
              <div id="document">
                <div class="searchFrame">
                  <!-- <div class="document_description">文書に記述する内容を<br>選択してください</div> -->
                  <div class="action_select cp_sl05">
                    <select name="tag_list" id="tag_list" class="tag_list" onchange="SelectTagname(this)">
                      <option value="" hidden selected>選択してください</option>
                      <option value="" hidden >選択しました</option>
                      <option value="議論目的">議論目的</option>
                      <option value="共有">共有</option>
                      <option value="選択">選択</option>
                      <option value="提案">提案</option>
                      <option value="新規作成">新規作成</option>
                    </select>
                  </div>
                  <div class="document_description">【ご案内】</div>
                  <div><textarea id="documentation_support_area" rows="5" cols="5" value="" readonly></textarea></div>
                  <div class="document_description">【選択中のノード】</div>
                  <textarea id="selected_node_area" rows="5" cols="5" value="" readonly></textarea>
                  <div id="documentation_support_button"></div>
                </div>
                <input type="button" value="マインドマップを表示" onclick="show_mindmap()" id="show_mindmap_button">
                <input type="button" value="マインドマップを隠す" onclick="hide_mindmap()" id="hide_mindmap_button">
                <input type="button" value="【テキストファイルで出力】" onclick="OutputFile()" id="output_button">
                <input type="file" value="【テキストファイルを選択】" onclick="InputFile()" id="input_file">
              </div>
            <!--サイドメニュー　finish-->
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
                  <input type="button" class="" onClick="ShowCurrentMap();" value="現在のマップを表示">
                  <input type="button" class="" onClick="HideCurrentMap();" value="現在のマップを隠す">
                </div>
              </div>
            <!-- 現在のマインドマップのコピー -->

              <div id="jsmind_container3"></div>
              <!-- 過去のマインドマップを表示する部分 -->
              <div id="jsmind_container2">
                <div>過去のオントロジー</div>
              </div>
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
                      <span><input id="reflection_btn" type="button" onclick="get_recordAAAA();" value="リフレクション履歴表示" /></span>
              </form>
              <div id ="record_table"></div>
            </div>
            </div>
          </div>
          <!--履歴 yoshioka -->


          </div>
        <!-- メインメニュー　Finish -->

        <script type="text/javascript" src="js/mindmap.js"></script>
        <script type="text/javascript" src="js/past_sheet.js"></script>
        <script type="text/javascript" src="js/document.js"></script>
        <script type="text/javascript" src="plugins/Sortable-master/Sortable.js"></script>
        <script type="text/javascript" src="plugins/Sortable-master/Sortable.min.js"></script>
        <script type="text/javascript" src="plugins/Modaal-master/dist/js/modaal.js"></script>
        <script type="text/javascript" src="plugins/Modaal-master/dist/js/modaal.min.js"></script>
        <!-- <script src="plugins/Modaal-master/dist/css/modaal.css"></script> -->
        <script type="text/javascript" src="js/ont_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_choose_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_rationality.js"></script>
    </body>
</html>
