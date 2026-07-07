document.getElementById("tab04").style.visibility ="hidden";

// 文書化モードを切り替えたときの動作
function display_map(){
    // checkboxの状態を取得
    check = document.getElementById("checkbox");
    // checlboxがチェックされている時の処理
    if(check.checked == true){
      $('.select_paper').show();
      $('.select_sheet').hide();
    }
    else{
      $('.select_paper').hide();
      $('.select_sheet').show();
    }
  }