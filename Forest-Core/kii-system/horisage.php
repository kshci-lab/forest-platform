<?php
session_start();

// ログイン状態のチェック
if (!isset($_SESSION["USERID"])) {
  header("Location: ../logout.php");
  exit;
}

if(isset($_POST["sheetbtn"])){ header("Location: index.php"); }

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
        <script type="text/javascript" src="js/open_sheet.js"></script>
    </head>
    <body id="all">

        <div id="slide_menu">
            <h3>Menu</h3><br>

            <div align="center">ようこそ<?=htmlspecialchars($_SESSION["USERNAME"], ENT_QUOTES); ?>さん</div>

            <div id="map" align="center"><?php require("js/sheet.php"); echo "Sheet Name： "; getMapname(); ?></div><br>

            <center>
              <input class="button1" type="button" name="save" value="木構造作成画面に戻る" onClick="save();">
            </center><br>                 
            <h4>問い一覧</h4><br>

            <div class="hiddenQs">
 
               <!-- ▼意見　の汎化質問-->
               <div id="geneQ01" style="display:none">
               <center>【意見】</center>
                  <ol type="1">
                    <li><a href="#">信念対立に対するあなたの意見は？</a></li>
                    <li><a href="#">何が問題になっているのか？</a></li>
                    <li><a href="#">どんなことが起こっているのか？</a></li>
                    <li><a href="#">争点はなんなのか？</a></li>
                    <li><a href="#">ぶつかるポイントはどこにあるのか？</a></li>
                    <li><a href="#">具体的に何を主張したのか？</a></li>
                    <li><a href="#">どう振るまったか？</a></li>
                    <li><a href="#">どういう気分だったか？</a></li>
                    <li><a href="#">そう主張できる根拠は何か？</a></li>
                    <li><a href="#">自分（他人）の意見を認める根拠は？</a></li>
                    <li><a href="#">具体的にどういうことなのか？</a></li>
                  </ul>
               </div>
               
               <!-- ▼関心・目的　の汎化質問 -->
               <div id="geneQ02" style="display:none">
               <center>【関心・目的】</center>
                  <ol type="1">
                    <li><a href="#">何に関心があるのか？</li>
                    <li><a href="#">どういうことに興味があるのか？</li>
                    <li><a href="#">どんな観点，関心から見ているのか？</li>
                    <li><a href="#">なぜ自分（他人）が意義がある，大事であると考えているのか？</li>
                    <li><a href="#">なぜ自分（他人）がそう確信するのか？</li>
                    <li><a href="#">背後にどのような意図があるのか？</li>
                    <li><a href="#">自分（他人）の関心から考えて，他に価値が見いだされることがないか？</a></li>
                    <li><a href="#">自分（他人）の観点から見て，他にもっと重要になりそうなことはないか？</a></li>
                    <li><a href="#">関心や目的が妥当と言える根拠は何か？</a></li>
                    <li><a href="#">何を欲求しているのか？</a></li>
                    <li><a href="#">どういうことができると思うか？</a></li>
                  </ul>
               </div>

                  <!-- ▼背景　の汎化質問 -->
               <div id="geneQ03" style="display:none">
               <center>【背景】</center>
                  <ol type="1">
                    <li><a href="#">信念対立にいたるまでに何があったのか？</a></li>
                    <li><a href="#">どういう経緯で信念対立にいたったのか？</a></li>
                    <li><a href="#">信念対立はなぜ生じたと思うか？</a></li>
                    <li><a href="#">信念対立によって，どういう状況に陥ると思うか？</a></li>
                    <li><a href="#">現場が置かれている状況は？</a></li>
                    <li><a href="#">何がきっかけで，そのような関心や目的を持つようになったのだろうか？</a></li>
                    <li><a href="#">どういう過程を通じて，そのような意見を持つに至ったのか？</a></li>
                    <li><a href="#">どのようなことから影響を受けて，そのような関心や意見を持つようになったのだろうか？</a></li>
                    <li><a href="#">どういうきっかけがあったから，そういう関心や意見を当たり前だと思うようになったのか？</a></li>
                    <li><a href="#">背景が変われば，どうなると思うか？</a></li>
                    <li><a href="#">自分（他人）の状況や事実の認識が妥当と言える根拠は何か？</a></li>
                  </ul>
               </div>

                  <!-- ▼共通する状況　の汎化質問 -->
               <div id="geneQ04" style="display:none">
               <center>【共通する状況】</center>
                  <ol type="1">
                    <li><a href="#">共通する状況認識はありますか？</a></li>
                    <li><a href="#">共通する状況認識の内容は適切ですか？</a></li>
                    <li><a href="#">共通する状況認識の中には，どのような資源や制約がありますか？</a></li>
                    <li><a href="#">どのような状況認識が，より妥当ですか？</a></li>
                    <li><a href="#">状況認識が異なる場合，各々にどのような資源や制約がありますか？</a></li>
                    <li><a href="#">状況認識が異なる場合，同意できる事柄はありますか？</a></li>
                    <li><a href="#">状況認識が異なる場合，より理に適った状況認識はありますか？</a></li>
                    <li><a href="#">状況認識が異なる場合，どうすれば共有できますか？</a></li>
                  </ul>
               </div>

                  <!-- ▼共通する目標　の汎化質問 -->
               <div id="geneQ05" style="display:none">
               <center>【共通する目標】</center>
                  <ol type="1">
                    <li><a href="#">お互いに納得できる目標はありますか？</a></li>
                    <li><a href="#">目標は適切ですか？</a></li>
                    <li><a href="#">目標には，どのような意義がありますか？</a></li>
                    <li><a href="#">目標の達成は，どのような利害をもたらしますか？</a></li>
                    <li><a href="#">より満足できる目標はありますか？</a></li>
                    <li><a href="#">お互いの目標が異なる場合，どのような目標を設定すれば共有できそうですか？</a></li>
                    <li><a href="#">複数の目標がある場合，優先順位はどうなっていますか？</a></li>
                    <li><a href="#">相反する目標がある場合，各々にどのような利害がありますか？</a></li>
                  </ul>
               </div>

                  <!-- ▼アクションプラン　の汎化質問 -->
               <div id="geneQ06" style="display:none">
               <center>【アクションプラン】</center>
                  <ol type="1">
                    <li><a href="#">目標はいつまでに達成しますか？</a></li>
                    <li><a href="#">誰が目標達成のキーパーソンですか？</a></li>
                    <li><a href="#">目標達成のために，何をどう行う必要がありますか？</a></li>
                    <li><a href="#">目標をやり遂げるうえで，他にもっとよい方法はありますか？</a></li>
                    <li><a href="#">１つの目標を達成するために，複数の方法を用意できていますか？</a></li>
                    <li><a href="#">よりよい方法を考案するための情報源はありますか？</a></li>
                    <li><a href="#">目標達成のために，利用できる資源はありますか？その資源はどう 活用しますか？</a></li>
                    <li><a href="#">目標達成の阻害要因はありますか？その阻害要因にはどう対処しますか？</a></li>
                    <li><a href="#">背反する目標がある場合，どういう方法であれば両立できそうですか？</a></li>
                    <li><a href="#">状況と目標の見直しは，どういうタイミングで行いますか？</a></li>
                    <li><a href="#">人々の背後には，どのような利害がありますか？</a></li>
                    <li><a href="#">どのような方法であれば，お互いに利益が得られますか？</a></li>
                    <li><a href="#">人々に状況と目標の自覚をどう促しますか？</a></li>
                    <li><a href="#">人々の状況と目的の共有をどう促しますか？</a></li>
                    <li><a href="#">人々が状況と目標を踏まえたうえで方法を考えられるようにするために，どう振る舞っていきますか？</a></li>
                    <li><a href="#">異論，反論などにはどう対処しますか？</a></li>
                    <li><a href="#">不平，不満などのクレームにはどう対処しますか？</a></li>
                    <li><a href="#">恫喝，妨害などにはどう対処しますか？</a></li>
                    <li><a href="#">主張が強すぎる場合は，どう対処しますか？</a></li>
                    <li><a href="#">主張が弱すぎる場合は，どう対処しますか？</a></li>
                    <li><a href="#">不透明な状態になった場合は，どう対処しますか？</a></li>
                    <li><a href="#">想定外の出来事が起こった場合，どう対処しますか？</a></li>
                    <li><a href="#">目標達成が難しい場合は，どう対処しますか？</a></li>
                    <li><a href="#">目標が達成できない場合は，どう対処しますか？</a></li>
                    <li><a href="#">目標が達成できない場合の最大リスクは何ですか？</a></li>
                  </ul>
               </div>

            </div>

        </div>
       
        <div id="jsmind_container" style="width:90%; height:30%"></div>

    <div class="BCGQ" align="center">
    <table border="3">

        <tr>

            <td>掘り下げるノード</td>
            <td colspan="2" align="center"><?=htmlspecialchars($_SESSION["NODE_CONTENT"], ENT_QUOTES); ?></td>


        </tr>
        
      <!-- 場面 -->
      <tr>

        <td>場面<br>(前提条件)</td>
        <td colspan="2">
          <textarea rows="7" cols="87" id="area00" name="area00" value=""></textarea>
        </td>
      </tr>

      <!-- 信念対立 -->
      <tr>
        <td>信念対立<br>(掘り下げる対象)</td>
        <td colspan="2">
          <textarea rows="7" cols="87" id="area10" name="area10" value=""></textarea>
        </td>
      </tr>

      <!-- 意見 -->
      <tr>
        <td>意見<br>(わかっていること<br>・考えていること)</td>
        <td>
          <textarea rows="2" cols="41" id="area20Q" name="area20Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="41" id="area20A" name="area20A" value="" onclick="deleteGene(name);"></textarea>
        </td>
        <td>
          <textarea rows="2" cols="41" id="area21Q" name="area21Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="41" id="area21A" name="area21A" value="" onclick="deleteGene(name);"></textarea>
        </td>
      </tr>

      <!-- 関心・目的 -->
      <tr>
        <td>関心・目的<br>(わかっていること<br>の土台となる考え)</td>
        <td>
          <textarea rows="2" cols="41" id="area30Q" name="area30Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="41" id="area30A" name="area30A" value="" onclick="deleteGene(name);"></textarea>
        </td>
        <td>
          <textarea rows="2" cols="41" id="area31Q" name="area31Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="41" id="area31A" name="area31A" value="" onclick="deleteGene(name);"></textarea>
        </td>
      </tr>

      <!-- 背景 -->
      <tr>
        <td>背景<br>(意見に至るまでの<br>　プロセス)</td>
        <td>
          <textarea rows="2" cols="41" id="area40Q" name="area40Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="41" id="area40A" name="area40A" value="" onclick="deleteGene(name);"></textarea>
        </td>
        <td>
          <textarea rows="2" cols="41" id="area41Q" name="area41Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="41" id="area41A" name="area41A" value="" onclick="deleteGene(name);"></textarea>
        </td>
      </tr>

      <!-- 共通する状況 -->
      <tr>
        <td>共通する状況<br>(共通の土台・<br>　プロセス)</td>
        <td colspan="2">
          <textarea rows="2" cols="87" id="area50Q" name="area50Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="87" id="area50A" name="area50A" value="" onclick="deleteGene(name);"></textarea>
        </td>
      </tr>

      <!-- 共通する目標 -->
      <tr>
        <td>共通する目標</td>
        <td colspan="2">
          <textarea rows="2" cols="87" id="area60Q" name="area60Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="87" id="area60A" name="area60A" value="" onclick="deleteGene(name);"></textarea>
        </td>
      </tr>

      <!-- アクションプラン -->
      <tr>
        <td>アクションプラン<br>(次にすべきこと)</td>
        <td colspan="2">
          <textarea rows="2" cols="87" id="area70Q" name="area70Q" value="" onclick="showGene(name);"></textarea><br>
          <textarea rows="5" cols="87" id="area70A" name="area70A" value="" onclick="deleteGene(name);"></textarea>
        </td>
      </tr>

    </table>
    
    <input type="button" name="save" value="保存" onClick="save();">

    </div>
        <script type="text/javascript" src="js/mindmap.js"></script>
        <script type="text/javascript" src="js/new_sheet_content.js"></script>
    </body>
</html>
