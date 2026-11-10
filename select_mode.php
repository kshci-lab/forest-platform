<?php

session_start();
require("php/connect_db.php");

$mt_time_message = "";

// ログイン状態のチェック
if (!isset($_SESSION["USERID"])) {
  echo 2;
  header("Location: logout.php");
  exit;
}

if (isset($_POST["logout"])) {
  header("Location: logout.php");
  exit;
}

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
	<head>
		<meta charset="UTF-8">
		<title>自己内対話活性化支援システム</title>
		<link rel="stylesheet" type="text/css" href="css/item.css">
		<link rel="stylesheet" type="text/css" href="css/font.css">
		<link rel="stylesheet" type="text/css" href="css/jquery.cleditor.css">
		<link rel="stylesheet" type="text/css" href="css/ui.css">
		<link rel="stylesheet" type="text/css" href="css/select_sheet.css">
    <link rel="stylesheet" href="css/Semantic-UI/semantic.css">
		<script type="text/javascript" src="js/jquery-1.8.2.min.js"></script>
		<script type="text/javascript" src="js/jquery-ui.min.js"></script>
	</head>

	<body id="all">

		<!--サイドメニュー　start-->
    <div id="side_menu">
        <h3>Menu</h3>
        <p>
        <div align="center">
          ようこそ<?=htmlspecialchars($_SESSION["USERNAME"], ENT_QUOTES); ?>さん
        </div>
        </p>
        <form name="return" method="POST" align="center">
            <input class="button3" type="submit" name="logout" value="ログアウト">
        </form>
        <div align="center" style="margin-top: 20px;">
            <button type="button" id="btnGoDashboard" style="background-color: #2563eb; color: #ffffff; border: none; padding: 10px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 85%; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                <span>📊</span> ダッシュボードへ
            </button>
        </div>
    </div>
    <!--サイドメニュー　finish-->

    <!-- メインメニュー　start -->
    <div id="main_menu">
    <h3>思考表出マップ</h3>
       <div class="select_sheet2">
          <form method="POST">
  		        <div align="center">
  			          <strong>思考表出マップ リスト</strong>
  		        </div>
		          <div class="scr" align="left">
                <form name="form1">
                  <input type="radio" name="selectmode" value=1 checked>目標管理モード<br>
                  <input type="radio" name="selectmode" value=2>論文読解モード<br>
                  <input type="radio" name="selectmode" value=3>論文添削モード<br>
                  <input type="radio" name="selectmode" value=3>自己内対話モード<br>
                </form>
              </div>
    		      <div align="center">
        			  <input type="button" id="selectmodebutton" value="選択する">
              </div>
  	      </form>
        </div>
    </div>
    <!-- メインメニュー　finish -->

    <!-- ダッシュボード パスワード認証モーダル -->
    <div id="dashboardPwdModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.5); backdrop-filter:blur(2px); z-index:9999; justify-content:center; align-items:center;">
      <div style="background:#ffffff; border-radius:12px; padding:28px; width:360px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border:1px solid #e2e8f0; text-align:center;">
        <div style="width:44px; height:44px; background:#eff6ff; color:#2563eb; border-radius:10px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:20px;">🔒</div>
        <h3 style="margin:0 0 6px; font-size:17px; font-weight:700; color:#0f172a;">研究データダッシュボード</h3>
        <p style="font-size:13px; color:#64748b; margin:0 0 20px; line-height:1.4;">アクセスするにはパスワードを入力してください</p>
        <form id="dashboardPwdForm" method="POST" action="kagitani-system/admin_dashboard.php">
          <div style="margin-bottom:12px;">
            <input type="password" id="inputDashboardPwd" name="dashboard_password" placeholder="パスワードを入力" style="width:100%; padding:10px 12px; box-sizing:border-box; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; outline:none; text-align:center; letter-spacing:2px;" required autofocus>
          </div>
          <div id="dashboardPwdError" style="color:#dc2626; font-size:12px; margin-bottom:12px; display:none; background:#fef2f2; padding:6px 10px; border-radius:6px; border:1px solid #fecaca;">パスワードが正しくありません</div>
          <div style="display:flex; gap:10px; justify-content:center;">
            <button type="button" id="btnCancelDashboardPwd" style="flex:1; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:9px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">キャンセル</button>
            <button type="submit" style="flex:1; background:#2563eb; color:#ffffff; border:none; padding:9px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">認証して進む</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      (function(){
        var btn = document.getElementById('btnGoDashboard');
        var modal = document.getElementById('dashboardPwdModal');
        var cancelBtn = document.getElementById('btnCancelDashboardPwd');
        var form = document.getElementById('dashboardPwdForm');
        var input = document.getElementById('inputDashboardPwd');
        var error = document.getElementById('dashboardPwdError');

        if (btn && modal) {
          btn.addEventListener('click', function() {
            modal.style.display = 'flex';
            error.style.display = 'none';
            input.value = '';
            setTimeout(function(){ input.focus(); }, 100);
          });
        }

        if (cancelBtn && modal) {
          cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
          });
        }

        if (modal) {
          modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.style.display = 'none';
          });
        }

        if (form) {
          form.addEventListener('submit', function(e) {
            if (input.value.trim() !== 'kagitani') {
              e.preventDefault();
              error.style.display = 'block';
              input.select();
            }
          });
        }
      })();
    </script>
	</body>
  <script type="text/javascript" src="js/select_mode.js"></script>
</html>


