<?php
session_start();
require("php/connect_db.php");
require("php/sheet.php");
ini_set('error_reporting', E_ALL & ~E_NOTICE);

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
        <title>論文読解支援システム</title>
        <link type="text/css" rel="stylesheet" href="css/jsmind.css" />
        <link rel="stylesheet" type="text/css" href="css/item.css">
        <link rel="stylesheet" type="text/css" href="css/font.css">
        <link rel="stylesheet" type="text/css" href="css/jquery.cleditor.css">
        <link rel="stylesheet" type="text/css" href="css/ui.css">
        <link rel="stylesheet" type="text/css" href="css/style.css">
        <link rel="stylesheet" type="text/css" href="css/button.css">
        <link rel="stylesheet" type="text/css" href="css/annotation.css">
        <script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
        <script type="text/javascript" src="js/jquery-ui.min.js"></script>
        <script type="text/javascript" src="js/create_question.js"></script>
        <script type="text/javascript" src="js/jsmind.js"></script>
       
        <script type="text/javascript" src="js/jsmind.draggable.js"></script>
        <script src="js/referense_node_and_anno.js"></script>
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.1/css/all.css" integrity="sha384-gfdkjb5BdAXd+lj+gudLWI+BXq4IuLW5IT+brZEZsLFm++aCMlF1V92rMkPaX4PP" crossorigin="anonymous">

        <script src="js/jquery.autosize.js"></script>
        <script src="js/jquery.autosize.min.js"></script>

        <script type="text/javascript" src="js/get_thinking.js"></script>
        <script type="text/javascript" src="js/jsmind.screenshot.js"></script>
        <script type="text/javascript" src="js/change_tab.js"></script>
        <script type="text/javascript" src="js/paper_area.js"></script>

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
          <?php echo("ユーザ：");
                // echo("西田");
                echo($_SESSION["USERNAME"]);
                echo("　タイトル：");
                getMapname();
                // 西田
                // echo("Ontology-based Thought Organization Support System to Prompt Readiness of Intention Sharing and Its Long-term Practice：");?>
          </span>
          <!-- <span>
            <a href="#modal" class="modal"><input type="button" id="js-show-popup" class="button9"  onclick="OperateDescription();" value="操作確認"></a>
            <div id="modal" style="display:none;">
            	<p>これはサンプルです。</p>
            </div>
            <input class="button7" type="button" onclick="save_node();" value="DBの接続確認">
          </span> -->
        </div>
      </form>
      <!---          タイトルメニューFinish              -->

      <!--      タブメニュー Start        -->
        <ul div class="tabnav">
          <li class="active"><a href="#tab01">論文読解支援システム</a></li>
          <!-- <li class="active"><a href="#tab03" >リフレクション</a></li>yoshioka            -->
          <!-- yoshioka -->
        </ul>
      <!-- タブメニュー　Finish -->
        
        <div id="advice_frame" class="searchFrame"></div>
        
        <!--メインメニュー　Start  -->
      <div class="tabcontent">
        <!-- 思考整理支援システム -->
        <div id="tab01">
            <div id="layout">
              
              <div id ="system">
              <div id="area">
              <div id="jsmind_nav">
              【Edit】
                  
              
                  <button class="button4" id="question_node_b" onclick="add_Qnode2();">
                    疑問ノード追加
                  </button>
                  
                  <button class="button4" id="s_interpretation" onclick="add_Anode('answer','konkyo');">
                   根拠ノード追加
                  </button>
                  <button class="button4" id="s_interpretation" onclick="add_Anode('predict','predict');">
                   解釈ノード追加
                  </button>
          
            

                  <!-- <select name="add_criticism" id="s_criticism_node">
                    <optgroup label="批評の観点（タグ）付与">
                    <option value="criticism">批評ノード追加</option>
                       <option value="evaluation">価値判断</option>
                          <optgroup label="----L価値判断">
                              <option value="e_1">---L有用性</option>
                              <option value="e_2">---L新規性</option>
                              <option value="e_3">---L信頼性</option>
                            </optgroup>

                       <option value="objection">意見</option>
                            <optgroup label="----L意見">
                            <option value="o_1">---L反論</option>
                              <option value="o_2">---L改善策</option>
                              <option value="o_3">---L代替案</option>
                            </optgroup>
                      <option value="modification">問題点</option>
                            <optgroup label="----L問題点">
                            <option value="m_1">---L語の妥当性</option>
                              <option value="m_2">---L証拠の十分生</option>
                              <option value="m_3">---L論理の整合性</option>
                            </optgroup>


                    </optgroup>
                  </select> -->

                  


          

                  【mindmap】
                  <button class="button3" id="zoom-in-button" onclick="zoomIn();">
                      拡大
                  </button>
                  <button class="button3" id="zoom-out-button" onclick="zoomOut();">
                      縮小
                  </button>

                  【paper】
                  <button class="zoom" onclick="zoomIn_paper();">
                      <!-- 拡大 -->
                      <i class="fas fa-search-plus"></i>
                    </button>   

                    <button class="zoom" onclick="zoomOut_paper();">
                    <!-- 縮小 -->
                    <i class="fas fa-search-minus"></i>
                    </button> 
                    
                    <button class="zoom" onclick="zoomInit_paper();">
                    <!-- 縮小 -->
                    元のサイズ
                    </button> 
                    
                    <button id="help_button" class="button3" onclick="toggleImage()">help</button>
                      <div id="floatingImage">
                          <img src="image/help.png" alt="Floating Image">
                      </div>
                    

   
                  【Screenshot】
                  <button class="button4" style="width:80px" onclick="screen_shot();">
                    screenshot
                  </button>


                  <!-- <button class="button4" style="width:80px" onclick="Difference();"> -->
                  <!-- <label><input type="checkbox" name="Difference" id="Difference" onClick="Difference();">以前のマップとの差分</label> -->
                  <!-- </button> -->
          
              </div>
                <div id="jsmind_area" oncontextmenu="return false;">           
                  <div id="jsmind_container" oncontextmenu="return false;"></div>
                  <div id="jsmind_container2_menu">
                    <div id="mindmap_tab"><span id="all_annotation"></span></div>
                    <!--
                    <button class="button3" id="zoom-in-button" onclick="zoomIn2();">
                      拡大
                    </button>
                    <button class="button3" id="zoom-out-button" onclick="zoomOut2();">
                      縮小
                    </button> 
                    -->

                  </div>    
                  <div id="jsmind_container2"></div>
                </div>
                <div id="document_area" oncontextmenu="return false;"></div>             
            </div>
            </div>


            <div id="mindmap_conmenu">
              <ul>
                
              <li>
                  ノード情報変更
              </li>
              <li>
              <button class="button4" onclick="remove_node();">
                  ノードの削除
                </button>
              </li>
              <li>
                <!-- <button class="button4" onclick="move2anno_from_node(annotations);">
                      紐付いた文参照
                </button> -->
              </li>

                <li>
                <!-- onclick="move_papaer();" -->
                </li>
         
                 <li>
                  論文からノード追加
                </li> 
                <li>  <button class="button4" onclick="add_Qnode2();">
                    問いノード追加
                  </button>
                </li>
                <li>  <button class="button4" onclick="add_Anode2('konkyo');">
                    根拠ノード追加
                  </button>
                </li>       
                <!-- <li><a href="javascript:void(0);" target="_blank" onClick="SetPurpose('提案')">ノード追加</a></li>  -->
                <li>
                  <button class="button4" onclick="add_Anode2('predict');">
                    解釈ノード追加
                  </button>
                </li>
                <li>
                  <button class="button4" onclick="add_Cnode('criticism');">
                    批評ノード追加
                  </button> 
                </li>     
                <li>  
                  
                  <button class="button6 other" onclick="show_other_mindmap_all()">
                    マインドマップ表示
                  </button>
                  
                
                </li>
                
                
             

              </ul>
            </div>

            <div id="mindmap_conmenu_other">
              <ul>
                
              <li>
                  ノード情報変更
              </li>
              <!--
              <li>                
                  <button class="button6" onclick="add_annotation_toNode();">
                    アノテーション付与
                  </button>
                </li>
              <li>
              <button class="button4" onclick="remove_node();">
                  ノードの削除
                </button>
              </li>

                <li>
                 onclick="move_papaer();"
                </li>
         
                 <li>
                  論文からノード追加
                </li> 
                <li>  <button class="button4" onclick="add_Anode2('konkyo');">
                    根拠ノード追加
                  </button>
                </li>
                <li>
                  他者刺激
                </li>
                <li>  <button class="button6" onclick="show_other_mindmap_all()">
                    マインドマップ表示
                  </button>
                <li>  
                </li>
              　-->
                
                <!--<li><a href="javascript:void(0);" target="_blank" onClick="SetPurpose('提案')">ノード追加</a></li> 
               <li>
                  <button class="button4" onclick="add_Anode2('answer');">
                    解釈ノード追加
                  </button>
                </li>
                <li>
                  <li>
                  <button class="button4" onclick="add_Anode2('criticism');">
                    批評ノード追加
                  </button>
                  </li>
                </li> --> 
                
                
             

              </ul>
            </div>


            <div id="mindmap_conmenu2">
                [批評の観点]
                  <ul>
                  <li>
                  
                  </li>

                      
                  <select name="change_criticism" id="s_criticism_node" class="button4">
                  <optgroup label="批評の観点（タグ）付与">
                          <option value="criticism">批評の観点追加</option>
                            <option value="evaluation">価値判断</option>
                                <optgroup label="----L評価">
                                    <option value="e_1">---L有用性</option>
                                    <option value="e_2">---L新規性</option>
                                    <option value="e_3">---L信頼性</option>
                                  </optgroup>

                            <option value="objection">意見</option>
                                  <optgroup label="----L意見">
                                  <option value="o_1">---L反論</option>
                                    <option value="o_2">---L改善策</option>
                                    <option value="o_3">---L代替案</option>
                                  </optgroup>
                            <option value="modification">問題点</option>
                                  <optgroup label="----L問題点">
                                  <option value="m_1">---L語の妥当性</option>
                                    <option value="m_2">---L証拠の十分生</option>
                                    <option value="m_3">---L論理の整合性</option>
                                  </optgroup>


                          </optgroup>
                        </select>
                      <li>
                          <button class="button4" onclick="remove_critical_area();">
                            エリア非表示
                          </button>

                        </li>
                        <!-- <li>
                        <button class="button4" onclick="remove_node();">
                        ノードの削除
                      </button>
                        </li> -->
            


                    </ul>

            </div>


          
           
          </div>

          <!-- <iframe id="document_area" src="papaer\contemporary_self.html" frameborder="0">

          </iframe> -->
          <!-- <div id="document_area" style="width: calc(60vw - 350px); display: block;"> -->

            <div id="document_conmenu">
              <ul>
                <!-- <li><a href="javascript:void(0);" target="_blank" onClick="SelecttextToNode()">選択したをマインドマップに追加する</a>
               -->
                <!-- <li>
                <button class="" onclick="add_annotation('highlight');" style="pointer-events: auto !important;">
                    論文アノテーション追加
                </button>
                </li> -->
                <li>            
                  
                  <li>
                  <button class="button6" id="question_node_b" onclick="move2node_from_anno(annotations);">
                    紐づいた考えを参照
                  </button>
                </li>
                  </li>
                </li> 
       
              
              </ul>
            </div>

            <div id="other_conmenu" >
              <ul>
                <!-- <li><a href="javascript:void(0);" target="_blank" onClick="SelecttextToNode()">選択したをマインドマップに追加する</a>
               -->
                <!-- <li>
                <button class="button6" onclick="add_annotation('highlight');" style="pointer-events: auto !important;">
                    論文アノテーション追加
                </button>
                </li> -->
                <li>
                  <button class="button_other" onclick="add_Anode_from_other('other_answer', 'other_answer')">
                    この解釈を取り入れる
                  </button>
                   
        
                </li>
              
              </ul>
            </div>

            <!-- <div id="other_question_conmenu" oncontextmenu="return false;">
              <ul> -->
                <!-- <li><a href="javascript:void(0);" target="_blank" onClick="SelecttextToNode()">選択したをマインドマップに追加する</a>
               -->
                <!-- <li>
                <button class="button6" onclick="add_annotation('highlight');" style="pointer-events: auto !important;">
                    論文アノテーション追加
                </button>
                </li> -->
                <!-- <li>
                  <button class="button_other" onclick="add_Anode_from_other('toi', 'toi')">
                    この解釈を取り入れる
                  </button>
                   
        
                </li>
              
              </ul>
            </div> -->
            

            <!--サイドメニュー　start-->
            <div id="side_menu">
            <div class="Menu">Menu</div>
             <button id="change2" class="button10" onClick="confirmAndExecute('other');">マップを比較する</button>


             <!-- <button id="change3" class="button10 other" onClick="confirmAndExecute('crit');">総評する</button> -->
            
             <div class="checkbox">
                <input type="checkbox" id="checkbox" class="checkbox" name="check" onclick="CheckClick()">
                <label for="checkbox" data-on-label="On" data-off-label="Off"></label>
                <span class="checkbox_text">【論文表示】<br><br></span>
              </div>
              <!-- マインドマップ編集のサイドメニュー -->
              <div id="mind" class="side">
               <div id = "make_micro_strat_form">
                <div id = ref_guidance></div>
                <div><input type="text" id="ref_text"></div>
                <button id = "submit_strat_button" onclick="submit_strat()">送信する</button>             
              </div>
              

              
              <button class="button6 other" style="position: center;" onclick="get_question()">
                    他者の疑問の観点
              </button>



              <div class="other_annotation other" id="othercontainer" oncontextmenu="return false;">
        
                  <div id="result">ノードを選択してください</div>
              </div>
              
              <button class="button6" id = "comment_button" style="position: center; display: none;" onclick="input_comment();">
                コメントを反映
              </button>


              

              <!-- <div class="other_annotation ref" id="othercontainer" oncontextmenu="return false;">
        
                  <div id="">ノードを選択してください</div>
              </div> -->

              
                <!-- <div class="toi_menu">問い一覧</div> -->
                <div class="toi_list other" style="display: block;">
                  <input class="button5" type="button" onclick="showGeneration();" value="all">
                  問い一覧を表示
                </div>

                <div class="inquiry_area other" style="display: block; resize: vertical">
                 

                  <div>【情報の表出化】</div>
                  <div id="testxml"></div>
                  <div id="ont"></div>

                  <div>【理由・目的】</div>
                  <div id="intention"></div>
                  
                  <div>【合理性】</div>
                  <div id="rationality"></div>
                  <!-- <div>【言い換え・具体例】</div>
                  <div id="deep"></div> -->
                </div>
              </div>
              

              <div id="crit" class="side">
              <button id="change3" class="button10 " onClick="confirmAndExecute('ref');">モード３へ移行</button>
                <div>自分の作ったマップをもとに，この論文全体について批評してみましょう
                  <div id="reftext" class="resizable-textbox" contenteditable="true"></div>
                </div>
                
              </div>
              

              

        
        </div>
        </div>
        
          <!-- </div> -->
                  <!--  tab04メニュー nishida-->
          <div id="tab04">
            <!-- < id="layout"> -->
              <div id="jsmind_nav2">
                <div class ="user">
                  選択したユーザ
                  のマップ表示
                  <select name="user_list" id="user_list" class="user_select"> 
                  <!-- ログイン中のユーザのMT時間を取得する -->
                    <?php
                      show_user();
                    ?>
                  </select>

                  <form id ="reco_peri" class="user_select" method="post" action="">
                    <input type="button" class="ShowCurrentMapButton" onClick="ShowCurrentMap();" value="自分のマップを表示">
                    <input type="button" class="HideCurrentMapButton" onClick="HideCurrentMap();" value="自分のマップを隠す">
                    <input type="button" class="ShowCurrentMapButton" onClick="show_paper();" value="論文を表示">
                    <input type="button" class="HideCurrentMapButton" onClick="hide_paper();" value="論文を隠す">
                    <input id="pastmap_btn" type="button" onclick="show_otherMap();" value="他者のマップを全画面にする" >
                  </form>
                  <label><input type="checkbox" name="Difference" id="Difference" onClick="show_annotation();">自分のアノテーション表示</label>

                  【paper】
                  <button class="zoom" onclick="zoomIn_paper();">
                      <!-- 拡大 -->
                      <i class="fas fa-search-plus"></i>
                    </button>   

                    <button class="zoom" onclick="zoomOut_paper();">
                    <!-- 縮小 -->
                    <i class="fas fa-search-minus"></i>
                    </button> 
                    
                    <button class="zoom" onclick="zoomInit_paper();">
                    <!-- 縮小 -->
                    元のサイズ
                    </button> 
                </div>
              </div>
              
              <!-- 他者のマインドマップを表示する部分 -->
              <!-- 現在のマインドマップのコピー -->
              <div id="jsmind_container3" oncontextmenu="return false;"></div>
              <!-- <div id="#paper_container"> </div> -->
              <div id="paper_area" oncontextmenu="return false;"></div>
             

            <div id = "paper_conmenu">
              <ul>
                <li>
                <button class="button6" id="b_someone" onclick="move2node_from_anno(annotations_s);">
                    紐づいた考えを参照（他者）
                  </button>
                </li>
                <li>
                <button class="button6" id="b_my" onclick="move2node_from_anno(annotations);">
                    紐づいた考えを参照（自分）
                  </button>
                </li>
              </ul>
            </div>

              <!--<div>他者のマップ</div>-->
              <div id="jsmind_container2" oncontextmenu="return false;"></div>
            

            <div id="mindmap_conmenu_someone">
                <ul>
                  <li>
                      <button class="button4" onclick="move2anno_from_node(annotations_s);">
                      紐付いた文参照
                      </button>
                      
                      
                  </li>
                </ul>
            </div>
              

                
            </div>



          </div>

          <!-- tab04ここまで -->

      </div>
        <!-- メインメニュー　Finish -->
        <script src="https://code.jquery.com/jquery-1.12.4.js" type="text/javascript"></script>
        <script type="text/javascript" src="../js/node_tag.js"></script>
        <script type="text/javascript" src="js/add_annotations.js"></script>
        <script type="text/javascript" src="js/node_change.js"></script>
        <script type="text/javascript" src="js/add_node.js"></script>
        <script type="text/javascript" src="js/mindmap.js"></script>
        <script type="text/javascript" src="js/user_sheet.js"></script>
        <script type="text/javascript" src="js/document.js"></script>
        <script type="text/javascript" src="plugins/Sortable-master/Sortable.js"></script>
        <script type="text/javascript" src="plugins/Sortable-master/Sortable.min.js"></script>
        <script type="text/javascript" src="plugins/Modaal-master/dist/js/modaal.js"></script>
        <script type="text/javascript" src="plugins/Modaal-master/dist/js/modaal.min.js"></script>
        <!-- <script src="plugins/Modaal-master/dist/css/modaal.css"></script> -->
        <script type="text/javascript" src="js/ont_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_choose_inquiry.js"></script>
        <script type="text/javascript" src="js/ont_rationality.js"></script>
        <script type="text/javascript" src="js/exe.js"></script>
        <script type="text/javascript" src="js/creat_other_question.js"></script>
        <script type="text/javascript" src="js/get_other_from_annotation.js"></script>
        <script type="text/javascript" src="js/get_question.js"></script>
        <script type="text/javascript" src="js/add_comment.js"></script>
        <script type="text/javascript" src="js/reflection.js"></script>
    </body>
</html>
